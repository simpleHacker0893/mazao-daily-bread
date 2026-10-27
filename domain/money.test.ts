import { describe, expect, it } from "vitest";
import { formatKES, fromCents, lineTotal, toCents } from "./money";

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
