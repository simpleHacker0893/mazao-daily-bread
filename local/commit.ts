// The one save path (D-026). Every record goes: Zod → runGrill → one Dexie transaction that
// writes the rows and their sync-queue entries in parent order. Pages never write to Dexie.
import {
  type GrillContext,
  type GrillInput,
  type Issue,
  runGrill,
} from "@/domain/grill";
import { canVoid } from "@/domain/ledger";
import {
  defaultProfile,
  type OperatingProfile,
  OperatingProfileSchema,
} from "@/domain/operating-profile";
import { CustomerSchema, ItemSchema } from "@/domain/schemas";
import type {
  Customer,
  DraftExpense,
  DraftOpening,
  DraftPayment,
  DraftSale,
  DraftStockAdjustment,
  Id,
  Item,
  NewParty,
  Supplier,
  Txn,
  TxnLine,
} from "@/domain/types";
import type { BusinessDb, SyncQueueEntry, SyncTable } from "./business-db";

/** Who is saving, into which business, and the clock (injected so tests control time). */
export type CommitContext = {
  db: BusinessDb;
  businessId: Id;
  profileId: Id;
  now?: () => Date;
};

export type CommitOptions = {
  /** "Save anyway": accept block-level issues and record their codes. Never bypasses hard errors. */
  override?: boolean;
};

/** The record cannot be saved. No override is possible. `codes` are grill or commit codes. */
export class CommitError extends Error {
  readonly codes: string[];
  readonly issues: Issue[];
  constructor(codes: string[], issues: Issue[] = []) {
    super(`Cannot save: ${codes.join(", ")}`);
    this.name = "CommitError";
    this.codes = codes;
    this.issues = issues;
  }
}

/** Block-level issues: the merchant must confirm "Save anyway" (override). */
export class NeedsOverride extends Error {
  readonly issues: Issue[];
  constructor(issues: Issue[]) {
    super(`Needs confirmation: ${issues.map((i) => i.code).join(", ")}`);
    this.name = "NeedsOverride";
    this.issues = issues;
  }
}

export type NewItem = Omit<
  Item,
  "id" | "businessId" | "isActive" | "createdBy" | "createdAt" | "updatedAt"
> & { id?: Id };

export type PartyFields = {
  id?: Id;
  name: string;
  phone?: string;
  notes?: string;
  isFavorite?: boolean;
};

export async function commitSale(
  ctx: CommitContext,
  draft: DraftSale,
  opts: CommitOptions = {},
): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    const overrides = check({ type: "sale", draft }, grill, opts);
    const customerId = draft.newCustomer
      ? await createParty(ctx, "customers", draft.newCustomer)
      : draft.customerId;

    const txn = await addTxn(ctx, {
      type: "sale",
      source: "manual",
      paymentMethod: draft.paymentMethod,
      customerId,
      dueDate: draft.dueDate,
      dueDateNote: draft.dueDateNote,
      description: draft.description,
      externalReference: draft.externalReference,
      totalAmount: draft.totalAmount,
      amountPaid: draft.amountPaid,
      overrides,
    });

    const items = new Map(grill.items.map((i) => [i.id, i]));
    await addLines(
      ctx,
      draft.lines.map((l) => ({
        txnId: txn.id,
        itemId: l.itemId,
        itemKind: l.itemKind,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        // D-015: cost is the item's buying price at the time of sale.
        unitCost: (l.itemId && items.get(l.itemId)?.buyingPrice) || 0,
      })),
    );
    return txn;
  });
}

export async function commitExpense(
  ctx: CommitContext,
  draft: DraftExpense,
  opts: CommitOptions = {},
): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    const overrides = check({ type: "expense", draft }, grill, opts);
    return addTxn(ctx, {
      type: "expense",
      source: "manual",
      paymentMethod: draft.paymentMethod,
      expenseCategory: draft.expenseCategory,
      description: draft.description,
      totalAmount: draft.amount,
      amountPaid: draft.amount,
      overrides,
    });
  });
}

export async function commitPayment(
  ctx: CommitContext,
  draft: DraftPayment,
  opts: CommitOptions = {},
): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    const overrides = check({ type: "customer_payment", draft }, grill, opts);
    return addTxn(ctx, {
      type: "customer_payment",
      source: "manual",
      paymentMethod: draft.paymentMethod,
      customerId: draft.customerId,
      externalReference: draft.externalReference,
      totalAmount: draft.amount,
      amountPaid: draft.amount,
      overrides,
    });
  });
}

