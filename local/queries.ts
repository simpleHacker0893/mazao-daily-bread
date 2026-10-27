// Read hooks for pages. They read Dexie live and call only domain functions for every number;
// components never calculate money (AGENTS.md). Nothing here writes.
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useSession } from "@/auth/session";
import { isInRange, nairobiDayRange, todayInNairobi } from "@/domain/dates";
import {
  activeTxns,
  customerBalance,
  customerLedger,
  isOverdue,
  stockOnHand,
} from "@/domain/ledger";
import {
  defaultProfile,
  type OperatingProfile,
} from "@/domain/operating-profile";
import { type DaySummary, daySummary } from "@/domain/summary";
import type {
  Cents,
  Customer,
  Day,
  Id,
  IsoTime,
  Item,
  Txn,
} from "@/domain/types";
import { type BusinessDb, getBusinessDb } from "./business-db";

/** The signed-in business's database, or null while locked or signed out. */
export function useBusinessDb(): BusinessDb | null {
  const session = useSession();
  return session ? getBusinessDb(session.businessId) : null;
}

/** Today in Nairobi. Refreshes every 60 s and on return to the app, so figures roll over at midnight. */
export function useToday(): Day {
  const [today, setToday] = useState(() => todayInNairobi(new Date()));
  useEffect(() => {
    const refresh = () => setToday(todayInNairobi(new Date()));
    const timer = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}

/** A live query on the signed-in business; undefined while loading or with no session. */
function useBusinessQuery<T>(
  query: (db: BusinessDb) => Promise<T>,
  deps: unknown[],
): T | undefined {
  const db = useBusinessDb();
  return useLiveQuery(() => (db ? query(db) : undefined), [db, ...deps]);
}

async function everything(db: BusinessDb) {
  const [items, txns, lines] = await Promise.all([
    db.items.toArray(),
    db.txns.toArray(),
    db.lines.toArray(),
  ]);
  return { items, txns, lines };
}

export type ListedTxn = Txn & { voided: boolean };

function withVoided(list: Txn[], all: Txn[]): ListedTxn[] {
  const voided = new Set(
    all.flatMap((t) =>
      t.type === "void" && t.voidsTxnId ? [t.voidsTxnId] : [],
    ),
  );
  return list
    .map((t) => ({ ...t, voided: voided.has(t.id) }))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function useTodayOfType(type: Txn["type"]): ListedTxn[] | undefined {
  const today = useToday();
  return useBusinessQuery(
    async (db) => {
      const txns = await db.txns.toArray();
      const range = nairobiDayRange(today);
      const ofType = txns.filter(
        (t) => t.type === type && isInRange(t.occurredAt, range),
      );
      return withVoided(ofType, txns);
    },
    [today, type],
  );
}

/** Today's sales, newest first, each marked if voided. */
export function useTodaySales(): ListedTxn[] | undefined {
  return useTodayOfType("sale");
}

/** Today's expenses, newest first, each marked if voided. */
export function useTodayExpenses(): ListedTxn[] | undefined {
  return useTodayOfType("expense");
}

export type CustomerWithBalance = {
  customer: Customer;
  balance: Cents;
  overdue: boolean;
};

/** Customers with what they owe; overdue first, then the biggest balance. */
export function useCustomersWithBalance(): CustomerWithBalance[] | undefined {
  const today = useToday();
  return useBusinessQuery(
    async (db) => {
      const [customers, txns] = await Promise.all([
        db.customers.toArray(),
        db.txns.toArray(),
      ]);
      return customers
        .map((customer) => ({
          customer,
          balance: customerBalance(customer.id, txns),
          overdue: isOverdue(customer.id, txns, today),
        }))
        .sort(
          (a, b) =>
            Number(b.overdue) - Number(a.overdue) || b.balance - a.balance,
        );
    },
    [today],
  );
}

/** Every record naming the customer, voids included, newest first. */
export function useCustomerLedger(id: Id): Txn[] | undefined {
  return useBusinessQuery(
    async (db) => customerLedger(id, await db.txns.toArray()),
    [id],
  );
}

export type ItemWithStock = { item: Item; onHand: number | null };

/** Active items; goods carry what is on hand, services null. */
export function useItemsWithStock(): ItemWithStock[] | undefined {
  return useBusinessQuery(async (db) => {
    const { items, txns, lines } = await everything(db);
    return items
      .filter((item) => item.isActive)
      .map((item) => ({
        item,
        onHand:
          item.kind === "goods" ? stockOnHand(item.id, txns, lines) : null,
      }))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, []);
}

/** The items sold most recently, newest first, for quick picking. */
export function useRecentItems(n: number): Item[] | undefined {
  return useBusinessQuery(
    async (db) => {
      const { items, txns, lines } = await everything(db);
      const soldAt = new Map(
        activeTxns(txns)
          .filter((t) => t.type === "sale")
          .map((t) => [t.id, t.occurredAt]),
      );
      const lastSold = new Map<Id, IsoTime>();
      for (const l of lines) {
        const at = soldAt.get(l.txnId);
        if (!l.itemId || !at) continue;
        const seen = lastSold.get(l.itemId);
        if (!seen || at > seen) lastSold.set(l.itemId, at);
      }
      return items
        .filter((i) => i.isActive && lastSold.has(i.id))
        .sort((a, b) =>
          (lastSold.get(b.id) ?? "").localeCompare(lastSold.get(a.id) ?? ""),
        )
        .slice(0, n);
    },
    [n],
  );
}

/** The day's sales, costs, expenses, Faida Halisi and money in. */
export function useDaySummary(day: Day): DaySummary | undefined {
  return useBusinessQuery(
    async (db) => {
      const { txns, lines } = await everything(db);
      return daySummary(txns, lines, nairobiDayRange(day));
    },
    [day],
  );
}

/** Goods at or below their low-stock threshold. */
export function useLowStock(): ItemWithStock[] | undefined {
  const items = useItemsWithStock();
  return items?.filter(
    ({ item, onHand }) =>
      onHand !== null &&
      item.lowStockThreshold !== null &&
      onHand <= item.lowStockThreshold,
  );
}

/** The saved operating profile, or the default until onboarding saves one. */
export function useOperatingProfile(): OperatingProfile | undefined {
  return useBusinessQuery(
    async (db) =>
      (await db.settings.get("operatingProfile"))?.value ?? defaultProfile(),
    [],
  );
}

/** Unsynced records: queue entries whose table is not `lines`, so a sale counts once (AC-16). */
export async function countUnsynced(db: BusinessDb): Promise<number> {
  return db.syncQueue.filter((e) => e.table !== "lines").count();
}

export function useUnsyncedCount(): number | undefined {
  return useBusinessQuery(countUnsynced, []);
}

/** When the oldest record still waiting to back up was saved, or null when none wait. */
export function useOldestUnsyncedAt(): IsoTime | null | undefined {
  return useBusinessQuery(async (db) => {
    const first = await db.syncQueue.orderBy("seq").first();
    return first?.queuedAt ?? null;
  }, []);
}

/** Records the server refused as invalid (M4). */
export function useQuarantinedCount(): number | undefined {
  return useBusinessQuery(
    (db) => db.syncQueue.filter((e) => e.quarantinedAt !== null).count(),
    [],
  );
}
