# Phase 4: Muhtasari dashboard, Today report & pilot readiness
> Release: R0 (pilot) · Milestone: R0 pilot, Gikomba, Mon 2026-10-26 · Blueprint steps: B4 task 1 (Muhtasari), A6 (Mipangilio, integrate, deploy, pilot kit), plus the new Today report (not yet a blueprint step; see Further Notes) · Depends on: Phase 0, Phase 1, Phase 2, Phase 3 · Label: ready-for-agent

## Problem Statement

The pilot asks one question: "Is Mazao faster than my notebook, and do the numbers match?" (requirements.md). Recording is only half of the answer. At the end of the day, and many times during it, the merchant needs to see what she actually earned, how much came in as cash and as M-Pesa, who owes her, and what is running low, in about three seconds, in direct sun, on a 3 GB Android phone. If that screen is cluttered, generic or slow, she will go back to paper even if every record is correct.

She also needs to check the day, not just its totals. A notebook lets her run a finger down today's page: who bought, who paid, who now owes. Without a chronological list for today that adds up to the same totals as the dashboard, she cannot reconcile Mazao against her memory or her M-Pesa messages, so she cannot trust Faida Halisi. Many merchants also report their day to someone else (a spouse, a business partner, a Chama treasurer), today by phone call or a typed WhatsApp message.

Finally, the pilot itself has to be ready: settings for PIN, backup and re-running setup; an integrated, deployed build on the production URL; the acceptance run on real phones; and the pilot kit the coordinators carry to Gikomba on Monday.

## Solution

1. **Muhtasari / Overview** (RQ-10, blueprint B4 task 1) is the home screen, designed in impeccable Operate mode for scanability first (Owner, 2026-10-24). Faida Halisi / Net profit today is the single hero figure, large and tabular. Directly beneath it, Sales, Cost of goods and Expenses are set as a short right-aligned statement that visibly adds up to the hero, not as three equal KPI cards. Then money in today by method, deni outstanding (who owes you, top 5, overdue first) and supplier deni brought forward, low stock, and quick actions: New sale, New expense, Record payment. A link row opens the Today report.
2. **Leo / Today report** (new in R0, Owner, 2026-10-24): a chronological list of everything recorded today (sales, expenses, payments received, deni given, voids, and brought-forward entries shown but excluded from totals), with totals that reconcile exactly to Muhtasari; a per-customer activity section for the day (who bought, who paid, who now owes); and a one-tap "Share today's summary" as plain text through the Web Share API, with a copy-to-clipboard fallback.
3. **Mipangilio / Settings** (RQ-13, A6 task 1): account email, change PIN, lock now; redo onboarding answers, bring in your notebook; backup status with "Back up now"; app version.
4. **Pilot readiness** (A6 tasks 2 to 7): merge in order, full Playwright suite on the integrated build, production deploy to Vercel `fra1` after `prisma migrate deploy` on Neon `main`, device checks on two real Android phones, the full acceptance.md run with evidence, the RQ-14 pilot kit docs, tag `v0.1.0-r0`.

All figures come from the same pure domain functions (`daySummary`, `customerBalance`, `openDeni`, `stockOnHand`) over the local ledger, so Muhtasari, the Today report and the shared text can never disagree.

## User Stories

