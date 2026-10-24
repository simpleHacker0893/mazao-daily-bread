# Phase 1: Authentication & data foundation
> Release: R0 (pilot) · Milestone: R0 pilot, Gikomba, Mon 2026-10-26 · Blueprint steps: A3, A4, B1, B2, A5 · Depends on: Phase 0 (A1a, A1b, A2) · Label: ready-for-agent

## Problem Statement

A Gikomba merchant's records live in a paper notebook today. If Mazao is going to replace it, the merchant has to trust three things before they record a single sale.

First, that only they can open their books. Their phone is often lent to a child or a neighbour, and they cannot type a password at the stall between customers. They need one quick, private way in that works with no network, and a way back in if they forget it.

Second, that the numbers are right. If Mazao says Faida Halisi is KES 210 for the day, or that Wanjiku owes KES 200, and the merchant's own sums disagree, they will go back to the notebook for good (R-003).

Third, that nothing is lost. Phones drop network for hours, browsers clear storage, and phones get stolen. A record saved at the stall must survive all of that and reach a backup when the network returns, without the merchant thinking about it (R-002).

None of this exists yet. Phase 0 delivers a shell that opens offline but has no accounts, no database, no maths and no save path. Every later screen (sales, deni, Muhtasari, onboarding) depends on these foundations being correct, and the money and sync parts are the hardest code in R0.

## Solution

From the merchant's side:
- The first time, they open Mazao (from the landing page or the home-screen icon) and see "Karibu Mazao / Welcome to Mazao" over a market photograph. A short privacy notice says what is stored, that it is stored in the EU, and how to have it deleted. Once they tick "I agree", they sign in with an emailed one-time code or with Google (D-022). This is the only step that needs internet.
- They choose a 4-digit PIN, entered twice. From then on "Fungua Mazao / Unlock Mazao" opens the app with that PIN, online or offline, and the app locks itself after 5 minutes in the background (D-023, D-024). Too many wrong tries make them wait, longer each time. If they forget the PIN, they connect to the internet, confirm by email code, and set a new one, with every record kept.
- On a new phone, signing in brings their records back from the backup before they set their PIN.
- Behind every screen, each record they confirm is saved on the phone first, instantly, and backed up to the server automatically when the network allows. A chip at the top always says whether they are "Backed up", "Saving…", "Not backed up (n)" or need to "Sign in to back up".
- One phone holds one merchant's account in R0 (D-039). If someone else tries to sign in on it, they are told whose phone it is and nothing is overwritten.

From the team's side, this phase delivers the five foundation steps of the sprint-001 blueprint: the server schema, tenancy and bootstrap (A3); the PIN lock (A4); the pure domain maths (B1); the local Dexie data layer with a single commit path (B2); and sync push, pull and restore with the sync status (A5). Phases 2 to 4 build screens on top of these interfaces without changing them.

## User Stories

**Sign-in and privacy**
1. As a merchant (mama mboga) opening Mazao for the first time, I want to see a short privacy notice before I can sign in, so that I know what Mazao keeps about me before I share anything (Q-001 interim).
2. As a merchant, I want the notice in three plain lines (what is stored, stored in the EU, how to delete) with a link to read the full text, so that I understand it in under a minute.
3. As a merchant, I want the sign-in buttons disabled until I tick "I agree", so that I cannot sign in by accident without agreeing (AC-14).
4. As a merchant with an email address, I want to receive a one-time code and type it in, so that I do not have to remember a password.
5. As a merchant who uses Gmail on my phone, I want "Continue with Google", so that I can sign in with one tap.
6. As a merchant who opens sign-in with no network, I want a clear "You're offline. Connect once to sign in." message, so that I know why nothing happens.
7. As a merchant, I want the sign-in screen to show a familiar Gikomba photograph behind a solid scrim with the form on a plain panel, so that it feels local but stays readable in sunlight.
8. As a merchant, I want the screen title as "Karibu Mazao" with "Welcome to Mazao" beneath, so that I understand it in either language (D-040).
9. As a merchant signing in on a new phone, I want my existing deni list and today's totals to come back before I set my PIN, so that changing phones does not lose my books (AC-19).
10. As a merchant signing in for the first time, I want my business to be created automatically, so that I do not fill in an account form.

