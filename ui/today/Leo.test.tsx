import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/auth/session";
import { t } from "@/i18n/t";
import { LOCALE_KEY } from "@/i18n/use-locale";
import { getBusinessDb } from "@/local/business-db";
import {
  addItem,
  commitExpense,
  commitOpening,
  commitPayment,
  commitSale,
  commitStockAdjustment,
  commitVoid,
  upsertCustomer,
} from "@/local/commit";
import { deviceDb } from "@/local/device-db";
import { Muhtasari } from "@/ui/dashboard/Muhtasari";
import { Leo } from "./Leo";
import { shareSummary } from "./share-summary";

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
const profileId = "leo-profile";

function ctx(now: () => Date = () => new Date()) {
  return { db: getBusinessDb(businessId), businessId, profileId, now };
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
  vi.unstubAllGlobals();
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
  const base = Date.now();
  await commitSale(
    ctx(() => new Date(base - 3000)),
    {
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
    },
  );
  await commitSale(
    ctx(() => new Date(base - 2000)),
    {
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
    },
  );
  await commitExpense(
    ctx(() => new Date(base - 1000)),
    {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
    },
  );
}

function totalsOf(container: HTMLElement) {
  return Object.fromEntries(
    [...container.querySelectorAll("dt")].map((dt) => [
      dt.textContent,
      dt.nextElementSibling?.textContent,
    ]),
  );
}

