import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { t } from "@/i18n/t";
import { LOCALE_KEY } from "@/i18n/use-locale";
import { getBusinessDb } from "@/local/business-db";
import {
  addItem,
  commitExpense,
  commitOpening,
  commitSale,
  upsertCustomer,
} from "@/local/commit";
import { deviceDb } from "@/local/device-db";
import { Muhtasari } from "./Muhtasari";

let businessId: string;
const profileId = "muhtasari-profile";

function ctx() {
  return {
    db: getBusinessDb(businessId),
    businessId,
    profileId,
    now: () => new Date(),
  };
}

beforeEach(() => {
  businessId = `biz-${crypto.randomUUID()}`;
  setSession({
    profileId,
    businessId,
    clerkUserId: "user_1",
    email: "merchant@example.com",
  });
});

afterEach(async () => {
  clearSession();
  await deviceDb.meta.delete(LOCALE_KEY);
});

async function seedWorkedExample() {
  const sukuma = await addItem(ctx(), {
    kind: "goods",
    name: "Sukuma wiki",
    unit: "kilo",
    allowsFractional: true,
    sellingPrice: 5000,
    buyingPrice: 3000,
    lowStockThreshold: null,
  });
  const trip = await addItem(ctx(), {
    kind: "service",
    name: "Trip Gikomba-Town",
    unit: "trip",
    allowsFractional: false,
    sellingPrice: 20000,
    buyingPrice: 0,
    lowStockThreshold: null,
  });
  await commitSale(ctx(), {
    lines: [
      {
        itemId: sukuma.id,
        itemKind: "goods",
        description: "",
        quantity: 3,
        unit: "kilo",
        unitPrice: 5000,
      },
    ],
    totalAmount: 15000,
    amountPaid: 15000,
    paymentMethod: "cash",
  });
  await commitSale(ctx(), {
    lines: [
      {
        itemId: trip.id,
        itemKind: "service",
        description: "",
        quantity: 1,
        unit: "trip",
        unitPrice: 20000,
      },
    ],
    totalAmount: 20000,
    amountPaid: 20000,
    paymentMethod: "mpesa",
  });
  await commitExpense(ctx(), {
    amount: 5000,
    paymentMethod: "cash",
    expenseCategory: "ushuru",
  });
}

describe("Muhtasari", () => {
  it("shows the empty state and a zero hero before anything is recorded", async () => {
    render(<Muhtasari />);
    expect(await screen.findByText(t("ledger.muhtasari.empty"))).toBeTruthy();
    expect(
      screen.getByText("Faida Halisi, net profit today, KES 0"),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: t("ledger.muhtasari.newSale") }),
    ).toHaveProperty("pathname", "/sales/new");
  });

  it("shows 210 as the hero with the 350, 90, 50 statement for the worked example", async () => {
    await seedWorkedExample();
    render(<Muhtasari />);
    expect(
      await screen.findByText("Faida Halisi, net profit today, KES 210"),
    ).toBeTruthy();
    expect(screen.getByTestId("muhtasari-amount").textContent).toBe("KES 210");
    const list = within(screen.getByLabelText(t("ledger.muhtasari.statement")));
    expect(list.getByText("KES 350")).toBeTruthy();
    expect(list.getByText("KES 90")).toBeTruthy();
    expect(list.getByText("KES 50")).toBeTruthy();
    expect(screen.queryByText(t("ledger.muhtasari.empty"))).toBeNull();
    // Money in: cash 150 and M-Pesa 200; deni given is separate.
    expect(screen.getByText("KES 150")).toBeTruthy();
    expect(screen.getByText("KES 200")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /See everything recorded today \(3\)/ }),
    ).toHaveProperty("pathname", "/today");
  });

  it("shows a loss with a leading minus", async () => {
    await commitExpense(ctx(), {
      amount: 12000,
      paymentMethod: "cash",
      expenseCategory: "transport",
    });
    render(<Muhtasari />);
    expect(
      await screen.findByText("Faida Halisi, net profit today, KES -120"),
    ).toBeTruthy();
  });

  it("lists who owes first and supplier deni brought forward", async () => {
    const wanjiku = await upsertCustomer(ctx(), { name: "Wanjiku" });
    await commitSale(ctx(), {
      lines: [
        {
          itemKind: null,
          description: "Mayai",
          quantity: 1,
          unit: "tray",
          unitPrice: 30000,
        },
      ],
      totalAmount: 30000,
      amountPaid: 10000,
      paymentMethod: "cash",
      customerId: wanjiku.id,
    });
    await commitOpening(ctx(), {
      party: "supplier",
      newSupplier: { name: "Gikomba Wholesale" },
      amount: 12000,
      source: "onboarding",
    });
    render(<Muhtasari />);
    const link = await screen.findByRole("link", { name: /Wanjiku/ });
    expect(link.textContent).toContain("KES 200");
    expect(link).toHaveProperty("pathname", "/debts/customer");
    await waitFor(() =>
      expect(screen.getByText(t("ledger.muhtasari.supplierDeni"))).toBeTruthy(),
    );
    expect(screen.getByText("KES 120")).toBeTruthy();
  });

  it("shows its labels in Kiswahili when the device language is sw", async () => {
    await deviceDb.meta.put({ key: LOCALE_KEY, value: "sw" });
    render(<Muhtasari />);
    expect(
      await screen.findByRole("heading", {
        name: t("shell.page.overview", "sw"),
      }),
    ).toBeTruthy();
    expect(
      await screen.findByText(t("ledger.muhtasari.whoOwes", "sw")),
    ).toBeTruthy();
    expect(screen.getAllByText("Faida Halisi").length).toBeGreaterThan(0);
  });
});
