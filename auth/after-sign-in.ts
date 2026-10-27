// What happens after a Clerk sign-in on this phone (Phase 1 plan, Task 3). Pure and tested: it
// holds the account-takeover guard (C1). One merchant account per phone (D-039); a forgotten PIN
// is reset only by a fresh email-code sign-in of the same account.
import type { DeviceAccount } from "@/local/device-db";
import type { BootstrapResponse } from "./bootstrap";

export type SignInMode = "first" | "reset";

export type AfterSignIn =
  /** Someone else's account lives on this phone (D-039). The page signs out of Clerk. */
  | { kind: "refuse_other_owner"; ownerEmail: string }
  /** Forgot PIN signed in a different account. The page signs out of Clerk. */
  | { kind: "reset_mismatch" }
  /** This Clerk user's account is already on the phone: PIN untouched, no restore. */
  | { kind: "go_lock" }
  | { kind: "restore_then_set_pin" }
  | { kind: "set_pin" };

/** First matching row wins (plan decision table). */
export function decideAfterSignIn(input: {
  mode: SignInMode;
  boot: BootstrapResponse;
  existing: DeviceAccount | undefined;
}): AfterSignIn {
  const { mode, boot, existing } = input;
  if (existing) {
    const sameUser = boot.clerkUserId === existing.clerkUserId;
    const sameProfile = boot.profileId === existing.profileId;
    if (mode === "reset") {
      return sameUser && sameProfile
        ? { kind: "set_pin" }
        : { kind: "reset_mismatch" };
    }
    return sameUser
      ? { kind: "go_lock" }
      : { kind: "refuse_other_owner", ownerEmail: existing.email };
  }
  return boot.hasData ? { kind: "restore_then_set_pin" } : { kind: "set_pin" };
}

/** Written after bootstrap (and restore), consumed by /set-pin. Epoch ms. */
export type PendingSignIn = BootstrapResponse & {
  mode: SignInMode;
  createdAt: number;
};

export const PENDING_SIGN_IN_KEY = "pendingSignIn";

/** ASSUMPTION (Arch): 10 minutes from sign-in to choosing a PIN. */
export const PENDING_SIGN_IN_TTL_MS = 10 * 60 * 1000;

/**
 * True only for a fresh entry belonging to the Clerk user signed in now; when an account already
 * exists, only for a reset of that same account (C1).
 */
export function isPendingSignInValid(
  pending: PendingSignIn | undefined,
  ctx: {
    now: number;
    clerkUserId: string | null;
    existing: DeviceAccount | undefined;
  },
): boolean {
  if (!pending) return false;
  if (ctx.now - pending.createdAt > PENDING_SIGN_IN_TTL_MS) return false;
  if (!ctx.clerkUserId || pending.clerkUserId !== ctx.clerkUserId) return false;
  if (ctx.existing) {
    return (
      pending.mode === "reset" &&
      pending.profileId === ctx.existing.profileId &&
      pending.clerkUserId === ctx.existing.clerkUserId
    );
  }
  return true;
}
