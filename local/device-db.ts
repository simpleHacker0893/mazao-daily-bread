// Shared contract (R-011): the per-phone database. Change only with both devs agreeing.
// One merchant account per phone in R0 (D-039). PIN material never leaves the device.
import { Dexie, type EntityTable } from "dexie";

export type DeviceAccount = {
  profileId: string;
  clerkUserId: string;
  email: string;
  businessId: string;
  pinHash: string;
  pinSalt: string;
  failedAttempts: number;
  /** Epoch ms; null when not locked out. */
  lockedUntil: number | null;
  /** Epoch ms; null before the first unlock. */
  lastUnlockedAt: number | null;
};

export type DeviceMeta = {
  key: string;
  value: unknown;
};

export const deviceDb = new Dexie("mazao-device") as Dexie & {
  accounts: EntityTable<DeviceAccount, "profileId">;
  meta: EntityTable<DeviceMeta, "key">;
};

deviceDb.version(1).stores({
  accounts: "profileId, clerkUserId",
  meta: "key",
});
