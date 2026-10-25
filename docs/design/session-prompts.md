# Session prompts: paste one per fresh session

`docs/design/build-prompts.md` says **what** to build in each step. This file is **how to start each session**. Each prompt below is ready to paste.

## Before the first session
- **Merge `docs/design-build-prompts` first,** so every session finds `build-prompts.md`, `PRODUCT.md` and D-051 to D-054 on `main`. Until it's merged, replace `main` with `docs/design-build-prompts` in the first line of each prompt.
- **One session = one step = one PR.** When the PR is reviewed and green, squash-merge it, `/clear`, and paste the next prompt.
- **Order:** 1 → 2 → 2b → 3 → 4 → (5, 6, 7 in any order) → 8 → 9 → 10 → 11a → 11b → 11c → 12 → 13. Steps 2 and 2b can run in parallel sessions.

## How every build prompt works
- `/mattpocock-skills:implement` builds from the step's spec.
  - It uses `/tdd` at the seams named in the prompt.
  - It typechecks and runs single test files as it goes, and the full suite at the end.
  - It runs `/code-review`, then commits to the current branch. That's why each prompt creates the branch first.
- After it, the prompt adds:
  - `superpowers:verification-before-completion`: no "done" without the command output;
  - `superpowers:finishing-a-development-branch`: push and open the PR, never merge.
- Design work also loads `impeccable`. Run its context script once, and read `reference/craft-floor.md` before any UI edit. It also loads `apple-design` for motion and `design-taste-frontend` for the landing page.
- **The finish block is the same in every build prompt** and is written out in full there, so each prompt stays copy-paste ready.

---

## Step 1: Shape the screens (no code)
```
/impeccable shape the dashboards and the landing page, as Step 1 of docs/design/build-prompts.md describes.

Setup: git switch main && git pull && git switch -c docs/design-shape. Read AGENTS.md, PRODUCT.md, planning/STATE.md and DECISIONS D-049 to D-054 first.

Write two files, docs/design/shape-dashboards.md (Operate mode) and docs/design/shape-landing.md (Persuade mode), with everything Step 1 lists:
- the dataviz skill for the Analysis charts;
- the apple-design skill for the 3–5 allowed motions;
- design-taste-frontend's Design Read and dials 6/3/4 for the landing page;
- every photo placed per the Photos table.

Interview me with the shape questions where the specs are silent; don't guess. No code.

Finish with superpowers:verification-before-completion: both files exist, and every screen in Step 1 has a section. Then superpowers:finishing-a-development-branch: push and open the PR "docs: shape dashboards and landing". Don't merge.
```

## Step 2: Imagery pipeline (#19)
```
/mattpocock-skills:implement Step 2 of docs/design/build-prompts.md: Task 5 (#19) of planning/sprints/phase-00-design-system-and-landing/plan.md, using the six photos in public/images/stitch/.

Setup: git switch main && git pull && git switch -c feat/p0-imagery-pipeline. Read AGENTS.md, PRODUCT.md and the Photos table in build-prompts.md.

TDD seams (/tdd, one at a time, red first):
1. manifest rules: a failing fixture for each rule in Task 5's acceptance list;
2. pipeline output: AVIF and WebP present, 150 KB or less, no EXIF/GPS;
3. determinism: two runs give identical bytes and manifest values;
4. scrim contrast: measured and written to the manifest.

Pick an image library that runs on Windows and in CI, and say why in the PR.

Finish:
- superpowers:verification-before-completion: paste pnpm lint, typecheck, test and build output, plus the manifest summary table.
- superpowers:finishing-a-development-branch: push and open the PR "P0-5: imagery pipeline and manifest check", Closes #19. Don't merge.
```

## Step 2b: Installable offline PWA (#18)
```
/mattpocock-skills:implement Step 2b of docs/design/build-prompts.md: Task 4 (#18) of planning/sprints/phase-00-design-system-and-landing/plan.md, with the English routes from D-050.

Setup: git switch main && git pull && git switch -c feat/a2-pwa-offline. Read AGENTS.md, D-041, D-042 and D-050. Read the Serwist and Next.js docs in node_modules (next/dist/docs) before writing the service worker.

TDD seams:
1. the precache route list is derived from one exported list, and a unit test checks it against the routes in e2e/shell.spec.ts;
2. route rules: /api/* and Clerk domains are NetworkOnly (unit-test the matchers);
3. e2e cold offline (Playwright, built app): every route opens offline, including /debts/customer?id=00000000-0000-4000-8000-000000000000;
4. e2e: after browsing, no /api or Clerk response is in Cache Storage.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output, and the manifest JSON. Lighthouse installability is done on the preview later if there's no preview yet; say so.
- superpowers:finishing-a-development-branch: push and open the PR "P0-4 (A2): installable PWA that opens cold offline", Closes #18. Don't merge.
```

