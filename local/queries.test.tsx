import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { getBusinessDb } from "./business-db";
import {
  addItem,
  commitExpense,
  commitOpening,
  commitSale,
  commitStockAdjustment,
  commitVoid,
  upsertCustomer,
  upsertSupplier,
} from "./commit";
import { writeOnboardingProgress } from "./onboarding-progress";
import {
  useBroughtForward,
  useCustomers,
  useDaySummary,
  useOnboardingProgress,
  useSupplierSearch,
  useToday,
  useTodaySalesWithLines,
  useUnsyncedCount,
} from "./queries";

afterEach(() => {
  vi.useRealTimers();
  clearSession();
});

describe("useToday", () => {
  // 23:59:30 EAT on Monday 26 October 2026.
  const beforeMidnight = new Date("2026-10-26T20:59:30.000Z");

  it("rolls over at midnight EAT on the 60 s tick", () => {
    vi.useFakeTimers({ now: beforeMidnight });
    const { result } = renderHook(() => useToday());
    expect(result.current).toBe("2026-10-26");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current).toBe("2026-10-27");
  });

  it("rolls over when the app comes back to the foreground", () => {
    vi.useFakeTimers({ now: beforeMidnight });
    const { result } = renderHook(() => useToday());
    act(() => {
      vi.setSystemTime(new Date("2026-10-26T21:00:05.000Z"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe("2026-10-27");
  });
});

describe("live queries", () => {
  it("follow the signed-in business and update after a commit", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    setSession({
      profileId: "profile-1",
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const unsynced = renderHook(() => useUnsyncedCount());
    const summary = renderHook(() => useDaySummary("2026-10-26"));
    await waitFor(() => expect(unsynced.result.current).toBe(0));

    await commitExpense(
      {
        db: getBusinessDb(businessId),
        businessId,
        profileId: "profile-1",
        now: () => new Date("2026-10-26T07:00:00.000Z"),
      },
      { amount: 5000, paymentMethod: "cash", expenseCategory: "ushuru" },
    );

    await waitFor(() => expect(unsynced.result.current).toBe(1));
    await waitFor(() => expect(summary.result.current?.expenses).toBe(5000));
    expect(summary.result.current?.faidaHalisi).toBe(-5000);
  });

  it("returns zero-balance customers and live today sales with line labels and void state", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    const profileId = "profile-1";
    setSession({
      profileId,
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const db = getBusinessDb(businessId);
    const ctx = { db, businessId, profileId, now: () => new Date() };
    const customers = renderHook(() => useCustomers());
    const sales = renderHook(() => useTodaySalesWithLines());
    await waitFor(() => expect(customers.result.current).toEqual([]));
    await waitFor(() => expect(sales.result.current).toEqual([]));

    const customer = await upsertCustomer(ctx, { name: "Amina" });
    const item = await addItem(ctx, {
      kind: "goods",
      name: "Mandazi",
      unit: "piece",
      allowsFractional: false,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
    });
    await waitFor(() =>
      expect(customers.result.current?.map((entry) => entry.name)).toEqual([
        "Amina",
      ]),
    );

    const sale = await commitSale(ctx, {
      lines: [
        {
          itemId: item.id,
          itemKind: "goods",
          description: "Saved line description",
          quantity: 1,
          unit: "piece",
          unitPrice: 5000,
        },
        {
          itemKind: null,
          description: "Tea",
          quantity: 1,
          unit: "cup",
          unitPrice: 1000,
        },
      ],
      totalAmount: 6000,
      amountPaid: 6000,
      paymentMethod: "cash",
      customerId: customer.id,
    });

    await waitFor(() => expect(sales.result.current).toHaveLength(1));
    const listedSale = sales.result.current?.[0];
    expect(listedSale).toMatchObject({ id: sale.id, voided: false });
    expect(
      listedSale?.lines.map(({ label, description }) => ({
        label,
        description,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          label: "Saved line description",
          description: "Saved line description",
        },
        { label: "Tea", description: "Tea" },
      ]),
    );

    await commitVoid(ctx, sale.id);
    await waitFor(() => expect(sales.result.current?.[0]?.voided).toBe(true));
    expect(sales.result.current).toHaveLength(1);
  });

  it("searches suppliers by name without regard to case", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    const profileId = "profile-1";
    setSession({
      profileId,
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const db = getBusinessDb(businessId);
    const ctx = { db, businessId, profileId, now: () => new Date() };
    const suppliers = renderHook(() => useSupplierSearch("  FLOUR "));
    await waitFor(() => expect(suppliers.result.current).toEqual([]));

    await upsertSupplier(ctx, { name: "Nairobi Flour Depot" });
    await upsertSupplier(ctx, { name: "Nairobi vegetables" });
    await waitFor(() =>
      expect(
        suppliers.result.current?.map((supplier) => supplier.name),
      ).toEqual(["Nairobi Flour Depot"]),
    );
  });

  it("reads local onboarding progress and derived notebook balances and stock", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    const profileId = "profile-1";
    setSession({
      profileId,
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const db = getBusinessDb(businessId);
    const ctx = { db, businessId, profileId, now: () => new Date() };
    const progress = {
      status: "in_progress" as const,
      stepId: "location" as const,
      answers: { businessName: "Mama Wanjiku" },
      draftItems: [],
      updatedAt: new Date().toISOString(),
    };
    const savedProgress = renderHook(() => useOnboardingProgress());
    const broughtForward = renderHook(() => useBroughtForward());
    await waitFor(() => expect(savedProgress.result.current).toBeNull());
    await waitFor(() =>
      expect(broughtForward.result.current?.customers).toEqual([]),
    );

    await writeOnboardingProgress(db, progress);
    const item = await addItem(ctx, {
      kind: "goods",
      name: "Mayai",
      unit: "tray",
      allowsFractional: false,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
    });
    await commitOpening(ctx, {
      party: "customer",
      newCustomer: { name: "Otieno" },
      amount: 50000,
      source: "onboarding",
    });
    await commitStockAdjustment(ctx, {
      itemId: item.id,
      quantity: 3,
      source: "onboarding",
    });

    await waitFor(() => expect(savedProgress.result.current).toEqual(progress));
    await waitFor(() =>
      expect(broughtForward.result.current).toMatchObject({
        customers: [{ partyName: "Otieno", totalAmount: 50000, voided: false }],
        totals: { customers: 50000, suppliers: 0 },
        stock: [{ item: { name: "Mayai" }, quantity: 3 }],
      }),
    );
  });
});
