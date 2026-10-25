# Phase 5: Manunuzi and Deni la Wasambazaji (purchases, supplier deni, supplier payments, stock intake)
> Release: R1 · Milestone: R1 Manunuzi (sprint 002) · Depends on: phases 1, 2, 3, 4 (R0 pilot) · Label: ready-for-agent

## Problem Statement
After R0, a merchant can record what they sell and spend, but not what they buy. Three things go wrong as a result:

- **Stock drifts.** R0 stock only goes up through opening stock (D-011). Every new gunia of viazi or tray of mayai bought at the market is invisible, so the Bidhaa count falls below zero within days and the `NEGATIVE_STOCK` warning becomes noise the merchant learns to ignore.
- **Supplier deni is frozen.** R0 captures opening supplier deni from the notebook, but the merchant can't add a new credit purchase or record paying the supplier. The Muhtasari "supplier deni" figure is therefore wrong from day two.
- **Cash out is unknown.** Money in is shown by method, but money paid out for stock is not, so the merchant can't reconcile the cash box or the M-Pesa balance at the end of the day.

For a kiosk owner who buys on credit from a wholesaler, supplier deni is often larger than customer deni. Without it Mazao is only half a notebook.

## Solution
Add the two remaining R1 transaction types from DOMAIN.md, `purchase` and `supplier_payment`, through the same single save path as R0 (commit service, Grill rules, one Dexie transaction with sync-queue entries, D-026).

