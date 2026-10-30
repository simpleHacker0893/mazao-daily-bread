import { describe, expect, it } from "vitest";
import {
  formatNairobiDate,
  formatNairobiTime,
  nairobiDayOf,
  nairobiDayRange,
} from "./dates";
import {
  type DaySummaryStrings,
  dayReport,
  daySummary,
  formatDaySummaryText,
  moneyInShares,
  supplierDeniTotal,
} from "./summary";
import { at, line, txn, voidOf } from "./test-fixtures";
import type { Customer } from "./types";

const today = nairobiDayRange("2026-10-26");

const customers: Customer[] = ["wanjiku", "otieno"].map((id) => ({
  id,
  businessId: "biz-1",
  name: id === "wanjiku" ? "Wanjiku" : "Otieno",
  isFavorite: false,
  createdBy: "profile-1",
  createdAt: at(),
  updatedAt: at(),
}));

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
  return { txns: [ushuru, trip, sukuma], lines, sukuma, trip, ushuru };
}

const strings: DaySummaryStrings = {
  sales: "Sales",
  cogs: "Cost of goods",
  expenses: "Expenses",
  faidaHalisi: "Faida Halisi",
  cashIn: "Cash in",
  mpesaIn: "M-Pesa in",
  deniGiven: "Deni given",
  customers: "Customers",
  walkIn: "Walk-in",
  bought: "bought",
  paid: "paid",
  owes: "owes",
  owesNothing: "owes nothing now",
  inCredit: "in credit",
};

