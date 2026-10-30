import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { resolveDueRule, todayInNairobi } from "@/domain/dates";
import { defaultProfile } from "@/domain/operating-profile";
import { getBusinessDb } from "@/local/business-db";
import * as commits from "@/local/commit";
import {
  addItem,
  CommitError,
  commitStockAdjustment,
  saveSettings,
  upsertCustomer,
} from "@/local/commit";
import { NewSaleForm } from "./NewSaleForm";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

let businessId: string;
let db: ReturnType<typeof getBusinessDb>;
async function seedItem(name: string, allowsFractional = false) {
  const item = await addItem(
    { db, businessId, profileId: "profile-test" },
    {
      kind: "goods",
      name,
      unit: "piece",
      allowsFractional,
      sellingPrice: 12550,
      buyingPrice: 5000,
      lowStockThreshold: null,
    },
  );
  return item;
}

async function ready() {
  await waitFor(() =>
    expect(
      screen.queryByText("Loading items and customers…"),
    ).not.toBeInTheDocument(),
  );
}

function add(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Add item ${name}` }));
}

beforeEach(() => {
  businessId = `sales-form-${crypto.randomUUID()}`;
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

describe("NewSaleForm", () => {
  it("adds multiple item lines, edits price and quantity, and saves cents through commitSale", async () => {
    const sukuma = await seedItem("Sukuma");
    await seedItem("Mandazi");
    render(<NewSaleForm />);
    await ready();
    add("Sukuma");
    add("Mandazi");
    expect(screen.getAllByText("KES 125.50").length).toBeGreaterThan(0);

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Quantity Sukuma" }),
      { target: { value: "2" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Unit price Sukuma" }),
      { target: { value: "130.25" } },
    );
    expect(screen.getByText("KES 260.50")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Total" }).parentElement,
    ).toHaveTextContent("KES 386");
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));

    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    const sale = await db.txns.where("type").equals("sale").first();
    const lines = await db.lines
      .where("txnId")
      .equals(sale?.id ?? "")
      .toArray();
    expect(sale).toMatchObject({
      totalAmount: 38600,
      amountPaid: 38600,
      paymentMethod: "cash",
    });
    expect(lines).toHaveLength(2);
    expect(lines.find((line) => line.itemId === sukuma.id)).toMatchObject({
      quantity: 2,
      unitPrice: 13025,
    });
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/sales"));
  });

  it("rejects fractional quantities for whole items before commit and accepts allowed fractions", async () => {
    await seedItem("Whole", false);
    await seedItem("Fractional", true);
    render(<NewSaleForm />);
    await ready();
    add("Whole");
    const quantity = screen.getByRole("spinbutton", { name: "Quantity Whole" });
    expect(quantity).toHaveAttribute("step", "1");
    fireEvent.change(quantity, { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    expect(
      await screen.findByText(
        "This item can only be sold in whole quantities.",
      ),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("sale").count()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /Remove item Whole/ }));
    add("Fractional");
    expect(
      screen.getByRole("spinbutton", { name: "Quantity Fractional" }),
    ).toHaveAttribute("step", "0.001");
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Quantity Fractional" }),
      { target: { value: "1.125" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    const savedLine = await db.lines.toCollection().first();
    expect(savedLine?.quantity).toBe(1.125);
  });

  it("requires a customer for credit and creates a new customer atomically with the sale", async () => {
    await seedItem("Bread");
    render(<NewSaleForm />);
    await ready();
    add("Bread");
    fireEvent.change(screen.getByRole("textbox", { name: "Amount paid" }), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    expect(
      await screen.findByText("Choose who owes this."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Customer" }),
    ).toBeInTheDocument();
    expect(await db.customers.count()).toBe(0);

    fireEvent.change(screen.getByRole("combobox", { name: "Customer" }), {
      target: { value: "new" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Customer name" }), {
      target: { value: "Amina" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    expect(await db.customers.toCollection().first()).toMatchObject({
      name: "Amina",
    });
    expect(await db.txns.where("type").equals("sale").first()).toMatchObject({
      amountPaid: 5000,
      totalAmount: 12550,
    });
  });

  it("uses the configured due rule, and leaves due date unset when profile default is null", async () => {
    await seedItem("Chai");
    const profile = defaultProfile();
    await saveSettings(
      { db, businessId, profileId: "profile-test" },
      { ...profile, defaultDueRule: "kesho" },
    );
    await upsertCustomer(
      { db, businessId, profileId: "profile-test" },
      { name: "Juma" },
    );
    const { unmount } = render(<NewSaleForm />);
    await ready();
    add("Chai");
    fireEvent.change(screen.getByRole("textbox", { name: "Amount paid" }), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Customer" }), {
      target: { value: (await db.customers.toCollection().first())?.id },
    });
    expect(
      screen.getByRole("combobox", { name: "When will they pay?" }),
    ).toHaveValue("kesho");
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    expect(await db.txns.where("type").equals("sale").first()).toHaveProperty(
      "dueDate",
      resolveDueRule("kesho", todayInNairobi(new Date())),
    );

    unmount();
    await db.txns.clear();
    await db.lines.clear();
    await db.syncQueue.clear();
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    render(<NewSaleForm />);
    await ready();
    add("Chai");
    fireEvent.change(screen.getByRole("textbox", { name: "Amount paid" }), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Customer" }), {
      target: { value: (await db.customers.toCollection().first())?.id },
    });
    expect(
      screen.getByRole("combobox", { name: "When will they pay?" }),
    ).toHaveValue("none");
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    expect(
      await db.txns.where("type").equals("sale").first(),
    ).not.toHaveProperty("dueDate");
  });

  it("requires a second confirmation for a block and never offers override after a hard error", async () => {
    const item = await seedItem("Mango");
    await commitStockAdjustment(
      { db, businessId, profileId: "profile-test" },
      { itemId: item.id, quantity: 1, source: "onboarding" },
    );
    const profile = {
      ...defaultProfile(),
      rules: { ...defaultProfile().rules, negativeStock: "block" as const },
    };
    await saveSettings({ db, businessId, profileId: "profile-test" }, profile);
    const { unmount } = render(<NewSaleForm />);
    await ready();
    add("Mango");
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Quantity Mango" }),
      { target: { value: "2" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    expect(
      await screen.findByText("This sells more than you have in stock."),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("sale").count()).toBe(0);
    expect(screen.getAllByRole("button", { name: "Save anyway" })).toHaveLength(
      1,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));
    await waitFor(() =>
      expect(db.txns.where("type").equals("sale").count()).resolves.toBe(1),
    );
    expect(await db.txns.where("type").equals("sale").first()).toHaveProperty(
      "overrides",
      ["NEGATIVE_STOCK"],
    );

    unmount();
    await db.txns.clear();
    await db.lines.clear();
    await db.syncQueue.clear();
    const hardError = new CommitError(
      ["SCHEMA"],
      [
        {
          code: "SCHEMA",
          severity: "block",
          messageKey: "ledger.grill.schema",
        },
      ],
    );
    const commit = vi
      .spyOn(commits, "commitSale")
      .mockRejectedValueOnce(hardError);
    render(<NewSaleForm />);
    await ready();
    add("Mango");
    fireEvent.click(screen.getByRole("button", { name: "Save sale" }));
    expect(
      await screen.findByText("Something is missing or not valid."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save anyway" }),
    ).not.toBeInTheDocument();
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit.mock.calls[0]?.[2]).toEqual({});
    commit.mockRestore();
  });

  it("prevents a second submission while the first commit is pending", async () => {
    await seedItem("Tea");
    const commit = vi.spyOn(commits, "commitSale");
    let release!: () => void;
    commit.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({} as Awaited<ReturnType<typeof commits.commitSale>>);
        }),
    );
    render(<NewSaleForm />);
    await ready();
    add("Tea");
    const save = screen.getByRole("button", { name: "Save sale" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(commit).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/sales"));
    commit.mockRestore();
  });
});
