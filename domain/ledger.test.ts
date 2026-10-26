import { describe, expect, it } from "vitest";
import {
  activeTxns,
  canVoid,
  customerBalance,
  customerLedger,
  isOverdue,
  openDeni,
  stockOnHand,
  supplierOwed,
} from "./ledger";
import { at, line, txn, voidOf } from "./test-fixtures";

const WANJIKU = "wanjiku";
const OTIENO = "otieno";

describe("Wanjiku's deni (blueprint B1 scenario)", () => {
  const sale = txn({
    type: "sale",
    customerId: WANJIKU,
    totalAmount: 30000,
    amountPaid: 10000,
    paymentMethod: "cash",
  });
  const payment = txn({
    type: "customer_payment",
    customerId: WANJIKU,
    totalAmount: 15000,
    amountPaid: 15000,
    paymentMethod: "mpesa",
    occurredAt: at(10),
  });
  const voided = voidOf(payment, 20);

  it("buys 300 and pays 100: owes 200", () => {
    expect(customerBalance(WANJIKU, [sale])).toBe(20000);
  });

  it("pays 150 more: owes 50", () => {
    expect(customerBalance(WANJIKU, [sale, payment])).toBe(5000);
  });

  it("voiding the payment brings her back to 200", () => {
    expect(customerBalance(WANJIKU, [sale, payment, voided])).toBe(20000);
  });

  it("the void shows in her party-filtered ledger, newest first", () => {
    const ledger = customerLedger(WANJIKU, [sale, payment, voided]);
    expect(ledger.map((t) => t.id)).toEqual([voided.id, payment.id, sale.id]);
  });
});

describe("opening balances", () => {
  it("Otieno brought forward 500: owes 500", () => {
    const opening = txn({
      type: "opening_balance",
      customerId: OTIENO,
      totalAmount: 50000,
      source: "onboarding",
    });
    expect(customerBalance(OTIENO, [opening])).toBe(50000);
  });

  it("supplierOwed sums active supplier opening balances only", () => {
    const owed = txn({
      type: "opening_balance",
      supplierId: "kamau",
      totalAmount: 80000,
    });
    const other = txn({
      type: "opening_balance",
      supplierId: "njoroge",
      totalAmount: 1000,
    });
    const cancelled = txn({
      type: "opening_balance",
      supplierId: "kamau",
      totalAmount: 500,
    });
    expect(
      supplierOwed("kamau", [owed, other, cancelled, voidOf(cancelled)]),
    ).toBe(80000);
  });
});

describe("activeTxns and canVoid", () => {
  const sale = txn({ type: "sale", totalAmount: 100, amountPaid: 100 });
  const theVoid = voidOf(sale);

  it("drops voided originals and the voids themselves", () => {
    const kept = txn({ type: "expense", totalAmount: 50, amountPaid: 50 });
    expect(activeTxns([sale, theVoid, kept])).toEqual([kept]);
  });

  it("allows voiding a live record", () => {
    expect(canVoid(sale, [sale])).toBe(true);
  });

  it("rejects a double void", () => {
    expect(canVoid(sale, [sale, theVoid])).toBe(false);
  });

  it("rejects a void of a void", () => {
    expect(canVoid(theVoid, [sale, theVoid])).toBe(false);
  });
});

