# Phase 3 implementation plan (tickets P3-1 and P3-2)

Spec: `planning/sprints/phase-03-daily-transactions/spec.md` (GitHub #4). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` step **B3** (Ledger screens), building on **B1** (domain core) and **B2** (local data and commit service).
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Issue numbers are assigned when the scrum-architect creates the tickets after the owner OKs this plan.

**Why B3 is two tasks.** B3 needs two specialists in different files: the `backend` agent adds the read models and the save adapter the screens call (`domain/*`, `local/*`), and the `frontend` agent builds the primitives and screens (`ui/*`, `app/(app)/*`). The B1/B2 briefs don't cover a running balance, the deni list order and totals, the draft-sale totals, the payment preview, customer search, the live grill preview or a `SaveOutcome` result. Without a `backend` task for these, the screens would end up calculating money, which AGENTS.md forbids. The hand-off contract is in Task 1. The blueprint doesn't split B3 any further, so both tasks stay in Dev B's lane (R-011).

| Task | Step | Lane | When (EAT, blueprint) | Agent | Model | Blocked by |
|---|---|---|---|---|---|---|
| 1 | B3 (read models + save adapter) | Dev B | Sun 12:00–13:00 | backend | **strongest** | B1, B2 |
| 2 | B3 (screens) | Dev B | Sun 12:00–18:00 (from the Task 1 contract) | frontend | default | Task 1, A2 (#17, #18), A4, B2 |

## Global Constraints

- Package manager **pnpm only**. Latest Next.js App Router, **no `src/`**, React Compiler on; no hand-written `useMemo`/`useCallback`/`memo`; render stays pure. Build is `next build --webpack` (D-042). Biome only.
- TypeScript strict + `noUncheckedIndexedAccess`.
- **Offline first.** Every page in this phase is a client page that reads only from Dexie, with no server data fetching and no dynamic segments. Parameters go in the query string, read with `useSearchParams` inside `Suspense`, for example `/deni/customer?id=<uuid>` (D-041). These tasks never touch `/api/*` or the server.
- **One save path.** Pages write only through `local/save.ts` (Task 1), which wraps `local/commit.ts` (B2). No page or component touches Dexie tables directly.
- **Pure numbers.** Every money figure on screen comes from a `domain` function, through a `local/queries.ts` hook or `local/save.ts`. Components and hooks never add, subtract, multiply or round money. That includes line totals, the sale total, the deni remainder, the running balance, the new-balance preview and the deni list totals.
- **Money:** integer cents in `domain` and the client (D-013). `lineTotal = Math.round(qty * unitPrice)`. `MoneyInput` takes whole shillings and returns cents.
- **Ledger:** confirmed records are immutable. A correction is a `void` plus a new record (D-018). Balances and stock are derived and never stored (D-019).
- **Grill:** hard errors (`SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, `DENI_NEEDS_CUSTOMER`) can never be overridden (D-038). Warn-level issues save on the first tap. Block-level issues need a second "Save anyway" tap, and their codes are stored in `txn.overrides` (D-027).
- **Frozen contracts:** `domain/types.ts` and `domain/schemas.ts` are frozen after B1. New types go in the module that owns them (`domain/ledger.ts`, `local/save.ts`, …), not in `types.ts`. Changing a frozen file needs both devs to agree in the PR (R-011).
- **File ownership (R-011):** both tasks are Dev B's lane: `domain/*`, `local/*`, `ui/*`, `ui/ledger/*`, every `app/(app)/*` page except `layout.tsx` and `mipangilio`, and `i18n/en.ledger.ts`. Don't edit `app/(app)/layout.tsx`, `ui/shell/*`, `app/sw.ts` or `i18n/en.shell.ts`.
- **Strings:** every UI string comes from `i18n/en.ledger.ts`. Titles are bilingual through `PageTitle` (D-040): Mauzo / Sales, Mauzo Mapya / New sale, Gharama / Expenses, Gharama Mpya / New expense, Deni la Wateja / Customer debt, Bidhaa / Items. Market words (deni, ushuru, kilo, gunia, tray…) are never translated (D-005).
- **Design tokens** (from `docs/design/stitch-prompts.md`): Chalk background, Surface rows, Ink text, Manrope with tabular figures on every amount, "KES 1,250" format. Sukuma Green is used only for the primary action, the active nav and focus. Maize marks deni; Tomato marks only overdue, errors and destructive actions. 8 px radius, 48 px tap targets, no gradients, no em-dashes, no emoji. Work screens carry no photographs, except one optimised empty-state image (≤ 150 KB, D-045).
- **Phone:** a 3 GB Android phone running Chrome, 360 px wide. New sale opens in < 2 s after unlock, and a save shows in the list in < 1 s (AC-20).
- **Privacy:** never log record contents, customer names, phone numbers or M-Pesa codes.
- **Test-first** (red → green → refactor) for everything in `domain` and `local`. Playwright runs only against `pnpm build && pnpm start`, never `dev`.
- A PR is ready only when `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass and the ticket's checks have been run. Branch as named in the ticket. The PR title is `<step-id>: <summary>`, and the body lists `Closes #<ticket>` and the AC IDs and pastes the verification output.
- **Stop and ask** (product-owner) if this plan or the spec is silent on anything a merchant would see. The open questions are listed at the end; don't settle them in code.

## Task 1: P3-1 (B3): Ledger read models and save adapter

### Parent

#4 (Phase 3: Recording daily transactions). Blueprint step **B3** (data part), branch `feat/b3-ledger-read-models`. Agent `backend`, **strongest model** (new money maths). Dev B lane.

### What to build

Every number on the ledger screens is right because tested domain functions produce it, not the page. When a merchant types a sale, she sees the line totals, the sale total and the "Deni KES 320" remainder. When she opens Deni, the list is in the right order with the right totals. A customer's ledger shows a running balance that ends at the balance on the deni list. Paying more than is owed shows how much becomes credit. A save either succeeds, explains why it can't save, or asks for "Save anyway", and it can't fail silently.

- **Domain additions** (pure, in the existing B1 modules; `types.ts` and `schemas.ts` unchanged):
  - `domain/money.ts`: `saleDraftTotals(lines, amountPaid)` returns `{ lineTotals: Cents[], total: Cents, deni: Cents }`, using `lineTotal`. `deni` is `max(0, total − amountPaid)`.
  - `domain/ledger.ts`:
    - `paymentPreview(balance, amount)` returns `{ newBalance, creditCreated }`. `creditCreated` is `max(0, amount − max(0, balance))`.
    - `deniList(customers, txns, today)` returns `{ totalOutstanding, overdueTotal, rows }`, where each row is `{ customerId, name, balance, earliestDue: string | null, overdue: boolean }`. Rows include only customers with a balance > 0, sorted overdue first and then by balance, highest first. The earliest due date comes from `openDeni`; `overdue` comes from `isOverdue`. `overdueTotal` follows the answer to **OQ-3.1**.
    - `customerLedgerRows(customerId, txns)` returns `{ txnId, at, type, amount, delta, runningBalance, voided, broughtForward, paymentMethod, externalReference }[]`, newest first. Voided originals and their voids are listed, but contribute `delta = 0`, so the last running balance always equals `customerBalance`.
  - `domain/dates.ts`: `formatNairobiTime(iso)` returns `HH:mm` in EAT, and `nairobiDateFromDay(day)` gives the `occurredAt` for a backdated expense, following the answer to **OQ-3.2**.
- **Hand-off contract for Task 2**: the `frontend` agent codes against these exports and nothing else:

  ```ts
  // local/save.ts (new): wraps local/commit.ts; it never re-implements a rule
  export type SaveOutcome =
    | { kind: 'saved'; txnId: Id }
    | { kind: 'hard_error'; issues: Issue[] }      // SCHEMA, ARITHMETIC, PAID_EXCEEDS_TOTAL, DENI_NEEDS_CUSTOMER, or a commitVoid rejection
    | { kind: 'needs_override'; issues: Issue[] }; // block-level only; call again with { override: true }
  export function saveSale(draft: DraftSale, opts?: { override?: boolean }): Promise<SaveOutcome>;
  export function saveExpense(draft: DraftExpense, opts?: { override?: boolean }): Promise<SaveOutcome>;
  export function savePayment(draft: DraftPayment, opts?: { override?: boolean }): Promise<SaveOutcome>;
  export function saveVoid(txnId: Id): Promise<SaveOutcome>;
  // addItem, upsertCustomer and saveSettings are re-exported unchanged from local/commit.ts

  // local/queries.ts (additions; each wraps a domain function in useLiveQuery)
  useGrillPreview(draft: DraftSale | DraftExpense | DraftPayment | null): { hardErrors: Issue[]; issues: Issue[] } | undefined;
  useSaleDraftTotals(lines, amountPaid): { lineTotals: Cents[]; total: Cents; deni: Cents };
  useDeniList(today: string): ReturnType<typeof deniList> | undefined;
  useCustomerLedgerRows(customerId: Id): { customer: Customer; balance: Cents; overdue: boolean; rows: LedgerRow[] } | undefined;
  usePaymentPreview(customerId: Id, amount: Cents): { newBalance: Cents; creditCreated: Cents } | undefined;
  useRecentCustomers(n: number): Customer[] | undefined;   // most recent activity first
  useCustomerSearch(query: string): Customer[] | undefined; // case-insensitive "contains" on name
  useTxnDetail(txnId: Id): { txn: Txn; lines: TxnLine[]; customer?: Customer; canVoid: boolean } | undefined;
  ```
  - `saveSale` takes the draft in the shape `commitSale` already accepts, including a new customer written before the txn in the same Dexie transaction (B2). If `commitSale` needs that shape changed, the change is made here, in this PR.
  - Each save maps `CommitError` to `hard_error` and `NeedsOverride` to `needs_override`. Any other error (for example a storage quota error) is rethrown, never swallowed.
  - `useGrillPreview` builds the grill context from Dexie exactly the way the commit service does, so the preview and the save can never disagree.
- If B2 already exports one of these under another name, re-export it under the contract name instead of duplicating it, and say so in the PR body.

### Acceptance criteria

- [ ] `saleDraftTotals`: the worked-example lines give 15000 and 20000, total 35000. With 0.5 kilo × 12000 the line total is 6000. Paid 10000 on a 42000 total gives deni 32000.
- [ ] Through `saveSale`/`saveExpense` and then the day-summary query: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000, cash 15000, M-Pesa 20000 (AC-03 unit part).
- [ ] Deni scenario through `saveSale`/`savePayment`/`saveVoid`: Wanjiku 30000 paid 10000 → 20000; pay 15000 → 5000; void the payment → 20000. `customerLedgerRows` lists the void, the voided payment row has `voided: true`, and the last `runningBalance` equals `customerBalance` at every step (AC-04 unit part).
- [ ] Opening stock of 10 tray, sell 3 → `stockOnHand` 7. Sell 8 more → `saved`, with a `NEGATIVE_STOCK` warn issue in the preview (AC-06 unit part).
- [ ] A sale with deni and no customer returns `hard_error` with `DENI_NEEDS_CUSTOMER`, **including with `override: true`** (AC-07 unit part).
- [ ] With a profile seeded `rules.negativeStock = 'block'`, overselling returns `needs_override`; calling again with `override: true` returns `saved`, and the stored txn has `overrides: ['NEGATIVE_STOCK']` (AC-08 unit part).
- [ ] `deniList` orders an overdue 5000 above a not-yet-due 90000, and a credit with no due date is never overdue.
- [ ] `paymentPreview(30000, 40000)` gives `{ newBalance: -10000, creditCreated: 10000 }`. An overpayment, then a later deni sale, nets against it through `customerBalance`.
- [ ] `useGrillPreview` and `saveSale` return the same issue codes for 10 table-driven drafts.
- [ ] A void of a sale returns its stock and removes its deni. A second `saveVoid` on the same txn returns `hard_error`.
- [ ] A service line moves no stock and has `unitCost` 0.
- [ ] `useCustomerSearch('wanj')` finds "Wanjiku". `useRecentCustomers(5)` puts the customer of the latest txn first.
- [ ] `domain` line coverage stays ≥ 90% (AC-02). `pnpm test domain local --coverage` output is pasted in the PR.
- [ ] lint, typecheck, test and build pass. The PR body pastes the contract above as built.

### Blocked by

- B1 (Phase 1 domain core)
- B2 (Phase 1 local data and commit service)

## Task 2: P3-2 (B3): Ledger screens (Bidhaa, Mauzo, Gharama, Deni)

### Parent

#4 (Phase 3). Blueprint step **B3** (screens), branch `feat/b3-ledger-screens`. Agent `frontend`, default model. Dev B lane. Visual reference: `docs/design/r0/` (D0, #21) if exported, otherwise the tokens. Don't wait on D0.

### What to build

A merchant can run a whole market day on her phone with no signal:
- add what she sells;
- record a cash, M-Pesa or deni sale in a few taps, with goods and services mixed;
- record ushuru at the gate;
- see who owes her, overdue first;
- open a customer's ledger and record a payment;
- void a mistake, which stays visible, struck through and marked "Voided".

Unusual entries are questioned, never refused, except deni without a customer, which can't be saved at all.

Build it in this order, so the primitives are reviewable early. Phase 2 (onboarding and notebook) reuses them.

1. **Primitives** in `ui/`: `Button`, `Chip`, `ChipGroup`, `MoneyInput` (whole shillings → cents), `QtyInput` (half-step button and fractional input only when `allowsFractional`; at most 3 decimals; whole numbers otherwise), `Sheet`, `IssueList` (announced with `aria-live`), `SaveAnywayDialog`. `PageTitle` already exists (A2).
   - **Hand-off contract for Phase 2:** `ui/index.ts` exports these primitives, and `ui/ledger/index.ts` exports `ItemPicker`, `AddItemSheet`, `CustomerPicker` (recent, search as you type, create with name and optional phone), `DueChips` (Kesho / Tomorrow, Ijumaa / Friday, Wiki ijayo / Next week, Mwisho wa mwezi / End of month, Pick date, with the profile default preselected, through `resolveDueRule`) and `RecordPaymentSheet` (`{ customerId?: Id; onDone(): void }`; with no `customerId` it opens `CustomerPicker` first). Phase 4 (Muhtasari) also uses `RecordPaymentSheet`.
2. **Bidhaa / Items** `/bidhaa`:
   - Goods first, then services. Goods rows show the unit, the selling and buying price, the stock on hand, and a Maize "Low" tag at or below the threshold. Services show "Service, no stock".
   - An "Add item" sheet with a kind toggle. For services, the unit is limited to trip, job or piece, and the buying price, threshold and half-units switch are hidden. Goods have no "current stock" field: opening stock comes from the notebook in Phase 2. No editing in R0.
3. **Mauzo Mapya / New sale** `/mauzo/new`:
   - The line editor uses `ItemPicker`: Recent, then search, then "Add new item", which returns the new item to the line. The unit price is prefilled and editable. Line and sale totals come from `useSaleDraftTotals`.
   - Payment method chips (cash, M-Pesa, other) are filtered to the profile's methods; which one is preselected follows **OQ-3.4**. "M-Pesa code (optional)" appears only for M-Pesa. Amount paid defaults to the total, and there's an "All on deni" shortcut (**OQ-3.3**).
   - When paid < total, the deni section shows "Deni KES n" in Maize, with `CustomerPicker` (required) and `DueChips`. Until a customer is chosen, Save stays disabled and "Choose who owes this" shows at the picker.
   - `useGrillPreview` shows issues above Save. A hard error disables Save and shows the reason. Warnings save on the first tap. `needs_override` opens `SaveAnywayDialog`, and "Save anyway" calls `saveSale(draft, { override: true })`.
   - On `saved`, go to `/mauzo`.
4. **Mauzo / Sales** `/mauzo`:
   - Today's sales, newest first: time (`formatNairobiTime`), item summary, total, method, a Maize "Deni: <name>" badge, a "Voided" struck-through state, and a small cloud-off icon while unsynced.
   - A detail sheet shows the lines, payment, customer, due date and "Saved with a warning: …" for each override. Void appears only when `canVoid`. The confirm text is "Void this sale? It stays in your records, marked Voided. Stock and deni go back."
   - Empty state: "No sales today yet."
5. **Gharama Mpya / New expense** `/gharama/new`: amount, category chips from the profile plus "Add category" (appended to the profile through `saveSettings`), method chips, an optional note, and the date (default today; earlier days per **OQ-3.2**). **Gharama / Expenses** `/gharama` lists today's expenses with Void (**Cut 4** may drop this list).
6. **Deni la Wateja / Customer debt** `/deni`:
   - From `useDeniList(today)`: a header with the total outstanding and the overdue total (in Tomato), then rows with name, balance and earliest due date. Each row has a left bar (Tomato when overdue, Maize when not yet due), plus text ("overdue" / "due kesho") so colour is never the only signal, and "Record payment".
   - Empty state: "Nobody owes you money right now."
7. **Customer ledger** `/deni/customer?id=<uuid>`:
   - The balance line ("Otieno owes you KES 1,200", in Tomato only when overdue), then `useCustomerLedgerRows`, newest first. Each row shows the date and time, what happened (with method and code), a "Brought forward" tag where it applies, voided rows struck through and labelled "Voided", the amount and the running balance.
   - Void is offered on payment and opening-balance rows; a sale row opens the sale detail.
   - `RecordPaymentSheet` offers quick chips ("All KES n" plus round amounts below it) and a preview from `usePaymentPreview`. When the merchant overpays, it shows "That's KES n more than <name> owes. It will be kept as credit." and still saves.
8. **Strings and accessibility:** all new strings go into `i18n/en.ledger.ts`. Screen readers hear amounts as "KES 1,250", and the reason Save is disabled is announced.
9. **Playwright `e2e/ledger.spec.ts`** against the build, offline after unlock. Use the unlocked-account fixture from A4 (`e2e/fixtures/unlocked.ts`). If A4 didn't export one, add it in this PR and note it.

### Acceptance criteria

- [ ] The e2e test enters the DOMAIN.md worked example through the UI. The day-summary query then shows Sales KES 350, COGS 90, Expenses 50, Faida Halisi 210, cash 150 and M-Pesa 200. (AC-03 UI part; the Muhtasari display is checked in P4-2.)
- [ ] e2e: Wanjiku buys 300 and pays 100 → `/deni` shows 200; a payment of 150 → 50; void the payment → 200, with the payment row struck through and labelled "Voided" (AC-04).
- [ ] e2e: opening stock of 10 tray mayai (seeded through the fixture), sell 3 → `/bidhaa` shows 7. Sell 8 more → a `NEGATIVE_STOCK` warning shows and the sale saves on the first tap (AC-06).
- [ ] e2e: paid < total with no customer → Save is disabled and "Choose who owes this" shows. No path, including "Save anyway", saves it (AC-07 UI part).
- [ ] e2e with a profile seeded `rules.negativeStock = 'block'`: overselling opens "Save anyway", saving needs that second tap, and the stored txn has `overrides: ['NEGATIVE_STOCK']` (AC-08).
- [ ] e2e, cold offline: `/deni/customer?id=<seeded id>` opens directly with the network off and shows that customer's real ledger, not just the placeholder (AC-09, ledger routes).
- [ ] e2e: a sale mixing a service line and a goods line saves. Only the goods item's stock moves.
- [ ] e2e: an item without `allowsFractional` rejects 1.5. A fractional item accepts 2.5 through the half-step button.
- [ ] e2e: an overpayment shows the credit message and the ledger balance goes negative.
- [ ] e2e: a voided sale shows no Void button, and neither does a void row.
- [ ] Every page in this phase shows its Kiswahili title with the English beneath it (AC-21 for these titles). Every interactive element is at least 48×48 px at 360 px.
- [ ] Offline: after 2 sales, 1 expense and 1 payment, the chip reads `Not backed up (n)` with n = the number of records, not lines (AC-16 recording part; counting is B2's `useUnsyncedCount`).
- [ ] No arithmetic on money in `app/` or `ui/`: a grep for `Math.round`, `.reduce(` and `toCents` outside `MoneyInput` returns nothing on money values, and the reviewer confirms it. No hand-written `useMemo`, `useCallback` or `memo`.
- [ ] The PR body records how long new sale took to open and save on a throttled 360 px Chrome profile (4× CPU). The real 3 GB phone timing is done in P4-8 (AC-20).
- [ ] lint, typecheck, test and build pass. `pnpm build && pnpm exec playwright test e2e/ledger.spec.ts` output is pasted in the PR.

### Blocked by

- Task 1 (the contract can be stubbed from the open PR; merge after Task 1)
- A2 shell (#17) and A2 PWA offline (#18)
- A4 (PIN lock; unlocked-account e2e fixture)
- B2 (commit service and the base queries)

## Cuts (blueprint order; only those touching this phase)

The scrum-architect applies these at the Sun 18:00 checkpoint, strictly in order.

- **Cut 3: drop the `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE` rules.** The rules come off the grill (B1) and stop showing in the preview. Task 2 then drops nothing: `IssueList` is generic. In Task 1, the table-driven preview test and the AC-33 fixture (P4-5, the 280 mayai sale) lose their `PRICE_VARIANCE` expectation. Waives no AC.
- **Cut 4: drop the Gharama list screen** (`/gharama`). The new-expense form stays, and today's expenses still show on Muhtasari and Leo. Expense void is then reachable only from Leo (P4-3). Waives no AC.

**Never cut** (this phase carries several of these): offline save; **correct Faida Halisi and deni** (Task 1 maths, the AC-03/AC-04 checks); **void** (Task 2 void on sales, payments and opening balances); **bilingual titles**.

## Open questions (owner or product-owner to answer before the named task starts)

- **OQ-3.1 (Task 1, Task 2):** What is the "overdue total" in the Deni header? Is it (a) the sum of the remaining amounts of open deni items whose due date has passed, or (b) the full balance of every customer who has anything overdue? The spec only says "overdue total". The answer changes the number shown in Tomato.
- **OQ-3.2 (Task 1, Task 2):** For a backdated expense, what time of day is stored (this decides where it sorts in Leo on that day)? Can the date be in the future? How far back can it go?
- **OQ-3.3 (Task 2):** With "All on deni" (paid 0), are the payment method chips hidden, and is `paymentMethod` stored as `null`? The spec marks this as an ASSUMPTION; `null` must also pass the frozen B1 schema.
- **OQ-3.4 (Task 2):** Which payment method is preselected? The profile stores a list of methods, not a "usual" one. The spec narrative preselects Cash. Is it the first in the profile list, always cash, or the last one used?
- **OQ-3.5 (Task 2):** If the merchant creates a customer with exactly the same name as an existing one, does the app allow it, warn, or refuse?
- **OQ-3.6 (Task 2):** Can "Pick date" choose a due date in the past?
- **OQ-3.7 (spec inconsistency):** Step 7 of the spec's "full day" sells mayai at KES 300 against 420 and expects a price warning. But 120/420 is 28.6%, which is under the 30% threshold, so `PRICE_VARIANCE` doesn't fire. The AC-33 fixture in P4-5 uses KES 280 (33% away). Confirm, or change the threshold instead.

## Proposed edits elsewhere (not made in this PR)

- Blueprint B3: add the Task 1 contract (`local/save.ts`, the query additions, the domain additions) and mark its model tier **strongest**.
- `acceptance.md`: no change needed for Phase 3.
- `QUESTIONS.md`: add OQ-3.1 to OQ-3.7 as Q-0xx entries.
- Phase 3 spec: fix the step-7 price (300 → 280) once OQ-3.7 is answered.