**PIN**
11. As a merchant, I want to choose a 4-digit PIN and enter it twice, so that a typo does not lock me out.
12. As a merchant, I want Mazao to refuse obvious PINs like 0000, 1234 or 7777 and tell me why, so that a neighbour cannot guess mine.
13. As a merchant, I want to be told when I set the PIN that resetting it needs internet, so that I am not surprised later (R-004).
14. As a merchant at the stall, I want to unlock with just my PIN on a large keypad, so that I can open the app between customers with one hand.
15. As a merchant with no network, I want my PIN to still unlock the app, so that a dead spot never stops me working (AC-10, AC-18).
16. As a merchant, I want the unlock screen to show my business name and email, so that I know it is my account.
17. As a merchant who lends my phone, I want Mazao to lock itself after 5 minutes in the background, so that whoever holds my phone cannot see my deni.
18. As a merchant, I want Mazao to lock when I close and reopen it, so that the app is never left open by accident.
19. As a merchant, I want a countdown after 5 wrong PINs, doubling with each further failure, so that nobody can guess my PIN by trying every number.
20. As a merchant, I want the wrong-PIN count and wait to survive closing the app, so that the lock cannot be skipped by restarting.
21. As a merchant who forgot my PIN while offline, I want to be told to connect to the internet to reset it, so that I know what to do (AC-22).
22. As a merchant who forgot my PIN, I want to confirm with an email code and set a new PIN, with every record still there, so that forgetting is not a disaster.
23. As a merchant, I want "Forgot PIN" to always ask for the email code even if I was signed in recently, so that a thief with my phone cannot reset my PIN.
24. As a merchant whose phone is used by a relative, I want Mazao to refuse a different person's sign-in on my phone and show whose phone it is, so that my books are never overwritten (D-039).
25. As a merchant, I want my PIN never to leave my phone and never to be my online password, so that a leak of the server cannot reveal it (D-024).
26. As a merchant using a screen reader or large text, I want the PIN pad keys labelled and the countdown announced, so that I can unlock without seeing the screen clearly.

**Numbers (domain)**
27. As a merchant (kiosk owner), I want Faida Halisi to equal Sales minus cost of goods minus expenses, so that it matches how I think about profit (D-014).
28. As a merchant (boda rider), I want trips I sell as a service to count in Sales with no cost of goods, so that my profit is not understated (D-006).
29. As a merchant, I want half a kilo at KES 120 to cost exactly KES 60, and every line rounded the same way everywhere, so that totals never differ between screens.
30. As a merchant, I want a sale I make at 00:30 to count in that day in Nairobi time, not the previous day, so that my daily totals are right.
31. As a merchant, I want opening balances from my notebook never to count as sales or profit, so that my first day's Faida Halisi is not inflated (D-011).
32. As a merchant, I want a customer's payments applied to their oldest deni first, and overpayment carried forward as credit, so that "overdue" means what I expect.
33. As a merchant, I want a mistake corrected by voiding it rather than editing it, and a voided record never voided twice, so that my history is honest (D-018).
34. As a merchant, I want Mazao to stop me saving deni without naming the customer, with no "save anyway", so that unpaid money never disappears (D-038, AC-07).
35. As a merchant (repair fundi), I want warnings for selling below cost, a price far from usual, stock going negative or a likely duplicate, and to be able to save anyway when I know I am right, so that Mazao helps without blocking real life (D-026, D-027).
36. As a merchant who chose "block" for negative stock, I want a second "Save anyway" tap to save, with the override noted on the record, so that I stay in control (AC-08).
37. As a merchant, I want due-date chips like "kesho" and "Ijumaa" to resolve to the right date, with Ijumaa on a Friday meaning next Friday, so that reminders land on the right day.

**Saving and backup**
38. As a merchant with no network, I want every record I confirm to appear immediately in my lists and totals, so that I never wait at the stall.
39. As a merchant, I want a save that fails halfway to leave nothing behind, so that I never get half a sale.
40. As a merchant, I want my records backed up automatically when the network returns, within about a minute, so that I do not need to remember to do it (AC-17).
41. As a merchant, I want the chip to count records, not lines, so that "Not backed up (4)" matches the 4 things I recorded (AC-16).
42. As a merchant whose records have not been backed up for more than 3 days, I want a banner telling me to connect, so that I do not risk losing them (D-021).
43. As a merchant whose sign-in has expired, I want the chip to say "Sign in to back up", while my records stay usable with my PIN, so that I know what to fix.
44. As a merchant, I want the app to ask the browser to keep my data permanently, so that Chrome does not clear my books to save space (R-002).

**Pilot coordinator**
45. As a pilot coordinator, I want to confirm in Neon that a merchant's rows arrived with the right business and amounts, so that I can prove backup works on Monday (AC-17).

