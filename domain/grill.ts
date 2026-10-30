import type { z } from "zod";
import type { MessageKey } from "@/i18n/t";
import { activeTxns, stockOnHand, supplierOwed } from "./ledger";
import { lineTotal } from "./money";
import type { OperatingProfile, RuleLevel } from "./operating-profile";
import {
  DraftExpenseSchema,
  DraftOpeningSchema,
  DraftPaymentSchema,
  DraftPurchaseSchema,
  DraftSaleSchema,
  DraftStockAdjustmentSchema,
  DraftSupplierPaymentSchema,
  IdSchema,
} from "./schemas";
import type {
  Cents,
  DraftExpense,
  DraftOpening,
  DraftPayment,
  DraftPurchase,
  DraftSale,
  DraftStockAdjustment,
  DraftSupplierPayment,
  Id,
  Item,
  Txn,
  TxnLine,
  TxnType,
} from "./types";

// Grill rules: deterministic checks before a record is saved (D-026, D-038).

export type IssueCode =
  | "SCHEMA"
  | "ARITHMETIC"
  | "PAID_EXCEEDS_TOTAL"
  | "DENI_NEEDS_CUSTOMER"
  | "DENI_NEEDS_SUPPLIER"
  | "NEGATIVE_STOCK"
  | "BELOW_COST"
  | "PRICE_VARIANCE"
  | "BUYING_PRICE_CHANGED"
  | "POSSIBLE_DUPLICATE"
  | "SUPPLIER_OVERPAID";

export type Issue = {
  code: IssueCode;
  severity: RuleLevel;
  messageKey: MessageKey;
  lineIndex?: number;
};

export type GrillInput =
  | { type: "sale"; draft: DraftSale }
  | { type: "expense"; draft: DraftExpense }
  | { type: "customer_payment"; draft: DraftPayment }
  | { type: "opening_balance"; draft: DraftOpening }
  | { type: "stock_adjustment"; draft: DraftStockAdjustment }
  | { type: "void"; draft: { txnId: Id } }
  | { type: "purchase"; draft: DraftPurchase }
  | { type: "supplier_payment"; draft: DraftSupplierPayment };

export type GrillContext = {
  items: readonly Item[];
  txns: readonly Txn[];
  lines: readonly TxnLine[];
  profile: OperatingProfile;
  now: Date;
};

export type GrillResult = {
  /** Never overridable: the record cannot be saved. */
  hardErrors: Issue[];
  /** Warn or block per the operating profile; block needs "Save anyway". */
  issues: Issue[];
};

const messageKeys: Record<IssueCode, MessageKey> = {
  SCHEMA: "ledger.grill.schema",
  ARITHMETIC: "ledger.grill.arithmetic",
  PAID_EXCEEDS_TOTAL: "ledger.grill.paidExceedsTotal",
  DENI_NEEDS_CUSTOMER: "ledger.grill.deniNeedsCustomer",
  DENI_NEEDS_SUPPLIER: "ledger.grill.deniNeedsSupplier",
  NEGATIVE_STOCK: "ledger.grill.negativeStock",
  BELOW_COST: "ledger.grill.belowCost",
  PRICE_VARIANCE: "ledger.grill.priceVariance",
  BUYING_PRICE_CHANGED: "ledger.grill.buyingPriceChanged",
  POSSIBLE_DUPLICATE: "ledger.grill.possibleDuplicate",
  SUPPLIER_OVERPAID: "ledger.grill.supplierOverpaid",
};

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const schemas: Record<GrillInput["type"], z.ZodType> = {
  sale: DraftSaleSchema,
  expense: DraftExpenseSchema,
  customer_payment: DraftPaymentSchema,
  opening_balance: DraftOpeningSchema,
  stock_adjustment: DraftStockAdjustmentSchema,
  void: IdSchema,
  purchase: DraftPurchaseSchema,
  supplier_payment: DraftSupplierPaymentSchema,
};

function issue(
  code: IssueCode,
  severity: RuleLevel,
  lineIndex?: number,
): Issue {
  const base = { code, severity, messageKey: messageKeys[code] };
  return lineIndex === undefined ? base : { ...base, lineIndex };
}

/**
 * Checks a draft before it is saved. Each rule runs only for the types it applies to
 * (Phase 1 plan, M7 matrix); an invalid draft returns SCHEMA alone.
 */
export function runGrill(input: GrillInput, ctx: GrillContext): GrillResult {
  const value = input.type === "void" ? input.draft.txnId : input.draft;
  if (!schemas[input.type].safeParse(value).success) {
    return { hardErrors: [issue("SCHEMA", "block")], issues: [] };
  }

  switch (input.type) {
    case "sale":
      return grillSale(input.draft, ctx);
    case "purchase":
      return grillPurchase(input.draft, ctx);
    case "supplier_payment":
      return grillSupplierPayment(input.draft, ctx);
    case "customer_payment": {
      const { customerId, amount } = input.draft;
      return {
        hardErrors: [],
        issues: duplicate(ctx, "customer_payment", { customerId }, amount),
      };
    }
    case "opening_balance": {
      const d = input.draft;
      const party =
        "customerId" in d
          ? { customerId: d.customerId }
          : "supplierId" in d
            ? { supplierId: d.supplierId }
            : null;
      return {
        hardErrors: [],
        issues: party ? duplicate(ctx, "opening_balance", party, d.amount) : [],
      };
    }
    case "stock_adjustment":
    case "expense":
    case "void":
      return { hardErrors: [], issues: [] };
  }
}

