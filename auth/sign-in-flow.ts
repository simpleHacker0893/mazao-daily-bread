// The side effects after a Clerk sign-in, apart from the screen so they can be tested without
// Clerk. Refusals sign out of Clerk first and write nothing (M1); the owner's own account goes to
// /lock untouched (C1); a new phone restores before the pending sign-in is written.
import { deviceDb } from "@/local/device-db";
import {
  decideAfterSignIn,
  PENDING_SIGN_IN_KEY,
  type PendingSignIn,
  type SignInMode,
} from "./after-sign-in";
import type { BootstrapResponse } from "./bootstrap";

export type SignInDeps = {
  /** Clerk's signOut; awaited before anything else happens on a refusal. */
  signOut: () => Promise<void>;
  /** Pulls the business's records onto this phone (sync/restore.ts). */
  restore: (businessId: string) => Promise<void>;
  now: () => number;
};

export type SignInResult =
  | { kind: "refused"; ownerEmail: string }
  | { kind: "reset_mismatch" }
  | { kind: "navigate"; to: "/lock" | "/set-pin" };

export async function completeSignIn(
  input: { mode: SignInMode; boot: BootstrapResponse },
  deps: SignInDeps,
): Promise<SignInResult> {
  const existing = (await deviceDb.accounts.toArray())[0];
  const decision = decideAfterSignIn({ ...input, existing });

  switch (decision.kind) {
    case "refuse_other_owner":
      await deps.signOut();
      return { kind: "refused", ownerEmail: decision.ownerEmail };
    case "reset_mismatch":
      await deps.signOut();
      return { kind: "reset_mismatch" };
    case "go_lock":
      return { kind: "navigate", to: "/lock" };
    case "restore_then_set_pin":
    case "set_pin": {
      // Restore runs only when no account exists on this phone, so it can never overwrite a
      // phone's unsynced records. The pending entry is written after it, so a slow restore
      // cannot use up the TTL.
      if (decision.kind === "restore_then_set_pin") {
        await deps.restore(input.boot.businessId);
      }
      const pending: PendingSignIn = {
        ...input.boot,
        mode: input.mode,
        createdAt: deps.now(),
      };
      await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
      return { kind: "navigate", to: "/set-pin" };
    }
  }
}

/** Bumped when the privacy notice changes, so acceptance is asked again. */
export const PRIVACY_VERSION = "2026-10-26";
export const PRIVACY_ACCEPTED_KEY = "privacyAccepted";

/** Records that the merchant ticked "I agree" (spec ASSUMPTION; Q-014). */
export async function acceptPrivacy(now: Date): Promise<void> {
  await deviceDb.meta.put({
    key: PRIVACY_ACCEPTED_KEY,
    value: { version: PRIVACY_VERSION, acceptedAt: now.toISOString() },
  });
}