/** Brought forward from the notebook. A new party and its balance are saved together (M6). */
export async function commitOpening(
  ctx: CommitContext,
  draft: DraftOpening,
  opts: CommitOptions = {},
): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    const overrides = check({ type: "opening_balance", draft }, grill, opts);
    let party: { customerId?: Id; supplierId?: Id };
    if ("newCustomer" in draft) {
      party = {
        customerId: await createParty(ctx, "customers", draft.newCustomer),
      };
    } else if ("newSupplier" in draft) {
      party = {
        supplierId: await createParty(ctx, "suppliers", draft.newSupplier),
      };
    } else if ("customerId" in draft) {
      party = { customerId: draft.customerId };
    } else {
      party = { supplierId: draft.supplierId };
    }

    return addTxn(ctx, {
      type: "opening_balance",
      source: draft.source,
      paymentMethod: null,
      ...party,
      dueDate: draft.dueDate,
      dueDateNote: draft.dueDateNote,
      totalAmount: draft.amount,
      amountPaid: 0,
      overrides,
    });
  });
}

/** Opening stock: adds to what is on hand. Goods items only. */
export async function commitStockAdjustment(
  ctx: CommitContext,
  draft: DraftStockAdjustment,
  opts: CommitOptions = {},
): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    const overrides = check({ type: "stock_adjustment", draft }, grill, opts);
    const item = grill.items.find((i) => i.id === draft.itemId);
    if (!item || item.kind !== "goods") {
      throw new CommitError(["NOT_A_GOODS_ITEM"]);
    }

    const txn = await addTxn(ctx, {
      type: "stock_adjustment",
      source: draft.source,
      paymentMethod: null,
      totalAmount: 0,
      amountPaid: 0,
      overrides,
    });
    await addLines(ctx, [
      {
        txnId: txn.id,
        itemId: item.id,
        itemKind: "goods",
        description: item.name,
        quantity: draft.quantity,
        unit: item.unit,
        unitPrice: 0,
        unitCost: item.buyingPrice,
      },
    ]);
    return txn;
  });
}

/** Cancels a record. Copies its party ids so the void shows in that party's ledger. */
export async function commitVoid(ctx: CommitContext, txnId: Id): Promise<Txn> {
  return write(ctx, async () => {
    const grill = await grillContext(ctx);
    check({ type: "void", draft: { txnId } }, grill, {});
    const original = grill.txns.find((t) => t.id === txnId);
    if (!original || !canVoid(original, grill.txns)) {
      throw new CommitError(["CANNOT_VOID"]);
    }

    return addTxn(ctx, {
      type: "void",
      source: "manual",
      paymentMethod: null,
      voidsTxnId: original.id,
      customerId: original.customerId,
      supplierId: original.supplierId,
      totalAmount: 0,
      amountPaid: 0,
      overrides: [],
    });
  });
}

export async function addItem(
  ctx: CommitContext,
  fields: NewItem,
): Promise<Item> {
  return write(ctx, async () => {
    const stamp = iso(ctx);
    const item = parseOrThrow(ItemSchema, {
      ...fields,
      id: fields.id ?? newId(),
      name: fields.name.trim(),
      businessId: ctx.businessId,
      isActive: true,
      createdBy: ctx.profileId,
      createdAt: stamp,
      updatedAt: stamp,
    });
    await ctx.db.items.add(item);
    await enqueue(ctx, "items", item.id, "upsert");
    return item;
  });
}

export async function upsertCustomer(
  ctx: CommitContext,
  fields: PartyFields,
): Promise<Customer> {
  return upsertParty(ctx, "customers", fields);
}

export async function upsertSupplier(
  ctx: CommitContext,
  fields: PartyFields,
): Promise<Supplier> {
  return upsertParty(ctx, "suppliers", fields);
}

/** The operating profile. Last write wins on the server by updatedAt (M5). */
export async function saveSettings(
  ctx: CommitContext,
  profile: OperatingProfile,
): Promise<void> {
  const value = parseOrThrow(OperatingProfileSchema, profile);
  await write(ctx, async () => {
    await ctx.db.settings.put({
      key: "operatingProfile",
      value,
      updatedAt: iso(ctx),
    });
    await enqueue(ctx, "settings", ctx.businessId, "upsert");
  });
}