1. As a mama mboga, I want Muhtasari to open first after I unlock, so that the first thing I see is how my day is going.
2. As a mama mboga, I want Faida Halisi / Net profit today as one big number in tabular figures, so that I can read my profit in three seconds in the sun.
3. As a kiosk owner, I want Sales, Cost of goods and Expenses listed under the profit as a small sum that adds up to it, so that I understand where the profit came from.
4. As a mama mboga who had a bad day, I want a loss to show clearly as a negative Faida Halisi with a minus sign, so that the number is honest.
5. As a mama mboga, I want money in today split into Cash, M-Pesa and Other (sale amounts paid plus customer payments), so that I can check my cash box and my M-Pesa balance (RQ-10, D-014).
6. As a mama mboga, I want deni given today shown separately from money in, so that credit is never mistaken for cash received.
7. As a mama mboga, I want "Wanaokudai / Who owes you" with the total, the number of customers and the top 5, overdue first, so that I know whom to ask for money today.
8. As a mama mboga, I want each who-owes-you row to open that customer's ledger, so that I can record a payment in two taps.
9. As a kiosk owner, I want the supplier deni I brought forward shown as one line, so that I remember what I owe even before Manunuzi arrives in R1.
10. As a mama mboga, I want goods at or below their low-stock threshold listed with how much is left (for example "Mayai: 1 tray left"), so that I restock in time.
11. As a mama mboga, I want New sale as a full-width primary button and New expense and Record payment beside each other below it, so that the most common action is the easiest to hit.
12. As a mama mboga on her first day, I want an empty state that says "No sales yet today. Record your first sale." with the New sale button, so that I know what to do.
13. As a mama mboga, I want Muhtasari to update the moment I save anything, even offline, so that I never wonder whether the record counted (AC-16).
14. As a mama mboga who keeps the app open past midnight, I want Muhtasari to roll over to the new day by itself, so that yesterday's sales do not inflate today (blueprint B2 `useToday`).
15. As a merchant who does not read Kiswahili, I want every title and key money label bilingual (Muhtasari / Overview, Faida Halisi / Net profit, Wanaokudai / Who owes you, Leo / Today, Mipangilio / Settings), so that I can use the dashboard without Kiswahili (D-040).
16. As a mama mboga using TalkBack, I want the hero figure announced as "Faida Halisi, net profit today, KES 1,340", so that the most important number is the first thing I hear.
17. As a mama mboga, I want to open "Leo / Today" from Muhtasari, so that I can check every record of the day.
18. As a mama mboga, I want today's records in time order (sales, expenses, payments received, voids), each with time, what it was and the amount, so that I can run my finger down the day like my notebook page.
19. As a mama mboga, I want each sale on deni in the Today list to show the customer and the deni amount in Maize, so that I see the deni I gave today.
20. As a kiosk owner, I want the Today totals at the top to be exactly the same numbers as on Muhtasari, so that I trust both screens.
21. As a mama mboga, I want a voided record in the Today list struck through and marked "Voided", and left out of the totals, so that my corrections are visible but do not count.
22. As a mama mboga who voided yesterday's sale this morning, I want the void listed today with a note that it changed yesterday's totals, not today's, so that today's figures still match Muhtasari.
23. As a mama mboga who brought in her notebook today, I want those entries shown under "Brought forward", not counted in today's sales or profit, so that my first day is not inflated (D-011).
24. As a mama mboga, I want a "Customers today" section listing each customer with activity today, with what they bought, what they paid and what they owe now, so that I know who bought, who paid and who now owes.
25. As a mama mboga, I want walk-in sales without a customer grouped as one "Walk-in" line in that section, so that the customer list stays short and still adds up.
26. As a mama mboga, I want a customer who paid off everything today to show "owes nothing now", and one who overpaid to show "in credit KES 100", so that the status is clear.
27. As a mama mboga, I want to tap a customer in "Customers today" to open their full ledger, so that I can see older deni too.
28. As a mama mboga, I want one "Share today's summary" button that opens my phone's share sheet with a plain-text summary, so that I can send it to WhatsApp in two taps.
29. As a mama mboga whose phone or browser cannot share, I want the summary copied to the clipboard with a message "Copied. Paste it in WhatsApp.", so that sharing still works.
30. As a mama mboga, I want sharing to work offline (the message waits in WhatsApp until there is signal), so that I can send my summary from the stall at closing time.
31. As a Chama treasurer reading a shared summary in WhatsApp, I want plain lines with the business name, the date, Sales, Cost of goods, Expenses, Faida Halisi, money in by method and deni outstanding, in "KES 1,250" format, so that I can read it without the app.
32. As a Chama treasurer, I want the summary to state that brought-forward and deni amounts are not counted as sales, so that I do not misread the figures.
33. As a mama mboga, I want customer names left out of the shared text unless I switch them on, so that I do not expose my customers' debts by accident.
34. As a mama mboga who cancels the share sheet, I want nothing else to happen, so that cancelling is not treated as an error.
35. As a boda rider, I want the Today report to show my trips as sales with no cost of goods, and fuel as an expense, so that my Faida Halisi makes sense for a service business.
36. As a mama mboga, I want the Today report to open offline from a cold start, so that I can review my day in a dead zone (AC-09 pattern).
37. As a mama mboga, I want Mipangilio to show my email, change PIN, lock now, redo onboarding, bring in your notebook, backup status with "Back up now" and the app version, so that I can manage Mazao myself.
38. As a mama mboga, I want "Back up now" disabled offline with "Offline" shown, and "Not backed up for 3 days" in Tomato when it is true, so that I know when to find a network (D-021).
39. As a mama mboga, I want change PIN to ask my current PIN first, so that nobody holding my phone can change it.
40. As a pilot coordinator, I want an install guide with screenshots (Chrome, Add to Home screen, sign in, PIN), so that I can help five merchants install on Monday morning (RQ-14).
41. As a pilot coordinator, I want a model-test collection sheet with at least 100 phrase slots across sale, expense, payment, deni and service, so that we gather R4 material on Monday (AC-23, D-030).
42. As a pilot coordinator, I want debrief questions for week 1 and week 4 mapped to the spec section 12 success measures, including whether the Today report matches the merchant's notebook, so that we measure trust.
43. As a pilot coordinator, I want to carry a phone hotspot, so that a merchant who forgets her PIN can reset it at the stall (R-004).
44. As a developer, I want the full Playwright suite run against the integrated production build before deploy, so that integration breaks are caught before Monday.
45. As a developer, I want `prisma migrate deploy` run on Neon `main` before the production deploy, so that the first sync does not fail on a missing table.
46. As a developer, I want the acceptance run recorded check by check with evidence in the A6 PR, so that the product owner can accept the sprint against acceptance.md.
47. As a developer, I want Muhtasari and the Today report verified with impeccable critique and polish at 360x800, so that the dashboards meet the owner's "impeccable taste" bar.

