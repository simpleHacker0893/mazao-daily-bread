import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceDb } from "@/local/device-db";
import { LockGuard } from "./LockGuard";

const { sessionState, router, clearSession } = vi.hoisted(() => ({
  sessionState: {
    value: null as null | {
      profileId: string;
      businessId: string;
      clerkUserId: string;
      email: string;
    },
  },
  router: { replace: vi.fn() },
  clearSession: vi.fn(() => {
    sessionState.value = null;
  }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/auth/session", () => ({
  clearSession,
  useSession: () => sessionState.value,
}));

const account = {
  profileId: "profile-guard",
  clerkUserId: "user-guard",
  email: "owner@example.test",
  businessId: "business-guard",
  pinHash: "stored-hash",
  pinSalt: "stored-salt",
  failedAttempts: 0,
  lockedUntil: null,
  lastUnlockedAt: null,
};

beforeEach(async () => {
  await deviceDb.accounts.clear();
  await deviceDb.meta.clear();
  router.replace.mockReset();
  clearSession.mockClear();
  sessionState.value = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LockGuard", () => {
  it("routes a cold start with a saved account to the lock screen", async () => {
    await deviceDb.accounts.put(account);
    render(
      <LockGuard>
        <p>Private books</p>
      </LockGuard>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/lock"));
    expect(screen.queryByText("Private books")).not.toBeInTheDocument();
  });

  it("sends a phone without an account to the public home", async () => {
    render(
      <LockGuard>
        <p>Private books</p>
      </LockGuard>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(clearSession).toHaveBeenCalled();
  });

  it("clears the memory session and locks after more than five minutes hidden", async () => {
    await deviceDb.accounts.put(account);
    sessionState.value = {
      profileId: account.profileId,
      businessId: account.businessId,
      clerkUserId: account.clerkUserId,
      email: account.email,
    };
    const start = 1_800_000_000_000;
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(start);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    render(
      <LockGuard>
        <p>Private books</p>
      </LockGuard>,
    );
    expect(await screen.findByText("Private books")).toBeInTheDocument();
    fireEvent(document, new Event("visibilitychange"));

    dateNow.mockReturnValue(start + 5 * 60_000 + 1);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(clearSession).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledWith("/lock");

    expect(await deviceDb.meta.get("pendingSignIn")).toBeUndefined();
  });
});