/** One read-write transaction over every synced table. Joins an outer transaction when open. */
function write<T>(ctx: CommitContext, fn: () => Promise<T>): Promise<T> {
  const { db } = ctx;
  return db.transaction(
    "rw",
    [
      db.items,
      db.customers,
      db.suppliers,
      db.txns,
      db.lines,
      db.settings,
      db.syncQueue,
    ],
    fn,
  );
}

async function grillContext(ctx: CommitContext): Promise<GrillContext> {
  const { db } = ctx;
  const [items, txns, lines, settings] = await Promise.all([
    db.items.toArray(),
    db.txns.toArray(),
    db.lines.toArray(),
    db.settings.get("operatingProfile"),
  ]);
  return {
    items,
    txns,
    lines,
    profile: settings?.value ?? defaultProfile(),
    now: clock(ctx),
  };
}

/** Throws on hard errors and on unconfirmed block issues; returns the codes to record. */
function check(
  input: GrillInput,
  grill: GrillContext,
  opts: CommitOptions,
): string[] {
  const { hardErrors, issues } = runGrill(input, grill);
  if (hardErrors.length > 0) {
    throw new CommitError(
      hardErrors.map((i) => i.code),
      hardErrors,
    );
  }
  const blocks = issues.filter((i) => i.severity === "block");
  if (blocks.length > 0 && !opts.override) throw new NeedsOverride(blocks);
  return [...new Set(blocks.map((i) => i.code))];
}

type TxnFields = Omit<
  Txn,
  "id" | "businessId" | "occurredAt" | "createdBy" | "createdAt"
>;

async function addTxn(ctx: CommitContext, fields: TxnFields): Promise<Txn> {
  const stamp = iso(ctx);
  const txn: Txn = withoutUndefined({
    ...fields,
    id: newId(),
    businessId: ctx.businessId,
    occurredAt: stamp,
    createdBy: ctx.profileId,
    createdAt: stamp,
  });
  await ctx.db.txns.add(txn);
  await enqueue(ctx, "txns", txn.id, "insert");
  return txn;
}

async function addLines(
  ctx: CommitContext,
  fields: Omit<TxnLine, "id" | "businessId">[],
): Promise<void> {
  const lines: TxnLine[] = fields.map((l) =>
    withoutUndefined({ ...l, id: newId(), businessId: ctx.businessId }),
  );
  await ctx.db.lines.bulkAdd(lines);
  await ctx.db.syncQueue.bulkAdd(
    lines.map((l) => queueEntry("lines", l.id, "insert", iso(ctx))),
  );
}

async function createParty(
  ctx: CommitContext,
  table: "customers" | "suppliers",
  party: NewParty,
): Promise<Id> {
  const created = await upsertParty(ctx, table, party);
  return created.id;
}

async function upsertParty(
  ctx: CommitContext,
  table: "customers" | "suppliers",
  fields: PartyFields,
): Promise<Customer> {
  return write(ctx, async () => {
    const stamp = iso(ctx);
    const existing = fields.id ? await ctx.db[table].get(fields.id) : undefined;
    const party = parseOrThrow(
      CustomerSchema,
      withoutUndefined({
        isFavorite: false,
        ...existing,
        ...fields,
        name: fields.name.trim(),
        id: fields.id ?? newId(),
        businessId: ctx.businessId,
        createdBy: existing?.createdBy ?? ctx.profileId,
        createdAt: existing?.createdAt ?? stamp,
        updatedAt: stamp,
      }),
    );
    await ctx.db[table].put(party);
    await enqueue(ctx, table, party.id, "upsert");
    return party;
  });
}

function queueEntry(
  table: SyncTable,
  rowId: Id,
  op: SyncQueueEntry["op"],
  queuedAt: string,
): SyncQueueEntry {
  return {
    table,
    rowId,
    op,
    attempts: 0,
    nextAttemptAt: 0,
    lastError: null,
    quarantinedAt: null,
    queuedAt,
  };
}

async function enqueue(
  ctx: CommitContext,
  table: SyncTable,
  rowId: Id,
  op: SyncQueueEntry["op"],
): Promise<void> {
  await ctx.db.syncQueue.add(queueEntry(table, rowId, op, iso(ctx)));
}

function parseOrThrow<T>(
  schema: {
    safeParse: (v: unknown) => { success: true; data: T } | { success: false };
  },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new CommitError(["SCHEMA"]);
  return result.data;
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

function clock(ctx: CommitContext): Date {
  return ctx.now ? ctx.now() : new Date();
}

function iso(ctx: CommitContext): string {
  return clock(ctx).toISOString();
}

function newId(): Id {
  return crypto.randomUUID();
}