**Developer**
46. As a developer, I want all money maths in pure domain functions with tests on the worked example, so that screens never calculate money themselves.
47. As a developer, I want one commit path for every record, so that validation, IDs, timestamps, cost capture and the sync queue cannot be skipped.
48. As a developer, I want push to be idempotent and to reject any row from another business, so that retries are safe and tenants are isolated (D-020, AC-11).
49. As a developer, I want bootstrap to be race-safe, and the API to answer 401 rather than 500 with no session, so that double taps and proxy misconfiguration are caught (AC-12).

**Product owner**
50. As the product owner, I want no record contents, phone numbers or PIN material in any log, so that the pilot respects merchants' privacy.

## Implementation Decisions

**1. Server schema and tenancy (A3; D-016, D-017, D-035, D-037).**
- Postgres on Neon (Frankfurt), accessed through Prisma with the Neon driver adapter. Pooled connection at runtime, unpooled for migrations. One cached client instance. Postgres-specific writes Prisma cannot express use parameterised raw statements only.
- Tables (snake_case in the database): `profiles` (one per Clerk user, unique `clerk_user_id`), `businesses` (currency `KES`, timezone `Africa/Nairobi`), `business_members` (role check `owner` only; `profile_id` unique, which enforces one business per owner, D-012, and makes bootstrap race-safe), `customers`, `suppliers`, `items` (kind check goods or service), `transactions` (R0 types only; no `updated_at`, no balance columns), `transaction_items` (quantity non-zero), `merchant_settings` (keyed by business, settings as JSON).
- Synced tables use client-generated UUIDs with no server default (D-018). Money is `numeric(14,2)` and quantity `numeric(14,3)` (D-013). Check constraints live in migration SQL. Indexes on `(business_id, created_at)` for transactions and lines and `(business_id, updated_at)` for master tables.
- Every business-owned row has `business_id` and `created_by`. No stored balances or stock (D-019).
- Migrations run against the Neon `dev` branch first, then `main` before the production deploy.
- Tenancy guard `requireMember()` resolves `{ profileId, businessId }` from the Clerk session; no session is 401, no membership is 403. Every API route calls it.

**2. Proxy and Clerk wiring (A3; D-022, D-043).**
- Clerk middleware lives in the proxy file at the repo root next to the app folder. Its matcher covers the API and Clerk's required paths. It never protects or redirects pages, because app pages must render offline; it only makes the session available, and the tenancy guard returns 401 or 403.
- The Clerk provider wraps the root layout without making pages dynamic. App pages never wait for Clerk to load; only sign-in, bootstrap and sync use it.
- Clerk instance: email code and Google on, passwords and phone off, session lifetime at the plan maximum.

**3. Sign-in screen (A3, with Phase 0 imagery).**
- Title "Karibu Mazao / Welcome to Mazao" through the bilingual title primitive (on-image variant). An `auth-background` photograph sits behind a solid scrim; the privacy card and the Clerk sign-in sit on a solid Surface panel (Owner, 2026-10-24).
- Privacy card: what we store (account email, business records you enter), stored in the EU, how to have it deleted (ASSUMPTION: by asking the pilot team, since in-app delete is R3), the PIN never leaves the phone, plus a link to the full notice. Clerk sign-in stays disabled until "I agree" is ticked. The accepted notice version and time are recorded in the device database `meta` (ASSUMPTION; server-side recording is Q-014).
- Offline state: the offline banner and disabled send button from the prompt file. ASSUMPTION: the sign-in page path is precached like the PIN pages so this state renders offline instead of a browser error (Q-015).
- After Clerk sign-in, in order: call bootstrap; if the phone already has an account for a different Clerk user, show "This phone belongs to <email>. Ask the owner to remove their account in Mipangilio first." and change nothing (D-039); if bootstrap reports existing data, run restore; then go to set PIN.

**4. Bootstrap contract (A3).**
- `POST /api/bootstrap`, in one interactive transaction: upsert the profile by Clerk user id; find the membership or create the business and owner membership; on a unique violation of the member's profile id, re-read the membership (a concurrent call won).
- Response:
  ```ts
  type BootstrapResponse = {
    profileId: string; businessId: string; clerkUserId: string; email: string;
    hasData: boolean; // true when the business already has any synced row (new-phone restore)
  };
  ```
- The business name starts empty and is set from the operating profile later (Q-016).