## Implementation Decisions

**Modules and interfaces**

- **Day report (domain, pure).** A new pure function in the domain summary module, `dayReport(txns, lines, customers, range)`, built on top of `daySummary` (it calls it, never recomputes it), so the totals are identical by construction. It adds the chronological entries and the per-customer activity. The shape encodes the reconciliation rules:

  ```ts
  type DayReport = {
    day: string;                          // YYYY-MM-DD, Nairobi
    totals: DaySummary;                   // exactly daySummary(txns, lines, range)
    deniGiven: Cents;                     // Σ (total − paid) of active sales with a customer in range
    paymentsReceived: Cents;              // Σ active customer_payment in range
    entries: Array<{
      txnId: Id;
      at: string;                         // occurredAt
      kind: 'sale' | 'expense' | 'customer_payment' | 'void' | 'brought_forward';
      amount: Cents;
      customerId?: Id;
      deni?: Cents;                       // sales only
      voided: boolean;                    // original voided: shown struck through, excluded
      countsInTotals: boolean;            // false for voided, voids, brought_forward
      voidsEarlierDay?: string;           // void today of a record dated another day
    }>;
    customers: Array<{
      customerId: Id | null;              // null = walk-in
      bought: Cents; paid: Cents; deniAdded: Cents;
      balanceNow: Cents | null;           // all-time customerBalance; null for walk-in
    }>;
  };
  ```

  - The day is the Nairobi business day by `occurredAt` (`nairobiDayRange(todayInNairobi())`), the same range Muhtasari uses. A backdated expense recorded today appears on its own day, not today. ASSUMPTION: the owner's "everything recorded today" is read as "everything dated today", because that is what reconciles with Muhtasari.
  - Voids follow `activeTxns` (blueprint B1): a voided original and its void are excluded from totals. A void made today of a record dated another day is listed with `voidsEarlierDay` and changes no figure for today.
  - `opening_balance` and `stock_adjustment` dated today are listed as `brought_forward`, never counted (D-011).
  - Customer `paid` = sale `amountPaid` for that customer plus their customer payments today; `deniAdded` = their sale remainders today; `balanceNow` = `customerBalance` over all time (D-019).
