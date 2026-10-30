import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { defaultProfile } from "@/domain/operating-profile";
import { getBusinessDb } from "@/local/business-db";
import { saveSettings } from "@/local/commit";
import { NewExpenseForm } from "./NewExpenseForm";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

let businessId: string;
let db: ReturnType<typeof getBusinessDb>;

async function ready() {
  await screen.findByRole("textbox", { name: "Amount (KES)" });
}

beforeEach(() => {
  businessId = `expense-form-${crypto.randomUUID()}`;
  db = getBusinessDb(businessId);
  navigation.push.mockReset();
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

describe("NewExpenseForm", () => {
  it("saves a selected expense with its amount, method, and note", async () => {
    const profile = defaultProfile();
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    render(<NewExpenseForm />);
    await ready();

    fireEvent.change(screen.getByRole("textbox", { name: "Amount (KES)" }), {
      target: { value: "150.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "transport" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Note (optional)" }), {
      target: { value: "Fuel for delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    await waitFor(async () =>
      expect(await db.txns.where("type").equals("expense").count()).toBe(1),
    );
    const expense = await db.txns.where("type").equals("expense").first();
    expect(expense).toMatchObject({
      totalAmount: 15000,
      paymentMethod: "cash",
      expenseCategory: "transport",
      description: "Fuel for delivery",
    });
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/expenses"),
    );
  });

  it("rejects an invalid amount without writing an expense", async () => {
    const profile = defaultProfile();
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    render(<NewExpenseForm />);
    await ready();

    fireEvent.change(screen.getByRole("textbox", { name: "Amount (KES)" }), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(
      await screen.findByText(
        "Enter an amount above zero with up to two decimal places.",
      ),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("expense").count()).toBe(0);
  });

  it("requires a category before saving", async () => {
    const profile = defaultProfile();
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    render(<NewExpenseForm />);
    await ready();

    fireEvent.change(screen.getByRole("textbox", { name: "Amount (KES)" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(
      await screen.findByText("Choose or add a category."),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("expense").count()).toBe(0);
  });

  it("persists the expense and sync-queue entry locally before navigation", async () => {
    const profile = defaultProfile();
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    render(<NewExpenseForm />);
    await ready();

    fireEvent.change(screen.getByRole("textbox", { name: "Amount (KES)" }), {
      target: { value: "200.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "fuel" }));
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    await waitFor(async () =>
      expect(await db.txns.where("type").equals("expense").count()).toBe(1),
    );
    const expense = await db.txns.where("type").equals("expense").first();
    expect(expense).toMatchObject({
      totalAmount: 20000,
      expenseCategory: "fuel",
    });
    expect(
      await db.syncQueue.filter((entry) => entry.table === "txns").count(),
    ).toBe(1);
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/expenses"),
    );
  });
});