describe("Leo", () => {
  it("AC-24: lists the 3 entries in time order with totals equal to Muhtasari", async () => {
    await seedWorkedExample();
    const leo = render(<Leo />);
    const totals = await screen.findByRole("region", {
      name: t("ledger.leo.totals"),
    });
    await waitFor(() =>
      expect(within(totals).getByText("KES 210")).toBeTruthy(),
    );
    const t1 = totalsOf(totals);
    expect(t1).toMatchObject({
      Sales: "KES 350",
      "Cost of goods": "KES 90",
      Expenses: "KES 50",
      "Faida Halisi": "KES 210",
      Cash: "KES 150",
      "M-Pesa": "KES 200",
    });
    const rows = leo.container.querySelectorAll("ul > li > button");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain("Sukuma wiki");
    expect(rows[1]?.textContent).toContain("Trip Gikomba-Town");
    expect(rows[2]?.textContent).toContain("ushuru");
    leo.unmount();

    // Muhtasari reads the same figures.
    render(<Muhtasari />);
    expect(
      await screen.findByText("Faida Halisi, net profit today, KES 210"),
    ).toBeTruthy();
    const statement = within(
      screen.getByLabelText(t("ledger.muhtasari.statement")),
    );
    expect(statement.getByText("KES 350")).toBeTruthy();
    expect(statement.getByText("KES 90")).toBeTruthy();
    expect(statement.getByText("KES 50")).toBeTruthy();
  });

  it("AC-25: shows Wanjiku bought 300, paid 250, owes 50, then struck-through payment after a void", async () => {
    const base = Date.now();
    const wanjiku = await upsertCustomer(ctx(), { name: "Wanjiku" });
    await commitSale(
      ctx(() => new Date(base - 3000)),
      {
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
      },
    );
    const payment = await commitPayment(
      ctx(() => new Date(base - 2000)),
      {
        customerId: wanjiku.id,
        amount: 15000,
        paymentMethod: "mpesa",
      },
    );
    render(<Leo />);
    const customers = await screen.findByRole("region", {
      name: t("ledger.leo.customers"),
    });
    const row = within(customers).getByRole("link", { name: /Wanjiku/ });
    expect(row.textContent).toContain("Bought KES 300");
    expect(row.textContent).toContain("Paid KES 250");
    expect(row.textContent).toContain("Owes KES 50");
    expect(row).toHaveProperty("pathname", "/debts/customer");

    await commitVoid(
      ctx(() => new Date(base - 1000)),
      payment.id,
    );
    await waitFor(() => {
      const updated = within(
        screen.getByRole("region", { name: t("ledger.leo.customers") }),
      ).getByRole("link", { name: /Wanjiku/ });
      expect(updated.textContent).toContain("Paid KES 100");
      expect(updated.textContent).toContain("Owes KES 200");
    });
    const struck = document.querySelectorAll(".line-through");
    expect(struck.length).toBeGreaterThan(0);
    expect(screen.getAllByText(t("ledger.leo.voided")).length).toBeGreaterThan(
      0,
    );
    // Totals are unchanged by the voided payment: sale 300, paid at the till 100.
    expect(
      totalsOf(screen.getByRole("region", { name: t("ledger.leo.totals") })),
    ).toMatchObject({ Sales: "KES 300", Cash: "KES 100", "M-Pesa": "KES 0" });
  });

  it("AC-26: brought-forward entries are listed apart and leave Sales and Faida Halisi at 0", async () => {
    const mayai = await addItem(ctx(), {
      kind: "goods",
      name: "Mayai",
      unit: "tray",
      allowsFractional: false,
      sellingPrice: 42000,
      buyingPrice: 25000,
      lowStockThreshold: null,
    });
    await commitOpening(ctx(), {
      party: "customer",
      newCustomer: { name: "Otieno" },
      amount: 50000,
      source: "onboarding",
    });
    await commitStockAdjustment(ctx(), {
      itemId: mayai.id,
      quantity: 10,
      source: "onboarding",
    });
    render(<Leo />);
    expect(
      await screen.findByRole("heading", {
        name: t("ledger.leo.broughtForward"),
      }),
    ).toBeTruthy();
    expect(screen.getByText(t("ledger.leo.notCounted"))).toBeTruthy();
    expect(screen.getByText("10 tray Mayai")).toBeTruthy();
    const totals = totalsOf(
      screen.getByRole("region", { name: t("ledger.leo.totals") }),
    );
    expect(totals).toMatchObject({
      Sales: "KES 0",
      "Faida Halisi": "KES 0",
    });
  });

  it("AC-27: a void today of an earlier sale is marked as changing that day's totals", async () => {
    const base = Date.now();
    const sale = await commitSale(
      ctx(() => new Date(base - 26 * 3_600_000)),
      {
        lines: [
          {
            itemKind: null,
            description: "Maize",
            quantity: 1,
            unit: "piece",
            unitPrice: 8000,
          },
        ],
        totalAmount: 8000,
        amountPaid: 8000,
        paymentMethod: "cash",
      },
    );
    await commitVoid(ctx(), sale.id);
    render(<Leo />);
    expect(
      await screen.findByText(/Changed .*totals, not today's/),
    ).toBeTruthy();
    expect(
      totalsOf(screen.getByRole("region", { name: t("ledger.leo.totals") })),
    ).toMatchObject({ Sales: "KES 0", "Faida Halisi": "KES 0" });
  });

  it("shows the empty state with a New sale link", async () => {
    render(<Leo />);
    expect(await screen.findByText(t("ledger.leo.empty"))).toBeTruthy();
    expect(
      screen.getByRole("link", { name: t("ledger.muhtasari.newSale") }),
    ).toHaveProperty("pathname", "/sales/new");
  });

  it("opens the record detail sheet when an entry is tapped", async () => {
    await commitExpense(ctx(), {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
    });
    render(<Leo />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Open record: ushuru/ }),
    );
    await waitFor(() =>
      expect(document.querySelector("dialog[open]")).toBeTruthy(),
    );
  });

  it("shares plain text without customer names by default, in the UI language", async () => {
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
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    render(<Leo />);
    await screen.findByText("Mayai");
    fireEvent.click(
      screen.getByRole("button", { name: t("ledger.leo.share") }),
    );
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const text = share.mock.calls[0]?.[0]?.text as string;
    expect(text).toContain("Faida Halisi: KES 300");
    expect(text).toContain("Deni given: KES 200");
    expect(text).not.toContain("Wanjiku");

    fireEvent.click(
      screen.getByRole("checkbox", { name: t("ledger.leo.includeNames") }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: t("ledger.leo.share") }),
    );
    await waitFor(() => expect(share).toHaveBeenCalledTimes(2));
    expect(share.mock.calls[1]?.[0]?.text).toContain("Wanjiku");
  });

  it("shares in Kiswahili when the device language is sw", async () => {
    await deviceDb.meta.put({ key: LOCALE_KEY, value: "sw" });
    await commitExpense(ctx(), {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
    });
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    render(<Leo />);
    fireEvent.click(
      await screen.findByRole("button", { name: t("ledger.leo.share", "sw") }),
    );
    await waitFor(() => expect(share).toHaveBeenCalled());
    const text = share.mock.calls[0]?.[0]?.text as string;
    expect(text).toContain(`${t("ledger.leo.text.expenses", "sw")}: KES 50`);
    expect(text).toContain("Faida Halisi");
  });
});

describe("shareSummary", () => {
  it("uses the Web Share API when present", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    await expect(shareSummary("hello")).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "hello" });
  });

  it("does nothing more when the merchant cancels the share sheet", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    await expect(shareSummary("hello")).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies to the clipboard when Web Share is missing or fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(shareSummary("hello")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hello");

    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("boom")),
      clipboard: { writeText },
    });
    await expect(shareSummary("again")).resolves.toBe("copied");
  });

  it("asks for a manual copy when nothing else works", async () => {
    vi.stubGlobal("navigator", {});
    await expect(shareSummary("hello")).resolves.toBe("manual");
  });
});
