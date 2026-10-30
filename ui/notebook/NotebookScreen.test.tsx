import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { defaultProfile } from "@/domain/operating-profile";
import { getBusinessDb } from "@/local/business-db";
import {
  addItem,
  saveOpening,
  saveSettings,
  upsertCustomer,
} from "@/local/save";
import { NotebookScreen } from "./NotebookScreen";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  configurable: true,
  value(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  },
});
Object.defineProperty(HTMLDialogElement.prototype, "close", {
  configurable: true,
  value(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  },
});

const profileId = "notebook-profile";
let businessId: string;
let db: ReturnType<typeof getBusinessDb>;

const context = () => ({ db, businessId, profileId });

async function openScreen() {
  render(<NotebookScreen />);
  await screen.findByRole("button", { name: "Add customer balance" });
}

beforeEach(() => {
  businessId = `notebook-${crypto.randomUUID()}`;
  db = getBusinessDb(businessId);
  navigation.replace.mockReset();
  setSession({
    profileId,
    businessId,
    clerkUserId: "notebook-clerk",
    email: "merchant@example.test",
  });
});

afterEach(async () => {
  clearSession();
  db.close();
  await db.delete();
  vi.restoreAllMocks();
});

describe("NotebookScreen", () => {
  it("saves a new customer and opening balance together, and updates the total", async () => {
    await openScreen();
    fireEvent.change(screen.getByLabelText("Customer name"), {
      target: { value: "Otieno" },
    });
    fireEvent.change(screen.getByLabelText("Phone (optional)"), {
      target: { value: "0712345678" },
    });
    fireEvent.change(screen.getByLabelText("Amount (KES)"), {
      target: { value: "500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add customer balance" }),
    );

    await waitFor(() =>
      expect(
        db.txns.where("type").equals("opening_balance").count(),
      ).resolves.toBe(1),
    );
    expect(await db.customers.toArray()).toHaveLength(1);
    expect(await db.customers.toCollection().first()).toMatchObject({
      name: "Otieno",
      phone: "0712345678",
    });
    expect(await screen.findAllByText("Otieno")).not.toHaveLength(0);
    expect(screen.getAllByText("KES 500")).toHaveLength(2);
    expect(
      screen.getAllByText("This is not counted as sales.", { exact: true }),
    ).toHaveLength(2);
  });

  it("chooses an existing customer and saves an optional due date", async () => {
    await upsertCustomer(context(), { name: "Wanjiku" });
    await openScreen();

    fireEvent.click(screen.getByRole("button", { name: "Wanjiku" }));
    fireEvent.change(screen.getByLabelText("Amount (KES)"), {
      target: { value: "450" },
    });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), {
      target: { value: "2026-11-02" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add customer balance" }),
    );

    await waitFor(() =>
      expect(
        db.txns.where("type").equals("opening_balance").count(),
      ).resolves.toBe(1),
    );
    expect(
      await db.txns.where("type").equals("opening_balance").first(),
    ).toMatchObject({
      totalAmount: 45000,
      dueDate: "2026-11-02",
      customerId: (await db.customers.toCollection().first())?.id,
    });
  });

  it("saves a new supplier without requiring a customer", async () => {
    await openScreen();
    fireEvent.click(screen.getByRole("tab", { name: "Suppliers I owe" }));
    fireEvent.change(screen.getByLabelText("Supplier name"), {
      target: { value: "Flour supplier" },
    });
    fireEvent.change(screen.getByLabelText("Amount (KES)"), {
      target: { value: "800" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add supplier balance" }),
    );

    await waitFor(() =>
      expect(
        db.txns.where("type").equals("opening_balance").count(),
      ).resolves.toBe(1),
    );
    expect(await db.suppliers.count()).toBe(1);
    const opening = await db.txns
      .where("type")
      .equals("opening_balance")
      .first();
    expect(opening).toMatchObject({
      supplierId: expect.any(String),
      totalAmount: 80000,
    });
    expect(opening).not.toHaveProperty("customerId");
    expect(await screen.findAllByText("Flour supplier")).not.toHaveLength(0);
    expect(screen.getAllByText("KES 800")).toHaveLength(2);
  });

  it("only lists goods, refuses fractional stock for whole items, and adds valid stock", async () => {
    const item = await addItem(context(), {
      kind: "goods",
      name: "Mayai",
      unit: "tray",
      allowsFractional: false,
      sellingPrice: 5000,
      buyingPrice: 3000,
      lowStockThreshold: null,
    });
    const fractionalItem = await addItem(context(), {
      kind: "goods",
      name: "Sukuma",
      unit: "kilo",
      allowsFractional: true,
      sellingPrice: 2500,
      buyingPrice: 1200,
      lowStockThreshold: null,
    });
    await addItem(context(), {
      kind: "service",
      name: "Delivery",
      unit: "trip",
      allowsFractional: false,
      sellingPrice: 10000,
      buyingPrice: 0,
      lowStockThreshold: null,
    });
    await openScreen();
    fireEvent.click(screen.getByRole("tab", { name: "Stock I have" }));

    expect(screen.getByText("Mayai")).toBeInTheDocument();
    expect(screen.getByText("Sukuma")).toBeInTheDocument();
    expect(screen.queryByText("Delivery")).not.toBeInTheDocument();
    const mayaiRow = screen.getByText("Mayai").closest("li");
    if (!mayaiRow) throw new Error("Mayai stock row is missing");
    fireEvent.change(within(mayaiRow).getByLabelText("Quantity (tray)"), {
      target: { value: "0" },
    });
    fireEvent.click(
      within(mayaiRow).getByRole("button", { name: "Add stock" }),
    );
    expect(await db.txns.where("type").equals("stock_adjustment").count()).toBe(
      0,
    );

    fireEvent.change(within(mayaiRow).getByLabelText("Quantity (tray)"), {
      target: { value: "2.5" },
    });
    fireEvent.click(
      within(mayaiRow).getByRole("button", { name: "Add stock" }),
    );
    expect(
      await screen.findByText("This item only allows whole quantities."),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("stock_adjustment").count()).toBe(
      0,
    );

    fireEvent.change(within(mayaiRow).getByLabelText("Quantity (tray)"), {
      target: { value: "10" },
    });
    fireEvent.click(
      within(mayaiRow).getByRole("button", { name: "Add stock" }),
    );
    await waitFor(() =>
      expect(
        db.txns.where("type").equals("stock_adjustment").count(),
      ).resolves.toBe(1),
    );
    expect(await db.lines.toCollection().first()).toMatchObject({
      itemId: item.id,
      quantity: 10,
      unit: "tray",
    });
    expect(mayaiRow).toHaveTextContent("Already brought forward: 10 tray");

    const sukumaRow = screen.getByText("Sukuma").closest("li");
    if (!sukumaRow) throw new Error("Sukuma stock row is missing");
    fireEvent.change(within(sukumaRow).getByLabelText("Quantity (kilo)"), {
      target: { value: "2.125" },
    });
    fireEvent.click(
      within(sukumaRow).getByRole("button", { name: "Add stock" }),
    );
    await waitFor(() =>
      expect(
        db.txns.where("type").equals("stock_adjustment").count(),
      ).resolves.toBe(2),
    );
    expect(await db.lines.toArray()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: item.id, quantity: 10 }),
        expect.objectContaining({ itemId: fractionalItem.id, quantity: 2.125 }),
      ]),
    );
  });

  it("requires confirmation to void and keeps the voided row visible", async () => {
    await openScreen();
    fireEvent.change(screen.getByLabelText("Customer name"), {
      target: { value: "Otieno" },
    });
    fireEvent.change(screen.getByLabelText("Amount (KES)"), {
      target: { value: "500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add customer balance" }),
    );
    await screen.findAllByText("Otieno");

    fireEvent.click(screen.getByRole("button", { name: "Void record" }));
    const confirmButton = screen.getByRole("button", { name: "Confirm void" });
    fireEvent.click(confirmButton);

    expect(await screen.findByText("Voided")).toBeInTheDocument();
    expect(await db.txns.where("type").equals("void").count()).toBe(1);
    const total = screen.getByRole("heading", {
      name: /Brought forward/,
    }).parentElement;
    expect(total).toHaveTextContent("KES 0");
    expect(screen.getByText("Voided").closest("li")).toHaveClass("opacity-75");
  });

  it("asks for confirmation before an override-level duplicate is saved", async () => {
    const customer = await upsertCustomer(context(), { name: "Wanjiku" });
    const profile = defaultProfile();
    profile.rules.duplicate = "block";
    await saveSettings(context(), profile);
    await saveOpening(context(), {
      party: "customer",
      customerId: customer.id,
      amount: 50000,
      source: "onboarding",
    });
    await openScreen();
    fireEvent.click(screen.getByRole("button", { name: "Wanjiku" }));
    fireEvent.change(screen.getByLabelText("Amount (KES)"), {
      target: { value: "500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add customer balance" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Save this entry anyway?"),
    ).toBeInTheDocument();
    expect(await db.txns.where("type").equals("opening_balance").count()).toBe(
      1,
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save anyway" }),
    );

    await waitFor(() =>
      expect(
        db.txns.where("type").equals("opening_balance").count(),
      ).resolves.toBe(2),
    );
  });

  it("routes Done and Do this later to the current app home", async () => {
    await openScreen();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: "Do this later" }));
    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard");
  });
});
