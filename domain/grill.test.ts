import { describe, expect, it } from "vitest";
import { type GrillContext, type GrillInput, runGrill } from "./grill";
import { defaultProfile, type OperatingProfile } from "./operating-profile";
import { at, item, line, txn } from "./test-fixtures";
import type { DraftSale } from "./types";

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

  it("rejects fractional sale quantities for items that require whole units", () => {
    const result = runGrill(
      sale({
        lines: [
          {
            itemId: mayai.id,
            itemKind: "goods",
            description: "Mayai",
            quantity: 1.5,
            unit: "tray",
            unitPrice: 45000,
          },
        ],
        totalAmount: 67500,
        amountPaid: 67500,
      }),
      ctx(),
    );
    expect(result.hardErrors).toEqual([
      {
        code: "NON_FRACTIONAL_QUANTITY",
        severity: "block",
        messageKey: "ledger.grill.nonFractionalQuantity",
        lineIndex: 0,
      },
    ]);
  });

  it("allows up to three decimal places for items that permit fractions", () => {
    const result = runGrill(
      sale({
        lines: [sukumaLine(0.333, 100)],
        totalAmount: 33,
        amountPaid: 33,
      }),
      ctx(),
    );
    expect(result.hardErrors).toEqual([]);
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
