import { describe, expect, it } from "vitest";
import {
  applicableSteps,
  buildProfile,
  canAddItem,
  planItemCreation,
  redoAnswers,
  resumeStep,
} from "./onboarding";
import { defaultProfile, OperatingProfileSchema } from "./operating-profile";

describe("onboarding rules", () => {
  it("includes the due-rule question only when the merchant gives deni", () => {
    expect(applicableSteps({ deniEnabled: false })).not.toContain("dueRule");
    expect(applicableSteps({ deniEnabled: true })).toContain("dueRule");
    expect(resumeStep("dueRule", { deniEnabled: false })).toBe(
      "expenseCategories",
    );
  });

  it("builds a validated profile from answers and safe defaults", () => {
    const profile = buildProfile(
      { businessName: "Mama Wanjiku", businessType: "vegetable-trader" },
      defaultProfile(),
    );

    expect(profile).toMatchObject({
      ...defaultProfile(),
      businessName: "Mama Wanjiku",
      businessType: "vegetable-trader",
      rules: {
        ...defaultProfile().rules,
        negativeStock: "warn",
        belowCost: "warn",
        duplicate: "warn",
        priceVariance: { mode: "warn", thresholdPct: 30 },
      },
    });
    expect(
      OperatingProfileSchema.safeParse(buildProfile({}, defaultProfile()))
        .success,
    ).toBe(true);
  });

  it("prefills redo answers from the saved profile unless a draft answer exists", () => {
    const profile = {
      ...defaultProfile(),
      businessName: "Mama Njeri Mboga",
      location: "Gikomba",
    };

    expect(redoAnswers(profile, undefined)).toMatchObject({
      businessName: "Mama Njeri Mboga",
      location: "Gikomba",
    });
    expect(
      redoAnswers(profile, { businessName: "Mama Wanjiku" }).businessName,
    ).toBe("Mama Wanjiku");
  });

  it("plans item creation by normalized name and kind and limits onboarding to eight", () => {
    const sukuma = {
      kind: "goods" as const,
      name: "Sukuma Wiki ",
      unit: "kilo",
      allowsFractional: true,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
    };
    const plan = planItemCreation(
      [sukuma, { ...sukuma, kind: "service", unit: "job" }],
      [{ name: "sukuma wiki", kind: "goods" }],
    );

    expect(plan.alreadyExist).toEqual([sukuma]);
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.toCreate[0]?.kind).toBe("service");
    expect(canAddItem(7)).toBe(true);
    expect(canAddItem(8)).toBe(false);
  });
});
