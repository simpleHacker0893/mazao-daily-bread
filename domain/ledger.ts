import type { Cents, Customer, Day, Id, IsoTime, Txn, TxnLine } from "./types";

// Balances and stock are derived from the records, never stored (D-018, D-019).

/** Records that still count: no voids, and nothing that a void cancelled. */
export function activeTxns(txns: readonly Txn[]): Txn[] {
  const voided = new Set(
    txns.flatMap((t) =>
      t.type === "void" && t.voidsTxnId ? [t.voidsTxnId] : [],
    ),
  );
  return txns.filter((t) => t.type !== "void" && !voided.has(t.id));
}

/** A record can be voided once, and a void can never be voided. */
export function canVoid(txn: Txn, txns: readonly Txn[]): boolean {
  if (txn.type === "void") return false;
  return !txns.some((t) => t.type === "void" && t.voidsTxnId === txn.id);
}

/** The unpaid remainder of a sale, in cents. Non-sale records have no sale balance. */
export function saleOutstandingBalance(
  txn: Pick<Txn, "type" | "totalAmount" | "amountPaid">,
): Cents {
  return txn.type === "sale"
    ? Math.max(0, txn.totalAmount - txn.amountPaid)
    : 0;
}

/** Every record naming the customer, voids included, newest first. */
export function customerLedger(customerId: Id, txns: readonly Txn[]): Txn[] {
  return txns.filter((t) => t.customerId === customerId).sort(newestFirst);
}

/** What the customer owes the merchant; negative means they are in credit. */
export function customerBalance(customerId: Id, txns: readonly Txn[]): Cents {
  let balance = 0;
  for (const t of activeTxns(txns)) {
    if (t.customerId !== customerId) continue;
    balance += creditAmount(t) - paymentAmount(t);
  }
  return balance;
}

export type OpenDeni = {
  txnId: Id;
  remaining: Cents;
  dueDate: Day | undefined;
  occurredAt: IsoTime;
};

export type CustomerStanding = {
  kind: "owes" | "clear" | "credit";
  amount: Cents;
};

/** A non-negative amount and a direction that a screen can label without doing money math. */
export function customerStanding(balance: Cents): CustomerStanding {
  if (balance > 0) return { kind: "owes", amount: balance };
  if (balance < 0) return { kind: "credit", amount: -balance };
  return { kind: "clear", amount: 0 };
}

/** Preview a customer payment; overpayment becomes credit, not a negative amount owed. */
export function paymentPreview(
  balance: Cents,
  amount: Cents,
): { newBalance: Cents; creditCreated: Cents } {
  return {
    newBalance: balance - amount,
    creditCreated: Math.max(0, amount - Math.max(0, balance)),
  };
}

/** "All" and up to three lower round-payment amounts, in cents. */
export function paymentQuickAmounts(balance: Cents): {
  all: Cents | null;
  rounds: Cents[];
} {
  if (balance <= 0) return { all: null, rounds: [] };
  const rounds: Cents[] = [];
  const step = 10_000;
  for (
    let amount = Math.floor((balance - 1) / step) * step;
    amount > 0 && rounds.length < 3;
    amount -= step
  ) {
    rounds.push(amount);
  }
  return { all: balance, rounds };
}

/**
 * The customer's unpaid credits, oldest first. Payments settle the oldest credit first (FIFO);
 * an overpayment carries forward and settles later credits.
 */
export function openDeni(customerId: Id, txns: readonly Txn[]): OpenDeni[] {
  const mine = activeTxns(txns).filter((t) => t.customerId === customerId);
  let paid = mine.reduce((sum, t) => sum + paymentAmount(t), 0);
  const open: OpenDeni[] = [];
  const credits = mine.filter((t) => creditAmount(t) > 0).sort(oldestFirst);
  for (const credit of credits) {
    const owed = creditAmount(credit);
    const settled = Math.min(paid, owed);
    paid -= settled;
    if (owed > settled) {
      open.push({
        txnId: credit.id,
        remaining: owed - settled,
        dueDate: credit.dueDate,
        occurredAt: credit.occurredAt,
      });
    }
  }
  return open;
}

/** True when any open deni is past its due date (the due date itself is not overdue). */
export function isOverdue(
  customerId: Id,
  txns: readonly Txn[],
  today: Day,
): boolean {
  return openDeni(customerId, txns).some(
    (d) => d.dueDate !== undefined && d.dueDate < today,
  );
}

export type DeniListRow = {
  customerId: Id;
  name: string;
  balance: Cents;
  earliestDue: Day | null;
  overdue: boolean;
};

/** Customers who owe money, with overdue amounts taken from overdue open credits only. */
export function deniList(
  customers: readonly Customer[],
  txns: readonly Txn[],
  today: Day,
): {
  totalOutstanding: Cents;
  overdueTotal: Cents;
  rows: DeniListRow[];
} {
  const rows = customers
    .flatMap((customer) => {
      const balance = customerBalance(customer.id, txns);
      if (balance <= 0) return [];
      const open = openDeni(customer.id, txns);
      const dueDates = open
        .flatMap((deni) => (deni.dueDate ? [deni.dueDate] : []))
        .sort();
      return [
        {
          customerId: customer.id,
          name: customer.name,
          balance,
          earliestDue: dueDates[0] ?? null,
          overdue: isOverdue(customer.id, txns, today),
        },
      ];
    })
    .sort(
      (a, b) => Number(b.overdue) - Number(a.overdue) || b.balance - a.balance,
    );
  const overdueTotal = customers.reduce(
    (sum, customer) =>
      sum +
      openDeni(customer.id, txns).reduce(
        (openTotal, deni) =>
          openTotal +
          (deni.dueDate !== undefined && deni.dueDate < today
            ? deni.remaining
            : 0),
        0,
      ),
    0,
  );

  return {
    totalOutstanding: rows.reduce((sum, row) => sum + row.balance, 0),
    overdueTotal,
    rows,
  };
}

