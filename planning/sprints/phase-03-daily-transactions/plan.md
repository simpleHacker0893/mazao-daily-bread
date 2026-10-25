# Phase 3 implementation plan (tickets P3-1, P3-2a and P3-2)

Spec: `planning/sprints/phase-03-daily-transactions/spec.md` (GitHub #4). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` step **B3** (Ledger screens), building on **B1** (domain core) and **B2** (local data and commit service).
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Issue numbers are assigned when the scrum-architect creates the tickets after the owner OKs this plan.

**Why B3 is three tasks.**
- B3 needs two specialists in different files. The `backend` agent adds the read models and the save adapter the screens call (`domain/*`, `local/*`). The `frontend` agent builds the primitives and screens (`ui/*`, `app/(app)/*`). The B1/B2 briefs don't cover a running balance, the deni list order and totals, the draft-sale totals, the payment preview and quick amounts, customer search, the live grill preview or a `SaveOutcome` result. Without a `backend` task for these, the screens would end up calculating money, which AGENTS.md forbids. The hand-off contract is in Task 1.
- The frontend part is split again. The `ui/` primitives and the `ui/ledger` pickers (Task 2a) merge early, because Phase 2's onboarding and notebook tickets (P2-2, P2-3) are blocked on them. If they were bundled with the screens, Phase 2 couldn't start until Sun 18:00, and Dev B would be double-booked from 18:00 to 23:00 (Phase 2 and Phase 4 in the same window).
- All three tasks stay in Dev B's lane (R-011). The blueprint doesn't split B3 by lane.

| Task | Ticket | Step | Lane | When (EAT) | Agent | Model | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P3-1 | B3 (read models + save adapter) | Dev B | Sun 12:00–13:00 | backend | **strongest** | B1, B2 |
| 2a | P3-2a | B3.1 (primitives + ledger pickers) | Dev B | Sun 12:00–14:00 (codes against the Task 1 contract stub; merges right after Task 1) | frontend | default | Task 1 (merge only), A2 shell (#17), B2 |
| 2 | P3-2 | B3 (screens) | Dev B | Sun 14:00–18:00 | frontend | default | Task 1, Task 2a, A2 (#17, #18), B2; merge after A4 |

### Dev B schedule, Sun 12:00 → Mon 01:00 (Phases 2–4)

This replaces the blueprint's "B3 Sun 12:00–18:00, B4 Sun 18:00–23:00" for Dev B, which put Phase 2 (B4.2/B4.3) and Phase 4 (B4.1/B4.4) in the same five hours. The Phase 2 ticket names are from the Phase 2 plan (PR #24).

| When (EAT) | Dev B work | Notes |
|---|---|---|
| Sun 12:00–13:00 | P3-1; P2-1 (Phase 2 onboarding data, blocked by B2 only) | two `backend` sessions, disjoint files (`domain/ledger.ts`, `local/save.ts` vs the onboarding modules) |
| Sun 12:00–14:00 | P3-2a | merges right after P3-1 |
| Sun 14:00–18:00 | P3-2 ‖ P2-2 (stepper) ‖ P2-3 (notebook) | three `frontend` sessions, disjoint files; i18n keys in separate prefixes |
| **Sun 18:00** | checkpoint | apply the blueprint cuts in order if P3-2, P2-2 or P2-3 isn't merged |
| Sun 18:00–19:30 | P4-1; P2-4 (Phase 2 e2e, `qa`) | |
| Sun 19:30–21:30 | P4-2 ‖ P4-3 | disjoint files |
| Sun 21:30–23:00 | buffer: review fixes, re-runs | |
| Sun 23:00 → Mon 01:00 | P4-5 (AC-33) | |

**Schedule risk (R-001).** The plan only fits because Dev B runs up to three agent sessions at once from 14:00 to 18:00 and reviews all of them. Dev B's review time is now the bottleneck. If two of the three 14:00 tickets are not merged by the Sun 18:00 checkpoint, the scrum-architect applies the cuts in order (Cut 2 shrinks P2-2 first). Proposed RISKS.md edit: add this concurrency note to R-001.

## Global Constraints

- Package manager **pnpm only**. Latest Next.js App Router, **no `src/`**, React Compiler on; no hand-written `useMemo`/`useCallback`/`memo`; render stays pure. Build is `next build --webpack` (D-042). Biome only.
- TypeScript strict + `noUncheckedIndexedAccess`.
- **Offline first.** Every page in this phase is a client page that reads only from Dexie, with no server data fetching and no dynamic segments. Parameters go in the query string, read with `useSearchParams` inside `Suspense`, for example `/debts/customer?id=<uuid>` (D-041). These tasks never touch `/api/*` or the server.
- **One save path.** Pages write only through `local/save.ts` (Task 1), which wraps `local/commit.ts` (B2). No page or component touches Dexie tables directly.
- **Pure numbers.** Every money figure on screen comes from a `domain` function, through a `local/queries.ts` hook or `local/save.ts`. Components and hooks never add, subtract, multiply, negate or round money. That includes line totals, the sale total, the deni remainder, the running balance, the new-balance preview, the payment quick amounts, a credit amount and the deni list totals.
- **Money:** integer cents in `domain` and the client (D-013). `lineTotal = Math.round(qty * unitPrice)`. `MoneyInput` takes whole shillings and returns cents.
- **Ledger:** confirmed records are immutable. A correction is a `void` plus a new record (D-018). Balances and stock are derived and never stored (D-019).
- **Grill:** hard errors (`SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, `DENI_NEEDS_CUSTOMER`) can never be overridden (D-038). Warn-level issues save on the first tap. Block-level issues need a second "Save anyway" tap, and their codes are stored in `txn.overrides` (D-027).
- **Frozen contracts:** `domain/types.ts` and `domain/schemas.ts` are frozen after B1. New types go in the module that owns them (`domain/ledger.ts`, `local/save.ts`, …), not in `types.ts`. Changing a frozen file needs both devs to agree in the PR (R-011).
- **File ownership (R-011):** all three tasks are Dev B's lane: `domain/*`, `local/*` (except the A1a contract stubs `local/device-db.ts` and `local/routing.ts`), `ui/*`, `ui/ledger/*`, every `app/(app)/*` page except `layout.tsx` and `mipangilio`, and the **ledger half of the `en` and `sw` dictionaries**. Don't edit `app/(app)/layout.tsx`, `ui/shell/*`, `app/sw.ts`, the shell half of either dictionary, or the shared i18n files that merge the halves and define `t()`.
- **Language (D-049, Owner 2026-10-24; supersedes the naming parts of D-004 and D-040).** D-049 is recorded on the unmerged `feat/a1a-skeleton` branch; this plan assumes it merges with A1a.
  - The UI is **English by default**. Kiswahili is a switch the merchant sets in Mipangilio (P4-4). There are no bilingual "Kiswahili over English" titles or labels.
  - Every string, including page titles and nav labels, is a message key read through `t(key, locale)`. Each new key goes into **both** the `en` and the `sw` ledger halves. The `sw` half is typed against the `en` keys, so a missing translation fails typecheck.
  - The exact file layout follows the A1a contract once merged. On `feat/a1a-skeleton` the ledger halves are `i18n/en.ledger.ts` and `i18n/sw.ledger.ts`, and every key in them must start with `ledger.`. To avoid merge conflicts between parallel tickets, P3-2a adds keys only under `ledger.ui.*`, and P3-2 under `ledger.sale.*`, `ledger.expense.*`, `ledger.deni.*` and `ledger.items.*`.
  - **Locale contract (cross-plan).** Components get the current locale from `useLocale()` (live read of the device `meta` key `locale`, default `'en'`), and P4-4 writes it with `setLocale()`. A1a/A2 (Dev A) should export both. If A2 merges without them, P3-2a adds them next to the A1a i18n contract, with both devs agreeing in the PR, and P4-4 only adds the control.
  - English page titles (the English halves of the D-040 pairs): Sales, New sale, Expenses, New expense, Customer debt, Items. The Kiswahili values in the `sw` half: Mauzo, Mauzo Mapya, Gharama, Gharama Mpya, Deni la Wateja, Bidhaa (Q-006 native-speaker check pending).
  - Market words (deni, Faida Halisi, ushuru, kilo, gunia, tray…) stay untranslated in both locales (D-005). Whether an English title such as "Customer debt" should read "Customer deni" is open (**OQ-3.12**).
- **Design tokens** (from `docs/design/stitch-prompts.md`): Chalk background, Surface rows, Ink text, Manrope with tabular figures on every amount, "KES 1,250" format. Sukuma Green is used only for the primary action, the active nav and focus. Maize marks deni; Tomato marks only overdue, errors and destructive actions. 8 px radius, 48 px tap targets, no gradients, no em-dashes, no emoji. Work screens carry no photographs, except one optimised empty-state image (≤ 150 KB, D-045).
- **Phone:** a 3 GB Android phone running Chrome, 360 px wide. New sale opens in < 2 s after unlock, and a save shows in the list in < 1 s (AC-20).
- **Privacy:** never log record contents, customer names, phone numbers or M-Pesa codes.
- **Test-first** (red → green → refactor) for everything in `domain` and `local`. Playwright runs only against `pnpm build && pnpm start`, never `dev`.
- A PR is ready only when `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass and the ticket's checks have been run. Branch as named in the ticket. The PR title is `<step-id>: <summary>`, and the body lists `Closes #<ticket>` and the AC IDs and pastes the verification output.
- **Stop and ask** (product-owner) if this plan or the spec is silent on anything a merchant would see. The open questions are listed at the end. Where this plan sets an interim behaviour, it is marked **ASSUMPTION** with its OQ; build exactly the interim and nothing more.

## Task 1: P3-1 (B3): Ledger read models and save adapter

### Parent

#4 (Phase 3: Recording daily transactions). Blueprint step **B3** (data part), branch `feat/b3-ledger-read-models`. Agent `backend`, **strongest model** (new money maths). Dev B lane.

### What to build

Every number on the ledger screens is right because tested domain functions produce it, not the page. When a merchant types a sale, she sees the line totals, the sale total and the "Deni KES 320" remainder. When she opens Deni, the list is in the right order with the right totals. A customer's ledger shows a running balance that ends at the balance on the deni list. Paying more than is owed shows how much becomes credit. A save either succeeds, explains why it can't save, or asks for "Save anyway", and it can't fail silently.

- **Domain additions** (pure, in the existing B1 modules; `types.ts` and `schemas.ts` unchanged):
  - `domain/money.ts`: `saleDraftTotals(lines, amountPaid)` returns `{ lineTotals: Cents[], total: Cents, deni: Cents }`, using `lineTotal`. `deni` is `max(0, total − amountPaid)`.
  - `domain/ledger.ts`:
    - `paymentPreview(balance, amount)` returns `{ newBalance, creditCreated }`. `creditCreated` is `max(0, amount − max(0, balance))`.
    - `paymentQuickAmounts(balance)` returns `{ all: Cents | null, rounds: Cents[] }` for the Record payment chips. `all` is the balance when it is above 0, otherwise `null`. **ASSUMPTION (OQ-3.8):** `rounds` are the multiples of KES 100 strictly below the balance, largest first, at most 3 (balance 32000 → 30000, 20000, 10000; balance 5000 → none).
    - `customerStanding(balance)` returns `{ kind: 'owes' | 'clear' | 'credit'; amount: Cents }` with `amount ≥ 0` (a balance of −10000 gives `{ kind: 'credit', amount: 10000 }`). The customer ledger here and Leo's "Customers today" (P4-1) both use it, so no component ever negates a balance.
    - `deniList(customers, txns, today)` returns `{ totalOutstanding, overdueTotal, rows }`, where each row is `{ customerId, name, balance, earliestDue: string | null, overdue: boolean }`. Rows include only customers with a balance > 0, sorted overdue first and then by balance, highest first. The earliest due date comes from `openDeni`; `overdue` comes from `isOverdue`. `overdueTotal` follows the answer to **OQ-3.1**.
    - `customerLedgerRows(customerId, txns)` returns `{ txnId, at, type, amount, delta, runningBalance, voided, broughtForward, paymentMethod, externalReference }[]`, newest first. **ASSUMPTION (OQ-3.9):** voided originals and their voids are both listed, but contribute `delta = 0`, so the running balance never shows the mistake and the last running balance always equals `customerBalance`.
  - `domain/dates.ts`: `formatNairobiTime(iso)` returns `HH:mm` in EAT, and `nairobiDateFromDay(day)` gives the `occurredAt` for a backdated expense, following the answer to **OQ-3.2**.
- **One grill context.** Export one `buildGrillContext(db, draft)` from `local/` (extracted from `local/commit.ts` if B2 inlined it). `commit.ts` and `useGrillPreview` both call it, so the preview and the save can never disagree. There must be no second copy of the context-building code.
- **Hand-off contract for Tasks 2a and 2**: the `frontend` agent codes against these exports and nothing else:

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

  // local/queries.ts (additions)
  // Live Dexie reads (useLiveQuery):
  useGrillPreview(draft: DraftSale | DraftExpense | DraftPayment | null): { hardErrors: Issue[]; issues: Issue[] } | undefined;
  useDeniList(today: string): ReturnType<typeof deniList> | undefined;           // same Dexie read as B2's useCustomersWithBalance
  useCustomerLedgerRows(customerId: Id): { customer: Customer; balance: Cents; standing: CustomerStanding; overdue: boolean; rows: LedgerRow[] } | undefined;
  usePaymentPreview(customerId: Id, amount: Cents): { newBalance: Cents; creditCreated: Cents; quick: { all: Cents | null; rounds: Cents[] } } | undefined;
  useRecentCustomers(n: number): Customer[] | undefined;   // most recent activity first
  useCustomerSearch(query: string): Customer[] | undefined; // case-insensitive "contains" on name
  useTxnDetail(txnId: Id): { txn: Txn; lines: TxnLine[]; customer?: Customer; canVoid: boolean } | undefined; // any txn type
  // Pure (no Dexie read, no useLiveQuery): a plain hook that only calls saleDraftTotals
  useSaleDraftTotals(lines, amountPaid): { lineTotals: Cents[]; total: Cents; deni: Cents };
  ```
  - `saveSale` takes the draft in the shape `commitSale` already accepts, including a new customer written before the txn in the same Dexie transaction (B2). If `commitSale` needs that shape changed, the change is made here, in this PR. **If the change touches the frozen `domain/schemas.ts`, both devs agree in the PR** (R-011).
  - Each save maps `CommitError` to `hard_error` and `NeedsOverride` to `needs_override`. Any other error (for example a storage quota error) is rethrown, never swallowed.
- **No overlap with B2.** B2 already exports `useCustomersWithBalance()` and `useCustomerLedger(id)`. `useCustomerLedgerRows` replaces or re-exports `useCustomerLedger` (one hook, not two, and the old name is kept only as a re-export if anything calls it). `useDeniList` reuses the read behind `useCustomersWithBalance`. If B2 exports any other contract hook under another name, re-export it under the contract name instead of duplicating it, and say so in the PR body.

### Acceptance criteria

- [ ] `saleDraftTotals`: the worked-example lines give 15000 and 20000, total 35000. With 0.5 kilo × 12000 the line total is 6000. Paid 10000 on a 42000 total gives deni 32000.
- [ ] Through `saveSale`/`saveExpense` and then the day-summary query: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000, cash 15000, M-Pesa 20000 (AC-03 unit part).
- [ ] Deni scenario through `saveSale`/`savePayment`/`saveVoid`: Wanjiku 30000 paid 10000 → 20000; pay 15000 → 5000; void the payment → 20000. `customerLedgerRows` lists the void, the voided payment row has `voided: true`, and the last `runningBalance` equals `customerBalance` at every step (AC-04 unit part).
- [ ] Opening stock of 10 tray, sell 3 → `stockOnHand` 7. Sell 8 more → `saved`, with a `NEGATIVE_STOCK` warn issue in the preview (AC-06 unit part).
- [ ] A sale with deni and no customer returns `hard_error` with `DENI_NEEDS_CUSTOMER`, **including with `override: true`** (AC-07 unit part).
- [ ] With a profile seeded `rules.negativeStock = 'block'`, overselling returns `needs_override`; calling again with `override: true` returns `saved`, and the stored txn has `overrides: ['NEGATIVE_STOCK']` (AC-08 unit part).
- [ ] `deniList` orders an overdue 5000 above a not-yet-due 90000, and a credit with no due date is never overdue.
- [ ] `paymentPreview(30000, 40000)` gives `{ newBalance: -10000, creditCreated: 10000 }`. An overpayment, then a later deni sale, nets against it through `customerBalance`.
- [ ] `paymentQuickAmounts(32000)` gives `{ all: 32000, rounds: [30000, 20000, 10000] }`; `paymentQuickAmounts(0)` and `paymentQuickAmounts(-5000)` give `{ all: null, rounds: [] }`.
- [ ] `customerStanding(5000)`, `customerStanding(0)` and `customerStanding(-10000)` give `owes 5000`, `clear 0` and `credit 10000`.
- [ ] `useGrillPreview` and `saveSale` return the same issue codes for 10 table-driven drafts, and a grep shows `buildGrillContext` is the only place the grill context is built.
- [ ] A void of a sale returns its stock and removes its deni. A second `saveVoid` on the same txn returns `hard_error`. `saveVoid` on an expense and on an opening balance returns `saved`.
- [ ] A service line moves no stock and has `unitCost` 0.
- [ ] `useCustomerSearch('wanj')` finds "Wanjiku". `useRecentCustomers(5)` puts the customer of the latest txn first.
- [ ] `domain` line coverage stays ≥ 90% (AC-02). `pnpm test domain local --coverage` output is pasted in the PR.
- [ ] lint, typecheck, test and build pass. The PR body pastes the contract above as built.

### Blocked by

- B1 (Phase 1 domain core)
- B2 (Phase 1 local data and commit service)

## Task 2a: P3-2a (B3.1): Primitives and ledger pickers

### Parent

#4 (Phase 3). Blueprint step **B3 task 1** (primitives) plus the shared pickers, branch `feat/b3-ui-primitives`. Agent `frontend`, default model. Dev B lane. Visual reference: `docs/design/r0/` (D0, #21) if exported, otherwise the tokens. Don't wait on D0.

### What to build

The building blocks every recording screen uses, merged early so Phase 2 (onboarding and the notebook) and the Phase 3 screens can be built in parallel from Sun 14:00. They are the same everywhere: one money field that only ever produces whole cents, one quantity field that respects half units, one customer picker that never loses a new customer, and due-date chips that pick the merchant's usual due rule.

- **Primitives** in `ui/`, exported from `ui/index.ts`: `Button`, `Chip`, `ChipGroup`, `MoneyInput` (whole shillings → cents), `QtyInput` (half-step button and fractional input only when `allowsFractional`; at most 3 decimals; whole numbers otherwise), `Sheet`, `IssueList` (announced with `aria-live`), `SaveAnywayDialog`. `PageTitle` already exists (A2) and renders the title from its message key in the current locale.
- **Ledger pickers** in `ui/ledger/`, exported from `ui/ledger/index.ts`:
  - `ItemPicker` (Recent from B2's `useRecentItems`, then search, then "Add new item", which returns the new item to the caller) and `AddItemSheet` (kind toggle; for services the unit is limited to trip, job or piece, and the buying price, threshold and half-units switch are hidden; goods have no "current stock" field; calls `addItem`).
  - `CustomerPicker`: recent (`useRecentCustomers`), search as you type (`useCustomerSearch`), and create with name and an optional phone. A new customer is passed back as a draft and written by the save, in the same Dexie transaction as the txn (B2). Duplicate names follow **OQ-3.5**.
  - `DueChips`: Tomorrow, Friday, Next week, End of month, Pick date in English, and Kesho, Ijumaa, Wiki ijayo, Mwisho wa mwezi plus the `sw` "Pick date" value in Kiswahili (all from the dictionaries, not hard-coded). The profile default is preselected through `resolveDueRule`, or none if the profile has no default. Past dates follow **OQ-3.6**.
- **Strings:** keys only under `ledger.ui.*`, in both the `en` and `sw` ledger halves. Every component reads the locale through `useLocale()` (see the locale contract in Global Constraints; add it here if A2 didn't).
- **Phase 2 seam.** P2-2 and P2-3 consume exactly these exports. `RecordPaymentSheet` is not here; it is in Task 2.

### Acceptance criteria

- [ ] Vitest component tests: `MoneyInput` "1,250" → 125000 cents and never emits a fraction of a cent; `QtyInput` on a non-fractional item rejects 1.5, and on a fractional item reaches 2.5 through the half-step button and rejects a fourth decimal.
- [ ] `DueChips` with the clock at Mon 2026-10-26 EAT: Friday resolves to 2026-10-30, Tomorrow to 2026-10-27, and the profile default is preselected.
- [ ] `CustomerPicker`: typing "wanj" lists Wanjiku; "Create" with only a name returns a new-customer draft without writing to Dexie.
- [ ] Every primitive renders its English strings by default and the `sw` strings when the locale is `sw` (one test per component, asserting against the dictionary values, not hard-coded Kiswahili words).
- [ ] Every interactive element is at least 48×48 px at 360 px. No money arithmetic in `ui/` (reviewer). No hand-written `useMemo`, `useCallback` or `memo`.
- [ ] `ui/index.ts` and `ui/ledger/index.ts` export exactly the names above. The PR body lists them for the Phase 2 tickets.
- [ ] lint, typecheck, test and build pass.

### Blocked by

- Task 1 (the contract is stubbed from the open PR; merge after Task 1)
- A2 shell (#17): `PageTitle`, tokens
- B2 (`useRecentItems`, `addItem`)

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

1. **Shared ledger components** in `ui/ledger/` (exported from `ui/ledger/index.ts`):
   - `TxnDetailSheet` (`{ txnId: Id; onClose(): void }`), built on `useTxnDetail`, which covers **any** txn type. For a sale it shows the lines, payment, customer, due date and "Saved with a warning: …" for each override. For an expense it shows the category, method, note and date. For a payment it shows the customer, method and M-Pesa code. For an opening balance it shows the customer and the "Brought forward" tag. A void row shows what it voided. Void appears only when `canVoid`. The confirm text for a sale is "Void this sale? It stays in your records, marked Voided. Stock and deni go back." **ASSUMPTION (OQ-3.11):** for the other types it is "Void this record? It stays in your records, marked Voided." Mauzo, Gharama, the customer ledger and Leo (P4-3) all use this one sheet.
   - `RecordPaymentSheet` (`{ customerId?: Id; onDone(): void }`; with no `customerId` it opens `CustomerPicker` first). Quick chips come from `usePaymentPreview(...).quick`: "All KES n" from `all`, then one chip per value in `rounds`. The new-balance preview comes from `usePaymentPreview`. When the merchant overpays (`creditCreated > 0`), it shows "That's KES n more than <name> owes. It will be kept as credit." with n = `creditCreated`, and still saves. Phase 4 (Muhtasari) also uses this sheet.
2. **Bidhaa / Items** `/items`:
   - Goods first, then services. Goods rows show the unit, the selling and buying price, the stock on hand, and a Maize "Low" tag at or below the threshold. Services show "Service, no stock".
   - "Add item" opens `AddItemSheet` (Task 2a). No editing in R0.
3. **New sale** `/sales/new`:
   - The line editor uses `ItemPicker`. The unit price is prefilled and editable. Line and sale totals come from `useSaleDraftTotals`.
   - Payment method chips (cash, M-Pesa, other) are filtered to the profile's methods; which one is preselected follows **OQ-3.4**. "M-Pesa code (optional)" appears only for M-Pesa. Amount paid defaults to the total, and there's an "All on deni" shortcut (**OQ-3.3**).
   - When paid < total, the deni section shows "Deni KES n" in Maize, with `CustomerPicker` (required) and `DueChips`. Until a customer is chosen, Save stays disabled and "Choose who owes this" shows at the picker.
   - `useGrillPreview` shows issues above Save. A hard error disables Save and shows the reason. Warnings save on the first tap. `needs_override` opens `SaveAnywayDialog`, and "Save anyway" calls `saveSale(draft, { override: true })`.
   - **ASSUMPTION (OQ-3.10):** on `saved`, always go to `/sales`, including when New sale was opened from Muhtasari.
4. **Sales** `/sales`:
   - Today's sales, newest first: time (`formatNairobiTime`), item summary, total, method, a Maize "Deni: <name>" badge, a "Voided" struck-through state, and a small cloud-off icon while unsynced.
   - Tapping a row opens `TxnDetailSheet`.
   - Empty state: "No sales today yet."
5. **New expense** `/expenses/new`: amount, category chips from the profile plus "Add category" (appended to the profile through `saveSettings`), method chips, an optional note, and the date (default today; earlier days per **OQ-3.2**). **Expenses** `/expenses` lists today's expenses; tapping one opens `TxnDetailSheet`, where Void is offered (**Cut 4** may drop this list).
6. **Customer debt** `/debts`:
   - From `useDeniList(today)`: a header with the total outstanding and the overdue total (in Tomato), then rows with name, balance and earliest due date. Each row has a left bar (Tomato when overdue, Maize when not yet due), plus text ("overdue" / "due tomorrow", from the dictionary) so colour is never the only signal, and "Record payment".
   - Empty state: "Nobody owes you money right now."
7. **Customer ledger** `/debts/customer?id=<uuid>`:
   - The balance line from `standing` (`customerStanding`): "Otieno owes you KES 1,200" (in Tomato only when overdue), "Otieno owes nothing now", or, **ASSUMPTION (OQ-3.9)**, "Otieno is in credit KES n" with n = `standing.amount`. Then `useCustomerLedgerRows`, newest first. Each row shows the date and time, what happened (with method and code), a "Brought forward" tag where it applies, voided rows struck through and labelled "Voided", the amount and the running balance.
   - Tapping any row opens `TxnDetailSheet`; Void is offered there on payment and opening-balance rows (and on sale rows when `canVoid`).
   - "Record payment" opens `RecordPaymentSheet` for this customer.
8. **Strings and accessibility:** all new strings go into both the `en` and `sw` ledger halves (keys under `ledger.sale.*`, `ledger.expense.*`, `ledger.deni.*`, `ledger.items.*`); titles come from message keys through `PageTitle`. Screen readers hear amounts as "KES 1,250", and the reason Save is disabled is announced.
9. **Playwright `e2e/ledger.spec.ts`** against the build, offline after unlock. Use the unlocked-account fixture from A4 (`e2e/fixtures/unlocked.ts`). If A4 didn't export one, add it in this PR and note it.

### Acceptance criteria

- [ ] The e2e test enters the DOMAIN.md worked example through the UI. The day-summary query then shows Sales KES 350, COGS 90, Expenses 50, Faida Halisi 210, cash 150 and M-Pesa 200. (AC-03 UI part; the Muhtasari display is checked in P4-2.)
- [ ] e2e: Wanjiku buys 300 and pays 100 → `/debts` shows 200; a payment of 150 → 50; void the payment from her ledger → 200, with the payment row struck through and labelled "Voided" (AC-04).
- [ ] e2e: opening stock of 10 tray mayai (seeded through the fixture), sell 3 → `/items` shows 7. Sell 8 more → a `NEGATIVE_STOCK` warning shows and the sale saves on the first tap (AC-06).
- [ ] e2e: paid < total with no customer → Save is disabled and "Choose who owes this" shows. No path, including "Save anyway", saves it (AC-07 UI part).
- [ ] e2e with a profile seeded `rules.negativeStock = 'block'`: overselling opens "Save anyway", saving needs that second tap, and the stored txn has `overrides: ['NEGATIVE_STOCK']` (AC-08).
- [ ] e2e, cold offline: `/debts/customer?id=<seeded id>` opens directly with the network off and shows that customer's real ledger, not just the placeholder (AC-09, ledger routes).
- [ ] e2e: a sale mixing a service line and a goods line saves. Only the goods item's stock moves.
- [ ] e2e: an item without `allowsFractional` rejects 1.5. A fractional item accepts 2.5 through the half-step button.
- [ ] e2e: with Otieno owing 320, Record payment shows the chips "All KES 320", 300, 200 and 100. Paying 400 shows "That's KES 80 more than Otieno owes. It will be kept as credit.", and the ledger balance line then reads in credit 80.
- [ ] e2e: an ushuru expense of 50 voided from `/expenses` through `TxnDetailSheet` is struck through and the day's Expenses drop by 50.
- [ ] e2e: a voided sale shows no Void button in `TxnDetailSheet`, and neither does a void row.
- [ ] e2e: every page in this phase shows its English title by default (Sales, New sale, Expenses, New expense, Customer debt, Items). After the locale is set to `sw` (seeded `meta.locale = 'sw'` until P4-4 ships the control), the same pages show their `sw` dictionary titles and nav labels with no reload. Market words (deni, ushuru, kilo, tray) are identical in both (AC-21 for these pages, as proposed to be reworded).
- [ ] Every interactive element is at least 48×48 px at 360 px.
- [ ] Offline: after 2 sales, 1 expense and 1 payment, the chip reads `Not backed up (n)` with n = the number of records, not lines (AC-16 recording part; counting is B2's `useUnsyncedCount`).
- [ ] No money arithmetic in `app/` or `ui/`. A grep for `Math.round`, `.reduce(`, unary minus on balances and `toCents` outside `MoneyInput` is pasted as a smoke check only: it can't catch `+` or `-` on cents, so **the reviewer's sign-off that no component or hook does money arithmetic is the real gate**. No hand-written `useMemo`, `useCallback` or `memo`.
- [ ] The PR body records how long new sale took to open and save on a throttled 360 px Chrome profile (4× CPU). The real 3 GB phone timing is done in P4-8 (AC-20).
- [ ] lint, typecheck, test and build pass. `pnpm build && pnpm exec playwright test e2e/ledger.spec.ts` output is pasted in the PR.

### Blocked by

- Task 1 (the contract can be stubbed from the open PR; merge after Task 1)
- Task 2a (primitives and pickers)
- A2 shell (#17) and A2 PWA offline (#18)
- B2 (commit service and the base queries)
- **Not start-blocked by A4.** The e2e needs A4's unlocked-account fixture, so the PR **merges after A4** (or adds the fixture itself, as in item 9).

## Cuts (blueprint order; only those touching this phase)

The scrum-architect applies these at the Sun 18:00 checkpoint, strictly in order.

- **Cut 3: drop the `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE` rules.** The rules come off the grill (B1) and stop showing in the preview. Task 2 then drops nothing: `IssueList` is generic. In Task 1, the table-driven preview test and the AC-33 fixture (P4-5: the step-2b duplicate and the 280 mayai sale) lose their `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE` expectations. Waives no AC.
- **Cut 4: drop the Gharama list screen** (`/expenses`). The new-expense form stays, and today's expenses still show on Muhtasari and Leo. Expense void is then reachable only by tapping the expense in Leo (P4-3, through `TxnDetailSheet`). **Cut 4 is valid only once P4-3 has merged with that tap working**, because void is never cut. Waives no AC.

**Never cut** (this phase carries several of these): offline save; **correct Faida Halisi and deni** (Task 1 maths, the AC-03/AC-04 checks); **void** (`TxnDetailSheet` on sales, expenses, payments and opening balances). The blueprint's "bilingual titles" item is superseded by D-049. **Proposed replacement, needs owner confirmation:** "all copy through `t()` in both `en` and `sw`, English by default".

## Open questions (owner or product-owner to answer before the named task starts)

- **OQ-3.1 (Task 1, Task 2):** What is the "overdue total" in the Deni header? Is it (a) the sum of the remaining amounts of open deni items whose due date has passed, or (b) the full balance of every customer who has anything overdue? The spec only says "overdue total". The answer changes the number shown in Tomato.
- **OQ-3.2 (Task 1, Task 2):** For a backdated expense, what time of day is stored (this decides where it sorts in Leo on that day)? Can the date be in the future? How far back can it go?
- **OQ-3.3 (Task 2):** With "All on deni" (paid 0), are the payment method chips hidden, and is `paymentMethod` stored as `null`? The spec marks this as an ASSUMPTION; `null` must also pass the frozen B1 schema.
- **OQ-3.4 (Task 2):** Which payment method is preselected? The profile stores a list of methods, not a "usual" one. The spec narrative preselects Cash. Is it the first in the profile list, always cash, or the last one used?
- **OQ-3.5 (Task 2a):** If the merchant creates a customer with exactly the same name as an existing one, does the app allow it, warn, or refuse?
- **OQ-3.6 (Task 2a):** Can "Pick date" choose a due date in the past?
- **OQ-3.7 (spec inconsistency):** Step 7 of the spec's "full day" sells mayai at KES 300 against 420 and expects a price warning. But 120/420 is 28.6%, which is under the 30% threshold, so `PRICE_VARIANCE` doesn't fire. The AC-33 fixture in P4-5 uses KES 280 (33% away). Confirm, or change the threshold instead.
- **OQ-3.8 (Task 1, Task 2):** The spec says the payment chips are "All KES n" plus "round amounts below it", without defining them. Interim (ASSUMPTION): up to 3 multiples of KES 100 strictly below the balance, largest first. Is that right, or should the steps scale with the balance (for example multiples of 500 above KES 2,000)?
- **OQ-3.9 (Task 1, Task 2):** In the customer ledger, a voided record and its void both show, struck through, with a running-balance change of 0 (ASSUMPTION), so the balance never shows the mistake. The alternative is to show the original adding and the void subtracting. Which matches how merchants read their notebook? Also: the credit wording on the balance line, "Otieno is in credit KES n" (ASSUMPTION, borrowed from Leo's "in credit KES n").
- **OQ-3.10 (Task 2):** After saving a sale, where does the merchant land? Interim (ASSUMPTION): always `/sales`, even when she started New sale from Muhtasari. Alternatives: back to where she came from, or stay on a fresh New sale form for the next customer.
- **OQ-3.11 (Task 2):** Void confirm wording for expenses, payments and opening balances. The spec gives only the sale wording. Interim (ASSUMPTION): "Void this record? It stays in your records, marked Voided."
- **OQ-3.12 (all tasks; D-049 reconciliation):** D-049 as written on `feat/a1a-skeleton` leaves open whether market words stay untranslated in the English UI, with an interim of plain English (Debts, Net profit). The owner's instruction for these plans keeps D-005 (market words untranslated in both locales). Which wins, and does it apply to titles ("Customer debt" vs "Customer deni") and to the due chips (Kesho, Ijumaa)? Until answered, this plan follows D-005 for body market words and uses the D-040 English titles.
- **OQ-3.13 (all tasks; with Q-006):** Must the `sw` dictionary be complete, real Kiswahili for the pilot, or may some `sw` values temporarily repeat the English? Who writes the Kiswahili copy, and who validates it (Q-006 native-speaker check)? Typecheck forces every key to exist in `sw`, but not that the value is Kiswahili.

## Proposed edits elsewhere (not made in this PR)

- **Blueprint B3:** add the Task 1 contract (`local/save.ts`, the query additions, `buildGrillContext`, the domain additions including `paymentQuickAmounts` and `customerStanding`) and mark its model tier **strongest**. Split B3 task 1 (primitives and pickers) into its own early-merging step (P3-2a), and add `TxnDetailSheet`.
- **Blueprint schedule:** replace Dev B's "B3 Sun 12:00–18:00, B4 Sun 18:00–23:00" with the Dev B schedule above (Phase 2 moves to Sun 14:00–18:00, beside P3-2).
- **Blueprint Cuts:** Cut 4 is valid only once Leo's expense tap (P4-3) has merged. Replace "bilingual titles" in Never cut with the D-049 wording (owner to confirm).
- **`acceptance.md` AC-21:** reword for D-049 (see the Phase 4 plan's proposed edits).
- **`QUESTIONS.md`:** add OQ-3.1 to OQ-3.13 as Q-0xx entries.
- **`RISKS.md` R-001:** add the Dev B concurrency and review-bottleneck note.
- Phase 3 spec: fix the step-7 price (300 → 280) once OQ-3.7 is answered; replace the bilingual title and chip wording with D-049.
