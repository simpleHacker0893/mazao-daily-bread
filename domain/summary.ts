import { type DayRange, isInRange, nairobiDayOf } from "./dates";
import {
  activeTxns,
  type CustomerStanding,
  customerBalance,
  customerStanding,
  saleOutstandingBalance,
  supplierOwed,
} from "./ledger";
import { formatKES, lineTotal } from "./money";
import type {
  Cents,
  Customer,
  Day,
  Id,
  IsoTime,
  PaymentMethod,
  Supplier,
  Txn,
  TxnLine,
  TxnType,
} from "./types";

export type DaySummary = {
  sales: Cents;
  cogs: Cents;
  expenses: Cents;
  /** Net profit: Sales − COGS − Expenses. */
  faidaHalisi: Cents;
  cashIn: Cents;
  mpesaIn: Cents;
  otherIn: Cents;
};

/**
 * One day's numbers. Brought-forward records (opening balances, opening stock) are never sales
 * or expenses; money in is what was actually paid, by method.
 */
export function daySummary(
  txns: readonly Txn[],
  lines: readonly TxnLine[],
  range: DayRange,
): DaySummary {
  const today = activeTxns(txns).filter((t) => isInRange(t.occurredAt, range));
  const sales = new Set(
    today.filter((t) => t.type === "sale").map((t) => t.id),
  );

  let salesTotal = 0;
  let cogs = 0;
  for (const l of lines) {
    if (!sales.has(l.txnId)) continue;
    salesTotal += lineTotal(l.quantity, l.unitPrice);
    if (l.itemKind === "goods") cogs += lineTotal(l.quantity, l.unitCost);
  }

  let expenses = 0;
  const moneyIn = { cash: 0, mpesa: 0, other: 0 };
  for (const t of today) {
    if (t.type === "expense") expenses += t.totalAmount;
    if (
      (t.type === "sale" || t.type === "customer_payment") &&
      t.paymentMethod
    ) {
      moneyIn[t.paymentMethod] += t.amountPaid;
    }
  }

  return {
    sales: salesTotal,
    cogs,
    expenses,
    faidaHalisi: salesTotal - cogs - expenses,
    cashIn: moneyIn.cash,
    mpesaIn: moneyIn.mpesa,
    otherIn: moneyIn.other,
  };
}

// ---------------------------------------------------------------------------------------------
// Day report (Phase 4): the same day as `daySummary`, itemised. `totals` IS `daySummary`, never a
// second calculation, so Muhtasari, Leo and the shared text cannot disagree.
// ---------------------------------------------------------------------------------------------

export type DayEntryKind =
  | "sale"
  | "expense"
  | "payment"
  | "void"
  | "brought_forward";

export type DayEntryLine = {
  itemId: Id | null;
  description: string;
  quantity: number;
  unit: string;
};

export type DayEntry = {
  txnId: Id;
  kind: DayEntryKind;
  at: IsoTime;
  /** The record's total; for a void, the total of the record it cancelled. */
  amount: Cents;
  /** Unpaid part of a sale (deni given); 0 for everything else. */
  deni: Cents;
  paymentMethod: PaymentMethod | null;
  customerId: Id | null;
  supplierId: Id | null;
  expenseCategory: string | null;
  description: string | null;
  /** A void entry names what it cancelled. */
  voidsTxnId: Id | null;
  voidsType: TxnType | null;
  /** Set on a void made in this day for a record dated an earlier day. */
  voidsEarlierDay: Day | null;
  /** This record has been cancelled by a void (on any day). */
  voided: boolean;
  countsInTotals: boolean;
  lines: DayEntryLine[];
};

export type DayCustomer = {
  /** `null` is the walk-in line: sales with no customer. */
  customerId: Id | null;
  name: string | null;
  bought: Cents;
  paid: Cents;
  /** Over all time, from `customerBalance`; negative means in credit. */
  balanceNow: Cents;
  standing: CustomerStanding;
};

export type DayReport = {
  totals: DaySummary;
  /** Unpaid part of today's counted sales. */
  deniGiven: Cents;
  /** Customer payments received today, counted only. */
  paymentsReceived: Cents;
  /** Everything dated in the day, oldest first. */
  entries: DayEntry[];
  customers: DayCustomer[];
};

