import { describe, expect, it } from "vitest";
import { nairobiDayRange } from "./dates";
import { daySummary, rangeSummary } from "./summary";
import { at, line, txn, voidOf } from "./test-fixtures";

const today = nairobiDayRange("2026-10-26");

/** The DOMAIN.md worked example: two sales and one expense on one day. */
function workedExample() {
  const sukuma = txn({
    type: "sale",
    totalAmount: 15000,
    amountPaid: 15000,
    paymentMethod: "cash",
  });
  const trip = txn({
    type: "sale",
    totalAmount: 20000,
    amountPaid: 20000,
    paymentMethod: "mpesa",
    occurredAt: at(30),
  });
  const ushuru = txn({
    type: "expense",
    totalAmount: 5000,
    amountPaid: 5000,
    paymentMethod: "cash",
    expenseCategory: "ushuru",
    occurredAt: at(60),
  });
  const lines = [
    line({
      txnId: sukuma.id,
      itemId: "sukuma",
      quantity: 3,
      unitPrice: 5000,
      unitCost: 3000,
    }),
    line({
      txnId: trip.id,
      itemId: "trip",
      itemKind: "service",
      quantity: 1,
      unit: "trip",
      unitPrice: 20000,
      unitCost: 0,
    }),
  ];
  return { txns: [sukuma, trip, ushuru], lines, sukuma };
}

describe("daySummary", () => {
  it("gives the worked example: Faida Halisi 210", () => {
    const { txns, lines } = workedExample();
    expect(daySummary(txns, lines, today)).toEqual({
      sales: 35000,
      cogs: 9000,
      expenses: 5000,
      faidaHalisi: 21000,
      cashIn: 15000,
      mpesaIn: 20000,
      otherIn: 0,
    });
  });

  it("does not count a brought-forward deni as sales (Otieno 500)", () => {
    const { txns, lines } = workedExample();
    const otieno = txn({
      type: "opening_balance",
      customerId: "otieno",
      totalAmount: 50000,
      source: "onboarding",
    });
    const opening = txn({ type: "stock_adjustment", source: "onboarding" });
    const stock = line({ txnId: opening.id, itemId: "mayai", quantity: 10 });
    expect(
      daySummary([...txns, otieno, opening], [...lines, stock], today),
    ).toMatchObject({ sales: 35000, cogs: 9000, faidaHalisi: 21000 });
    expect(daySummary([otieno], [], today).sales).toBe(0);
  });

  it("counts a credit sale in sales but only the paid part as money in", () => {
    const credit = txn({
      type: "sale",
      customerId: "wanjiku",
      totalAmount: 30000,
      amountPaid: 10000,
      paymentMethod: "cash",
    });
    const pays = txn({
      type: "customer_payment",
      customerId: "wanjiku",
      totalAmount: 15000,
      amountPaid: 15000,
      paymentMethod: "other",
    });
    const lines = [
      line({ txnId: credit.id, quantity: 1, unitPrice: 30000, unitCost: 0 }),
    ];
    expect(daySummary([credit, pays], lines, today)).toMatchObject({
      sales: 30000,
      cashIn: 10000,
      otherIn: 15000,
    });
  });

  it("drops voided records", () => {
    const { txns, lines, sukuma } = workedExample();
    expect(daySummary([...txns, voidOf(sukuma)], lines, today)).toMatchObject({
      sales: 20000,
      cogs: 0,
      cashIn: 0,
      faidaHalisi: 15000,
    });
  });

  it("counts only records inside the day", () => {
    const { lines } = workedExample();
    const yesterday = txn({
      type: "expense",
      totalAmount: 999,
      amountPaid: 999,
      paymentMethod: "cash",
      occurredAt: "2026-10-25T20:59:00.000Z",
    });
    expect(daySummary([yesterday], lines, today).expenses).toBe(0);
  });
});

