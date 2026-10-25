# Sprint 001: R0 Pilot. Acceptance

The sprint is **done** only when every check below passes on the **production URL**, on a real Android phone running Chrome. Record pass/fail and evidence (test name, screenshot or Neon query) per check in the A6 PR.

The product-owner agent reviews the claims against this file. "Tests pass" alone is not acceptance.

## Automated (CI and Playwright)
- **AC-01:** `pnpm lint`, `typecheck`, `test` and `build` are green on `main`.
- **AC-02:** `domain` test coverage is ≥ 90% of lines.
- **AC-03:** The DOMAIN.md worked example returns Sales **KES 350**, COGS **90**, Expenses **50**, Faida Halisi **210**, Cash in 150, M-Pesa in 200. This holds in a unit test **and** when entered through the UI (`e2e/ledger.spec.ts`).
- **AC-04:** Deni scenario:
  1. Wanjiku 300, paid 100 → **200**.
  2. Payment 150 → **50**.
  3. Void the payment → **200**.

  The voided row shows struck through and labelled "Voided".
- **AC-05:** Opening balance for Otieno, 500 → `/debts` shows 500. Muhtasari's today Sales stays **0**.
- **AC-06:** Opening stock of 10 tray mayai, then selling 3 → the **Bidhaa list shows 7**. Selling 8 more shows a `NEGATIVE_STOCK` warning, and the sale saves (default profile = warn).
- **AC-07:** A sale with deni and no customer **cannot be saved, even with an override** (D-038). The app shows `DENI_NEEDS_CUSTOMER` and the customer picker; the unit test proves `override: true` still throws.
- **AC-08:** With the profile seeded `rules.negativeStock = 'block'`, overselling opens "Save anyway". Saving needs that second tap, and the stored txn has `overrides: ['NEGATIVE_STOCK']`. This is proven in the B2 unit test and in the e2e test with a seeded profile.
- **AC-09:** **Cold offline:** after the service worker installs, a new page with the network off opens every route directly, including `/sales/new` and `/debts/customer?id=…` (`e2e/offline-shell.spec.ts`, run against `pnpm build && pnpm start`).
- **AC-10:** PIN:
  - wrong PIN ×5 shows a countdown of ≥ 30 s;
  - the correct PIN unlocks while offline;
  - more than 5 min in the background relocks (`e2e/pin.spec.ts`, run against the build).
- **AC-11:** Sync idempotency:
  - pushing the same batch twice leaves the row counts unchanged;
  - a foreign `businessId` gets 403;
  - LWW keeps the newer row;
  - another business's row is never overwritten;
  - `accepted` lists every ID, including skipped duplicates;
  - a 403 stops retries and shows `Sign in to back up`.
- **AC-12:** Bootstrap is idempotent and race-safe: `Promise.all` of two calls gives one profile, one business and one owner membership. A no-cookie request to `/api/bootstrap` on the built app returns **401, not 500**, which proves `proxy.ts` is wired up.

## On a real phone (production URL)
- **AC-13:** Install via Chrome "Add to Home screen". The app opens standalone with the Mazao icon.
- **AC-14:** The privacy notice must be accepted before the Clerk sign-in is enabled. Sign-in works with an email code and with Google.
- **AC-15:** Sign-in → set PIN → onboarding (3 items, one a service) → review → notebook → first sale takes **≤ 10 minutes** for a first-time user, timed.
- **AC-16:** Airplane mode on:
  - record 2 sales (one on deni with due chip "kesho"), 1 expense and 1 payment;
  - Muhtasari updates instantly;
  - the chip shows `Not backed up (n)`, where n counts records, not lines (here n = 4, plus any new customer).
- **AC-17:** Airplane mode off → within **60 s** the chip shows `Backed up`. A Neon query shows the rows with the correct `business_id` and amounts.
- **AC-18:** Close and reopen the app offline. The PIN unlock works and all records are still there.
- **AC-19:** **Restore:** sign in with the same account in a second browser profile or phone. After setting a PIN, the same deni list and today's totals appear.
- **AC-20:** On a 3 GB RAM phone, the new-sale screen opens in < 2 s after unlock, and saving shows on the list in < 1 s.
- **AC-21:** Every navigation label and page title shows the Kiswahili name **with its English translation** beneath it (D-040): Muhtasari/Overview, Mauzo/Sales, Deni/Debts, Gharama/Expenses, Zaidi/More, Bidhaa/Items, Mipangilio/Settings, Faida Halisi/Net profit. Body text is English.
- **AC-22:** Forgot PIN while offline shows the "connect to the internet" message. Online, it **signs out of Clerk first**, then goes through the Clerk email code → set a new PIN, with the data intact. A different Clerk user on the same phone is refused (D-039).

## Docs
- **AC-23:**
  - `docs/pilot/install-guide.md`, `docs/pilot/model-test-collection.md` and `docs/pilot/debrief.md` exist;
  - the model-test sheet has ≥ 100 phrase slots across sale, expense, payment, deni and service.


## Added 2026-10-24 (Today report, design and full day; proposed in the phase 2–4 specs)
- **AC-24:** After the DOMAIN.md worked example, the Today report lists 3 entries in time order and shows Sales 350, COGS 90, Expenses 50, Faida Halisi 210, Cash in 150 and M-Pesa in 200, identical to Muhtasari (unit and e2e).
- **AC-25:** Deni scenario in the Today report:
  - Wanjiku shows bought 300, paid 250, owes 50.
  - After voiding the payment she shows paid 100, owes 200, with the payment struck through as "Voided".
  - The totals still equal Muhtasari.
- **AC-26:** An opening balance and opening stock entered today appear under "Brought forward" and leave today's Sales and Faida Halisi at 0.
- **AC-27:** A void made today of a sale dated yesterday appears in today's list, marked as changing yesterday's totals. Today's totals are unchanged.
- **AC-28:** On a real phone, "Share today's summary" opens the Android share sheet, and WhatsApp receives plain text with the Faida Halisi figure. A browser without Web Share copies the text and shows "Copied". Customer names are absent by default.
- **AC-29:** `/today` opens cold offline (it's part of the AC-09 route list), and its bilingual title reads "Leo" with "Today" beneath (part of AC-21).
- **AC-30:** An impeccable critique of Muhtasari and Today at 360x800 reports no blocking issues: one hero figure, no row of equal KPI cards, no decorative gradients or glows, AA contrast in a sunlight check.
- **AC-31:** Every onboarding background image is AVIF or WebP, at most 150 KB and precached. All text over it passes WCAG AA at 360x800.
- **AC-32:** Closing the app on onboarding question 5 and unlocking again resumes at question 5 with the earlier answers intact.
- **AC-33:** "Full Gikomba day" e2e: the Phase 3 spec's ten-step day runs offline end to end. Muhtasari and the Today report then agree with the expected totals, and Bidhaa stock and Deni balances match a hand-calculated sheet.

## Waivers
If a blueprint cut is applied, the matching check is waived and marked as such in the A6 PR:
- Cut 1 (restore) waives AC-19.
- Cut 2 keeps the AC-15 time target.

## Explicitly not required in R0
Purchases, the supplier ledger, Kazi, Ripoti/PDF, any AI or voice, Mtandao, roles, server-side recompute.
