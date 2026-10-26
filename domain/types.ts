// Shared contract (R-011): the records every number is derived from. Frozen after B1 merges;
// change only with both devs agreeing. Money is integer cents; timestamps come only from
// `new Date().toISOString()` (UTC, ending in Z); due dates are YYYY-MM-DD.

/** uuid v4, generated on the phone. */
export type Id = string;

/** Integer cents. Never a float of shillings. */
export type Cents = number;

/** An ISO-8601 UTC timestamp ending in Z. */
export type IsoTime = string;

/** A calendar day, YYYY-MM-DD. */
export type Day = string;

export type ItemKind = "goods" | "service";
export type PaymentMethod = "cash" | "mpesa" | "other";
export type TxnSource = "manual" | "onboarding";

/** R0 transaction types. `purchase` and `supplier_payment` arrive in R1. */
export type TxnType =
  | "sale"
  | "expense"
  | "customer_payment"
  | "opening_balance"
  | "stock_adjustment"
  | "void";

export type Item = {
  id: Id;
  businessId: Id;
  kind: ItemKind;
  name: string;
  unit: string;
  allowsFractional: boolean;
  sellingPrice: Cents;
  buyingPrice: Cents;
  lowStockThreshold: number | null;
  isActive: boolean;
  createdBy: Id;
  createdAt: IsoTime;
  updatedAt: IsoTime;
};

export type Customer = {
  id: Id;
  businessId: Id;
  name: string;
  phone?: string;
  notes?: string;
  isFavorite: boolean;
  createdBy: Id;
  createdAt: IsoTime;
  updatedAt: IsoTime;
};

export type Supplier = Customer;

/**
 * One confirmed record. Immutable once saved; corrections are a `void` plus a new record.
 * Conventions:
 * - payments: totalAmount = amountPaid = amount;
 * - opening_balance: totalAmount = amount, amountPaid = 0, exactly one of customerId/supplierId;
 * - stock_adjustment: totalAmount = 0, lines carry signed quantities;
 * - void: totalAmount = 0, voidsTxnId set, customerId/supplierId copied from the original.
 */
export type Txn = {
  id: Id;
  businessId: Id;
  type: TxnType;
  occurredAt: IsoTime;
  source: TxnSource;
  paymentMethod: PaymentMethod | null;
  customerId?: Id;
  supplierId?: Id;
  voidsTxnId?: Id;
  expenseCategory?: string;
  description?: string;
  dueDate?: Day;
  dueDateNote?: string;
  totalAmount: Cents;
  amountPaid: Cents;
  externalReference?: string;
  overrides: string[];
  createdBy: Id;
  createdAt: IsoTime;
};

export type TxnLine = {
  id: Id;
  txnId: Id;
  businessId: Id;
  itemId?: Id;
  itemKind: ItemKind | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: Cents;
  unitCost: Cents;
};

/** A party created together with the record that names it (M6). `id` is stamped by commit when absent. */
export type NewParty = { id?: Id; name: string; phone?: string };

/** A sale line before saving: an item, or a free-text line with no item. */
export type DraftLine = {
  itemId?: Id;
  itemKind: ItemKind | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: Cents;
};

export type DraftSale = {
  lines: DraftLine[];
  totalAmount: Cents;
  amountPaid: Cents;
  paymentMethod: PaymentMethod | null;
  customerId?: Id;
  newCustomer?: NewParty;
  dueDate?: Day;
  dueDateNote?: string;
  description?: string;
  externalReference?: string;
};

export type DraftExpense = {
  amount: Cents;
  paymentMethod: PaymentMethod;
  expenseCategory: string;
  description?: string;
};

export type DraftPayment = {
  customerId: Id;
  amount: Cents;
  paymentMethod: PaymentMethod;
  externalReference?: string;
};

type OpeningCommon = {
  amount: Cents;
  dueDate?: Day;
  dueDateNote?: string;
  source: TxnSource;
};

/** Brought forward from the notebook: one party, either existing or new (never both). */
export type DraftOpening = OpeningCommon &
  (
    | { party: "customer"; customerId: Id }
    | { party: "customer"; newCustomer: NewParty }
    | { party: "supplier"; supplierId: Id }
    | { party: "supplier"; newSupplier: NewParty }
  );

/** R0: positive quantities only from the notebook. */
export type DraftStockAdjustment = {
  itemId: Id;
  quantity: number;
  source: TxnSource;
};
