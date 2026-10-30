import { type DeviceAccount, deviceDb } from "@/local/device-db";
import {
  isPendingSignInValid,
  PENDING_SIGN_IN_KEY,
  type PendingSignIn,
} from "./after-sign-in";
import { hashPin, isWeakPin, lockoutUntil, verifyPin } from "./pin";
import type { Session } from "./session";

export type PinFlowErrorCode =
  | "invalid_pin"
  | "weak_pin"
  | "mismatch"
  | "setup_not_allowed"
  | "account_changed"
  | "locked"
  | "incorrect_pin"
  | "storage_unavailable";

export class PinFlowError extends Error {
  constructor(readonly code: PinFlowErrorCode) {
    super(code);
    this.name = "PinFlowError";
  }
}

export type SetupPinInput = {
  pin: string;
  confirmation: string;
  clerkUserId: string | null;
  now?: number;
};

export type UnlockResult = {
  session: NonNullable<Session>;
  lockedUntil: number | null;
};

export type PinSetupState = {
  pending: PendingSignIn | null;
  hasAccount: boolean;
};

/** Reads and validates setup authorization, consuming a stale/invalid hand-off. */
export async function getPinSetupState(
  clerkUserId: string | null,
  now = Date.now(),
): Promise<PinSetupState> {
  try {
    return await deviceDb.transaction(
      "rw",
      deviceDb.accounts,
      deviceDb.meta,
      async () => {
        const [entry, accounts] = await Promise.all([
          deviceDb.meta.get(PENDING_SIGN_IN_KEY),
          deviceDb.accounts.toArray(),
        ]);
        if (accounts.length > 1) throw new PinFlowError("account_changed");
        const account = accounts[0];
        const pending = readPending(entry?.value);
        const valid =
          !!pending &&
          isPendingSignInValid(pending, {
            now,
            clerkUserId,
            existing: account,
          });
        if (!valid && entry) await deviceDb.meta.delete(PENDING_SIGN_IN_KEY);
        return { pending: valid ? pending : null, hasAccount: !!account };
      },
    );
  } catch (error) {
    if (error instanceof PinFlowError) throw error;
    throw new PinFlowError("storage_unavailable");
  }
}

/** Sets up or resets this phone's PIN only for a fresh Clerk sign-in hand-off. */
export async function setupPin(
  input: SetupPinInput,
): Promise<NonNullable<Session>> {
  if (!/^\d{4}$/.test(input.pin)) throw new PinFlowError("invalid_pin");
  if (input.pin !== input.confirmation) throw new PinFlowError("mismatch");
  if (isWeakPin(input.pin)) throw new PinFlowError("weak_pin");
  if (!input.clerkUserId) throw new PinFlowError("setup_not_allowed");

  const useSystemClock = input.now === undefined;
  const now = input.now ?? Date.now();
  try {
    const [pendingEntry, existing] = await Promise.all([
      deviceDb.meta.get(PENDING_SIGN_IN_KEY),
      deviceDb.accounts.toArray(),
    ]);
    const pending = readPending(pendingEntry?.value);
    const current = existing[0];
    if (
      existing.length > 1 ||
      !pending ||
      !isPendingSignInValid(pending, {
        now,
        clerkUserId: input.clerkUserId,
        existing: current,
      })
    ) {
      throw new PinFlowError("setup_not_allowed");
    }

    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const derivedHash = await hashPin(input.pin, salt);
    const account: DeviceAccount = {
      profileId: pending.profileId,
      clerkUserId: pending.clerkUserId,
      email: pending.email,
      businessId: pending.businessId,
      pinHash: toBase64(derivedHash),
      pinSalt: toBase64(salt),
      failedAttempts: 0,
      lockedUntil: null,
      lastUnlockedAt: null,
    };

    await deviceDb.transaction(
      "rw",
      deviceDb.accounts,
      deviceDb.meta,
      async () => {
        const latestEntry = await deviceDb.meta.get(PENDING_SIGN_IN_KEY);
        const latestPending = readPending(latestEntry?.value);
        const latestAccounts = await deviceDb.accounts.toArray();
        const latest = latestAccounts[0];
        if (
          latestAccounts.length > 1 ||
          !latestPending ||
          !samePending(latestPending, pending) ||
          !isPendingSignInValid(latestPending, {
            now: useSystemClock ? Date.now() : now,
            clerkUserId: input.clerkUserId,
            existing: latest,
          })
        ) {
          throw new PinFlowError("account_changed");
        }

        await deviceDb.accounts.put(account);
        await deviceDb.meta.delete(PENDING_SIGN_IN_KEY);
      },
    );

    return sessionFrom(account);
  } catch (error) {
    if (error instanceof PinFlowError) throw error;
    throw new PinFlowError("storage_unavailable");
  }
}