function entryOrder(a: Txn, b: Txn): number {
  return (
    a.occurredAt.localeCompare(b.occurredAt) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

export function dayReport(
  txns: readonly Txn[],
  lines: readonly TxnLine[],
  customers: readonly Customer[],
  range: DayRange,
): DayReport {
  const totals = daySummary(txns, lines, range);
  const voidedIds = new Set(
    txns.flatMap((t) =>
      t.type === "void" && t.voidsTxnId ? [t.voidsTxnId] : [],
    ),
  );
  const byId = new Map(txns.map((t) => [t.id, t]));
  const linesByTxn = new Map<Id, DayEntryLine[]>();
  for (const l of lines) {
    const list = linesByTxn.get(l.txnId) ?? [];
    list.push({
      itemId: l.itemId ?? null,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
    });
    linesByTxn.set(l.txnId, list);
  }
  const rangeDay = nairobiDayOf(range[0]);

  const entries: DayEntry[] = txns
    .filter((t) => isInRange(t.occurredAt, range))
    .sort(entryOrder)
    .map((t) => {
      const voided = voidedIds.has(t.id);
      const original =
        t.type === "void" && t.voidsTxnId ? byId.get(t.voidsTxnId) : undefined;
      const originalDay = original ? nairobiDayOf(original.occurredAt) : null;
      const kind: DayEntryKind =
        t.type === "sale"
          ? "sale"
          : t.type === "expense"
            ? "expense"
            : t.type === "customer_payment"
              ? "payment"
              : t.type === "void"
                ? "void"
                : "brought_forward";
      return {
        txnId: t.id,
        kind,
        at: t.occurredAt,
        amount: original ? original.totalAmount : t.totalAmount,
        deni: saleOutstandingBalance(t),
        paymentMethod: t.paymentMethod,
        customerId: t.customerId ?? null,
        supplierId: t.supplierId ?? null,
        expenseCategory: t.expenseCategory ?? null,
        description: t.description ?? null,
        voidsTxnId: t.voidsTxnId ?? null,
        voidsType: original?.type ?? null,
        voidsEarlierDay:
          originalDay !== null && originalDay !== rangeDay ? originalDay : null,
        voided,
        countsInTotals:
          !voided &&
          (kind === "sale" || kind === "expense" || kind === "payment"),
        lines: linesByTxn.get(t.id) ?? [],
      };
    });

  const counted = entries.filter((e) => e.countsInTotals);
  const deniGiven = counted
    .filter((e) => e.kind === "sale")
    .reduce((sum, e) => sum + e.deni, 0);
  const paymentsReceived = counted
    .filter((e) => e.kind === "payment")
    .reduce((sum, e) => sum + e.amount, 0);

  // Per-customer activity: counted sales and payments only. Walk-in sales are one line.
  const activity = new Map<Id | null, { bought: Cents; paid: Cents }>();
  for (const e of counted) {
    if (e.kind !== "sale" && e.kind !== "payment") continue;
    const row = activity.get(e.customerId) ?? { bought: 0, paid: 0 };
    if (e.kind === "sale") {
      row.bought += e.amount;
      row.paid += e.amount - e.deni;
    } else {
      row.paid += e.amount;
    }
    activity.set(e.customerId, row);
  }
  const names = new Map(customers.map((c) => [c.id, c.name]));
  const customerRows: DayCustomer[] = [...activity]
    .map(([customerId, row]) => {
      const balanceNow =
        customerId === null ? 0 : customerBalance(customerId, txns);
      return {
        customerId,
        name: customerId === null ? null : (names.get(customerId) ?? ""),
        bought: row.bought,
        paid: row.paid,
        balanceNow,
        standing: customerStanding(balanceNow),
      };
    })
    .sort((a, b) => {
      if (a.customerId === null) return 1;
      if (b.customerId === null) return -1;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

  return {
    totals,
    deniGiven,
    paymentsReceived,
    entries,
    customers: customerRows,
  };
}

/** Cash, M-Pesa and other as fractions of money in, for the Muhtasari bar. All 0 when nothing came in. */
export function moneyInShares(
  totals: Pick<DaySummary, "cashIn" | "mpesaIn" | "otherIn">,
): { cash: number; mpesa: number; other: number } {
  const total = totals.cashIn + totals.mpesaIn + totals.otherIn;
  if (total <= 0) return { cash: 0, mpesa: 0, other: 0 };
  return {
    cash: totals.cashIn / total,
    mpesa: totals.mpesaIn / total,
    other: totals.otherIn / total,
  };
}

/** What the merchant still owes suppliers: brought-forward supplier deni only in R0. */
export function supplierDeniTotal(
  suppliers: readonly Supplier[],
  txns: readonly Txn[],
): Cents {
  return suppliers.reduce((sum, s) => sum + supplierOwed(s.id, txns), 0);
}

/** Labels for the shared text; the caller passes them for the current UI language. */
export type DaySummaryStrings = {
  sales: string;
  cogs: string;
  expenses: string;
  faidaHalisi: string;
  cashIn: string;
  mpesaIn: string;
  deniGiven: string;
  customers: string;
  walkIn: string;
  bought: string;
  paid: string;
  owes: string;
  owesNothing: string;
  inCredit: string;
};

/**
 * Plain text for WhatsApp: no markdown, no emoji, no dashes. Customer names appear only when
 * `includeCustomerNames` is true (privacy: off by default).
 */
export function formatDaySummaryText(
  report: DayReport,
  business: { businessName: string; dateLabel: string },
  strings: DaySummaryStrings,
  options: { includeCustomerNames?: boolean } = {},
): string {
  const { totals } = report;
  const out: string[] = [];
  if (business.businessName.trim()) out.push(business.businessName.trim());
  out.push(business.dateLabel, "");
  out.push(`${strings.sales}: ${formatKES(totals.sales)}`);
  out.push(`${strings.cogs}: ${formatKES(totals.cogs)}`);
  out.push(`${strings.expenses}: ${formatKES(totals.expenses)}`);
  out.push(`${strings.faidaHalisi}: ${formatKES(totals.faidaHalisi)}`, "");
  out.push(`${strings.cashIn}: ${formatKES(totals.cashIn)}`);
  out.push(`${strings.mpesaIn}: ${formatKES(totals.mpesaIn)}`);
  out.push(`${strings.deniGiven}: ${formatKES(report.deniGiven)}`);

  if (options.includeCustomerNames && report.customers.length > 0) {
    out.push("", `${strings.customers}:`);
    for (const c of report.customers) {
      const name = c.name ?? strings.walkIn;
      const standing =
        c.standing.kind === "owes"
          ? `${strings.owes} ${formatKES(c.standing.amount)}`
          : c.standing.kind === "credit"
            ? `${strings.inCredit} ${formatKES(c.standing.amount)}`
            : strings.owesNothing;
      out.push(
        `${name}: ${strings.bought} ${formatKES(c.bought)}, ${strings.paid} ${formatKES(c.paid)}, ${standing}`,
      );
    }
  }
  return out.join("\n");
}
