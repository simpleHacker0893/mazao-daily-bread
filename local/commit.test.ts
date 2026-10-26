import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customerBalance, stockOnHand } from "@/domain/ledger";
import { defaultProfile } from "@/domain/operating-profile";
import type { DraftSale } from "@/domain/types";
import { type BusinessDb, openBusinessDb } from "./business-db";
import {
  addItem,
  type CommitContext,
  CommitError,
  commitExpense,
  commitOpening,
  commitPayment,
  commitSale,
  commitStockAdjustment,
  commitVoid,
  NeedsOverride,
  saveSettings,
} from "./commit";
import { countUnsynced } from "./queries";

let db: BusinessDb;
let ctx: CommitContext;
let clock: Date;

beforeEach(() => {
  const businessId = `biz-${crypto.randomUUID()}`;
  db = openBusinessDb(businessId);
  clock = new Date("2026-10-26T07:00:00.000Z");
  ctx = { db, businessId, profileId: "profile-1", now: () => clock };
});

afterEach(async () => {
  db.close();
  await db.delete();
});

async function sukuma() {
  return addItem(ctx, {
    kind: "goods",
    name: "Sukuma wiki",
    unit: "kilo",
    allowsFractional: true,
    sellingPrice: 5000,
    buyingPrice: 3000,
    lowStockThreshold: null,
  });
}

function sukumaSale(
  itemId: string,
  quantity: number,
  fields: Partial<DraftSale> = {},
): DraftSale {
  return {
    lines: [
      {
        itemId,
        itemKind: "goods",
        description: "Sukuma wiki",
        quantity,
        unit: "kilo",
        unitPrice: 5000,
      },
    ],
    totalAmount: quantity * 5000,
    amountPaid: quantity * 5000,
    paymentMethod: "cash",
    ...fields,
  };
}

async function stockUp(itemId: string, quantity: number) {
  await commitStockAdjustment(ctx, { itemId, quantity, source: "onboarding" });
}

const queueTables = async () =>
  (await db.syncQueue.orderBy("seq").toArray()).map((e) => e.table);

describe("commitSale", () => {
  it("a credit sale with a new customer writes customer, txn and lines in parent order", async () => {
    const item = await sukuma();
    await stockUp(item.id, 10);
    await db.syncQueue.clear();

    const draft: DraftSale = {
      lines: [
        {
          itemId: item.id,
          itemKind: "goods",
          description: "Sukuma wiki",
          quantity: 2,
          unit: "kilo",
          unitPrice: 5000,
        },
        {
          itemKind: null,
          description: "Bag",
          quantity: 1,
          unit: "piece",
          unitPrice: 1000,
        },
      ],
      totalAmount: 11000,
      amountPaid: 5000,
      paymentMethod: "cash",
      newCustomer: { name: "Wanjiku" },
      dueDate: "2026-10-30",
    };
    const txn = await commitSale(ctx, draft);

    const customers = await db.customers.toArray();
    expect(customers).toHaveLength(1);
    expect(customers[0]?.name).toBe("Wanjiku");
    expect(txn.customerId).toBe(customers[0]?.id);
    expect(await db.txns.where("type").equals("sale").count()).toBe(1);
    expect(await db.lines.where("txnId").equals(txn.id).count()).toBe(2);
    expect(await queueTables()).toEqual([
      "customers",
      "txns",
      "lines",
      "lines",
    ]);
    // unitCost comes from the item's buying price (D-015).
    const lines = await db.lines.where("txnId").equals(txn.id).toArray();
    expect(lines.map((l) => l.unitCost).sort()).toEqual([0, 3000]);
  });

  it("a commit that throws midway leaves no rows and no queue entries", async () => {
    const item = await sukuma();
    await stockUp(item.id, 10);
    const before = await db.syncQueue.count();
    vi.spyOn(db.lines, "bulkAdd").mockRejectedValueOnce(new Error("boom"));

    await expect(
      commitSale(ctx, sukumaSale(item.id, 1, { newCustomer: { name: "X" } })),
    ).rejects.toThrow("boom");
    expect(await db.customers.count()).toBe(0);
    expect(await db.txns.where("type").equals("sale").count()).toBe(0);
    expect(await db.syncQueue.count()).toBe(before);
  });

  it("override never lets a deni without a customer through (AC-07)", async () => {
    const item = await sukuma();
    await stockUp(item.id, 10);
    const deni = sukumaSale(item.id, 2, { amountPaid: 0 });
    await expect(commitSale(ctx, deni, { override: true })).rejects.toThrow(
      CommitError,
    );
    await expect(
      commitSale(ctx, deni, { override: true }),
    ).rejects.toMatchObject({ codes: ["DENI_NEEDS_CUSTOMER"] });
  });

  it("a block-level issue needs an override, then records its code (AC-08)", async () => {
    await saveSettings(ctx, {
      ...defaultProfile(),
      rules: { ...defaultProfile().rules, negativeStock: "block" },
    });
    const item = await sukuma();
    await stockUp(item.id, 1);

    await expect(commitSale(ctx, sukumaSale(item.id, 3))).rejects.toThrow(
      NeedsOverride,
    );
    expect(await db.txns.where("type").equals("sale").count()).toBe(0);

    const saved = await commitSale(ctx, sukumaSale(item.id, 3), {
      override: true,
    });
    expect(saved.overrides).toEqual(["NEGATIVE_STOCK"]);
  });

  it("warn-level issues save on the first try without overrides", async () => {
    const item = await sukuma();
    const saved = await commitSale(ctx, sukumaSale(item.id, 3));
    expect(saved.overrides).toEqual([]);
  });
});

