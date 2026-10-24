# Phase 2 implementation plan (tickets to be created)

Spec: `planning/sprints/phase-02-onboarding-and-notebook/spec.md` (GitHub #3). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` step **B4**, tasks **2 (onboarding), 3 (notebook) and 5 (`nextRouteAfterPin`)**. The spec header says "B4 tasks 2, 3 and 4"; task 4 is now the Leo report (Phase 4) and routing is task 5, as `planning/ROADMAP.md` already says.
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Phase 0 tickets are #15–#22; Phase 1 and Phase 3 tickets are referred to by their plan task names until issue numbers exist.

B4 is one blueprint step, but its Phase 2 part needs a backend specialist (`domain/`, `local/`) and a frontend specialist (pages, `ui/`) in different files, so it is split. Tasks 2 and 3 are separate frontend tickets because the stepper and the notebook share no files and can run in parallel once Task 1 lands. Task 4 is the step's Verify (the B4 e2e), owned by qa so that Tasks 2 and 3 stay parallel.

## Task overview

| Task | Ticket | Step | Lane | Agent | Model | Branch | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P2-1 | B4.5 + onboarding data | Dev B | backend | default | `feat/b4-onboarding-data` | Phase 1 Task 4 (B2) |
| 2 | P2-2 | B4.2 | Dev B | frontend | default | `feat/b4-onboarding-stepper` | Task 1, Phase 3 primitives task, #20 |
| 3 | P2-3 | B4.3 | Dev B | frontend | default | `feat/b4-notebook` | Task 1, Phase 3 primitives task, Phase 3 customer picker |
| 4 | P2-4 | B4 Verify | Dev B | qa | default | `feat/b4-onboarding-e2e` | Task 2, Task 3, Phase 1 Task 5 (A4), Phase 3 Bidhaa, Deni and new-sale tickets |

"Phase 3 primitives task" means the Phase 3 plan's ticket for blueprint B3 task 1 (`Button, Chip, ChipGroup, MoneyInput, QtyInput, Sheet`); "Phase 3 customer picker" means whichever Phase 3 ticket ships the customer picker/creator used by `/mauzo/new`. If the Phase 3 plan bundles them in one ticket, both rows point at it.

## Global Constraints

- Everything in the Phase 0 and Phase 1 plans' Global Constraints applies (pnpm; latest Next.js, no `src/`, React Compiler, no hand memoisation; webpack build; Biome; strict TS; client pages read only Dexie; i18n for every string; bilingual titles; tokens; 48 px targets; privacy; test-first for `domain` and `local`).
- **One save path:** onboarding and notebook records go only through `local/commit.ts` (`saveSettings`, `addItem`, `upsertCustomer`, `upsertSupplier`, `commitOpening`, `commitStockAdjustment`, `commitVoid`). The onboarding **progress draft** is the only exception: it lives in the business database's `onboarding` table, is written only by `local/onboarding-progress.ts`, and never syncs (spec "Onboarding progress store").
- **Pure numbers:** the "Brought forward: KES …" totals and every applicability rule come from `domain` functions; components never add money.
- **Brought forward is never income (D-011, D-014):** opening customer and supplier deni are `opening_balance` (`totalAmount = amount`, `amountPaid = 0`, exactly one party, `source: 'onboarding'`); opening stock is a `stock_adjustment` (`totalAmount = 0`, positive line quantity, unit cost = item buying price). None changes Sales, COGS, Expenses or Faida Halisi.
- **Imagery (D-045, Owner 2026-10-24):** the Tuanze stepper uses the `onboarding-background` images from the #19 manifest through the #20 background component (solid scrim, content on solid Surface panels, decorative, precached, fallback to the scrim colour). Review and notebook are work screens on Chalk: imagery only in the header band or the notebook empty state.
- **Visual reference:** the D0 exports in `docs/design/r0/` (#21) where they exist, else the tokens and screen prompts in `docs/design/stitch-prompts.md` (Tuanze 3.4, Wasifu wa Biashara, Leta Daftari Lako 3.6). The spec's reconciliations win over the Stitch mocks: the progress bar counts applicable questions (not "of 10"); "Yes, often" and "Sometimes" both mean `deniEnabled = true`; the notebook button is "Done", not "Save notebook".
- **i18n:** Phase 2 strings go in `i18n/en.ledger.ts` (Dev B). To avoid conflicts between parallel Tasks 2 and 3, Task 2 adds keys only under `onboarding.*` and `profile.*`, Task 3 only under `notebook.*`. Market words and the chip words kesho, Ijumaa, wiki ijayo, mwisho wa mwezi stay untranslated, with English beneath (D-005, D-040).
- **No product decisions in the build:** behaviour the spec does not state is listed under Open questions below; until answered, Builders implement the interim shown there and nothing else.
- Branch names as in the table; PR title `B4: <summary>` with the ticket id in the body; PR body lists `Closes #<ticket>`, the AC IDs and pasted verification output.

---

## Task 1: P2-1 (B4.5 + data): Onboarding progress, profile builder and first-run routing

### Parent

#3 (Phase 2: Onboarding & bring-in-your-notebook). Blueprint step **B4 task 5** plus the data modules behind B4 tasks 2 and 3. Branch `feat/b4-onboarding-data`. Agent: backend. Model: default. Lane: Dev B.

### What to build

A merchant who closes Mazao in the middle of onboarding, or whose battery dies, comes back to the same question with every earlier answer intact. A merchant who skips is never trapped and starts with sensible defaults, a merchant whose profile came back with a restore is never asked again, and re-running onboarding never creates a second "Sukuma wiki". This ticket builds that behaviour as tested modules the two screen tickets call.

- `domain/onboarding.ts` (pure):
  - `OperatingProfileAnswers` (the RQ-4 fields: business name, business type, location, sells, payment methods, deni enabled, default due rule, expense categories) and `DraftOnboardingItem` (`name, kind, unit, allowsFractional, sellingPrice: Cents, buyingPrice: Cents | null`).
  - `ONBOARDING_STEPS`: the ordered step ids `businessName, businessType, location, sells, items, paymentMethods, deni, dueRule, expenseCategories`, each with its i18n key stem and answer control (`text | singleChip | multiChip | itemList`) and a validator from the B1 operating-profile schema.
  - `applicableSteps(answers)`: drops `dueRule` unless deni is yes. Buying price and half-units apply only to goods items (validator rule, not a step).
  - `buildProfile(answers): OperatingProfile`: answers over `defaultProfile()`; every rule stays `warn`, price variance 30% (D-026, RQ-11).
  - `planItemCreation(drafts, existingItems) → { toCreate, alreadyExists }`: match on case- and whitespace-insensitive name plus kind against active items (spec ASSUMPTION).
  - `broughtForwardTotals(txns)` → `{ customers: Cents, suppliers: Cents }` over **active** `opening_balance` transactions with `source: 'onboarding'`. (Stock tab total: see P2-Q5.)
  - `MAX_ONBOARDING_ITEMS = 8`.
- `local/onboarding-progress.ts`: `loadProgress()`, `saveAnswer(step, value)` (keeps only values that pass the step validator), `saveDraftItems(items)` (refuses a ninth), `setStepIndex(i)`, `markSkipped()`, `markCompleted()`, `reset()`, storing `OnboardingProgress` exactly as the spec's type in the `onboarding` table; `updatedAt` via `toISOString()`. Never creates sync-queue entries.
- `local/routing.ts` `nextRouteAfterPin()` (replaces the A1a stub): no saved operating profile in `settings` → `/onboarding`; otherwise `/`. Pure core `routeAfterPin(hasProfile: boolean)` plus the Dexie read.
- `local/queries.ts` additions: `useOnboardingProgress()`, `useOperatingProfile()`, `useBroughtForward()` returning, per tab, the entries (newest first, with `voided: boolean`) and the totals from `broughtForwardTotals`.
- **Hand-off contract to Tasks 2 and 3:** the exports above, posted in the PR description.

### Acceptance criteria

- [ ] Tests first, Vitest with `fake-indexeddb/auto`, driving only the public functions and asserting through queries
- [ ] Each answer survives closing and reopening the database and `loadProgress().stepIndex` resumes at the saved step (AC-32, data part)
- [ ] `applicableSteps` with deni = no has no `dueRule` step; with deni = yes it has one
- [ ] `buildProfile` with only business name and type gives those values and `defaultProfile()` values for the rest, with every rule `warn` and threshold 30
- [ ] Skip with two answers: `saveSettings(buildProfile(answers))` + `markSkipped()` stores those answers and defaults, creates no items, and `nextRouteAfterPin()` returns `/`
- [ ] `nextRouteAfterPin`: no settings → `/onboarding`; skipped → `/`; completed → `/`; settings written by a restore (no progress row) → `/`
- [ ] `planItemCreation`: "Sukuma Wiki " goods vs existing "sukuma wiki" goods → already exists; same name as a service → created
- [ ] `saveDraftItems` refuses a ninth item
- [ ] Otieno opening balance 500 via `commitOpening({ source: 'onboarding' })`: customer balance 500, `daySummary` Sales 0 and Faida Halisi 0, `broughtForwardTotals().customers` 50000 (AC-05, data part)
- [ ] Voiding that opening balance: balance 0, the entry still listed with `voided: true`, total back to 0
- [ ] Opening deni with due date yesterday → `isOverdue` true
- [ ] Opening stock 10 tray mayai then a sale of 3 → stock on hand 7 (AC-06, opening-stock part)
- [ ] The DOMAIN.md worked example still gives Sales 350, COGS 90, Expenses 50, Faida Halisi 210 after the notebook entries above (AC-03 regression)
- [ ] Every notebook write produces sync-queue entries in parent order in the same transaction (new customer before its opening balance); the progress store produces none
- [ ] `domain` coverage stays ≥ 90% (AC-02)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Phase 1 Task 4 (B2: local data and the single commit path)

---

## Task 2: P2-2 (B4.2): "Tuanze" stepper and "Wasifu wa Biashara" review

### Parent

#3 (Phase 2). Blueprint step **B4 task 2**. Branch `feat/b4-onboarding-stepper`. Agent: frontend. Model: default. Lane: Dev B.

### What to build

Right after setting a PIN, a merchant meets "Tuanze / Let's get started" over a photo of a Kenyan market: one question per screen, big chips for the answers, a one-line "why this matters", and a progress bar that says how far along they are. They can go back, skip at any point, or finish and see all their answers on "Wasifu wa Biashara / Business profile" before anything is saved. "Set up Mazao" turns their items into Bidhaa and takes them to their notebook.

- `app/(app)/onboarding/page.tsx` (client page, no dynamic segments): renders `applicableSteps(answers)` one at a time with the on-image `PageTitle` "Tuanze / Let's get started", the question, the why-line, and the step's control built from Phase 3 primitives (`Chip`, `ChipGroup`, `MoneyInput`, text input); content on a solid Surface panel over the `onboarding-background` (#20). Progress "step n of N" where N = applicable steps (time-left wording: P2-Q4).
  - Business type chips and the deni chips per spec (deni "Yes, often" / "Sometimes" → true, "Never" → false). Business type list: P2-Q1.
  - Item step: inline list of up to 8 `DraftOnboardingItem`s; services ask only name, unit (trip, job, piece) and price (D-006); goods also ask buying price and "can sell half units (like half a kilo)"; units from DOMAIN.md. A ninth item shows "You can add more items in Bidhaa." Required fields: P2-Q2.
  - Due-rule chips show the Kiswahili word with English beneath (Kesho / Tomorrow, Ijumaa / Friday, Wiki ijayo / Next week, Mwisho wa mwezi / End of month), plus "No usual day".
  - Expense categories: default list from the profile, multi-select, plus "Add category".
  - Every tap calls `saveAnswer`/`saveDraftItems`/`setStepIndex` immediately. Back keeps answers. "Skip for now" on every question: `saveSettings(buildProfile(answers))`, `markSkipped()`, go to `/`; draft items are not created.
  - `?mode=redo` (linked from Mipangilio in Phase 4): starts at the first question, prefilled from the saved profile and any draft.
- `app/(app)/onboarding/review/page.tsx`: work screen on Chalk, `PageTitle` "Wasifu wa Biashara / Business profile". Sections Business, Items you sell, Services, Payments, Customer deni, Expenses, Warnings (read-only: unusual price above 30%, below cost, negative stock, all "warn"), simple dividers, no cards in cards. Unanswered sections say "Not answered. Tap to add." in Maize. Each section has "Edit", which opens that step and returns to review. Items that `planItemCreation` reports as already existing say their price is not changed (Bidhaa edit is cut from R0).
  - "Set up Mazao": `saveSettings(buildProfile(answers))` → `addItem` for each `toCreate` → `markCompleted()` → `router.replace('/notebook')`. Each call is its own commit; a re-run after an interruption is safe because of `planItemCreation`.
- Images are decorative (empty alt); every chip announces its label and selected state; tap targets ≥ 48 px.

### Acceptance criteria

- [ ] Playwright against the build, offline after unlock: answer every question for a goods merchant and a services merchant; the services path never asks buying price or half-units (D-006)
- [ ] Deni = Never skips the due-rule question and the progress total drops by one
- [ ] Reload on question 5 resumes at question 5 with earlier answers shown (AC-32)
- [ ] Skip on question 3 lands on `/` and the saved profile has the two earlier answers; Bidhaa has no new items
- [ ] Review shows "Not answered. Tap to add." for a skipped section; Edit returns to review after saving the change
- [ ] "Set up Mazao" with 3 items (one a service) creates exactly 3 Bidhaa and lands on `/notebook`; running it again with the same items creates none (spec story 46)
- [ ] A ninth item cannot be added and the Bidhaa message shows
- [ ] `/onboarding` and `/onboarding/review` open cold offline with their bilingual titles (AC-09 route list, AC-21)
- [ ] axe scan on both screens at 360x800: no WCAG AA violations; text over the scrim passes AA (AC-31, contrast part)
- [ ] No component adds money or decides applicability itself (only Task 1 functions)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1
- Phase 3 primitives task (B3 task 1)
- #20

---

## Task 3: P2-3 (B4.3): "Leta Daftari Lako", bring in your notebook

### Parent

#3 (Phase 2). Blueprint step **B4 task 3**. Branch `feat/b4-notebook`. Agent: frontend. Model: default. Lane: Dev B.

### What to build

A merchant copies what their paper notebook already holds into Mazao: who owes them, whom they owe, and how much stock they have. Each row is saved the moment it is added, labelled "Brought forward" with "This is not counted as sales", and a running total lets them check against the notebook. A wrong row is voided and re-entered, never edited. "Done" takes them to Muhtasari with deni and stock already right and today's sales at 0.

- `app/(app)/notebook/page.tsx` (client, work screen on Chalk): `PageTitle` "Leta Daftari Lako / Bring in your notebook"; three tabs with English beneath: Wanaonidai / Customers who owe me, Ninaowadai / Suppliers I owe, Stoki / Stock I have.
  - **Customers:** the Phase 3 customer picker (search existing or create by name with optional phone via `upsertCustomer`), `MoneyInput` amount, optional due date with the sales due chips (picker for other dates: P2-Q3). Add → `commitOpening({ customerId, amount, dueDate?, source: 'onboarding' })`.
  - **Suppliers:** supplier name (create via `upsertSupplier`; reuse of an existing supplier: P2-Q6), amount, optional due date. Add → `commitOpening({ supplierId, … })`.
  - **Stock:** one row per active **goods** item with `QtyInput` (fractional only if the item allows it, max 3 decimals). Add → `commitStockAdjustment({ itemId, quantity, source: 'onboarding' })`. Zero is ignored and negative refused (spec ASSUMPTION). Services never appear (D-006). Empty state when there are no goods items: P2-Q7.
  - Entered rows under each tab, newest first, "Brought forward" label, helper "This is not counted as sales"; Void with a confirm step → `commitVoid`; voided rows stay, struck through, labelled "Voided" (D-018).
  - Running total per tab from `useBroughtForward()` (e.g. "Brought forward: KES 1,950"); never summed in the component.
  - `POSSIBLE_DUPLICATE` and other grill issues show through the Phase 3 `IssueList`/`SaveAnywayDialog` (D-026).
  - "Done" → `/`; "Do this later" → `/` with no change. Reachable at any time (Mipangilio link in Phase 4).
- Empty state may use the `empty-state` image role ("Start with the person who owes you the most."), lazy, with fallback.

### Acceptance criteria

- [ ] Playwright against the build, offline after unlock: add Otieno owes 500 → the row shows "Brought forward" and the customer tab total reads "Brought forward: KES 500" (AC-05, notebook part; the `/deni` check is in Task 4)
- [ ] Add 10 tray mayai on the stock tab → the row shows 10 tray (AC-06, opening-stock part; the Bidhaa check is in Task 4)
- [ ] Void the Otieno row → it stays listed struck through as "Voided" and the total returns to KES 0
- [ ] A service item never appears on the stock tab; a non-fractional item refuses 2.5
- [ ] Entering the same customer and amount twice within 10 minutes shows the `POSSIBLE_DUPLICATE` warning and still saves (warn level)
- [ ] Closing the app after adding a row and unlocking again shows the row (each row commits on add)
- [ ] `/notebook` opens cold offline with its bilingual title and bilingual tab labels (AC-09, AC-21)
- [ ] axe scan at 360x800: no WCAG AA violations
- [ ] No component sums money (grep plus review)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1
- Phase 3 primitives task (B3 task 1)
- Phase 3 customer picker

---

## Task 4: P2-4 (B4 Verify): Onboarding end-to-end, timing and imagery check

### Parent

#3 (Phase 2). Blueprint step **B4 Verify** for the onboarding part. Branch `feat/b4-onboarding-e2e`. Agent: qa. Model: default. Lane: Dev B.

### What to build

Proof that a first-time merchant goes from PIN to a correct notebook offline, that skipping and resuming work, and that onboarding fits the 10-minute target, so the Monday pilot can rely on it.

- `e2e/onboarding.spec.ts` against `pnpm build && pnpm start`, offline after unlock (account seeded as in `e2e/pin.spec.ts`).
- AC-15 timing on a real phone with someone who has not seen the app.
- Impeccable critique of the stepper over each onboarding background at 360x800.

### Acceptance criteria

- [ ] e2e: set PIN → `/onboarding` (via `nextRouteAfterPin`) → 3 items (one a service) → review → Set up Mazao → notebook (Otieno owes 500, 10 tray mayai) → Done → `/deni` shows Otieno 500, `/bidhaa` shows 10 tray mayai; selling 3 makes it 7 (AC-05, AC-06); voiding the Otieno opening removes him from `/deni`; today's sales are 0. The blueprint's "Muhtasari shows deni outstanding 500" assertion is added by the Phase 4 Muhtasari ticket, because Muhtasari is built there
- [ ] e2e: Skip on the first question → `/` with the default profile; unlocking again goes to `/`, not `/onboarding`
- [ ] e2e: close on question 5, unlock → back on question 5 with answers intact (AC-32)
- [ ] e2e: a restored-profile phone (settings seeded, no progress row) goes from unlock to `/` (spec story 45)
- [ ] Every onboarding background is AVIF or WebP, ≤ 150 KB and precached (build output pasted); impeccable critique at 360x800 reports no blocking contrast issue (AC-31)
- [ ] Real phone, first-time user: sign-in → set PIN → onboarding (3 items, one a service) → review → notebook → first sale ≤ 10 minutes, timed (AC-15; needs Phase 3 `/mauzo/new`, so recorded when Phase 3 is merged, else in the A6 run)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 2
- Task 3
- Phase 1 Task 5 (A4: PIN lock)
- Phase 3 Bidhaa, Deni and new-sale screen tickets (the e2e asserts on `/bidhaa` and `/deni` and records one sale)

---

## Cuts that touch this phase (blueprint §Cuts)

- **Cut 2** reduces onboarding to business name, type and items: Task 2 keeps only those steps (the script in Task 1 is unchanged; `applicableSteps` is fed a reduced list). Part of AC-15 is waived; the 10-minute target still applies.
- Cut 3 (drop `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE`) removes the duplicate-warning check in Task 3.

## Open questions (spec silent on merchant-visible behaviour)

Plan-local IDs; the main session assigns `Q-0xx` numbers in `planning/QUESTIONS.md`. Q-006 (native-speaker check of Tuanze, Wasifu wa Biashara, Leta Daftari Lako, Wanaonidai, Ninaowadai, Stoki) and the spec's photo-consent question still apply.

- **P2-Q1 (Task 2):** The full business-type chip list. The spec gives examples only (vegetable trader, shop or kiosk, boda or transport, repair). Interim: those four plus "Other", stored as a lowercase slug.
- **P2-Q2 (Task 2):** Which item fields are required? If a goods item has no buying price, COGS for it is 0 and Faida Halisi is overstated. Interim: name, unit and selling price required; buying price required for goods.
- **P2-Q3 (Task 3):** Can a brought-forward deni have a due date other than the four chips (for example a date from the notebook)? Interim: chips plus "No due date" only.
- **P2-Q4 (Task 2):** The stepper's "roughly how long is left": how is it worded and computed? Interim: "About n minutes left", at 30 seconds per remaining applicable question, rounded up.
- **P2-Q5 (Task 3):** Should the suppliers and stock tabs show a running total too? The spec names it only for the customer tab. Interim: suppliers yes (same money rule); stock no (quantities differ by unit).
- **P2-Q6 (Task 3):** Should the supplier tab let the merchant pick an existing supplier, as the customer tab does (spec story 30 is customers only)? Interim: yes, same picker pattern, to avoid duplicate suppliers.
- **P2-Q7 (Task 3):** What does the stock tab show when the merchant has no goods items (a services-only boda rider, or one who skipped)? Interim: an empty state saying stock is only for goods, with a link to Bidhaa to add an item; no inline item creation.
- **P2-Q8 (Task 2):** Can "Next" be pressed without answering? The review screen's "Not answered" sections imply yes. Interim: yes for every question; Next on an unanswered question moves on without saving a value.
- **P2-Q9 (Task 2):** After "Set up Mazao" in redo mode (from Mipangilio), should the merchant still go to `/notebook`, or back to Mipangilio? Interim: `/notebook`, same as first run.
