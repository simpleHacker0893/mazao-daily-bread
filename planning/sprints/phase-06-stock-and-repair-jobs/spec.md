# Phase 6: Stock depth and Kazi (stock adjustments, low stock, repair job cards)
> Release: R2 · Milestone: R2 Stock and Kazi (sprint 003) · Depends on: phases 1-4 (R0), phase 5 (purchases raise stock) · Label: ready-for-agent

## Problem Statement
Two groups of pilot merchants are still poorly served after R1.

**Goods sellers can't keep stock honest.** Sukuma wiki wilts, tomatoes split, a tray of mayai drops, the merchant's family eats from the stall, and counts are simply wrong. R0 allows a `stock_adjustment` only as opening stock (D-011), and items can't be edited (cut from R0), so the merchant can't fix a low-stock threshold or a wrong unit. The "Save anyway" dialog in stitch-prompts §10.2 already promises "My stock count is wrong. Save and set stock to 2 trays", but nothing behind it creates the correction. Low stock shows only as five rows on Muhtasari.

**Repair fundis can't track their work.** A fundi takes in a phone with a cracked screen, takes a deposit, promises Friday, and later fits a part from stock. In R0 that is either a sale recorded too early (revenue and parts counted before the work is done) or nothing at all, so jobs are forgotten, deposits are lost track of, and "ready but not collected" phones pile up on the shelf. D-007 and D-008 define the job card and its money rules, but no screen or ledger link exists.

## Solution
**Stock depth:**
- A "Rekebisha stoki / Adjust stock" sheet on each goods item records a `stock_adjustment` with a reason (counted, spoiled, damaged, own use, lost, other) and either a new counted quantity or a plus/minus change.
- An item stock ledger shows every purchase, sale, adjustment and void with a running quantity.
- Items become editable (name, unit, prices, low-stock threshold, active), as master data with last-write-wins.
- A low-stock view in Bidhaa lists goods at or below threshold, worst first, with a "Record purchase" shortcut into phase 5's form.
- The "Save anyway" dialog's first option now commits the sale together with a linked count-correction adjustment, in one save.

**Kazi / Repair jobs (D-007, D-008, spec §7.2):**
- Job list with status tabs and counts, and a job card with customer (required), item description, promised date, note, labour lines and parts lines from stock.
- Status flow `received → in_progress → ready → collected`, plus `cancelled`.
- Money follows D-008 exactly:
  - a deposit is a `customer_payment` linked to the job, which leaves the customer in credit;
  - **Mark ready** confirms the final lines and creates the linked `sale`, which is when parts leave stock and revenue and COGS count;
  - **Collected** records any remaining payment;
  - cancelling with a deposit leaves the customer in credit until refunded through a payment out.
- Muhtasari gains "Ready, not collected" and "Promised date passed" rows for merchants whose profile has jobs.

## User Stories
1. As a mama mboga, I want to record that 2 kilo of tomatoes spoiled, so that my stock count matches what is really on the table.
2. As a kiosk owner, I want to type the quantity I just counted and let the app work out the difference, so that I don't do subtraction while serving customers.
3. As a mama mboga, I want each adjustment to carry a reason (spoiled, own use, lost), so that I can see later where my goods go.
4. As a kiosk owner, I want an item's stock history with a running quantity, so that I can find when the count went wrong.
5. As a kiosk owner, I want to edit an item's selling price, buying price, unit and low-stock threshold, so that I can fix mistakes made during onboarding.
6. As a mama mboga, I want to hide an item I no longer sell without losing its history, so that my item picker stays short.
7. As a kiosk owner, I want one list of everything at or below its low-stock level, worst first, so that I know what to buy before I go to the wholesaler.
8. As a kiosk owner, I want to start a purchase straight from a low-stock row, so that restocking takes one tap.
9. As a mama mboga selling mayai the app thinks I don't have, I want "My stock count is wrong" to save the sale and fix the count in one step, so that the next sale doesn't warn me again.
10. As a repair fundi, I want to open a job card with the customer, the item ("Tecno Spark 10, cracked screen"), a promised date and a note, so that I stop losing track of phones on my shelf.
11. As a repair fundi, I want to record a deposit when the customer leaves the phone, so that I can show what they already paid.
12. As a repair fundi, I want to add labour lines and parts from my stock to the job, so that the final bill is built as I work.
13. As a repair fundi, I want to move a job through received, in progress, ready and collected, so that I see at a glance what stage every job is at.
14. As a repair fundi, I want marking a job ready to be the moment the sale is recorded and the screen leaves stock, so that my profit isn't counted before the work is done.
15. As a repair fundi, I want the customer's balance on collection to be the bill minus the deposit automatically, so that I don't argue about money at the counter.
16. As a repair fundi, I want to mark a job collected while recording the final payment, or leave the remainder as deni, so that regular customers can still pay later.
17. As a repair fundi, I want to cancel a job and see that the customer is in credit for their deposit, so that I remember to return it.
18. As a repair fundi, I want to record giving back a deposit as money out, so that the customer's credit closes and my cash count is right.
19. As a repair fundi, I want to reopen a job I marked ready by mistake, so that the sale is reversed and I can fix the lines.
20. As a repair fundi, I want Muhtasari to show jobs ready but not collected and jobs past their promised date, so that I can call those customers.
21. As a boda rider who also fixes bikes, I want jobs to support labour only, with no parts, so that a quick roadside repair is still one job card.
22. As a repair fundi, I want each job to have a short number like "Kazi #014", so that I can write it on a tag on the phone.
23. As a Chama treasurer reading a fundi's numbers, I want deposits to be excluded from sales until the job is ready, so that the fundi's profit isn't inflated.
24. As a developer, I want job status changes and the ledger records they create to happen in one Dexie transaction, so that a job is never "ready" without its sale.
25. As a developer, I want job money to reuse sale and customer-payment transactions with a `jobId`, so that no new money type is added and every balance is still derived (D-019).
26. As a product owner, I want stock-loss value shown separately until the owner decides whether it reduces Faida Halisi, so that profit is not silently overstated.
27. As a product owner, I want the Kazi screens to follow stitch-prompts §5 and the core tokens, so that they match the rest of the app.

