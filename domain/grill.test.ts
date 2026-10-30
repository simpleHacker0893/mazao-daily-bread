import { describe, expect, it } from "vitest";
import { nairobiDayRange } from "./dates";
import { type GrillContext, type GrillInput, runGrill } from "./grill";
import { defaultProfile, type OperatingProfile } from "./operating-profile";
import { at, item, line, txn } from "./test-fixtures";
import type { DraftPurchase, DraftSale, DraftSupplierPayment } from "./types";

const sukuma = item({
  name: "Sukuma wiki",
  sellingPrice: 5000,
  buyingPrice: 3000,
});
const mayai = item({
  name: "Mayai",
  unit: "tray",
  allowsFractional: false,
  sellingPrice: 45000,
  buyingPrice: 50000,
});

function ctx(overrides: Partial<GrillContext> = {}): GrillContext {
  return {
    items: [sukuma, mayai],
    txns: [],
    lines: [],
    profile: defaultProfile(),
    now: new Date(at(0)),
    ...overrides,
  };
}

function sale(fields: Partial<DraftSale> = {}): GrillInput {
  return {
    type: "sale",
    draft: {
      lines: [
        {
          itemId: sukuma.id,
          itemKind: "goods",
          description: "Sukuma wiki",
          quantity: 3,
          unit: "kilo",
          unitPrice: 5000,
        },
      ],
      totalAmount: 15000,
      amountPaid: 15000,
      paymentMethod: "cash",
      ...fields,
    },
  };
}

function purchase(fields: Partial<DraftPurchase> = {}): GrillInput {
  return {
    type: "purchase",
    draft: {
      lines: [
        {
          itemId: sukuma.id,
          quantity: 2,
          unit: "kilo",
          unitPrice: 3000,
        },
      ],
      totalAmount: 6000,
      amountPaid: 6000,
      paymentMethod: "cash",
      supplierId: "kamau",
      ...fields,
    },
  };
}

function supplierPayment(
  fields: Partial<DraftSupplierPayment> = {},
): GrillInput {
  return {
    type: "supplier_payment",
    draft: {
      supplierId: "kamau",
      amount: 1000,
      paymentMethod: "cash",
      ...fields,
    },
  };
}

function sukumaLine(quantity: number, unitPrice: number) {
  return {
    itemId: sukuma.id,
    itemKind: "goods" as const,
    description: "Sukuma wiki",
    quantity,
    unit: "kilo",
    unitPrice,
  };
}