describe("dayReport", () => {
  it("worked example: totals equal daySummary, 3 entries in time order, one walk-in line", () => {
    const { txns, lines, sukuma, trip, ushuru } = workedExample();
    const report = dayReport(txns, lines, customers, today);
    expect(report.totals).toEqual(daySummary(txns, lines, today));
    expect(report.totals).toMatchObject({
      sales: 35000,
      cogs: 9000,
      expenses: 5000,
      faidaHalisi: 21000,
      cashIn: 15000,
      mpesaIn: 20000,
    });
    expect(report.entries.map((e) => e.txnId)).toEqual([
      sukuma.id,
      trip.id,
      ushuru.id,
    ]);
    expect(report.entries.every((e) => e.countsInTotals)).toBe(true);
    expect(report.customers).toHaveLength(1);
    expect(report.customers[0]).toMatchObject({
      customerId: null,
      name: null,
      bought: 35000,
      paid: 35000,
    });
    expect(report.deniGiven).toBe(0);
  });

  it("deni scenario: Wanjiku bought 300, paid 250, owes 50; voiding the payment makes her owe 200", () => {
    const sale = txn({
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
      paymentMethod: "mpesa",
      occurredAt: at(30),
    });
    const lines = [
      line({ txnId: sale.id, quantity: 1, unitPrice: 30000, unitCost: 0 }),
    ];

    const before = dayReport([sale, pays], lines, customers, today);
    expect(before.customers[0]).toMatchObject({
      name: "Wanjiku",
      bought: 30000,
      paid: 25000,
      balanceNow: 5000,
      standing: { kind: "owes", amount: 5000 },
    });
    expect(before.deniGiven).toBe(20000);
    expect(before.paymentsReceived).toBe(15000);

    const after = dayReport(
      [sale, pays, voidOf(pays, 40)],
      lines,
      customers,
      today,
    );
    expect(after.customers[0]).toMatchObject({
      paid: 10000,
      balanceNow: 20000,
      standing: { kind: "owes", amount: 20000 },
    });
    const payment = after.entries.find((e) => e.txnId === pays.id);
    expect(payment).toMatchObject({ voided: true, countsInTotals: false });
    expect(after.entries.some((e) => e.kind === "void")).toBe(true);
    expect(after.totals).toEqual(
      daySummary([sale, pays, voidOf(pays, 40)], lines, today),
    );
    expect(after.paymentsReceived).toBe(0);
  });

  it("shows credit with a non-negative amount when a customer overpays", () => {
    const owed = txn({
      type: "opening_balance",
      customerId: "otieno",
      totalAmount: 5000,
      source: "onboarding",
      occurredAt: "2026-10-20T07:00:00.000Z",
    });
    const pays = txn({
      type: "customer_payment",
      customerId: "otieno",
      totalAmount: 15000,
      amountPaid: 15000,
      paymentMethod: "cash",
    });
    const report = dayReport([owed, pays], [], customers, today);
    expect(report.customers[0]?.standing).toEqual({
      kind: "credit",
      amount: 10000,
    });
  });

  it("lists brought-forward records without counting them", () => {
    const otieno = txn({
      type: "opening_balance",
      customerId: "otieno",
      totalAmount: 50000,
      source: "onboarding",
    });
    const opening = txn({
      type: "stock_adjustment",
      source: "onboarding",
      occurredAt: at(1),
    });
    const stock = line({ txnId: opening.id, itemId: "mayai", quantity: 10 });
    const report = dayReport([otieno, opening], [stock], customers, today);
    expect(report.entries.map((e) => e.kind)).toEqual([
      "brought_forward",
      "brought_forward",
    ]);
    expect(report.entries.every((e) => !e.countsInTotals)).toBe(true);
    expect(report.entries[1]?.lines[0]).toMatchObject({
      itemId: "mayai",
      quantity: 10,
    });
    expect(report.totals.sales).toBe(0);
    expect(report.totals.faidaHalisi).toBe(0);
    expect(report.customers).toEqual([]);
  });

  it("lists a void made today of yesterday's sale without changing today's totals", () => {
    const yesterday = "2026-10-25T08:00:00.000Z";
    const sale = txn({
      type: "sale",
      totalAmount: 8000,
      amountPaid: 8000,
      paymentMethod: "cash",
      occurredAt: yesterday,
    });
    const lines = [
      line({ txnId: sale.id, quantity: 1, unitPrice: 8000, unitCost: 0 }),
    ];
    const voidToday = voidOf(sale, 0);
    const txns = [sale, voidToday];
    const report = dayReport(txns, lines, customers, today);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]).toMatchObject({
      kind: "void",
      voidsEarlierDay: "2026-10-25",
      voidsType: "sale",
      amount: 8000,
      countsInTotals: false,
    });
    expect(report.totals.sales).toBe(0);
    expect(daySummary(txns, lines, nairobiDayRange("2026-10-25")).sales).toBe(
      0,
    );
    expect(daySummary([sale], lines, nairobiDayRange("2026-10-25")).sales).toBe(
      8000,
    );
  });

  it("does not flag a same-day void as an earlier-day change", () => {
    const { txns, sukuma, lines } = workedExample();
    const report = dayReport(
      [...txns, voidOf(sukuma, 5)],
      lines,
      customers,
      today,
    );
    const entry = report.entries.find((e) => e.kind === "void");
    expect(entry?.voidsEarlierDay).toBeNull();
  });

  it("counts a record at 00:30 EAT in that EAT day", () => {
    const early = txn({
      type: "expense",
      totalAmount: 700,
      amountPaid: 700,
      paymentMethod: "cash",
      occurredAt: "2026-10-25T21:30:00.000Z", // 00:30 EAT on the 26th
    });
    const report = dayReport([early], [], customers, today);
    expect(report.entries).toHaveLength(1);
    expect(report.totals.expenses).toBe(700);
    expect(
      dayReport([early], [], customers, nairobiDayRange("2026-10-25")).entries,
    ).toHaveLength(0);
  });

  it("keeps the walk-in line last and named customers by name", () => {
    const walk = txn({
      type: "sale",
      totalAmount: 1000,
      amountPaid: 1000,
      paymentMethod: "cash",
    });
    const named = txn({
      type: "sale",
      customerId: "wanjiku",
      totalAmount: 2000,
      amountPaid: 2000,
      paymentMethod: "cash",
      occurredAt: at(5),
    });
    const report = dayReport([walk, named], [], customers, today);
    expect(report.customers.map((c) => c.name)).toEqual(["Wanjiku", null]);
  });
});

describe("moneyInShares", () => {
  it("returns fractions that sum to 1", () => {
    const shares = moneyInShares({ cashIn: 15000, mpesaIn: 20000, otherIn: 0 });
    expect(shares.cash + shares.mpesa + shares.other).toBeCloseTo(1);
    expect(shares.mpesa).toBeCloseTo(20000 / 35000);
  });

  it("returns zeros, not NaN, when nothing came in", () => {
    expect(moneyInShares({ cashIn: 0, mpesaIn: 0, otherIn: 0 })).toEqual({
      cash: 0,
      mpesa: 0,
      other: 0,
    });
  });
});