export type CustomerLedgerRow = {
  txnId: Id;
  at: IsoTime;
  type: Txn["type"];
  amount: Cents;
  delta: Cents;
  runningBalance: Cents;
  voided: boolean;
  broughtForward: boolean;
  paymentMethod: Txn["paymentMethod"];
  externalReference: string | undefined;
};

/** Customer transactions, newest first, with running balances that reconcile to customerBalance. */
export function customerLedgerRows(
  customerId: Id,
  txns: readonly Txn[],
): CustomerLedgerRow[] {
  const records = txns
    .filter((txn) => txn.customerId === customerId)
    .sort(oldestFirst);
  const voidedIds = new Set(
    records.flatMap((txn) =>
      txn.type === "void" && txn.voidsTxnId ? [txn.voidsTxnId] : [],
    ),
  );
  let runningBalance = 0;
  const chronological = records.map((txn) => {
    const voided = txn.type === "void" || voidedIds.has(txn.id);
    const delta = voided ? 0 : creditAmount(txn) - paymentAmount(txn);
    runningBalance += delta;
    return {
      txnId: txn.id,
      at: txn.occurredAt,
      type: txn.type,
      amount: Math.abs(creditAmount(txn) - paymentAmount(txn)),
      delta,
      runningBalance,
      voided,
      broughtForward:
        txn.type === "opening_balance" && txn.source === "onboarding",
      paymentMethod: txn.paymentMethod,
      externalReference: txn.externalReference,
    };
  });
  return chronological.reverse();
}

/** What the merchant owes a supplier. R0 has only brought-forward supplier deni. */
export function supplierOwed(supplierId: Id, txns: readonly Txn[]): Cents {
  return activeTxns(txns)
    .filter((t) => t.type === "opening_balance" && t.supplierId === supplierId)
    .reduce((sum, t) => sum + t.totalAmount, 0);
}

/** Total non-voided notebook opening balances for one party type. */
export function broughtForwardTotal(
  party: "customer" | "supplier",
  txns: readonly Txn[],
): Cents {
  const partyId = party === "customer" ? "customerId" : "supplierId";
  return activeTxns(txns)
    .filter(
      (txn) =>
        txn.type === "opening_balance" &&
        txn.source === "onboarding" &&
        txn[partyId],
    )
    .reduce((sum, txn) => sum + txn.totalAmount, 0);
}

/** Notebook opening balances, split by party type. */
export function broughtForwardTotals(txns: readonly Txn[]): {
  customers: Cents;
  suppliers: Cents;
} {
  return {
    customers: broughtForwardTotal("customer", txns),
    suppliers: broughtForwardTotal("supplier", txns),
  };
}

/** Per-item quantity entered as opening stock in the notebook. */
export function broughtForwardStock(
  txns: readonly Txn[],
  lines: readonly TxnLine[],
): Map<Id, number> {
  const activeStockIds = new Set(
    activeTxns(txns)
      .filter(
        (txn) => txn.type === "stock_adjustment" && txn.source === "onboarding",
      )
      .map((txn) => txn.id),
  );
  const thousandths = new Map<Id, number>();
  for (const line of lines) {
    if (
      line.itemId &&
      line.itemKind === "goods" &&
      activeStockIds.has(line.txnId)
    ) {
      thousandths.set(
        line.itemId,
        (thousandths.get(line.itemId) ?? 0) + Math.round(line.quantity * 1000),
      );
    }
  }
  return new Map(
    [...thousandths].map(([itemId, quantity]) => [itemId, quantity / 1000]),
  );
}

/** Goods on hand: stock adjustments minus goods sold, to 3 decimals. */
export function stockOnHand(
  itemId: Id,
  txns: readonly Txn[],
  lines: readonly TxnLine[],
): number {
  const types = new Map(activeTxns(txns).map((t) => [t.id, t.type]));
  let thousandths = 0;
  for (const l of lines) {
    if (l.itemId !== itemId || l.itemKind !== "goods") continue;
    const type = types.get(l.txnId);
    const qty = Math.round(l.quantity * 1000);
    if (type === "stock_adjustment") thousandths += qty;
    else if (type === "sale") thousandths -= qty;
  }
  return thousandths / 1000;
}

function creditAmount(t: Txn): Cents {
  if (t.type === "sale") return t.totalAmount - t.amountPaid;
  if (t.type === "opening_balance" && t.customerId) return t.totalAmount;
  return 0;
}

function paymentAmount(t: Txn): Cents {
  return t.type === "customer_payment" ? t.totalAmount : 0;
}

function oldestFirst(a: Txn, b: Txn): number {
  return (
    a.occurredAt.localeCompare(b.occurredAt) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

function newestFirst(a: Txn, b: Txn): number {
  return oldestFirst(b, a);
}
