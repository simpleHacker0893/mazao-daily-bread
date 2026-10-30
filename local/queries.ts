// Read hooks for pages. They read Dexie live and call only domain functions for every number;
// components never calculate money (AGENTS.md). Nothing here writes.
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useSession } from "@/auth/session";
import { isInRange, nairobiDayRange, todayInNairobi } from "@/domain/dates";
import {
  activeTxns,
  broughtForwardStock,
  broughtForwardTotals,
  canVoid,
  customerBalance,
  customerLedger,
  customerLedgerRows,
  customerStanding,
  deniList,
  isOverdue,
  paymentPreview,
  paymentQuickAmounts,
  saleOutstandingBalance,
  stockOnHand,
} from "@/domain/ledger";
import type { OnboardingProgress } from "@/domain/onboarding";
import {
  defaultProfile,
  type OperatingProfile,
} from "@/domain/operating-profile";
import {
  type DayReport,
  type DaySummary,
  dayReport,
  daySummary,
  moneyInShares,
  supplierDeniTotal,
} from "@/domain/summary";
import type {
  Cents,
  Customer,
  Day,
  Id,
  IsoTime,
  Item,
  Supplier,
  Txn,
  TxnLine,
} from "@/domain/types";
import { type BusinessDb, getBusinessDb } from "./business-db";
import { readOnboardingProgress } from "./onboarding-progress";

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

export type ListedSaleLine = TxnLine & { label: string };
export type ListedSale = ListedTxn & {
  lines: ListedSaleLine[];
  outstandingBalance: Cents;
};

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

