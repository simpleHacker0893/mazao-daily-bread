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
import * as commits from "@/local/commit";
import {
  addItem,
  CommitError,
  commitSale,
  commitVoid,
  upsertCustomer,
} from "@/local/commit";
import { SalesList } from "./SalesList";

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

let businessId: string;
let db: ReturnType<typeof getBusinessDb>;
const profileId = "sales-list-profile";

async function seedSale({
  paid = 12550,
  customer = false,
}: {
  paid?: number;
  customer?: boolean;
} = {}) {
  const context = { db, businessId, profileId, now: () => new Date() };
  const item = await addItem(context, {
    kind: "goods",
    name: "Mandazi",
    unit: "piece",
    allowsFractional: false,
    sellingPrice: 12550,
    buyingPrice: 5000,
    lowStockThreshold: null,
  });
  const party = customer
    ? await upsertCustomer(context, { name: "Wanjiku" })
    : undefined;
  return commitSale(context, {
    lines: [
      {
        itemId: item.id,
        itemKind: item.kind,
        description: item.name,
        quantity: 1,
        unit: item.unit,
        unitPrice: item.sellingPrice,
      },
    ],
    totalAmount: 12550,
    amountPaid: paid,
    paymentMethod: "mpesa",
    ...(party ? { customerId: party.id } : {}),
    externalReference: "MPESA-TEST",
  });
}

async function waitForSales() {
  await waitFor(() =>
    expect(
      screen.queryByText("Loading today's sales…"),
    ).not.toBeInTheDocument(),
  );
}

function openSale() {
  fireEvent.click(screen.getByRole("button", { name: /View sale details/ }));
  return screen.getByRole("dialog");
}

beforeEach(() => {
  businessId = `sales-list-${crypto.randomUUID()}`;
  db = getBusinessDb(businessId);
  setSession({
    profileId,
    businessId,
    clerkUserId: "sales-list-clerk",
    email: "merchant@example.test",
  });
});

afterEach(async () => {
  clearSession();
  db.close();
  await db.delete();
  vi.restoreAllMocks();
});

describe("SalesList", () => {
  it("shows loading and empty states for the signed-in business", async () => {
    render(<SalesList />);
    expect(screen.getByText("Loading today's sales…")).toBeInTheDocument();
    await waitForSales();
    expect(screen.getByText("No sales recorded today.")).toBeInTheDocument();
  });

  it("shows labels, time, paid amount, payment method, customer, and outstanding balance", async () => {
    await seedSale({ paid: 5000, customer: true });
    render(<SalesList />);
    await waitForSales();
    const saleCard = screen.getByRole("button", { name: /View sale details/ });
    expect(saleCard).toHaveTextContent("Mandazi");
    expect(saleCard).toHaveTextContent("KES 125.50");
    expect(saleCard).toHaveTextContent("KES 50");
    expect(saleCard).toHaveTextContent("KES 75.50");
    expect(saleCard).toHaveTextContent("M-Pesa");
    expect(saleCard).toHaveTextContent("Wanjiku");
    expect(saleCard).toHaveTextContent(/\d{1,2}:\d{2}/);
  });

  it("opens details and closes them accessibly", async () => {
    await seedSale({ customer: true });
    render(<SalesList />);
    await waitForSales();
    const dialog = openSale();
    expect(dialog).toHaveAttribute("open");
    expect(
      within(dialog).getByRole("heading", { name: "Sale details" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("MPESA-TEST")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close sale details" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("cancels void confirmation without writing a void record", async () => {
    await seedSale();
    render(<SalesList />);
    await waitForSales();
    const dialog = openSale();
    fireEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    expect(
      within(dialog).getByRole("heading", { name: "Void this sale?" }),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(await db.txns.where("type").equals("void").count()).toBe(0);
    expect(
      within(dialog).queryByRole("heading", { name: "Void this sale?" }),
    ).not.toBeInTheDocument();
  });

  it("commits a reversing record and updates the live list without removing the sale", async () => {
    const sale = await seedSale();
    render(<SalesList />);
    await waitForSales();
    const dialog = openSale();
    fireEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm void" }),
    );
    await waitFor(() =>
      expect(within(dialog).getByText("Voided")).toBeInTheDocument(),
    );
    expect(await db.txns.where("type").equals("sale").count()).toBe(1);
    expect(await db.txns.where("type").equals("void").count()).toBe(1);
    expect(await db.txns.get(sale.id)).toMatchObject({
      totalAmount: 12550,
      amountPaid: 12550,
    });
    expect(
      within(dialog).queryByRole("button", { name: "Void sale" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close sale details" }),
    );
    const card = screen.getByRole("button", { name: /View sale details/ });
    expect(card).toHaveTextContent("Voided");
    expect(card.querySelector("strong")).toHaveClass("line-through");
  });

  it("prevents duplicate void submissions", async () => {
    await seedSale();
    const realCommitVoid = commitVoid;
    let release!: () => void;
    const commit = vi
      .spyOn(commits, "commitVoid")
      .mockImplementation(async (...args) => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return realCommitVoid(...args);
      });
    render(<SalesList />);
    await waitForSales();
    const dialog = openSale();
    fireEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm void",
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(commit).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() =>
      expect(within(dialog).getByText("Voided")).toBeInTheDocument(),
    );
    commit.mockRestore();
  });

  it("surfaces a commit error when the sale is no longer voidable", async () => {
    await seedSale();
    const commit = vi
      .spyOn(commits, "commitVoid")
      .mockRejectedValueOnce(new CommitError(["CANNOT_VOID"]));
    render(<SalesList />);
    await waitForSales();
    const dialog = openSale();
    fireEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm void" }),
    );
    expect(
      await within(dialog).findByText(
        "This sale has already been voided or cannot be voided.",
      ),
    ).toBeInTheDocument();
    expect(commit).toHaveBeenCalledTimes(1);
  });
});
