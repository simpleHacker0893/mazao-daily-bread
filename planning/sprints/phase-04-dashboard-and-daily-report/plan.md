# Phase 4 implementation plan (tickets P4-1 to P4-8)

Spec: `planning/sprints/phase-04-dashboard-and-daily-report/spec.md` (GitHub #5). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md`:
- **B4 task 1** (Muhtasari);
- **B4 task 4** (Leo / Today report, RQ-15, D-047);
- **A6** tasks 1–5 and 7 (Mipangilio; integrate; deploy; device check; pilot kit; tag).

Also the new AC-33 "full Gikomba day" check (proposed by the Phase 3 spec). B4 tasks 2, 3 and 5 (onboarding, notebook, `nextRouteAfterPin`) belong to Phase 2. A6 task 6 (the landing page) is Phase 0 (#22).
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Issue numbers are assigned when the scrum-architect creates the tickets after the owner OKs this plan.

**Why these splits.**
- B4 is already divided across phases by the specs. Within Phase 4, Muhtasari (B4.1) and Leo (B4.4) are separate tasks: they are separate requirements (RQ-10 and RQ-15), separate routes and a separate cut (3a). Each also needs a `backend` part and a `frontend` part, in different files.
- A6 needs four specialists: `frontend` (Mipangilio), `devops` (deploy), `qa` (e2e and the acceptance run) and `developer` (pilot docs). It is split by specialist.
- AC-33 isn't in any blueprint step. It gets its own `qa` task because it has to pass **before** the deploy, while the acceptance run comes **after** it.

| Task | Ticket | Step | Lane | When (EAT) | Agent | Model | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P4-1 | B4.4 + B4.1 (day report and dashboard read models) | Dev B | Sun 18:00–19:30 | backend | **strongest** | B1, B2, P3-1 |
| 2 | P4-2 | B4.1 Muhtasari | Dev B | Sun 19:30–21:30 | frontend | default | Task 1, P3-2, A2 (#17) |
| 3 | P4-3 | B4.4 Leo / Today screen and share | Dev B | Sun 19:30–21:30 (beside Task 2; disjoint files) | frontend | default | Task 1, P3-2 (`TxnDetailSheet`), A2 (#17, #18) |
| 4 | P4-4 | A6.1 Mipangilio (incl. the language switch) | Dev A | Sun 19:00–21:00 (codes against the Task 1 stub; merges after Task 1) | frontend | default | A4, A5, Task 1 (`useBusinessHeader`), A2 (#17) |
| 5 | P4-5 | AC-33 full Gikomba day e2e | Dev B | Sun 23:00 → Mon 01:00 | qa | default | Tasks 2, 3, P3-2, Phase 2 P2-2/P2-3 |
| 6 | P4-6 | A6.2–A6.3 Integrate and production deploy | Dev A | Mon 01:00–03:00 | devops | default | every R0 task, Tasks 4, 5, Q-003, D-048 merged to `main` |
| 7 | P4-7 | A6.5 Pilot kit docs | Dev A | any time; screenshots after Task 6 | developer | default | (screenshots) Task 6 |
| 8 | P4-8 | A6.4 + A6.7 Acceptance run on real phones and tag | both | Mon 03:00–07:00 | qa | default | Tasks 6, 7, Q-002 |

Dev B's full Sunday schedule across Phases 2–4, and the R-001 schedule risk it carries, is in the Phase 3 plan (`planning/sprints/phase-03-daily-transactions/plan.md`, "Dev B schedule"). In short: Phase 2's P2-2/P2-3 now run Sun 14:00–18:00 beside P3-2 (they wait only on P3-2a), so nothing from Phase 2 competes with Tasks 1–3 after 18:00 except the P2-4 e2e (Sun 18:00–19:30). Sun 21:30–23:00 is buffer for review fixes.

## Global Constraints

- Package manager **pnpm only**. Latest Next.js App Router, **no `src/`**, React Compiler on; no hand-written `useMemo`/`useCallback`/`memo`; render stays pure. Build is `next build --webpack` (D-042). Biome only. TypeScript strict + `noUncheckedIndexedAccess`.
- **Offline first.** `/`, `/leo` and `/mipangilio` are client pages that read only from Dexie, with no server data fetching and no dynamic segments (D-041). `/leo` is already in the A2 placeholder routes and precache list (#17, #18), so the service worker needs no change in this phase. If A2 shipped without `/leo`, adding it belongs to Dev A's lane (`app/sw.ts`).
- **One source of numbers.** Muhtasari, Leo and the shared text all come from `daySummary` through `dayReport` (Task 1). `dayReport.totals` **is** `daySummary(...)`, never a second calculation. Components and hooks never calculate money, and never negate a balance to show credit.
- **Day:** the Nairobi business day by `occurredAt` (`nairobiDayRange(todayInNairobi())`). `useToday()` rolls over at midnight (B2).
- **Money:** integer cents (D-013), "KES 1,250" through `formatKES`. Payments, opening balances and stock adjustments are never sales (D-011, D-014).
- **Server (Tasks 6 and 8 only).** **D-048** (Prisma ORM 8) is recorded only on the unmerged `feat/a1a-skeleton` branch. It is in force for this phase **only once it is merged to `main`**; Task 6 is blocked until then. Under D-048:
  - `prisma` **8.0.0-rc.27** pinned exactly, with `@prisma/orm-postgres`, contract-first;
  - `prisma/contract.prisma`, with the emitted `prisma/contract.json` and `prisma/contract.d.ts` committed;
  - `pnpm db:migrate` runs `prisma db migrate` over `DIRECT_URL` (Neon unpooled);
  - the runtime `server/db.ts` uses `postgres({ contract })` over `DATABASE_URL` (pooled);
  - Neon must run PostgreSQL 15 or newer.

  If A1a merges **without** D-048, Task 6 follows D-037 as on `main` today (`@prisma/client` with `@prisma/adapter-neon`, `prisma migrate deploy`), and the scrum-architect updates Task 6's checks before it starts.
- **File ownership (R-011):**
  - **Dev B:** `domain/*`, `local/*` (except the A1a contract stubs), `ui/*`, `ui/ledger/*`, `app/(app)/page.tsx`, `app/(app)/leo/*`, the ledger half of the `en` and `sw` dictionaries.
  - **Dev A:** `app/(app)/mipangilio/*`, `sync/*`, `auth/*`, `ui/shell/*`, `app/sw.ts`, `prisma/*`, config (including `package.json` and `pnpm-lock.yaml`), the shell half of the `en` and `sw` dictionaries.
  - **qa:** `e2e/*` specs it creates.
  - **developer:** `docs/pilot/*`.
- **Language (D-049, Owner 2026-10-24; supersedes the naming parts of D-004 and D-040; recorded on the unmerged `feat/a1a-skeleton`, assumed to merge with A1a).**
  - The UI is **English by default**. Kiswahili is a switch on Mipangilio (Task 4), stored on the phone in the device `meta` key `locale`. There are no bilingual "Kiswahili over English" titles or labels.
  - All copy, including titles and nav labels, is a message key read through `t(key, locale)`, with the locale from `useLocale()` (the cross-plan locale contract in the Phase 3 plan). Every new key goes into both the `en` and `sw` halves of its lane. The exact file layout follows the A1a contract once merged (on `feat/a1a-skeleton`: `i18n/en.ledger.ts` + `i18n/sw.ledger.ts` with `ledger.*` keys for Dev B, `i18n/en.shell.ts` + `i18n/sw.shell.ts` with `shell.*` keys for Dev A). Key prefixes per task: Task 2 `ledger.muhtasari.*`, Task 3 `ledger.leo.*`, Task 4 `shell.settings.*`.
  - English titles (the English halves of the D-040 pairs): Overview, Today, Settings; section labels Who owes you, Business, Security, Backup, About. The `sw` values: Muhtasari, Leo, Mipangilio, Wanaokudai, Biashara, Usalama, Hifadhi, Kuhusu (Q-006 native-speaker check pending).
  - Market words stay untranslated in both locales (D-005): the hero label is "Faida Halisi" in both, with "Net profit today" (or its `sw` value) beneath as body text. The D-049 reconciliation of market words in the English UI is **OQ-3.12**; whether the `sw` copy must be complete for the pilot is **OQ-3.13**.
- **Design (Owner, 2026-10-24):** impeccable Operate mode.
  - Faida Halisi is the **only** hero figure. There is no row of equal KPI cards, no cards inside cards, no gradients or glows, no eyebrows, no avatars, no emoji and no em-dashes.
  - Colours: Maize for deni, Tomato only for overdue, errors and destructive actions, Slate only for M-Pesa, Sukuma Green only for the primary action, the active nav and focus.
  - Manrope with tabular figures, 8 px radius, 48 px targets.
  - Loading shows skeleton rows shaped like the real rows, never a spinner over content. Reduced motion turns transitions into cross-fades.
- **Privacy:** the shared summary text is never logged and never sent to Mazao's server. Customer names are left out by default (RQ-15). Never log record contents, phone numbers or PIN material.
- **Test-first** for `domain` and `local`. Playwright runs only against `pnpm build && pnpm start` (or the production URL in Task 8).
- A PR is ready only when `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass and the ticket's checks have been run. Branch as named. The PR title is `<step-id>: <summary>`, and the body lists `Closes #<ticket>` and the AC IDs and pastes the verification output.
- **Stop and ask** (product-owner) if this plan or the spec is silent on anything a merchant would see. The open questions are listed at the end. Interim behaviours are marked **ASSUMPTION** with their OQ; build exactly the interim.

## Task 1: P4-1 (B4): Day report and dashboard read models

### Parent

#5 (Phase 4: Muhtasari dashboard, Today report & pilot readiness). Blueprint **B4 task 4** (data part) and **B4 task 1** (data part), branch `feat/b4-day-report`. Agent `backend`, **strongest model**. Dev B lane.

### What to build

Whatever the merchant did today, Muhtasari, the Today report and the shared WhatsApp text show the same figures, because all three come from one tested function. Voids, brought-forward entries, and voids today of earlier days' records are handled the same way everywhere.

- **`domain/summary.ts`** additions (pure; types are defined in this module, not in `types.ts`):
  - `dayReport(txns, lines, customers, range)` returns the `DayReport` shape in spec §Implementation Decisions:
    - `totals` is exactly `daySummary(txns, lines, range)`;
    - `deniGiven` and `paymentsReceived`;
    - `entries`, oldest first (per **OQ-4.3**), with `txnId`, `kind`, `voided`, `countsInTotals` and `voidsEarlierDay`;
    - `customers`, with walk-in as `customerId: null`, `balanceNow` from `customerBalance` over all time, and **`standing`** from P3-1's `customerStanding(balanceNow)` (`owes` / `clear` / `credit` with a non-negative amount), so Leo shows "in credit KES n" without negating anything.
    - `opening_balance` and `stock_adjustment` dated in the range become `brought_forward` entries and are never counted (D-011). What a stock brought-forward entry shows follows **OQ-4.7**.
  - `formatDaySummaryText(report, business, strings, { includeCustomerNames })` returns plain text built only from `formatKES` and the passed-in strings: no markdown, no emoji, no em- or en-dashes. Its content follows **OQ-4.1**; until that's answered, use the spec's example layout. `includeCustomerNames` defaults to `false`. **ASSUMPTION (OQ-4.12):** the caller passes the strings for the current UI locale, so the shared text is in the merchant's chosen language.
  - `moneyInShares(totals)` returns the cash, M-Pesa and other fractions for the Muhtasari bar (they sum to 1, or are all 0), so the component does no arithmetic.
  - `supplierDeniTotal(suppliers, txns)` = Σ `supplierOwed` (opening balances only in R0).
- **`domain/dates.ts`:** `formatNairobiDate(day, locale)` returns "Sat 24 Oct 2026" in `en`; the `sw` weekday and month names come from the `sw` dictionary (**OQ-4.12**).
- **`local/queries.ts`** additions. This is the hand-off contract for Tasks 2, 3 and 4:

  ```ts
  useDayReport(today: string): DayReport | undefined;
  useDashboard(today: string): {
    totals: DaySummary;                     // === useDayReport(today).totals
    moneyIn: { cash: number; mpesa: number; other: number }; // shares from moneyInShares
    deniGiven: Cents;
    deni: DeniList;                         // from P3-1 deniList; the screen shows rows.slice(0, 5)
    supplierDeniTotal: Cents;
    lowStock: { itemId: Id; name: string; unit: string; onHand: number }[];
    recordCount: number;                    // per OQ-4.8
  } | undefined;
  useBusinessHeader(): { businessName: string; location: string } | undefined; // from merchant settings; Task 4 uses it too
  ```
- Add `fast-check` as a dev dependency for the property test. This touches `package.json` and `pnpm-lock.yaml`, which are Dev A's config files (R-011): **Dev A approves the dependency change in this PR** (or adds it in a one-line Dev A PR first).

### Acceptance criteria

- [ ] Worked example (DOMAIN.md): `dayReport.totals` is Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000, cash 15000, M-Pesa 20000. There are 3 entries in time order and one "walk-in" customer line (AC-24 unit part).
- [ ] Deni scenario: Wanjiku buys 30000 and pays 10000, then pays 15000 → her line shows bought 30000, paid 25000, `balanceNow` 5000, `standing` owes 5000. Void the payment → paid 10000, `balanceNow` 20000, the payment entry has `voided: true`, and the totals still deep-equal `daySummary` (AC-25 unit part).
- [ ] A customer who owed 5000 and pays 15000 today has `standing` `{ kind: 'credit', amount: 10000 }`.
- [ ] Opening balance for Otieno 50000 and opening stock of 10 tray today → both are `brought_forward` with `countsInTotals: false`; Sales 0 and Faida Halisi 0 (AC-26 unit part).
- [ ] A void today of a sale dated yesterday is listed today with `voidsEarlierDay` set to yesterday. Today's totals are unchanged, and yesterday's `daySummary` drops by the sale (AC-27 unit part).
- [ ] A record at 00:30 EAT counts in that EAT day.
- [ ] Property test (fast-check, ≥ 200 runs over generated R0 ledgers): `dayReport(...).totals` deep-equals `daySummary(...)`. The counted `sale` entries sum to `totals.sales`, the counted `expense` entries to `totals.expenses`, and `paymentsReceived` equals the counted `customer_payment` entries.
- [ ] `formatDaySummaryText`: contains `Faida Halisi` and "KES 210" for the worked example. With the default options it contains no customer name; with `includeCustomerNames: true` it does. It contains no U+2014, U+2013, `*`, `#` or emoji (AC-28 text part).
- [ ] `formatNairobiDate('2026-10-24', 'en')` is "Sat 24 Oct 2026"; the `sw` call uses only `sw` dictionary names.
- [ ] `moneyInShares` of all zeros returns zeros (no NaN).
- [ ] `domain` line coverage stays ≥ 90% (AC-02).
- [ ] lint, typecheck, test and build pass. The PR body pastes the contract as built, and shows Dev A's approval of the `fast-check` dependency.

### Blocked by

- B1, B2 (Phase 1)
- P3-1 (`deniList`, `customerStanding`, `formatNairobiTime`)

## Task 2: P4-2 (B4.1): Muhtasari / Overview

### Parent

#5 (Phase 4). Blueprint **B4 task 1**, branch `feat/b4-muhtasari`. Agent `frontend`, default model. Dev B lane. Use `impeccable` (Operate mode) and `frontend-design`. Visual reference: `docs/design/r0/` if exported.

### What to build

After unlocking, the merchant sees in three seconds, in direct sun, what she earned today: one large Faida Halisi figure, with a short sum beneath it showing where it came from. Below that: how much came in as cash and M-Pesa, who owes her (overdue first), what she owes suppliers from her notebook, what is running low, and one-tap New sale, New expense and Record payment. It updates the instant she saves anything, even offline.

Order at 360×800 (spec §Implementation Decisions, Muhtasari screen):
1. The page title from its message key (English "Overview" by default, the `sw` value when switched) and a date line from `formatNairobiDate(today, locale)` (the sync chip is in the shell).
2. **Hero:** "Faida Halisi" with "Net profit today" under it, 36sp bold tabular Ink, on no card. A loss shows a leading minus (from `formatKES`) and stays Ink. Screen readers hear "Faida Halisi, net profit today, KES n" in the current locale.
3. **Statement:** Sales, less Cost of goods, less Expenses, right-aligned to the hero's right edge.
4. **Money in today:** one bar split Cash (Ink), M-Pesa (Slate) and Other (colour per **OQ-4.4**), widths from `moneyIn`, with labels and amounts below. "Deni given today" is a separate Maize line, never a bar segment.
5. **Who owes you:**
   - the total and the number of customers;
   - the top 5 rows from `deni.rows`, each with a left status bar plus text ("2 days overdue", "due tomorrow"), opening `/deni/customer?id=…`;
   - "See all deni".
6. Supplier deni brought forward, as one line, shown only when it isn't zero.
7. Low stock rows, such as "Mayai: 1 tray left", shown only when there are any.
8. The "Today" link row: "See everything recorded today (n)" → `/leo`.
9. Quick actions:
   - a full-width primary **New sale** (`/mauzo/new`);
   - outlined **New expense** (`/gharama/new`) and **Record payment** side by side. Record payment opens P3-2's `RecordPaymentSheet` without a `customerId`.
10. Day-1 empty state: "No sales yet today. Record your first sale." with New sale. One optional empty-state photo, only if a manifest entry exists (#19). Never put a photo behind figures.

### Acceptance criteria

- [ ] e2e (built app, offline after unlock): after the worked example, the hero shows KES 210 and the statement shows 350, 90 and 50. Money in shows Cash 150 and M-Pesa 200 (AC-03 Muhtasari part).
- [ ] e2e: after an opening balance for Otieno of 500, Who owes you shows 500, **`/deni` shows Otieno with 500**, and the hero and Sales show 0 (AC-05, both parts).
- [ ] e2e, offline: saving a sale on `/mauzo/new` and going back to `/` shows the new hero figure with no reload (AC-16 "Muhtasari updates instantly").
- [ ] e2e: a negative Faida Halisi (expense only) shows a leading minus in Ink, not Tomato.
- [ ] e2e: a fake clock across midnight EAT rolls the figures to the new day without a reload.
- [ ] e2e: the page shows the English title "Overview" and the English section labels by default; "Faida Halisi" shows in both locales. With `meta.locale = 'sw'` (seeded until Task 4 ships the control), the title, section labels and date line show their `sw` dictionary values with no reload (AC-21 part, as proposed to be reworded).
- [ ] An impeccable critique at 360×800 reports no blocking issue: one hero figure, no equal KPI card row, no decorative gradient or glow, and AA contrast in a sunlight check. The critique output is pasted in the PR (AC-30, Muhtasari part).
- [ ] Every interactive element is at least 48×48 px. No money arithmetic in `app/` or `ui/` (reviewer sign-off is the gate). No hand-written `useMemo`, `useCallback` or `memo`.
- [ ] lint, typecheck, test and build pass. `pnpm build && pnpm exec playwright test e2e/muhtasari.spec.ts` output is pasted in the PR.

### Blocked by

- Task 1
- P3-2 (`RecordPaymentSheet`, screens linked from here)
- A2 shell (#17)

## Task 3: P4-3 (B4.4): Leo / Today report and share

### Parent

#5 (Phase 4). Blueprint **B4 task 4** (RQ-15, D-047), branch `feat/b4-leo-today`. Agent `frontend`, default model. Dev B lane. **Cut 3a** applies to parts of this task (marked below).

### What to build

At closing time, the merchant opens "Today" from Muhtasari and runs her finger down the day like a notebook page:
- every sale, expense, payment and void, in time order, with totals identical to Muhtasari;
- who bought, who paid and who now owes;
- one tap sends a plain-text summary to WhatsApp, even with no signal.

1. `/leo` (client page, offline):
   - the page title from its message key (English "Today" by default, `sw` "Leo" when switched) and the date;
   - a totals block with the same figures as Muhtasari;
   - **Share today's summary** (Cut 3a).
2. **Chronological list** from `useDayReport(today).entries`:
   - each entry shows its time, what it was and the amount; deni sales show the customer and the deni amount in Maize;
   - voided records are struck through, marked "Voided" and left out of the totals;
   - a void of an earlier day's record shows "Changed <day>'s totals, not today's" (AC-27);
   - a "Brought forward" group sits at the end and is not counted;
   - **ASSUMPTION (OQ-4.10):** tapping **any** entry (sale, expense, payment, opening balance, void) opens P3-2's `TxnDetailSheet` for its `txnId`, where Void is offered when `canVoid`. This task owns that tap. It is the only expense-void path once Cut 4 removes `/gharama`.
3. **Customers today** (Cut 3a):
   - one row per customer, showing bought, paid, and the status from `standing`: "owes KES n", "owes nothing now", or "in credit KES n" (n = `standing.amount`; no negation in the component);
   - one "Walk-in" row for sales with no customer;
   - each named row opens `/deni/customer?id=…`.
4. **Share** (Cut 3a), in `ui/ledger/share-summary.ts`:
   - `shareSummary(text)` calls `navigator.share({ text })` when it exists; an `AbortError` does nothing.
   - Otherwise, or on any other error, it falls back to `navigator.clipboard.writeText` with the snackbar "Copied. Paste it in WhatsApp."
   - If the clipboard is unavailable too, a sheet shows the text pre-selected for manual copy.
   - The text comes from `formatDaySummaryText`, with customer names off by default. Where the names switch lives, and whether it is remembered, follows **OQ-4.2**.
   - Nothing is logged and no network is needed.
5. Empty state: "Nothing recorded today yet." with New sale.

### Acceptance criteria

- [ ] e2e (built app, offline after unlock): after the worked example, `/leo` lists 3 entries in time order and shows Sales 350, COGS 90, Expenses 50, Faida Halisi 210, Cash 150 and M-Pesa 200, the same numbers `/` shows (AC-24).
- [ ] e2e: deni scenario → Wanjiku's row shows bought 300, paid 250, owes 50. Void the payment → paid 100, owes 200, the payment entry struck through as "Voided", and the totals still equal Muhtasari (AC-25). If Cut 3a is applied, the customer-row part is waived **only if OQ-4.9 is answered yes**; otherwise Cut 3a must keep the Customers today section.
- [ ] e2e: a customer who owed 50 and pays 150 today shows "in credit KES 100".
- [ ] e2e: an opening balance and opening stock entered today appear under "Brought forward", and Sales and Faida Halisi stay 0 (AC-26).
- [ ] e2e: with a fake clock, a sale dated yesterday and voided today is listed today with the "changed yesterday's totals" note, and today's totals are unchanged (AC-27).
- [ ] e2e: tapping today's ushuru expense in the list opens `TxnDetailSheet`; voiding it strikes the entry through and Expenses and Faida Halisi update on both `/leo` and `/`. (Required before Cut 4 may be applied.)
- [ ] e2e: with `navigator.share` stubbed, the shared text contains "Faida Halisi" and no customer name. With it removed, the clipboard holds the text and "Copied" shows. A stubbed `AbortError` shows nothing (AC-28 browser part; the real phone check is in P4-8).
- [ ] e2e, cold offline: `/leo` opens directly with the network off and shows the English title "Today"; with `meta.locale = 'sw'` it shows the `sw` title (AC-29, as proposed to be reworded).
- [ ] An impeccable critique of `/leo` at 360×800 reports no blocking issue. Output pasted in the PR (AC-30, Leo part).
- [ ] lint, typecheck, test and build pass. `pnpm build && pnpm exec playwright test e2e/leo.spec.ts` output is pasted in the PR.

### Blocked by

- Task 1
- P3-2 (`TxnDetailSheet`, screens linked from here)
- A2 shell (#17) and A2 PWA offline (#18)

## Task 4: P4-4 (A6.1): Mipangilio / Settings

### Parent

#5 (Phase 4). Blueprint **A6 task 1** (RQ-13, plus the D-049 language switch), branch `feat/a6-mipangilio`. Agent `frontend`, default model. **Dev A lane** (`app/(app)/mipangilio/*`, the shell half of the `en` and `sw` dictionaries).

### What to build

The merchant can manage Mazao herself:
- see which email the phone belongs to;
- change her PIN (only after entering the current one);
- lock the app;
- switch the app between English and Kiswahili;
- redo her onboarding answers or bring in more of her notebook;
- see whether her records are backed up, and tap "Back up now";
- read the app version for the pilot coordinator.

- Section titles from message keys: Business, Security, Language, Backup, About in English; the `sw` values Biashara, Usalama, Hifadhi, Kuhusu and a Kiswahili "Language" value (Q-006 covers the native-speaker check).
- **Business:** business name and location (`useBusinessHeader` from P4-1), "Redo onboarding answers" (→ `/onboarding`) and "Bring in your notebook" (→ `/notebook`). Both routes exist as A2 placeholders, so this task doesn't wait on Phase 2; Phase 2's prefill behaviour arrives with P2-2.
- **Security:**
  - **Change PIN:** verify the current PIN through `auth/pin.ts` `verifyPin`, then go to the `/set-pin` flow. **ASSUMPTION (OQ-4.11):** wrong current PINs count toward the same failure counter and backoff as `/lock` (5 wrong → 30 s wait, doubling; D-024), so the settings screen can't be used to guess the PIN faster.
  - **Lock now:** clear the session, then go to `/lock`.
  - Account email.
- **Language** (D-049): a two-option control, "English" and "Kiswahili" (each option's label in its own language, ASSUMPTION within OQ-3.13). Choosing one calls `setLocale()`, which writes the device `meta` key `locale` (no network, never synced). The whole UI, including the bottom nav and every page title, re-renders in the chosen language immediately, with no reload. If A2 didn't ship `useLocale()`/`setLocale()` and P3-2a didn't add them, this task adds them (shared i18n contract; both devs agree in the PR).
- **Backup:**
  - the status from `useSyncStatus()`;
  - "Last backup: today 10:45. Nothing waiting.";
  - **Back up now** calls `flush()`, and is disabled offline with "Offline" shown;
  - "Not backed up for 3 days" in Tomato when that's true (D-021).
  - The last-backup time needs the time of the last successful flush. If A5 doesn't store it, this task adds a `meta` key `lastBackupAt` written by `sync/engine.ts` on success (Dev A lane), with a unit test.
- **About:** the app version (from `package.json` at build time) and the build ID.

### Acceptance criteria

- [ ] e2e (built app): Settings shows the English title "Settings" and all five sections by default (AC-21 part, as proposed to be reworded).
- [ ] e2e, **offline**: switching to Kiswahili re-renders the whole UI in `sw` with no reload. The Settings title, the bottom nav labels and the Muhtasari title all show their `sw` dictionary values (asserted against the dictionary, not hard-coded words), and "Faida Halisi" is unchanged. No request to `/api/*` is made.
- [ ] e2e, offline: after switching to Kiswahili, a full reload and a lock/unlock both keep Kiswahili (persisted in device `meta.locale`). Switching back to English persists the same way.
- [ ] e2e: a fresh device with no `meta.locale` shows English.
- [ ] e2e: Change PIN with a wrong current PIN doesn't reach `/set-pin`. With the right one it does, and the new PIN unlocks afterwards. Five wrong current PINs start the same 30 s wait as `/lock`.
- [ ] e2e: Lock now → `/lock`.
- [ ] e2e: "Redo onboarding answers" and "Bring in your notebook" navigate to `/onboarding` and `/notebook` (URL assertion only; no Phase 2 dependency).
- [ ] e2e: offline, "Back up now" is disabled and "Offline" shows. Online, with `/api/sync/push` mocked, tapping it drains the queue and the status reads `Backed up`.
- [ ] Unit: the "not backed up for 3 days" state is driven by the same oldest-unsynced rule as the banner (A5).
- [ ] lint, typecheck, test and build pass.

### Blocked by

- A4 (PIN, `/set-pin`, lock, backoff)
- A5 (`flush`, `useSyncStatus`)
- Task 1 (`useBusinessHeader`; code against the stub, merge after Task 1)
- A2 shell (#17)

## Task 5: P4-5 (AC-33): Full Gikomba day e2e

### Parent

#5 (Phase 4). New check **AC-33** (proposed by the Phase 3 spec), branch `feat/ac33-gikomba-day-e2e`. Agent `qa`, default model.

### What to build

A test that plays out a whole Gikomba day offline, the way a merchant would, and proves that every screen agrees with a hand-calculated sheet. Integration breaks are caught before Monday.

`e2e/gikomba-day.spec.ts` against `pnpm build && pnpm start`, in the default English UI. The fake clock is fixed to **Mon 2026-10-26** EAT, and the network is off after unlock. The fixture values below are **test data**, not business facts. Mayai's buying price and low-stock threshold are fixture values chosen so that, on the mayai sales, only the price warning fires (step 6) and the low-stock row appears at the end.

Setup: through onboarding and the notebook UI (Phase 2) at 06:30:
- items: sukuma wiki (goods, kilo, fractional, sell 50, buy 30, low-stock threshold 5); mayai (goods, tray, whole, sell 420, buy 250, low-stock threshold 8); Trip Gikomba–Town (service, trip, 200);
- opening stock: 10 tray mayai and 20 kilo sukuma wiki, entered as **two `stock_adjustment` txns** (one per notebook stock row, as the Phase 2 notebook commits them);
- Otieno owes 500, with no due date.

| # | Time | Action | Expected after the step |
|---|---|---|---|
| 1 | 07:10 | 3 kilo sukuma @ 50, cash | sukuma 17 |
| 2 | 07:40 | 2.5 kilo sukuma @ 50, M-Pesa, code entered | sukuma 14.5 |
| 2b | 07:41 | the same sale entered again by mistake | `POSSIBLE_DUPLICATE` issue shows; saved with the taps its default B1 level needs (first tap if warn, "Save anyway" if block); sukuma 12 |
| 3 | 08:15 | Trip Gikomba–Town 200, M-Pesa | no stock change |
| 4 | 09:00 | Wanjiku (new customer): 1 tray mayai @ 420, paid 100 cash, due chip Friday | Wanjiku owes 320, due 2026-10-30; mayai 9 |
| 5 | 09:30 | Expense ushuru 50, cash | — |
| 6 | 11:00 | Walk-in: 1 tray mayai @ 280, cash | `PRICE_VARIANCE` warning, saves on the first tap; mayai 8 |
| 7 | 13:20 | Otieno pays 300, M-Pesa | Otieno owes 200 |
| 8 | 15:00 | Void sale 2b from Sales | struck through, "Voided"; sukuma 14.5 |

Final expected values:
- **Muhtasari and Leo totals:** Sales **1,175**, Cost of goods **665**, Expenses **50**, **Faida Halisi 460**.
- **Money in:** Cash 530, M-Pesa 625, Other 0.
- **Today's flows:** deni given today 320; payments received 300.
- **Who owes:** total 520 (Wanjiku 320, Otieno 200), nobody overdue.
- **Stock:** sukuma wiki 14.5 kilo, mayai 8 tray.
- **Low stock:** Muhtasari's low-stock section shows exactly one row, mayai at 8 tray (8 ≤ threshold 8); sukuma wiki (14.5 > 5) is not listed. Bidhaa shows the "Low" tag on mayai only.
- **Leo:** 9 counted-or-voided entries plus the Brought forward group (Otieno 500, 2 opening stock rows).
- **Backup chip:** `Not backed up (18)`. Counted with B2's rule (queue entries whose table ≠ `lines`):
  - setup, 8: 1 merchant settings (onboarding confirm), 3 items, 1 customer (Otieno), 1 opening balance, 2 stock adjustments;
  - the day, 10: 6 sales (1, 2, 2b, 3, 4, 6), 1 expense, 1 payment, 1 void, 1 new customer (Wanjiku).

  If the built app writes a different number of setup entries (for example `saveSettings` enqueuing more than one row), the `qa` agent recounts against the B2 rule, updates the sheet with the reason, and the reviewer confirms. The assertion is never loosened to "any n".

The hand-calculated sheet (the table above with the arithmetic and the queue count shown) is committed as `e2e/fixtures/gikomba-day.md`, so the product owner can check it by hand.

### Acceptance criteria

- [ ] The spec passes against the built app, offline after unlock, and asserts every row of the table and every final value, including the low-stock section and `Not backed up (18)` (AC-33).
- [ ] Muhtasari and `/leo` show identical totals (AC-24 pattern on a full day).
- [ ] The test runs in CI's Playwright job, or is listed in the PR as run locally if CI has no browser job yet.
- [ ] lint, typecheck, test and build pass.

### Blocked by

- Task 2, Task 3
- P3-2 (ledger screens)
- Phase 2 P2-2/P2-3 (onboarding and notebook UI). If Phase 2 is cut back (Cut 2), seed the items, thresholds and openings through the fixture instead, recount the backup chip, and note it.

## Task 6: P4-6 (A6.2–A6.3): Integrate and deploy to production

### Parent

#5 (Phase 4). Blueprint **A6 tasks 2 and 3**, branch `feat/a6-production-deploy` (config and docs changes only; most of the work is operational). Agent `devops`, default model. Dev A lane.

### What to build

On Monday morning, the five merchants open one production URL that runs the integrated R0 build. Its database tables are already in place, so the first backup succeeds.

1. **Integration:**
   - Confirm every R0 ticket has merged in blueprint order (A3 → B2 → A4 → B3 → A5 → B4 → A6), each rebased on `main`.
   - Run the **full** Playwright suite (offline shell, PIN, ledger, onboarding, Muhtasari, Leo, Mipangilio, the Gikomba day) against `pnpm build && pnpm start` on `main`.
2. **Database (D-048, Prisma 8; only once D-048 is on `main`):**
   - Check that Neon `main` runs PostgreSQL 15 or newer.
   - Check that `prisma/contract.json` and `prisma/contract.d.ts` on `main` match `pnpm db:generate` (`prisma contract emit`).
   - Run **`pnpm db:migrate`** (`prisma db migrate`) against Neon `main` with `DIRECT_URL` **before** the production deploy.
   - Confirm `prisma` is pinned to exactly `8.0.0-rc.27`.
3. **Vercel production:**
   - region `fra1`, build command `pnpm build`;
   - production env vars: Clerk keys, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `DATABASE_URL` (pooled) and `DIRECT_URL` (unpooled);
   - promote `main`.
   - The Clerk development instance is acceptable for 5 pilot users (blueprint A3). Confirm the session lifetime is set to the plan maximum.
4. **Smoke on the production URL:**
   - a no-cookie `POST /api/bootstrap` returns **401, not 500** (AC-12 production part);
   - one signed-in push lands a row in Neon `main` with the right `business_id` (AC-17 server part).
5. Record in the PR the deployed commit SHA, the migration output and the env var **names** (never the values).

### Acceptance criteria

- [ ] CI is green on `main` at the deployed SHA (AC-01).
- [ ] The full Playwright suite output on the integrated build is pasted in the PR.
- [ ] `prisma db migrate` output against Neon `main` is pasted, and was run before the deploy (timestamps show the order).
- [ ] The production deployment is in `fra1`. The production URL loads and the service worker installs.
- [ ] `/api/bootstrap` with no cookie on production returns 401 (AC-12).
- [ ] A Neon query shows a pushed test row with the right `business_id`. The test business is deleted afterwards, or labelled as test data.
- [ ] No secret values appear in the PR, commits or logs (grep evidence pasted).

### Blocked by

- Every R0 task: Phase 0 #15–#18 (#20 and #22 if not cut), A3, A4, A5, B1, B2, Phase 2 P2-1 to P2-4, P3-1, P3-2a, P3-2, Tasks 1–4
- Task 5 (AC-33 passes before the deploy)
- Q-003 closed (who holds the Vercel, Neon and Clerk logins)
- **D-048 merged to `main`** (with A1a). If it isn't, the scrum-architect rewrites item 2 for D-037 before this task starts.

## Task 7: P4-7 (A6.5): Pilot kit docs

### Parent

#5 (Phase 4). Blueprint **A6 task 5** (RQ-14), branch `feat/a6-pilot-kit`. Agent `developer`, default model. Docs only (`docs/pilot/*`).

### What to build

The pilot coordinators carry everything they need to Gikomba on Monday:
- a step-by-step install guide with screenshots;
- a sheet for collecting phrases for the later AI work;
- the debrief questions for week 1 and week 4.

- `docs/pilot/install-guide.md`:
  - Chrome → Add to Home screen → sign in (privacy notice, email code or Google) → set PIN → onboarding;
  - how to switch the app to Kiswahili in Settings, for merchants who prefer it;
  - a "Forgot PIN" section (needs internet; carry a hotspot, R-004);
  - screenshots from the production URL, added after Task 6 (placeholders until then).
- `docs/pilot/model-test-collection.md`: how to collect phrases and noisy recordings (D-030), with **≥ 100 phrase slots** across sale, expense, payment, deni and service. Consent wording for recordings, and no real phone numbers or M-Pesa codes in examples.
- `docs/pilot/debrief.md`: the week-1 and week-4 questions mapped to spec §12 success measures, plus "Did the Today report match your notebook?", "Did you share it, and with whom?", "Which language did you use the app in, and why?" and the Q-007 borrowed-money question.

### Acceptance criteria

- [ ] All three files exist. The model-test sheet has ≥ 100 numbered phrase slots covering all five categories (AC-23).
- [ ] The install-guide screenshots come from the production build, or the PR lists them as a follow-up before 07:00 Monday.
- [ ] No personal data, real phone numbers or M-Pesa codes appear in any example.
- [ ] `pnpm lint` passes (Markdown isn't linted; this just confirms nothing else changed).

### Blocked by

- Task 6 (for screenshots only; writing can start immediately)

## Task 8: P4-8 (A6.4, A6.7): Acceptance run on real phones and tag

### Parent

#5 (Phase 4). Blueprint **A6 tasks 4 and 7**, branch `feat/a6-acceptance-run` (evidence only). Agent `qa`, default model; product-owner accepts.

### What to build

Evidence, check by check, that R0 works on the production URL on real Android phones, so the product owner can accept the sprint before the pilot starts.

- **Device check** on 2 real Android phones (one with 3 GB RAM), Chrome, production URL:
  - install;
  - sign-in;
  - PIN set and unlock;
  - onboarding;
  - offline sale;
  - switch to Kiswahili and back, offline;
  - reconnect → backup;
  - sign-in → first record, timed (target ≤ 10 min).
- **PIN unlock timing** on the 3 GB phone (blueprint A4 task 1). D-024 sets 150,000 PBKDF2 iterations. If unlock takes more than 800 ms, raise it to the product owner and architect: lowering it to 100,000 needs a **new decision superseding D-024**. This ticket records the timing and doesn't change the iterations.
- **R-010:** deploy a no-op change and confirm the update toast appears and reloads onto the new version on a phone.
- Run **every** `acceptance.md` check, AC-01 to AC-33, and record pass/fail/waived plus evidence (test name, screenshot, Neon query, timing) per check in the PR. Waivers follow the cuts applied and the acceptance.md Waivers list: Cut 1 waives AC-19; Cut 3a waives AC-28, and the customer-row part of AC-25 **only if OQ-4.9 is answered yes and acceptance.md is updated to say so**.
- Tag `v0.1.0-r0` once the product owner accepts. The product owner then updates `planning/STATE.md` (not this ticket).

### Acceptance criteria

- [ ] AC-13 to AC-22 pass on the production URL on a real phone, with evidence. AC-20's timings are measured on the 3 GB phone. AC-21 is checked in both English (default) and Kiswahili.
- [ ] AC-28: the real Android share sheet opens, and WhatsApp receives the plain text with the Faida Halisi figure and no customer names.
- [ ] AC-30: the sunlight check is done outdoors on the 3 GB phone for Muhtasari and Leo.
- [ ] Every check from AC-01 to AC-33 has a recorded pass, fail or waived (with the cut named) and evidence in the PR.
- [ ] The PIN unlock time and the sign-in-to-first-record time are recorded.
- [ ] The update toast is checked on a phone (R-010).
- [ ] The tag `v0.1.0-r0` exists on the accepted commit.

### Blocked by

- Task 6 (production deploy)
- Task 7 (AC-23)
- Q-002 closed (every merchant has a usable email or Google account)

## Cuts (blueprint order; only those touching this phase)

The scrum-architect applies these at the Sun 18:00 checkpoint, strictly in order. Cuts 0 to 2 belong to other phases but change what Task 8 records.

- **Cut 0: landing page** (Phase 0, #22). Task 8 records nothing extra; LockGuard sends phones with no account to `/sign-in`.
- **Cut 1: restore-by-pull** (Phase 1). Task 8 records **AC-19 as waived**.
- **Cut 2: onboarding reduced to name, type and items** (Phase 2). Task 5 seeds the payment methods and the due-rule default through the fixture. AC-15's time target still applies.
- **Cut 3: the `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE` rules** (Phase 3). Task 5 drops the step-2b and step-6 warning assertions. Waives no AC.
- **Cut 3a: the per-customer section and Share on `/leo`** (Task 3 items 3 and 4; Task 1 keeps `customers` and `formatDaySummaryText`, because they are cheap and already tested). The chronological list and the totals stay. **Waives AC-28.** It waives the customer-row part of AC-25 **only if OQ-4.9 is answered yes**; until then, applying Cut 3a means keeping "Customers today" and cutting only Share. Neither waiver is in acceptance.md's Waivers list yet (proposed edit below).
- **Cut 4: the Gharama list screen** (Phase 3). Expense void then lives only in Leo (Task 3's entry tap → `TxnDetailSheet`). **Valid only once Task 3 has merged with the expense-void e2e passing**; until then Cut 4 can't be applied. Waives no AC.

**Never cut:** offline save; PIN lock; push backup; **correct Faida Halisi and deni** (Task 1, Task 2, Task 5); the privacy notice; void (on sales, payments and opening balances in P3-2, on expenses in Task 3 or `/gharama`). The blueprint's "bilingual titles" item is superseded by D-049; **proposed replacement, needs owner confirmation:** "all copy through `t()` in both `en` and `sw`, English by default, with the language switch in Settings" (Tasks 2–4). The deploy (Task 6) and the acceptance run (Task 8) can't be cut either, because the pilot can't run without them.

## Open questions (owner or product-owner to answer before the named task starts)

- **OQ-4.1 (Task 1, Task 3):** What exactly does the shared text contain? RQ-15 lists the business name, date, Sales, Expenses, Faida Halisi, cash and M-Pesa in, and deni given. The spec example adds Cost of goods, Other, payments received, "customers owe you (all days)" and a "not counted as sales" line. Which is it?
- **OQ-4.2 (Task 3):** The customer-names switch: where does it sit (next to Share, or in a share sheet), and is the choice remembered on the phone or reset to off every time?
- **OQ-4.3 (Task 1, Task 3):** Should the Today list run oldest first, like a notebook page (the spec ASSUMPTION), or newest first, like the Sales list?
- **OQ-4.4 (Task 2):** What colour is the "Other" money-in segment? The tokens reserve Slate for M-Pesa, and the spec assumes Moss Grey. Or should "Other" be hidden from the bar when it's 0?
- **OQ-4.5 (Task 3):** "Everything recorded today" is read as "everything **dated** today" (the spec ASSUMPTION), so a backdated expense entered today doesn't appear in today's list. Confirm.
- **OQ-4.6 (Task 2):** Which photo, if any, goes in the day-1 empty state? It needs an `empty-state` manifest entry (#19). Without an answer the empty state has no photo.
- **OQ-4.7 (Task 1, Task 3):** What does a brought-forward **stock** row show in Leo: the quantity ("10 tray mayai"), the value at buying price (D-011), or both? A `stock_adjustment` has `totalAmount` 0.
- **OQ-4.8 (Task 1, Task 2):** What does "(n)" count in "See everything recorded today (n)"? Counted entries only, or also voids and brought-forward entries?
- **OQ-4.9 (blueprint, acceptance.md):** Cut 3a removes the per-customer section, but AC-25 checks Wanjiku's customer row. Should Cut 3a also waive that part of AC-25? Until answered, Cut 3a may remove only Share (see Cuts).
- **OQ-4.10 (Task 3):** The spec doesn't say what tapping an entry in the Today list does. Interim (ASSUMPTION): it opens the record's detail sheet, with Void when allowed. This matters because, after Cut 4, it is the only way to void an expense. Confirm, or say whether Leo should be read-only (in which case Cut 4 must be dropped from the cut list).
- **OQ-4.11 (Task 4):** Do wrong current PINs on Settings → Change PIN share the `/lock` failure counter and backoff (ASSUMPTION), or have their own?
- **OQ-4.12 (Task 1, Task 3; with OQ-3.13):** When the UI is in Kiswahili, is the shared WhatsApp summary also in Kiswahili (ASSUMPTION: it follows the UI language), and are dates written with Kiswahili day and month names? Who supplies those strings?

The language questions common to both phases are **OQ-3.12** (market words in the English UI vs D-049's interim) and **OQ-3.13** (must the `sw` dictionary be complete for the pilot, and who writes and validates the Kiswahili copy, Q-006). Both are in the Phase 3 plan.

## Proposed edits elsewhere (not made in this PR)

- **Blueprint B4:**
  - add `dayReport` (with `customers[].standing`), `formatDaySummaryText`, `moneyInShares`, `supplierDeniTotal`, `formatNairobiDate(day, locale)` and `useDayReport`/`useDashboard`/`useBusinessHeader` (Task 1, strongest model);
  - note that `/leo` is already in the A2 precache list;
  - Leo owns the entry tap into `TxnDetailSheet`.
- **Blueprint A6:**
  - replace `prisma migrate deploy` with `prisma db migrate` (D-048) once D-048 is on `main`, and add the check that the emitted contract is committed;
  - add the language switch to A6 task 1 (D-049);
  - add the AC-33 e2e before the deploy;
  - split A6 by specialist as in this plan.
- **Blueprint schedule:** see the Phase 3 plan (Phase 2 moves to Sun 14:00–18:00; P4-2 and P4-3 run in parallel).
- **Blueprint Cuts:** Cut 3a waives AC-28, and the customer-row part of AC-25 only if OQ-4.9 says yes. Cut 4 is valid only once Leo's expense tap has merged. Replace "bilingual titles" in Never cut with the D-049 wording (owner to confirm).
- **`acceptance.md`:**
  - **AC-21** (D-049): reword to "Every navigation label and page title shows in English by default (Overview, Sales, Debts, Expenses, More, Items, Settings, Today). After switching to Kiswahili in Settings, the whole UI, including nav labels and titles, shows the `sw` dictionary values with no reload, offline, and the choice survives a reload and a lock. Market words (D-005) are the same in both languages." (The exact English nav words follow the A1a `en` shell dictionary and OQ-3.12.)
  - **AC-29:** replace "its bilingual title reads 'Leo' with 'Today' beneath" with "its title reads 'Today' in English and the `sw` value in Kiswahili".
  - **AC-33:** reference the fixture sheet `e2e/fixtures/gikomba-day.md` (Sales 1,175; COGS 665; Expenses 50; Faida Halisi 460; Cash 530; M-Pesa 625; `Not backed up (18)`).
  - **Waivers:** add "Cut 3a waives AC-28" and, if OQ-4.9 is answered yes, "Cut 3a waives the customer-row part of AC-25".
- **`DECISIONS.md`:**
  - when answered, record OQ-4.1 (share text content) and OQ-4.2 (names switch) as decisions refining D-047;
  - record the "one payment method per sale" pilot assumption from the Phase 3 spec;
  - if the PIN timing fails, record a decision superseding D-024 (150,000 → 100,000 iterations);
  - when OQ-3.12 is answered, amend D-049's open market-words point so it agrees with D-005.
- **`QUESTIONS.md`:** add OQ-4.1 to OQ-4.12.
- **`STATE.md`:** note that the Phase 3 and 4 ticket plans exist and are awaiting the owner's OK.
- **Phase 4 spec:** the "Out of scope" list names a Mipangilio language switch; D-049 brings it into R0. Replace the bilingual title wording with D-049; the PIN line should say D-024 is 150,000 and that 100,000 needs a superseding decision.
