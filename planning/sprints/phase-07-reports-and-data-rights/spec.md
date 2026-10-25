# Phase 7: Ripoti and data rights (periods, ageing, offline PDF, share, read-back, export, delete)
> Release: R3 · Milestone: R3 Ripoti (sprint 004) · Depends on: phases 1-4 (R0), phase 5 (supplier deni, money out), phase 6 (stock loss, job sales) · Label: ready-for-agent

## Problem Statement
Muhtasari answers "how did today go?", but merchants also need to answer:

- "Did I make money this week or this month?"
- "Who has owed me for too long, and which suppliers am I late with?"
- "What sells best?"
- "Can I show my Chama or a microloan officer that my business is real?"

Paper notebooks can't answer these without an evening of arithmetic, and the only proof a merchant can carry to a Chama is the notebook itself.

There is also a legal gap. Spec §11 and the Kenya Data Protection Act principles (PRD §13.3) require that a merchant can take their data out and can have it deleted. R0 shows a privacy notice that promises "how to delete" (Q-001 interim), but there is no working export or delete.

## Solution
**Ripoti / Reports** (stitch-prompts §6.1), fully offline from Dexie:
- Period chips: Today, This week, This month, Custom (start and end date), in Africa/Nairobi days.
- **Profit:** Faida Halisi / Net profit as the hero figure with Sales, Cost of goods and Expenses aligned beneath, plus a separate "Stock loss" line if phase 6 decision P6-A keeps it out of profit.
- **Cash flow:** in and out by Cash, M-Pesa and Other (phase 5 money out).
- **Top items** by sales value, and a low-stock summary.
- **Deni ageing:** customer deni and supplier deni each split into Not due, 1 to 7 days, 8 to 30 days and Over 30 days overdue, as at the end of the period.
- Brought-forward balances labelled and excluded from profit (D-011).
- Actions: Download PDF, Share, Read aloud.

**Ripoti ya PDF** (stitch-prompts §6.2): an A4 report generated on the phone with no network, in under 5 s for a month on a 3 GB phone (spec §12), shareable through the Android share sheet (WhatsApp first) or saved.

**Read aloud:** the browser `speechSynthesis` in English reads a short spoken summary of the selected period. Hidden when the phone has no English voice.

**Data yako / Your data** in Mipangilio:
- **Export:** JSON (everything) and CSV (one flat file per record kind), built on the phone from local data, works offline.
- **Delete my business data:** needs internet and a fresh Clerk email code. It deletes all of the business's server rows and the Clerk user, then wipes local data and returns to `/welcome` (or `/sign-in`).

## User Stories
1. As a mama mboga, I want to see this week's Faida Halisi with sales, cost of goods and expenses, so that I know whether the week was worth it.
2. As a kiosk owner, I want to switch between today, this week, this month and a custom range, so that I can compare periods myself.
3. As a boda rider, I want my monthly report to show trip income against fuel and repairs, so that I know what the bike really earns me.
4. As a kiosk owner, I want cash in and out split by cash and M-Pesa, so that I can reconcile my till and my M-Pesa statement.
5. As a mama mboga, I want to see which items earned the most this month, so that I stock more of them.
6. As a kiosk owner, I want customer deni grouped by how overdue it is, so that I chase the oldest debts first.
7. As a kiosk owner, I want supplier deni grouped the same way, so that I pay the suppliers I am most late with before they cut my credit.
8. As a mama mboga, I want brought-forward balances labelled and kept out of profit, so that my first month doesn't look better than it was.
9. As a repair fundi, I want completed jobs counted in sales and parts in cost of goods, so that the report shows my real workshop profit.
10. As a mama mboga, I want to download a PDF of last month with no internet, so that I can show it at my Chama meeting.
11. As a kiosk owner, I want to share the PDF straight to WhatsApp, so that a loan officer gets it in seconds.
12. As a Chama treasurer, I want the PDF to show the business name, market, period, profit table, cash flow, deni ageing and top items, so that I can judge the merchant at a glance.
13. As a microlender, I want the PDF footer to say records were confirmed by the merchant and that brought-forward balances aren't profit, so that I know what the numbers do and don't claim.
14. As a mama mboga who prefers listening, I want the app to read my weekly summary aloud in English, so that I can hear it while serving customers.
15. As a kiosk owner, I want the report to load instantly offline, so that I can check numbers at the stall.
16. As a kiosk owner, I want a low-stock summary in the report, so that one screen tells me what to buy.
17. As a merchant, I want to export all my records as JSON and CSV, so that my data is mine and I can open it in a spreadsheet (DPA).
18. As a merchant, I want export to work offline and include records not yet backed up, so that nothing is left out.
19. As a merchant, I want to delete all my business data from Mazao's servers and this phone, so that I can leave cleanly (DPA).
20. As a merchant, I want deletion to ask me to export first, confirm with an email code and type my business name, so that I can't delete by accident or be deleted by someone holding my unlocked phone.
21. As a merchant, I want to be told plainly that deletion can't be undone and that unsynced records will be lost too, so that I decide with full information.
22. As a developer, I want every report number to come from pure domain functions over the ledger, so that the PDF, the screen and read-aloud can never disagree.
23. As a developer, I want the PDF library loaded only when the merchant taps Download, so that the report screen stays light on a 3 GB phone.
24. As a developer, I want the delete route to remove every business-owned row in one server transaction, so that a half-deleted business can't exist.
25. As a product owner, I want the report screen designed in Operate mode with a single clear hero figure and aligned tabular columns, so that it is credible to a Chama treasurer without looking like a generic dashboard template.
26. As a product owner, I want the export and deletion flows documented in the privacy notice, so that the R0 promise is kept and the ODPC answer (Q-001) can reference them.

