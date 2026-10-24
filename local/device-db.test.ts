import { afterEach, describe, expect, it } from "vitest";
import { type DeviceAccount, deviceDb } from "@/local/device-db";

afterEach(async () => {
  await deviceDb.delete({ disableAutoOpen: false });
});

describe("device database", () => {
  it("is named mazao-device", () => {
    expect(deviceDb.name).toBe("mazao-device");
  });

  it("round-trips an accounts row keyed by profileId", async () => {
    const account: DeviceAccount = {
      profileId: "profile-1",
      clerkUserId: "user_1",
      email: "wanjiru@example.com",
      businessId: "business-1",
      pinHash: "hash",
      pinSalt: "salt",
      failedAttempts: 0,
      lockedUntil: null,
      lastUnlockedAt: 1_761_300_000_000,
    };

    await deviceDb.accounts.put(account);

    expect(await deviceDb.accounts.get("profile-1")).toEqual(account);
  });

  it("round-trips a meta row keyed by key", async () => {
    await deviceDb.meta.put({ key: "lastSyncAt", value: 42 });

    expect(await deviceDb.meta.get("lastSyncAt")).toEqual({
      key: "lastSyncAt",
      value: 42,
    });
  });
});