/** `qty` sukuma in stock. */
function stocked(qty = 10): Pick<GrillContext, "txns" | "lines"> {
  const opening = txn({ type: "stock_adjustment", source: "onboarding" });
  return {
    txns: [opening],
    lines: [line({ txnId: opening.id, itemId: sukuma.id, quantity: qty })],
  };
}

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe("hard errors (cannot be overridden)", () => {
  it("SCHEMA fires on a draft that does not parse, and stops there", () => {
    const result = runGrill(sale({ totalAmount: -1 }), ctx(stocked()));
    expect(codes(result.hardErrors)).toEqual(["SCHEMA"]);
    expect(result.issues).toEqual([]);
  });

  it("ARITHMETIC fires when the lines do not add up to the total", () => {
    const result = runGrill(
      sale({ totalAmount: 14000, amountPaid: 14000 }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).toEqual(["ARITHMETIC"]);
  });

  it("PAID_EXCEEDS_TOTAL fires when more is paid than the total", () => {
    const result = runGrill(sale({ amountPaid: 16000 }), ctx(stocked()));
    expect(codes(result.hardErrors)).toContain("PAID_EXCEEDS_TOTAL");
  });

  it("DENI_NEEDS_CUSTOMER is a hard error for a deni with no customer", () => {
    const result = runGrill(sale({ amountPaid: 5000 }), ctx(stocked()));
    expect(codes(result.hardErrors)).toEqual(["DENI_NEEDS_CUSTOMER"]);
    expect(result.hardErrors[0]?.severity).toBe("block");
  });

  it("a deni with a customer, existing or new, has no hard errors", () => {
    for (const party of [
      { customerId: "wanjiku" },
      { newCustomer: { name: "Wanjiku" } },
    ]) {
      const result = runGrill(
        sale({ amountPaid: 5000, ...party }),
        ctx(stocked()),
      );
      expect(result.hardErrors).toEqual([]);
    }
  });

  it("a clean cash sale has no hard errors and no issues", () => {
    expect(runGrill(sale(), ctx(stocked()))).toEqual({
      hardErrors: [],
      issues: [],
    });
  });
});

describe("NEGATIVE_STOCK", () => {
  it("fires at warn when a sale takes more than is on hand (AC-06)", () => {
    const opening = txn({ type: "stock_adjustment" });
    const sold = txn({ type: "sale" });
    const result = runGrill(
      sale({
        lines: [sukumaLine(8, 5000)],
        totalAmount: 40000,
        amountPaid: 40000,
      }),
      ctx({
        txns: [opening, sold],
        lines: [
          line({ txnId: opening.id, itemId: sukuma.id, quantity: 10 }),
          line({ txnId: sold.id, itemId: sukuma.id, quantity: 3 }),
        ],
      }),
    );
    expect(result.issues).toEqual([
      {
        code: "NEGATIVE_STOCK",
        severity: "warn",
        messageKey: "ledger.grill.negativeStock",
        lineIndex: 0,
      },
    ]);
  });

  it("does not fire with enough stock, nor for service lines", () => {
    expect(runGrill(sale(), ctx(stocked(3))).issues).toEqual([]);
    const service = runGrill(
      sale({
        lines: [
          {
            itemKind: "service",
            description: "Trip",
            quantity: 1,
            unit: "trip",
            unitPrice: 20000,
          },
        ],
        totalAmount: 20000,
        amountPaid: 20000,
      }),
      ctx(),
    );
    expect(service.issues).toEqual([]);
  });

  it("takes its level from the profile", () => {
    const profile: OperatingProfile = {
      ...defaultProfile(),
      rules: { ...defaultProfile().rules, negativeStock: "block" },
    };
    const result = runGrill(sale(), ctx({ profile }));
    expect(result.issues[0]).toMatchObject({
      code: "NEGATIVE_STOCK",
      severity: "block",
    });
  });
});

describe("BELOW_COST and PRICE_VARIANCE", () => {
  const priced = (unitPrice: number) =>
    runGrill(
      sale({
        lines: [sukumaLine(1, unitPrice)],
        totalAmount: unitPrice,
        amountPaid: unitPrice,
      }),
      ctx(stocked()),
    );

  it("BELOW_COST fires when a goods line sells under its buying price", () => {
    expect(codes(priced(2500).issues)).toContain("BELOW_COST");
    expect(codes(priced(3000).issues)).not.toContain("BELOW_COST");
  });

  it("PRICE_VARIANCE fires above 30% from the usual price, not at 30%", () => {
    expect(codes(priced(6600).issues)).toEqual(["PRICE_VARIANCE"]);
    expect(priced(6500).issues).toEqual([]);
  });
});

describe("POSSIBLE_DUPLICATE", () => {
  const earlier = txn({
    type: "sale",
    customerId: "wanjiku",
    totalAmount: 15000,
    amountPaid: 15000,
    occurredAt: at(-5),
  });
  const withEarlier = () => {
    const stock = stocked();
    return { ...stock, txns: [...stock.txns, earlier] };
  };

  it("fires for the same type, customer and total within 10 minutes", () => {
    const result = runGrill(
      sale({ customerId: "wanjiku" }),
      ctx(withEarlier()),
    );
    expect(codes(result.issues)).toEqual(["POSSIBLE_DUPLICATE"]);
  });

  it("never fires without a customer, nor after 10 minutes", () => {
    expect(runGrill(sale(), ctx(withEarlier())).issues).toEqual([]);
    const later = runGrill(
      sale({ customerId: "wanjiku" }),
      ctx({ ...withEarlier(), now: new Date(at(6)) }),
    );
    expect(later.issues).toEqual([]);
  });

  it("fires for a repeated payment and a repeated opening balance", () => {
    const payment = txn({
      type: "customer_payment",
      customerId: "wanjiku",
      totalAmount: 5000,
      amountPaid: 5000,
    });
    const repeatPayment = runGrill(
      {
        type: "customer_payment",
        draft: { customerId: "wanjiku", amount: 5000, paymentMethod: "cash" },
      },
      ctx({ txns: [payment] }),
    );
    expect(codes(repeatPayment.issues)).toEqual(["POSSIBLE_DUPLICATE"]);

    const opening = txn({
      type: "opening_balance",
      supplierId: "kamau",
      totalAmount: 80000,
    });
    const repeatOpening = runGrill(
      {
        type: "opening_balance",
        draft: {
          party: "supplier",
          supplierId: "kamau",
          amount: 80000,
          source: "onboarding",
        },
      },
      ctx({ txns: [opening] }),
    );
    expect(codes(repeatOpening.issues)).toEqual(["POSSIBLE_DUPLICATE"]);
  });
});

describe("rule-to-type matrix (M7)", () => {
  it("a supplier opening balance has no hard errors and no deni-customer error", () => {
    const result = runGrill(
      {
        type: "opening_balance",
        draft: {
          party: "supplier",
          newSupplier: { name: "Kamau" },
          amount: 80000,
          source: "onboarding",
        },
      },
      ctx(),
    );
    expect(result).toEqual({ hardErrors: [], issues: [] });
  });

  it("opening stock with a buying price above the selling price raises nothing", () => {
    const result = runGrill(
      {
        type: "stock_adjustment",
        draft: { itemId: mayai.id, quantity: 10, source: "onboarding" },
      },
      ctx(),
    );
    expect(result).toEqual({ hardErrors: [], issues: [] });
  });

  it("a customer opening balance with a new customer passes; with both, SCHEMA", () => {
    const ok = runGrill(
      {
        type: "opening_balance",
        draft: {
          party: "customer",
          newCustomer: { name: "Otieno" },
          amount: 50000,
          source: "onboarding",
        },
      },
      ctx(),
    );
    expect(ok.hardErrors).toEqual([]);
    const both = runGrill(
      {
        type: "opening_balance",
        draft: {
          party: "customer",
          customerId: "c-1",
          newCustomer: { name: "Otieno" },
          amount: 50000,
          source: "onboarding",
        } as never,
      },
      ctx(),
    );
    expect(codes(both.hardErrors)).toEqual(["SCHEMA"]);
  });

  it("expenses and voids only run the schema check", () => {
    const expense = runGrill(
      {
        type: "expense",
        draft: {
          amount: 5000,
          paymentMethod: "cash",
          expenseCategory: "ushuru",
        },
      },
      ctx(),
    );
    expect(expense).toEqual({ hardErrors: [], issues: [] });
    expect(
      codes(runGrill({ type: "void", draft: { txnId: "" } }, ctx()).hardErrors),
    ).toEqual(["SCHEMA"]);
  });
});

describe("purchase grill rules", () => {
  it("DENI_NEEDS_SUPPLIER is a hard error for a deni purchase with no supplier", () => {
    const result = runGrill(
      purchase({
        amountPaid: 2000,
        supplierId: undefined,
        newSupplier: undefined,
      }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).toEqual(["DENI_NEEDS_SUPPLIER"]);
    expect(result.hardErrors[0]?.severity).toBe("block");
  });

  it("DENI_NEEDS_SUPPLIER throws even with override: true (handled in commit, not grill)", () => {
    const result = runGrill(
      purchase({
        amountPaid: 2000,
        supplierId: undefined,
        newSupplier: undefined,
      }),
      ctx(stocked()),
    );
    // Grill returns the hard error; commit layer decides whether to throw on override
    expect(
      result.hardErrors.some((e) => e.code === "DENI_NEEDS_SUPPLIER"),
    ).toBe(true);
  });

  it("a deni purchase with an existing supplier has no DENI_NEEDS_SUPPLIER error", () => {
    const result = runGrill(purchase({ amountPaid: 2000 }), ctx(stocked()));
    expect(codes(result.hardErrors)).not.toContain("DENI_NEEDS_SUPPLIER");
  });

  it("a deni purchase with a new supplier has no DENI_NEEDS_SUPPLIER error", () => {
    const result = runGrill(
      purchase({
        amountPaid: 2000,
        supplierId: undefined,
        newSupplier: { name: "New Supplier" },
      }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).not.toContain("DENI_NEEDS_SUPPLIER");
  });

  it("a fully paid purchase (amountPaid === totalAmount) needs no supplier", () => {
    const result = runGrill(
      purchase({
        amountPaid: 6000,
        supplierId: undefined,
        newSupplier: undefined,
      }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).not.toContain("DENI_NEEDS_SUPPLIER");
  });

  it("ARITHMETIC fires when purchase lines don't add up", () => {
    const result = runGrill(
      purchase({ totalAmount: 5000, amountPaid: 5000 }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).toContain("ARITHMETIC");
  });

  it("PAID_EXCEEDS_TOTAL fires when purchase amountPaid > totalAmount", () => {
    const result = runGrill(
      purchase({ totalAmount: 5000, amountPaid: 6000 }),
      ctx(stocked()),
    );
    expect(codes(result.hardErrors)).toContain("PAID_EXCEEDS_TOTAL");
  });

  it("BUYING_PRICE_CHANGED fires when line price differs from item.buyingPrice by > threshold", () => {
    // sukuma.buyingPrice = 3000, line = 3900 (30% increase)
    const result = runGrill(
      purchase({
        lines: [
          { itemId: sukuma.id, quantity: 1, unit: "kilo", unitPrice: 3900 },
        ],
        totalAmount: 3900,
        amountPaid: 3900,
        paymentMethod: "cash",
        supplierId: "kamau",
      }),
      ctx(stocked()),
    );
    expect(codes(result.issues)).toContain("BUYING_PRICE_CHANGED");
  });

  it("BUYING_PRICE_CHANGED does not fire when variance is at or below threshold (30%)", () => {
    // sukuma.buyingPrice = 3000, line = 3900 is exactly 30%, should NOT fire (threshold is > 30%)
    const result = runGrill(
      purchase({
        lines: [
          { itemId: sukuma.id, quantity: 1, unit: "kilo", unitPrice: 3900 },
        ],
        totalAmount: 3900,
        amountPaid: 3900,
        paymentMethod: "cash",
        supplierId: "kamau",
      }),
      ctx(stocked()),
    );
    expect(codes(result.issues)).not.toContain("BUYING_PRICE_CHANGED");
  });

  it("BUYING_PRICE_CHANGED fires at warn by default", () => {
    const result = runGrill(
      purchase({
        lines: [
          { itemId: sukuma.id, quantity: 1, unit: "kilo", unitPrice: 4000 },
        ],
        totalAmount: 4000,
        amountPaid: 4000,
        paymentMethod: "cash",
        supplierId: "kamau",
      }),
      ctx(stocked()),
    );
    const issue = result.issues.find((i) => i.code === "BUYING_PRICE_CHANGED");
    expect(issue?.severity).toBe("warn");
  });

  it("BUYING_PRICE_CHANGED fires at block when profile says block", () => {
    const profile: OperatingProfile = {
      ...defaultProfile(),
      rules: {
        ...defaultProfile().rules,
        buyingPriceChange: { mode: "block", thresholdPct: 10 },
      },
    };
    const result = runGrill(
      purchase({
        lines: [
          { itemId: sukuma.id, quantity: 1, unit: "kilo", unitPrice: 3400 },
        ],
        totalAmount: 3400,
        amountPaid: 3400,
        paymentMethod: "cash",
        supplierId: "kamau",
      }),
      ctx({ ...stocked(), profile }),
    );
    const issue = result.issues.find((i) => i.code === "BUYING_PRICE_CHANGED");
    expect(issue?.severity).toBe("block");
  });

  it("BUYING_PRICE_CHANGED does not fire for items without buyingPrice", () => {
    const noPriceItem = item({
      name: "New Item",
      buyingPrice: 0,
      sellingPrice: 5000,
    });
    const result = runGrill(
      purchase({
        lines: [
          {
            itemId: noPriceItem.id,
            quantity: 1,
            unit: "kilo",
            unitPrice: 10000,
          },
        ],
        totalAmount: 10000,
        amountPaid: 10000,
        paymentMethod: "cash",
        supplierId: "kamau",
      }),
      ctx({ ...ctx(), items: [noPriceItem] }),
    );
    expect(codes(result.issues)).not.toContain("BUYING_PRICE_CHANGED");
  });
});

describe("supplier_payment grill rules", () => {
  it("SUPPLIER_OVERPAID warns when payment exceeds current amount owed", () => {
    // Owed 2000, paying 3000
    const owed = txn({
      type: "purchase",
      supplierId: "kamau",
      totalAmount: 3000,
      amountPaid: 1000,
      paymentMethod: "cash",
    });
    const result = runGrill(
      supplierPayment({ amount: 3000 }),
      ctx({ txns: [owed] }),
    );
    expect(codes(result.issues)).toContain("SUPPLIER_OVERPAID");
  });

  it("SUPPLIER_OVERPAID does not fire when payment equals or is less than owed", () => {
    const owed = txn({
      type: "purchase",
      supplierId: "kamau",
      totalAmount: 3000,
      amountPaid: 1000,
      paymentMethod: "cash",
    });
    const exact = runGrill(
      supplierPayment({ amount: 2000 }),
      ctx({ txns: [owed] }),
    );
    expect(codes(exact.issues)).not.toContain("SUPPLIER_OVERPAID");
    const less = runGrill(
      supplierPayment({ amount: 1000 }),
      ctx({ txns: [owed] }),
    );
    expect(codes(less.issues)).not.toContain("SUPPLIER_OVERPAID");
  });

  it("SUPPLIER_OVERPAID is always warn severity", () => {
    const owed = txn({
      type: "purchase",
      supplierId: "kamau",
      totalAmount: 3000,
      amountPaid: 1000,
      paymentMethod: "cash",
    });
    const result = runGrill(
      supplierPayment({ amount: 3000 }),
      ctx({ txns: [owed] }),
    );
    const issue = result.issues.find((i) => i.code === "SUPPLIER_OVERPAID");
    expect(issue?.severity).toBe("warn");
  });
});

describe("POSSIBLE_DUPLICATE for purchases and supplier_payments", () => {
  const earlierPurchase = txn({
    type: "purchase",
    supplierId: "kamau",
    totalAmount: 6000,
    amountPaid: 6000,
    paymentMethod: "cash",
    occurredAt: at(-5),
  });
  const earlierPayment = txn({
    type: "supplier_payment",
    supplierId: "kamau",
    totalAmount: 1000,
    amountPaid: 1000,
    paymentMethod: "cash",
    occurredAt: at(-5),
  });

  it("fires for purchase with same supplierId, type, total within 10 min", () => {
    const result = runGrill(
      purchase({ supplierId: "kamau" }),
      ctx({ txns: [earlierPurchase] }),
    );
    expect(codes(result.issues)).toEqual(["POSSIBLE_DUPLICATE"]);
  });

  it("fires for supplier_payment with same supplierId, type, total within 10 min", () => {
    const result = runGrill(supplierPayment(), ctx({ txns: [earlierPayment] }));
    expect(codes(result.issues)).toEqual(["POSSIBLE_DUPLICATE"]);
  });

  it("never fires without a supplierId", () => {
    const result = runGrill(
      purchase({ supplierId: undefined, newSupplier: { name: "New" } }),
      ctx({ txns: [earlierPurchase] }),
    );
    expect(codes(result.issues)).toEqual([]);
  });

  it("does not fire after 10 minutes", () => {
    const result = runGrill(
      purchase({ supplierId: "kamau" }),
      ctx({ txns: [earlierPurchase], now: new Date(at(6)) }),
    );
    expect(codes(result.issues)).toEqual([]);
  });

  it("does not fire for different supplier", () => {
    const other = txn({
      type: "purchase",
      supplierId: "njoroge",
      totalAmount: 6000,
      amountPaid: 6000,
      paymentMethod: "cash",
      occurredAt: at(-5),
    });
    const result = runGrill(
      purchase({ supplierId: "kamau" }),
      ctx({ txns: [other] }),
    );
    expect(codes(result.issues)).toEqual([]);
  });

  it("does not fire for different total amount", () => {
    const other = txn({
      type: "purchase",
      supplierId: "kamau",
      totalAmount: 5000,
      amountPaid: 5000,
      paymentMethod: "cash",
      occurredAt: at(-5),
    });
    const result = runGrill(
      purchase({ supplierId: "kamau" }),
      ctx({ txns: [other] }),
    );
    expect(codes(result.issues)).toEqual([]);
  });
});

describe("extended worked example (spec §Testing Decisions)", () => {
  const viazi = item({
    name: "Viazi",
    unit: "gunia",
    allowsFractional: false,
    sellingPrice: 3000,
    buyingPrice: 2500,
  });

  function workedExampleCtx() {
    // R0 day: Sales 35000, COGS 9000, Expenses 5000, Faida 21000
    const sukumaSale = txn({
      type: "sale",
      totalAmount: 15000,
      amountPaid: 15000,
      paymentMethod: "cash",
      occurredAt: at(0),
    });
    const tripSale = txn({
      type: "sale",
      totalAmount: 20000,
      amountPaid: 20000,
      paymentMethod: "mpesa",
      occurredAt: at(30),
    });
    const expense = txn({
      type: "expense",
      totalAmount: 5000,
      amountPaid: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
      occurredAt: at(60),
    });
    const openingStock = txn({
      type: "stock_adjustment",
      source: "onboarding",
    });
    const lines = [
      line({
        txnId: sukumaSale.id,
        itemId: sukuma.id,
        itemKind: "goods",
        quantity: 3,
        unitPrice: 5000,
        unitCost: 3000,
      }),
      line({
        txnId: tripSale.id,
        itemId: mayai.id,
        itemKind: "service",
        quantity: 1,
        unitPrice: 20000,
        unitCost: 0,
      }),
      line({ txnId: openingStock.id, itemId: viazi.id, quantity: 0 }),
    ];
    // Purchase: 2 gunia viazi @ 2800 = 5600, paid 3000 cash, supplier "Mzee Kariuki"
    const mzeeKariuki = "mzee-kariuki";
    const purchase = txn({
      type: "purchase",
      supplierId: mzeeKariuki,
      totalAmount: 5600,
      amountPaid: 3000,
      paymentMethod: "cash",
      occurredAt: at(90),
    });
    const purchaseLines = [
      line({
        txnId: purchase.id,
        itemId: viazi.id,
        itemKind: "goods",
        quantity: 2,
        unitPrice: 2800,
        unitCost: 2800,
      }),
    ];
    return {
      txns: [sukumaSale, tripSale, expense, openingStock, purchase],
      lines: [...lines, ...purchaseLines],
      mzeeKariuki,
    };
  }

  it("R0 day + purchase 2 gunia @ 2800 paid 3000 cash → Sales 35000, COGS 9000, Expenses 5000, Faida 21000", () => {
    const { txns, lines } = workedExampleCtx();
    const today = nairobiDayRange("2026-10-26");
    const { rangeSummary } = require("./summary");
    const result = rangeSummary(txns, lines, today);
    expect(result.sales).toBe(35000);
    expect(result.cogs).toBe(9000);
    expect(result.expenses).toBe(5000);
    expect(result.faidaHalisi).toBe(21000);
  });

  it("cashOut = 3000 (purchase) + 5000 (expense) = 8000", () => {
    const { txns, lines } = workedExampleCtx();
    const today = nairobiDayRange("2026-10-26");
    const { rangeSummary } = require("./summary");
    const result = rangeSummary(txns, lines, today);
    expect(result.moneyFlow.cashOut).toBe(8000);
  });

  it("supplier owed = 2600 (5600 - 3000)", () => {
    const { txns, mzeeKariuki } = workedExampleCtx();
    const { supplierOwed } = require("./ledger");
    expect(supplierOwed(mzeeKariuki, txns)).toBe(2600);
  });
});

describe("D-015 interaction: purchase at new buying price changes unitCost on next sale, not past sales", () => {
  const sukumaItem = item({
    name: "Sukuma wiki",
    sellingPrice: 5000,
    buyingPrice: 3000,
  });

  it("past sales keep old unitCost", () => {
    // Day 1: purchase at 3000
    const purchase1 = txn({
      type: "purchase",
      supplierId: "s1",
      totalAmount: 3000,
      amountPaid: 3000,
      paymentMethod: "cash",
    });
    const purchase1Line = line({
      txnId: purchase1.id,
      itemId: sukumaItem.id,
      itemKind: "goods",
      quantity: 1,
      unitPrice: 3000,
      unitCost: 3000,
    });
    // Day 1: sale at 5000
    const sale1 = txn({
      type: "sale",
      totalAmount: 5000,
      amountPaid: 5000,
      paymentMethod: "cash",
    });
    const sale1Line = line({
      txnId: sale1.id,
      itemId: sukumaItem.id,
      itemKind: "goods",
      quantity: 1,
      unitPrice: 5000,
      unitCost: 3000,
    });
    // Day 2: purchase at 3500
    const purchase2 = txn({
      type: "purchase",
      supplierId: "s2",
      totalAmount: 3500,
      amountPaid: 3500,
      paymentMethod: "cash",
      occurredAt: at(1440),
    });
    const purchase2Line = line({
      txnId: purchase2.id,
      itemId: sukumaItem.id,
      itemKind: "goods",
      quantity: 1,
      unitPrice: 3500,
      unitCost: 3500,
    });
    // Day 2: sale at 5000
    const sale2 = txn({
      type: "sale",
      totalAmount: 5000,
      amountPaid: 5000,
      paymentMethod: "cash",
      occurredAt: at(1450),
    });
    const sale2Line = line({
      txnId: sale2.id,
      itemId: sukumaItem.id,
      itemKind: "goods",
      quantity: 1,
      unitPrice: 5000,
      unitCost: 3500,
    });

    const { rangeSummary } = require("./summary");
    const today = nairobiDayRange("2026-10-26");
    const allTxns = [purchase1, sale1, purchase2, sale2];
    const allLines = [purchase1Line, sale1Line, purchase2Line, sale2Line];
    const result = rangeSummary(allTxns, allLines, today);
    // COGS = 3000 (first sale) + 3500 (second sale) = 6500
    expect(result.cogs).toBe(6500);
  });
});