## Implementation Decisions

### Domain module (pure functions)
- `periodRange(kind, today, custom?)` returns `[startISO, endISO)` in Africa/Nairobi days. ASSUMPTION: "This week" starts Monday; "This month" is the calendar month to date.
- `periodReport(range, data)` composes the existing range summary (phase 5) with new functions, the same way phase 4's `dayReport` calls `daySummary` and never recomputes it. It is the only input to the screen, the PDF and read-aloud:

```ts
type AgeingBucket = 'not_due' | 'd1_7' | 'd8_30' | 'over_30';
type PeriodReport = {
  range: { start: string; end: string };
  sales: Cents; cogs: Cents; expenses: Cents; faidaHalisi: Cents; stockLoss: Cents;
  flow: MoneyFlow;                                   // phase 5 shape
  topItems: { itemId: Id; name: string; sales: Cents; qty: number; unit: string }[]; // top 5 by sales value
  lowStock: { itemId: Id; name: string; onHand: number; threshold: number }[];
  customerAgeing: Record<AgeingBucket, Cents>; supplierAgeing: Record<AgeingBucket, Cents>;
  broughtForwardOpen: { customers: Cents; suppliers: Cents };
};
```
- **Ageing** reuses the FIFO open-deni functions (R0 `openDeni`, phase 5 supplier version) evaluated **as at the period end**. Days overdue = period end day − due date. An open item **with no due date** is bucketed by age since it was created (proposed decision P7-A). Overpayment credit is shown as a separate "In credit" total, not a negative bucket.
- `reportSpeech(report, businessName)` returns plain English sentences (amounts spoken as "Kenya shillings 28,450"), so read-aloud is testable without audio.
- `exportRows(data)` produces flat rows per record kind with amounts as KES decimal strings. This makes export a second sanctioned money-conversion boundary next to sync (AGENTS money rule says conversion happens only at the sync boundary), so it must reuse the same conversion functions and be recorded as a decision (P7-B).

### Local query API and client modules
- `usePeriodReport(range)` (live query over Dexie, no server data, D-019).
- **PDF module:** client-side, dynamically imported on tap. Library is the builder's choice (spec §15), chosen for size and Manrope embedding; it must render the same `PeriodReport` and the stitch-prompts §6.2 layout (header with business name, market and period, "Made with Mazao", tables, footer "All records confirmed by the merchant. Brought-forward balances are not counted as profit.", page numbers). Budget: < 5 s for a month of pilot-sized data on a 3 GB phone (spec §12).
- **Share:** Web Share with files when `canShare` allows it, otherwise a download. Plain-text sharing of a period summary reuses phase 4's summary text formatter and `shareSummary` fallback chain, generalised from a day to a period. Filename pattern `Mazao-<business>-<period>.pdf`, with no phone numbers in the filename.
- **Read aloud:** `speechSynthesis` with an `en-*` voice; the button is hidden when no English voice exists. Respects a "Read aloud" preference in the operating profile (PRD §8.12 "audio summary"), default on.
- **Export:** builds JSON (all local tables except the sync queue, AI drafts and PIN material) and CSV files (transactions with lines flattened, customers, suppliers, items, jobs). ASSUMPTION: CSVs are delivered as one zip; if the zip library is too heavy, CSVs are offered one by one.