describe("rangeSummary", () => {
  function workedExampleWithPurchases() {
    const { txns, lines } = workedExample();
    // Add a cash purchase of 3000 (paid 3000)
    const purchase = txn({
      type: "purchase",
      totalAmount: 3000,
      amountPaid: 3000,
      paymentMethod: "cash",
      occurredAt: at(90),
    });
    // Add a supplier payment of 1000 (M-Pesa)
    const supplierPay = txn({
      type: "supplier_payment",
      supplierId: "kamau",
      totalAmount: 1000,
      amountPaid: 1000,
      paymentMethod: "mpesa",
      occurredAt: at(120),
    });
    return {
      txns: [...txns, purchase, supplierPay],
      lines,
    };
  }

  it("includes moneyOut from purchases, supplier payments, and expenses by method", () => {
    const { txns, lines } = workedExampleWithPurchases();
    const result = rangeSummary(txns, lines, today);
    // Original: cashIn 15000, mpesaIn 20000
    // New: cashOut = purchase 3000 (cash) + expense 5000 (cash) = 8000
    // mpesaOut = supplier payment 1000 (mpesa) = 1000
    expect(result).toMatchObject({
      sales: 35000,
      cogs: 9000,
      expenses: 5000,
      faidaHalisi: 21000,
      moneyFlow: {
        cashIn: 15000,
        mpesaIn: 20000,
        otherIn: 0,
        cashOut: 8000,
        mpesaOut: 1000,
        otherOut: 0,
      },
    });
  });

  it("purchase and supplier_payment do not affect Sales, COGS, Expenses, Faida Halisi", () => {
    const { txns, lines } = workedExampleWithPurchases();
    const result = rangeSummary(txns, lines, today);
    const { txns: origTxns, lines: origLines } = workedExample();
    const origResult = rangeSummary(origTxns, origLines, today);
    // Sales, COGS, Expenses, Faida Halisi should be unchanged
    expect(result.sales).toBe(origResult.sales);
    expect(result.cogs).toBe(origResult.cogs);
    expect(result.expenses).toBe(origResult.expenses);
    expect(result.faidaHalisi).toBe(origResult.faidaHalisi);
  });

  it("purchase with partial payment only counts paid amount as moneyOut", () => {
    const purchase = txn({
      type: "purchase",
      totalAmount: 5000,
      amountPaid: 2000,
      paymentMethod: "cash",
    });
    const result = rangeSummary([purchase], [], today);
    expect(result.moneyFlow).toMatchObject({
      cashIn: 0,
      mpesaIn: 0,
      otherIn: 0,
      cashOut: 2000,
      mpesaOut: 0,
      otherOut: 0,
    });
  });

  it("purchase with zero paid (deni) has no moneyOut", () => {
    const purchase = txn({
      type: "purchase",
      totalAmount: 5000,
      amountPaid: 0,
      paymentMethod: null,
    });
    const result = rangeSummary([purchase], [], today);
    expect(result.moneyFlow.cashOut).toBe(0);
    expect(result.moneyFlow.mpesaOut).toBe(0);
    expect(result.moneyFlow.otherOut).toBe(0);
  });

  it("void purchase reverses moneyOut", () => {
    const purchase = txn({
      type: "purchase",
      totalAmount: 3000,
      amountPaid: 3000,
      paymentMethod: "cash",
    });
    const voided = voidOf(purchase);
    const result = rangeSummary([purchase, voided], [], today);
    expect(result.moneyFlow.cashOut).toBe(0);
  });

  it("daySummary is a special case of rangeSummary for moneyIn", () => {
    const { txns, lines } = workedExample();
    const day = daySummary(txns, lines, today);
    const range = rangeSummary(txns, lines, today);
    expect(day.sales).toBe(range.sales);
    expect(day.cogs).toBe(range.cogs);
    expect(day.expenses).toBe(range.expenses);
    expect(day.faidaHalisi).toBe(range.faidaHalisi);
    expect(day.cashIn).toBe(range.moneyFlow.cashIn);
    expect(day.mpesaIn).toBe(range.moneyFlow.mpesaIn);
    expect(day.otherIn).toBe(range.moneyFlow.otherIn);
  });
});
