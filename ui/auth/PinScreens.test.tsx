import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PENDING_SIGN_IN_KEY, type PendingSignIn } from "@/auth/after-sign-in";
import { setupPin } from "@/auth/pin-flow";
import { defaultProfile } from "@/domain/operating-profile";
import { getBusinessDb } from "@/local/business-db";
import { saveSettings } from "@/local/commit";
import { deviceDb } from "@/local/device-db";
import { LockScreen, SetPinScreen } from "./PinScreens";

const { authState, router, signOut } = vi.hoisted(() => ({
  authState: { isLoaded: true, isSignedIn: true, userId: "clerk-user-1" },
  router: { replace: vi.fn(), push: vi.fn() },
  signOut: vi.fn(async () => undefined),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => authState,
  useClerk: () => ({ signOut }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

const pending: PendingSignIn = {
  profileId: "profile-screen",
  businessId: "business-screen",
  clerkUserId: "clerk-user-1",
  email: "owner@example.test",
  hasData: false,
  mode: "first",
  createdAt: Date.now(),
};

beforeEach(async () => {
  await deviceDb.accounts.clear();
  await deviceDb.meta.clear();
  const business = getBusinessDb(pending.businessId);
  await business.settings.clear();
  await business.onboarding.clear();
  router.replace.mockReset();
  router.push.mockReset();
  signOut.mockReset();
  signOut.mockResolvedValue(undefined);
  authState.isLoaded = true;
  authState.isSignedIn = true;
  authState.userId = pending.clerkUserId;
});

describe("Set PIN screen", () => {
  it("requires matching entries, then persists and navigates only after setup succeeds", async () => {
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    render(<SetPinScreen />);

    const fields = await screen.findAllByLabelText(/four-digit PIN/i);
    const [pinField, confirmationField] = fields;
    if (!pinField || !confirmationField) {
      throw new Error("PIN fields did not render");
    }
    fireEvent.change(pinField, { target: { value: "2468" } });
    fireEvent.change(confirmationField, { target: { value: "1357" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(await deviceDb.accounts.count()).toBe(0);
    expect(router.replace).not.toHaveBeenCalled();

    fireEvent.change(pinField, { target: { value: "2468" } });
    fireEvent.change(confirmationField, { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/onboarding"),
    );
    const saved = await deviceDb.accounts.get(pending.profileId);
    expect(saved?.pinHash).not.toBe("2468");
    expect(await deviceDb.meta.get(PENDING_SIGN_IN_KEY)).toBeUndefined();
  });

  it("rejects a weak PIN in the visible form", async () => {
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    render(<SetPinScreen />);
    const fields = await screen.findAllByLabelText(/four-digit PIN/i);
    const [pinField, confirmationField] = fields;
    if (!pinField || !confirmationField) {
      throw new Error("PIN fields did not render");
    }
    fireEvent.change(pinField, { target: { value: "1234" } });
    fireEvent.change(confirmationField, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /less predictable/i,
    );
    expect(await deviceDb.accounts.count()).toBe(0);
  });

  it("redirects when the authenticated Clerk identity does not match the pending sign-in", async () => {
    authState.userId = "another-user";
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    render(<SetPinScreen />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/sign-in"),
    );
    expect(await deviceDb.accounts.count()).toBe(0);
  });
});

describe("PIN lock screen", () => {
  it("verifies locally before navigating to the app", async () => {
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    await setupPin({
      pin: "2468",
      confirmation: "2468",
      clerkUserId: pending.clerkUserId,
    });
    const business = getBusinessDb(pending.businessId);
    await saveSettings(
      {
        db: business,
        businessId: pending.businessId,
        profileId: pending.profileId,
      },
      defaultProfile(),
    );
    render(<LockScreen />);
    const field = await screen.findByLabelText("Four-digit PIN");
    fireEvent.change(field, { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "Unlock Mazao" }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/dashboard"),
    );
    expect(
      (await deviceDb.accounts.get(pending.profileId))?.lastUnlockedAt,
    ).toEqual(expect.any(Number));
  });

  it("keeps the user locked after an incorrect PIN and persists the failure", async () => {
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    await setupPin({
      pin: "2468",
      confirmation: "2468",
      clerkUserId: pending.clerkUserId,
    });
    render(<LockScreen />);
    fireEvent.change(await screen.findByLabelText("Four-digit PIN"), {
      target: { value: "1357" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock Mazao" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/not correct/i);
    expect(
      (await deviceDb.accounts.get(pending.profileId))?.failedAttempts,
    ).toBe(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("signs out before starting online PIN reset", async () => {
    await deviceDb.meta.put({ key: PENDING_SIGN_IN_KEY, value: pending });
    await setupPin({
      pin: "2468",
      confirmation: "2468",
      clerkUserId: pending.clerkUserId,
    });
    render(<LockScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Forgot PIN?" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(router.push).toHaveBeenCalledWith("/sign-in?mode=reset");
  });
});
