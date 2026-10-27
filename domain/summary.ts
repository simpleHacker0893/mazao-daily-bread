import { type DayRange, isInRange } from "./dates";
import { activeTxns } from "./ledger";
import { lineTotal } from "./money";
import type { Cents, Txn, TxnLine } from "./types";

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
