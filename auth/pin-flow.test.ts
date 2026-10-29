import { beforeEach, describe, expect, it } from "vitest";
import { type DeviceAccount, deviceDb } from "@/local/device-db";
import { PENDING_SIGN_IN_KEY, type PendingSignIn } from "./after-sign-in";
import { PinFlowError, setupPin, unlockWithPin } from "./pin-flow";

const now = 1_800_000_000_000;
const handoff: PendingSignIn = {
  profileId: "profile-1",
  businessId: "business-1",
  clerkUserId: "user-1",
  email: "merchant@example.test",
  hasData: false,
  mode: "first",
  createdAt: now - 1_000,
};

async function seedPending(pending = handoff) {
  await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
}

async function savePin(pin = "2468"): Promise<DeviceAccount> {
  await seedPending();
  await setupPin({
    pin,
    confirmation: pin,
    clerkUserId: handoff.clerkUserId,
    now,
  });
  const row = await deviceDb.accounts.get(handoff.profileId);
  if (!row) throw new Error("expected device account");
  return row;
}

beforeEach(async () => {
  await deviceDb.accounts.clear();
  await deviceDb.meta.clear();
});

describe("device PIN flow", () => {
  it("persists only a salted hash, consumes the pending sign-in, and authorizes first setup", async () => {
    const session = await (async () => {
      await seedPending();
      return setupPin({
        pin: "2468",
        confirmation: "2468",
        clerkUserId: handoff.clerkUserId,
        now,
      });
    })();
    const saved = await deviceDb.accounts.get(handoff.profileId);

    expect(session).toMatchObject({
      profileId: handoff.profileId,
      businessId: handoff.businessId,
      clerkUserId: handoff.clerkUserId,
    });
    expect(saved).toMatchObject({ failedAttempts: 0, lockedUntil: null });
    expect(saved?.pinHash).not.toBe("2468");
    expect(saved?.pinSalt).not.toBe("2468");
    expect(saved?.pinHash).not.toBe(saved?.pinSalt);
    expect(await deviceDb.meta.get(PENDING_SIGN_IN_KEY)).toBeUndefined();
  });

  it("rejects a confirmation mismatch without writing anything", async () => {
    await seedPending();
    await expect(
      setupPin({
        pin: "2468",
        confirmation: "1357",
        clerkUserId: "user-1",
        now,
      }),
    ).rejects.toMatchObject({ code: "mismatch" });
    expect(await deviceDb.accounts.count()).toBe(0);
    expect(await deviceDb.meta.get(PENDING_SIGN_IN_KEY)).toBeDefined();
  });

  it.each([
    "0000",
    "1234",
    "7777",
  ])("rejects weak PIN %s without persistence", async (pin) => {
    await seedPending();
    await expect(
      setupPin({ pin, confirmation: pin, clerkUserId: "user-1", now }),
    ).rejects.toMatchObject({ code: "weak_pin" });
    expect(await deviceDb.accounts.count()).toBe(0);
  });

  it("rejects missing, expired, future-dated, and wrong-user setup authorization", async () => {
    await expect(
      setupPin({
        pin: "2468",
        confirmation: "2468",
        clerkUserId: "user-1",
        now,
      }),
    ).rejects.toMatchObject({ code: "setup_not_allowed" });
    for (const createdAt of [now - 600_001, now + 1]) {
      await seedPending({ ...handoff, createdAt });
      await expect(
        setupPin({
          pin: "2468",
          confirmation: "2468",
          clerkUserId: "user-1",
          now,
        }),
      ).rejects.toMatchObject({ code: "setup_not_allowed" });
      await deviceDb.meta.clear();
    }
    await seedPending();
    await expect(
      setupPin({
        pin: "2468",
        confirmation: "2468",
        clerkUserId: "user-other",
        now,
      }),
    ).rejects.toMatchObject({ code: "setup_not_allowed" });
    expect(await deviceDb.accounts.count()).toBe(0);
  });

  it("allows reset only for a fresh reset hand-off for the same account", async () => {
    const original = await savePin();
    await seedPending({ ...handoff, mode: "reset" });
    await setupPin({
      pin: "1357",
      confirmation: "1357",
      clerkUserId: "user-1",
      now,
    });
    const reset = await deviceDb.accounts.get(handoff.profileId);
    expect(reset?.pinHash).not.toBe(original.pinHash);
    expect(reset?.businessId).toBe(original.businessId);

    await seedPending({
      ...handoff,
      mode: "reset",
      profileId: "other-profile",
    });
    await expect(
      setupPin({
        pin: "8642",
        confirmation: "8642",
        clerkUserId: "user-1",
        now,
      }),
    ).rejects.toMatchObject({ code: "setup_not_allowed" });
  });

  it("verifies the correct PIN, records unlock, and clears prior failures", async () => {
    const saved = await savePin();
    await deviceDb.accounts.update(saved.profileId, {
      failedAttempts: 3,
      lockedUntil: null,
    });
    const result = await unlockWithPin("2468", saved.profileId, now);
    expect(result.session).toMatchObject({ profileId: saved.profileId });
    expect((await deviceDb.accounts.get(saved.profileId))?.failedAttempts).toBe(
      0,
    );
    expect((await deviceDb.accounts.get(saved.profileId))?.lastUnlockedAt).toBe(
      now,
    );
  });

  it("persists incorrect PIN failures and applies the 30-second wait on failure five", async () => {
    const saved = await savePin();
    for (let failure = 1; failure <= 5; failure += 1) {
      await expect(
        unlockWithPin("1357", saved.profileId, now),
      ).rejects.toMatchObject({
        code: "incorrect_pin",
      });
      const updated = await deviceDb.accounts.get(saved.profileId);
      expect(updated?.failedAttempts).toBe(failure);
    }
    expect((await deviceDb.accounts.get(saved.profileId))?.lockedUntil).toBe(
      now + 30_000,
    );
    await expect(
      unlockWithPin("2468", saved.profileId, now),
    ).rejects.toMatchObject({
      code: "locked",
    });
    await expect(
      unlockWithPin("2468", saved.profileId, now + 30_001),
    ).resolves.toMatchObject({
      session: { profileId: saved.profileId },
    });
  });

  it("rejects malformed entries and does not reveal credential contents in errors", async () => {
    await seedPending({ ...handoff, createdAt: Number.NaN });
    await expect(
      setupPin({
        pin: "24x8",
        confirmation: "24x8",
        clerkUserId: "user-1",
        now,
      }),
    ).rejects.toBeInstanceOf(PinFlowError);
    expect(await deviceDb.accounts.count()).toBe(0);
  });
});