describe("supplierDeniTotal", () => {
  const base: Customer = {
    id: "base",
    businessId: "biz-1",
    name: "Supplier",
    isFavorite: false,
    createdBy: "profile-1",
    createdAt: at(),
    updatedAt: at(),
  };
  it("sums brought-forward supplier deni and ignores voided ones", () => {
    const a = txn({
      type: "opening_balance",
      supplierId: "s1",
      totalAmount: 30000,
      source: "onboarding",
    });
    const b = txn({
      type: "opening_balance",
      supplierId: "s2",
      totalAmount: 12000,
      source: "onboarding",
    });
    const suppliers = ["s1", "s2"].map((id) => ({ ...base, id }));
    expect(supplierDeniTotal(suppliers, [a, b])).toBe(42000);
    expect(supplierDeniTotal(suppliers, [a, b, voidOf(b)])).toBe(30000);
    expect(supplierDeniTotal([], [a])).toBe(0);
  });
});

describe("formatDaySummaryText", () => {
  const business = {
    businessName: "Achieng's Greens",
    dateLabel: "Mon 26 Oct 2026",
  };

  function report() {
    const { txns, lines } = workedExample();
    const credit = txn({
      type: "sale",
      customerId: "wanjiku",
      totalAmount: 30000,
      amountPaid: 10000,
      paymentMethod: "cash",
      occurredAt: at(90),
    });
    return dayReport(
      [...txns, credit],
      [
        ...lines,
        line({ txnId: credit.id, quantity: 1, unitPrice: 30000, unitCost: 0 }),
      ],
      customers,
      today,
    );
  }

  it("contains the Faida Halisi figure and the required lines", () => {
    const text = formatDaySummaryText(report(), business, strings);
    expect(text).toContain("Achieng's Greens");
    expect(text).toContain("Mon 26 Oct 2026");
    expect(text).toContain("Faida Halisi: KES 510");
    expect(text).toContain("Sales: KES 650");
    expect(text).toContain("Cost of goods: KES 90");
    expect(text).toContain("Expenses: KES 50");
    expect(text).toContain("Cash in: KES 250");
    expect(text).toContain("M-Pesa in: KES 200");
    expect(text).toContain("Deni given: KES 200");
  });

  it("gives KES 210 for the worked example", () => {
    const { txns, lines } = workedExample();
    const text = formatDaySummaryText(
      dayReport(txns, lines, customers, today),
      business,
      strings,
    );
    expect(text).toContain("Faida Halisi: KES 210");
  });

  it("leaves out customer names by default and includes them when asked", () => {
    const without = formatDaySummaryText(report(), business, strings);
    expect(without).not.toContain("Wanjiku");
    expect(without).not.toContain("Walk-in");
    const withNames = formatDaySummaryText(report(), business, strings, {
      includeCustomerNames: true,
    });
    expect(withNames).toContain(
      "Wanjiku: bought KES 300, paid KES 100, owes KES 200",
    );
    expect(withNames).toContain("Walk-in");
  });

  it("has no markdown, emoji or dashes", () => {
    const text = formatDaySummaryText(report(), business, strings, {
      includeCustomerNames: true,
    });
    expect(text).not.toMatch(/[\u2013\u2014*#]/u);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("omits the business line when no name is set", () => {
    const text = formatDaySummaryText(
      report(),
      { businessName: "  ", dateLabel: "Mon 26 Oct 2026" },
      strings,
    );
    expect(text.startsWith("Mon 26 Oct 2026")).toBe(true);
  });
});

describe("date helpers", () => {
  it("formats a Nairobi day in English", () => {
    expect(formatNairobiDate("2026-10-24", "en")).toBe("Sat 24 Oct 2026");
    expect(formatNairobiDate("2026-10-26", "en")).toBe("Mon 26 Oct 2026");
  });

  it("formats a Nairobi day in Kiswahili without throwing", () => {
    const label = formatNairobiDate("2026-10-24", "sw");
    expect(label).toContain("24");
    expect(label).toContain("2026");
  });

  it("reads the EAT day and time of an instant", () => {
    expect(nairobiDayOf("2026-10-25T21:30:00.000Z")).toBe("2026-10-26");
    expect(formatNairobiTime("2026-10-25T21:30:00.000Z")).toBe("00:30");
    expect(formatNairobiTime(at(0))).toBe("10:00");
  });
});
