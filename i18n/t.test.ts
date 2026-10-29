import { describe, expect, it } from "vitest";
import { navKeys, t } from "@/i18n/t";

describe("t()", () => {
  it("defaults to English and resolves a key from the shell half", () => {
    expect(t("shell.lock.title")).toBe("Unlock Mazao");
  });

  it("resolves a key from the ledger half", () => {
    expect(t("ledger.sale.save")).toBe("Save sale");
  });

  it("switches to Kiswahili when asked", () => {
    expect(t("shell.lock.title", "sw")).toBe("Fungua Mazao");
    expect(t("ledger.sale.save", "sw")).toBe("Hifadhi mauzo");
  });
});

describe("navKeys", () => {
  it("are the five bottom-nav items in English by default", () => {
    expect(navKeys.map((key) => t(key))).toEqual([
      "Overview",
      "Sales",
      "Debts",
      "Expenses",
      "More",
    ]);
  });

  it("each have a Kiswahili label", () => {
    expect(navKeys.map((key) => t(key, "sw"))).toEqual([
      "Muhtasari",
      "Mauzo",
      "Deni",
      "Gharama",
      "Zaidi",
    ]);
  });
});