describe("openDeni (FIFO)", () => {
  it("settles the oldest credit first across two credits", () => {
    const first = txn({
      type: "sale",
      customerId: WANJIKU,
      totalAmount: 10000,
      dueDate: "2026-10-27",
      occurredAt: at(0),
    });
    const second = txn({
      type: "sale",
      customerId: WANJIKU,
      totalAmount: 8000,
      dueDate: "2026-10-30",
      occurredAt: at(5),
    });
    const pay = txn({
      type: "customer_payment",
      customerId: WANJIKU,
      totalAmount: 12000,
      amountPaid: 12000,
      occurredAt: at(10),
    });
    expect(openDeni(WANJIKU, [second, first, pay])).toEqual([
      {
        txnId: second.id,
        remaining: 6000,
        dueDate: "2026-10-30",
        occurredAt: second.occurredAt,
      },
    ]);
  });

  it("treats an opening balance as a credit", () => {
    const opening = txn({
      type: "opening_balance",
      customerId: OTIENO,
      totalAmount: 50000,
      dueDate: "2026-10-20",
    });
    expect(openDeni(OTIENO, [opening])).toEqual([
      {
        txnId: opening.id,
        remaining: 50000,
        dueDate: "2026-10-20",
        occurredAt: opening.occurredAt,
      },
    ]);
  });

  it("carries an overpayment forward to settle a later credit", () => {
    const overpay = txn({
      type: "customer_payment",
      customerId: WANJIKU,
      totalAmount: 5000,
      amountPaid: 5000,
      occurredAt: at(0),
    });
    const later = txn({
      type: "sale",
      customerId: WANJIKU,
      totalAmount: 8000,
      occurredAt: at(30),
    });
    expect(customerBalance(WANJIKU, [overpay])).toBe(-5000);
    expect(openDeni(WANJIKU, [overpay, later])).toEqual([
      {
        txnId: later.id,
        remaining: 3000,
        dueDate: undefined,
        occurredAt: later.occurredAt,
      },
    ]);
  });

  it("ignores fully paid sales and other customers", () => {
    const paid = txn({
      type: "sale",
      customerId: WANJIKU,
      totalAmount: 100,
      amountPaid: 100,
    });
    const someoneElse = txn({
      type: "sale",
      customerId: OTIENO,
      totalAmount: 900,
    });
    expect(openDeni(WANJIKU, [paid, someoneElse])).toEqual([]);
  });
});

describe("isOverdue", () => {
  const credit = txn({
    type: "sale",
    customerId: WANJIKU,
    totalAmount: 1000,
    dueDate: "2026-10-25",
  });

  it("is true when an open deni is past its due date", () => {
    expect(isOverdue(WANJIKU, [credit], "2026-10-26")).toBe(true);
  });

  it("is false on the due date itself and once paid", () => {
    expect(isOverdue(WANJIKU, [credit], "2026-10-25")).toBe(false);
    const pay = txn({
      type: "customer_payment",
      customerId: WANJIKU,
      totalAmount: 1000,
      amountPaid: 1000,
    });
    expect(isOverdue(WANJIKU, [credit, pay], "2026-10-26")).toBe(false);
  });

  it("is false for a deni with no due date", () => {
    const noDate = txn({
      type: "sale",
      customerId: OTIENO,
      totalAmount: 1000,
    });
    expect(isOverdue(OTIENO, [noDate], "2030-01-01")).toBe(false);
  });
});

describe("stockOnHand", () => {
  const TRAY = "mayai";

  it("is opening stock minus goods sold", () => {
    const opening = txn({ type: "stock_adjustment", source: "onboarding" });
    const sale = txn({ type: "sale", totalAmount: 3000, amountPaid: 3000 });
    const lines = [
      line({ txnId: opening.id, itemId: TRAY, quantity: 10, unit: "tray" }),
      line({ txnId: sale.id, itemId: TRAY, quantity: 3, unit: "tray" }),
    ];
    expect(stockOnHand(TRAY, [opening, sale], lines)).toBe(7);
  });

  it("restores stock when a sale is voided and keeps fractions exact", () => {
    const opening = txn({ type: "stock_adjustment" });
    const sale = txn({ type: "sale" });
    const lines = [
      line({ txnId: opening.id, itemId: "sukuma", quantity: 2.5 }),
      line({ txnId: sale.id, itemId: "sukuma", quantity: 0.1 }),
      line({ txnId: sale.id, itemId: "sukuma", quantity: 0.2 }),
    ];
    expect(stockOnHand("sukuma", [opening, sale], lines)).toBe(2.2);
    expect(stockOnHand("sukuma", [opening, sale, voidOf(sale)], lines)).toBe(
      2.5,
    );
  });

  it("ignores service lines", () => {
    const sale = txn({ type: "sale" });
    const lines = [
      line({
        txnId: sale.id,
        itemId: "trip",
        itemKind: "service",
        quantity: 1,
      }),
    ];
    expect(stockOnHand("trip", [sale], lines)).toBe(0);
  });
});
