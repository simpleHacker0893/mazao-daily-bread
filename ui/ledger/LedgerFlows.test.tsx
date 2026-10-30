import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { getBusinessDb } from "@/local/business-db";
import {
  addItem,
  commitExpense,
  commitSale,
  upsertCustomer,
} from "@/local/commit";
import { savePayment } from "@/local/save";
import { CustomerLedger } from "./CustomerLedger";
import { DeniList } from "./DeniList";
import { ExpensesList } from "./ExpensesList";
import { ItemsScreen } from "./ItemsScreen";
import { NewExpenseForm } from "./NewExpenseForm";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

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

const profileId = "ledger-ui-profile";
let businessId: string;
let db: ReturnType<typeof getBusinessDb>;

function context() {
  return { db, businessId, profileId, now: () => new Date() };
}

async function seedCustomerSale() {
  const ctx = context();
  const customer = await upsertCustomer(ctx, { name: "Wanjiku" });
  const item = await addItem(ctx, {
    kind: "goods",
    name: "Mayai",
    unit: "tray",
    allowsFractional: false,
    sellingPrice: 30000,
    buyingPrice: 20000,
    lowStockThreshold: 2,
  });
  const sale = await commitSale(ctx, {
    lines: [
      {
        itemId: item.id,
        itemKind: "goods",
        description: item.name,
        quantity: 1,
        unit: item.unit,
        unitPrice: item.sellingPrice,
      },
    ],
    totalAmount: 30000,
    amountPaid: 10000,
    paymentMethod: "cash",
    customerId: customer.id,
  });
  return { customer, item, sale };
}

beforeEach(() => {
  businessId = `ledger-ui-${crypto.randomUUID()}`;
  db = getBusinessDb(businessId);
  navigation.push.mockReset();
  setSession({
    profileId,
    businessId,
    clerkUserId: "ledger-ui-clerk",
    email: "merchant@example.test",
  });
});

afterEach(async () => {
  clearSession();
  db.close();
  await db.delete();
  vi.restoreAllMocks();
});

describe("customer deni flows", () => {
  it("shows domain-derived outstanding totals and links to the customer ledger", async () => {
    const { customer } = await seedCustomerSale();
    render(<DeniList />);

    const outstanding = (await screen.findByText("Total outstanding"))
      .parentElement;
    expect(
      await within(outstanding as HTMLElement).findByText("KES 200"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `View customer ledger: ${customer.name}`,
      }),
    ).toHaveAttribute(
      "href",
      `/debts/customer?id=${encodeURIComponent(customer.id)}`,
    );
  });

  it("records a partial payment and updates the customer ledger balance", async () => {
    const { customer } = await seedCustomerSale();
    render(<CustomerLedger customerId={customer.id} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Record payment" }),
    );
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("Wanjiku");
    await within(dialog).findByText("All KES 200");
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Amount received (KES)" }),
      { target: { value: "250" } },
    );
    expect(
      await within(dialog).findByText("Wanjiku is in credit KES 50"),
    ).toBeInTheDocument();
    expect(
      await within(dialog).findByText(
        "That's KES 50 more than Wanjiku owes. It will be kept as credit.",
      ),
    ).toBeInTheDocument();
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Amount received (KES)" }),
      { target: { value: "150" } },
    );
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(async () =>
      expect(
        await db.txns.where("type").equals("customer_payment").count(),
      ).toBe(1),
    );
    expect(
      await screen.findByText("Wanjiku owes you KES 50"),
    ).toBeInTheDocument();
    expect(
      await db.syncQueue.filter((entry) => entry.table === "txns").count(),
    ).toBe(2);

    fireEvent.click(
      await screen.findByRole("button", { name: /Record details, Payment/ }),
    );
    const detail = await screen.findByRole("dialog");
    await within(detail).findByRole("heading", { name: "Payment received" });
    fireEvent.click(
      within(detail).getByRole("button", { name: "Void record" }),
    );
    fireEvent.click(
      within(detail).getByRole("button", { name: "Confirm void" }),
    );
    await waitFor(async () =>
      expect(await db.txns.where("type").equals("void").count()).toBe(1),
    );
    expect(
      await screen.findByText("Wanjiku owes you KES 200"),
    ).toBeInTheDocument();
  });

  it("writes a payment through the local save adapter", async () => {
    const { customer } = await seedCustomerSale();
    const outcome = await savePayment(context(), {
      customerId: customer.id,
      amount: 15000,
      paymentMethod: "cash",
    });
    expect(outcome.kind).toBe("saved");
    expect(await db.txns.where("type").equals("customer_payment").count()).toBe(
      1,
    );
  });
});

describe("expense and item flows", () => {
  it("opens expense details and voids an expense without removing its record", async () => {
    await commitExpense(context(), {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
      description: "Market gate",
    });
    render(<ExpensesList />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Record details/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByRole("heading", { name: "Expense details" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Market gate")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Void record" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm void" }),
    );

    await waitFor(async () =>
      expect(await db.txns.where("type").equals("void").count()).toBe(1),
    );
    expect(within(dialog).getByText("Voided")).toBeInTheDocument();
    expect(await db.txns.where("type").equals("expense").count()).toBe(1);
  });

  it("saves a goods item and a service item with only the relevant fields", async () => {
    render(<ItemsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Add item" }));
    let dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Item name"), {
      target: { value: "Sukuma wiki" },
    });
    fireEvent.change(within(dialog).getByLabelText("Selling price (KES)"), {
      target: { value: "50" },
    });
    fireEvent.change(within(dialog).getByLabelText("Buying price (KES)"), {
      target: { value: "30" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save item" }));
    await waitFor(async () => expect(await db.items.count()).toBe(1));

    fireEvent.click(await screen.findByRole("button", { name: "Add item" }));
    dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Service" }));
    expect(
      within(dialog).queryByLabelText("Buying price (KES)"),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Low-stock alert at"),
    ).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Item name"), {
      target: { value: "Trip Gikomba–Town" },
    });
    fireEvent.change(within(dialog).getByLabelText("Selling price (KES)"), {
      target: { value: "200" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save item" }));

    await waitFor(async () => expect(await db.items.count()).toBe(2));
    const service = await db.items.where("kind").equals("service").first();
    expect(service).toMatchObject({
      name: "Trip Gikomba–Town",
      unit: "trip",
      buyingPrice: 0,
      lowStockThreshold: null,
    });
  });

  it("saves an expense and routes back to today's list", async () => {
    render(<NewExpenseForm />);
    fireEvent.change(
      await screen.findByRole("textbox", { name: "Amount (KES)" }),
      { target: { value: "50" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "ushuru" }));
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    await waitFor(async () =>
      expect(await db.txns.where("type").equals("expense").count()).toBe(1),
    );
    expect(navigation.push).toHaveBeenCalledWith("/expenses");
    const expense = await db.txns.where("type").equals("expense").first();
    expect(expense).toMatchObject({
      expenseCategory: "ushuru",
      totalAmount: 5000,
      paymentMethod: "cash",
    });
  });
});