### Screens and routes
- Static routes (D-041), precached: `/ripoti`, `/ripoti/pdf?period=…`, `/settings/data`.
- Zaidi adds Ripoti / Reports. Mipangilio gains "Data yako / Your data" (stitch-prompts translation table).
- **Design:** Operate mode with core tokens. One hero figure (Faida Halisi 36sp, tabular), three aligned columns, plain tables with tabular figures right-aligned, top-item bars with no background track, Slate only on M-Pesa. No KPI-card grids, no gradients, no donut charts, no eyebrow labels. An empty state for a period with no records may carry the one header illustration allowed here; the PDF has no imagery. Note "Reports work offline." shown once.

### Server and API contracts
- `POST /api/account/delete`:
  - `requireMember()`; also requires a Clerk session that was verified within the last few minutes (fresh email code), else 401 with `reauth_required`;
  - body `{ confirmBusinessName: string }`, which must match the server's business name;
  - in **one interactive transaction** deletes transaction_items, transactions, jobs, items, customers, suppliers, merchant_settings, business_members, the business and the profile; then deletes the Clerk user through the Clerk backend API;
  - returns `{ deleted: true }`. Logs only the business ID and row counts, never contents.
- Any later push from another device for that business fails membership and gets 403 (R0 behaviour), so data can't be resurrected.
- Client after success: clears the business Dexie database, the device account and the sync queue, signs out of Clerk and routes to `/welcome` (or `/sign-in` if the landing page was cut).
- **Schema changes vs R0:** none required. Foreign keys may gain `ON DELETE CASCADE` from business, which the architect decides (P7-C).

## Testing Decisions
- Good tests check figures and files a merchant or treasurer would read, not rendering internals.
- **Primary seam: domain functions** (`periodReport`, ageing, `reportSpeech`, `exportRows`), because every surface renders the same object.
- Domain tests (prior art: DOMAIN.md worked example, R0 B1 date tests):
  - The worked example as a one-day period gives the same report figures as the R0 Muhtasari test and phase 4's `dayReport` totals (a property test over generated ledgers, following phase 4's prior art).
  - A week spanning Sunday 23:30 EAT and Monday 00:30 EAT puts each record in the right day and week.
  - Ageing: credits due 3, 10 and 40 days before period end land in d1_7, d8_30 and over_30; a later payment allocated FIFO clears the oldest first; an item with no due date follows P7-A.
  - Brought-forward balances appear in ageing but never in sales or Faida Halisi.
  - `reportSpeech` for the worked example produces the expected sentence.
  - `exportRows` round-trips cents to "150.00" with the wire conversion.
- **Local query test:** `usePeriodReport` over fake IndexedDB equals the pure function result.
- **Route tests:** delete removes every row of one business and none of another; a stale session gets `reauth_required`; a wrong business name gets 400; a push after deletion gets 403.
- **Playwright on the built app:** offline, open Ripoti for this month and generate the PDF (assert a download or share event, and page count ≥ 1); the export produces a JSON file that parses and contains the seeded sale. A timed PDF check on a real 3 GB phone is a manual acceptance item.

## Out of Scope
- "Verified" or signed reports for lenders and any monetisation (phase 11).
- Kiswahili read-aloud and Kiswahili report text (D-004, D-032).
- Scheduled or emailed reports, charts beyond simple bars, tax reports (PRD §5.2).
- Server-side report generation; reports are client-only until phase 10 recompute.
- Import from CSV, partial deletion of single records (corrections remain void plus new record, D-018).

## Further Notes
- **Decisions the architect must record before building:**
  - **P7-A:** ageing of open deni with no due date (by age since creation, or a separate "No due date" column).
  - **P7-B:** export is a sanctioned money-conversion boundary that reuses the sync conversion functions (refines the AGENTS money rule and D-013).
  - **P7-C:** delete mechanism (cascade from business or explicit ordered deletes), whether the Clerk user is deleted (ASSUMPTION: yes), and what "deleted" means for Neon backups and point-in-time restore history.
  - **P7-D:** week start day.
- **Open questions:** **Q-001** (ODPC registration, data controller, and whether EU storage plus deletion within the Neon restore window satisfies the DPA) must be answered before this ships; Q-006 for "Ripoti ya PDF" and "Data yako".
- **Risks:** R-006 (DPA paperwork) is the main one; R-003 (a report that disagrees with Muhtasari destroys trust); performance of PDF on 3 GB phones (spec §12 target). New risk to log: `speechSynthesis` English voices may be missing or online-only on some Android phones.
