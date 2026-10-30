import type { Issue } from "@/domain/grill";
import {
  buildProfile,
  type DraftOnboardingItem,
  MAX_ONBOARDING_ITEMS,
  type OnboardingAnswers,
  type OnboardingProgress,
  planItemCreation,
} from "@/domain/onboarding";
import { defaultProfile } from "@/domain/operating-profile";
import type {
  DraftExpense,
  DraftOpening,
  DraftPayment,
  DraftSale,
  DraftStockAdjustment,
  Id,
} from "@/domain/types";
import {
  addItem,
  type CommitContext,
  CommitError,
  type CommitOptions,
  commitExpense,
  commitOpening,
  commitPayment,
  commitSale,
  commitStockAdjustment,
  commitVoid,
  NeedsOverride,
  saveSettings,
  upsertCustomer,
  upsertSupplier,
} from "./commit";
import {
  readOnboardingProgress,
  writeOnboardingProgress,
} from "./onboarding-progress";

export type SaveOutcome =
  | { kind: "saved"; txnId?: Id }
  | { kind: "hard_error"; issues: Issue[] }
  | { kind: "needs_override"; issues: Issue[] };

export { addItem, saveSettings, upsertCustomer, upsertSupplier };

function hardErrorIssues(error: CommitError): Issue[] {
  return error.issues.length > 0
    ? error.issues
    : [
        {
          code: "SCHEMA",
          severity: "block",
          messageKey: "ledger.grill.schema",
        },
      ];
}

function mapCommitError(error: unknown): SaveOutcome | undefined {
  if (error instanceof NeedsOverride) {
    return { kind: "needs_override", issues: error.issues };
  }
  if (error instanceof CommitError) {
    return { kind: "hard_error", issues: hardErrorIssues(error) };
  }
  return undefined;
}

export async function saveOpening(
  ctx: CommitContext,
  draft: DraftOpening,
  opts: CommitOptions = {},
): Promise<SaveOutcome> {
  try {
    const txn = await commitOpening(ctx, draft, opts);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function saveSale(
  ctx: CommitContext,
  draft: DraftSale,
  opts: CommitOptions = {},
): Promise<SaveOutcome> {
  try {
    const txn = await commitSale(ctx, draft, opts);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function saveExpense(
  ctx: CommitContext,
  draft: DraftExpense,
  opts: CommitOptions = {},
): Promise<SaveOutcome> {
  try {
    const txn = await commitExpense(ctx, draft, opts);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function savePayment(
  ctx: CommitContext,
  draft: DraftPayment,
  opts: CommitOptions = {},
): Promise<SaveOutcome> {
  try {
    const txn = await commitPayment(ctx, draft, opts);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function saveStockAdjustment(
  ctx: CommitContext,
  draft: DraftStockAdjustment,
  opts: CommitOptions = {},
): Promise<SaveOutcome> {
  try {
    const txn = await commitStockAdjustment(ctx, draft, opts);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function saveVoid(
  ctx: CommitContext,
  txnId: Id,
): Promise<SaveOutcome> {
  try {
    const txn = await commitVoid(ctx, txnId);
    return { kind: "saved", txnId: txn.id };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}

export async function saveOnboardingFinish(
  ctx: CommitContext,
  input: {
    answers: OnboardingAnswers;
    draftItems: DraftOnboardingItem[];
    status: "completed" | "skipped";
  },
): Promise<SaveOutcome> {
  const { answers, draftItems, status } = input;
  if (draftItems.length > MAX_ONBOARDING_ITEMS) {
    return {
      kind: "hard_error",
      issues: [
        {
          code: "SCHEMA",
          severity: "block",
          messageKey: "ledger.grill.schema",
        },
      ],
    };
  }
  const { db } = ctx;
  try {
    await db.transaction(
      "rw",
      [
        db.settings,
        db.items,
        db.syncQueue,
        db.onboarding,
        db.customers,
        db.suppliers,
        db.txns,
        db.lines,
      ],
      async () => {
        await saveSettings(ctx, buildProfile(answers, defaultProfile()));

        if (status === "completed") {
          const existingItems = await db.items.toArray();
          const { toCreate } = planItemCreation(
            draftItems,
            existingItems
              .filter((item) => item.isActive)
              .map(({ name, kind }) => ({ name, kind })),
          );
          for (const draft of toCreate) {
            await addItem(ctx, draft);
          }
        }

        const previous = await readOnboardingProgress(db);
        const progress: OnboardingProgress = {
          status,
          stepId: previous?.stepId ?? "businessName",
          answers,
          draftItems,
          updatedAt: (ctx.now?.() ?? new Date()).toISOString(),
        };
        await writeOnboardingProgress(db, progress);
      },
    );
    return { kind: "saved" };
  } catch (error) {
    const outcome = mapCommitError(error);
    if (outcome) return outcome;
    throw error;
  }
}