/** Today's sales with display labels; void rows remain represented on their original sale. */
export function useTodaySalesWithLines(): ListedSale[] | undefined {
  const today = useToday();
  return useBusinessQuery(
    async (db) => {
      const { items, txns, lines } = await everything(db);
      const range = nairobiDayRange(today);
      const itemNames = new Map(items.map((item) => [item.id, item.name]));
      return withVoided(
        txns.filter(
          (txn) => txn.type === "sale" && isInRange(txn.occurredAt, range),
        ),
        txns,
      ).map((sale) => ({
        ...sale,
        outstandingBalance: saleOutstandingBalance(sale),
        lines: lines
          .filter((line) => line.txnId === sale.id)
          .map((line) => ({
            ...line,
            label:
              line.description ||
              (line.itemId && itemNames.get(line.itemId)) ||
              "",
          })),
      }));
    },
    [today],
  );
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

export type DeniListData = ReturnType<typeof deniList>;

/** Customer deni totals and overdue-first rows, computed by the ledger domain. */
export function useDeniList(day: Day): DeniListData | undefined {
  return useBusinessQuery(
    async (db) => {
      const [customers, txns] = await Promise.all([
        db.customers.toArray(),
        db.txns.toArray(),
      ]);
      return deniList(customers, txns, day);
    },
    [day],
  );
}

/** All customers for pickers, including customers with no current balance. */
export function useCustomers(): Customer[] | undefined {
  return useBusinessQuery(
    async (db) =>
      (await db.customers.toArray()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );
}

/** Suppliers whose names contain the query, case-insensitively. */
export function useSupplierSearch(query: string): Supplier[] | undefined {
  const search = query.trim().toLocaleLowerCase();
  return useBusinessQuery(
    async (db) =>
      (await db.suppliers.toArray())
        .filter((supplier) =>
          supplier.name.toLocaleLowerCase().includes(search),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [search],
  );
}

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

export type CustomerLedgerEntry = ReturnType<
  typeof customerLedgerRows
>[number] & {
  txn: Txn;
  lineSummary: string | undefined;
};

/** Customer ledger rows with their source records and display-only line labels. */
export function useCustomerLedgerRows(
  id: Id,
): CustomerLedgerEntry[] | undefined {
  return useBusinessQuery(
    async (db) => {
      const [txns, lines] = await Promise.all([
        db.txns.toArray(),
        db.lines.toArray(),
      ]);
      const txnById = new Map(txns.map((txn) => [txn.id, txn]));
      return customerLedgerRows(id, txns).flatMap((row) => {
        const txn = txnById.get(row.txnId);
        if (!txn) return [];
        const summary = lines
          .filter((line) => line.txnId === txn.id)
          .map((line) => line.description)
          .filter(Boolean)
          .join(", ");
        return [
          {
            ...row,
            txn,
            lineSummary: summary || undefined,
          },
        ];
      });
    },
    [id],
  );
}

export type CustomerStandingData = {
  customer: Customer | undefined;
  standing: ReturnType<typeof customerStanding>;
  overdue: boolean;
};

/** The current amount owed/credit and overdue flag for one customer. */
export function useCustomerStanding(id: Id): CustomerStandingData | undefined {
  const today = useToday();
  return useBusinessQuery(
    async (db) => {
      const [customer, txns] = await Promise.all([
        db.customers.get(id),
        db.txns.toArray(),
      ]);
      return {
        customer,
        standing: customerStanding(customerBalance(id, txns)),
        overdue: isOverdue(id, txns, today),
      };
    },
    [id, today],
  );
}

export type TxnDetail = {
  txn: Txn;
  voided: boolean;
  canVoid: boolean;
  outstandingBalance: Cents;
  customerName: string | undefined;
  voidedTxn: Txn | undefined;
  lines: ListedSaleLine[];
};

/** Full local detail for any transaction type, including its void target and sale lines. */
export function useTxnDetail(id: Id): TxnDetail | null | undefined {
  return useBusinessQuery(
    async (db) => {
      const [txn, txns, customers, items, lines] = await Promise.all([
        db.txns.get(id),
        db.txns.toArray(),
        db.customers.toArray(),
        db.items.toArray(),
        db.lines.toArray(),
      ]);
      if (!txn) return null;

      const customerById = new Map(
        customers.map((customer) => [customer.id, customer.name]),
      );
      const itemById = new Map(items.map((item) => [item.id, item.name]));
      const voidedIds = new Set(
        txns.flatMap((record) =>
          record.type === "void" && record.voidsTxnId
            ? [record.voidsTxnId]
            : [],
        ),
      );
      return {
        txn,
        voided: voidedIds.has(txn.id),
        canVoid: canVoid(txn, txns),
        outstandingBalance: saleOutstandingBalance(txn),
        customerName: txn.customerId
          ? customerById.get(txn.customerId)
          : undefined,
        voidedTxn:
          txn.type === "void" && txn.voidsTxnId
            ? txns.find((record) => record.id === txn.voidsTxnId)
            : undefined,
        lines: lines
          .filter((line) => line.txnId === txn.id)
          .map((line) => ({
            ...line,
            label:
              line.description ||
              (line.itemId && itemById.get(line.itemId)) ||
              "",
          })),
      };
    },
    [id],
  );
}

export type PaymentPreview = {
  customer: Customer | undefined;
  balance: Cents;
  quick: ReturnType<typeof paymentQuickAmounts>;
  preview: ReturnType<typeof paymentPreview>;
  nextStanding: ReturnType<typeof customerStanding>;
};

/** Payment preview and round amounts; all monetary calculations stay in domain/ledger. */
export function usePaymentPreview(
  customerId: Id | undefined,
  amount: Cents,
): PaymentPreview | undefined {
  return useBusinessQuery(
    async (db) => {
      if (!customerId) return undefined;
      const [customer, txns] = await Promise.all([
        db.customers.get(customerId),
        db.txns.toArray(),
      ]);
      const balance = customerBalance(customerId, txns);
      const preview = paymentPreview(balance, amount);
      return {
        customer,
        balance,
        quick: paymentQuickAmounts(balance),
        preview,
        nextStanding: customerStanding(preview.newBalance),
      };
    },
    [customerId, amount],
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

/** Today's itemised report. `totals` is `daySummary` for the same day, never a second calculation. */
export function useDayReport(today: Day): DayReport | undefined {
  return useBusinessQuery(
    async (db) => {
      const [customers, txns, lines] = await Promise.all([
        db.customers.toArray(),
        db.txns.toArray(),
        db.lines.toArray(),
      ]);
      return dayReport(txns, lines, customers, nairobiDayRange(today));
    },
    [today],
  );
}

export type DashboardLowStock = {
  itemId: Id;
  name: string;
  unit: string;
  onHand: number;
};

export type Dashboard = {
  /** Identical to `useDayReport(today).totals`. */
  totals: DaySummary;
  /** Cash, M-Pesa and other as fractions of money in. */
  moneyIn: { cash: number; mpesa: number; other: number };
  deniGiven: Cents;
  /** The screen shows `rows.slice(0, 5)`. */
  deni: DeniListData;
  supplierDeniTotal: Cents;
  lowStock: DashboardLowStock[];
  /** Records counted in today's totals (sales, expenses and payments received). */
  recordCount: number;
};

/** Everything Muhtasari shows, from one read of the local ledger. */
export function useDashboard(today: Day): Dashboard | undefined {
  return useBusinessQuery(
    async (db) => {
      const [customers, suppliers, items, txns, lines] = await Promise.all([
        db.customers.toArray(),
        db.suppliers.toArray(),
        db.items.toArray(),
        db.txns.toArray(),
        db.lines.toArray(),
      ]);
      const report = dayReport(txns, lines, customers, nairobiDayRange(today));
      return {
        totals: report.totals,
        moneyIn: moneyInShares(report.totals),
        deniGiven: report.deniGiven,
        deni: deniList(customers, txns, today),
        supplierDeniTotal: supplierDeniTotal(suppliers, txns),
        lowStock: items
          .filter((item) => item.isActive && item.kind === "goods")
          .map((item) => ({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            threshold: item.lowStockThreshold,
            onHand: stockOnHand(item.id, txns, lines),
          }))
          .filter(
            (row) => row.threshold !== null && row.onHand <= row.threshold,
          )
          .map(({ itemId, name, unit, onHand }) => ({
            itemId,
            name,
            unit,
            onHand,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        recordCount: report.entries.filter((e) => e.countsInTotals).length,
      };
    },
    [today],
  );
}

/** The business name and place from the saved profile; empty strings until onboarding saves them. */
export function useBusinessHeader():
  | { businessName: string; location: string }
  | undefined {
  const profile = useOperatingProfile();
  return profile
    ? { businessName: profile.businessName, location: profile.location }
    : undefined;
}

/** The saved operating profile, or the default until onboarding saves one. */
export function useOperatingProfile(): OperatingProfile | undefined {
  return useBusinessQuery(
    async (db) =>
      (await db.settings.get("operatingProfile"))?.value ?? defaultProfile(),
    [],
  );
}

/** Local-only draft progress; null means loaded with no saved draft, undefined means loading. */
export function useOnboardingProgress(): OnboardingProgress | null | undefined {
  const db = useBusinessDb();
  return useLiveQuery(
    async () => (db ? ((await readOnboardingProgress(db)) ?? null) : undefined),
    [db],
    undefined,
  );
}

export type BroughtForwardEntry = ListedTxn & { partyName?: string };
export type BroughtForwardStockEntry = { item: Item; quantity: number };
export type BroughtForwardData = {
  customers: BroughtForwardEntry[];
  suppliers: BroughtForwardEntry[];
  totals: { customers: Cents; suppliers: Cents };
  stock: BroughtForwardStockEntry[];
};

/** Notebook entries, totals, and opening stock, all derived from the local ledger. */
export function useBroughtForward(): BroughtForwardData | undefined {
  return useBusinessQuery(async (db) => {
    const [customers, suppliers, items, txns, lines] = await Promise.all([
      db.customers.toArray(),
      db.suppliers.toArray(),
      db.items.toArray(),
      db.txns.toArray(),
      db.lines.toArray(),
    ]);
    const customerNames = new Map(
      customers.map((party) => [party.id, party.name]),
    );
    const supplierNames = new Map(
      suppliers.map((party) => [party.id, party.name]),
    );
    const openingBalances = txns.filter(
      (txn) => txn.type === "opening_balance" && txn.source === "onboarding",
    );
    const stockByItem = broughtForwardStock(txns, lines);

    return {
      customers: withVoided(
        openingBalances.filter((txn) => txn.customerId !== undefined),
        txns,
      ).map((txn) => ({
        ...txn,
        partyName: txn.customerId
          ? customerNames.get(txn.customerId)
          : undefined,
      })),
      suppliers: withVoided(
        openingBalances.filter((txn) => txn.supplierId !== undefined),
        txns,
      ).map((txn) => ({
        ...txn,
        partyName: txn.supplierId
          ? supplierNames.get(txn.supplierId)
          : undefined,
      })),
      totals: broughtForwardTotals(txns),
      stock: items
        .filter((item) => item.kind === "goods")
        .map((item) => ({
          item,
          quantity: stockByItem.get(item.id) ?? 0,
        }))
        .sort((a, b) => a.item.name.localeCompare(b.item.name)),
    };
  }, []);
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
