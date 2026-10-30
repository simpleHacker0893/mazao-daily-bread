# Phase 5: Manunuzi and Deni la Wasambazaji (Purchases & Supplier Debt) — Blueprint

**Release:** R1 | **Milestone:** R1 Manunuzi | **Depends on:** Phases 1–4 (R0 pilot complete) | **Label:** ready-for-agent

---

## Read First

- `requirements.md` (what to build)
- `acceptance.md` (how it's judged)
- `planning/DECISIONS.md` and `planning/DOMAIN.md`
- Phase 5 `spec.md` (this folder)

Every step below can be started cold from its own brief.

---

## Lanes and Timeline

Two developers work in parallel. Each step is one PR. **Strongest model** = the step needs the most careful reasoning; use the strongest Claude model available.

| Step | Lane | Depends on | Agent | Model |
|------|------|------------|-------|-------|
| **5.1 Domain core** | Dev B | — | `backend` | **strongest** |
| **5.2 Local commit + queries** | Dev B | 5.1 | `backend` | **strongest** |
| **5.3 Purchase screens** | Dev A | 5.1, 5.2 (commit) | `frontend` | default |
| **5.4 Supplier debt screens** | Dev A | 5.1, 5.2 (queries) | `frontend` | default |
| **5.5 Muhtasari & Today updates** | Dev A | 5.3, 5.4 | `frontend` | default |
| **5.6 Sync + Prisma contract** | Dev A | 5.1 | `backend` | default |

**Checkpoint:** after 5.2 (both lanes have working commit & queries). Scrum-architect calls cuts if behind.

---

## File Ownership (R-011)

- **Dev A (Frontend):**
  - `app/(app)/manunuzi/*`, `app/(app)/debts/supplier/*`
  - `ui/ledger/*` (new purchase form, supplier ledger, pay-supplier sheet)
  - `i18n/en.ledger.ts`, `i18n/sw.ledger.ts` (new keys)
- **Dev B (Backend):**
  - `domain/*` (types, schemas, ledger, summary, grill, operating-profile)
  - `local/commit.ts` (new commit functions)
  - `local/queries.ts` (new query hooks)
  - `sync/wire.ts` (wire schemas for new types)
- **Shared contracts (both must agree to change):**
  - `domain/types.ts`, `domain/schemas.ts` (frozen after 5.1 merges)
  - `local/device-db.ts` (schema — only if new tables; Phase 5 adds none)
  - `i18n/en.ts`, `i18n/sw.ts` (merged halves)

---

## Target Structure Additions

```
app/(app)/
  manunuzi/
    page.tsx                    # Today's purchases list + void
    new/page.tsx                # New purchase form
  debts/
    supplier/
      page.tsx                  # Supplier debt list (overdue first, total, due this week)
      ledger/page.tsx           # Supplier ledger with running balance + pay sheet

domain/
  types.ts                      # + purchase, supplier_payment in TxnType; DraftPurchase, DraftSupplierPayment
  schemas.ts                    # + Zod schemas for new drafts
  ledger.ts                     # + supplierOwed, openSupplierDeni, isSupplierOverdue, supplierDueWithin, stockOnHand extended
  summary.ts                    # + MoneyFlow gains cashOut/mpesaOut/otherOut; rangeSummary
  grill.ts                      # + DENI_NEEDS_SUPPLIER, BUYING_PRICE_CHANGED, POSSIBLE_DUPLICATE (purchase), SUPPLIER_OVERPAID
  operating-profile.ts          # + supplierDefaultDueRule, rules.buyingPriceChange

local/
  commit.ts                     # + commitPurchase, commitSupplierPayment, updated commitVoid
  queries.ts                    # + useTodayPurchases, useSuppliersWithBalance, useSupplierLedger, useSuppliersDueThisWeek, useRecentSuppliers, useRangeSummary
  business-db.ts                # unchanged (no new tables)

sync/
  wire.ts                       # + toWire/fromWire for purchase, supplier_payment

prisma/
  contract.prisma               # CHECK constraint: add 'purchase', 'supplier_payment' to transactions.type
```

---

## Rules

- **Offline first:** All new pages are client pages reading only from Dexie. No server data fetching. No dynamic route segments (D-041). Query params only.
- **One save path:** Every new record goes through `local/commit.ts` → Zod → `runGrill` → one Dexie transaction with sync-queue entries.
- **Money:** Integer cents in domain/client; `numeric(14,2)` on server; conversion only in `sync/wire.ts`.
- **Ledger:** Confirmed transactions immutable. Corrections = `void` + new record. Balances & stock derived, never stored (D-019).
- **Tenancy:** Every business-owned row has `businessId`, `createdBy`. Server routes call `requireMember()` and reject foreign rows.
- **Pure numbers:** All maths in `domain/` as pure tested functions. Hooks/components never calculate money.
- **Strings:** Every UI string through `t(key, locale)`. English default; Kiswahili keys added to `sw.*` halves typed against `en.*`.
- **Design:** Operate mode, core tokens from `docs/design/stitch-prompts.md`. Bilingual titles (D-040). No photos on work screens (D-045).
- **Routes:** Static, precached by service worker. English route folders (D-050).

---

## 5.1: Domain Core (Dev B, strongest model, test-first)

**Context:** Pure TypeScript. No React, Dexie, or network. Every number the merchant sees comes from here. Use `planning/DOMAIN.md` for terms and the worked example.

### Tasks

1. **`types.ts`** — Extend the transaction type union:
   - Add `"purchase" | "supplier_payment"` to `TxnType`
   - **Conventions (extend R0):**
     - `purchase`: `supplierId` optional; `totalAmount` = sum of line totals; `amountPaid` ≤ `totalAmount`; `paymentMethod` describes paid part, `null` when nothing paid; lines are goods only, `unitPrice` = buying price paid per unit, `unitCost` = `unitPrice`
     - `supplier_payment`: `supplierId` required; `totalAmount = amountPaid = amount`
     - `void` of either copies `supplierId` from original
   - **New draft types:**
     ```ts
     export type DraftPurchase = {
       lines: { itemId: Id; quantity: number; unit: string; unitPrice: Cents }[]; // goods only
       totalAmount: Cents;
       amountPaid: Cents;
       paymentMethod: PaymentMethod | null;
       supplierId?: Id;
       newSupplier?: NewParty;
       dueDate?: Day;
       dueDateNote?: string;
       description?: string;
     };
     
     export type DraftSupplierPayment = {
       supplierId: Id;
       amount: Cents;
       paymentMethod: PaymentMethod;
       externalReference?: string;
     };
     ```

2. **`schemas.ts`** — Zod schemas for `DraftPurchase`, `DraftSupplierPayment`. Money = non-negative int. Quantity ≤ 3 decimals.

3. **`ledger.ts`** — Mirror customer side:
   - `supplierOwed(supplierId, txns)` — opening balances + purchase remainders − supplier payments, voids reversed
   - `openSupplierDeni(supplierId, txns)` — FIFO allocation of payments to oldest credit purchase/opening balance; overpayment carries forward. **Same algorithm as `openDeni`** — make it one generic function parameterised by party side
   - `isSupplierOverdue(supplierId, txns, today)`
   - `supplierDueWithin(txns, today, days)` — for "due this week"
   - `stockOnHand(itemId, txns, lines)` — extends R0: adjustments − sale lines + **purchase goods lines (+qty)**

4. **`summary.ts`** — Generalise day summary to range summary + money out:
   ```ts
   type MoneyFlow = {
     cashIn: Cents; mpesaIn: Cents; otherIn: Cents;
     cashOut: Cents; mpesaOut: Cents; otherOut: Cents; // purchase amountPaid + supplier payments + expenses, by method
   };
   export function rangeSummary(txns, lines, range): { sales, cogs, expenses, faidaHalisi, moneyFlow };
   // Sales, COGS, Expenses, Faida Halisi formulas UNCHANGED (D-014). Purchase never touches them.
   ```

5. **`grill.ts`** — New rules:
   - `DENI_NEEDS_SUPPLIER` — **hard error** (cannot override) when purchase has `amountPaid < totalAmount` and no supplier (extends D-038)
   - `ARITHMETIC` and `PAID_EXCEEDS_TOTAL` apply to purchases unchanged
   - `BUYING_PRICE_CHANGED` — warn/block from profile (`rules.buyingPriceChange`), fires when line's unitPrice differs from item's current `buyingPrice` by more than profile's variance threshold. Default warn. Message carries both prices.
   - `POSSIBLE_DUPLICATE` — extends to purchases & supplier payments keyed on **set** `supplierId`, same type, same total, within 10 min
   - `SUPPLIER_OVERPAID` — warn only, when supplier payment exceeds current amount owed

6. **`operating-profile.ts`** — Add:
   - `supplierDefaultDueRule` (same values as `defaultDueRule`, nullable, default null)
   - `rules.buyingPriceChange: 'warn' | 'block'` (default `'warn'`)
   - Old profiles parse with defaults (no migration needed)

### Required Tests (Vitest, `domain/*.test.ts`)

- Extended worked example (spec §Testing Decisions):
  - R0 day + purchase 2 gunia viazi @ 2,800 paid 3,000 cash, supplier "Mzee Kariuki"
  - Sales 35,000, COGS 9,000, Expenses 5,000, Faida 21,000 unchanged
  - Cash out = 3,000 + 5,000; Supplier owed = 2,600
- Supplier deni scenario mirroring AC-04:
  - Purchase 5,600 paid 1,000 → owed 4,600
  - Payment 1,000 → 3,600
  - Void payment → 4,600 (void shows in ledger)
- `openSupplierDeni` FIFO across two purchases + brought-forward balance; overpayment carries forward
- Stock: opening 10 tray mayai, purchase 5, sell 3 → 12; void purchase → 7
- D-015 interaction: purchase at new buying price changes `unitCost` on next sale, not past sales
- Each new Grill rule fires/doesn't fire; `DENI_NEEDS_SUPPLIER` still throws with `override: true`

### Verify

```bash
pnpm test domain --coverage   # ≥ 90% line coverage for domain/
pnpm lint && pnpm typecheck && pnpm build
```

### Exit

Merged. `types.ts` and `schemas.ts` frozen; post diffs in PR description.

---

## 5.2: Local Commit + Queries (Dev B, strongest model)

**Context:** IndexedDB is operational source of truth. One save path (D-026). Code against `local/commit.ts`, `local/business-db.ts`, `auth/session.ts`.

### Tasks

1. **`commit.ts`** — Add:
   - `commitPurchase(ctx, draft, opts)` — Zod parse → `runGrill` → stamp IDs + `createdBy` + `occurredAt` → **one Dexie transaction** writing in parent order: new supplier (if any), **item buyingPrice update** (P5-A: each goods line updates item's `buyingPrice` to line's `unitPrice`, bumps `updatedAt` — master data LWW), txn, lines
   - `commitSupplierPayment(ctx, draft, opts)` — same pattern (new supplier not applicable)
   - `commitVoid` extended: accepts purchase/supplier_payment; voiding purchase reverses stock (if stock < 0, `NEGATIVE_STOCK` runs on the void)
   - All use existing `write()` helper (one RW transaction over items, customers, suppliers, txns, lines, settings, syncQueue)

2. **`queries.ts`** — Add hooks (use `useBusinessQuery` pattern, call only domain functions):
   - `useTodayPurchases()` → today's purchases newest first, voided marked
   - `useSuppliersWithBalance()` → suppliers with `owed > 0` or in credit, overdue first then by amount
   - `useSupplierLedger(id)` → every record naming supplier, voids included, newest first, running balance
   - `useSuppliersDueThisWeek()` → suppliers with deni due within 7 days
   - `useRecentSuppliers(n)` → most recently used suppliers for chips
   - `useRangeSummary(range)` → `rangeSummary` from domain (R0 `daySummary` becomes special case)

3. **`business-db.ts`** — Unchanged (no new tables in Phase 5)

### Verify

```bash
pnpm test local/commit.test.ts   # Vitest with fake-indexeddb
pnpm test local/queries.test.ts
# Scenarios:
# - Credit purchase with new supplier creates supplier + txn + lines + queue entries in parent order, one transaction
# - Failed commit leaves no rows
# - override: true stores block codes but still throws for DENI_NEEDS_SUPPLIER
# - Profile rules.negativeStock = 'block' on purchase → throws NeedsOverride, with override saves with override code
# - Void purchase reverses stock; second void rejected
# - Query hooks return derived numbers matching domain tests
pnpm lint && pnpm typecheck && pnpm build
```

---

## 5.3: Purchase Screens (Dev A, frontend agent)

**Context:** Visual reference = `docs/design/r0/` (generated from `docs/design/stitch-prompts.md` §4.1). Pages use only `commit.ts` and `queries.ts`. Use frontend skills from `CLAUDE.md`.

### Tasks

1. **Primitives** (extend `ui/ledger/`):
   - `SupplierChipGroup` — recent supplier chips + "+ New supplier"
   - `GoodsLineEditor` — item picker (recent → search → "Add new item"), qty, unit, buying price prefilled from item
   - `PurchasePaymentSection` — Cash / M-Pesa / "Deni (I owe)" chips; "Deni (I owe)" = UI shortcut setting paid=0; paymentMethod = null when nothing paid (P5-C)
   - Live `runGrill` preview above Save; hard errors disable Save; `NeedsOverride` opens `SaveAnywayDialog`

2. **`/manunuzi/new`** — New purchase form (stitch-prompts §4.1):
   - Supplier chips with "+ New supplier" sheet (name, optional phone)
   - Goods-only line editor with helper "Stock goes up when you save."
   - Total, payment section, due-date chips when remainder > 0
   - Inline item creation (like sale form)

3. **`/manunuzi`** — Today's purchases list:
   - Rows with supplier, total, paid, method, void button (confirmation, hidden when `!canVoid`)
   - Empty state: "No purchases today."

### Verify

```bash
pnpm build && pnpm exec playwright test e2e/manunuzi.spec.ts
# Journey (offline after unlock):
# 1. New purchase: 2 gunia viazi @ 2,800, supplier Mzee Kariuki, paid 3,000 cash → list shows it
# 2. Credit purchase: 5 tray mayai @ 450, supplier Mama Mboga, paid 0 → supplier debt list shows owed
# 3. Void a purchase → stock & supplier deni reverse
# 4. Duplicate warning fires within 10 min
# 5. Buying price change warning fires when price differs from item.buyingPrice
```

---

## 5.4: Supplier Debt Screens (Dev A, frontend agent)

**Context:** Visual reference = `docs/design/r0/` (§4.2). Operate mode, core tokens, bilingual titles (D-040).

### Tasks

1. **`/debts/supplier`** — Supplier debt list:
   - Top bar: "You owe suppliers" total (Maize), "Due this week" (Maize)
   - Rows: supplier name, balance, due date, left bar Maize (owed) / Tomato (overdue)
   - Sort: overdue first, then by amount desc
   - Tap row → `/debts/supplier/ledger?id=`
   - Empty state: "You don't owe any supplier."
   - **Zaidi / More sheet** adds "Deni la Wasambazaji / Supplier debt" (D-052 sidebar from 1024px)

2. **`/debts/supplier/ledger?id=`** — Supplier ledger:
   - Running balance right-aligned
   - "Brought forward" labels for opening balances
   - Voided rows struck through, labelled "Voided"
   - Bottom sheet "Pay supplier" with new-balance preview (amount, method, M-Pesa ref optional)
   - Overpaying leaves supplier in credit (negative balance), tracked honestly (D-054)

### Verify

```bash
pnpm build && pnpm exec playwright test e2e/supplier-debt.spec.ts
# Journey (offline):
# 1. Open supplier list → shows totals, overdue first
# 2. Open ledger → running balance correct, voids shown
# 3. Pay supplier 1,000 cash → balance updates, new-balance preview was accurate
# 4. Overpay → supplier goes negative (credit), still shown
# 5. Cold-offline route check: load /debts/supplier, /debts/supplier/ledger?id=... offline
```

---

## 5.5: Muhtasari & Today Report Updates (Dev A, frontend agent)

**Context:** Muhtasari = `/` (Overview). Today = `/today`. Both read from domain via query hooks.

### Tasks

1. **Muhtasari (`/`)** — Add:
   - Supplier deni total (uses `supplierOwed` across all suppliers)
   - "Due this week" line (Maize)
   - Money out next to money in (cash out / M-Pesa out / other out)
   - "New purchase" quick action (only for profiles selling goods or both)

2. **Today report (`/today`)** — Extend `useTodayReport`:
   - Include purchase and supplier-payment entries in chronological list (shown, never counted in Sales or Faida Halisi)
   - Money out in totals (by method)
   - Shared summary text adds money-out line
   - Property test: totals still equal the summary (must hold with new types)

### Verify

```bash
pnpm build && pnpm exec playwright test e2e/muhtasari-today.spec.ts
# 1. Muhtasari shows supplier deni total, due this week, money out, New purchase action
# 2. Today report shows purchases & supplier payments in list, money out in totals
# 3. Share today's summary text includes money out
# 4. Cold-offline: / and /today render offline
```

---

## 5.6: Sync + Prisma Contract (Dev A, backend agent)

**Context:** Idempotent backup (D-020). Cents client ↔ decimal server (D-013). Prisma 8 contract-first (D-048).

### Tasks

1. **`prisma/contract.prisma`** — Edit CHECK constraint on `Transaction.type`:
   ```prisma
   @@check(expression: sql`type IN ('sale', 'expense', 'customer_payment', 'opening_balance', 'stock_adjustment', 'void', 'purchase', 'supplier_payment')`, name: "transactions_type")
   ```
   Run `pnpm db:generate` (emits `contract.json` + `contract.d.ts`), commit both.

2. **`sync/wire.ts`** — Extend wire schemas + `toWire`/`fromWire` for `purchase` and `supplier_payment`. Cents ↔ decimal string `"150.00"` conversion stays only here.

3. **Route tests** (Neon dev branch):
   - Same batch twice → counts unchanged AND `accepted` contains every ID both times
   - Foreign `businessId` → 403
   - Foreign `supplierId` with our `businessId` → not overwritten (LWW with business guard)
   - CHECK constraint accepts new types

4. **Manual smoke** on preview:
   - Record purchase offline, reconnect → rows in Neon within 60s
   - Second browser profile signs in same account → restore shows same supplier deni

### Verify

```bash
pnpm db:generate
pnpm test sync/wire.test.ts
pnpm test sync/routes.test.ts  # against Neon dev branch
pnpm lint && pnpm typecheck && pnpm build
```

---

## Cuts (Applied in Order if Behind at Checkpoint)

0. Supplier ledger "Pay supplier" sheet → inline on ledger row (waives nothing, just UI)
1. `BUYING_PRICE_CHANGED` rule → warn only (block behind profile flag later)
2. "Due this week" on Muhtasari → show in supplier list only
3. `SUPPLIER_OVERPAID` warn → drop (merchant sees negative balance anyway)

**Never cut:**
- Offline save for purchases & supplier payments
- `DENI_NEEDS_SUPPLIER` hard error
- Correct supplier deni & stock derived from ledger
- Void for purchases & supplier payments
- Bilingual titles (D-040)

---

## Decisions Recorded (Must Be Confirmed Before Building)

| ID | Decision | Status |
|----|----------|--------|
| **P5-A** | Confirmed purchase updates item's `buyingPrice` to purchase unit price (refines D-015) | ⏳ Owner to confirm |
| **P5-B** | `DENI_NEEDS_SUPPLIER` hard error; fully paid purchases may have no supplier | ⏳ Owner to confirm |
| **P5-C** | "Deni (I owe)" = UI shortcut only; `paymentMethod` = null when nothing paid | ⏳ Owner to confirm |
| **P5-D** | Supplier list lives at `/debts/supplier` + Zaidi entry + `/debts` switch (Customers/Suppliers) | ⏳ Owner to confirm |

*Record final decisions in `planning/DECISIONS.md` before 5.1 starts.*