- **Summary text formatter (pure).** `formatDaySummaryText(report, business, strings, { includeCustomerNames })` returns plain text, built only from `formatKES` and i18n strings, with no markdown, no emoji and no em-dashes. ASSUMPTION on the exact wording; example for the DOMAIN.md worked example:

  ```
  Mazao, Leo / Today: Sat 24 Oct 2026
  Mama Wanjiku Mboga, Gikomba Market
  Sales: KES 350 (2 sales)
  Cost of goods: KES 90
  Expenses: KES 50
  Faida Halisi / Net profit: KES 210
  Money in: Cash KES 150, M-Pesa KES 200, Other KES 0
  Deni given today: KES 0
  Payments received today: KES 0
  Customers owe you (all days): KES 0
  Brought-forward amounts and deni are not counted as sales.
  ```

  `includeCustomerNames` defaults to false (ASSUMPTION, privacy default); when on, a "Customers today" block lists name, bought, paid, owes now.
- **Share action.** `shareSummary(text)`: if `navigator.share` exists, call it with the text; an `AbortError` (merchant cancelled) does nothing. Otherwise, or on any other error, `navigator.clipboard.writeText(text)` and a snackbar "Copied. Paste it in WhatsApp." If the clipboard is also unavailable, a sheet shows the text pre-selected for manual copy. No network is needed. The text is never logged or sent to Mazao's server (AGENTS.md "Privacy").
- **Queries.** `useDayReport(today)` wraps `dayReport` with `useLiveQuery`, like `useDaySummary` (blueprint B2). Screens never compute money.
- **Today screen** ("Leo / Today", static route `/leo`, ASSUMPTION on the route name; client page reading only Dexie, no dynamic segments, D-041). Layout: bilingual title and date; totals block identical in figures to Muhtasari; "Share today's summary" button; the chronological list (oldest first, so the day reads like a notebook page, ASSUMPTION); "Customers today"; "Brought forward" group at the end. Empty state: "Nothing recorded today yet." with New sale.
- **Muhtasari screen** (`/`). Order, top to bottom, at 360x800:
  1. Bilingual title "Muhtasari / Overview", date line, sync chip.
  2. Hero: "Faida Halisi" with "Net profit today" under it, the figure at 36sp bold tabular in Ink, no card. A negative figure shows a leading minus and stays Ink (Tomato is reserved for overdue, errors and destructive actions).
  3. Statement: three right-aligned tabular rows, Sales, less Cost of goods, less Expenses, aligned to the hero's right edge, so the arithmetic is visible.
  4. Money in today: one horizontal bar split Cash (Ink) and M-Pesa (Slate, its only permitted use) and Other (Moss Grey, ASSUMPTION), labels and amounts below each part. Deni given today is a separate Maize line, not a bar segment.
  5. "Wanaokudai / Who owes you": total and count, top 5 rows with left status bar (Tomato overdue, Maize due) plus text ("2 days overdue", "due kesho"), "See all deni".
  6. Supplier deni brought forward: one line, shown only when not zero.
  7. Low stock: rows "Mayai: 1 tray left", shown only when not empty.
  8. "Leo / Today" link row: "See everything recorded today (n)".
  9. Quick actions: full-width primary New sale; outlined New expense and Record payment side by side. Record payment opens the customer picker, then the payment sheet from Phase 3.
- **Mipangilio screen** (RQ-13, A6 task 1). Bilingual section titles Biashara / Business, Usalama / Security, Hifadhi / Backup, Kuhusu / About. Rows: business name and location; Redo onboarding answers; Bring in your notebook; Change PIN (verify current PIN, then the set-pin flow); Lock now; backup status ("Last backup: today 10:45. Nothing waiting.") with Back up now (`flush()`), disabled offline; app version.
- **Service worker.** `/leo` is added to the precache route list next to the existing R0 routes (A2), owned by Dev A's shell lane. This is the only change Phase 4 needs from another lane.

**Design rules (Owner, 2026-10-24)**

