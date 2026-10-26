// Shared contract (R-011): runtime checks for the records in types.ts and the drafts pages save.
// Frozen after B1 merges; change only with both devs agreeing.
import { z } from "zod";
import type {
  Customer,
  DraftExpense,
  DraftOpening,
  DraftPayment,
  DraftSale,
  DraftStockAdjustment,
  Item,
  Txn,
  TxnLine,
} from "./types";

/** Integer cents, never negative. */
export const MoneySchema = z.number().int().nonnegative();

/** At most 3 decimal places, matching numeric(14,3) on the server. */
export const QuantitySchema = z
  .number()
  .finite()
  .refine((q) => Math.abs(Math.round(q * 1000) - q * 1000) < 1e-6, {
    message: "At most 3 decimal places",
  });

const positive = { message: "Must be more than 0" };

export const IdSchema = z.string().min(1);
export const DaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Produced only by toISOString(): UTC, ending in Z. */
export const IsoTimeSchema = z
  .string()
  .refine((s) => s.endsWith("Z") && !Number.isNaN(Date.parse(s)), {
    message: "Must be an ISO time ending in Z",
  });

const ItemKindSchema = z.enum(["goods", "service"]);
const PaymentMethodSchema = z.enum(["cash", "mpesa", "other"]);
const TxnSourceSchema = z.enum(["manual", "onboarding"]);

export const ItemSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  kind: ItemKindSchema,
  name: z.string().trim().min(1),
  unit: z.string().min(1),
  allowsFractional: z.boolean(),
  sellingPrice: MoneySchema,
  buyingPrice: MoneySchema,
  lowStockThreshold: QuantitySchema.nullable(),
  isActive: z.boolean(),
  createdBy: IdSchema,
  createdAt: IsoTimeSchema,
  updatedAt: IsoTimeSchema,
}) satisfies z.ZodType<Item>;

export const CustomerSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  name: z.string().trim().min(1),
  phone: z.string().optional(),
  notes: z.string().optional(),
  isFavorite: z.boolean(),
  createdBy: IdSchema,
  createdAt: IsoTimeSchema,
  updatedAt: IsoTimeSchema,
}) satisfies z.ZodType<Customer>;

export const SupplierSchema = CustomerSchema;

export const TxnSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  type: z.enum([
    "sale",
    "expense",
    "customer_payment",
    "opening_balance",
    "stock_adjustment",
    "void",
  ]),
  occurredAt: IsoTimeSchema,
  source: TxnSourceSchema,
  paymentMethod: PaymentMethodSchema.nullable(),
  customerId: IdSchema.optional(),
  supplierId: IdSchema.optional(),
  voidsTxnId: IdSchema.optional(),
  expenseCategory: z.string().optional(),
  description: z.string().optional(),
  dueDate: DaySchema.optional(),
  dueDateNote: z.string().optional(),
  totalAmount: MoneySchema,
  amountPaid: MoneySchema,
  externalReference: z.string().optional(),
  overrides: z.array(z.string()),
  createdBy: IdSchema,
  createdAt: IsoTimeSchema,
}) satisfies z.ZodType<Txn>;

export const TxnLineSchema = z.object({
  id: IdSchema,
  txnId: IdSchema,
  businessId: IdSchema,
  itemId: IdSchema.optional(),
  itemKind: ItemKindSchema.nullable(),
  description: z.string(),
  quantity: QuantitySchema,
  unit: z.string().min(1),
  unitPrice: MoneySchema,
  unitCost: MoneySchema,
}) satisfies z.ZodType<TxnLine>;

export const NewPartySchema = z.strictObject({
  id: IdSchema.optional(),
  name: z.string().trim().min(1),
  phone: z.string().optional(),
});

export const DraftLineSchema = z.object({
  itemId: IdSchema.optional(),
  itemKind: ItemKindSchema.nullable(),
  description: z.string(),
  quantity: QuantitySchema.refine((q) => q > 0, positive),
  unit: z.string().min(1),
  unitPrice: MoneySchema,
});

export const DraftSaleSchema = z
  .object({
    lines: z.array(DraftLineSchema).min(1),
    totalAmount: MoneySchema,
    amountPaid: MoneySchema,
    paymentMethod: PaymentMethodSchema.nullable(),
    customerId: IdSchema.optional(),
    newCustomer: NewPartySchema.optional(),
    dueDate: DaySchema.optional(),
    dueDateNote: z.string().optional(),
    description: z.string().optional(),
    externalReference: z.string().optional(),
  })
  .refine((d) => !(d.customerId && d.newCustomer), {
    message: "Name an existing customer or a new one, not both",
    path: ["newCustomer"],
  }) satisfies z.ZodType<DraftSale>;

export const DraftExpenseSchema = z.object({
  amount: MoneySchema.refine((a) => a > 0, positive),
  paymentMethod: PaymentMethodSchema,
  expenseCategory: z.string().trim().min(1),
  description: z.string().optional(),
}) satisfies z.ZodType<DraftExpense>;

export const DraftPaymentSchema = z.object({
  customerId: IdSchema,
  amount: MoneySchema.refine((a) => a > 0, positive),
  paymentMethod: PaymentMethodSchema,
  externalReference: z.string().optional(),
}) satisfies z.ZodType<DraftPayment>;

const openingCommon = {
  amount: MoneySchema.refine((a) => a > 0, positive),
  dueDate: DaySchema.optional(),
  dueDateNote: z.string().optional(),
  source: TxnSourceSchema,
};

/** Exactly one party: an existing id or a new party, never both (strict objects reject extras). */
export const DraftOpeningSchema = z.union([
  z.strictObject({
    ...openingCommon,
    party: z.literal("customer"),
    customerId: IdSchema,
  }),
  z.strictObject({
    ...openingCommon,
    party: z.literal("customer"),
    newCustomer: NewPartySchema,
  }),
  z.strictObject({
    ...openingCommon,
    party: z.literal("supplier"),
    supplierId: IdSchema,
  }),
  z.strictObject({
    ...openingCommon,
    party: z.literal("supplier"),
    newSupplier: NewPartySchema,
  }),
]) satisfies z.ZodType<DraftOpening>;

/** R0: positive quantities only (the notebook adds stock). */
export const DraftStockAdjustmentSchema = z.object({
  itemId: IdSchema,
  quantity: QuantitySchema.refine((q) => q > 0, positive),
  source: TxnSourceSchema,
}) satisfies z.ZodType<DraftStockAdjustment>;
