import { describe, expect, it } from "vitest";
import { defaultProfile, OperatingProfileSchema } from "./operating-profile";
import {
  DraftOpeningSchema,
  DraftSaleSchema,
  DraftStockAdjustmentSchema,
  MoneySchema,
  QuantitySchema,
} from "./schemas";

describe("money and quantity", () => {
  it("money is a non-negative integer of cents", () => {
    expect(MoneySchema.safeParse(15000).success).toBe(true);
    expect(MoneySchema.safeParse(0).success).toBe(true);
    expect(MoneySchema.safeParse(-1).success).toBe(false);
    expect(MoneySchema.safeParse(10.5).success).toBe(false);
  });

  it("quantity has at most 3 decimal places", () => {
    expect(QuantitySchema.safeParse(2.675).success).toBe(true);
    expect(QuantitySchema.safeParse(0.5).success).toBe(true);
    expect(QuantitySchema.safeParse(0.0001).success).toBe(false);
  });
});

describe("drafts that name a party (M6)", () => {
  const sale = {
    lines: [
      {
        itemKind: "goods",
        description: "Sukuma",
        quantity: 1,
        unit: "kilo",
        unitPrice: 5000,
      },
    ],
    totalAmount: 5000,
    amountPaid: 0,
    paymentMethod: null,
  };

  it("a sale takes an existing customer or a new one", () => {
    expect(
      DraftSaleSchema.safeParse({ ...sale, customerId: "c-1" }).success,
    ).toBe(true);
    expect(
      DraftSaleSchema.safeParse({ ...sale, newCustomer: { name: "Wanjiku" } })
        .success,
    ).toBe(true);
  });

  it("a sale with both customerId and newCustomer fails", () => {
    expect(
      DraftSaleSchema.safeParse({
        ...sale,
        customerId: "c-1",
        newCustomer: { name: "Wanjiku" },
      }).success,
    ).toBe(false);
  });

  it("a customer opening balance with a new customer passes", () => {
    expect(
      DraftOpeningSchema.safeParse({
        party: "customer",
        newCustomer: { name: "Otieno" },
        amount: 50000,
        source: "onboarding",
      }).success,
    ).toBe(true);
  });

  it("an opening balance with both an id and a new party fails", () => {
    expect(
      DraftOpeningSchema.safeParse({
        party: "customer",
        customerId: "c-1",
        newCustomer: { name: "Otieno" },
        amount: 50000,
        source: "onboarding",
      }).success,
    ).toBe(false);
  });

  it("an opening balance must name exactly one party", () => {
    expect(
      DraftOpeningSchema.safeParse({
        party: "customer",
        amount: 50000,
        source: "onboarding",
      }).success,
    ).toBe(false);
    expect(
      DraftOpeningSchema.safeParse({
        party: "supplier",
        newSupplier: { name: "Kamau" },
        amount: 80000,
        source: "onboarding",
      }).success,
    ).toBe(true);
  });
});

describe("stock adjustment drafts", () => {
  it("accepts a positive quantity and refuses zero", () => {
    const base = { itemId: "mayai", source: "onboarding" };
    expect(
      DraftStockAdjustmentSchema.safeParse({ ...base, quantity: 10 }).success,
    ).toBe(true);
    expect(
      DraftStockAdjustmentSchema.safeParse({ ...base, quantity: 0 }).success,
    ).toBe(false);
  });
});

describe("defaultProfile (M8)", () => {
  it("parses with the profile schema and hides nothing", () => {
    const profile = defaultProfile();
    expect(OperatingProfileSchema.parse(profile)).toEqual(profile);
    expect(profile.paymentMethods).toEqual(["cash", "mpesa", "other"]);
    expect(profile.sells).toBe("both");
    expect(profile.deniEnabled).toBe(true);
    expect(profile.defaultDueRule).toBeNull();
    expect(profile.businessName).toBe("");
  });

  it("sets every rule to warn and price variance to 30%", () => {
    expect(defaultProfile().rules).toEqual({
      negativeStock: "warn",
      belowCost: "warn",
      priceVariance: { mode: "warn", thresholdPct: 30 },
      duplicate: "warn",
    });
  });

  it("uses the DOMAIN.md expense categories", () => {
    expect(defaultProfile().expenseCategories).toContain("ushuru");
    expect(defaultProfile().expenseCategories).toHaveLength(11);
  });
});
