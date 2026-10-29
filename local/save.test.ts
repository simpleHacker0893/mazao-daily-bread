import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { broughtForwardTotal } from "@/domain/ledger";
import type {
  DraftOnboardingItem,
  OnboardingProgress,
} from "@/domain/onboarding";
import { defaultProfile } from "@/domain/operating-profile";
import { type BusinessDb, openBusinessDb } from "./business-db";
import type { CommitContext } from "./commit";
import { saveOnboardingFinish, saveOpening, saveStockAdjustment } from "./save";

let db: BusinessDb;
let ctx: CommitContext;

const itemDrafts: DraftOnboardingItem[] = [
  {
    kind: "goods",
    name: "Mayai",
    unit: "tray",
    allowsFractional: false,
    sellingPrice: 5000,
    buyingPrice: 3000,
    lowStockThreshold: null,
  },
  {
    kind: "service",
    name: "Delivery",
    unit: "trip",
    allowsFractional: false,
    sellingPrice: 10000,
    buyingPrice: 0,
    lowStockThreshold: null,
  },
];

beforeEach(() => {
  const businessId = `save-${crypto.randomUUID()}`;
  db = openBusinessDb(businessId);
  ctx = { db, businessId, profileId: "profile-save" };
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe("onboarding saves", () => {
  it("saves a new customer with its opening balance in parent order", async () => {
    const outcome = await saveOpening(ctx, {
      party: "customer",
      newCustomer: { name: "Otieno" },
      amount: 50000,
      source: "onboarding",
    });

    expect(outcome).toMatchObject({ kind: "saved" });
    expect(await db.customers.count()).toBe(1);
    expect(await db.txns.count()).toBe(1);
    const opening = await db.txns.toCollection().first();
    expect(opening?.customerId).toBe(
      (await db.customers.toCollection().first())?.id,
    );
    expect(broughtForwardTotal("customer", await db.txns.toArray())).toBe(
      50000,
    );
    expect(
      (await db.syncQueue.orderBy("seq").toArray()).map((entry) => entry.table),
    ).toEqual(["customers", "txns"]);
  });

  it("rejects zero opening stock and returns an explicit hard error", async () => {
    const item = await db.items.add({
      id: crypto.randomUUID(),
      businessId: ctx.businessId,
      kind: "goods",
      name: "Mayai",
      unit: "tray",
      allowsFractional: false,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
      isActive: true,
      createdBy: ctx.profileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const outcome = await saveStockAdjustment(ctx, {
      itemId: item,
      quantity: 0,
      source: "onboarding",
    });

    expect(outcome.kind).toBe("hard_error");
    expect(await db.txns.count()).toBe(0);
  });

  it("refuses a ninth onboarding item without saving partial setup", async () => {
    const outcome = await saveOnboardingFinish(ctx, {
      answers: { businessName: "Mama Wanjiku" },
      draftItems: Array.from({ length: 9 }, (_, index) => ({
        kind: "goods" as const,
        name: `Item ${index + 1}`,
        unit: "tray",
        allowsFractional: false,
        sellingPrice: 5000,
        buyingPrice: 3000,
        lowStockThreshold: null,
      })),
      status: "completed",
    });

    expect(outcome.kind).toBe("hard_error");
    expect(await db.settings.count()).toBe(0);
    expect(await db.items.count()).toBe(0);
    expect(await db.onboarding.count()).toBe(0);
  });

  it("finishes onboarding atomically and does not create duplicate items on retry", async () => {
    const outcome = await saveOnboardingFinish(ctx, {
      answers: { businessName: "Mama Wanjiku" },
      draftItems: itemDrafts,
      status: "completed",
    });

    expect(outcome.kind).toBe("saved");
    expect((await db.settings.get("operatingProfile"))?.value).toMatchObject({
      businessName: "Mama Wanjiku",
    });
    expect((await db.items.toArray()).map((item) => item.name).sort()).toEqual([
      "Delivery",
      "Mayai",
    ]);
    expect((await db.onboarding.get("progress"))?.value).toMatchObject({
      status: "completed",
    });

    await saveOnboardingFinish(ctx, {
      answers: { businessName: "Mama Wanjiku" },
      draftItems: itemDrafts,
      status: "completed",
    });

    expect(await db.items.count()).toBe(2);
  });

  it("rolls back profile, items, and progress when an item fails validation", async () => {
    const outcome = await saveOnboardingFinish(ctx, {
      answers: { businessName: "Mama Wanjiku" },
      draftItems: [
        ...itemDrafts,
        {
          kind: "goods",
          name: " ",
          unit: "tray",
          allowsFractional: false,
          sellingPrice: 5000,
          buyingPrice: 3000,
          lowStockThreshold: null,
        },
      ],
      status: "completed",
    });

    expect(outcome.kind).toBe("hard_error");
    expect(await db.settings.count()).toBe(0);
    expect(await db.items.count()).toBe(0);
    expect(await db.onboarding.count()).toBe(0);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it("saves skipped answers and defaults without creating onboarding items", async () => {
    const answers: OnboardingProgress["answers"] = {
      businessName: "Mama Wanjiku",
      location: "Gikomba",
    };
    const outcome = await saveOnboardingFinish(ctx, {
      answers,
      draftItems: itemDrafts,
      status: "skipped",
    });

    expect(outcome.kind).toBe("saved");
    expect((await db.settings.get("operatingProfile"))?.value).toMatchObject({
      ...defaultProfile(),
      businessName: "Mama Wanjiku",
      location: "Gikomba",
    });
    expect(await db.items.count()).toBe(0);
    expect((await db.onboarding.get("progress"))?.value).toMatchObject({
      status: "skipped",
      answers,
    });
  });
});