**5. PIN and lock (A4; D-023, D-024, D-039).**
- PIN module: hash with WebCrypto PBKDF2-SHA256, 150,000 iterations, 16-byte random salt, 32-byte output; verify with a constant-time comparison. If one unlock takes more than 800 ms on the 3 GB phone in A6, the iteration count drops to 100,000 and a new decision is recorded.
- Weak PIN rule: reject `0000`, `1234` and any four repeated digits.
- Backoff rule (pure function of failure count and time): after the 5th failure, locked until now + 30 s × 2^(failures − 5). Failures and lock time persist in the device account, so a restart does not reset them; success resets them.
- Set PIN: two entries that must match; creates or updates the single device account with the Clerk user id; copy "Remember this PIN. To reset it you will need internet."; then go to the route after PIN (stub `/` until Phase 3).
- Unlock: shows business name and email, PIN pad with keys of at least 64 dp, countdown during lockout. No "Switch account" or "Add another account" in R0 (D-039). Success sets the in-memory session and goes to `/`.
- Session lives in memory only (ASSUMPTION consistent with the blueprint), so every cold start shows the unlock screen.
- LockGuard in the app layout: no device account goes to `/welcome` (D-044), or `/sign-in` if Cut 0 was applied; an account with no session goes to `/lock`; hidden for more than 5 minutes locks.
- Forgot PIN: offline shows "Connect to the internet to reset your PIN"; online signs out of Clerk first, then Clerk email code, then bootstrap must return the same profile id or nothing changes, then set PIN. Local data is kept.
- `/lock` and `/set-pin` use the `auth-background` image, precached in Phase 0.

**6. Domain core (B1; D-013, D-014, D-015, D-026, D-027, D-038).**
- Pure TypeScript, no React, Dexie or network. Shared types and schemas are frozen after B1 and posted in the PR.
- Conventions encoded in the transaction type:
  ```ts
  type Cents = number; // integer
  type Txn = {
    id: string; businessId: string;
    type: 'sale' | 'expense' | 'customer_payment' | 'opening_balance' | 'stock_adjustment' | 'void';
    occurredAt: string;            // new Date().toISOString() only
    source: 'manual' | 'onboarding';
    paymentMethod: 'cash' | 'mpesa' | 'other' | null;
    customerId?: string; supplierId?: string;
    voidsTxnId?: string;           // void copies the original's party ids
    expenseCategory?: string; description?: string;
    dueDate?: string;              // YYYY-MM-DD
    dueDateNote?: string;
    totalAmount: Cents; amountPaid: Cents;
    externalReference?: string;
    overrides: string[];           // block-level codes saved with "Save anyway"
    createdBy: string; createdAt: string;
  };
  ```
  Payments have total equal to paid equal to amount; opening balances have paid 0 and exactly one party; stock adjustments have total 0 with signed line quantities; voids have total 0. `purchase` and `supplier_payment` join in R1.