- impeccable Operate mode: the screen is a working tool first; scanability over decoration. Every block earns its place by answering a question the merchant has at the stall.
- Faida Halisi is the only hero figure. No three equal KPI cards, no cards inside cards, no decorative gradients or glows, no eyebrow label on every block, no decorative dots, no avatars, no emoji, no em-dashes (stitch-prompts.md "Do not").
- Bilingual titles and key money labels (D-040): Kiswahili 22sp semibold Ink, English 14sp Moss Grey beneath. Section titles use the same pattern but only where a Kiswahili term exists in the translation table; others are English.
- Tokens: Manrope only, tabular figures on every amount, Chalk background, Surface rows, Ink text, Sukuma Green only for the primary button, active nav and focus, Maize for deni, Tomato for overdue, Slate for M-Pesa only. 8 px radius, 48 px targets.
- Imagery: work screens stay clean. Muhtasari and Today may use one optimised photograph (AVIF or WebP, at most 150 KB, precached) only in the day-1 empty state; never behind figures.
- Loading uses skeleton rows shaped like the real rows; no spinners over content. Reduced motion turns transitions into cross-fades.
- Verified with impeccable critique and polish at 360x800 on Muhtasari and Today, in a sunlight-contrast check, before the A6 acceptance run.

**Pilot readiness (A6)**

- Merge order A3, B2, A4, B3, A5, B4, A6, each rebased on `main`; the Today report merges with B4 or as its own PR after B4 (see Further Notes).
- Production: Vercel `fra1`, production env vars, `pnpm db:migrate` against Neon `main` before deploy (D-035, D-037).
- Device check on 2 Android phones (one 3 GB): install, sign-in, PIN unlock timing (lower PBKDF2 iterations to 100,000 if over 800 ms and record it in DECISIONS, blueprint A4), onboarding, offline sale, reconnect to backup, sign-in to first record within 10 minutes.
- Pilot kit (RQ-14): install guide with screenshots, model-test collection sheet (at least 100 phrase slots), debrief questions mapped to spec section 12. The debrief adds: "Did the Today report match your notebook?" and "Did you share it, and with whom?".
- The landing page at `/welcome` belongs to Phase 0 and is the first cut (D-044, blueprint Cut 0).

## Testing Decisions

A good test checks external behaviour only: given records committed through the save path, what totals, rows and text the merchant gets. It never inspects component state or hook wiring.

**Seam 1, data behaviour (Vitest with fake-indexeddb):** commit records through the local commit API, then read through the query layer (`useDaySummary`, `useDayReport` underlying functions) and the summary text formatter.
- Worked example (DOMAIN.md): Today report totals equal Muhtasari's: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents, cash 15000, M-Pesa 20000; three entries in time order; one "Walk-in" customer line (AC-03 prior art).
- Deni scenario: Wanjiku 300 paid 100, then payment 150: her customer line shows bought 300, paid 250, owes now 50; void the payment: paid 100, owes now 200, the payment entry is struck through, totals still equal `daySummary` (AC-04 prior art).
- Opening balance Otieno 500 and opening stock today: listed as brought forward, Sales 0, Faida Halisi 0 (AC-05 prior art).
- Property: for any generated set of R0 transactions, `dayReport(...).totals` deep-equals `daySummary(...)`, and the sum of counted entries per kind equals the matching total.
- A void today of a sale dated yesterday: listed with `voidsEarlierDay`, today's totals unchanged, yesterday's totals reduced.
- A record at 00:30 EAT counts in that EAT day.
- Summary text: contains the Faida Halisi figure in "KES" format, no customer names by default, no em-dash or en-dash characters, and names only when the option is on.

**Seam 2, screens (Playwright against `pnpm build && pnpm start`, offline after unlock):**
- Muhtasari after the worked example shows 210 as the hero and the statement 350, 90, 50.
- Today report shows the same figures and the three entries; `/leo` opens cold offline.
- Share: with `navigator.share` stubbed, the shared text contains "Faida Halisi"; with it absent, the clipboard holds the text and the snackbar shows.
- Mipangilio: Back up now disabled offline; change PIN requires the current PIN.