/** Removes stale setup hand-offs when the device is locked. */
export async function clearPendingSignIn(): Promise<void> {
  await deviceDb.meta.delete(PENDING_SIGN_IN_KEY);
}

/** Verifies locally and atomically persists either lockout progress or an unlock. */
export async function unlockWithPin(
  pin: string,
  profileId: string,
  now = Date.now(),
): Promise<UnlockResult> {
  if (!/^\d{4}$/.test(pin)) throw new PinFlowError("invalid_pin");
  try {
    const original = await deviceDb.accounts.get(profileId);
    if (!original || !/^\d+$/.test(pin))
      throw new PinFlowError("account_changed");
    if (original.lockedUntil !== null && original.lockedUntil > now) {
      throw new PinFlowError("locked");
    }

    let valid = false;
    try {
      valid = await verifyPin(
        pin,
        fromBase64(original.pinSalt),
        fromBase64(original.pinHash),
      );
    } catch {
      throw new PinFlowError("storage_unavailable");
    }

    const result = await deviceDb.transaction(
      "rw",
      deviceDb.accounts,
      async () => {
        const current = await deviceDb.accounts.get(profileId);
        if (
          !current ||
          current.clerkUserId !== original.clerkUserId ||
          current.pinHash !== original.pinHash ||
          current.pinSalt !== original.pinSalt
        ) {
          throw new PinFlowError("account_changed");
        }
        if (current.lockedUntil !== null && current.lockedUntil > now) {
          throw new PinFlowError("locked");
        }

        if (!valid) {
          const failedAttempts = current.failedAttempts + 1;
          const lockedUntil = lockoutUntil(failedAttempts, now);
          await deviceDb.accounts.update(profileId, {
            failedAttempts,
            lockedUntil,
          });
          return { incorrect: true as const, lockedUntil };
        }

        await deviceDb.accounts.update(profileId, {
          failedAttempts: 0,
          lockedUntil: null,
          lastUnlockedAt: now,
        });
        return {
          incorrect: false as const,
          session: sessionFrom(current),
          lockedUntil: null,
        };
      },
    );
    if (result.incorrect) throw new PinFlowError("incorrect_pin");
    return { session: result.session, lockedUntil: result.lockedUntil };
  } catch (error) {
    if (error instanceof PinFlowError) throw error;
    throw new PinFlowError("storage_unavailable");
  }
}

export async function getDeviceAccount(): Promise<DeviceAccount | undefined> {
  try {
    const accounts = await deviceDb.accounts.toArray();
    if (accounts.length > 1) throw new PinFlowError("account_changed");
    return accounts[0];
  } catch (error) {
    if (error instanceof PinFlowError) throw error;
    throw new PinFlowError("storage_unavailable");
  }
}

function readPending(value: unknown): PendingSignIn | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<PendingSignIn>;
  if (
    typeof candidate.profileId !== "string" ||
    !candidate.profileId ||
    typeof candidate.businessId !== "string" ||
    !candidate.businessId ||
    typeof candidate.clerkUserId !== "string" ||
    !candidate.clerkUserId ||
    typeof candidate.email !== "string" ||
    !candidate.email ||
    typeof candidate.hasData !== "boolean" ||
    (candidate.mode !== "first" && candidate.mode !== "reset") ||
    !Number.isSafeInteger(candidate.createdAt)
  ) {
    return undefined;
  }
  return candidate as PendingSignIn;
}

function samePending(left: PendingSignIn, right: PendingSignIn): boolean {
  return (
    left.profileId === right.profileId &&
    left.businessId === right.businessId &&
    left.clerkUserId === right.clerkUserId &&
    left.email === right.email &&
    left.hasData === right.hasData &&
    left.mode === right.mode &&
    left.createdAt === right.createdAt
  );
}

function sessionFrom(account: DeviceAccount): NonNullable<Session> {
  return {
    profileId: account.profileId,
    businessId: account.businessId,
    clerkUserId: account.clerkUserId,
    email: account.email,
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
