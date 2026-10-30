import { z } from "zod";
import {
  MAX_ONBOARDING_ITEMS,
  type OnboardingProgress,
} from "@/domain/onboarding";
import type { BusinessDb } from "./business-db";

const StepId = z.enum([
  "businessName",
  "businessType",
  "location",
  "sells",
  "items",
  "paymentMethods",
  "deni",
  "dueRule",
  "expenseCategories",
]);

const DraftItem = z.object({
  kind: z.enum(["goods", "service"]),
  name: z.string().trim().min(1),
  unit: z.string().min(1),
  allowsFractional: z.boolean(),
  sellingPrice: z.number().int().nonnegative(),
  buyingPrice: z.number().int().nonnegative(),
  lowStockThreshold: z.number().nullable(),
});

const Answers = z.object({
  businessName: z.string().trim().min(1).optional(),
  businessType: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  sells: z.enum(["goods", "services", "both"]).optional(),
  items: z.array(DraftItem).optional(),
  paymentMethods: z.array(z.enum(["cash", "mpesa", "other"])).optional(),
  deniEnabled: z.boolean().optional(),
  defaultDueRule: z
    .enum(["kesho", "ijumaa", "wiki_ijayo", "mwisho_wa_mwezi"])
    .nullable()
    .optional(),
  expenseCategories: z.array(z.string().trim().min(1)).optional(),
});

const Progress = z.object({
  status: z.enum(["in_progress", "skipped", "completed"]),
  stepId: StepId,
  answers: Answers,
  draftItems: z.array(DraftItem).max(MAX_ONBOARDING_ITEMS),
  updatedAt: z.string().datetime(),
}) satisfies z.ZodType<OnboardingProgress>;

const PROGRESS_KEY = "progress";

export class OnboardingProgressError extends Error {
  constructor() {
    super("Onboarding progress is invalid or could not be saved.");
    this.name = "OnboardingProgressError";
  }
}

export async function readOnboardingProgress(
  db: BusinessDb,
): Promise<OnboardingProgress | undefined> {
  try {
    const row = await db.onboarding.get(PROGRESS_KEY);
    if (!row) return undefined;
    const result = Progress.safeParse(row.value);
    if (!result.success) throw new OnboardingProgressError();
    return result.data;
  } catch (error) {
    if (error instanceof OnboardingProgressError) throw error;
    throw new OnboardingProgressError();
  }
}

export async function writeOnboardingProgress(
  db: BusinessDb,
  progress: OnboardingProgress,
): Promise<void> {
  const parsed = Progress.safeParse(progress);
  if (!parsed.success) throw new OnboardingProgressError();
  try {
    await db.onboarding.put({ key: PROGRESS_KEY, value: parsed.data });
  } catch {
    throw new OnboardingProgressError();
  }
}
