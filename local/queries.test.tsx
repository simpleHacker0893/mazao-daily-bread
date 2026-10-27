import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { getBusinessDb } from "./business-db";
import { commitExpense } from "./commit";
import { useDaySummary, useToday, useUnsyncedCount } from "./queries";

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
});