## Step 3: Demo data, demo mode and the collapsible sidebar
```
/mattpocock-skills:implement Step 3 of docs/design/build-prompts.md (demo data, demo mode and the collapsible sidebar).

Setup: git switch main && git pull && git switch -c feat/demo-mode-sidebar. Read AGENTS.md, PRODUCT.md, D-051 to D-054, docs/design/shape-dashboards.md, and the Phase 4 Task 1 contract in planning/sprints/phase-04-dashboard-and-daily-report/plan.md. Load impeccable (Operate mode) and apple-design for the sidebar motion.

TDD seams:
1. demo/merchant.test.ts:
   - every day's totals = the sum of its entries;
   - Faida Halisi = sales − COGS − expenses;
   - each customer balance = bought − paid;
   - the projection matches D-054 on the stored history;
   - today matches the DOMAIN.md worked example.
2. ui/data/source.ts: demo mode always returns the mock, and the default source is the mock until Phase 4.
3. Demo mode guard:
   - a save action in demo mode opens the demo sheet;
   - an e2e proves no IndexedDB write and no fetch in demo mode.
4. Sidebar preference: the localStorage `mazao.sidebar` read and write, with no layout jump (read after mount).
5. Update e2e/shell.spec.ts:
   - at 1280 the sidebar shows, collapses, and the choice survives a reload;
   - at 360 the bottom nav shows and the sidebar doesn't.

Rules:
- Components do no maths.
- No raw hex.
- Every string goes through t() in en and sw.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots at 360, 1024 (collapsed) and 1280 (expanded); impeccable critique on the shell with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Demo mode, mock data and collapsible sidebar (D-051–D-053)". Don't merge.
```

## Step 4: Overview dashboard
```
/mattpocock-skills:implement Step 4 of docs/design/build-prompts.md (the Overview dashboard).

Setup: git switch main && git pull && git switch -c feat/ui-overview. Read AGENTS.md, PRODUCT.md, docs/design/shape-dashboards.md (Overview), the Taste rules in build-prompts.md, and the hooks in ui/data/. Load impeccable (Operate; read craft-floor.md before editing UI) and apple-design (number change, press feedback, reduced-motion fallback).

TDD seams (component tests with Testing Library, data from the demo fixture):
1. Money renders "KES 1,250" with tabular figures from integer cents (formatting only; no maths);
2. MoneyInBar sizes its segments from the precomputed shares, and "Given on deni today" sits outside the bar;
3. DeniRow: overdue gets the Tomato marker, due-soon gets Maize;
4. the Overview page shows net profit first, then the three columns, top 5 debts overdue first, low stock and the quick actions;
5. the first-day empty state, the skeleton, and "Not backed up (n)".

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots at 360 and 1280; the impeccable critique score, with every P0 and P1 fixed.
- superpowers:finishing-a-development-branch: push and open the PR "Overview dashboard on demo data (D-053)". Don't merge.
```

## Step 5: Today report and Share
```
/mattpocock-skills:implement Step 5 of docs/design/build-prompts.md (Today report and Share).

Setup: git switch main && git pull && git switch -c feat/ui-today. Read the step's reading list, plus Phase 4 plan Task 3. Load impeccable (Operate) and apple-design.

TDD seams:
1. the totals on /today deep-equal the Overview's (same fixture object);
2. entries are oldest first; voided rows are struck through and labelled; brought-forward rows say "not counted";
3. the per-customer section, with walk-in for null;
4. Share calls navigator.share with the pre-formatted text, and falls back to copy when share is unavailable;
5. the empty state with the gikomba-aisle photo above the message.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots at 360 and 1280; impeccable critique with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Today report and share on demo data". Don't merge.
```

## Step 6: Sales and Items lists
```
/mattpocock-skills:implement Step 6 of docs/design/build-prompts.md (the Sales and Items lists).

Setup: git switch main && git pull && git switch -c feat/ui-sales-items. Read the step's reading list. Load impeccable (Operate).

TDD seams:
1. the Sales day switcher moves a day back and forward, and the date sheet is lazy-loaded;
2. sale rows show the time, items, amount and payment chip, with the day total pinned;
3. Items search filters by name, and low stock gets the Maize marker;
4. at 1280 both are tables with right-aligned tabular money;
5. "Add item" in demo mode opens the demo sheet.

Run impeccable audit too: a11y, and 200% text at 360 with no horizontal scroll.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots; critique and audit with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Sales and Items lists on demo data". Don't merge.
```