## Implementation Decisions

### Domain module
- **Stock adjustment** conventions stay as in R0 (`totalAmount = 0`, lines carry ±quantity, valued at buying price) and gain a reason:

```ts
type StockAdjustmentReason =
  | 'opening' | 'count_correction' | 'spoiled' | 'damaged' | 'own_use' | 'lost' | 'other';
```
  Opening stock from the notebook uses `opening`. `adjustmentForCount(itemId, countedQty, txns, lines)` returns the signed difference so the UI never calculates it. ASSUMPTION: this reason list covers the pilot; confirm at the week-1 debrief.
- `stockLossValue(range, txns, lines)` = Σ |negative adjustment qty| × unitCost for non-opening, non-count-up reasons. It is reported, **not** subtracted from Faida Halisi, until proposed decision P6-A is made (D-014 says stock adjustments are never sales; it is silent on losses).
- `itemStockLedger(itemId, txns, lines)` returns rows with running quantity, voids reversed.
- **Jobs** are master data, not ledger records:

```ts
type JobStatus = 'received' | 'in_progress' | 'ready' | 'collected' | 'cancelled';
type Job = {
  id: Id; businessId: Id; jobNumber: number; customerId: Id; // required (D-007)
  itemDescription: string; promisedDate: string | null; note: string | null;
  status: JobStatus; plannedLines: JobLine[]; // labour (service) and parts (goods), editable until ready
  saleTxnId: Id | null; // set when ready; the ledger record is the source of truth
  createdBy: Id; createdAt: string; updatedAt: string;
};
```
- `canTransition(job, to)` encodes the allowed moves: received → in_progress | cancelled; in_progress → ready | cancelled; ready → collected | in_progress (reopen, which voids the linked sale); collected and cancelled are terminal. ASSUMPTION: received → ready directly is allowed for quick jobs; owner to confirm.
- `jobMoney(job, txns)` returns `{ total, depositsPaid, balanceOnCollection }` derived from the plan or the linked sale plus payments with this `jobId`.
- `jobsReadyNotCollected(jobs)` and `jobsPastPromise(jobs, today)` (Africa/Nairobi day, R0 date helpers).
- **Transaction changes:** `Txn` gains `jobId?` (spec §13). `customer_payment` gains `direction: 'in' | 'out'` (spec §13), default `in`; `out` raises the customer's balance and counts as money out. Ledger and summary functions honour it.
- **Grill rules:** parts lines run `NEGATIVE_STOCK` and `BELOW_COST` at Mark ready. `JOB_NEEDS_CUSTOMER` is a schema-level hard error. A deposit larger than the planned total warns (`DEPOSIT_EXCEEDS_TOTAL`).

### Local commit and query API
- `commitStockAdjustment` widens from opening-only to any reason, with `source: 'manual'`.
- `updateItem(id, patch)`: last-write-wins master data with `updatedAt` bumped (D-020). Deactivating keeps history (`isActive = false`).
- `commitSaleWithCountCorrection(draft)`: the "My stock count is wrong" path. It writes a `count_correction` adjustment that brings stock to exactly the quantity sold, then the sale, in one Dexie transaction. No override code is stored because the warning was resolved, not overridden.
- Job commands, each one Dexie transaction with queue entries in parent order (job before transactions):
  - `createJob(draft, deposit?)`: job row plus optional deposit `customer_payment` with `jobId`;
  - `updateJobPlan(jobId, patch)`: lines, description, dates, until ready;
  - `startJob`, `cancelJob(jobId)`;
  - `markJobReady(jobId, finalLines, opts)`: runs Grill on the sale draft, writes the `sale` (customer = job customer, `amountPaid = 0`, `jobId`, due date = today) and sets status and `saleTxnId`;
  - `reopenJob(jobId)`: voids the linked sale and returns to in_progress;
  - `collectJob(jobId, payment?)`: optional `customer_payment` with `jobId`, then collected;
  - `refundCustomer(customerId, amount, method, jobId?)`: `customer_payment` with `direction: 'out'`.