function grillSale(draft: DraftSale, ctx: GrillContext): GrillResult {
  const hardErrors: Issue[] = [];
  const linesTotal = draft.lines.reduce(
    (sum, l) => sum + lineTotal(l.quantity, l.unitPrice),
    0,
  );
  if (linesTotal !== draft.totalAmount) {
    hardErrors.push(issue("ARITHMETIC", "block"));
  }
  if (draft.amountPaid > draft.totalAmount) {
    hardErrors.push(issue("PAID_EXCEEDS_TOTAL", "block"));
  }
  const isDeni = draft.amountPaid < draft.totalAmount;
  if (isDeni && !draft.customerId && !draft.newCustomer) {
    hardErrors.push(issue("DENI_NEEDS_CUSTOMER", "block"));
  }

  const { rules } = ctx.profile;
  const items = new Map(ctx.items.map((i) => [i.id, i]));
  const issues: Issue[] = [];
  // Thousandths taken by earlier lines of this draft, per item.
  const takenSoFar = new Map<Id, number>();

  draft.lines.forEach((l, index) => {
    const item = l.itemId ? items.get(l.itemId) : undefined;
    if (!item) return;

    if (l.itemKind === "goods") {
      const taken =
        (takenSoFar.get(item.id) ?? 0) + Math.round(l.quantity * 1000);
      takenSoFar.set(item.id, taken);
      const onHand = Math.round(
        stockOnHand(item.id, ctx.txns, ctx.lines) * 1000,
      );
      if (onHand - taken < 0) {
        issues.push(issue("NEGATIVE_STOCK", rules.negativeStock, index));
      }
      if (l.unitPrice < item.buyingPrice) {
        issues.push(issue("BELOW_COST", rules.belowCost, index));
      }
    }

    if (item.sellingPrice > 0) {
      const variancePct =
        (Math.abs(l.unitPrice - item.sellingPrice) / item.sellingPrice) * 100;
      if (variancePct > rules.priceVariance.thresholdPct) {
        issues.push(issue("PRICE_VARIANCE", rules.priceVariance.mode, index));
      }
    }
  });

  if (draft.customerId) {
    issues.push(
      ...duplicate(
        ctx,
        "sale",
        { customerId: draft.customerId },
        draft.totalAmount,
      ),
    );
  }
  return { hardErrors, issues };
}

function grillPurchase(draft: DraftPurchase, ctx: GrillContext): GrillResult {
  const hardErrors: Issue[] = [];
  const linesTotal = draft.lines.reduce(
    (sum, l) => sum + lineTotal(l.quantity, l.unitPrice),
    0,
  );
  if (linesTotal !== draft.totalAmount) {
    hardErrors.push(issue("ARITHMETIC", "block"));
  }
  if (draft.amountPaid > draft.totalAmount) {
    hardErrors.push(issue("PAID_EXCEEDS_TOTAL", "block"));
  }
  const isDeni = draft.amountPaid < draft.totalAmount;
  if (isDeni && !draft.supplierId && !draft.newSupplier) {
    hardErrors.push(issue("DENI_NEEDS_SUPPLIER", "block"));
  }

  const { rules } = ctx.profile;
  const items = new Map(ctx.items.map((i) => [i.id, i]));
  const issues: Issue[] = [];

  draft.lines.forEach((l, index) => {
    const item = l.itemId ? items.get(l.itemId) : undefined;
    if (!item) return;

    // Purchase lines are goods only (per DraftPurchase type)
    if (item.kind === "goods") {
      // Check if buying price changed
      if (item.buyingPrice > 0) {
        const variancePct =
          (Math.abs(l.unitPrice - item.buyingPrice) / item.buyingPrice) * 100;
        if (variancePct > rules.buyingPriceChange.thresholdPct) {
          issues.push(
            issue("BUYING_PRICE_CHANGED", rules.buyingPriceChange.mode, index),
          );
        }
      }
    }
  });

  if (draft.supplierId) {
    issues.push(
      ...duplicate(
        ctx,
        "purchase",
        { supplierId: draft.supplierId },
        draft.totalAmount,
      ),
    );
  }
  return { hardErrors, issues };
}

function grillSupplierPayment(
  draft: DraftSupplierPayment,
  ctx: GrillContext,
): GrillResult {
  const hardErrors: Issue[] = [];
  const issues: Issue[] = [];

  // Check for SUPPLIER_OVERPAID
  const owed = supplierOwed(draft.supplierId, ctx.txns);
  if (draft.amount > owed) {
    issues.push(issue("SUPPLIER_OVERPAID", "warn"));
  }

  // Check for POSSIBLE_DUPLICATE
  issues.push(
    ...duplicate(
      ctx,
      "supplier_payment",
      { supplierId: draft.supplierId },
      draft.amount,
    ),
  );

  return { hardErrors, issues };
}

/** Same type, same party and same amount within 10 minutes. Never fires without a party. */
function duplicate(
  ctx: GrillContext,
  type: TxnType,
  party: { customerId: Id } | { supplierId: Id },
  amount: Cents,
): Issue[] {
  const now = ctx.now.getTime();
  const sameParty = (t: Txn) =>
    "customerId" in party
      ? t.customerId === party.customerId
      : t.supplierId === party.supplierId;
  const found = activeTxns(ctx.txns).some(
    (t) =>
      t.type === type &&
      t.totalAmount === amount &&
      sameParty(t) &&
      Math.abs(now - Date.parse(t.occurredAt)) <= DUPLICATE_WINDOW_MS,
  );
  return found
    ? [issue("POSSIBLE_DUPLICATE", ctx.profile.rules.duplicate)]
    : [];
}
