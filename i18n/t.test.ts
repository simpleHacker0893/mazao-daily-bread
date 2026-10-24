import { describe, expect, it } from "vitest";
import { navLabels, t } from "@/i18n/t";

describe("t()", () => {
  it("resolves a key from the shell half", () => {
    expect(t("shell.lock.title")).toBe("Enter your PIN");
  });

  it("resolves a key from the ledger half", () => {
    expect(t("ledger.sale.save")).toBe("Save sale");
  });
});

describe("navLabels", () => {
  it("are the five bottom-nav items, each with Kiswahili and English", () => {
    expect(navLabels.map((label) => label.sw)).toEqual([
      "Muhtasari",
      "Mauzo",
      "Deni",
      "Gharama",
      "Zaidi",
    ]);
    for (const label of navLabels) {
      expect(label.sw.trim()).not.toBe("");
      expect(label.en.trim()).not.toBe("");
    }
  });
});