## Step 7: Debts and the customer ledger
```
/mattpocock-skills:implement Step 7 of docs/design/build-prompts.md (Debts and the customer ledger).

Setup: git switch main && git pull && git switch -c feat/ui-debts. Read the step's reading list and planning/DOMAIN.md (deni terms). Load impeccable (Operate) and apple-design (sheet motion).

TDD seams:
1. /debts lists overdue first, using Tomato only when overdue and Maize when due soon, with the total and customer count;
2. /debts/customer?id= reads the id from the query string (D-041), shows the running balance per entry, and shows "in credit" when the customer has overpaid;
3. "Record payment" in demo mode opens the demo sheet;
4. an unknown id shows a "customer not found" state, never a crash;
5. the empty state with the notebook-hands photo.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots at 360 and 1280; impeccable critique with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Debts and customer ledger on demo data". Don't merge.
```

## Step 8: Suppliers (demo only)
```
/mattpocock-skills:implement Step 8 of docs/design/build-prompts.md (supplier debts and pending supplies, demo only).

Setup: git switch main && git pull && git switch -c feat/ui-suppliers. Read D-053, Q-019 in planning/QUESTIONS.md (use the interim unless it's been answered), stitch-prompts §4.1 and §4.2, and shape-dashboards.md (Suppliers). Load impeccable (Operate).

TDD seams:
1. "You owe suppliers": the total plus each supplier's amount and oldest unpaid date;
2. "Supplies to receive": late ones get Maize;
3. /suppliers/supplier?id= shows the history, and an unknown id shows "not found";
4. the nav shows Suppliers only in demo mode.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots; critique with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Suppliers screens (demo only, D-053)". Don't merge.
```

## Step 9: Analysis and projections (demo only)
```
/mattpocock-skills:implement Step 9 of docs/design/build-prompts.md (sales analysis and projections, demo only).

Setup: git switch main && git pull && git switch -c feat/ui-analysis. Read D-054 and shape-dashboards.md (Analysis). Load the dataviz skill before any chart code, plus impeccable (Operate) and apple-design.

TDD seams:
1. each chart component renders its accessible table alternative with the same values;
2. the 7 / 28-day switch changes the series;
3. the projection is a dashed line plus a band labelled "Estimate from your last 4 weeks", hidden below 14 days of data;
4. the route is lazy-loaded (check the build output);
5. the nav shows Analysis only in demo mode.

Charts are hand-written SVG; justify any library under 15 KB gzipped.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test, build and e2e output; screenshots at 360 and 1280; critique and audit with no P0 or P1.
- superpowers:finishing-a-development-branch: push and open the PR "Sales analysis and projections (demo only, D-054)". Don't merge.
```

## Step 10: Landing page (#22)
```
/mattpocock-skills:implement Step 10 of docs/design/build-prompts.md: Task 7 (#22) of planning/sprints/phase-00-design-system-and-landing/plan.md, with Step 10's owner changes (English only; "Start free" plus "Try the demo"; real screenshots).

Setup: git switch main && git pull && git switch -c feat/a6-landing-welcome. Read PRODUCT.md (positioning: know your real profit; free during the pilot; no invented proof), docs/design/shape-landing.md, and the Photos and Taste rules in build-prompts.md.

Skills, in order:
1. design-taste-frontend: Persuade, dials 6/3/4. State the Design Read first, and run its pre-flight before the PR.
2. impeccable: read the craft floor; finish with critique and audit on /welcome.
3. apple-design: hero entrance and press states only, 240ms or less, none under reduced motion.

TDD and e2e seams:
1. both "Start free" CTAs go to /sign-in, and every "Try the demo" goes to /demo;
2. images below the fold are lazy, and text renders before images;
3. axe finds no AA violations at 360 and 1280;
4. 200% text at 360 causes no horizontal scroll;
5. /welcome makes no Clerk or /api request;
6. /welcome and /privacy open cold offline;
7. a unit test proves every landing string comes from i18n.

The phone-frame screenshots of the demo Overview and Debts screens are captured with Playwright at 360×800 and passed through the image pipeline.

Finish:
- superpowers:verification-before-completion: paste all output, the pre-flight checklist, the critique scores, Lighthouse, and screenshots at 360 and 1280.
- superpowers:finishing-a-development-branch: push and open the PR "P0-8 (A6.6): landing page at /welcome", Closes #22. Don't merge.
```

