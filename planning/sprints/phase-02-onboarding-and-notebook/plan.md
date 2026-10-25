# Phase 2 implementation plan (tickets to be created)

Spec: `planning/sprints/phase-02-onboarding-and-notebook/spec.md` (GitHub #3). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` step **B4**, tasks **2 (onboarding), 3 (notebook) and 5 (`nextRouteAfterPin`)**. The spec header says "B4 tasks 2, 3 and 4"; task 4 is now the Leo report (Phase 4) and routing is task 5, as `planning/ROADMAP.md` already says. **D-049** (English by default, Kiswahili as a switch; merged to `main` with #25) supersedes the spec's bilingual titles, tabs and chip captions.
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Phase 0 tickets are #15–#22; Phase 1 and Phase 3 tickets are referred to by their plan task names until issue numbers exist.

B4 is one blueprint step, but its Phase 2 part needs a backend specialist (`domain/`, `local/`) and a frontend specialist (pages, `ui/`) in different files, so it is split. Tasks 2 and 3 are separate frontend tickets because the stepper and the notebook share no files and can run in parallel once Task 1 lands. Task 4 is the step's Verify (the B4 e2e), owned by qa so that Tasks 2 and 3 stay parallel.

**Revision 2 (review of PR #24):** applies D-049; aligns the save path with PR #23 (`local/save.ts` and `SaveOutcome`, M6); makes a new customer and its opening balance one atomic save (M6); makes the onboarding finish one atomic commit (minor 15); seeds a profile in the shared e2e fixture (M9); stores the resume step by id (minor 13); moves Task 1 to the strongest model (minor 14); and points Tasks 2 and 3 at the Phase 3 primitives + pickers ticket, which PR #23's revision splits out of P3-2 so Phase 2 can start earlier.

## Task overview

| Task | Ticket | Step | Lane | Agent | Model | Branch | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P2-1 | B4.5 + onboarding data | Dev B | backend | **strongest** | `feat/b4-onboarding-data` | Phase 1 Task 4 (B2) to start; Phase 1 Task 5 (A4) to merge (e2e fixture) |
| 2 | P2-2 | B4.2 | Dev B | frontend | default | `feat/b4-onboarding-stepper` | Task 1, P3-2a (the Phase 3 primitives + pickers ticket), #20 (soft) |
| 3 | P2-3 | B4.3 | Dev B | frontend | default | `feat/b4-notebook` | Task 1, P3-2a (the Phase 3 primitives + pickers ticket) |
| 4 | P2-4 | B4 Verify | Dev B | qa | default | `feat/b4-onboarding-e2e` | Task 2, Task 3, Phase 1 Task 5 (A4), Phase 3 screens ticket (P3-2: Bidhaa, Deni, new sale), **#20 (hard, AC-31)** |

"The Phase 3 primitives + pickers ticket" is **P3-2a** in PR #23's revision, the early-merging ticket split out of P3-2: the `ui/` primitives (`Button`, `Chip`, `ChipGroup`, `MoneyInput`, `QtyInput`, `Sheet`, `IssueList`, `SaveAnywayDialog`) and the `ui/ledger` pickers (`ItemPicker`, `AddItemSheet`, `CustomerPicker`, `DueChips`). Tasks 2 and 3 do **not** wait for the rest of P3-2 (the ledger screens). Only Task 4 waits for P3-2, because its e2e asserts on `/items` and `/debts` and records one sale.

**#20 is a soft blocker for screen tickets** in Phases 1 and 2 (use the background component if merged, otherwise the solid scrim colour). It is a hard blocker only for Task 4, which checks the real onboarding imagery (AC-31).

## Global Constraints

- Everything in the Phase 0 and Phase 1 plans' Global Constraints applies (pnpm; latest Next.js, no `src/`, React Compiler, no hand memoisation; webpack build; Biome; strict TS; client pages read only Dexie; every string via `t(key, locale)`; tokens; 48 px targets; privacy; test-first for `domain` and `local`).
- **Language (D-049).** English by default; Kiswahili when the device locale is `sw` (`deviceDb.meta['locale']`, Phase 1 plan Global Constraints and OQ P1-Q13). No bilingual titles, tab labels or chip captions. Every title, tab, chip and helper line is a message key with an `en` and a `sw` value in the **ledger** halves of the dictionary (`i18n/en.ledger.ts` / `i18n/sw.ledger.ts`, per the A1a i18n contract on `main`). To avoid conflicts between parallel Tasks 2 and 3, Task 2 adds keys only under `ledger.onboarding.*` and `ledger.profile.*`, Task 3 only under `ledger.notebook.*`. Market words stay untranslated in both locales (D-005 and the revision brief; this differs from D-049's merged interim of plain English in `en`, OQ P1-Q13c). Kiswahili values come from `docs/design/stitch-prompts.md` where they exist (Tuanze, Wasifu wa Biashara, Leta Daftari Lako, Wanaonidai, Ninaowadai, Stoki); everything else uses the English text in the `sw` value and is listed in the PR for the native-speaker check (Q-006, OQ P1-Q14). No language switch is built in Phase 2 (it lives in Settings, P4-4; OQ P2-Q12).
- **One save path (aligned with PR #23).** Pages write only through `local/save.ts`, which wraps `local/commit.ts` and returns a `SaveOutcome` (`saved` / `hard_error` / `needs_override`). Phase 2 adds `saveOpening`, `saveStockAdjustment` and `saveOnboardingFinish` there (Task 1). Grill issues show through the Phase 3 `IssueList` and `SaveAnywayDialog`. The onboarding **progress draft** is the only exception: it lives in the business database's `onboarding` table, is written only by `local/onboarding-progress.ts`, and never syncs (spec "Onboarding progress store").
- **Pickers return drafts; saves create parties.** `CustomerPicker` (Phase 3) and `SupplierPicker` (Task 3) never write to Dexie. They return either an existing id or a new party (`{ name, phone? }`), and the save function creates the new party and the record in one Dexie transaction (`DraftOpening.newCustomer` / `newSupplier`, Phase 1 Task 1). This matches PR #23's `saveSale` with a new customer; the exact `CustomerPicker` contract is a proposed edit to PR #23 (see the PR body).
- **Pure numbers:** the "Brought forward: KES …" totals, the per-item stock already brought forward, and every applicability rule come from `domain` functions; components never add money or quantities.
- **Brought forward is never income (D-011, D-014):** opening customer and supplier deni are `opening_balance` (`totalAmount = amount`, `amountPaid = 0`, exactly one party, `source: 'onboarding'`); opening stock is a `stock_adjustment` (`totalAmount = 0`, positive line quantity, unit cost = item buying price). None changes Sales, COGS, Expenses or Faida Halisi.
- **Imagery (D-045, Owner 2026-10-24):** the onboarding stepper uses the `onboarding-background` images from the #19 manifest through the #20 background component (solid scrim, content on solid Surface panels, decorative, precached, fallback to the scrim colour). Review and notebook are work screens on Chalk: imagery only in the header band or the notebook empty state.
- **Visual reference:** the D0 exports in `docs/design/r0/` (#21) where they exist, else the tokens and screen prompts in `docs/design/stitch-prompts.md` (Tuanze 3.4, Wasifu wa Biashara, Leta Daftari Lako 3.6). The spec's reconciliations win over the Stitch mocks: the progress bar counts applicable questions (not "of 10"); "Yes, often" and "Sometimes" both mean `deniEnabled = true`; the notebook button is "Done", not "Save notebook". Where a mock shows a Kiswahili title with English beneath, build the single-language title of D-049.
- **No product decisions in the build:** behaviour the spec does not state is listed under Open questions below; until answered, Builders implement the interim shown there and nothing else.
- Branch names as in the table; PR title `B4: <summary>` with the ticket id in the body; PR body lists `Closes #<ticket>`, the AC IDs and pasted verification output.

## Superseded spec text

- Stories 43 and 44, "Imagery and visual rules" ("Bilingual titles on every screen via the PageTitle primitive"), and the notebook tab captions: replaced by D-049 as above. English titles: "Let's get started", "Business profile", "Bring in your notebook"; tabs "Customers who owe me", "Suppliers I owe", "Stock I have"; Kiswahili titles and tabs when the locale is `sw`.
- AC-21's onboarding titles: checked as "English title by default; Kiswahili when the locale is `sw`".
- The spec's `OnboardingProgress.stepIndex`: stored as `stepId` (Task 1), so a resume lands on the same question even when the list of applicable questions changes.
- "Set up Mazao calls, in order: `saveSettings`, then `addItem` once per draft item, then `markCompleted()`": now one atomic `saveOnboardingFinish` (Task 1).

---

## Task 1: P2-1 (B4.5 + data): Onboarding progress, profile builder, notebook saves and first-run routing

### Parent

#3 (Phase 2: Onboarding & bring-in-your-notebook). Blueprint step **B4 task 5** plus the data modules behind B4 tasks 2 and 3. Branch `feat/b4-onboarding-data`. Agent: backend. Model: **strongest** (new money maths in `broughtForwardTotals`, consistent with PR #23's P3-1). Lane: Dev B.

### What to build

A merchant who closes Mazao in the middle of onboarding, or whose battery dies, comes back to the same question with every earlier answer intact. A merchant who skips is never trapped and starts with sensible defaults, a merchant whose profile came back with a restore is never asked again, and re-running onboarding never creates a second "Sukuma wiki". Finishing onboarding either saves the whole profile and all items or nothing. This ticket builds that behaviour as tested modules the two screen tickets call.

- `domain/onboarding.ts` (pure):
  - `OperatingProfileAnswers` (the RQ-4 fields: business name, business type, location, sells, payment methods, deni enabled, default due rule, expense categories) and `DraftOnboardingItem` (`name, kind, unit, allowsFractional, sellingPrice: Cents, buyingPrice: Cents | null`).
  - `ONBOARDING_STEPS`: the ordered step ids `businessName, businessType, location, sells, items, paymentMethods, deni, dueRule, expenseCategories`, each with its i18n key stem (`ledger.onboarding.<stepId>.*`: question, why-line, chip labels), its answer control (`text | singleChip | multiChip | itemList`) and a validator from the B1 operating-profile schema.
  - `applicableSteps(answers)`: drops `dueRule` unless deni is yes. Buying price and half-units apply only to goods items (validator rule, not a step).
  - `resumeStep(stepId, answers)`: the saved step if it still applies, otherwise the next applicable step after it in `ONBOARDING_STEPS` order (minor 13).
  - `redoAnswers(profile, progress)`: the prefill for `?mode=redo`: draft answers where present, otherwise the saved profile's values (minor 17).
  - `buildProfile(answers): OperatingProfile`: answers over `defaultProfile()`; every rule stays `warn`, price variance 30% (D-026, RQ-11). `buildProfile({})` equals `defaultProfile()` and passes the settings schema (M8).
  - `planItemCreation(drafts, existingItems) → { toCreate, alreadyExists }`: match on case- and whitespace-insensitive name plus kind against active items (spec ASSUMPTION).
  - `broughtForwardTotals(txns)` → `{ customers: Cents, suppliers: Cents }` over **active** `opening_balance` transactions with `source: 'onboarding'`.
  - `broughtForwardStock(txns, lines)` → `Map<itemId, quantity>` over **active** `stock_adjustment` transactions with `source: 'onboarding'` (for "already brought forward" on the stock tab, OQ P2-Q11).
  - `MAX_ONBOARDING_ITEMS = 8`.
- `local/onboarding-progress.ts`: `loadProgress()`, `saveAnswer(stepId, value)` (keeps only values that pass the step validator), `saveDraftItems(items)` (refuses a ninth), `setStep(stepId)`, `markSkipped()`, `markCompleted()`, `reset()`, storing
  ```ts
  type OnboardingProgress = {
    status: 'in_progress' | 'skipped' | 'completed';
    stepId: OnboardingStepId;                  // replaces the spec's stepIndex (minor 13)
    answers: Partial<OperatingProfileAnswers>; // only validated answers are kept
    draftItems: DraftOnboardingItem[];         // at most 8, not yet Bidhaa
    updatedAt: string;                         // toISOString()
  };
  ```
  in the `onboarding` table. Never creates sync-queue entries.
- **Saves, added to `local/save.ts`** (M6; PR #23's P3-1 creates this file with the `SaveOutcome` type, the `CommitError`/`NeedsOverride` → `SaveOutcome` mapping and `saveVoid`). If P3-1 has not merged when this ticket starts, this ticket creates `local/save.ts` with exactly that type, mapping and `saveVoid` as written in PR #23's P3-1 contract, and P3-1 rebases onto it; the reviewer checks the two are identical.
  - `saveOpening(draft: DraftOpening, opts?: { override?: boolean }): Promise<SaveOutcome>` wraps `commitOpening`; a draft with `newCustomer` or `newSupplier` creates the party and the opening balance in one Dexie transaction, party first in the queue.
  - `saveStockAdjustment(draft: DraftStockAdjustment, opts?): Promise<SaveOutcome>` wraps `commitStockAdjustment`; R0 notebook quantities are positive only (zero and negative return `hard_error` `SCHEMA`).
  - `saveOnboardingFinish({ answers, draftItems, status: 'completed' | 'skipped' }): Promise<SaveOutcome>` (minor 15): **one** Dexie transaction over `settings`, `items`, `syncQueue` and `onboarding` that runs `saveSettings(buildProfile(answers))`, then `addItem` for each `planItemCreation(draftItems, currentItems).toCreate` (re-planned inside the transaction), then sets the progress status. With `status: 'skipped'` it creates no items. An interruption leaves either everything or nothing; running it again creates no duplicate items.
  - `upsertSupplier` is re-exported unchanged from `local/commit.ts`, next to P3-1's re-exports.
- `local/routing.ts` `nextRouteAfterPin()` (replaces the A1a stub): no saved operating profile in `settings` → `/onboarding`; otherwise `/`. Pure core `routeAfterPin(hasProfile: boolean)` plus the Dexie read.
- `local/queries.ts` additions: `useOnboardingProgress()`, `useOperatingProfile()`, `useBroughtForward()` returning, per tab, the entries (newest first, with `voided: boolean`), the money totals from `broughtForwardTotals`, and per goods item the quantity from `broughtForwardStock`; `useSupplierSearch(query)` (case-insensitive "contains" on name, like PR #23's `useCustomerSearch`).
- **Shared e2e fixture (M9).** Update `e2e/fixtures/unlocked.ts` (Phase 1 Task 5) so that, by default, it also writes `defaultProfile()` into the business database's `settings`, so `nextRouteAfterPin()` keeps sending every existing e2e test to `/`. Add an option `{ withProfile: false }` for the onboarding tests. Run the whole existing Playwright suite in this PR to prove nothing now lands on `/onboarding`.
- **Hand-off contract to Tasks 2 and 3:** the exports above, posted in the PR description.

### Acceptance criteria

- [ ] Tests first, Vitest with `fake-indexeddb/auto`, driving only the public functions and asserting through queries
- [ ] Each answer survives closing and reopening the database and `loadProgress().stepId` resumes at the saved step (AC-32, data part)
- [ ] `resumeStep('dueRule', { deniEnabled: false })` returns `expenseCategories`
- [ ] `applicableSteps` with deni = no has no `dueRule` step; with deni = yes it has one
- [ ] `buildProfile` with only business name and type gives those values and `defaultProfile()` values for the rest, with every rule `warn` and threshold 30
- [ ] `buildProfile({})` passes the schema `saveSettings` uses, and `saveSettings(buildProfile({}))` saves (M8)
- [ ] `redoAnswers`: with a saved profile (name "Mama Njeri Mboga") and no draft, the business-name answer is "Mama Njeri Mboga"; a draft answer wins over the profile (minor 17, data part)
- [ ] Skip with two answers: `saveOnboardingFinish({ answers, draftItems: [3 items], status: 'skipped' })` stores those answers and defaults, creates no items, and `nextRouteAfterPin()` returns `/`
- [ ] `saveOnboardingFinish({ …, status: 'completed' })` with 3 draft items (one a service) creates exactly 3 items and the settings in one transaction; a forced failure on the third item leaves no settings, no items and status still `in_progress`; running it again with the same items creates none (minor 15)
- [ ] `nextRouteAfterPin`: no settings → `/onboarding`; skipped → `/`; completed → `/`; settings written by a restore (no progress row) → `/`
- [ ] `planItemCreation`: "Sukuma Wiki " goods vs existing "sukuma wiki" goods → already exists; same name as a service → created
- [ ] `saveDraftItems` refuses a ninth item
- [ ] Otieno opening balance 50000 cents via `saveOpening({ party: 'customer', newCustomer: { name: 'Otieno' }, amount: 50000, source: 'onboarding' })` → `saved`; exactly 1 customer and 1 txn, queue customer → txn in one transaction; customer balance 50000; `daySummary` Sales 0 and Faida Halisi 0; `broughtForwardTotals().customers` 50000 (AC-05, data part)
- [ ] A supplier opening balance of 80000 with `newSupplier` → `saved` with no `DENI_NEEDS_CUSTOMER`; `broughtForwardTotals().suppliers` 80000; `supplierOwed` 80000
- [ ] Voiding the Otieno opening balance through `saveVoid`: balance 0, the entry still listed with `voided: true`, total back to 0
- [ ] Opening deni with due date yesterday → `isOverdue` true
- [ ] Opening stock 10 tray mayai via `saveStockAdjustment` then a sale of 3 → stock on hand 7; `broughtForwardStock` for mayai is 10 (AC-06, opening-stock part)
- [ ] `saveStockAdjustment` with quantity 0 or −2 returns `hard_error`
- [ ] The DOMAIN.md worked example still gives Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents (cash in 15000, M-Pesa in 20000) after the notebook entries above (AC-03 regression, minor 12)
- [ ] Every notebook save produces sync-queue entries in parent order in the same transaction (new party before its opening balance); the progress store produces none
- [ ] The full existing Playwright suite passes with the updated `unlocked.ts` fixture (output pasted) (M9)
- [ ] `domain` coverage stays ≥ 90% (AC-02)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Phase 1 Task 4 (B2: local data and the single commit path)
- Phase 1 Task 5 (A4: owns `e2e/fixtures/unlocked.ts`). Work can start once Phase 1 Task 4 merges; the PR merges after Phase 1 Task 5, because the `nextRouteAfterPin` change and the fixture update must land together

---

## Task 2: P2-2 (B4.2): "Let's get started" stepper and "Business profile" review

### Parent

#3 (Phase 2). Blueprint step **B4 task 2**. Branch `feat/b4-onboarding-stepper`. Agent: frontend. Model: default. Lane: Dev B.

### What to build

Right after setting a PIN, a merchant meets "Let's get started" ("Tuanze" on a phone set to Kiswahili) over a photo of a Kenyan market: one question per screen, big chips for the answers, a one-line "why this matters", and a progress bar that says how far along they are. They can go back, skip at any point, or finish and see all their answers on "Business profile" ("Wasifu wa Biashara") before anything is saved. "Set up Mazao" saves the profile and turns their items into Bidhaa in one step, then takes them to their notebook.

- `app/(app)/onboarding/page.tsx` (client page, no dynamic segments): renders `applicableSteps(answers)` one at a time with the on-image `PageTitle` (`ledger.onboarding.title`: en "Let's get started", sw "Tuanze"), the question, the why-line, and the step's control built from the Phase 3 primitives (`Chip`, `ChipGroup`, `MoneyInput`, text input); content on a solid Surface panel over the `onboarding-background` (#20, or the scrim colour if not merged). Progress "step n of N" where N = applicable steps (time-left wording: P2-Q4).
  - Business type chips and the deni chips per spec (en "Yes, often" / "Sometimes" → true, "Never" → false). Business type list: P2-Q1.
  - Item step: inline list of up to 8 `DraftOnboardingItem`s; services ask only name, unit (trip, job, piece) and price (D-006); goods also ask buying price and "can sell half units (like half a kilo)"; units from DOMAIN.md (unit names are market words and stay untranslated). A ninth item shows "You can add more items in Bidhaa." Required fields: P2-Q2.
  - Due-rule chips: four rules plus "No usual day". Labels are message keys; interim (OQ P2-Q10) en "Tomorrow", "Friday", "Next week", "End of month", "No usual day"; sw "Kesho", "Ijumaa", "Wiki ijayo", "Mwisho wa mwezi", and the English text for "No usual day" until Q-006 supplies Kiswahili. One label per chip, no caption beneath.
  - Expense categories: default list from the profile, multi-select, plus "Add category".
  - Every tap calls `saveAnswer`/`saveDraftItems`/`setStep` immediately. Back keeps answers. On load the page opens `resumeStep(progress.stepId, answers)`.
  - "Skip for now" on every question: `saveOnboardingFinish({ answers, draftItems, status: 'skipped' })`, then go to `/`; draft items are not created.
  - `?mode=redo` (linked from Settings in Phase 4, P4-4): starts at the first question, prefilled from `redoAnswers(profile, progress)`.
- `app/(app)/onboarding/review/page.tsx`: work screen on Chalk, `PageTitle` (`ledger.profile.title`: en "Business profile", sw "Wasifu wa Biashara"). Sections Business, Items you sell, Services, Payments, Customer deni, Expenses, Warnings (read-only: unusual price above 30%, below cost, negative stock, all "warn"), simple dividers, no cards in cards. Unanswered sections say "Not answered. Tap to add." in Maize. Each section has "Edit", which opens that step and returns to review. Items that `planItemCreation` reports as already existing say their price is not changed (Bidhaa edit is cut from R0).
  - "Set up Mazao": one call, `saveOnboardingFinish({ answers, draftItems, status: 'completed' })`. On `saved` → `router.replace('/notebook')`; on `hard_error` → show the reasons through `IssueList` and stay. Redo mode ends on `/notebook` too (P2-Q9).
- Images are decorative (empty alt); every chip announces its label and selected state; tap targets ≥ 48 px.

### Acceptance criteria

- [ ] Playwright against the build, offline after unlock (`unlocked.ts` with `{ withProfile: false }`): answer every question for a goods merchant and a services merchant; the services path never asks buying price or half-units (D-006)
- [ ] Deni = Never skips the due-rule question and the progress total drops by one
- [ ] Reload on question 5 resumes at question 5 with earlier answers shown (AC-32)
- [ ] Skip on question 3 lands on `/` and the saved profile has the two earlier answers; Bidhaa has no new items
- [ ] After Skip, `/onboarding?mode=redo` opens on the first question with the business name already filled in from the saved profile (AC-32 second part, minor 17)
- [ ] Review shows "Not answered. Tap to add." for a skipped section; Edit returns to review after saving the change
- [ ] "Set up Mazao" with 3 items (one a service) creates exactly 3 Bidhaa and lands on `/notebook`; running it again with the same items creates none (spec story 46)
- [ ] A ninth item cannot be added and the Bidhaa message shows
- [ ] `/onboarding` and `/onboarding/review` open cold offline with their titles (AC-09 route list): English title by default ("Let's get started", "Business profile"); Kiswahili ("Tuanze", "Wasifu wa Biashara") when `deviceDb.meta.locale = 'sw'` is seeded (AC-21 as rewritten for D-049)
- [ ] The due-rule chips show one label each, from i18n, in the active locale
- [ ] axe scan on both screens at 360x800: no WCAG AA violations; text over the scrim passes AA (AC-31, contrast part)
- [ ] No component adds money or decides applicability itself (only Task 1 functions); no component writes to Dexie except through `local/save.ts` and `local/onboarding-progress.ts`
- [ ] Every new key exists in both `en` and `sw` ledger halves (typecheck); the PR lists the `sw` keys that still carry English text
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1
- P3-2a, the Phase 3 primitives + pickers ticket (PR #23 revision)
- #20 (soft: background component if merged, otherwise the scrim colour)

---

## Task 3: P2-3 (B4.3): "Bring in your notebook"

### Parent

#3 (Phase 2). Blueprint step **B4 task 3**. Branch `feat/b4-notebook`. Agent: frontend. Model: default. Lane: Dev B.

### What to build

A merchant copies what their paper notebook already holds into Mazao: who owes them, whom they owe, and how much stock they have. Each row is saved the moment it is added, labelled "Brought forward" with "This is not counted as sales", and a running total lets them check against the notebook. A wrong row is voided and re-entered, never edited. "Done" takes them to the overview with deni and stock already right and today's sales at 0.

- `app/(app)/notebook/page.tsx` (client, work screen on Chalk): `PageTitle` (`ledger.notebook.title`: en "Bring in your notebook", sw "Leta Daftari Lako"); three tabs with one label each: en "Customers who owe me", "Suppliers I owe", "Stock I have"; sw "Wanaonidai", "Ninaowadai", "Stoki".
  - **Customers:** the Phase 3 `CustomerPicker` (recent, search, or a new customer by name with optional phone; it returns a selection and writes nothing), `MoneyInput` amount, optional due date with the Phase 3 `DueChips` (picker for other dates: P2-Q3). Add → `saveOpening({ party: 'customer', customerId | newCustomer, amount, dueDate?, source: 'onboarding' })`. A new customer and its opening balance are saved together or not at all.
  - **Suppliers:** `ui/ledger/SupplierPicker.tsx` (new in this ticket, same pattern as `CustomerPicker`: `useSupplierSearch`, pick an existing supplier or a new one by name; returns a selection and writes nothing; P2-Q6), amount, optional due date. Add → `saveOpening({ party: 'supplier', supplierId | newSupplier, … })`.
  - **Stock:** one row per active **goods** item showing the quantity already brought forward for it (from `useBroughtForward()`, e.g. "Already brought forward: 10 tray"), and a `QtyInput` (fractional only if the item allows it, max 3 decimals). Add → `saveStockAdjustment({ itemId, quantity, source: 'onboarding' })`, which **adds** to what is there (interim for OQ P2-Q11). Zero is ignored and negative refused (spec ASSUMPTION). Services never appear (D-006). Empty state when there are no goods items: P2-Q7.
  - Entered rows under each tab, newest first, "Brought forward" label, helper "This is not counted as sales"; Void with a confirm step → `saveVoid`; voided rows stay, struck through, labelled "Voided" (D-018).
  - Running money total on the customer and supplier tabs from `useBroughtForward()` (e.g. "Brought forward: KES 1,950"); never summed in the component (stock tab: per-item quantities only, P2-Q5).
  - Every save returns a `SaveOutcome`: `saved` clears the row form; `needs_override` opens `SaveAnywayDialog` and "Save anyway" calls the same save with `{ override: true }`; `hard_error` shows the reasons through `IssueList`. `POSSIBLE_DUPLICATE` at warn level shows in `IssueList` and the row still saves on the first tap (D-026, D-027).
  - "Done" → `/`; "Do this later" → `/` with no change. Reachable at any time (Settings link in Phase 4).
- Empty state may use the `empty-state` image role ("Start with the person who owes you the most."), lazy, with fallback.

### Acceptance criteria

- [ ] Playwright against the build, offline after unlock: add Otieno (new customer) owes 500 → the row shows "Brought forward" and the customer tab total reads "Brought forward: KES 500"; Dexie has exactly 1 customer "Otieno" and 1 opening balance (AC-05, notebook part; the `/debts` check is in Task 4)
- [ ] Add a supplier (new) owed 800 → the supplier tab total reads "Brought forward: KES 800" and no "Choose who owes this" or deni-customer error appears
- [ ] Add 10 tray mayai on the stock tab → the row shows 10 tray and "Already brought forward: 10 tray"; adding 2 more shows 12 (AC-06, opening-stock part; the Bidhaa check is in Task 4)
- [ ] Void the Otieno row → it stays listed struck through as "Voided" and the total returns to KES 0
- [ ] A service item never appears on the stock tab; a non-fractional item refuses 2.5
- [ ] Entering the same customer and amount twice within 10 minutes shows the `POSSIBLE_DUPLICATE` warning and still saves (warn level)
- [ ] With a profile seeded `rules.duplicate = 'block'`, the second identical row opens "Save anyway" and saves only on the second tap
- [ ] Closing the app after adding a row and unlocking again shows the row (each row commits on add)
- [ ] `/notebook` opens cold offline with its English title and English tab labels by default, and Kiswahili title and tabs with `locale = 'sw'` (AC-09, AC-21 as rewritten for D-049)
- [ ] axe scan at 360x800: no WCAG AA violations
- [ ] No component sums money or quantities, and no component writes to Dexie except through `local/save.ts` (grep plus review)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1
- P3-2a, the Phase 3 primitives + pickers ticket (PR #23 revision: `CustomerPicker`, `DueChips`, `MoneyInput`, `QtyInput`, `IssueList`, `SaveAnywayDialog`)

---

## Task 4: P2-4 (B4 Verify): Onboarding end-to-end, timing and imagery check

### Parent

#3 (Phase 2). Blueprint step **B4 Verify** for the onboarding part. Branch `feat/b4-onboarding-e2e`. Agent: qa. Model: default. Lane: Dev B.

### What to build

Proof that a first-time merchant goes from PIN to a correct notebook offline, that skipping and resuming work, and that onboarding fits the 10-minute target, so the Monday pilot can rely on it.

- `e2e/onboarding.spec.ts` against `pnpm build && pnpm start`, offline after unlock (account seeded with `unlocked.ts` `{ withProfile: false }`).
- AC-15 timing on a real phone with someone who has not seen the app.
- Impeccable critique of the stepper over each onboarding background at 360x800.

### Acceptance criteria

- [ ] e2e: set PIN → `/onboarding` (via `nextRouteAfterPin`) → 3 items (one a service) → review → Set up Mazao → notebook (Otieno owes 500, 10 tray mayai) → Done → `/debts` shows Otieno 500, `/items` shows 10 tray mayai; selling 3 makes it 7 (AC-05, AC-06); voiding the Otieno opening removes him from `/debts`; today's sales are 0. The blueprint's "Muhtasari shows deni outstanding 500" assertion is added by the Phase 4 Muhtasari ticket, because Muhtasari is built there
- [ ] e2e: Skip on the first question → `/` with the default profile; unlocking again goes to `/`, not `/onboarding`
- [ ] e2e: close on question 5, unlock → back on question 5 with answers intact (AC-32)
- [ ] e2e: a restored-profile phone (settings seeded, no progress row) goes from unlock to `/` (spec story 45)
- [ ] e2e: with `locale = 'sw'` seeded, the stepper, review and notebook titles are Kiswahili; without it, English
- [ ] Every onboarding background is AVIF or WebP, ≤ 150 KB and precached (build output pasted); impeccable critique at 360x800 reports no blocking contrast issue (AC-31)
- [ ] Real phone, first-time user: sign-in → set PIN → onboarding (3 items, one a service) → review → notebook → first sale ≤ 10 minutes, timed (AC-15; needs Phase 3 `/sales/new`, so recorded when Phase 3 is merged, else in the A6 run)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 2
- Task 3
- Phase 1 Task 5 (A4: PIN lock)
- Phase 3 screens ticket (P3-2: Bidhaa, Deni and new sale; the e2e asserts on `/items` and `/debts` and records one sale)
- #20 (hard: AC-31 checks the real backgrounds)

---

## Cuts that touch this phase (blueprint §Cuts)

- **Cut 2** reduces onboarding to business name, type and items: Task 2 keeps only those steps (the script in Task 1 is unchanged; `applicableSteps` is fed a reduced list). Part of AC-15 is waived; the 10-minute target still applies.
- Cut 3 (drop `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE`) removes the duplicate-warning checks in Task 3.

## Open questions (spec silent on merchant-visible behaviour)

Plan-local IDs; the main session assigns `Q-0xx` numbers in `planning/QUESTIONS.md`. Q-006 (native-speaker check of Tuanze, Wasifu wa Biashara, Leta Daftari Lako, Wanaonidai, Ninaowadai, Stoki), the spec's photo-consent question, and the Phase 1 language questions P1-Q13 and P1-Q14 still apply.

- **P2-Q1 (Task 2):** The full business-type chip list. The spec gives examples only (vegetable trader, shop or kiosk, boda or transport, repair). Interim: those four plus "Other", stored as a lowercase slug.
- **P2-Q2 (Task 2):** Which item fields are required? If a goods item has no buying price, COGS for it is 0 and Faida Halisi is overstated. Interim: name, unit and selling price required; buying price required for goods.
- **P2-Q3 (Task 3):** Can a brought-forward deni have a due date other than the four chips (for example a date from the notebook)? Interim: chips plus "No due date" only.
- **P2-Q4 (Task 2):** The stepper's "roughly how long is left": how is it worded and computed? Interim: "About n minutes left", at 30 seconds per remaining applicable question, rounded up.
- **P2-Q5 (Task 3):** Should the suppliers and stock tabs show a running total too? The spec names it only for the customer tab. Interim: suppliers yes (same money rule); stock shows per-item quantities only (units differ).
- **P2-Q6 (Task 3):** Should the supplier tab let the merchant pick an existing supplier, as the customer tab does (spec story 30 is customers only)? Interim: yes, `SupplierPicker`, to avoid duplicate suppliers.
- **P2-Q7 (Task 3):** What does the stock tab show when the merchant has no goods items (a services-only boda rider, or one who skipped)? Interim: an empty state saying stock is only for goods, with a link to Bidhaa to add an item; no inline item creation.
- **P2-Q8 (Task 2):** Can "Next" be pressed without answering? The review screen's "Not answered" sections imply yes. Interim: yes for every question; Next on an unanswered question moves on without saving a value.
- **P2-Q9 (Task 2):** After "Set up Mazao" in redo mode (from Settings), should the merchant still go to `/notebook`, or back to Settings? Interim: `/notebook`, same as first run.
- **P2-Q10 (Task 2, Phase 3 `DueChips`, D-049):** In the English UI, do the due-rule chips keep the Kiswahili words (kesho, Ijumaa, wiki ijayo, mwisho wa mwezi) as market words, or show English (Tomorrow, Friday, Next week, End of month)? Interim: English in `en`, Kiswahili in `sw` (D-049: everything English by default; matches PR #23's P3-2a `DueChips`). A dictionary change either way.
- **P2-Q11 (Task 3, M12):** On the stock tab, does "Add" add to the quantity already brought forward, or set the opening stock to the number entered (replacing earlier rows)? Interim: add, and each goods row shows "Already brought forward: n unit" so the merchant sees what is there before adding. A wrong row is voided, not edited.
- **P2-Q12 (Task 2, D-049):** D-049 offers the language choice "once during sign-in or onboarding". Should the stepper start with a language question? Interim: no; the switch lives in Settings (P4-4), as in P1-Q13b.
