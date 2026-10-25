# Build prompts: demo, dashboards, landing and login

Owner brief (2026-10-25):
- Build the landing page and the dashboards with the design, taste and Apple-motion skills.
- Nothing may look like AI slop.
- There is a public "Try the demo" with mock data.
- There is a real sign-in.
- Sidebars collapse on wide screens.
- The six Gikomba photos are used.

## How to run these
1. Open a **fresh Claude Code session** in the repo root (or `/clear`).
2. Paste **one** prompt, exactly as written. Each prompt is one branch and one PR.
3. When the PR is reviewed and green, squash-merge it, then `/clear` before the next prompt.
4. Run them in order: each step says what it needs.

**If you are short of time before the pilot (Mon 2026-10-26):**
- Steps 0, 2, 2b, 3, 4 and 11 matter for the pilot.
- Steps 8 and 9 (supplier debts, analysis and projections) are post-pilot screens built ahead on mock data and can wait.

**How long:**
- Each build step is one agent session.
- Steps 1 and 12 are review passes and produce no feature code.

## Shared rules every prompt points to

### The photos (`public/images/stitch/`)
The photos are Stitch-generated, so the manifest source is `generated` and no consent reference is needed. All of them are 180–332 KB JPEGs, so step 2 turns them into AVIF/WebP of 150 KB or less before anything uses them.

| File | Size | Used for |
|---|---|---|
| `mama-mboga-stall.jpg` | 1200×896 | Landing hero; bento "Sell by kilo, fundo or tray"; `auth-background` (sign-in, lock) |
| `notebook-hands.jpg` | 1200×896 | Landing "Paper notebook vs Mazao"; `onboarding-background`; empty state of Debts |
| `gikomba-aisle.jpg` | 1376×768 | Landing offline story (full bleed, text below); Today report empty state |
| `duka-shelf.jpg` | 1024×1024 | Bento "Track stock that runs low"; Items empty state |
| `boda-rider.jpg` | 1024×1024 | Bento "Record trips and fuel" |
| `phone-fundi-kiosk.jpg` | 1024×1024 | Bento "Repair jobs with deposits"; demo entry screen |

Photos never sit behind numbers, form fields or tables. Text on a photo needs a flat, solid scrim (Ink at 70%), never a gradient.

### Taste rules (the anti-slop list)
These come from `docs/design/r0/DESIGN.md`, `docs/design/stitch-prompts.md` v3 and the skills. Follow all of them:
- **Tokens only:** Chalk, Surface, Line, Ink, Moss, Sukuma (the only action colour), Maize (deni), Tomato (overdue only), M-Pesa slate. They are the `@theme` utilities in `app/globals.css`. No raw hex in components.
- **Type:**
  - Manrope only.
  - Every amount uses tabular figures in the format `KES 1,250`.
  - The hero money figure is 36px bold.
  - No second font, no uppercase eyebrows, no letter-spaced labels.
