import { describe, expect, it } from "vitest";
import { nairobiDayRange } from "./dates";
import { daySummary } from "./summary";
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
