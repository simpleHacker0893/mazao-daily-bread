import type { z } from "zod";
import type { MessageKey } from "@/i18n/t";
import { activeTxns, stockOnHand } from "./ledger";
import { lineTotal } from "./money";
import type { OperatingProfile, RuleLevel } from "./operating-profile";
import {
  DraftExpenseSchema,
  DraftOpeningSchema,
  DraftPaymentSchema,
  DraftSaleSchema,
  DraftStockAdjustmentSchema,
  IdSchema,
} from "./schemas";
import type {
  Cents,
  DraftExpense,
  DraftOpening,
  DraftPayment,
  DraftSale,
  DraftStockAdjustment,
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
  | "NON_FRACTIONAL_QUANTITY"
  | "NEGATIVE_STOCK"
  | "BELOW_COST"
  | "PRICE_VARIANCE"
  | "POSSIBLE_DUPLICATE";

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
  | { type: "void"; draft: { txnId: Id } };

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
  NON_FRACTIONAL_QUANTITY: "ledger.grill.nonFractionalQuantity",
  NEGATIVE_STOCK: "ledger.grill.negativeStock",
  BELOW_COST: "ledger.grill.belowCost",
  PRICE_VARIANCE: "ledger.grill.priceVariance",
  POSSIBLE_DUPLICATE: "ledger.grill.possibleDuplicate",
};

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const schemas: Record<GrillInput["type"], z.ZodType> = {
  sale: DraftSaleSchema,
  expense: DraftExpenseSchema,
  customer_payment: DraftPaymentSchema,
  opening_balance: DraftOpeningSchema,
  stock_adjustment: DraftStockAdjustmentSchema,
  void: IdSchema,
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
    // R0 stock adjustments are positive only (the schema refuses the rest), so NEGATIVE_STOCK
    // cannot fire on them; expenses have no party to repeat; voids are checked by canVoid.
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

    if (!item.allowsFractional && !Number.isInteger(l.quantity)) {
      hardErrors.push(issue("NON_FRACTIONAL_QUANTITY", "block", index));
    }

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