- **Banned:**
  - gradients, glows, glassmorphism, purple or blue "AI" accents;
  - emoji, em-dashes, decorative dots, avatars, illustrations, icon soup;
  - cards inside cards;
  - three-equal-feature-card rows;
  - centred hero over a blurred background;
  - fake dashboards built from grey boxes;
  - logo walls, statistics, testimonials or star ratings (the pilot hasn't happened);
  - pills over photos, scroll cues, a "Get started →" arrow on every button.
- **Shape:**
  - 8px radius on buttons, inputs, chips, rows and cards; 16px on the top corners of bottom sheets only.
  - Tap targets are 48px or larger.
  - A primary button is filled and 52px tall.
- **Motion:**
  - Use the `apple-design` principles: purposeful, interruptible, spring-based.
  - Durations stay at 240ms or less.
  - Nothing loops.
  - Everything respects `prefers-reduced-motion`.
  - App screens: motion only for state changes (sheet open, number update, row insert). Landing page: MOTION_INTENSITY 3.
- **Copy:**
  - English only, one language per label (D-049, D-050). Strings go through `t(key)` in `i18n/en.*`, with the `sw.*` halves filled.
  - Plain words a market trader uses.
  - Item names and units stay as merchants say them: sukuma wiki, mayai, kilo, fundo, tray, M-Pesa.
- **Numbers:** the money maths lives in `domain/` or in pre-computed mock data, never in a component (AGENTS.md).
- **Phone first:** design at 360×800, then 1280. The target is a 3 GB Android phone running Chrome. Keep the JS small and lazy-load the heavy screens.
- **Proof, not claims:** every visual step ends with screenshots at 360px and 1280px saved in the PR. `impeccable critique` must find no P0 or P1 issues before merge.

### Navigation (D-052, written in step 0)
- **Under 1024px:** the bottom nav (`ui/shell/BottomNav.tsx`).
- **1024px and wider:** a left sidebar that **collapses** to a 72px icon rail and expands to 240px with labels.
  - The choice is remembered in `localStorage` under `mazao.sidebar`, read after mount, with no layout jump.
  - Same items: Overview, Sales, Debts, Expenses, then a "More" group (Items, Suppliers, Analysis, Settings).

---

## Step 0: Decisions and product context
**Agent:** `product-owner`, then `impeccable init`. **Branch:** `docs/design-decisions-demo`.

```
Read AGENTS.md, planning/STATE.md, planning/DECISIONS.md (D-040, D-049, D-050), planning/DOMAIN.md and docs/design/build-prompts.md (this plan).

1. As the product-owner agent, add these decisions to planning/DECISIONS.md, each with Why and Scope:
   - D-051 Public demo mode: the landing page has "Try the demo".
     - It opens the app at /demo with a fictional Gikomba merchant's last 28 days of mock data.
     - No sign-in. Nothing is written to Dexie or sent to the server. A persistent demo bar has "Exit demo" and "Start free".
     - Any save action opens a sheet: "This is a demo. Start free to record your own sales."
   - D-052 Collapsible sidebar from 1024px (partly supersedes D-040).
     - The bottom nav stays under 1024px. The sidebar collapses to a 72px icon rail and expands to 240px.
     - Items: Overview, Sales, Debts, Expenses; More group: Items, Suppliers, Analysis, Settings.
   - D-053 Dashboards ahead on mock data.
     - Overview, Today, Sales, Items, Debts and the customer ledger, Suppliers (supplier debts and pending supplies), and Analysis (sales analysis and projections) are built now as finished UI.
     - They read typed mock data shaped exactly like the Phase 4 read-model contract (planning/sprints/phase-04-dashboard-and-daily-report/plan.md, Task 1, useDashboard and useDayReport).
     - Phase 4 swaps the source; screens do no maths.
     - Supplier and Analysis screens are post-R0 features shown in the demo only, hidden from the pilot nav until their phase ships.
   - D-054 Projection method (interim, to confirm):
     - The next 7 days' sales estimate is the average of the same weekday over the last 4 weeks, shown as a range (lowest to highest of those 4).
     - It is always labelled "Estimate from your last 4 weeks".
     - It is hidden with fewer than 14 days of records.
2. Add to planning/QUESTIONS.md: "What does 'pending supplies' mean to merchants?"
   - Interim for the demo: goods ordered from a supplier but not yet received, with the supplier, the items, the expected day, and any amount still owed.
3. Run the impeccable skill's `init` to write PRODUCT.md from AGENTS.md, DOMAIN.md, docs/design/r0/DESIGN.md and the Taste rules in docs/design/build-prompts.md:
   - platform: web (PWA, Android Chrome first);
   - users: Gikomba stall owners at a stall in sunlight, often one-handed; chama leaders on laptops.
4. Update planning/STATE.md. Open a PR "docs: D-051..D-054 demo, sidebar, mock dashboards, projections". No code.
```

## Step 1: Shape the screens (no code)
**Agent:** `frontend`. **Branch:** `docs/design-shape`. **Needs:** step 0.

```
Read PRODUCT.md, docs/design/r0/DESIGN.md, docs/design/stitch-prompts.md (§2.1 landing, §3.7–3.14, §4.1–4.2, §6.1), docs/design/build-prompts.md (Taste rules, Photos, Navigation) and planning/DECISIONS.md D-049 to D-054.

Use the impeccable skill's `shape` command twice. Write the results to files; do not write code.

1. docs/design/shape-dashboards.md (Operate mode):
   - one section per screen: Overview, Today report, Sales list, Items list, Debts list, Customer ledger, Suppliers (supplier debts + pending supplies), Analysis (sales analysis + projections), the demo bar and the demo save sheet;
   - for each: the job in one sentence, the 3-second read in sunlight, the layout at 360px and at 1280px (with the sidebar), states (empty, first day, offline, loading), and which mock fields it reads;
   - use the dataviz skill for the Analysis charts (form, colour, labels). Charts use tokens only: Ink for sales, M-Pesa slate for M-Pesa, Maize for deni, a dashed line and a band for the projection;
   - use the apple-design skill to name the 3–5 motions the app is allowed (sheet, sidebar collapse, number change, row insert), with spring values and reduced-motion fallbacks.
2. docs/design/shape-landing.md (Persuade mode):
   - start with the design-taste-frontend skill's one-line Design Read and the dials DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 4;
   - follow stitch-prompts §2.1 sections, rewritten in English only;
   - add a "Try the demo" secondary action in the header, the hero and the closing band;
   - phone frames show real screenshots of the demo screens (built in steps 4–7), never boxes;
   - place each photo as in the Photos table.
3. List anything the specs don't answer under "Questions for the owner" at the end of each file.

Open a PR "docs: shape dashboards and landing". I will read the shapes before the build steps.
```

## Step 2: Imagery pipeline with the six photos (#19)
**Agent:** `frontend`. **Branch:** `feat/p0-imagery-pipeline`. **Needs:** step 0.

```
Implement Task 5 (#19, "Imagery pipeline and manifest check") of planning/sprints/phase-00-design-system-and-landing/plan.md, test-first, exactly as written.

Source images: the six files in public/images/stitch/ (source 'generated', consentRef null).
- Use the roles and placements from the Photos table in docs/design/build-prompts.md.
- Write focal points by looking at each image (the face or the hands are the focus).
- Alt text goes through i18n (en and sw).
- Outputs: AVIF and WebP at 720px, plus 1280px for landing roles; each file 150 KB or less, metadata stripped. Keep the JPEG sources only as pipeline inputs, outside the precache.

Verify with the Task 5 acceptance list, paste the manifest summary (id, role, bytes per variant, scrimContrast) in the PR, and close #19.
```

## Step 2b: Installable PWA that opens offline (#18)
**Agent:** `frontend`. **Branch:** `feat/a2-pwa-offline`. **Needs:** nothing new (#17 is merged).

```
Implement Task 4 (#18, "Installable PWA that opens cold offline") of planning/sprints/phase-00-design-system-and-landing/plan.md exactly. Routes are the English ones from D-050; take the list from e2e/shell.spec.ts. Add /demo and /welcome to the precache once those exist (steps 3 and 10 add their own entries).

Make the icons from the Mazao wordmark in Ink on Chalk, with no gradient and no illustration. Theme and background colours come from the tokens in app/globals.css.

Verify the Task 4 acceptance list, including the cold-offline Playwright test and "no /api or Clerk response in Cache Storage". Close #18.
```

## Step 3: Demo data, demo mode and the collapsible sidebar
**Agent:** `frontend` (with `backend` reviewing the data shapes). **Branch:** `feat/demo-mode-sidebar`. **Needs:** steps 0 and 1.

```
Read AGENTS.md, PRODUCT.md, planning/DECISIONS.md D-051 to D-054, docs/design/shape-dashboards.md, docs/design/build-prompts.md (Taste rules, Navigation), and the Phase 4 Task 1 contract in planning/sprints/phase-04-dashboard-and-daily-report/plan.md.

Build test-first (superpowers:test-driven-development):

1. demo/ (repo root):
   - demo/types.ts: the read-model shapes from the Phase 4 contract (DaySummary, DayReport, DeniList, Dashboard), plus SalesAnalysis, Projection, SupplierDebt and PendingSupply shaped the way shape-dashboards.md needs. Comment on each: "mirror of the Phase 4 contract; replaced by domain types".
   - demo/merchant.ts: one fictional merchant, "Achieng's Greens & Eggs, Gikomba".
     - 28 days of records in integer cents: sales of sukuma wiki (fundo), mayai (tray), tomatoes (kilo); cash and M-Pesa; expenses (ushuru, transport); 6 customers on deni (2 overdue); 2 suppliers, one owed; 2 pending supplies; low stock on mayai.
     - Totals are pre-computed and stored. No maths in components.
     - Today matches DOMAIN.md's worked example plus extra rows.
   - demo/merchant.test.ts: the fixture is internally consistent: every day's totals equal the sum of its entries, Faida Halisi = sales − COGS − expenses, every customer balance equals bought − paid, and the projection matches D-054 against the stored history.
2. ui/data/: the hooks the screens use, named as in the Phase 4 contract: useDashboard, useDayReport, plus useSalesList, useItems, useDeniList, useCustomerLedger, useSuppliers, useSalesAnalysis.
   - For now they always return demo data. One file, ui/data/source.ts, picks the source, so Phase 4 changes only that file.
   - In demo mode the source is always the mock, even after the real one exists.
3. Demo mode:
   - /demo is a static page:
     - phone-fundi-kiosk photo under a solid scrim;
     - title "See Mazao with a real day's numbers";
     - one line of copy;
     - a "Open the demo" button. It sets sessionStorage `mazao.demo = "1"` and goes to `/`.
   - In demo mode:
     - AppShell shows a Maize demo bar: "Demo with sample data. Nothing is saved." plus "Start free" (to /sign-in) and "Exit demo" (clears the flag, goes to /welcome);
     - every save button opens the demo sheet from D-051;
     - no Dexie write and no fetch happens (prove both in e2e).
4. Navigation (D-052):
   - ui/shell/Sidebar.tsx from 1024px, collapsible to a 72px rail with icon tooltips, toggle remembered in localStorage `mazao.sidebar`;
   - the bottom nav is hidden from 1024px;
   - motion: the width springs per shape-dashboards.md, with no motion under reduced-motion;
   - keyboard: the toggle is a button with aria-expanded; the rail shows labels as tooltips on focus;
   - pilot nav hides Suppliers and Analysis unless demo mode is on (D-053).
   - Update e2e/shell.spec.ts:
     - at 1280 the sidebar shows, collapses and the choice survives a reload;
     - at 360 the bottom nav shows and the sidebar doesn't.
5. All strings through t() with en and sw.

Verify: pnpm lint, typecheck, test, build and e2e. Paste screenshots at 360, 1024 (collapsed) and 1280 (expanded) in the PR.
```

## Step 4: Overview dashboard
**Agent:** `frontend`. **Branch:** `feat/ui-overview`. **Needs:** step 3.

```
Read PRODUCT.md, docs/design/shape-dashboards.md (Overview), docs/design/stitch-prompts.md §3.7 (rewritten in English), docs/design/build-prompts.md (Taste rules) and the hooks in ui/data/.

Use the impeccable skill (Operate mode; read its craft floor before editing) and the apple-design skill for the number-change and press feedback. Build the Overview at app/(app)/page.tsx from useDashboard():
- net profit today as the hero figure;
- Sales, Cost of goods and Expenses in three aligned columns;
- the money-in bar (cash Ink, M-Pesa slate) from the precomputed shares, with "Given on deni today" in Maize under it, never inside the bar;
- "Who owes you": top 5, overdue first, Tomato or Maize left bars;
- low stock;
- quick actions: New sale (primary), New expense and Record payment.

At 1280 with the sidebar, use a two-column layout (money left, people and stock right) in a 960px column. Show the first-day empty state, a skeleton, and "Not backed up (n)" offline.

Put reusable pieces in ui/ (Money, StatRow, DeniRow, MoneyInBar) with component tests. Components never calculate.

Before the PR, run `impeccable critique app/(app)/page.tsx` and fix every P0 and P1. Paste the critique score, plus screenshots at 360 and 1280 in sunlight-contrast mode (Chrome DevTools "emulate vision: none", 100% brightness).
```

## Step 5: Today report and Share
**Agent:** `frontend`. **Branch:** `feat/ui-today`. **Needs:** step 4.

```
Same reading list as step 4, plus planning/sprints/phase-04-dashboard-and-daily-report/plan.md Task 3 (Today report and share) and shape-dashboards.md (Today report).

Build /today from useDayReport():
- totals identical to the Overview (same mock object);
- the entries list, oldest first, with voided rows struck through and labelled;
- brought-forward rows marked as not counted;
- a per-customer section (walk-in for null).

The Share button uses the Web Share API with a plain-text summary taken from a pre-formatted mock string. In demo mode it shares as normal, because it saves nothing.

Empty state: the gikomba-aisle photo above the empty message, never behind it.

Reuse the ui/ pieces from step 4. Run impeccable critique, fix P0 and P1, and paste screenshots at 360 and 1280.
```

## Step 6: Sales and Items lists
**Agent:** `frontend`. **Branch:** `feat/ui-sales-items`. **Needs:** step 4.

```
Read shape-dashboards.md (Sales list, Items list), stitch-prompts §3.9 and §3.13, and the Taste rules.

Build:
- /sales from useSalesList(): today by default, with a day switcher (previous and next day, plus a date sheet); rows show time, items, amount and the payment method chip; a day total is pinned at the top; the New sale button stays visible.
- /items from useItems(): search, then a list with name, unit, price, on hand and a low-stock Maize marker; "Add item" opens the demo sheet in demo mode; empty state with the duka-shelf photo.
- At 1280, both become tables (sticky header, tabular numbers, right-aligned money).

Lazy-load the date sheet. Run impeccable critique and audit (a11y, 200% text at 360px). Fix P0 and P1. Add screenshots.
```

## Step 7: Debts and the customer ledger
**Agent:** `frontend`. **Branch:** `feat/ui-debts`. **Needs:** step 4.

```
Read shape-dashboards.md (Debts, Customer ledger), stitch-prompts §3.11 and §3.12, planning/DOMAIN.md (deni terms) and the Taste rules.

Build:
- /debts from useDeniList(): the total owed and the customer count; overdue first; each row shows the name, amount, due date or days overdue (Tomato only when overdue), with Maize for due soon.
- /debts/customer?id= from useCustomerLedger(id): the running balance per entry; "in credit" when the customer has overpaid; a "Record payment" sheet, which in demo mode shows the demo sheet instead of saving.
- Empty state on /debts with the notebook-hands photo above the message.

The id stays in the query string (D-041). Run impeccable critique, fix P0 and P1, and paste screenshots at 360 and 1280.
```

## Step 8: Suppliers: supplier debts and pending supplies (post-R0, demo only)
**Agent:** `frontend`. **Branch:** `feat/ui-suppliers`. **Needs:** step 4 and the answer to the "pending supplies" question (or its interim).

```
Read D-053, the pending-supplies question in planning/QUESTIONS.md, stitch-prompts §4.1 and §4.2, shape-dashboards.md (Suppliers) and the Taste rules.

Build /suppliers from useSuppliers() with two sections:
- "You owe suppliers": the total, then each supplier with the amount and the oldest unpaid date;
- "Supplies to receive": supplier, items, expected day and any amount still owed, with late ones in Maize.

Also build /suppliers/supplier?id= for one supplier's history.

It is reachable from the sidebar and More drawer in demo mode only (D-053). Run impeccable critique, fix P0 and P1, and add screenshots.
```

## Step 9: Analysis and projections (post-R0, demo only)
**Agent:** `frontend`. **Branch:** `feat/ui-analysis`. **Needs:** steps 3 and 4.

```
Read D-054 (projection method), shape-dashboards.md (Analysis) and the Taste rules. Load the dataviz skill before writing any chart code.

Build /analysis from useSalesAnalysis():
- the period switch: 7 days, 28 days;
- daily sales as columns, with M-Pesa share shown in slate;
- net profit per day as a line;
- the best-selling items as a ranked list with bars;
- busiest days of the week;
- the projection for the next 7 days as a dashed line with a lighter range band, labelled "Estimate from your last 4 weeks", hidden with fewer than 14 days of data.

Charts:
- Hand-written SVG; no chart library unless it is under 15 KB gzipped (justify it in the PR).
- Tokens only. Tabular axis labels in KES.
- Each chart has an accessible table alternative.
- At 360px, charts scroll horizontally only if unavoidable; prefer fewer bars.

Lazy-load the whole route. Run impeccable critique and audit, fix P0 and P1, and add screenshots.
```

## Step 10: Landing page at /welcome (#22)
**Agent:** `frontend`. **Branch:** `feat/a6-landing-welcome`. **Needs:** steps 2–7 (real screenshots for the phone frames).

```
Implement Task 7 (#22, "Landing page at /welcome") of planning/sprints/phase-00-design-system-and-landing/plan.md, with these owner changes:
- English only (D-049, D-050). The primary action is "Start free" (to /sign-in); the secondary action "Try the demo" (to /demo) sits in the header, the hero and the closing band (D-051).
- Follow docs/design/shape-landing.md and the Photos table in docs/design/build-prompts.md. Use the step 2 pipeline outputs, not the raw JPEGs.
- Phone frames show real screenshots of the demo Overview and Debts screens. Capture them with Playwright at 360×800 from the built app, saved through the image pipeline. Never fake them with boxes.

Skills, in this order:
1. design-taste-frontend: Persuade, dials 6 / 3 / 4. State the Design Read first. Run its pre-flight check before the PR.
2. impeccable: read the craft floor; then `critique` and `audit` on /welcome; fix all P0 and P1.
3. apple-design: hero entrance and press states only, 240ms or less, none under reduced motion.

Also build /privacy (static, precached) per the plan.

Verify the full Task 7 acceptance list. That includes:
- axe with no AA violations at 360 and 1280;
- 200% text at 360 with no horizontal scroll;
- no Clerk or /api request on /welcome;
- below-the-fold images lazy.

Paste the pre-flight checklist, the critique scores, Lighthouse (performance, accessibility) and screenshots at 360 and 1280. Close #22.
```

## Step 11: Real sign-in (Clerk)
**Agents:** `devops`, then `backend`, then `frontend`. **Needs:** Clerk instance keys in `.env`.

Run these as three prompts, one PR each.

**11a: Clerk instance and keys** (`devops`, branch `chore/clerk-init`)
```
Using the clerk-cli and clerk-setup skills, link this repo to the Clerk app app_3L8uFOUNkjToZiKTMKFjuraVa69:
- enable email code and Google;
- set the sign-in URL to /sign-in and the after-sign-in URL to /set-pin;
- pull the development keys into the git-ignored .env, and add the variable names (no values) to .env.example;
- run `clerk doctor` and paste its output.

Don't write the provider or proxy; that is 11b and 11c. Read planning/sprints/phase-01-auth-and-data-foundation/plan.md first so the settings match Tasks 2 and 3.
```
**11b: Server contract and bootstrap** (`backend`, branch as in the plan)
```
Implement Task 2 (P1-2) of planning/sprints/phase-01-auth-and-data-foundation/plan.md exactly, test-first, including proxy.ts and requireMember(). Verify with its acceptance list.
```
**11c: The sign-in screen** (`frontend`, branch `feat/a3-sign-in-privacy`)
```
Implement Task 3 (P1-3) of planning/sprints/phase-01-auth-and-data-foundation/plan.md exactly.

Design:
- mama-mboga-stall as the auth-background under a solid scrim;
- the content on a solid Surface panel;
- Clerk's <SignIn /> styled with the appearance prop using our tokens (clerk-custom-ui skill): Manrope, 8px radius, Sukuma primary, no Clerk branding colours;
- the "Start free" and "Sign in" links from /welcome land here;
- "Try the demo" is a quiet text link under the panel.

Run impeccable critique on /sign-in and fix P0 and P1. Use the clerk-testing skill for the Playwright parts. Verify the Task 3 acceptance list.
```

## Step 12: Anti-slop review of everything
**Agent:** `reviewer`, then `frontend` for the fixes. **Branch:** `fix/design-review`. **Needs:** steps 3–11.

```
Review the whole app and landing page, not one diff:
1. Run impeccable `critique` on /welcome, /demo, /, /today, /sales, /items, /debts, /debts/customer, /suppliers, /analysis and /sign-in, at 360 and 1280. Then run impeccable `audit` (a11y, perf, responsive) on the same routes.
2. Run design-taste-frontend's pre-flight on /welcome again.
3. Check every screen against the Taste rules in docs/design/build-prompts.md. Grep for violations:
   - raw hex in components;
   - `gradient`;
   - em-dashes in i18n;
   - hard-coded UI strings;
   - maths on money inside app/ or ui/;
   - `useMemo`, `useCallback` or `memo`.
4. Write docs/design/review-2026-10.md: a table of route, finding, severity and fix.

Then, as the frontend agent, fix every P0 and P1 in one PR with before and after screenshots. Re-run critique until no P0 or P1 remains (at most two passes).
```

## Step 13: QA and state
**Agent:** `qa`. **Needs:** step 12.

```
Against the production build (pnpm build && pnpm start), and on the preview URL if one exists:
- run all Playwright suites;
- the demo journey: /welcome → Try the demo → every dashboard → a save attempt shows the demo sheet → Exit demo. Assert no IndexedDB write and no /api request in demo mode;
- cold offline: every route opens with the network off after the first visit;
- the sidebar collapses at 1280 and the choice persists; the bottom nav shows at 360;
- Lighthouse on /welcome and / (performance and accessibility of 90 or more on mobile).

Then do a real Android phone check in sunlight: read net profit in 3 seconds, and every tap target is easy one-handed.

Record the evidence in planning/sprints/phase-00-design-system-and-landing/evidence.md and update planning/STATE.md.
```