**Visual and device checks:** impeccable critique and polish on Muhtasari and Today at 360x800; the full acceptance.md run on the production URL on a real Android phone (AC-13 to AC-22).

**Prior art:** acceptance.md AC-03, AC-04, AC-05, AC-09, AC-16, AC-17, AC-21; blueprint B4 Verify and A6 Verify; DOMAIN.md worked example (350 / 90 / 50 / 210) and deni scenario (200, 50, 200).

## Out of Scope

- Ripoti: weekly, monthly or custom periods, deni ageing reports, top-selling items, PDF, read-aloud, Chama or microloan verified reports (Phase 7, R3).
- Reports for days other than today (no Yesterday or date picker on the Today report in R0).
- Charts or trends of Faida Halisi over time.
- WhatsApp deni reminders to customers ("Share reminder" in Stitch 3.12), SMS, or any server-side sending.
- Sharing as an image or file; only plain text.
- Mipangilio items shown in Stitch 3.14 but not in RQ-13: export my data, delete my business data (R3), accounts on this phone and switch account (D-039), lock-timeout setting, language switch, quick entry (R4).
- Purchases and cash out (R1); job-card dashboard lists (R2); AI model availability (R4).
- Server-side recomputation of balances (R6).

## Further Notes

- **Acceptance covered:** AC-01, AC-02 (domain coverage includes `dayReport`), AC-03, AC-05, AC-09, AC-13 to AC-23 through the A6 acceptance run, AC-21 (Muhtasari, Faida Halisi, Mipangilio titles).
- **Proposed new acceptance checks for the Today report and dashboards:**
  - **AC-24:** After the DOMAIN.md worked example, the Today report lists 3 entries in time order and shows Sales 350, COGS 90, Expenses 50, Faida Halisi 210, Cash in 150, M-Pesa in 200, identical to Muhtasari (unit and e2e).
  - **AC-25:** Deni scenario in the Today report: Wanjiku shows bought 300, paid 250, owes 50; after voiding the payment she shows paid 100, owes 200, the payment struck through as "Voided", and totals still equal Muhtasari.
  - **AC-26:** Opening balance and opening stock entered today appear under "Brought forward" and leave today's Sales and Faida Halisi at 0.
  - **AC-27:** A void made today of a sale dated yesterday appears in today's list, marked as changing yesterday's totals, and today's totals are unchanged.
  - **AC-28:** "Share today's summary" opens the Android share sheet on a real phone, and WhatsApp receives plain text with the Faida Halisi figure; on a browser without Web Share the text is copied with the "Copied" snackbar. Customer names are absent by default.
  - **AC-29:** `/leo` opens cold offline (added to the AC-09 route list) and its bilingual title reads "Leo" with "Today" beneath (added to AC-21).
  - **AC-30:** impeccable critique of Muhtasari and Today at 360x800 reports no blocking issues: one hero figure, no equal KPI card row, no decorative gradients or glows, AA contrast in a sunlight check.
- **Blueprint gap:** the Today report has no blueprint step and is not in requirements.md. It needs an RQ (proposed RQ-15) and a step (proposed as an extra B4 task after Muhtasari, Dev B lane, with the `/leo` precache entry in Dev A's lane). Given R-001, the owner should place it in the cut order; a natural split is the list and totals first, then customer activity, then share.
- **Questions:** Q-006 (native-speaker check for "Leo", "Wanaokudai", settings section names). Proposed new question: should shared summaries include customer names by default (privacy, Q-001 context)? Q-002 and Q-003 must be closed before the A6 deploy.
- **Risks:** R-001 (new scope late in the sprint), R-003 (mitigated: Today totals are `daySummary` by construction), R-009 (free tiers), R-010 (stale service worker after deploy; the update toast must be checked on the phones), R-004 (hotspot for forgot PIN).
- **Inconsistencies noticed:** Stitch 3.7 puts Deni inside the "Money in today" bar, but deni is not money in (DOMAIN.md, D-014); this spec keeps it as a separate line. Stitch 3.14 shows export/delete and several accounts per phone, which are out of R0 (D-039, R3).
