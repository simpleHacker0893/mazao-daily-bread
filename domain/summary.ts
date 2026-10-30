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

export type MoneyFlow = {
  cashIn: Cents;
  mpesaIn: Cents;
  otherIn: Cents;
  cashOut: Cents;
  mpesaOut: Cents;
  otherOut: Cents;
};

export type RangeSummary = {
  sales: Cents;
  cogs: Cents;
  expenses: Cents;
  faidaHalisi: Cents;
  moneyFlow: MoneyFlow;
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

/**
 * A date range's numbers. Purchase and supplier_payment affect money out only;
 * Sales, COGS, Expenses, Faida Halisi formulas UNCHANGED (D-014).
 * Purchase never touches them.
 */
export function rangeSummary(
  txns: readonly Txn[],
  lines: readonly TxnLine[],
  range: DayRange,
): RangeSummary {
  const day = daySummary(txns, lines, range);

  const active = activeTxns(txns).filter((t) => isInRange(t.occurredAt, range));
  const moneyOut: { cash: Cents; mpesa: Cents; other: Cents } = {
    cash: 0,
    mpesa: 0,
    other: 0,
  };

  for (const t of active) {
    if (t.type === "purchase" && t.paymentMethod && t.amountPaid > 0) {
      moneyOut[t.paymentMethod] += t.amountPaid;
    } else if (t.type === "supplier_payment" && t.paymentMethod) {
      moneyOut[t.paymentMethod] += t.totalAmount;
    } else if (t.type === "expense" && t.paymentMethod) {
      moneyOut[t.paymentMethod] += t.totalAmount;
    }
  }

  return {
    sales: day.sales,
    cogs: day.cogs,
    expenses: day.expenses,
    faidaHalisi: day.faidaHalisi,
    moneyFlow: {
      cashIn: day.cashIn,
      mpesaIn: day.mpesaIn,
      otherIn: day.otherIn,
      cashOut: moneyOut.cash,
      mpesaOut: moneyOut.mpesa,
      otherOut: moneyOut.other,
    },
  };
}