## Step 11a: Clerk instance and keys
```
Step 11a of docs/design/build-prompts.md, as the devops agent, using the clerk-cli and clerk-setup skills.

Setup: git switch main && git pull && git switch -c chore/clerk-init. Read planning/sprints/phase-01-auth-and-data-foundation/plan.md Tasks 2 and 3 first.

Then do exactly what Step 11a says:
- link the Clerk app app_3L8uFOUNkjToZiKTMKFjuraVa69;
- enable email code and Google;
- set the sign-in URL to /sign-in and the after-sign-in URL to /set-pin;
- put the keys in the git-ignored .env, and the variable names in .env.example;
- run clerk doctor.

Ask me before any step that needs my login.

Finish with superpowers:verification-before-completion (the clerk doctor output, and a grep proving no secret is committed). Then superpowers:finishing-a-development-branch: open the PR "chore: Clerk instance setup". Don't merge.
```

## Step 11b: Server contract and bootstrap
```
/mattpocock-skills:implement Task 2 (P1-2) of planning/sprints/phase-01-auth-and-data-foundation/plan.md, exactly as written. This is Step 11b of docs/design/build-prompts.md.

Setup: git switch main && git pull && git switch -c the branch the plan names. Read AGENTS.md (tenancy and privacy rules) and the Prisma 8 skill (prisma-8) before touching the contract or migrations.

TDD seams: the ones Task 2's acceptance list implies. Write route tests against the Neon dev branch, including a foreign businessId → 403 and an unauthenticated request → 401.

Finish:
- superpowers:verification-before-completion: paste lint, typecheck, test and build output, plus the migration plan.
- superpowers:finishing-a-development-branch: open the PR with the plan's title. Don't merge.
```

## Step 11c: The sign-in screen
```
/mattpocock-skills:implement Task 3 (P1-3) of planning/sprints/phase-01-auth-and-data-foundation/plan.md, exactly as written, with the design from Step 11c of docs/design/build-prompts.md.

Setup: git switch main && git pull && git switch -c feat/a3-sign-in-privacy. Load clerk-nextjs-patterns, clerk-custom-ui and clerk-testing, plus impeccable (craft floor before any UI edit).

TDD seams: one test per row of the decideAfterSignIn table, then the isPendingSignInValid cases, as the plan lists them.

Design:
- the mama-mboga-stall auth-background under a solid scrim, with a solid Surface panel;
- Clerk's <SignIn /> styled with our tokens through the appearance prop;
- "Try the demo" as a quiet link under the panel.

Finish:
- superpowers:verification-before-completion: paste all output; impeccable critique on /sign-in with no P0 or P1; screenshots at 360 and 1280.
- superpowers:finishing-a-development-branch: open the PR "P1-3 (A3): sign-in with privacy notice". Don't merge.
```

## Step 12: Anti-slop review and fixes
```
Step 12 of docs/design/build-prompts.md: a whole-app design review, then fixes.

Setup: git switch main && git pull && git switch -c fix/design-review. Read PRODUCT.md and the Taste rules.

Phase A, review (dispatch the reviewer agent, read-only):
- impeccable critique and audit on every route Step 12 lists, at 360 and 1280;
- design-taste-frontend pre-flight on /welcome;
- the grep checks Step 12 lists;
- write the findings to docs/design/review-2026-10.md.

Phase B: run /mattpocock-skills:implement on docs/design/review-2026-10.md and fix every P0 and P1. Re-run critique at most twice.

Finish:
- superpowers:verification-before-completion: paste all output, plus before and after screenshots.
- superpowers:finishing-a-development-branch: open the PR "Design review fixes". Don't merge.
```

## Step 13: QA and state
```
Step 13 of docs/design/build-prompts.md, as the qa agent.

Setup: git switch main && git pull && git switch -c docs/phase-00-evidence.

Against pnpm build && pnpm start (and the preview URL if there is one), run everything Step 13 lists:
- all Playwright suites;
- the demo journey, with no IndexedDB write and no /api request;
- cold offline;
- the sidebar at 1280 and the bottom nav at 360;
- Lighthouse on /welcome and /.

Give me a checklist for the real-phone sunlight check. I'll do it and send you the results.

Record the evidence in planning/sprints/phase-00-design-system-and-landing/evidence.md and update planning/STATE.md.

Use superpowers:verification-before-completion before saying anything passed. Then superpowers:finishing-a-development-branch: open the PR "Phase 0 evidence". Don't merge.
```
