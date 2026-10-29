import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { getBusinessDb } from "@/local/business-db";
import { readOnboardingProgress } from "@/local/onboarding-progress";
import { OnboardingFlow } from "./OnboardingFlow";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(),
}));

let businessId: string;
let db: ReturnType<typeof getBusinessDb>;

beforeEach(() => {
  businessId = `onboarding-flow-${crypto.randomUUID()}`;
  db = getBusinessDb(businessId);
  navigation.push.mockReset();
  navigation.replace.mockReset();
  setSession({
    profileId: "profile-test",
    businessId,
    clerkUserId: "clerk-test",
    email: "merchant@example.test",
  });
});

afterEach(async () => {
  clearSession();
  db.close();
  await db.delete();
});

describe("OnboardingFlow", () => {
  it("saves answers locally and lets a merchant skip without creating items", async () => {
    render(<OnboardingFlow />);

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Business name" }),
      { target: { value: "Mama Wanjiku" } },
    );
    await waitFor(async () =>
      expect((await readOnboardingProgress(db))?.answers.businessName).toBe(
        "Mama Wanjiku",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByRole("heading", {
        name: "What kind of business do you run?",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/dashboard"),
    );
    expect((await db.settings.get("operatingProfile"))?.value).toMatchObject({
      businessName: "Mama Wanjiku",
    });
    expect(await db.items.count()).toBe(0);
    expect((await readOnboardingProgress(db))?.status).toBe("skipped");
  });

  it("omits the due-rule question and adjusts the count when deni is never given", async () => {
    render(<OnboardingFlow />);

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Goods" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByRole("heading", {
        name: "Do you give customers deni?",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Never" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByRole("heading", {
        name: "Which expenses do you pay often?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Step 8 of 8", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "When do customers usually pay?" }),
    ).not.toBeInTheDocument();
  });
});
