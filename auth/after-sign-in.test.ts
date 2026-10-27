import { describe, expect, it } from "vitest";
import type { DeviceAccount } from "@/local/device-db";
import {
  decideAfterSignIn,
  isPendingSignInValid,
  PENDING_SIGN_IN_TTL_MS,
  type PendingSignIn,
} from "./after-sign-in";
import type { BootstrapResponse } from "./bootstrap";

const owner: DeviceAccount = {
  profileId: "profile-owner",
  clerkUserId: "user_owner",
  email: "owner+clerk_test@example.com",
  businessId: "biz-owner",
  pinHash: "hash",
  pinSalt: "salt",
  failedAttempts: 0,
  lockedUntil: null,
  lastUnlockedAt: null,
};

const boot = (fields: Partial<BootstrapResponse> = {}): BootstrapResponse => ({
  profileId: owner.profileId,
  businessId: owner.businessId,
  clerkUserId: owner.clerkUserId,
  email: owner.email,
  hasData: false,
  ...fields,
});

describe("decideAfterSignIn (decision table, first matching row wins)", () => {
  it("reset with a different Clerk user → reset_mismatch", () => {
    expect(
      decideAfterSignIn({
        mode: "reset",
        boot: boot({ clerkUserId: "user_other" }),
        existing: owner,
      }),
    ).toEqual({ kind: "reset_mismatch" });
  });

  it("reset with a different profile → reset_mismatch", () => {
    expect(
      decideAfterSignIn({
        mode: "reset",
        boot: boot({ profileId: "profile-other" }),
        existing: owner,
      }),
    ).toEqual({ kind: "reset_mismatch" });
  });

  it("first sign-in by someone else on an owned phone → refuse_other_owner (D-039)", () => {
    expect(
      decideAfterSignIn({
        mode: "first",
        boot: boot({
          clerkUserId: "user_other",
          profileId: "profile-other",
        }),
        existing: owner,
      }),
    ).toEqual({ kind: "refuse_other_owner", ownerEmail: owner.email });
  });

  it("first sign-in by the phone's own owner → go_lock, never a new PIN (C1)", () => {
    expect(
      decideAfterSignIn({ mode: "first", boot: boot(), existing: owner }),
    ).toEqual({ kind: "go_lock" });
  });

  it("reset by the same Clerk user and profile → set_pin", () => {
    expect(
      decideAfterSignIn({ mode: "reset", boot: boot(), existing: owner }),
    ).toEqual({ kind: "set_pin" });
  });

  it("no account and backed-up data → restore_then_set_pin", () => {
    for (const mode of ["first", "reset"] as const) {
      expect(
        decideAfterSignIn({
          mode,
          boot: boot({ hasData: true }),
          existing: undefined,
        }),
      ).toEqual({ kind: "restore_then_set_pin" });
    }
  });

  it("no account and no data → set_pin", () => {
    expect(
      decideAfterSignIn({ mode: "first", boot: boot(), existing: undefined }),
    ).toEqual({ kind: "set_pin" });
  });
});

describe("isPendingSignInValid", () => {
  const now = 1_800_000_000_000;
  const pending = (fields: Partial<PendingSignIn> = {}): PendingSignIn => ({
    ...boot(),
    mode: "first",
    createdAt: now - 60_000,
    ...fields,
  });

  it("is true when fresh and for the Clerk user signed in now", () => {
    expect(
      isPendingSignInValid(pending(), {
        now,
        clerkUserId: owner.clerkUserId,
        existing: undefined,
      }),
    ).toBe(true);
  });

  it("is false when missing or older than the TTL", () => {
    const ctx = { now, clerkUserId: owner.clerkUserId, existing: undefined };
    expect(isPendingSignInValid(undefined, ctx)).toBe(false);
    expect(
      isPendingSignInValid(
        pending({ createdAt: now - PENDING_SIGN_IN_TTL_MS - 1 }),
        ctx,
      ),
    ).toBe(false);
  });

  it("is false for a different Clerk user, or none", () => {
    expect(
      isPendingSignInValid(pending(), {
        now,
        clerkUserId: "user_other",
        existing: undefined,
      }),
    ).toBe(false);
    expect(
      isPendingSignInValid(pending(), {
        now,
        clerkUserId: null,
        existing: undefined,
      }),
    ).toBe(false);
  });

  it("is false in first mode while an account exists (C1)", () => {
    expect(
      isPendingSignInValid(pending({ mode: "first" }), {
        now,
        clerkUserId: owner.clerkUserId,
        existing: owner,
      }),
    ).toBe(false);
  });

  it("is true only for a reset of the same account", () => {
    const ctx = { now, clerkUserId: owner.clerkUserId, existing: owner };
    expect(isPendingSignInValid(pending({ mode: "reset" }), ctx)).toBe(true);
    expect(
      isPendingSignInValid(
        pending({ mode: "reset", profileId: "profile-other" }),
        ctx,
      ),
    ).toBe(false);
  });
});
