import { z } from "zod";

// The Merchant Operating Profile: onboarding's output, which sets defaults and grill rule levels.

const RuleLevel = z.enum(["warn", "block"]);

export const OperatingProfileSchema = z.object({
  /** May be empty: a skipped onboarding still saves (M8). */
  businessName: z.string(),
  businessType: z.string(),
  location: z.string(),
  sells: z.enum(["goods", "services", "both"]),
  paymentMethods: z.array(z.enum(["cash", "mpesa", "other"])),
  deniEnabled: z.boolean(),
  defaultDueRule: z
    .enum(["kesho", "ijumaa", "wiki_ijayo", "mwisho_wa_mwezi"])
    .nullable(),
  expenseCategories: z.array(z.string().min(1)),
  rules: z.object({
    negativeStock: RuleLevel,
    belowCost: RuleLevel,
    priceVariance: z.object({
      mode: RuleLevel,
      thresholdPct: z.number().positive(),
    }),
    duplicate: RuleLevel,
  }),
});

export type OperatingProfile = z.infer<typeof OperatingProfileSchema>;
export type RuleLevel = z.infer<typeof RuleLevel>;

/** DOMAIN.md default expense categories. */
export const DEFAULT_EXPENSE_CATEGORIES = [
  "transport",
  "ushuru",
  "rent",
  "bags",
  "county fees",
  "airtime",
  "electricity",
  "fuel",
  "repairs/matengenezo",
  "vehicle/bike costs",
  "miscellaneous",
];

/** The profile used until onboarding sets one: hides nothing, warns on every rule (M8, D-026). */
export function defaultProfile(): OperatingProfile {
  return {
    businessName: "",
    businessType: "",
    location: "",
    sells: "both",
    paymentMethods: ["cash", "mpesa", "other"],
    deniEnabled: true,
    defaultDueRule: null,
    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
    rules: {
      negativeStock: "warn",
      belowCost: "warn",
      priceVariance: { mode: "warn", thresholdPct: 30 },
      duplicate: "warn",
    },
  };
}