- **Job number:** the next number is max local `jobNumber` + 1, assigned on the phone. With one account per phone (D-039) this can't collide in the MVP; it is display only and never a key.
- Queries: `useItemStockLedger(id)`, `useLowStock()` (full list), `useJobs(status)`, `useJob(id)`, `useJobAlerts()`.

### Screens and routes
- Static routes (D-041), precached: `/items/item?id=` (detail, stock ledger, edit, adjust), `/items/low-stock`, `/kazi`, `/kazi/new`, `/kazi/job?id=`.
- Kazi list and job card follow stitch-prompts §5.1 and §5.2: status tabs with counts, a Maize alert row, job rows with Tomato for a passed promise, a status stepper, "Mark ready" with the helper "This records the sale. Parts leave stock now.", then "Collected, record payment". Empty state: "No jobs yet. Add one when a customer brings in an item."
- Zaidi adds Kazi / Repair jobs. Kazi is shown only when the operating profile sells services (ASSUMPTION: a profile flag `jobsEnabled`, defaulting to true when `sells` is `services` or `both`, editable in Mipangilio).
- Design: Operate mode, core tokens, bilingual titles (D-040), no photos on job cards (D-007), no decorative imagery.

### Server and sync
- **Schema changes vs R0 (and phase 5):**
  - new table `jobs(id uuid pk, business_id, job_number int, customer_id fk, item_description, promised_date date null, status check in (5 values), note, planned_lines jsonb default '[]', sale_transaction_id uuid null, created_by, created_at, updated_at)`, indexed on `(business_id, updated_at)`;
  - `transactions.job_id uuid null` referencing jobs; `transactions.direction text null check in ('in','out')`;
  - `transactions.adjustment_reason text null` with a CHECK on the reason list;
  - `items` already supports edit through last-write-wins; no change.
- Push parent order becomes customers, suppliers, items, jobs, merchant_settings, transactions, transaction_items. Jobs use the R0 conditional last-write-wins upsert with the business guard.
- Wire schemas add the new fields; conversion stays only at the sync boundary (D-013).

## Testing Decisions
- Good tests assert what the merchant sees: stock on hand, balances, Faida Halisi, job state. Not call order.
- **Primary seam: the local commit and query API** with fake IndexedDB, because job behaviour is about several records changing together.
- **Domain tests** (prior art: R0 B1 tests, DOMAIN.md worked example):
  - Count correction: stock 7, counted 5 → adjustment −2; stock 5.
  - Spoilage of 2 kilo at cost 30 → stockLossValue 60; Faida Halisi unchanged (until P6-A).
  - Job scenario (spec §7.2): deposit 500 → customer balance −500, sales 0; mark ready with labour 500 + screen 2,200 (cost 1,800) → sales 2,700, COGS 1,800, screen stock −1, balance 2,200; collect paying 2,200 → balance 0. Reopen before collect → sale voided, stock restored, balance −500.
  - Cancel with deposit → balance −500; refund out 500 → balance 0 and cash out 500.
  - `canTransition` table test for every pair.
- **Commit tests:** a failed `markJobReady` (hard error) leaves no sale and the status unchanged; `commitSaleWithCountCorrection` writes both or neither.
- **Sync route tests:** jobs push idempotently and last-write-wins; a transaction whose `job_id` belongs to another business is rejected.
- **Playwright on the built app:** offline journey: new job with deposit → mark ready → Muhtasari "Ready, not collected" → collect → deni list clean. Cold-offline route check extended to the new routes.

## Out of Scope
- Job photos, warranties, "item ready" SMS (D-007).
- Multi-location stock, stock transfers, batch or expiry tracking, barcodes (PRD §5.2).
- Assigning jobs to attendants (D-012), job printing.
- Supplier returns and refunds.
- Jobs Agent AI parsing (phase 8). Stock-loss lines in the PDF (phase 7 consumes `stockLossValue`).

## Further Notes
- **Decisions the architect must record before building:**
  - **P6-A (owner):** does stock loss (spoiled, damaged, lost, own use) reduce Faida Halisi? Today D-014 keeps it out, which can overstate profit, an anti-goal in spec §2. Until decided, show "Stock loss" as its own line.
  - **P6-B:** jobs store planned lines on the job row (jsonb) until ready; the sale is the only ledger truth.
  - **P6-C:** `customer_payment.direction` and `transactions.adjustment_reason` columns; `direction: out` counts as money out.
  - **P6-D:** reopen = void the linked sale; whether received → ready directly is allowed.
  - **P6-E:** job numbers are per-phone display numbers; revisit when multi-device or attendants arrive (phase 11).
- **Open questions:** Q-006 (native check of "Kazi" for repair jobs, and "Rekebisha stoki", which is our coinage). ASSUMPTION: the sale created at ready is due the same day.
- **Risks:** R-003 (wrong numbers) is highest here because one tap writes several records; R-011 (shared files) if R1 and R2 overlap in the commit service.
