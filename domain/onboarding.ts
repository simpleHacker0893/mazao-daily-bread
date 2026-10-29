// Pure onboarding functions (Phase 2, D-053). No React, Dexie, network or Date.now().
// The stepper, review and notebook screens call these; they never write storage themselves.
import type { OperatingProfile } from "./operating-profile";
import type { PaymentMethod } from "./types";

export type OnboardingStepId =
  | "businessName"
  | "businessType"
  | "location"
  | "sells"
  | "items"
  | "paymentMethods"
  | "deni"
  | "dueRule"
  | "expenseCategories";

export type OnboardingSells = "goods" | "services" | "both";

export type DueRuleId = "kesho" | "ijumaa" | "wiki_ijayo" | "mwisho_wa_mwezi";

/** A goods or service item listed during onboarding. Not yet a Bidhaa record. */
export type DraftOnboardingItem = {
  kind: "goods" | "service";
  name: string;
  unit: string;
  allowsFractional: boolean;
  sellingPrice: number;
  buyingPrice: number;
  lowStockThreshold: number | null;
};

/** Answers keyed by step id. Only validated answers are kept; absent means "not answered". */
export type OnboardingAnswers = {
  businessName?: string;
  businessType?: string;
  location?: string;
  sells?: OnboardingSells;
  items?: DraftOnboardingItem[];
  paymentMethods?: PaymentMethod[];
  deniEnabled?: boolean;
  defaultDueRule?: DueRuleId | null;
  expenseCategories?: string[];
};

export type OnboardingStatus = "in_progress" | "skipped" | "completed";

export type OnboardingProgress = {
  status: OnboardingStatus;
  stepId: OnboardingStepId;
  answers: OnboardingAnswers;
  draftItems: DraftOnboardingItem[];
  updatedAt: string;
};

/** The ordered question script. `dueRule` is conditionally applicable. */
const STEP_ORDER: OnboardingStepId[] = [
  "businessName",
  "businessType",
  "location",
  "sells",
  "items",
  "paymentMethods",
  "deni",
  "dueRule",
  "expenseCategories",
];

/** Which questions apply given the answers so far. Due-rule appears only when deni is on. */
export function applicableSteps(
  answers: OnboardingAnswers,
): OnboardingStepId[] {
  return STEP_ORDER.filter((step) => {
    if (step === "dueRule") return answers.deniEnabled === true;
    return true;
  });
}

/**
 * The step to resume at. If the saved step no longer applies (e.g. deni was toggled off),
 * returns the next applicable step after it. Returns the first applicable step as fallback.
 */
export function resumeStep(
  stepId: OnboardingStepId,
  answers: OnboardingAnswers,
): OnboardingStepId {
  const steps = applicableSteps(answers);
  if (steps.includes(stepId)) return stepId;
  const index = STEP_ORDER.indexOf(stepId);
  const next = steps.find((step) => STEP_ORDER.indexOf(step) > index);
  return next ?? steps[0] ?? "businessName";
}

/** Progress after answering or skipping one step; advances to the next applicable step. */
export function progressAfterStep(
  progress: OnboardingProgress,
  answers: OnboardingAnswers,
  now: Date,
): OnboardingProgress {
  const merged = { ...progress.answers, ...answers };
  const step = resumeStep(progress.stepId, merged);
  const steps = applicableSteps(merged);
  const currentIndex = steps.indexOf(step);
  const nextStep =
    steps[currentIndex + 1] ?? steps[steps.length - 1] ?? "businessName";
  return {
    ...progress,
    stepId: nextStep,
    answers: merged,
    updatedAt: now.toISOString(),
  };
}

/** A full profile with defaults for every unanswered question. Rules stay at R0 defaults. */
export function buildProfile(
  answers: OnboardingAnswers,
  base: OperatingProfile,
): OperatingProfile {
  return {
    ...base,
    businessName: answers.businessName ?? base.businessName,
    businessType: answers.businessType ?? base.businessType,
    location: answers.location ?? base.location,
    sells: answers.sells ?? base.sells,
    paymentMethods:
      answers.paymentMethods && answers.paymentMethods.length > 0
        ? answers.paymentMethods
        : base.paymentMethods,
    deniEnabled: answers.deniEnabled ?? base.deniEnabled,
    defaultDueRule:
      answers.deniEnabled === false
        ? null
        : (answers.defaultDueRule ?? base.defaultDueRule),
    expenseCategories:
      answers.expenseCategories && answers.expenseCategories.length > 0
        ? answers.expenseCategories
        : base.expenseCategories,
  };
}

/** Prefill for `?mode=redo`: the saved profile wins over any stale draft answers. */
export function redoAnswers(
  profile: OperatingProfile,
  draft: OnboardingAnswers | undefined,
): OnboardingAnswers {
  return {
    businessName: draft?.businessName ?? profile.businessName,
    businessType: draft?.businessType ?? profile.businessType,
    location: draft?.location ?? profile.location,
    sells: draft?.sells ?? profile.sells,
    items: draft?.items ?? [],
    paymentMethods: draft?.paymentMethods ?? profile.paymentMethods,
    deniEnabled: draft?.deniEnabled ?? profile.deniEnabled,
    defaultDueRule:
      profile.deniEnabled === false
        ? null
        : (draft?.defaultDueRule ?? profile.defaultDueRule),
    expenseCategories: draft?.expenseCategories ?? profile.expenseCategories,
  };
}

/**
 * Decides which draft items already exist (name case- and space-insensitive, same kind).
 * A service with the same name as a goods item is created (the name kind pair is the key).
 */
export function planItemCreation(
  drafts: DraftOnboardingItem[],
  existing: { name: string; kind: "goods" | "service" }[],
): { toCreate: DraftOnboardingItem[]; alreadyExist: DraftOnboardingItem[] } {
  const normalise = (value: string) => value.trim().toLowerCase();
  const seen = new Set(existing.map((i) => `${normalise(i.name)}|${i.kind}`));
  const toCreate: DraftOnboardingItem[] = [];
  const alreadyExist: DraftOnboardingItem[] = [];
  for (const draft of drafts) {
    const key = `${normalise(draft.name)}|${draft.kind}`;
    if (seen.has(key)) {
      alreadyExist.push(draft);
    } else {
      seen.add(key);
      toCreate.push(draft);
    }
  }
  return { toCreate, alreadyExist };
}

/** Refuses a ninth item: onboarding stays short. */
export const MAX_ONBOARDING_ITEMS = 8;

export function canAddItem(count: number): boolean {
  return count < MAX_ONBOARDING_ITEMS;
}