- Lines: item id, kind, description, quantity (at most 3 decimals), unit, unit price and unit cost in cents.
- Money: conversion to cents by rounding, `KES 1,250` formatting with decimals only when non-zero, and one line-total rule (round of quantity times unit price).
- Ledger: active transactions (drops voided originals and voids), customer balance, open deni with FIFO allocation where credits are sale remainders and opening balances and overpayment carries forward, overdue against today in Nairobi, supplier owed (opening balances only in R0), stock on hand for goods (adjustments minus sale lines), and can-void (not a void, not already voided).
- Day summary over a Nairobi day range: sales, COGS, expenses, Faida Halisi, cash in, M-Pesa in, other in.
- Dates: Nairobi day range (UTC+3 all year), today in Nairobi, due rules kesho, ijumaa, wiki ijayo, mwisho wa mwezi.
- Grill: returns hard errors (`SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, `DENI_NEEDS_CUSTOMER`) and issues (`NEGATIVE_STOCK`, `BELOW_COST`, `PRICE_VARIANCE` above the profile threshold, default 30%, `POSSIBLE_DUPLICATE` only when a customer is set) with severity from the operating profile, default warn in R0.
- Operating profile schema and default profile, as in the blueprint B1 brief.

**7. Local data layer and commit path (B2; D-018 to D-021, D-026).**
- One Dexie database per business, `mazao-<businessId>`, with items, customers, suppliers, transactions, lines, settings, the sync queue and onboarding progress.
- Commit API is the only way pages write: commit sale, expense, payment, opening, stock adjustment and void; add item; upsert customer and supplier; save settings. Each one parses with Zod, runs the grill, throws a commit error on hard errors with no override possible, throws needs-override for block-level issues unless override is passed (then records their codes), stamps IDs, creator, timestamps and unit cost from the item's buying price (D-015), and writes rows and sync-queue entries in one Dexie transaction in parent order (new customer, then transaction, then lines). Void is rejected when can-void is false.
- Query hooks call only domain functions: today (rolls over at midnight), today's sales and expenses, customers with balance, customer ledger, items with stock, recent items, day summary, low stock, unsynced count (queue entries excluding lines, so a sale counts once).
- A business-database context opens the right database from the session.

**8. Sync, restore and status (A5; D-013, D-020, D-021, D-039).**
- Wire layer is the only place cents become decimal strings and back, and normalises timestamps to the exact ISO `Z` form Dexie range queries need.
- Push contract:
  ```ts
  type PushRequest = { rows: { table: 'customers' | 'suppliers' | 'items' | 'merchant_settings' | 'transactions' | 'transaction_items'; row: unknown }[] }; // max 500
  type PushResponse = { accepted: string[] }; // every id in the batch, including skipped duplicates
  ```
  Tenancy guard first; 403 for the whole batch if any row or any line's parent belongs to another business. One interactive transaction in parent order. Transactions and lines insert with skip-duplicates. Master rows use a raw upsert that updates only when the stored row is older and belongs to the same business. Settings conflict on business id.
- Pull: `GET /api/sync/pull?since=<ISO>` returns the business's rows changed after `since` (updated time for master rows, created time for transactions and lines), paged at 1,000, with `nextSince`.
- Engine: flushes up to 200 due entries in order with the Clerk token, only when Clerk's signed-in user equals the session's Clerk user id (D-039). Success deletes accepted entries. Network or 5xx errors back off to at most 5 minutes. 401 or 403 stops retrying and sets `Sign in to back up`. Triggers: unlock, coming online, 5 s after a commit, every 60 s while visible and online. A cold offline start remounts the Clerk provider when the network returns.
- Restore: after bootstrap reports data, pull from the epoch into the business database without creating queue entries, before set PIN.
- Status: `type SyncStatus = 'backed_up' | 'saving' | { notBackedUp: number } | 'sign_in_to_back_up'`, shown by the Phase 0 chip with copy `Backed up`, `Saving…`, `Not backed up (n)`, `Sign in to back up`. The banner shows when the oldest unsynced record is older than 3 days or the status is sign-in.
- Persistent storage is requested after the first unlock.

**9. Privacy in code.** No logging of record contents, phone numbers, PINs, PIN hashes or salts, on client or server. The PIN never leaves the device.

## Testing Decisions

A good test exercises the public interface of a module and asserts what the merchant or the server would observe: a total, a balance, a thrown error code, rows in a table, an HTTP status, what a page shows. Tests never reach into Dexie tables from the page side, mock domain functions, or assert on implementation details such as how many queries ran. Tests come first for domain, local, sync and auth.

Seams, highest first:
- **Domain as pure input to output (B1).** The main seam for correctness. Prior art: the DOMAIN.md worked example (Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents; cash 15000, M-Pesa 20000) and the B1 required-tests list: the Wanjiku deni scenario including the void showing in her party-filtered ledger, Otieno's opening balance of 500 with sales 0, FIFO across two credits, opening balance as a credit, overpayment carried forward, void-of-void and double void rejected, 0.5 kilo × 120 = 60, the 00:30 EAT boundary, each grill rule firing and not firing, `DENI_NEEDS_CUSTOMER` as a hard error, no duplicate without a customer, Ijumaa on a Friday. Coverage at least 90% of lines (AC-02).
- **Local commit and query API against fake IndexedDB (B2).** One seam for the whole save path: a credit sale with a new customer produces exactly one customer, one transaction, n lines and queue entries in parent order in one transaction; a failed commit leaves nothing; override still throws for `DENI_NEEDS_CUSTOMER` (AC-07); a seeded `negativeStock = 'block'` throws needs-override and with override saves `['NEGATIVE_STOCK']` (AC-08); a void reverses balance and stock and a second void is rejected (AC-04, AC-06 at this level); unsynced count counts records not lines.
- **Sync and bootstrap HTTP routes against the Neon `dev` branch (A3, A5).** Bootstrap twice in parallel gives one profile, one business, one membership; no session is 401 (AC-12). Push the same batch twice leaves counts unchanged and `accepted` lists every id both times; a foreign business id is 403; a foreign customer id with our business id is not overwritten; last-write-wins keeps the newer row; settings upsert by business (AC-11).
- **Sync engine with a fake fetch.** 500 then success empties the queue with backoff; 403 stops retries and sets `Sign in to back up`; no flush when the Clerk user differs from the device account.
- **PIN module as pure functions.** Hash and verify round trip; wrong PIN fails; weak PINs rejected; backoff durations for failures 5, 6, 7.
- **Playwright on the built app, offline.** `pnpm build && pnpm start`; no-cookie request to `/api/bootstrap` returns 401, proving the proxy is wired (AC-12). PIN: seed an account, go offline, five wrong PINs show a countdown of at least 30 s, the right PIN unlocks, more than 5 minutes hidden (fake clock) relocks (AC-10). Forgot PIN offline shows the connect message (AC-22, offline part).
- **Manual on the preview and a real phone.** Sign in with email code and Google after accepting the notice (AC-14); offline records then reconnect, rows in Neon within 60 s (AC-17); second browser profile restore (AC-19); forgot PIN online signs out of Clerk first and keeps data, and a different Clerk user is refused (AC-22); time one unlock on the 3 GB phone.

## Out of Scope
- Ledger, sales, expenses, deni, Bidhaa, Muhtasari, onboarding and notebook screens (Phases 2 to 4); this phase provides their data API only.
- Mipangilio actions (change PIN, lock now, back up now) and the route-after-PIN logic (Phases 3 and 4).
- Several accounts per phone and removing an account from a phone (D-039; after the pilot).
- Phone-number OTP sign-in (D-022, Q-005).
- Purchases and supplier payments (R1), server-side balance recompute (R6, D-019), in-app export and delete (R3).
- Clerk Organizations or roles beyond owner (D-012, D-017).
- Any AI, voice or AI drafts (R4, R5).

## Further Notes

**Open questions**
- **Q-014:** Should acceptance of the privacy notice (version and time) also be stored on the server profile? The A3 schema has no column for it. Linked to Q-001. Interim: recorded in the device database only.
- **Q-015:** The sign-in route is a Clerk catch-all, and the A2 precache list does not include it. Should its base path be precached so the offline state renders instead of a browser error?
- **Q-016:** `businesses.name`, `business_type` and `market_location` are created empty by bootstrap. Should the onboarding profile update them through sync, or is `merchant_settings` enough for R0?
- **Q-017:** RQ-3 and the design spec say everyday unlock is "email + PIN"; with one account per phone (D-039) the email is shown, not typed. Confirm the unlock is PIN-only with the email displayed.
- **Q-018:** If PBKDF2 at 150,000 iterations exceeds 800 ms on the 3 GB phone, the blueprint lowers it to 100,000. Who records the superseding decision, and does it need re-hashing of existing PINs (none exist before the pilot)?
- Q-001, Q-002 and Q-003 still block Monday.

**Risks**
- **R-017:** Clerk sessions expire during pilot week 2 and backups silently stop. Mitigation: maximum session lifetime, `Sign in to back up` status and banner, coordinator checks chips at the week-1 visit.
- **R-018:** Bootstrap or push race conditions create duplicate businesses or cross-tenant writes. Mitigation: unique member profile id, business check inside the upsert condition, route tests in AC-11 and AC-12.
- **R-019:** Timestamp format drift between Postgres and the client breaks day-range queries after restore. Mitigation: all timestamps normalised in the wire layer; restore test checks today's totals match.
- **R-020:** Phase 1 holds three "strongest model" steps (B1, B2, A5) on the critical path. Mitigation: B1 starts right after A1a; Cut 1 (restore) is available at the Sunday checkpoint and waives AC-19.
- R-002, R-003, R-004 and R-010 apply directly.

**Acceptance covered by this phase:** AC-02, AC-07, AC-08, AC-10, AC-11, AC-12, AC-14, AC-17, AC-18, AC-19, AC-22 in full; AC-03, AC-04, AC-05 and AC-06 at unit level (UI parts in Phases 2 to 4); the chip count part of AC-16.

**Contradictions found in the source docs (for the product owner)**
- Design spec §10 says the server recomputes balances and is the source of truth, and that LWW is per field; D-019 and D-020 (which win) say the client derives balances in R0 and LWW is per row on `updated_at`.
- Design spec §6.1 allows shared-phone accounts; D-039 supersedes this for R0, but the Fungua Mazao prompt still shows "Switch account" and "Add another account".
- Blueprint A4 sends a phone with no account to `/sign-in`; D-044 says `/welcome`.
- The backup component prompt uses "Backing up"; RQ-1 and A5 use "Saving…".
