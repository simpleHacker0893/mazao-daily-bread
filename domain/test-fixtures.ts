// Test-only builders for domain records. Synthetic data; never imported by app code.
import type { Item, Txn, TxnLine } from "./types";

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export const BUSINESS = "biz-1";
export const PROFILE = "profile-1";

/** 10:00 EAT on Monday 26 October 2026, plus `minutes`. */
export function at(minutes = 0): string {
  return new Date(
    Date.parse("2026-10-26T07:00:00.000Z") + minutes * 60_000,
  ).toISOString();
}

export function txn(fields: Partial<Txn> & Pick<Txn, "type">): Txn {
  const occurredAt = fields.occurredAt ?? at();
  return {
    id: nextId("txn"),
    businessId: BUSINESS,
    occurredAt,
    source: "manual",
    paymentMethod: null,
    totalAmount: 0,
    amountPaid: 0,
    overrides: [],
    createdBy: PROFILE,
    createdAt: occurredAt,
    ...fields,
  };
}

export function line(
  fields: Partial<TxnLine> & Pick<TxnLine, "txnId" | "quantity">,
): TxnLine {
  return {
    id: nextId("line"),
    businessId: BUSINESS,
    itemKind: "goods",
    description: "",
    unit: "kilo",
    unitPrice: 0,
    unitCost: 0,
    ...fields,
  };
}

export function item(fields: Partial<Item> & Pick<Item, "name">): Item {
  return {
    id: nextId("item"),
    businessId: BUSINESS,
    kind: "goods",
    unit: "kilo",
    allowsFractional: true,
    sellingPrice: 0,
    buyingPrice: 0,
    lowStockThreshold: null,
    isActive: true,
    createdBy: PROFILE,
    createdAt: at(),
    updatedAt: at(),
    ...fields,
  };
}

/** A void of `original`, copying its party ids as commitVoid does. */
export function voidOf(original: Txn, minutes = 1): Txn {
  return txn({
    type: "void",
    voidsTxnId: original.id,
    customerId: original.customerId,
    supplierId: original.supplierId,
    occurredAt: at(minutes),
  });
}
