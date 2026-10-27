// The business database on the phone: the operational source of truth (D-018 to D-021).
// Only local/commit.ts writes records; pages read through local/queries.ts.
import { Dexie, type EntityTable } from "dexie";
import type { OperatingProfile } from "@/domain/operating-profile";
import type {
  Customer,
  Id,
  IsoTime,
  Item,
  Supplier,
  Txn,
  TxnLine,
} from "@/domain/types";

/** Tables that back up to the server, in parent order. */
export const SYNC_TABLES = [
  "customers",
  "suppliers",
  "items",
  "settings",
  "txns",
  "lines",
] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

/** One record waiting to back up. `lastError` holds an error code, never row contents. */
export type SyncQueueEntry = {
  seq?: number;
  table: SyncTable;
  rowId: Id;
  /** Records (txns, lines) are immutable inserts; masters and settings are upserts. */
  op: "insert" | "upsert";
  attempts: number;
  /** Epoch ms; 0 = due now. */
  nextAttemptAt: number;
  lastError: string | null;
  /** When the record was queued; the oldest one drives the "not backed up for 3 days" banner. */
  queuedAt: IsoTime;
  /** Set when the server refused the row as invalid (M4); never re-sent automatically. */
  quarantinedAt: IsoTime | null;
};

/** The operating profile, one row per business. */
export type SettingsRow = {
  key: "operatingProfile";
  value: OperatingProfile;
  updatedAt: IsoTime;
};

/** Onboarding progress (Phase 2). Never syncs. */
export type OnboardingRow = { key: string; value: unknown };

export type BusinessDb = Dexie & {
  items: EntityTable<Item, "id">;
  customers: EntityTable<Customer, "id">;
  suppliers: EntityTable<Supplier, "id">;
  txns: EntityTable<Txn, "id">;
  lines: EntityTable<TxnLine, "id">;
  settings: EntityTable<SettingsRow, "key">;
  syncQueue: EntityTable<SyncQueueEntry, "seq">;
  onboarding: EntityTable<OnboardingRow, "key">;
};

export function businessDbName(businessId: Id): string {
  return `mazao-${businessId}`;
}

/** Opens (and creates on first use) the database for one business. */
export function openBusinessDb(businessId: Id): BusinessDb {
  const db = new Dexie(businessDbName(businessId)) as BusinessDb;
  db.version(1).stores({
    items: "id, name, kind, isActive, updatedAt",
    customers: "id, name, updatedAt",
    suppliers: "id, name, updatedAt",
    txns: "id, occurredAt, type, customerId, supplierId, voidsTxnId",
    lines: "id, txnId, itemId",
    settings: "key",
    syncQueue: "++seq, nextAttemptAt, quarantinedAt, rowId, table",
    onboarding: "key",
  });
  return db;
}

const open = new Map<Id, BusinessDb>();

/** The one open database per business for this page (opened on first use). */
export function getBusinessDb(businessId: Id): BusinessDb {
  let db = open.get(businessId);
  if (!db) {
    db = openBusinessDb(businessId);
    open.set(businessId, db);
  }
  return db;
}
