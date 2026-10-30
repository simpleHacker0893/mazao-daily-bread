import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import type { OnboardingProgress } from "@/domain/onboarding";
import { getBusinessDb } from "@/local/business-db";
import { writeOnboardingProgress } from "@/local/onboarding-progress";
import { BusinessProfileReview } from "./BusinessProfileReview";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

let businessId: string;
let db: ReturnType<typeof getBusinessDb>;

beforeEach(() => {
  businessId = `profile-review-${crypto.randomUUID()}`;
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

describe("BusinessProfileReview", () => {
  it("shows missing answers, routes edits back through onboarding, and saves items once", async () => {
    const item = {
      kind: "goods" as const,
      name: "Sukuma wiki",
      unit: "kilo",
      allowsFractional: true,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
    };
    const progress: OnboardingProgress = {
      status: "in_progress",
      stepId: "expenseCategories",
      answers: {
        businessName: "Mama Wanjiku",
        businessType: "vegetable_trader",
        sells: "goods",
        items: [item],
        paymentMethods: ["cash", "mpesa"],
        deniEnabled: true,
        defaultDueRule: null,
      },
      draftItems: [item],
      updatedAt: new Date().toISOString(),
    };
    await writeOnboardingProgress(db, progress);

    render(<BusinessProfileReview />);

    expect(await screen.findByText("Mama Wanjiku")).toBeInTheDocument();
    expect(
      screen.getAllByText("Not answered. Tap to add.").length,
    ).toBeGreaterThan(0);
    const firstEditButton = screen
      .getAllByRole("button", { name: "Edit" })
      .at(0);
    if (!firstEditButton)
      throw new Error("The business section has no Edit action.");
    fireEvent.click(firstEditButton);
    expect(navigation.push).toHaveBeenCalledWith(
      "/onboarding?mode=redo&return=review&step=businessName",
    );

    fireEvent.click(screen.getByRole("button", { name: "Set up Mazao" }));
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/notebook"),
    );
    expect(await db.items.count()).toBe(1);
    expect((await db.settings.get("operatingProfile"))?.value).toMatchObject({
      businessName: "Mama Wanjiku",
    });
  });
});
