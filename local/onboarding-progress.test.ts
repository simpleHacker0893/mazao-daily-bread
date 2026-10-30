import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OnboardingProgress } from "@/domain/onboarding";
import { type BusinessDb, openBusinessDb } from "./business-db";
import {
  OnboardingProgressError,
  readOnboardingProgress,
  writeOnboardingProgress,
} from "./onboarding-progress";

let db: BusinessDb;

const progress: OnboardingProgress = {
  status: "in_progress",
  stepId: "location",
  answers: { businessName: "Mama Wanjiku" },
  draftItems: [],
  updatedAt: "2026-10-29T16:00:00.000Z",
};

beforeEach(() => {
  db = openBusinessDb(`onboarding-${crypto.randomUUID()}`);
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe("onboarding progress storage", () => {
  it("persists draft progress locally without creating sync entries", async () => {
    await writeOnboardingProgress(db, progress);

    await expect(readOnboardingProgress(db)).resolves.toEqual(progress);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it("rejects malformed saved progress rather than treating it as an empty draft", async () => {
    await db.onboarding.put({
      key: "progress",
      value: { ...progress, stepId: "unknown-step" },
    });

    await expect(readOnboardingProgress(db)).rejects.toBeInstanceOf(
      OnboardingProgressError,
    );
  });

  it("refuses an invalid draft before writing it", async () => {
    await expect(
      writeOnboardingProgress(db, {
        ...progress,
        answers: { businessName: " " },
      }),
    ).rejects.toBeInstanceOf(OnboardingProgressError);
    expect(await db.onboarding.count()).toBe(0);
  });

  it("refuses more than eight draft items", async () => {
    await expect(
      writeOnboardingProgress(db, {
        ...progress,
        draftItems: Array.from({ length: 9 }, (_, index) => ({
          kind: "goods" as const,
          name: `Item ${index + 1}`,
          unit: "piece",
          allowsFractional: false,
          sellingPrice: 100,
          buyingPrice: 50,
          lowStockThreshold: null,
        })),
      }),
    ).rejects.toBeInstanceOf(OnboardingProgressError);
    expect(await db.onboarding.count()).toBe(0);
  });
});
