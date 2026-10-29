import { describe, expect, it } from "vitest";
import {
  formatKES,
  fromCents,
  linesTotal,
  lineTotal,
  saleDraftTotals,
  toCents,
} from "./money";

describe("toCents / fromCents", () => {
  it("converts shillings to integer cents", () => {
    expect(toCents(150)).toBe(15000);
    expect(toCents("150.00")).toBe(15000);
    expect(toCents("0.10")).toBe(10);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it("converts cents back to shillings", () => {
    expect(fromCents(15000)).toBe(150);
    expect(fromCents(10)).toBe(0.1);
  });
});

describe("formatKES", () => {
  it("shows whole shillings with thousands separators", () => {
    expect(formatKES(125000)).toBe("KES 1,250");
    expect(formatKES(0)).toBe("KES 0");
    expect(formatKES(123456700)).toBe("KES 1,234,567");
  });

  it("shows decimals only when they are not zero", () => {
    expect(formatKES(125050)).toBe("KES 1,250.50");
    expect(formatKES(5)).toBe("KES 0.05");
  });

  it("shows a minus sign for negative amounts (a customer in credit)", () => {
    expect(formatKES(-5000)).toBe("KES -50");
  });
});

describe("lineTotal", () => {
  it("rounds quantity times unit price to whole cents", () => {
    expect(lineTotal(0.5, 12000)).toBe(6000);
    expect(lineTotal(3, 5000)).toBe(15000);
    expect(lineTotal(0.333, 100)).toBe(33);
  });
});

describe("linesTotal", () => {
  it("adds individually rounded line totals", () => {
    expect(
      linesTotal([
        { quantity: 0.333, unitPrice: 100 },
        { quantity: 1, unitPrice: 100 },
      ]),
    ).toBe(133);
  });
});

describe("saleDraftTotals", () => {
  it("uses rounded line values and returns the outstanding deni", () => {
    expect(
      saleDraftTotals(
        [
          { quantity: 3, unitPrice: 5000 },
          { quantity: 0.5, unitPrice: 12000 },
        ],
        10000,
      ),
    ).toEqual({ lineTotals: [15000, 6000], total: 21000, deni: 11000 });
    expect(saleDraftTotals([{ quantity: 1, unitPrice: 5000 }], 6000).deni).toBe(
      0,
    );
  });
});
