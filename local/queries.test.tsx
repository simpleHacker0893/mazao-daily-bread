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
  useBusinessHeader,
  useCustomers,
  useDashboard,
  useDayReport,
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

describe("dashboard and day report", () => {
  it("give identical totals for the worked example, offline from Dexie", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    const profileId = "profile-1";
    setSession({
      profileId,
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const db = getBusinessDb(businessId);
    const at = (iso: string) => ({
      db,
      businessId,
      profileId,
      now: () => new Date(iso),
    });
    const day = "2026-10-26";
    const dashboard = renderHook(() => useDashboard(day));
    const report = renderHook(() => useDayReport(day));
    const header = renderHook(() => useBusinessHeader());
    await waitFor(() => expect(dashboard.result.current?.recordCount).toBe(0));
    await waitFor(() => expect(report.result.current?.entries).toEqual([]));
    await waitFor(() =>
      expect(header.result.current).toEqual({ businessName: "", location: "" }),
    );
    expect(dashboard.result.current?.moneyIn).toEqual({
      cash: 0,
      mpesa: 0,
      other: 0,
    });

    const setup = at("2026-10-26T03:00:00.000Z");
    const sukuma = await addItem(setup, {
      kind: "goods",
      name: "Sukuma wiki",
      unit: "kilo",
      allowsFractional: true,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: 5,
    });
    const trip = await addItem(setup, {
      kind: "service",
      name: "Trip Gikomba-Town",
      unit: "trip",
      allowsFractional: false,
      sellingPrice: 20000,
      buyingPrice: 0,
      lowStockThreshold: null,
    });
    await commitStockAdjustment(setup, {
      itemId: sukuma.id,
      quantity: 6,
      source: "onboarding",
    });
    await commitSale(at("2026-10-26T07:00:00.000Z"), {
      lines: [
        {
          itemId: sukuma.id,
          itemKind: "goods",
          description: "",
          quantity: 3,
          unit: "kilo",
          unitPrice: 5000,
        },
      ],
      totalAmount: 15000,
      amountPaid: 15000,
      paymentMethod: "cash",
    });
    await commitSale(at("2026-10-26T07:30:00.000Z"), {
      lines: [
        {
          itemId: trip.id,
          itemKind: "service",
          description: "",
          quantity: 1,
          unit: "trip",
          unitPrice: 20000,
        },
      ],
      totalAmount: 20000,
      amountPaid: 20000,
      paymentMethod: "mpesa",
    });
    await commitExpense(at("2026-10-26T08:00:00.000Z"), {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
    });
    await commitOpening(setup, {
      party: "supplier",
      newSupplier: { name: "Gikomba Wholesale" },
      amount: 12000,
      source: "onboarding",
    });

    await waitFor(() =>
      expect(dashboard.result.current?.supplierDeniTotal).toBe(12000),
    );
    await waitFor(() => expect(dashboard.result.current?.recordCount).toBe(3));
    await waitFor(() => expect(report.result.current?.entries).toHaveLength(5));
    const d = dashboard.result.current;
    const r = report.result.current;
    expect(d?.totals).toEqual({
      sales: 35000,
      cogs: 9000,
      expenses: 5000,
      faidaHalisi: 21000,
      cashIn: 15000,
      mpesaIn: 20000,
      otherIn: 0,
    });
    expect(r?.totals).toEqual(d?.totals);
    expect(r?.entries.filter((e) => e.countsInTotals)).toHaveLength(3);
    expect(d?.supplierDeniTotal).toBe(12000);
    expect(d?.moneyIn.cash).toBeCloseTo(15000 / 35000);
    // 6 kilo brought forward, 3 sold: 3 left, at or below the threshold of 5.
    expect(d?.lowStock).toEqual([
      { itemId: sukuma.id, name: "Sukuma wiki", unit: "kilo", onHand: 3 },
    ]);
  });

  it("lists who owes first and deni given, and updates after a void", async () => {
    const businessId = `biz-${crypto.randomUUID()}`;
    const profileId = "profile-1";
    setSession({
      profileId,
      businessId,
      clerkUserId: "user_1",
      email: "merchant@example.com",
    });
    const db = getBusinessDb(businessId);
    const ctx = {
      db,
      businessId,
      profileId,
      now: () => new Date("2026-10-26T07:00:00.000Z"),
    };
    const day = "2026-10-26";
    const dashboard = renderHook(() => useDashboard(day));
    await waitFor(() => expect(dashboard.result.current).toBeDefined());

    const wanjiku = await upsertCustomer(ctx, { name: "Wanjiku" });
    const sale = await commitSale(ctx, {
      lines: [
        {
          itemKind: null,
          description: "Mayai",
          quantity: 1,
          unit: "tray",
          unitPrice: 30000,
        },
      ],
      totalAmount: 30000,
      amountPaid: 10000,
      paymentMethod: "cash",
      customerId: wanjiku.id,
    });

    await waitFor(() =>
      expect(dashboard.result.current?.deniGiven).toBe(20000),
    );
    expect(dashboard.result.current?.deni.rows).toMatchObject([
      { name: "Wanjiku", balance: 20000 },
    ]);
    expect(dashboard.result.current?.deni.totalOutstanding).toBe(20000);

    await commitVoid(ctx, sale.id);
    await waitFor(() => expect(dashboard.result.current?.deniGiven).toBe(0));
    expect(dashboard.result.current?.totals.sales).toBe(0);
    expect(dashboard.result.current?.recordCount).toBe(0);
  });
});
