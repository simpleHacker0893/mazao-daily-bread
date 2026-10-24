# Phase 1 implementation plan (tickets to be created)

Spec: `planning/sprints/phase-01-auth-and-data-foundation/spec.md` (GitHub #2). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` steps **B1, A3, B2, A4, A5**, read together with **D-048** (Prisma ORM 8), which overrides the blueprint's Prisma wording (see "Superseded blueprint text" below).
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Phase 0 tickets are #15–#22; dependencies on tasks in this plan say "Task N" until the issues exist.

One blueprint step = one task. **A3 is split in two** (Tasks 2 and 3) because a backend specialist (schema, API, proxy) and a frontend specialist (sign-in screen) work in different files; the hand-off contract is named in both tasks. Task 7 is an evidence-only QA ticket with no blueprint step, because AC-14, AC-17, AC-19 and AC-22 can only be checked once Tasks 3, 5 and 6 are all merged.

## Task overview

| Task | Ticket | Step | Lane | Agent | Model | Branch | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P1-1 | B1 | Dev B | backend | **strongest** | `feat/b1-domain-core` | #15 |
| 2 | P1-2 | A3 (server) | Dev A | backend | default | `feat/a3-server-contract-bootstrap` | #16 |
| 3 | P1-3 | A3 (sign-in) | Dev A | frontend | default | `feat/a3-sign-in-privacy` | Task 2, #17, #18 |
| 4 | P1-4 | B2 | Dev B | backend | **strongest** | `feat/b2-local-commit` | Task 1 |
| 5 | P1-5 | A4 | Dev A | frontend | default | `feat/a4-pin-lock` | Task 3, #17, #18 |
| 6 | P1-6 | A5 | Dev A | backend | **strongest** | `feat/a5-sync-push-pull` | Task 2, Task 4, Task 5 |
| 7 | P1-7 | (evidence) | both | qa | default | none (evidence on #2), or `feat/p1-qa-auth-e2e` if tests are added | Task 3, Task 5, Task 6 |

Critical path: #15 → Task 1 → Task 4 → Task 6. Lane A runs #16 → Task 2 → Task 3 → Task 5 → Task 6 in parallel with lane B.

## Preconditions owned by the main session (not tasks here)

- Neon project in `aws-eu-central-1` with a `dev` branch and `main`; the owner's git-ignored root `.env` has `DATABASE_URL` (pooled) and `DIRECT_URL` (unpooled) for `dev`. Needed by Task 2 and Task 6 route tests.
- Clerk development instance with email code and Google on, passwords and phone off, session lifetime at the plan maximum (A3 task 1); keys in `.env` and in Vercel preview env. Needed by Tasks 3, 5, 6 and 7.
- Vercel preview env vars for both of the above (Task 7 manual checks run on the preview).

## Global Constraints

- Everything in the Phase 0 plan's Global Constraints applies (pnpm only; latest Next.js App Router, no `src/`, React Compiler, no hand memoisation; `next build --webpack`; Biome; TS strict + `noUncheckedIndexedAccess`; client pages read only Dexie; `/api/*` and Clerk never cached; all strings via i18n with bilingual titles; 48 px tap targets; tokens from `docs/design/stitch-prompts.md`; PR ready only when lint, typecheck, test and build pass).
- **Prisma ORM 8 (D-048), not Prisma 7.** The data contract is `prisma/contract.prisma`; `pnpm db:generate` (`prisma contract emit`) writes `prisma/contract.json` and `prisma/contract.d.ts`, both committed. There is no `@prisma/client`, no `schema.prisma`, no `PrismaClient`, no `@prisma/adapter-neon`. Runtime client: `postgres({ contract })` from `@prisma/orm-postgres` in `server/db.ts`, using `DATABASE_URL`. Migrations: `pnpm db:migrate:dev --name <slug>` (`prisma migration plan`) then `pnpm db:migrate` (`prisma db migrate`), CLI on `DIRECT_URL`. Use the project skill `.claude/skills/prisma-8` (references `contract.md`, `migrations.md`, `queries-postgres.md`); do not copy Prisma 7 snippets. Query surfaces are `db.orm.public.<Model>`, `db.sql.public.<table>`, `db.raw.sql` and `db.transaction(async (tx) => …)`. No string-built SQL, ever.
- **Money:** integer cents in `domain`, `local` and the client; `numeric(14,2)` money and `numeric(14,3)` quantity on the server; conversion only in `sync/wire.ts`; `lineTotal = Math.round(qty * unitPrice)`.
- **Ledger:** confirmed transactions are immutable; corrections are `void` + a new record; balances and stock are derived, never stored (D-018, D-019).
- **Tenancy:** every business-owned row has `businessId`/`business_id` and `createdBy`/`created_by`; every API route calls `requireMember()` first and rejects any row from another business.
- **One save path:** pages never write to Dexie; every record goes through `local/commit.ts` (Zod → `runGrill` → one Dexie transaction with sync-queue entries).
- **Privacy:** never log record contents, phone numbers, emails, PINs, PIN hashes or salts, on client or server (including test output and error messages sent to the console). The PIN never leaves the device.
- **Test-first** (red → green → refactor) for `domain`, `local`, `sync`, `auth` and API routes (`superpowers:test-driven-development`).
- **File ownership (R-011):** Dev A owns `app/(shell)/*`, `app/(app)/layout.tsx`, `app/api/*`, `auth/*`, `sync/*`, `server/*`, `ui/shell/*`, `proxy.ts`, `prisma/*`, `public/*`, config files, `i18n/en.shell.ts`. Dev B owns `domain/*`, `local/*`, other `app/(app)/*` pages, `ui/*` primitives, `ui/ledger/*`, `i18n/en.ledger.ts`. Shared contracts (`domain/types.ts`, `domain/schemas.ts`, `auth/session.ts`, `local/device-db.ts`, `i18n/en.ts`) change only with both devs agreeing in the PR.
- **Route tests that need a database** (Tasks 2 and 6) run against the Neon `dev` branch through a separate Vitest project (`pnpm test:db`). ASSUMPTION: CI runs `test:db` only when a `DATABASE_URL` secret is configured; otherwise the PR pastes the local `test:db` output. `pnpm test` must stay green without a database.
- Branch `feat/<step-id>-<slug>` as named per task; PR title `<step-id>: <summary>`; PR body lists `Closes #<ticket>`, the AC IDs advanced, and the pasted verification output.

## Superseded blueprint text (D-048)

The blueprint is not edited by this plan; these lines are read as superseded:
- Target structure: `server/db.ts (PrismaClient singleton + PrismaNeon adapter)` → `server/db.ts` exporting the `@prisma/orm-postgres` client; `prisma/ # schema.prisma + migrations/` → `prisma/contract.prisma`, `contract.json`, `contract.d.ts`, migrations as planned by `prisma migration plan`.
- A1b task 2 (`pnpm prisma init`) → already done on the A1a branch with the Prisma 8 config.
- A3 task 5 (`prisma/schema.prisma`, `@@map`/`@map`, `@db.Uuid`, `@db.Decimal`, CHECK constraints in hand-edited migration SQL via `--create-only`) → models in `prisma/contract.prisma`; CHECK constraints as `@@check(expression: sql\`…\`, name: "…")` in the contract, so the migration planner emits them.
- A3 task 6 (`PrismaNeon`, WebSocket pool, `globalThis` caching) and task 8 (`prisma.$transaction`, P2002) → `db.transaction(async (tx) => …)` and Prisma 8's unique-violation error shape (whatever the runtime surfaces for Postgres `23505`; do not assume the code `P2002`).
- A5 task 2 (`createMany({ skipDuplicates: true })`, `$executeRaw`) → `INSERT … ON CONFLICT (id) DO NOTHING` for transactions and lines and the conditional `ON CONFLICT … DO UPDATE … WHERE` for master rows, through `db.sql` if it can express the conflict clause, otherwise the parameterised `db.raw.sql` tagged template (see open question P1-Q8).
- Spec §1 "Prisma with the Neon driver adapter" is likewise superseded.

---

## Task 1: P1-1 (B1): Domain core, the numbers the merchant trusts

### Parent

#2 (Phase 1: Authentication & data foundation). Blueprint step **B1**, branch `feat/b1-domain-core`. Agent: backend. Model: **strongest**. Lane: Dev B.

### What to build

Every figure a merchant will see (Faida Halisi, what Wanjiku owes, how many trays are left, whether a deni is overdue) comes from one set of pure, tested functions, so the screens built in Phases 2 to 4 can never disagree with each other or with the merchant's own sums (R-003).

- Pure TypeScript in `domain/`: no React, Dexie, network or `Date.now()` inside calculations (pass `now`/`today` in).
- `domain/types.ts`: `Id`, `Cents`, `Item`, `Customer`, `Supplier`, `Txn`, `TxnLine` exactly as blueprint B1 task 1 and spec §6, including the conventions (payments total = paid; opening balance paid 0 and exactly one party; stock adjustment total 0 with signed line quantities; void total 0, `voidsTxnId` set, copies the original's party ids). `purchase` and `supplier_payment` are not in the union.
- `domain/schemas.ts`: Zod schema per entity plus `DraftSale`, `DraftExpense`, `DraftPayment`, `DraftOpening`, `DraftStockAdjustment`; money non-negative integer; quantity at most 3 decimals.
- `domain/money.ts`: `toCents`, `fromCents`, `formatKES` (`KES 1,250`, decimals only when non-zero), `lineTotal`.
- `domain/ledger.ts`: `activeTxns`, `customerBalance`, `openDeni` (FIFO; credits = sale remainders and opening balances; overpayment carries forward), `isOverdue`, `supplierOwed` (opening balances only), `stockOnHand` (goods only), `canVoid`.
- `domain/summary.ts`: `daySummary(txns, lines, range)` → `{ sales, cogs, expenses, faidaHalisi, cashIn, mpesaIn, otherIn }`.
- `domain/dates.ts`: `nairobiDayRange`, `todayInNairobi`, `resolveDueRule('kesho'|'ijumaa'|'wiki_ijayo'|'mwisho_wa_mwezi', today)`; Ijumaa on a Friday means the next Friday.
- `domain/grill.ts`: `runGrill(draft, ctx) → { hardErrors, issues }`; hard errors `SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, `DENI_NEEDS_CUSTOMER` (D-038); issues `NEGATIVE_STOCK`, `BELOW_COST`, `PRICE_VARIANCE` (> threshold, default 30%), `POSSIBLE_DUPLICATE` (same type + set customer + same total within 10 min) with severity from the profile.
- `domain/operating-profile.ts`: profile Zod schema as blueprint B1 task 8, and `defaultProfile()` (every rule `warn`, threshold 30, default expense categories from DOMAIN.md).

### Acceptance criteria

- [ ] Tests written first in `domain/*.test.ts`; `pnpm test domain --coverage` shows ≥ 90% line coverage for `domain` (AC-02)
- [ ] Worked example: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents; cash in 15000, M-Pesa in 20000 (AC-03, unit part)
- [ ] Deni scenario: Wanjiku 300 paid 100 → 200; pays 150 → 50; void the payment → 200; the void appears in her party-filtered ledger (AC-04, unit part)
- [ ] Otieno opening balance 500 → balance 500, day's sales 0 (AC-05, unit part)
- [ ] Opening stock 10, sale of 3 → `stockOnHand` 7; a further sale of 8 raises `NEGATIVE_STOCK` at `warn` with the default profile (AC-06, unit part)
- [ ] `openDeni`: FIFO across two credits; an opening balance as a credit; an overpayment carried forward
- [ ] `canVoid` rejects void-of-void and a double void
- [ ] `lineTotal(0.5, 12000) === 6000`
- [ ] A record at 00:30 EAT counts in that EAT day
- [ ] Each grill rule has a firing and a non-firing test; `DENI_NEEDS_CUSTOMER` is in `hardErrors`; a duplicate without a customer does not fire (AC-07, unit part)
- [ ] `resolveDueRule('ijumaa', <a Friday>)` returns the Friday after
- [ ] The PR description posts the final `types.ts` and `schemas.ts`; after merge they are frozen (R-011)
- [ ] lint, typecheck, test and build pass

### Blocked by

- #15

---

## Task 2: P1-2 (A3, server): Server contract, tenancy guard and bootstrap API

### Parent

#2 (Phase 1). Blueprint step **A3** (tasks 2, 5, 6, 7, 8), under D-048. Branch `feat/a3-server-contract-bootstrap`. Agent: backend. Model: default. Lane: Dev A.

### What to build

The first time a merchant signs in, their business is created for them on a server in Frankfurt with no form to fill, a double tap never creates two businesses, and no request without a valid session ever touches the database. This is the server half of A3; the sign-in screen is Task 3.

- `prisma/contract.prisma` with the A3 tables (snake_case storage names): `profiles`, `businesses`, `business_members` (role check `owner`; `profile_id` unique), `customers`, `suppliers`, `items` (kind check goods/service), `transactions` (R0 types only; no `updated_at`; no balance columns; `total_amount >= 0`, `amount_paid >= 0`), `transaction_items` (`quantity <> 0`), `merchant_settings` (pk `business_id`, `settings` jsonb). Column lists exactly as blueprint A3 task 5.
  - Synced tables: uuid ids with **no** default (D-018). `profiles` and `businesses` may default to `gen_random_uuid()`.
  - Money `numeric(14,2)`, quantity and `low_stock_threshold` `numeric(14,3)`.
  - CHECK constraints via `@@check` in the contract. Indexes `(business_id, created_at)` on transactions and transaction_items; `(business_id, updated_at)` on customers, suppliers, items.
- `pnpm db:generate` output (`contract.json`, `contract.d.ts`) committed; first migration planned and applied to the Neon `dev` branch only (production `main` is migrated in A6).
- `server/db.ts`: one `@prisma/orm-postgres` client on `DATABASE_URL`, created once per server instance (cached across dev hot reloads).
- `server/tenant.ts`: `requireMember(): Promise<{ profileId: string; businessId: string }>`, from Clerk `auth()`; throws an error the routes map to **401** with no session and **403** with no membership.
- `proxy.ts` at the repo root: `clerkMiddleware()` with a matcher for `/api/:path*` and Clerk's required paths; no `auth.protect()`; never redirects pages.
- `POST /api/bootstrap` in one `db.transaction`: upsert profile by `clerk_user_id`; find membership or create business + owner membership; on a unique violation of `business_members.profile_id`, re-read the membership. Returns `BootstrapResponse` (`hasData` = the business has any row in customers, suppliers, items, merchant_settings or transactions). Business `name`, `business_type`, `market_location` start empty (Q-016).
- **Hand-off contract to Task 3:** `auth/bootstrap.ts` exports
  ```ts
  export type BootstrapResponse = {
    profileId: string; businessId: string; clerkUserId: string; email: string;
    hasData: boolean;
  };
  export class BootstrapError extends Error { status: 401 | 403 | 500 | 0 } // 0 = network
  export function bootstrap(): Promise<BootstrapResponse>; // same-origin POST with the Clerk session cookie
  ```
- `.env.example` unchanged unless a variable is missing; no secrets committed.

### Acceptance criteria

- [ ] `pnpm db:generate` is clean and `contract.json`/`contract.d.ts` match the committed files (CI diff check)
- [ ] The planned migration applies to the Neon `dev` branch; `\d transactions` (pasted in the PR) shows the CHECK constraints, `numeric(14,2)` money and no default on `id`
- [ ] `test:db`: `Promise.all([bootstrap(), bootstrap()])` for one Clerk user gives exactly one profile, one business and one owner membership (AC-12)
- [ ] `test:db`: a second bootstrap for the same user returns the same `profileId` and `businessId`; `hasData` is false for an empty business and true after inserting one customer row
- [ ] Route test: no session → 401; session with no membership on a guarded route → 403
- [ ] Smoke test against `pnpm build && pnpm start`: a no-cookie `POST /api/bootstrap` returns **401, not 500** (AC-12, proves `proxy.ts`)
- [ ] Loading any app page with the network off is not affected by the proxy (no redirect; the #18 offline test still passes)
- [ ] No `@prisma/client`, `@prisma/adapter-neon` or `schema.prisma` in the repo; no string-built SQL
- [ ] No email, Clerk user id or request body is logged
- [ ] lint, typecheck, test and build pass

### Blocked by

- #16
- Precondition: Neon `dev` branch URLs in `.env` (main session)

---

## Task 3: P1-3 (A3, sign-in): "Karibu Mazao" sign-in with the privacy notice

### Parent

#2 (Phase 1). Blueprint step **A3** (tasks 3 and 4), plus blueprint **A4 task 6** (the D-039 refusal), which is moved here because it runs in this screen's post-sign-in flow. Branch `feat/a3-sign-in-privacy`. Agent: frontend. Model: default. Lane: Dev A.

### What to build

A merchant opening Mazao for the first time sees "Karibu Mazao" with "Welcome to Mazao" beneath, over a Gikomba photograph, reads three plain lines about their data, ticks "I agree", and signs in with an emailed code or Google. Their business is created, their old records come back if they had any, and they go straight on to choose a PIN. If someone else's account already lives on the phone, they are told whose phone it is and nothing changes.

- `<ClerkProvider>` in the root `app/layout.tsx` without the `dynamic` prop; app pages never wait on Clerk.
- `app/(shell)/sign-in/[[...sign-in]]/page.tsx`: on-image `PageTitle` "Karibu Mazao / Welcome to Mazao" over the `auth-background` (#20 component; plain scrim colour if #20 is not merged yet), solid Surface panel holding:
  - privacy card: what we store (account email, the business records you enter), stored in the EU, how to delete (ASSUMPTION per spec: ask the pilot team), the PIN never leaves the phone, link to `/privacy` (#22) or the full text;
  - "I agree" checkbox; Clerk `<SignIn />` (email code + Google) is not interactive until ticked;
  - acceptance recorded in `deviceDb.meta` key `privacyAccepted` = `{ version, acceptedAt }` (spec ASSUMPTION; Q-014).
- Offline state: "You're offline. Connect once to sign in." and the send button disabled. `/sign-in` added to the precache (spec ASSUMPTION for Q-015) so this renders offline instead of a browser error.
- `auth/after-sign-in.ts`, a pure, tested decision function:
  ```ts
  export type SignInMode = 'first' | 'reset';
  export type AfterSignIn =
    | { kind: 'refuse_other_owner'; ownerEmail: string }   // D-039
    | { kind: 'reset_mismatch' }                           // forgot PIN, different profile
    | { kind: 'restore_then_set_pin' }
    | { kind: 'set_pin' };
  export function decideAfterSignIn(input: {
    mode: SignInMode; boot: BootstrapResponse; existing: DeviceAccount | undefined;
  }): AfterSignIn;
  export type PendingSignIn = BootstrapResponse & { mode: SignInMode };
  export const PENDING_SIGN_IN_KEY = 'pendingSignIn';
  ```
  The page reads `mode` from `?mode=reset` (used by Task 5's Forgot PIN), calls `bootstrap()`, then:
  - refuse → "This phone belongs to <email>. Ask the owner to remove their account in Mipangilio first." and nothing is written;
  - reset mismatch → an error message and nothing is written (copy: P1-Q3);
  - otherwise writes `PendingSignIn` to `deviceDb.meta[PENDING_SIGN_IN_KEY]`, runs `restore(businessId)` if `hasData` and mode is `first`, then `router.replace('/set-pin')`.
- **Hand-off contract to Task 6:** `sync/restore.ts` created here as a no-op stub, `export async function restore(businessId: string): Promise<void>`; Task 6 implements it. If Cut 1 is applied, the stub stays and AC-19 is waived.
- **Hand-off contract to Task 5:** `PendingSignIn` in `deviceDb.meta[PENDING_SIGN_IN_KEY]`, consumed and deleted by `/set-pin`.
- All strings in `i18n/en.shell.ts`. Nothing about the user (email, Clerk id) is logged.

### Acceptance criteria

- [ ] Playwright, built app: the Clerk sign-in inputs and the Google button are disabled (or not rendered) until "I agree" is ticked (AC-14, automated part)
- [ ] Playwright, built app, cold offline: `/sign-in` renders the bilingual title and the offline message, with the send button disabled
- [ ] Unit tests for `decideAfterSignIn`: different `clerkUserId` on an existing account → refuse with that account's email; reset with a different `profileId` → mismatch; first with `hasData` → restore then set PIN; first with no data → set PIN; reset with the same profile → set PIN
- [ ] Component or e2e test: on refuse, `deviceDb.accounts` and `meta` are unchanged
- [ ] `privacyAccepted` is written with a version and an ISO time when the box is ticked
- [ ] Manual on the preview (main session's Clerk instance): sign in with an email code and with Google after accepting; rows appear in Neon `dev` (AC-14; recorded in the PR or deferred to Task 7)
- [ ] The background image is decorative (empty alt); text over it uses the on-image `PageTitle` colours
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 2
- #17
- #18
- #20 (soft: use the background component if merged, otherwise the solid scrim colour)
- Precondition: Clerk instance keys (main session)

---

## Task 4: P1-4 (B2): Local data and the single commit path

### Parent

#2 (Phase 1). Blueprint step **B2**, branch `feat/b2-local-commit`. Agent: backend. Model: **strongest**. Lane: Dev B.

### What to build

Every record a merchant confirms is saved on the phone instantly, with no network, and shows in their lists and totals at once. A save that fails halfway leaves nothing behind, and every save is queued for backup in the same step, so nothing can be recorded without also being backed up later.

- `local/business-db.ts`: Dexie `mazao-<businessId>` with `items, customers, suppliers, txns, lines, settings, syncQueue(++seq, table, rowId, op, attempts, nextAttemptAt, lastError), onboarding(key)`; indexes `txns: id, occurredAt, type, customerId, supplierId, voidsTxnId` and `lines: id, txnId, itemId`.
- `local/commit.ts`: `commitSale`, `commitExpense`, `commitPayment`, `commitOpening`, `commitStockAdjustment`, `commitVoid(txnId)`, `addItem`, `upsertCustomer`, `upsertSupplier`, `saveSettings`. Each: Zod parse → `runGrill` → `CommitError` on hard errors (no override possible) → `NeedsOverride(issues)` on block-level issues unless `opts.override === true` (codes go into `txn.overrides`) → stamp uuid v4, `createdBy`, `createdAt`/`occurredAt`/`updatedAt` (`toISOString()`), `unitCost` = item `buyingPrice` (D-015) → **one** Dexie transaction writing rows and `syncQueue` entries in parent order (new customer → txn → lines). `commitVoid` rejects when `!canVoid` and copies party ids.
- `local/queries.ts` hooks calling only B1 functions: `useToday`, `useTodaySales`, `useTodayExpenses`, `useCustomersWithBalance`, `useCustomerLedger(id)`, `useItemsWithStock`, `useRecentItems(n)`, `useDaySummary(today)`, `useLowStock`, `useUnsyncedCount` (queue entries whose table is not `lines`). Also `useOldestUnsyncedAt()` for Task 6's banner.
- `useBusinessDb()` context opening `mazao-<businessId>` from `useSession()`.
- **Hand-off contract to Task 6 and Phases 2 to 4:** the exported `commit.ts` and `queries.ts` signatures and the `syncQueue` row type (`SyncQueueEntry`), posted in the PR description and treated as frozen after merge.

### Acceptance criteria

- [ ] Vitest + `fake-indexeddb/auto`, tests written first
- [ ] A credit sale with a new customer creates exactly 1 customer, 1 txn, n lines and queue entries in parent order, in one Dexie transaction
- [ ] A commit that throws midway (forced failure) leaves no rows and no queue entries
- [ ] `override: true` on a sale with deni and no customer still throws `DENI_NEEDS_CUSTOMER` (AC-07)
- [ ] With a profile seeded `rules.negativeStock = 'block'`, overselling throws `NeedsOverride`; with override it saves `overrides: ['NEGATIVE_STOCK']` (AC-08, unit part)
- [ ] A void reverses the customer balance and the stock; a second void of the same txn is rejected (AC-04, AC-06 at this level)
- [ ] `useUnsyncedCount` after 2 sales (3 lines), 1 expense and 1 payment returns 4 (AC-16, count part)
- [ ] Every stored timestamp ends in `Z` and parses back to the same instant
- [ ] No page or component imports Dexie tables directly (grep in the PR)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1

---

## Task 5: P1-5 (A4): PIN lock, "Fungua Mazao"

### Parent

#2 (Phase 1). Blueprint step **A4** (tasks 1 to 5; task 6 is in Task 3), branch `feat/a4-pin-lock`. Agent: frontend. Model: default. Lane: Dev A.

### What to build

After signing in once, a merchant opens Mazao at the stall with a 4-digit PIN on a big keypad, with or without network. The app locks itself after 5 minutes in the background and on every cold start, guessing is slowed down by a growing wait that survives a restart, and a forgotten PIN can be reset online with an email code without losing any records.

- `auth/pin.ts` (pure, tested): `hashPin(pin, salt)` PBKDF2-SHA256, 150,000 iterations, 16-byte salt, 32-byte output; `verifyPin` constant-time; `isWeakPin` (`0000`, `1234`, any four repeated digits); `lockoutUntil(failures, now)` = `now + 30 s × 2^(failures − 5)` from the 5th failure.
- `/set-pin` (`app/(shell)/set-pin/page.tsx`): reads `PendingSignIn` from `deviceDb.meta` (Task 3 contract); two entries that must match; weak PINs refused with the reason; copy "Remember this PIN. To reset it you will need internet."; creates or updates the single `accounts` row (with `clerkUserId`), resets failures, deletes the pending key, sets the session, then `router.replace(await nextRouteAfterPin())`. With no pending key and no account it goes to `/sign-in`.
- `/lock` (`app/(shell)/lock/page.tsx`): business name (empty until Phase 2 sets it, then shown) and email, PIN pad with keys ≥ 64 dp and labelled for screen readers, countdown announced (`aria-live`) during lockout. Failures and `lockedUntil` persist in the account row. Success resets them, sets the in-memory session and goes to `await nextRouteAfterPin()` (refines blueprint A4 task 3's `/`, so Phase 2's resume rule applies after every PIN entry; see PR notes). No "Switch account" or "Add another account" (D-039).
- `LockGuard` in `app/(app)/layout.tsx`: no device account → `/welcome` if #22 shipped, else `/sign-in` (Cut 0); account but no session → `/lock`; hidden > 5 min (`visibilitychange`) → clear session and lock. Session is memory-only, so every cold start shows `/lock`.
- Forgot PIN on `/lock`: offline → "Connect to the internet to reset your PIN"; online → `await clerk.signOut()` first, then `/sign-in?mode=reset` (Task 3 handles bootstrap and the same-profile check), then `/set-pin`. Local data is kept.
- `/lock` and `/set-pin` use the `auth-background` (#20) under the scrim. Strings in `i18n/en.shell.ts`. PIN, hash and salt are never logged.

### Acceptance criteria

- [ ] Vitest: hash/verify round trip; wrong PIN fails; weak PINs `0000`, `1234`, `7777` rejected; lockout durations for failures 5, 6, 7 are 30 s, 60 s, 120 s
- [ ] Playwright `e2e/pin.spec.ts` against the build: seed an account, go offline; 5 wrong PINs show a countdown of ≥ 30 s; reloading the page keeps the countdown; the right PIN unlocks offline; hidden > 5 min (fake clock) relocks (AC-10, AC-18 automated part)
- [ ] Playwright: Forgot PIN offline shows the connect message and changes nothing (AC-22, offline part)
- [ ] Playwright: a fresh profile with no account opening `/` lands on `/welcome` (or `/sign-in` if #22 is cut); an account with no session lands on `/lock`
- [ ] Unit or component test: Forgot PIN online calls `signOut` before navigating to `/sign-in?mode=reset`
- [ ] PIN keys are ≥ 64 px and have accessible names; the countdown is in an `aria-live` region
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 3
- #17
- #18
- #20 (soft, as in Task 3)

---

## Task 6: P1-6 (A5): Backup to the server, restore on a new phone, and the backup chip

### Parent

#2 (Phase 1). Blueprint step **A5**, under D-048, branch `feat/a5-sync-push-pull`. Agent: backend. Model: **strongest**. Lane: Dev A.

### What to build

Records saved offline at the stall reach the server within about a minute of the network returning, without the merchant doing anything. The chip in the top bar always says "Backed up", "Saving…", "Not backed up (n)" or "Sign in to back up". A merchant who signs in on a new phone gets their deni and today's totals back before setting a PIN. Retries never duplicate a record and one business can never write over another's rows.

- `sync/wire.ts`: Zod wire schemas and `toWire`/`fromWire` per table; cents ↔ `"150.00"` (`Math.round(Number(s) * 100)`); timestamps normalised with `new Date(x).toISOString()`. The only place this conversion happens.
- `POST /api/sync/push` (`PushRequest`/`PushResponse` as spec §8, max 500 rows): `requireMember()` first; 403 for the whole batch if any row's business id differs, or any `transaction_items` row's parent transaction belongs to another business. One `db.transaction` in parent order (customers, suppliers, items, merchant_settings, transactions, transaction_items). Transactions and lines: insert with `ON CONFLICT (id) DO NOTHING`. Master rows: conditional upsert that updates only when `stored.updated_at < incoming.updated_at AND stored.business_id = incoming.business_id`. Settings: conflict on `business_id`. `accepted` = every id in the batch after commit.
- `GET /api/sync/pull?since=<ISO>`: the business's rows changed after `since` (`updated_at` for master rows and settings, `created_at` for transactions and lines), paged at 1,000, `{ rows, nextSince }`.
- `sync/engine.ts`: `flush()` sends up to 200 due queue entries in `seq` order with Clerk `getToken()`, only when Clerk's `userId` equals the session's `clerkUserId`; deletes accepted entries; network/5xx → `attempts++`, `nextAttemptAt = now + min(5 min, 2^attempts s)`; 401/403 → stop retrying, status `sign_in_to_back_up`. Triggers: session becomes non-null (unlock), `online`, 5 s after a commit (debounced), every 60 s while visible and online. On `online` with Clerk not loaded (cold offline start), remount `<ClerkProvider key={n}>` in the root layout.
- `sync/restore.ts`: replaces Task 3's stub; pulls from the epoch into `mazao-<businessId>` **without** queue entries.
- `useSyncStatus()` (`SyncStatus` as spec §8) replaces the #17 stub hook behind the shell chip; banner when the oldest unsynced record is > 3 days old or status is `sign_in_to_back_up`. Copy exactly `Backed up`, `Saving…`, `Not backed up (n)`, `Sign in to back up`.
- `navigator.storage.persist()` after the first unlock.
- Mount point: a `<SyncRunner />` in `app/(app)/layout.tsx` (Task 5's file, same lane, merged first).

### Acceptance criteria

- [ ] Unit tests for `wire.ts`: `"150.00"` ↔ 15000; `"0.10"` ↔ 10; a Postgres `+00` timestamp normalises to the `Z` form; quantity keeps 3 decimals
- [ ] `test:db` push: the same batch twice leaves row counts unchanged and `accepted` lists every id both times (AC-11)
- [ ] `test:db` push: a row with a foreign `businessId` → 403 for the whole batch; a line whose parent transaction belongs to another business → 403 (AC-11)
- [ ] `test:db` push: a customer id that exists under another business, sent with our business id, is not overwritten (AC-11)
- [ ] `test:db` push: LWW keeps the newer row when an older `updated_at` arrives second (AC-11)
- [ ] `test:db` push: `merchant_settings` upserts by `business_id`
- [ ] `test:db` pull: paging at 1,000 returns every row once and `nextSince` advances; another business's rows never appear
- [ ] Engine test with a fake fetch: 500 then success empties the queue with backoff; 403 stops retries and sets `Sign in to back up` (AC-11); no flush when Clerk's user differs from the device account (D-039)
- [ ] Restore test (fake-indexeddb + fake pull): after restore, `useCustomersWithBalance` and `useDaySummary(today)` match the source data and the queue is empty (R-019)
- [ ] Playwright against the build, signed in with `@clerk/testing` (skill `clerk-testing`) and `/api/sync/push` routed to a stub: records and queue entries seeded offline into the business database by the test (`page.evaluate`, since no record screens exist yet; test seeding is not a page write) show `Not backed up (n)`; going online shows `Saving…` then `Backed up` within 60 s (AC-17, automated part; the Neon check on a real phone is in the Phase 4 A6 acceptance run)
- [ ] No record contents logged on either side
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 2
- Task 4
- Task 5

---

## Task 7: P1-7 (QA): Phase 1 evidence on a real phone

### Parent

#2 (Phase 1). No blueprint step; collects the acceptance evidence that spans Tasks 3, 5 and 6 before Phases 2 to 4 build on them. Agent: qa. Model: default. Evidence is posted as a comment on #2; a branch `feat/p1-qa-auth-e2e` is used only if new Playwright tests are added.

### What to build

Proof, on the preview URL and a real Android phone, that a merchant can sign in, set a PIN, record offline, get backed up, restore on a second device and reset a forgotten PIN, before any screen is built on top.

### Acceptance criteria

- [ ] AC-14: privacy notice blocks sign-in until accepted; email code and Google both work (screenshots)
- [ ] AC-18: close and reopen offline; PIN unlocks
- [ ] AC-17 and AC-19 (partial): no screen can create records until Phase 3, so here they are checked only at the automated level (Task 6 `test:db`, engine and restore tests, linked) plus: sign in on a second browser profile with the same account and confirm bootstrap returns the same `businessId` and the app reaches `/set-pin` without error. The full on-device AC-16, AC-17 and AC-19 runs belong to the Phase 4 A6 acceptance run (AC-19 waived if Cut 1 is applied)
- [ ] AC-22: Forgot PIN online signs out of Clerk first, requires the email code, keeps data; a different Clerk user on the same phone is refused
- [ ] One PIN unlock timed on the 3 GB phone; if > 800 ms, raise it per P1-Q5 (Q-018)
- [ ] Results recorded per AC with pass/fail and evidence

### Blocked by

- Task 3
- Task 5
- Task 6

---

## Open questions (spec silent on merchant-visible behaviour)

Plan-local IDs; the main session assigns `Q-0xx` numbers when adding them to `planning/QUESTIONS.md`. Existing spec questions Q-014 to Q-018 still apply.

- **P1-Q1 (Task 3):** What does the merchant see while bootstrap and restore run after sign-in, and what happens if the network drops during restore? Options: retry button on the sign-in screen; or continue to set PIN with partial data and finish restore later. The blueprint is silent; restore currently blocks set PIN.
- **P1-Q2 (Task 3):** What does the sign-in screen show if bootstrap fails with a 5xx or network error after Clerk sign-in succeeded? (Proposed copy: "Could not reach Mazao. Check your connection and try again." with a retry button.)
- **P1-Q3 (Tasks 3, 5):** Copy for Forgot PIN when the email code signs in a different account than the one on the phone (`reset_mismatch`). The blueprint says "show an error and change nothing".
- **P1-Q4 (Task 5):** Should the PIN lockout wait have a ceiling? `30 s × 2^(n − 5)` reaches about 8.5 hours at 15 failures; a child playing with the phone could lock the merchant out for a market day. D-024 has no cap.
- **P1-Q5 (Tasks 5, 7):** Same as Q-018: who records the superseding decision if 150,000 PBKDF2 iterations exceed 800 ms on the 3 GB phone?
- **P1-Q6 (Tasks 3, 6):** When the chip shows `Sign in to back up`, how does the merchant sign in again? Nothing in R0 links to `/sign-in` once an account exists (Mipangilio in A6 has no sign-in action). ASSUMPTION to confirm: tapping the chip or banner opens `/sign-in`, and after sign-in with the same Clerk user the app returns to `/` without changing the PIN. If confirmed, Task 3 adds a `reauth` branch to `decideAfterSignIn` and Task 6 makes the chip tappable in that state; if not decided before Task 3 starts, the chip stays non-interactive and R-017 is mitigated only by the week-1 coordinator visit.
- **P1-Q7 (Task 5):** The unlock screen shows the business name, but bootstrap creates it empty and Phase 2 sets it only in the local profile (Q-016). Should `/lock` show the email alone until a profile exists? (Plan assumes yes.)
- **P1-Q8 (Task 6, technical, for the main session):** D-048 names `db.sql` for the conditional LWW upsert. If the Prisma 8 SQL builder cannot express `ON CONFLICT … DO UPDATE … WHERE`, may Task 6 use the parameterised `db.raw.sql` tagged template? Proposed D-048 clarification: yes.
