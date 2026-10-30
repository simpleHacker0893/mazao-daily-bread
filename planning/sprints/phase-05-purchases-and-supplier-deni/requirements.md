# Phase 5: Manunuzi and Deni la Wasambazaji — Requirements

**Release:** R1 | **Depends on:** Phases 1–4 (R0 pilot complete)

---

## Functional Requirements

### FR-01: New Purchase (Manunuzi Mapya)
- Merchant records a purchase of one or more goods lines from a supplier
- Each line: item (existing or new), quantity, unit, buying price per unit
- Supplier: pick from recent chips, or create new (name + optional phone)
- Payment: Cash / M-Pesa / "Deni (I owe)" (UI shortcut = paid 0, paymentMethod null)
- If amountPaid < totalAmount: remainder becomes supplier deni; supplier required (hard error); due-date chips offered
- Saving raises stock on hand for each goods line immediately
- Purchase list shows today's purchases with void action
- Fully paid purchase may have no supplier (walk-in cash buy)

### FR-02: Supplier Debt (Deni la Wasambazaji)
- List of suppliers the merchant owes, sorted: overdue first, then by amount desc
- Header shows: "You owe suppliers" total, "Due this week" amount
- Each row: supplier name, balance, due date, coloured left bar (Maize = owed, Tomato = overdue)
- Tap row opens supplier ledger
- Empty state: "You don't owe any supplier."

### FR-03: Supplier Ledger
- Every record naming the supplier: opening balances, credit purchases, supplier payments, voids
- Running balance right-aligned
- "Brought forward" labels for opening balances
- Voided rows struck through, labelled "Voided"
- Bottom sheet "Pay supplier": amount, method, optional M-Pesa reference, new-balance preview
- Overpaying or paying in advance leaves supplier in credit (negative balance)

### FR-04: Money Out
- Period summary gains cash out, M-Pesa out, other out
- Money out = purchase amountPaid + supplier payments + expenses, grouped by method
- Shown on Muhtasari next to money in, and on Today report

### FR-05: Muhtasari Updates
- Supplier deni total (sum of `supplierOwed` across all suppliers)
- "Due this week" line
- Money out next to money in
- "New purchase" quick action (only for profiles selling goods or both)

### FR-06: Today Report Updates
- Chronological list includes purchases and supplier payments (shown, not counted in Sales/Faida)
- Totals include money out by method
- Shared summary text includes money-out line
- Property test: totals reconcile to summary

### FR-07: Buying Price Tracking
- When a purchase is confirmed, each goods item's `buyingPrice` updates to that line's `unitPrice`
- Next sale uses this updated buying price for COGS (D-015)
- Warning when buying price changes from item's current `buyingPrice` (configurable warn/block via profile)

### FR-08: Offline & Sync
- All screens work offline (read from Dexie, write through commit service)
- Idempotent push (D-020): purchases and supplier payments sync with `ON CONFLICT DO NOTHING`
- Pull returns all business rows changed since timestamp
- New types accepted by Prisma CHECK constraint

---

## Non-Functional Requirements

### NFR-01: Correctness
- All money maths in `domain/` as pure functions with ≥90% test coverage
- `DENI_NEEDS_SUPPLIER` is a hard error (no override)
- Stock and supplier deni derived from ledger, never stored
- Voiding a purchase reverses stock; if negative, `NEGATIVE_STOCK` rule runs

### NFR-02: Performance
- Target: 3 GB RAM Android phone, Chrome
- Bundles small, lazy-load heavy screens
- Tap targets ≥ 48 px

### NFR-03: Privacy
- Never log record contents, phone numbers, PIN material
- PIN never leaves device

### NFR-04: Accessibility
- WCAG AA contrast on all screens
- Money figures in tabular Manrope, Ink on Surface

### NFR-05: Internationalisation
- Every UI string through `t(key, locale)`
- English default; Kiswahili keys added to `i18n/sw.*` typed against `en.*`
- Bilingual titles (D-040): English title with Kiswahili beneath (later phase adds switch)

---

## Technical Requirements

### TR-01: Domain Layer
- `TxnType` union gains `"purchase" | "supplier_payment"`
- New draft types: `DraftPurchase`, `DraftSupplierPayment`
- Ledger functions: `supplierOwed`, `openSupplierDeni`, `isSupplierOverdue`, `supplierDueWithin`, extended `stockOnHand`
- Summary: `MoneyFlow` gains `cashOut`, `mpesaOut`, `otherOut`; `rangeSummary`
- Grill rules: `DENI_NEEDS_SUPPLIER` (hard), `BUYING_PRICE_CHANGED`, `POSSIBLE_DUPLICATE` (purchase), `SUPPLIER_OVERPAID` (warn)
- Operating profile: `supplierDefaultDueRule`, `rules.buyingPriceChange`

### TR-02: Local Data Layer
- `commitPurchase`, `commitSupplierPayment`, updated `commitVoid`
- One Dexie transaction, parent order: new supplier → item buyingPrice update → txn → lines
- Query hooks: `useTodayPurchases`, `useSuppliersWithBalance`, `useSupplierLedger`, `useSuppliersDueThisWeek`, `useRecentSuppliers`, `useRangeSummary`

### TR-03: Screens & Routes
- Static routes (precached): `/manunuzi`, `/manunuzi/new`, `/debts/supplier`, `/debts/supplier/ledger?id=`
- No dynamic segments (D-041)
- Operate mode, core tokens, bilingual titles

### TR-04: Server & Sync
- Prisma contract: `transactions.type` CHECK adds `purchase`, `supplier_payment`
- Wire schemas: `toWire`/`fromWire` for new types (cents ↔ decimal string)
- Tenancy checks unchanged

---

## Out of Scope (Explicit)

- Purchasing services (they are expenses)
- Purchase returns to supplier, supplier refunds, payment direction `out` for suppliers
- Purchase orders, delivery tracking, partial deliveries, supplier price lists
- FIFO or weighted-average costing (D-015)
- Stock adjustments other than opening stock, low-stock screens, item editing (Phase 6)
- Supplier ageing tables and PDF (Phase 7)
- Supplier nodes in Mtandao (Phase 10)
- Purchases Agent AI parsing (Phase 8)
- M-Pesa API, SMS parsing

---

## Dependencies

- Phase 1: Auth & data foundation (Clerk, Prisma, Neon, Dexie, commit service, sync engine)
- Phase 2: Onboarding & notebook (operating profile, opening supplier deni)
- Phase 3: Daily transactions (sale, expense, customer_payment, opening_balance, stock_adjustment, void)
- Phase 4: Muhtasari, Today report, pilot readiness (query hooks, UI primitives, offline PWA)

---

## Decisions to Confirm (Before 5.1 Starts)

| ID | Decision | Options |
|----|----------|---------|
| **P5-A** | Confirmed purchase updates item's `buyingPrice` | A) Yes, auto-update (refines D-015)  B) No, manual only, warn only |
| **P5-B** | `DENI_NEEDS_SUPPLIER` hard error; fully paid may have no supplier | Confirm as specified |
| **P5-C** | "Deni (I owe)" = UI shortcut only; `paymentMethod` = null when nothing paid | Confirm as specified |
| **P5-D** | Supplier list location | A) `/debts/supplier` + Zaidi + `/debts` switch  B) Zaidi only |

*Record confirmed decisions in `planning/DECISIONS.md`.*