describe("opening balances and stock (M6, M7)", () => {
  it("a customer opening balance with a new customer is one atomic write", async () => {
    const txn = await commitOpening(ctx, {
      party: "customer",
      newCustomer: { name: "Otieno" },
      amount: 50000,
      source: "onboarding",
    });
    expect(await db.customers.count()).toBe(1);
    expect(txn).toMatchObject({
      type: "opening_balance",
      totalAmount: 50000,
      amountPaid: 0,
      source: "onboarding",
    });
    expect(await queueTables()).toEqual(["customers", "txns"]);
    const all = await db.txns.toArray();
    expect(customerBalance(txn.customerId as string, all)).toBe(50000);
  });

  it("a forced failure after the customer write leaves neither", async () => {
    vi.spyOn(db.txns, "add").mockRejectedValueOnce(new Error("boom"));
    await expect(
      commitOpening(ctx, {
        party: "customer",
        newCustomer: { name: "Otieno" },
        amount: 50000,
        source: "onboarding",
      }),
    ).rejects.toThrow("boom");
    expect(await db.customers.count()).toBe(0);
    expect(await db.txns.count()).toBe(0);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it("a supplier opening balance commits with no deni-customer error", async () => {
    const txn = await commitOpening(ctx, {
      party: "supplier",
      newSupplier: { name: "Kamau" },
      amount: 80000,
      source: "onboarding",
    });
    expect(txn.supplierId).toBe((await db.suppliers.toArray())[0]?.id);
    expect(await queueTables()).toEqual(["suppliers", "txns"]);
  });

  it("opening stock above the selling price commits with no issues", async () => {
    const mayai = await addItem(ctx, {
      kind: "goods",
      name: "Mayai",
      unit: "tray",
      allowsFractional: false,
      sellingPrice: 45000,
      buyingPrice: 50000,
      lowStockThreshold: 2,
    });
    const txn = await commitStockAdjustment(ctx, {
      itemId: mayai.id,
      quantity: 10,
      source: "onboarding",
    });
    expect(txn).toMatchObject({ type: "stock_adjustment", totalAmount: 0 });
    expect(
      stockOnHand(mayai.id, await db.txns.toArray(), await db.lines.toArray()),
    ).toBe(10);
  });
});

describe("commitVoid", () => {
  it("reverses the balance and the stock; a second void is rejected (AC-04, AC-06)", async () => {
    const item = await sukuma();
    await stockUp(item.id, 10);
    const sale = await commitSale(
      ctx,
      sukumaSale(item.id, 3, {
        amountPaid: 5000,
        newCustomer: { name: "Wanjiku" },
      }),
    );
    const customerId = sale.customerId as string;
    const balance = async () =>
      customerBalance(customerId, await db.txns.toArray());
    const stock = async () =>
      stockOnHand(item.id, await db.txns.toArray(), await db.lines.toArray());
    expect(await balance()).toBe(10000);
    expect(await stock()).toBe(7);

    const theVoid = await commitVoid(ctx, sale.id);
    expect(theVoid).toMatchObject({
      type: "void",
      voidsTxnId: sale.id,
      customerId,
      totalAmount: 0,
    });
    expect(await balance()).toBe(0);
    expect(await stock()).toBe(10);
    await expect(commitVoid(ctx, sale.id)).rejects.toThrow(CommitError);
    await expect(commitVoid(ctx, theVoid.id)).rejects.toThrow(CommitError);
  });
});

describe("transactions and timestamps", () => {
  const expense = {
    amount: 5000,
    paymentMethod: "cash",
    expenseCategory: "ushuru",
  } as const;
  const otieno = {
    party: "customer",
    newCustomer: { name: "Otieno" },
    amount: 50000,
    source: "onboarding",
  } as const;

  it("two commits inside one outer transaction both persist or neither does", async () => {
    await expect(
      db.transaction("rw", db.tables, async () => {
        await commitExpense(ctx, expense);
        await commitOpening(ctx, otieno);
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await db.txns.count()).toBe(0);
    expect(await db.customers.count()).toBe(0);
    expect(await db.syncQueue.count()).toBe(0);

    await db.transaction("rw", db.tables, async () => {
      await commitExpense(ctx, expense);
      await commitOpening(ctx, otieno);
    });
    expect(await db.txns.count()).toBe(2);
  });

  it("every stored timestamp ends in Z and parses back to the same instant", async () => {
    const item = await sukuma();
    await commitSale(ctx, sukumaSale(item.id, 1));
    const stamps = [
      ...(await db.items.toArray()).flatMap((i) => [i.createdAt, i.updatedAt]),
      ...(await db.txns.toArray()).flatMap((t) => [t.occurredAt, t.createdAt]),
    ];
    expect(stamps.length).toBeGreaterThan(0);
    for (const s of stamps) {
      expect(s.endsWith("Z")).toBe(true);
      expect(new Date(s).toISOString()).toBe(s);
    }
  });
});

describe("countUnsynced (AC-16)", () => {
  it("counts records, not lines: 2 sales (3 lines), 1 expense and 1 payment = 4", async () => {
    const item = await sukuma();
    await stockUp(item.id, 20);
    const wanjiku = await commitOpening(ctx, {
      party: "customer",
      newCustomer: { name: "Wanjiku" },
      amount: 1000,
      source: "onboarding",
    });
    await db.syncQueue.clear();

    const oneLine = sukumaSale(item.id, 1);
    await commitSale(ctx, oneLine);
    await commitSale(ctx, {
      ...oneLine,
      lines: [...oneLine.lines, ...oneLine.lines],
      totalAmount: 10000,
      amountPaid: 10000,
    });
    await commitExpense(ctx, {
      amount: 5000,
      paymentMethod: "cash",
      expenseCategory: "ushuru",
    });
    await commitPayment(ctx, {
      customerId: wanjiku.customerId as string,
      amount: 1000,
      paymentMethod: "mpesa",
    });
    expect(await countUnsynced(db)).toBe(4);
  });
});