- **Manunuzi / Purchases:** a "Manunuzi Mapya / New purchase" form (stitch-prompts §4.1) records goods bought from a supplier, with quantity, unit and buying price per line. Saving raises stock on hand for each goods line. If the merchant pays less than the total, the remainder becomes supplier deni and needs a supplier (hard error, mirroring D-038) and offers due-date chips. A Manunuzi list shows today's purchases with void.
- **Deni la Wasambazaji / Supplier debt:** a list of suppliers the merchant owes, overdue first, with a total and "due this week" figure, and a supplier ledger with running balance and a "Pay supplier" sheet (stitch-prompts §4.2).
- **Supplier payments:** amount, method and optional M-Pesa reference; the balance can go negative (the supplier holds the merchant's money in advance).
- **Money out:** the period summary gains cash, M-Pesa and other money out (purchase amount paid + supplier payments + expenses, PRD §10.2). Purchases never touch Faida Halisi directly; their cost reaches profit only through COGS when the goods are sold (D-014, D-015).
- **Muhtasari:** the supplier deni total becomes live, and a "due this week" line and a "New purchase" quick action are added.

Everything works offline, syncs idempotently (D-020) and stays derived from the ledger (D-019).

## User Stories
1. As a kiosk owner, I want to record a purchase of several goods lines from my wholesaler in one form, so that my stock and my supplier deni update together.
2. As a mama mboga, I want to record buying 2 gunia of viazi at KES 2,800 each, so that Bidhaa shows the new stock without me counting it.
3. As a kiosk owner, I want to pay part of a purchase now and owe the rest, so that the unpaid remainder becomes supplier deni with a due date.
4. As a kiosk owner, I want the app to refuse a credit purchase without a supplier, so that money I owe never disappears from my deni list.
5. As a mama mboga buying from a stranger at the wholesale market, I want to record a fully paid purchase without naming a supplier, so that a one-off cash buy stays quick.
6. As a mama mboga, I want to pick a recent supplier from chips or add a new one by name and optional phone, so that recording takes seconds.
7. As a kiosk owner, I want to see a warning when a buying price changed from last time ("Viazi cost KES 2,800, up from KES 2,500 last time"), so that I notice price rises and can adjust my selling price.
8. As a kiosk owner, I want my item's buying price to follow what I last paid, so that the cost counted when I sell (and so Faida Halisi) reflects today's prices.
9. As a kiosk owner, I want to see every supplier I owe, overdue first, with the total at the top, so that I know who to pay before they stop giving me credit.
10. As a kiosk owner, I want to open a supplier's ledger with every purchase on deni, payment, brought-forward balance and void, with a running balance, so that I can settle disputes with the supplier.
11. As a kiosk owner, I want to record paying a supplier by cash or M-Pesa with a "New balance" preview, so that I see the result before saving.
12. As a kiosk owner, I want overpaying or paying in advance to leave the supplier in credit, so that advances to suppliers are tracked honestly.
13. As a mama mboga, I want a purchase I entered wrongly to be voided and re-entered, so that stock and supplier deni are corrected without editing history (D-018).
14. As a kiosk owner, I want Muhtasari to show what I owe suppliers and how much is due this week, so that I plan my cash.
15. As a boda rider, I want fuel and repairs to stay as Gharama, not purchases, so that my Faida Halisi still includes them (D-014).
16. As a mama mboga, I want today's money out by cash and M-Pesa next to money in, so that I can check my cash box and M-Pesa at closing.
17. As a kiosk owner, I want buying stock not to lower today's Faida Halisi, so that a big restock day doesn't look like a loss.
18. As a kiosk owner, I want the opening supplier deni I brought from my notebook to appear as "Brought forward" in the supplier ledger, so that old and new deni live in one place.
19. As a repair fundi, I want to record buying spare parts (screens, chains) as purchases, so that parts are in stock before I use them on a job in R2.
20. As a mama mboga, I want all of this to work in airplane mode and back up later, so that a bad signal day at Gikomba costs me nothing.
21. As a kiosk owner, I want the app to warn me when a purchase looks like a duplicate of one I saved minutes ago, so that I don't double my stock and deni.
22. As a Chama treasurer reading a merchant's numbers, I want supplier deni to be separate from expenses and profit, so that I can judge what the merchant really owes.
23. As a developer, I want `purchase` and `supplier_payment` to go through the same commit service and Grill rules as sales, so that there is still only one save path.
24. As a developer, I want supplier balances, open supplier deni and overdue status to be pure domain functions mirroring the customer ones, so that they are tested once and reused by Ripoti in R3.
25. As a developer, I want the server to accept the two new types with the same idempotent push, so that no sync code path is special-cased.
26. As a product owner, I want every new title bilingual (Manunuzi / Purchases, Manunuzi Mapya / New purchase, Deni la Wasambazaji / Supplier debt), so that D-040 holds across the app.
27. As a product owner, I want the R1 screens to follow the same Operate-mode tokens as R0, so that the app feels like one sturdy tool.

## Implementation Decisions

### Domain module (pure functions, extends R0)
- **Transaction type union** gains `purchase` and `supplier_payment` (DOMAIN.md table). The R0 note "not in the union until R1" is retired.
- **Conventions** (extend the R0 conventions in the R0 types contract):
  - `purchase`: `supplierId` optional; `totalAmount` = sum of line totals; `amountPaid` ≤ `totalAmount`; `paymentMethod` describes the paid part and is `null` when nothing is paid; lines are goods only, with `unitPrice` = buying price paid per unit and `unitCost` = `unitPrice`.
  - `supplier_payment`: `supplierId` required; `totalAmount = amountPaid = amount`.
  - `void` of either copies `supplierId` from the original, as R0 voids already do.
- **Ledger functions**, mirroring the customer side:
  - `supplierOwed(supplierId, txns)` now counts opening balances + purchase remainders − supplier payments, with voids reversed.
  - `openSupplierDeni(supplierId, txns)`: FIFO allocation of supplier payments to the oldest credit purchase or opening balance; overpayment carries forward. Same algorithm and tests as `openDeni`, so it should be one generic function parameterised by party side.
  - `isSupplierOverdue(supplierId, txns, today)`, and `supplierDueWithin(txns, today, days)` for "due this week".
  - `stockOnHand` adds purchase goods lines (+qty) to the R0 formula (adjustments − sale lines).
- **Summary:** the R0 day summary is generalised to a range summary and gains money out:

```ts
type MoneyFlow = {
  cashIn: Cents; mpesaIn: Cents; otherIn: Cents;
  cashOut: Cents; mpesaOut: Cents; otherOut: Cents; // purchase amountPaid + supplier payments + expenses, by method
};
```
  Sales, COGS, Expenses and Faida Halisi formulas are unchanged (D-014). A purchase never changes them.
- **Grill rules** (D-026, D-027):
  - `DENI_NEEDS_SUPPLIER`: hard error, can't be overridden, when a purchase has `amountPaid < totalAmount` and no supplier. This extends D-038 to suppliers and must be recorded as a decision (see Further Notes).
  - `ARITHMETIC` and `PAID_EXCEEDS_TOTAL` apply to purchases unchanged.
  - `BUYING_PRICE_CHANGED`: warn/block from the profile, fires when a line's unit price differs from the item's current `buyingPrice` by more than the profile's variance threshold. Default warn. The message carries both prices.
  - `POSSIBLE_DUPLICATE` extends to purchases and supplier payments keyed on a **set** `supplierId`, same type, same total, within 10 minutes.
  - `SUPPLIER_OVERPAID`: warn only, when a supplier payment exceeds the current amount owed.
- **Operating profile** gains `supplierDefaultDueRule` (same values as `defaultDueRule`, nullable, default null) and `rules.buyingPriceChange` (`warn` | `block`, default `warn`). Old profiles parse with defaults, so no migration of stored settings is needed.

### Local commit and query API
- New commits: `commitPurchase(draft, opts)` and `commitSupplierPayment(draft, opts)`, with the same steps as R0: Zod parse, `runGrill`, stamp IDs and `createdBy`, one Dexie transaction writing rows and queue entries in parent order (new supplier, item update, txn, lines).
- **Buying price follows the last purchase** (proposed decision P5-A): when a purchase is confirmed, each goods item's `buyingPrice` is set to that line's `unitPrice` and `updatedAt` is bumped, inside the same Dexie transaction, so the item update syncs as master data (last-write-wins, D-020). This keeps D-015 ("unit cost = current buying price") meaningful without FIFO.
- `commitVoid` accepts purchases and supplier payments. Voiding a purchase reverses stock; if that takes stock below zero the `NEGATIVE_STOCK` rule runs on the void like any other record.
- New queries: `useTodayPurchases()`, `useSuppliersWithBalance()` (owed > 0 or in credit, overdue first then by amount), `useSupplierLedger(id)`, `useSuppliersDueThisWeek()`, `useRecentSuppliers(n)`, and `useRangeSummary(range)` (the R0 day summary becomes a special case).
- `useUnsyncedCount()` is unchanged (lines excluded, D-020 queue semantics).

### Screens and routes
- Static routes only (D-041), all added to the service-worker precache list: `/manunuzi`, `/manunuzi/new`, `/debts/supplier` (list) and `/debts/supplier/ledger?id=<uuid>`. ASSUMPTION: the existing `/debts` page stays customer deni, and a two-option switch at its top ("Wateja / Customers" and "Wasambazaji / Suppliers") reaches the supplier list as well as the Zaidi sheet.
- The Zaidi / More sheet adds Manunuzi / Purchases and Deni la Wasambazaji / Supplier debt, in the order shown in stitch-prompts §1.
- **New purchase form** (stitch-prompts §4.1): supplier chips with "+ New supplier"; goods-only line picker with quantity, unit and buying price prefilled from the item; helper "Stock goes up when you save."; total; payment as Cash / M-Pesa / "Deni (I owe)". "Deni (I owe)" is a UI shortcut that sets paid to 0; "deni" is never stored as a payment method (DOMAIN.md). With a remainder, "Paid now" and "I owe" (Maize) appear with the supplier due chips. Items can be created inline, as on the sale form.
- **Supplier debt list and ledger** (stitch-prompts §4.2): total "You owe suppliers", "due this week" in Maize, rows with a Maize or Tomato left bar, ledger with running balance right-aligned, "Pay supplier" bottom sheet with new-balance preview. Empty state: "You don't owe any supplier."
- **Muhtasari:** the supplier deni figure uses `supplierOwed` across all suppliers; a "Due this week" line; money out next to money in; "New purchase" quick action for businesses whose profile sells goods or both.
- **Leo / Today report (phase 4):** `dayReport` gains purchase and supplier-payment entries (shown, never counted in Sales or Faida Halisi) and money out in its totals, and the shared summary text adds a money-out line. Its property test (totals equal the summary) must still hold with the new types.
- **Design:** Operate mode with the core token block in stitch-prompts.md. Money figures in tabular Manrope, Ink on Surface. No three-equal-card rows, no eyebrow labels, no gradients or decorative dots. No imagery except an optional illustration-free empty state. Every title bilingual (D-040), every string through i18n (D-005).

### Server and sync
- **Schema change vs R0:** the `transactions.type` CHECK constraint adds `purchase` and `supplier_payment` (migration created with create-only and edited, as in R0). No new tables or columns.
- Wire schemas accept the new types; cents to decimal conversion stays only at the sync boundary (D-013).
- Push and pull contracts are unchanged. Tenancy checks are unchanged: a purchase whose `supplierId` belongs to another business is rejected with 403 for the whole batch, the same as customers today.

## Testing Decisions
- A good test checks external behaviour (balances, stock, totals, what the merchant sees), never internal call order or Dexie layout.
- **Primary seam: the local commit and query API** (commit functions plus the derived queries) with fake IndexedDB. One test per scenario drives commits and asserts the derived numbers.
- **Domain unit tests** (prior art: the R0 B1 tests and the DOMAIN.md worked example):
  - Extended worked example: the R0 day plus a purchase of 2 gunia viazi at 2,800 paid 3,000 cash with supplier Mzee Kariuki. Sales 350, COGS 90, Expenses 50, Faida Halisi 210 are unchanged; cash out = 3,000 + 50; supplier owed = 2,600.
  - Supplier deni scenario mirroring AC-04: purchase 5,600 paid 1,000 → owed 4,600; payment 1,000 → 3,600; void the payment → 4,600; the void shows in the supplier ledger.
  - `openSupplierDeni` FIFO across two purchases and a brought-forward balance; overpayment carries forward.
  - Stock: opening 10 tray mayai, purchase 5, sell 3 → 12; void the purchase → 7.
  - D-015 interaction: a purchase at a new buying price changes the `unitCost` captured on the next sale, not on past sales.
  - Each new Grill rule fires and does not fire; `DENI_NEEDS_SUPPLIER` still throws with `override: true`.
- **Sync route tests** against a Neon dev branch: the new types push idempotently twice; a foreign supplier ID is rejected; the CHECK constraint accepts the new types.
- **Playwright on the built app** (`build` then `start`, never dev): one journey offline: new purchase on deni → supplier list shows the balance → pay supplier → Muhtasari updates; then the cold-offline route check (AC-09 prior art) extended to the new routes.

## Out of Scope
- Purchasing services (they are expenses), purchase returns to a supplier, supplier refunds and payment direction `out` for suppliers.
- Purchase orders, delivery tracking, partial deliveries, supplier price lists.
- FIFO or weighted-average costing (D-015).
- Stock adjustments other than opening stock, low-stock screens and item editing (phase 6).
- Supplier ageing tables and PDF (phase 7). Supplier nodes in Mtandao (phase 10).
- Purchases Agent AI parsing (phase 8).
- M-Pesa API, SMS parsing (spec §2 non-goals).

## Further Notes
- **Decisions the architect must record before building:**
  - **P5-A:** a confirmed purchase updates the item's `buyingPrice` to the purchase unit price (refines D-015). Alternative: keep buying price manual and only warn. Owner to confirm.
  - **P5-B:** `DENI_NEEDS_SUPPLIER` is a hard error like D-038, and fully paid purchases may have no supplier.
  - **P5-C:** "Deni (I owe)" is a UI shortcut only; `paymentMethod` is `null` when nothing is paid.
  - **P5-D:** where the supplier list lives (the `/debts` switch plus the Zaidi entry, or Zaidi only).
- **Open questions:** Q-006 (native check of "Manunuzi Mapya"); none of Q-001 to Q-005 block this phase.
- **Risks:** R-003 (wrong numbers): purchases must never leak into Faida Halisi; the extended worked example guards it. R-002 is unchanged by this phase.
- ASSUMPTION: pilot merchants buy mostly from a small set of repeat suppliers, so recent-supplier chips cover most purchases. Check at the week-1 debrief.
