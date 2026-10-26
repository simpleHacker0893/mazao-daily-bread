import { beforeEach, describe, expect, it, vi } from "vitest";
import { type DeviceAccount, deviceDb } from "@/local/device-db";
import { PENDING_SIGN_IN_KEY } from "./after-sign-in";
import type { BootstrapResponse } from "./bootstrap";
import {
  acceptPrivacy,
  completeSignIn,
  PRIVACY_ACCEPTED_KEY,
  PRIVACY_VERSION,
} from "./sign-in-flow";

const owner: DeviceAccount = {
  profileId: "profile-owner",
  clerkUserId: "user_owner",
  email: "owner+clerk_test@example.com",
  businessId: "biz-owner",
  pinHash: "hash",
  pinSalt: "salt",
  failedAttempts: 2,
  lockedUntil: 123,
  lastUnlockedAt: 456,
};

const boot = (fields: Partial<BootstrapResponse> = {}): BootstrapResponse => ({
  profileId: owner.profileId,
  businessId: owner.businessId,
  clerkUserId: owner.clerkUserId,
  email: owner.email,
  hasData: false,
  ...fields,
});

const now = 1_800_000_000_000;

function deps() {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      signOut: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 5));
        calls.push("signOut");
      }),
      restore: vi.fn(async () => {
        calls.push("restore");
      }),
      now: () => now,
    },
  };
}

async function snapshot() {
  return {
    accounts: await deviceDb.accounts.toArray(),
    meta: await deviceDb.meta.toArray(),
  };
}

beforeEach(async () => {
  await deviceDb.accounts.clear();
  await deviceDb.meta.clear();
});

describe("completeSignIn", () => {
  it("refuses another owner: awaits signOut and writes nothing (M1)", async () => {
    await deviceDb.accounts.put(owner);
    const before = await snapshot();
    const { deps: d, calls } = deps();

    const result = await completeSignIn(
      {
        mode: "first",
        boot: boot({ clerkUserId: "user_other", profileId: "p-other" }),
      },
      d,
    );
    expect(result).toEqual({ kind: "refused", ownerEmail: owner.email });
    expect(calls).toEqual(["signOut"]);
    expect(await snapshot()).toEqual(before);
  });

  it("reset by a different account: awaits signOut and writes nothing (M1)", async () => {
    await deviceDb.accounts.put(owner);
    const before = await snapshot();
    const { deps: d, calls } = deps();

    const result = await completeSignIn(
      { mode: "reset", boot: boot({ clerkUserId: "user_other" }) },
      d,
    );
    expect(result).toEqual({ kind: "reset_mismatch" });
    expect(calls).toEqual(["signOut"]);
    expect(await snapshot()).toEqual(before);
  });

  it("the owner signing in again goes to /lock and leaves the PIN and lockout alone (C1)", async () => {
    await deviceDb.accounts.put(owner);
    const before = await snapshot();
    const { deps: d, calls } = deps();

    const result = await completeSignIn({ mode: "first", boot: boot() }, d);
    expect(result).toEqual({ kind: "navigate", to: "/lock" });
    expect(calls).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });

  it("a new phone with backed-up data restores, then writes the pending sign-in", async () => {
    const { deps: d, calls } = deps();
    const result = await completeSignIn(
      { mode: "first", boot: boot({ hasData: true }) },
      d,
    );
    expect(result).toEqual({ kind: "navigate", to: "/set-pin" });
    expect(calls).toEqual(["restore"]);
    expect(d.restore).toHaveBeenCalledWith(owner.businessId);
    expect((await deviceDb.meta.get(PENDING_SIGN_IN_KEY))?.value).toEqual({
      ...boot({ hasData: true }),
      mode: "first",
      createdAt: now,
    });
  });

  it("a new phone with no data skips restore", async () => {
    const { deps: d, calls } = deps();
    await completeSignIn({ mode: "first", boot: boot() }, d);
    expect(calls).toEqual([]);
    expect(await deviceDb.meta.get(PENDING_SIGN_IN_KEY)).toBeDefined();
  });

  it("a failed restore writes no pending sign-in", async () => {
    const { deps: d } = deps();
    d.restore.mockRejectedValueOnce(new Error("offline"));
    await expect(
      completeSignIn({ mode: "first", boot: boot({ hasData: true }) }, d),
    ).rejects.toThrow("offline");
    expect(await deviceDb.meta.get(PENDING_SIGN_IN_KEY)).toBeUndefined();
  });
});

describe("acceptPrivacy", () => {
  it("records the notice version and an ISO time", async () => {
    await acceptPrivacy(new Date("2026-10-26T07:00:00.000Z"));
    expect((await deviceDb.meta.get(PRIVACY_ACCEPTED_KEY))?.value).toEqual({
      version: PRIVACY_VERSION,
      acceptedAt: "2026-10-26T07:00:00.000Z",
    });
  });
});
