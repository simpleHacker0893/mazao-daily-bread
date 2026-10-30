import type { Cents, Day, Id, IsoTime, Txn, TxnLine } from "./types";

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

/** What the merchant owes a supplier. R0 has only brought-forward supplier deni. */
export function supplierOwed(supplierId: Id, txns: readonly Txn[]): Cents {
  let balance = 0;
  for (const t of activeTxns(txns)) {
    if (t.supplierId !== supplierId) continue;
    balance += supplierCreditAmount(t) - supplierPaymentAmount(t);
  }
  return balance;
}

/**
 * The supplier's unpaid credits (what the merchant owes), oldest first.
 * Payments settle the oldest credit first (FIFO); an overpayment carries forward
 * and settles later credits.
 */
export function openSupplierDeni(
  supplierId: Id,
  txns: readonly Txn[],
): OpenDeni[] {
  const mine = activeTxns(txns).filter((t) => t.supplierId === supplierId);
  let paid = mine.reduce((sum, t) => sum + supplierPaymentAmount(t), 0);
  const open: OpenDeni[] = [];
  const credits = mine
    .filter((t) => supplierCreditAmount(t) > 0)
    .sort(oldestFirst);
  for (const credit of credits) {
    const owed = supplierCreditAmount(credit);
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

/** True when any open supplier deni is past its due date. */
export function isSupplierOverdue(
  supplierId: Id,
  txns: readonly Txn[],
  today: Day,
): boolean {
  return openSupplierDeni(supplierId, txns).some(
    (d) => d.dueDate !== undefined && d.dueDate < today,
  );
}

/** Suppliers with deni due within `days` days (including today). */
export function supplierDueWithin(
  txns: readonly Txn[],
  today: Day,
  days: number,
): Id[] {
  const cutoff = addDays(today, days);
  const suppliersWithBalance = new Set<string>();
  for (const t of activeTxns(txns)) {
    if (!t.supplierId) continue;
    const owed = supplierOwed(t.supplierId, txns);
    if (owed <= 0) continue;
    const open = openSupplierDeni(t.supplierId, txns);
    if (open.some((d) => d.dueDate !== undefined && d.dueDate <= cutoff)) {
      suppliersWithBalance.add(t.supplierId);
    }
  }
  return Array.from(suppliersWithBalance);
}

/** Goods on hand: stock adjustments + purchase goods lines − sale goods lines, to 3 decimals. */
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
    else if (type === "purchase") thousandths += qty;
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

function supplierCreditAmount(t: Txn): Cents {
  if (t.type === "purchase") return t.totalAmount - t.amountPaid;
  if (t.type === "opening_balance" && t.supplierId) return t.totalAmount;
  return 0;
}

function supplierPaymentAmount(t: Txn): Cents {
  return t.type === "supplier_payment" ? t.totalAmount : 0;
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

function addDays(day: Day, n: number): Day {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
  const dayStart = Date.parse(`${day}T00:00:00.000Z`) - EAT_OFFSET_MS;
  return new Date(dayStart + n * DAY_MS + EAT_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}
