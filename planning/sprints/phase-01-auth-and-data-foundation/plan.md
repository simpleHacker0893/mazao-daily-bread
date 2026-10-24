# Phase 1 implementation plan (tickets to be created)

Spec: `planning/sprints/phase-01-auth-and-data-foundation/spec.md` (GitHub #2). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` steps **B1, A3, B2, A4, A5**, read together with **D-048** (Prisma ORM 8) and **D-049** (English by default, Kiswahili as a switch). Both were merged to `main` with the A1a skeleton (#25); they override the blueprint and spec wording listed under "Superseded text" below.
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. Phase 0 tickets are #15–#22; dependencies on tasks in this plan say "Task N" until the issues exist.

One blueprint step = one task. **A3 is split in two** (Tasks 2 and 3) because a backend specialist (schema, API, proxy) and a frontend specialist (sign-in screen) work in different files; the hand-off contract is named in both tasks. Task 7 is an evidence-only QA ticket with no blueprint step, because AC-14, AC-17, AC-18, AC-19 and AC-22 can only be checked once Tasks 3, 5 and 6 are all merged.

**Revision 2 (review of PR #24):** fixes the PIN-reset bypass in the post-sign-in decision (C1), Clerk sign-out on refusal (M1), race-safe bootstrap (M2), the pull cursor (M3), bad-row handling in push (M4), LWW on settings (M5), the seams with PR #23 (M6), grill rules per transaction type (M7), the default profile (M8), the AC-19 check (M10), Prisma version alignment (M11), and moves five undecided behaviours to open questions (M12). It also applies the owner's D-049 language change.

## Task overview

| Task | Ticket | Step | Lane | Agent | Model | Branch | Blocked by |
|---|---|---|---|---|---|---|---|
| 1 | P1-1 | B1 | Dev B | backend | **strongest** | `feat/b1-domain-core` | #15 |
| 2 | P1-2 | A3 (server) | Dev A | backend | default | `feat/a3-server-contract-bootstrap` | #16, #18, **Prisma versions aligned (hard)** |
| 3 | P1-3 | A3 (sign-in) | Dev A | frontend | **strongest** | `feat/a3-sign-in-privacy` | Task 2, #17, #18, #20 (soft) |
| 4 | P1-4 | B2 | Dev B | backend | **strongest** | `feat/b2-local-commit` | Task 1 |
| 5 | P1-5 | A4 | Dev A | frontend | default | `feat/a4-pin-lock` | Task 3, #17, #18, #20 (soft) |
| 6 | P1-6 | A5 | Dev A | backend | **strongest** | `feat/a5-sync-push-pull` | Task 2, Task 4, Task 5 |
| 7 | P1-7 | (evidence) | both | qa | default | none (evidence on #2), or `feat/p1-qa-auth-e2e` if tests are added | Task 3, Task 5, Task 6 |

Task 3 moves to the strongest model because it now holds the account-takeover guard (`decideAfterSignIn` and the pending sign-in check, C1).

Critical path: #15 → Task 1 → Task 4 → Task 6. Lane A runs #16 → Task 2 → Task 3 → Task 5 → Task 6 in parallel with lane B.

**#20 is a soft blocker everywhere in Phases 1 and 2** (the auth/onboarding background component): a screen ticket uses the component if it has merged, otherwise the solid scrim colour, and a follow-up swap is a one-line change. Only the Phase 2 imagery check (P2-4, AC-31) is hard-blocked on #20.

## Preconditions owned by the main session (not tasks here)

- Neon project in `aws-eu-central-1` with a `dev` branch and `main`; the owner's git-ignored root `.env` has `DATABASE_URL` (pooled) and `DIRECT_URL` (unpooled) for `dev`. Needed by Task 2 and Task 6 route tests.
- Clerk development instance with email code and Google on, passwords and phone off, session lifetime at the plan maximum (A3 task 1); keys in `.env` and in Vercel preview env. Needed by Tasks 3, 5, 6 and 7.
- Vercel preview env vars for both of the above (Task 7 manual checks run on the preview).
- **Prisma versions aligned (hard precondition for Task 2).** `@prisma/orm-postgres` and the `prisma` CLI must be on the same exact release candidate before Task 2 starts. Target: both `8.0.0-rc.27`. Today `main` (after #25) has `@prisma/orm-postgres` `8.0.0-rc.20` with the CLI on `rc.27`, and D-048's merged text pins exactly that split. Either a devops change bumps `@prisma/orm-postgres` to `rc.27` (if published) and D-048 is amended to match, or the owner records why the split is kept. Task 2 does not start on a mismatched pair. The `rc.27` runtime APIs named in this plan (`db.sql`, `createAll`, the error shape) are **unverified** against the Prisma docs; Task 2 checks each one and records what it found in its PR.

## Global Constraints

- Everything in the Phase 0 plan's Global Constraints applies (pnpm only; latest Next.js App Router, no `src/`, React Compiler, no hand memoisation; `next build --webpack`; Biome; TS strict + `noUncheckedIndexedAccess`; client pages read only Dexie; `/api/*` and Clerk never cached; 48 px tap targets; tokens from `docs/design/stitch-prompts.md`; PR ready only when lint, typecheck, test and build pass).
- **Language (D-049, supersedes the naming parts of D-004 and D-040).** The UI is **English by default**; the merchant can switch the whole UI to Kiswahili. There are **no** bilingual "Kiswahili title with English beneath" titles, tab labels or chip captions.
  - Every string, including page titles and navigation labels, is a message key rendered with `t(key, locale)`. Each key has an `en` value and a `sw` value; the Kiswahili dictionary is typed against the English keys, so a missing translation fails typecheck. Dev A's keys live in the shell halves (`shell.*`), Dev B's in the ledger halves (`ledger.*`). File names and the merge follow the A1a i18n contract (on `main` since #25: `i18n/en.shell.ts`, `i18n/sw.shell.ts`, `i18n/en.ledger.ts`, `i18n/sw.ledger.ts`, merged by `i18n/en.ts`/`i18n/sw.ts`, rendered by `i18n/t.ts`).
  - The locale is a **device** setting, not a business setting, so it can be read before sign-in and offline. D-049: stored in `deviceDb.meta` under the key `locale`, value `'en' | 'sw'`, missing = `'en'` (OQ P1-Q13). Pages read it through the A1a/#17 locale hook; if neither ships one, Task 3 adds `i18n/use-locale.ts` (`useLocale(): Locale`, `useLiveQuery` on `deviceDb.meta`, `'en'` while loading) as a shared contract file both devs agree on.
  - The language switch itself is built in Settings (Phase 4, P4-4). Phases 1 and 2 build no switch (D-049 also says the choice is "offered once during sign-in or onboarding"; the revision brief puts it in Settings only, OQ P1-Q13b).
  - Market words stay untranslated in both locales (D-005): deni, Faida Halisi, ushuru, kilo, gunia, fundo, ndume, tray. **This differs from D-049's merged interim** (D-049 leaves the point open for the owner and meanwhile uses plain English, "Debts", "Net profit", in the `en` UI); this plan follows the revision brief (D-005) and raises the conflict as OQ P1-Q13c. Because every string is a dictionary value, either answer is a dictionary edit, not a code change (OQ P1-Q13).
  - Kiswahili values: use the Kiswahili names already in `docs/design/stitch-prompts.md` (Karibu Mazao, Fungua Mazao, Weka PIN…) for the `sw` titles; where no approved Kiswahili exists, the `sw` value is the English text and the key is listed in the PR body for the native-speaker check (Q-006, OQ P1-Q14). Builders do not invent Kiswahili copy.
- **Prisma ORM 8 (D-048), not Prisma 7.** The data contract is `prisma/contract.prisma`; `pnpm db:generate` (`prisma contract emit`) writes `prisma/contract.json` and `prisma/contract.d.ts`, both committed. There is no `@prisma/client`, no `schema.prisma`, no `PrismaClient`, no `@prisma/adapter-neon`. Runtime client: `postgres({ contract })` from `@prisma/orm-postgres` in `server/db.ts`, using `DATABASE_URL`. Migrations: `pnpm db:migrate:dev --name <slug>` (`prisma migration plan`) then `pnpm db:migrate` (`prisma db migrate`), CLI on `DIRECT_URL`. Use the project skill `.claude/skills/prisma-8` (references `contract.md`, `migrations.md`, `queries-postgres.md`); do not copy Prisma 7 snippets. Query surfaces are `db.orm.public.<Model>`, `db.sql.public.<table>`, `db.raw.sql` and `db.transaction(async (tx) => …)`. No string-built SQL, ever.
  - A database-side uuid default is written ``@default(sql`gen_random_uuid()`)`` (Prisma 8 refuses `@default(uuid())`; `@onCreate(uuid())` is a client generator and is **not** what `profiles`/`businesses` need).
  - Bulk idempotent inserts use the Prisma 8 ORM `createAll(rows, { onConflict: 'skip' })` where it fits (unverified for `rc.27`: Task 2 confirms it exists and compiles to `ON CONFLICT DO NOTHING`); otherwise `INSERT … ON CONFLICT … DO NOTHING` through `db.sql`, then the parameterised `db.raw.sql` tagged template (OQ P1-Q8).
- **Money:** integer cents in `domain`, `local` and the client; `numeric(14,2)` money and `numeric(14,3)` quantity on the server; conversion only in `sync/wire.ts`; `lineTotal = Math.round(qty * unitPrice)`.
- **Ledger:** confirmed transactions are immutable; corrections are `void` + a new record; balances and stock are derived, never stored (D-018, D-019).
- **Tenancy:** every business-owned row has `businessId`/`business_id` and `createdBy`/`created_by`. Every API route calls `requireMember()` first and rejects any row from another business, **except `POST /api/bootstrap`**, which is the one route that cannot (it creates the membership): it calls `requireSession()` (Clerk `auth()` userId, 401 when absent) instead.
- **One save path:** pages never write to Dexie; every record goes through `local/commit.ts` (Zod → `runGrill` → one Dexie transaction with sync-queue entries). From Phase 3 on, pages call it through `local/save.ts` (PR #23, P3-1), which returns a `SaveOutcome`.
- **Privacy:** never log record contents, phone numbers, emails, PINs, PIN hashes or salts, on client or server (including test output and error messages sent to the console). The PIN never leaves the device.
- **Test-first** (red → green → refactor) for `domain`, `local`, `sync`, `auth` and API routes (`superpowers:test-driven-development`).
- **File ownership (R-011):** Dev A owns `app/(shell)/*`, `app/(app)/layout.tsx`, `app/api/*`, `auth/*`, `sync/*`, `server/*`, `ui/shell/*`, `proxy.ts`, `prisma/*`, `public/*`, config files, the shell i18n halves (`i18n/en.shell.ts`, `i18n/sw.shell.ts`). Dev B owns `domain/*`, `local/*`, other `app/(app)/*` pages, `ui/*` primitives, `ui/ledger/*`, the ledger i18n halves. Shared contracts (`domain/types.ts`, `domain/schemas.ts`, `auth/session.ts`, `local/device-db.ts`, `i18n/en.ts`, `i18n/sw.ts`, `i18n/t.ts`, `e2e/fixtures/*`) change only with both devs agreeing in the PR.
- **Route tests that need a database** (Tasks 2 and 6) run against the Neon `dev` branch through a separate Vitest project (`pnpm test:db`). ASSUMPTION: CI runs `test:db` only when a `DATABASE_URL` secret is configured; otherwise the PR pastes the local `test:db` output. `pnpm test` must stay green without a database.
- Branch `feat/<step-id>-<slug>` as named per task; PR title `<step-id>: <summary>`; PR body lists `Closes #<ticket>`, the AC IDs advanced, and the pasted verification output.

## Superseded text

The blueprint, acceptance file and spec are not edited by this plan; these lines are read as superseded.

**D-048 (Prisma 8):**
- Target structure: `server/db.ts (PrismaClient singleton + PrismaNeon adapter)` → `server/db.ts` exporting the `@prisma/orm-postgres` client; `prisma/ # schema.prisma + migrations/` → `prisma/contract.prisma`, `contract.json`, `contract.d.ts`, migrations as planned by `prisma migration plan`.
- A1b task 2 (`pnpm prisma init`) → already done on the A1a branch with the Prisma 8 config.
- A3 task 5 (`prisma/schema.prisma`, `@@map`/`@map`, `@db.Uuid`, `@db.Decimal`, CHECK constraints in hand-edited migration SQL via `--create-only`) → models in `prisma/contract.prisma`; CHECK constraints as `@@check(expression: sql\`…\`, name: "…")` in the contract, so the migration planner emits them; `default gen_random_uuid()` → ``@default(sql`gen_random_uuid()`)``.
- A3 task 6 (`PrismaNeon`, WebSocket pool, `globalThis` caching) and task 8 (`prisma.$transaction`, P2002) → `db.transaction(async (tx) => …)` and the race-safe bootstrap in Task 2 (no reliance on `P2002`).
- A5 task 2 (`createMany({ skipDuplicates: true })`, `$executeRaw`) → `createAll(rows, { onConflict: 'skip' })` or `INSERT … ON CONFLICT (id) DO NOTHING` for transactions and lines, and the conditional `ON CONFLICT … DO UPDATE … WHERE` for master rows and settings (see Task 6).
- Spec §1 "Prisma with the Neon driver adapter" is likewise superseded.

**D-049 (English by default):**
- Spec §3 and story 8 "Karibu Mazao / Welcome to Mazao" bilingual title → English title "Welcome to Mazao" by default, "Karibu Mazao" when the locale is `sw`. Same for "Fungua Mazao / Unlock Mazao" (→ "Unlock Mazao" / "Fungua Mazao") and "Weka PIN" (→ "Set your PIN" / "Weka PIN").
- AC-21 (bilingual labels and titles) → every navigation label and page title shows in English by default and in Kiswahili when the locale is `sw` (rewrite proposed in the PR body).
- Blueprint and spec references to `i18n/en.shell.ts` alone → the `en` and `sw` shell halves.

**Review fixes (this revision):**
- Blueprint A3 task 8 "on a unique violation … re-read the membership" inside the same transaction → Task 2's race-safe bootstrap (a statement after an error cannot run in an aborted Postgres transaction).
- Blueprint A5 task 3 pull "`> since` … `nextSince`" → Task 6's compound cursor.
- Blueprint A5 task 4 "Clerk provider remount on `online`" → built in Task 3 (it owns `<ClerkProvider>`), so Task 5's Forgot PIN can rely on it.

---

## Task 1: P1-1 (B1): Domain core, the numbers the merchant trusts

### Parent

#2 (Phase 1: Authentication & data foundation). Blueprint step **B1**, branch `feat/b1-domain-core`. Agent: backend. Model: **strongest**. Lane: Dev B.

### What to build

Every figure a merchant will see (Faida Halisi, what Wanjiku owes, how many trays are left, whether a deni is overdue) comes from one set of pure, tested functions, so the screens built in Phases 2 to 4 can never disagree with each other or with the merchant's own sums (R-003).

- Pure TypeScript in `domain/`: no React, Dexie, network or `Date.now()` inside calculations (pass `now`/`today` in).
- `domain/types.ts`: `Id`, `Cents`, `Item`, `Customer`, `Supplier`, `Txn`, `TxnLine` exactly as blueprint B1 task 1 and spec §6, including the conventions (payments total = paid; opening balance paid 0 and exactly one party; stock adjustment total 0 with signed line quantities; void total 0, `voidsTxnId` set, copies the original's party ids). `purchase` and `supplier_payment` are not in the union.
- `domain/schemas.ts`: Zod schema per entity plus `DraftSale`, `DraftExpense`, `DraftPayment`, `DraftOpening`, `DraftStockAdjustment`; money non-negative integer; quantity at most 3 decimals.
  - **Party on a draft (M6).** A draft that names a party takes either an existing id or a new party to create with it, so a new customer and its record are always saved together:
    ```ts
    type NewParty = { id?: Id; name: string; phone?: string }; // id stamped by commit when absent
    type DraftSale = { …; customerId?: Id; newCustomer?: NewParty; … };          // at most one of the two
    type DraftOpening = {
      amount: Cents; dueDate?: string; dueDateNote?: string; source: 'onboarding' | 'manual';
    } & (
      | { party: 'customer'; customerId: Id }
      | { party: 'customer'; newCustomer: NewParty }
      | { party: 'supplier'; supplierId: Id }
      | { party: 'supplier'; newSupplier: NewParty }
    );
    type DraftStockAdjustment = { itemId: Id; quantity: number; source: 'onboarding' | 'manual' }; // R0: positive only from the notebook
    ```
    The exact field names may change in this PR; the shape (existing id **or** new party, never both) may not. P3-1's `saveSale` already relies on `DraftSale` carrying a new customer (PR #23).
- `domain/money.ts`: `toCents`, `fromCents`, `formatKES` (`KES 1,250`, decimals only when non-zero), `lineTotal`.
- `domain/ledger.ts`: `activeTxns`, `customerBalance`, `openDeni` (FIFO; credits = sale remainders and opening balances; overpayment carries forward), `isOverdue`, `supplierOwed` (opening balances only), `stockOnHand` (goods only), `canVoid`.
- `domain/summary.ts`: `daySummary(txns, lines, range)` → `{ sales, cogs, expenses, faidaHalisi, cashIn, mpesaIn, otherIn }`.
- `domain/dates.ts`: `nairobiDayRange`, `todayInNairobi`, `resolveDueRule('kesho'|'ijumaa'|'wiki_ijayo'|'mwisho_wa_mwezi', today)`; Ijumaa on a Friday means the next Friday. The rule ids are code identifiers, not display text; chip labels come from i18n.
- `domain/grill.ts`: `runGrill(draft, ctx) → { hardErrors, issues }`; hard errors `SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, `DENI_NEEDS_CUSTOMER` (D-038); issues `NEGATIVE_STOCK`, `BELOW_COST`, `PRICE_VARIANCE` (> threshold, default 30%), `POSSIBLE_DUPLICATE` (same type + same party + same total within 10 min) with severity from the profile.
  - **Rule-to-type matrix (M7).** Each rule runs only for the draft types marked ✓; a rule never fires on a type it does not apply to.

    | Rule | sale | expense | customer_payment | opening_balance (customer) | opening_balance (supplier) | stock_adjustment | void |
    |---|---|---|---|---|---|---|---|
    | `SCHEMA` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
    | `ARITHMETIC` (line totals, sale total) | ✓ | | | | | | |
    | `PAID_EXCEEDS_TOTAL` | ✓ | | | | | | |
    | `DENI_NEEDS_CUSTOMER` | ✓ (paid < total) | | | | | | |
    | `NEGATIVE_STOCK` | ✓ (goods lines) | | | | | ✓ (negative lines only; none in R0 notebook) | |
    | `BELOW_COST` | ✓ (goods lines) | | | | | | |
    | `PRICE_VARIANCE` | ✓ (lines with an item) | | | | | | |
    | `POSSIBLE_DUPLICATE` | ✓ (customer set) | | ✓ | ✓ | ✓ | | |

    An opening balance always names exactly one party through `SCHEMA`; `DENI_NEEDS_CUSTOMER` never applies to it, so a supplier opening balance is never refused for having no customer. Stock-adjustment lines carry no price, so `ARITHMETIC`, `BELOW_COST` and `PRICE_VARIANCE` never run on them. `POSSIBLE_DUPLICATE` on an opening balance compares the same party (customer or supplier) and amount within 10 minutes. ASSUMPTION: duplicates of expenses are not checked (D-026 names "same type, party and amount", and expenses have no party).
- `domain/operating-profile.ts`: profile Zod schema as blueprint B1 task 8, and `defaultProfile()` (M8):
  - `businessName: ''`, `businessType: ''`, `location: ''` (the schema allows empty strings for these three, so a skipped onboarding still saves);
  - `sells: 'both'` (ASSUMPTION: the default hides nothing from the sale and stock screens);
  - `paymentMethods: ['cash', 'mpesa', 'other']`;
  - `deniEnabled: true`, `defaultDueRule: null` (ASSUMPTION: the default hides nothing);
  - `expenseCategories`: the DOMAIN.md default list;
  - every rule `warn`, price variance threshold 30.

### Acceptance criteria

- [ ] Tests written first in `domain/*.test.ts`; `pnpm test domain --coverage` shows ≥ 90% line coverage for `domain` (AC-02)
- [ ] Worked example: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents; cash in 15000, M-Pesa in 20000 (AC-03, unit part)
- [ ] Deni scenario: Wanjiku 30000 paid 10000 → 20000; pays 15000 → 5000; void the payment → 20000; the void appears in her party-filtered ledger (AC-04, unit part)
- [ ] Otieno opening balance 50000 → balance 50000, day's sales 0 (AC-05, unit part)
- [ ] Opening stock 10, sale of 3 → `stockOnHand` 7; a further sale of 8 raises `NEGATIVE_STOCK` at `warn` with the default profile (AC-06, unit part)
- [ ] `openDeni`: FIFO across two credits; an opening balance as a credit; an overpayment carried forward
- [ ] `canVoid` rejects void-of-void and a double void
- [ ] `lineTotal(0.5, 12000) === 6000`
- [ ] A record at 00:30 EAT counts in that EAT day
- [ ] Each grill rule has a firing and a non-firing test; `DENI_NEEDS_CUSTOMER` is in `hardErrors`; a duplicate without a party does not fire (AC-07, unit part)
- [ ] Matrix tests (M7): a supplier opening-balance draft (`party: 'supplier'`, amount 80000) returns no hard errors and no `DENI_NEEDS_CUSTOMER`; an opening-stock draft (10 tray, item with buying price above selling price) returns no `ARITHMETIC`, `BELOW_COST` or `PRICE_VARIANCE`; a customer opening balance with `newCustomer` passes `SCHEMA`; a draft with both `customerId` and `newCustomer` fails `SCHEMA`
- [ ] `defaultProfile()` parses with the profile schema, has `paymentMethods` `['cash','mpesa','other']`, `sells: 'both'` and every rule `warn` (M8)
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

- `prisma/contract.prisma` with the A3 tables (snake_case storage names): `profiles` (`clerk_user_id` unique, `email`), `businesses`, `business_members` (role check `owner`; `profile_id` unique), `customers`, `suppliers`, `items` (kind check goods/service), `transactions` (R0 types only; no `updated_at`; no balance columns; `total_amount >= 0`, `amount_paid >= 0`), `transaction_items` (`quantity <> 0`), `merchant_settings` (pk `business_id`, `settings` jsonb, `updated_at`). Column lists exactly as blueprint A3 task 5.
  - Synced tables: uuid ids with **no** default (D-018). `profiles` and `businesses` default with ``@default(sql`gen_random_uuid()`)``.
  - Money `numeric(14,2)`, quantity and `low_stock_threshold` `numeric(14,3)`.
  - CHECK constraints via `@@check` in the contract. Indexes `(business_id, created_at, id)` on transactions and transaction_items; `(business_id, updated_at, id)` on customers, suppliers, items (the trailing `id` serves Task 6's cursor).
- `pnpm db:generate` output (`contract.json`, `contract.d.ts`) committed; first migration planned and applied to the Neon `dev` branch only (production `main` is migrated in A6).
- `server/db.ts`: one `@prisma/orm-postgres` client on `DATABASE_URL`, created once per server instance (cached across dev hot reloads).
- `server/tenant.ts`:
  - `requireSession(): Promise<{ clerkUserId: string }>` from Clerk `auth()`; throws an error the route maps to **401** with no session. Used only by `/api/bootstrap`.
  - `requireMember(): Promise<{ profileId: string; businessId: string }>`; **401** with no session, **403** with no membership. Every other route calls it first.
- `proxy.ts` at the repo root: `clerkMiddleware()` with a matcher for `/api/:path*` and Clerk's required paths; no `auth.protect()`; never redirects pages.
- `POST /api/bootstrap`, **race-safe without relying on an error inside a transaction** (M2). A Postgres transaction that hit a unique violation is aborted, so no read can follow it in the same transaction. In one `db.transaction`:
  1. Profile: `INSERT INTO profiles (clerk_user_id, email) … ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = now() RETURNING id` (the ORM `upsert` if Task 2 confirms it compiles to this single statement; otherwise `db.sql`). A concurrent caller waits on the row lock instead of failing.
  2. Membership: select by `profile_id`. If found, use it.
  3. If not found: insert a new business, then `INSERT INTO business_members … ON CONFLICT (profile_id) DO NOTHING RETURNING business_id`. If no row comes back, a concurrent call won: delete the business inserted in step 3 (same transaction, so no orphan) and select the winner's membership (a new statement in READ COMMITTED sees the committed row).
  4. Fallback only if step 3 cannot be expressed: catch the unique violation **outside** the failed transaction, route on Postgres `sqlState === '23505'` and the constraint name of `business_members.profile_id` (whatever Prisma 8's error object exposes; the name `SqlQueryError` is unverified), and retry the read in a **new** transaction. Any other error is a 500.
  - `email` comes from Clerk on the server: `currentUser()` (or `clerkClient().users.getUser(userId)`), its primary email address; stored on `profiles.email` and returned. Never read from the request body. Never logged.
  - Returns `BootstrapResponse` (`hasData` = the business has any row in customers, suppliers, items, merchant_settings or transactions). Business `name`, `business_type`, `market_location` start empty (Q-016).
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

- [ ] `@prisma/orm-postgres` and `prisma` are on the same exact version in `package.json` (precondition, M11); the PR records which `rc.27` APIs were checked against the Prisma docs (`upsert`, `createAll` + `onConflict`, `db.sql` conflict clauses, the unique-violation error shape) and what each compiles to
- [ ] `pnpm db:generate` is clean and `contract.json`/`contract.d.ts` match the committed files (CI diff check)
- [ ] The planned migration applies to the Neon `dev` branch; `\d transactions` and `\d profiles` (pasted in the PR) show the CHECK constraints, `numeric(14,2)` money, no default on `transactions.id`, and `gen_random_uuid()` on `profiles.id`
- [ ] `test:db`: `Promise.all([bootstrap(), bootstrap()])` for one Clerk user gives exactly one profile, one business, one owner membership **and no orphan business row** (count of `businesses` = 1) (AC-12)
- [ ] `test:db`: ten concurrent bootstraps for one new user give the same `businessId` to all ten
- [ ] `test:db`: a second bootstrap for the same user returns the same `profileId` and `businessId`; `hasData` is false for an empty business and true after inserting one customer row
- [ ] `test:db`: the returned `email` equals the Clerk user's primary email (Clerk mocked at the `currentUser` boundary) and is stored on `profiles.email`
- [ ] Route test: no session → 401 for bootstrap and for a guarded handler; session with a profile but no membership → **403** from a **test-only guarded handler defined inside the test file** that calls `requireMember()` (no test route ships in the build)
- [ ] Smoke test against `pnpm build && pnpm start`: a no-cookie `POST /api/bootstrap` returns **401, not 500** (AC-12, proves `proxy.ts`)
- [ ] Loading any app page with the network off is not affected by the proxy (no redirect; the #18 offline test still passes)
- [ ] No `@prisma/client`, `@prisma/adapter-neon` or `schema.prisma` in the repo; no string-built SQL
- [ ] No email, Clerk user id or request body is logged
- [ ] lint, typecheck, test and build pass

### Blocked by

- #16
- #18 (its offline test is part of this ticket's check)
- **Hard precondition:** Prisma versions aligned (see Preconditions)
- Precondition: Neon `dev` branch URLs in `.env` (main session)

---

## Task 3: P1-3 (A3, sign-in): "Welcome to Mazao" sign-in with the privacy notice

### Parent

#2 (Phase 1). Blueprint step **A3** (tasks 3 and 4), plus blueprint **A4 task 6** (the D-039 refusal), which is moved here because it runs in this screen's post-sign-in flow, plus the Clerk provider remount from **A5 task 4**. Branch `feat/a3-sign-in-privacy`. Agent: frontend. Model: **strongest**. Lane: Dev A.

### What to build

A merchant opening Mazao for the first time sees "Welcome to Mazao" (or "Karibu Mazao" if the phone is set to Kiswahili) over a Gikomba photograph, reads three plain lines about their data, ticks "I agree", and signs in with an emailed code or Google. Their business is created, their old records come back if they had any, and they go straight on to choose a PIN. If someone else's account already lives on the phone, they are told whose phone it is and nothing changes. If the owner's own account is already on the phone, signing in again never lets anyone change the PIN without the email code.

- `<ClerkProvider>` in the root `app/layout.tsx` without the `dynamic` prop; app pages never wait on Clerk. **Remount on reconnect:** on the `online` event, if Clerk has not loaded (cold offline start), remount `<ClerkProvider key={n}>`. Export `waitForClerk(timeoutMs): Promise<boolean>` (resolves true once Clerk is loaded, false on timeout) for Task 5's Forgot PIN and Task 6's engine.
- `app/(shell)/sign-in/[[...sign-in]]/page.tsx`: on-image `PageTitle` with the key `shell.signIn.title` (en "Welcome to Mazao", sw "Karibu Mazao") over the `auth-background` (#20 component; plain scrim colour if #20 is not merged yet), solid Surface panel holding:
  - privacy card: what we store (account email, the business records you enter), stored in the EU, how to delete (ASSUMPTION per spec: ask the pilot team), the PIN never leaves the phone, link to `/privacy` (#22) or the full text;
  - "I agree" checkbox; Clerk `<SignIn />` (email code + Google) is not interactive until ticked. The box starts unticked on every visit, including `?mode=reset` (interim for OQ P1-Q11);
  - acceptance recorded in `deviceDb.meta` key `privacyAccepted` = `{ version, acceptedAt }` (spec ASSUMPTION; Q-014).
  - Clerk's own `<SignIn />` text follows the locale where Clerk supports it (`localization` prop); ASSUMPTION: Clerk's built-in English is used for `en`, and the Kiswahili localisation question is part of OQ P1-Q14.
- Offline state: "You're offline. Connect once to sign in." and the send button disabled. `/sign-in` is added to the precache (spec ASSUMPTION for Q-015) so this renders offline instead of a browser error. **Unverified:** precaching a Clerk catch-all route may not work as a plain precache entry. The PR states what was precached (the base `/sign-in` document with a build-revision so each deploy replaces it, or an offline navigation fallback for `/sign-in*` that renders this state) and keeps the cold-offline Playwright check below either way.
- `auth/after-sign-in.ts`, a pure, tested decision module (**C1**):
  ```ts
  export type SignInMode = 'first' | 'reset';
  export type AfterSignIn =
    | { kind: 'refuse_other_owner'; ownerEmail: string } // D-039; page awaits clerk.signOut()
    | { kind: 'reset_mismatch' }                         // forgot PIN signed in someone else; page awaits clerk.signOut()
    | { kind: 'go_lock' }                                // this Clerk user's account is already on the phone: PIN untouched, no restore
    | { kind: 'restore_then_set_pin' }
    | { kind: 'set_pin' };
  export function decideAfterSignIn(input: {
    mode: SignInMode; boot: BootstrapResponse; existing: DeviceAccount | undefined;
  }): AfterSignIn;

  export type PendingSignIn = BootstrapResponse & { mode: SignInMode; createdAt: number }; // epoch ms
  export const PENDING_SIGN_IN_KEY = 'pendingSignIn';
  export const PENDING_SIGN_IN_TTL_MS = 10 * 60 * 1000; // ASSUMPTION (Arch): 10 minutes
  export function isPendingSignInValid(
    pending: PendingSignIn | undefined,
    ctx: { now: number; clerkUserId: string | null; existing: DeviceAccount | undefined },
  ): boolean;
  ```
  Decision table (order matters; the first matching row wins):

  | Device account | Mode | Condition | Result |
  |---|---|---|---|
  | present | `reset` | `boot.clerkUserId` or `boot.profileId` differs from the account | `reset_mismatch` |
  | present | `first` | `boot.clerkUserId` differs from the account | `refuse_other_owner` (account's email) |
  | present | `first` | same Clerk user | **`go_lock`** |
  | present | `reset` | same Clerk user and same profile | `set_pin` |
  | absent | either | `boot.hasData` | `restore_then_set_pin` |
  | absent | either | no data | `set_pin` |

  `isPendingSignInValid` is true only when: the pending entry exists; `now − createdAt ≤ PENDING_SIGN_IN_TTL_MS`; `pending.clerkUserId === ctx.clerkUserId` (the Clerk user signed in right now); and, when an account exists, `pending.mode === 'reset'` and `pending.profileId`/`clerkUserId` equal the account's.
- The page flow:
  - It reads `mode` from `?mode=reset` (Task 5's Forgot PIN). **With `mode=reset`, if Clerk already has a signed-in session when the page loads, the page awaits `clerk.signOut()` before enabling the form**, so the reset branch can only follow a fresh email-code sign-in in this page view, whatever URL the user typed.
  - After Clerk sign-in completes (or on load with `mode=first` and an existing session), it calls `bootstrap()` and `decideAfterSignIn`, then:
    - `refuse_other_owner` → **`await clerk.signOut()`**, then "This phone belongs to <email>. Ask the owner to remove their account in Settings first." Nothing is written to `deviceDb` (M1);
    - `reset_mismatch` → **`await clerk.signOut()`**, then an error message (copy: P1-Q3). Nothing is written (M1);
    - `go_lock` → `router.replace('/lock')`. Nothing is written; the PIN, failures and lockout are untouched; no restore runs. This is also the safe path for re-signing in to resume backups (P1-Q6);
    - `restore_then_set_pin` / `set_pin` → run `restore(businessId)` only for `restore_then_set_pin` (which only happens when **no** device account exists, so restore can never overwrite an existing phone's unsynced records); **then** write `PendingSignIn` with `createdAt = Date.now()` to `deviceDb.meta[PENDING_SIGN_IN_KEY]` (after restore, so a slow restore cannot expire the TTL); then `router.replace('/set-pin')`.
- **Hand-off contract to Task 6:** `sync/restore.ts` created here as a no-op stub, `export async function restore(businessId: string): Promise<void>`; Task 6 implements it. If Cut 1 is applied, the stub stays and AC-19 is waived.
- **Hand-off contract to Task 5:** `PendingSignIn` in `deviceDb.meta[PENDING_SIGN_IN_KEY]`, checked with `isPendingSignInValid`, consumed and deleted by `/set-pin`, and deleted whenever the app locks.
- All strings via `t(key, locale)` with `en` and `sw` values in the shell halves. Nothing about the user (email, Clerk id) is logged.

### Acceptance criteria

- [ ] Playwright, built app: the Clerk sign-in inputs and the Google button are disabled (or not rendered) until "I agree" is ticked (AC-14, automated part)
- [ ] Playwright, built app, cold offline: `/sign-in` renders the English title "Welcome to Mazao" and the offline message, with the send button disabled; the PR names the precache or fallback mechanism used
- [ ] Playwright: with `deviceDb.meta.locale = 'sw'` seeded, `/sign-in` shows "Karibu Mazao"; with no `locale` it shows "Welcome to Mazao" (English title by default; Kiswahili when locale is `sw`)
- [ ] Unit tests for `decideAfterSignIn`, one per table row, including **`first` with an existing account for the same Clerk user → `go_lock`** (C1); reset with a different `profileId` → `reset_mismatch`; reset with a different `clerkUserId` → `reset_mismatch`
- [ ] Unit tests for `isPendingSignInValid`: fresh and matching → true; older than the TTL → false; different Clerk user → false; `first` mode while an account exists → false; `reset` for a different profile → false
- [ ] Component or e2e test: on `refuse_other_owner` and on `reset_mismatch`, `clerk.signOut` is called and awaited, and `deviceDb.accounts` and `meta` are unchanged (M1)
- [ ] Component or e2e test: `/sign-in?mode=reset` with a still-valid Clerk session signs out before the form is enabled
- [ ] Component or e2e test: `/sign-in` (no mode) with a still-valid session and an existing account for that user lands on `/lock`, and the account's `pinHash`, `failedAttempts` and `lockedUntil` are unchanged (C1)
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

- `local/business-db.ts`: Dexie `mazao-<businessId>` with `items, customers, suppliers, txns, lines, settings, syncQueue(++seq, table, rowId, op, attempts, nextAttemptAt, lastError, quarantinedAt), onboarding(key)`; indexes `txns: id, occurredAt, type, customerId, supplierId, voidsTxnId`, `lines: id, txnId, itemId`, `syncQueue: ++seq, nextAttemptAt, quarantinedAt, rowId`. `quarantinedAt` (ISO or null) is set by Task 6 for a row the server refused as invalid (M4); `lastError` holds an error **code**, never row contents.
- `local/commit.ts`: `commitSale`, `commitExpense`, `commitPayment`, `commitOpening`, `commitStockAdjustment`, `commitVoid(txnId)`, `addItem`, `upsertCustomer`, `upsertSupplier`, `saveSettings`. Each: Zod parse → `runGrill` → `CommitError` on hard errors (no override possible) → `NeedsOverride(issues)` on block-level issues unless `opts.override === true` (codes go into `txn.overrides`) → stamp uuid v4, `createdBy`, `createdAt`/`occurredAt`/`updatedAt` (`toISOString()`), `unitCost` = item `buyingPrice` (D-015) → **one** Dexie transaction writing rows and `syncQueue` entries in parent order (new party → txn → lines). `commitVoid` rejects when `!canVoid` and copies party ids.
  - `commitSale` with `newCustomer` and `commitOpening` with `newCustomer` or `newSupplier` (M6) create the party and the record in the same Dexie transaction; the new party's queue entry comes first.
  - Each commit function can also run inside a caller's Dexie transaction (it uses `Dexie.currentTransaction` when one is open over its tables), so Phase 2 can add one combined onboarding commit without a second save path.
- `local/queries.ts` hooks calling only B1 functions: `useToday`, `useTodaySales`, `useTodayExpenses`, `useCustomersWithBalance`, `useCustomerLedger(id)`, `useItemsWithStock`, `useRecentItems(n)`, `useDaySummary(today)`, `useLowStock`, `useUnsyncedCount` (queue entries whose table is not `lines`, quarantined included), `useOldestUnsyncedAt()` and `useQuarantinedCount()` for Task 6's banner.
  - `useToday()` returns `todayInNairobi()` and refreshes on `visibilitychange` and every 60 s, so every "today" figure rolls over at midnight (blueprint B2 task 4).
- `useBusinessDb()` context opening `mazao-<businessId>` from `useSession()`.
- **Hand-off contract to Task 6 and Phases 2 to 4:** the exported `commit.ts` and `queries.ts` signatures and the `syncQueue` row type (`SyncQueueEntry`), posted in the PR description and treated as frozen after merge.

### Acceptance criteria

- [ ] Vitest + `fake-indexeddb/auto`, tests written first
- [ ] A credit sale with a new customer creates exactly 1 customer, 1 txn, n lines and queue entries in parent order, in one Dexie transaction
- [ ] A customer opening balance with `newCustomer` creates exactly 1 customer and 1 `opening_balance` txn with queue entries customer → txn in one transaction; a forced failure after the customer write leaves neither (M6)
- [ ] A supplier opening balance commits with no `DENI_NEEDS_CUSTOMER`; an opening stock adjustment of 10 on an item whose buying price is above its selling price commits with no issues (M7 at this level)
- [ ] A commit that throws midway (forced failure) leaves no rows and no queue entries
- [ ] `override: true` on a sale with deni and no customer still throws `DENI_NEEDS_CUSTOMER` (AC-07)
- [ ] With a profile seeded `rules.negativeStock = 'block'`, overselling throws `NeedsOverride`; with override it saves `overrides: ['NEGATIVE_STOCK']` (AC-08, unit part)
- [ ] A void reverses the customer balance and the stock; a second void of the same txn is rejected (AC-04, AC-06 at this level)
- [ ] `useUnsyncedCount` after 2 sales (3 lines), 1 expense and 1 payment returns 4 (AC-16, count part)
- [ ] `useToday` changes from `2026-10-26` to `2026-10-27` when the fake clock passes 00:00 EAT, both on the 60 s tick and on `visibilitychange`
- [ ] Two commit functions called inside one outer Dexie transaction either both persist or neither does
- [ ] Every stored timestamp ends in `Z` and parses back to the same instant
- [ ] No page or component imports Dexie tables directly (grep in the PR)
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 1

---

## Task 5: P1-5 (A4): PIN lock, "Unlock Mazao"

### Parent

#2 (Phase 1). Blueprint step **A4** (tasks 1 to 5; task 6 is in Task 3), branch `feat/a4-pin-lock`. Agent: frontend. Model: default. Lane: Dev A.

### What to build

After signing in once, a merchant opens Mazao at the stall with a 4-digit PIN on a big keypad, with or without network. The app locks itself after 5 minutes in the background and on every cold start, guessing is slowed down by a growing wait that survives a restart, and a forgotten PIN can be reset online, only with an email code, without losing any records.

- `auth/pin.ts` (pure, tested): `hashPin(pin, salt)` PBKDF2-SHA256, 150,000 iterations, 16-byte salt, 32-byte output; `verifyPin` constant-time; `isWeakPin` (`0000`, `1234`, any four repeated digits); `lockoutUntil(failures, now)` = `now + 30 s × 2^(failures − 5)` from the 5th failure.
- `/set-pin` (`app/(shell)/set-pin/page.tsx`, title key `shell.setPin.title`: en "Set your PIN", sw "Weka PIN"):
  - On load it reads `PendingSignIn` and checks it with `isPendingSignInValid` (Task 3) against Clerk's current user (after `waitForClerk`). **If it is missing or invalid, it deletes it and redirects: account exists → `/lock`; no account → `/sign-in`** (C1). `/set-pin` never changes an existing account's PIN without a valid `reset` pending entry for that same account.
  - Two entries that must match; weak PINs refused with the reason; copy "Remember this PIN. To reset it you will need internet."
  - On success: creates or updates the single `accounts` row (with `clerkUserId`), resets failures, deletes the pending key, sets the session, then `router.replace(await nextRouteAfterPin())`.
- `/lock` (`app/(shell)/lock/page.tsx`, title key `shell.lock.title`: en "Unlock Mazao", sw "Fungua Mazao"): business name (empty until Phase 2 sets it, then shown; P1-Q7) and email, PIN pad with keys ≥ 64 dp and labelled for screen readers, countdown announced (`aria-live`) during lockout. Failures and `lockedUntil` persist in the account row. Success resets them, sets the in-memory session and routes per **OQ P1-Q9**: interim ASSUMPTION `await nextRouteAfterPin()` (the blueprint says `/`; the interim is needed for AC-32's resume after unlock). No "Switch account" or "Add another account" (D-039). Mounting `/lock` deletes any `PendingSignIn`.
- `LockGuard` in `app/(app)/layout.tsx`: no device account → `/welcome` if #22 shipped, else `/sign-in` (Cut 0); account but no session → `/lock`; hidden > 5 min (`visibilitychange`) → clear session, delete any `PendingSignIn`, and lock. Session is memory-only, so every cold start shows `/lock`. What the merchant was typing when the app relocks is lost (interim for OQ P1-Q10).
- Forgot PIN on `/lock`:
  - offline → "Connect to the internet to reset your PIN"; nothing changes;
  - online → if Clerk has not loaded (cold offline start, then the network came back), show "Connecting…" and `await waitForClerk(10_000)` (Task 3's remount makes Clerk load); if it still has not loaded, show the connect message and stop. Then **`await clerk.signOut()`** and only after it resolves `router.push('/sign-in?mode=reset')` (Task 3 signs out again if a session somehow survives, then bootstrap and the same-profile check), then `/set-pin`. Local data is kept.
- `/lock` and `/set-pin` use the `auth-background` (#20) under the scrim. All strings via `t(key, locale)` with `en` and `sw` shell values. PIN, hash and salt are never logged.
- **Shared e2e fixture:** `e2e/fixtures/unlocked.ts` exports a helper that seeds a device account (known PIN) into `deviceDb` and unlocks through `/lock`, for every later Playwright test (Phase 2 extends it to seed a profile, P2-1; PR #23's P3-2 expects it).

### Acceptance criteria

- [ ] Vitest: hash/verify round trip; wrong PIN fails; weak PINs `0000`, `1234`, `7777` rejected; lockout durations for failures 5, 6, 7 are 30 s, 60 s, 120 s
- [ ] Playwright `e2e/pin.spec.ts` against the build: seed an account, go offline; 5 wrong PINs show a countdown of ≥ 30 s; reloading the page keeps the countdown; the right PIN unlocks offline; hidden > 5 min (fake clock) relocks (AC-10, AC-18 automated part)
- [ ] Playwright: Forgot PIN offline shows the connect message and changes nothing (AC-22, offline part)
- [ ] Playwright: a fresh profile with no account opening `/` lands on `/welcome` (or `/sign-in` if #22 is cut); an account with no session lands on `/lock`
- [ ] Playwright: with an account seeded, opening `/set-pin` directly (no pending key) lands on `/lock`; with a `first`-mode pending key, or a `reset` key older than the TTL, it also lands on `/lock` and the pending key is gone (C1)
- [ ] Playwright: locking (hidden > 5 min) deletes a pending key written just before
- [ ] Unit or component test: Forgot PIN online calls and awaits `signOut` before navigating to `/sign-in?mode=reset`; with Clerk not yet loaded it waits for `waitForClerk` and calls `signOut` only after Clerk has loaded
- [ ] Playwright: the `/lock` title is "Unlock Mazao" by default and "Fungua Mazao" with `locale = 'sw'`
- [ ] PIN keys are ≥ 64 px and have accessible names; the countdown is in an `aria-live` region
- [ ] `e2e/fixtures/unlocked.ts` is exported and used by `e2e/pin.spec.ts`
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

Records saved offline at the stall reach the server within about a minute of the network returning, without the merchant doing anything. The chip in the top bar always says "Backed up", "Saving…", "Not backed up (n)" or "Sign in to back up". A merchant who signs in on a new phone gets their deni and today's totals back before setting a PIN. Retries never duplicate a record, one business can never write over another's rows, and one bad record can never stop the others from being backed up.

- `sync/wire.ts`: Zod wire schemas and `toWire`/`fromWire` per table; cents ↔ `"150.00"` (`Math.round(Number(s) * 100)`); timestamps normalised with `new Date(x).toISOString()`. The only place this conversion happens.
- `POST /api/sync/push` (`PushRequest` as spec §8, max 500 rows):
  - `requireMember()` first.
  - **Validation, before any write.** Each row is parsed with its wire schema.
    - **403 for the whole batch** (tenancy) when any row's `business_id` differs from the caller's; when any row's `created_by` differs from the caller's `profileId` (minor 6); or when any referenced `customer_id`, `supplier_id`, `item_id`, `voids_transaction_id` or a line's `transaction_id` exists under **another** business.
    - **422 `{ rejected: { id: string; code: string }[] }`** (M4) for rows that fail their wire schema, a CHECK constraint the route can test up front (e.g. `quantity = 0`), or reference a parent that exists nowhere (`MISSING_PARENT`). Nothing in the batch is written. `code` is an error code, never row contents.
    - **400** only for a malformed request (not JSON, not a `PushRequest`, more than 500 rows).
  - One `db.transaction` in parent order (customers, suppliers, items, merchant_settings, transactions, transaction_items).
    - Transactions and lines: insert-or-skip on `id` (`createAll(rows, { onConflict: 'skip' })` if Task 2 confirmed it, else `INSERT … ON CONFLICT (id) DO NOTHING`).
    - Master rows: `INSERT … ON CONFLICT (id) DO UPDATE … WHERE stored.updated_at < EXCLUDED.updated_at AND stored.business_id = EXCLUDED.business_id`.
    - **`merchant_settings`: `ON CONFLICT (business_id) DO UPDATE … WHERE merchant_settings.updated_at < EXCLUDED.updated_at`** (M5), so an older profile arriving late never overwrites a newer one.
  - `PushResponse` `{ accepted: string[] }` = every id in the batch after commit (including skipped duplicates and LWW losers).
- `GET /api/sync/pull?since=<ISO>&cursor=<opaque>` (M3): returns the business's rows changed at or after `since` (`updated_at` for master rows and settings, `created_at` for transactions and lines), at most 1,000 per page, as `{ rows, nextCursor: string | null }`.
  - Order is total and stable: tables in parent order, then `(ts, id)` within a table. The cursor encodes `(table, ts, id)` of the last row returned; the next page continues with `(ts, id) > (cursorTs, cursorId)` in that table, then the following tables from `since`. Rows with the same timestamp are never skipped or repeated across a page boundary. `nextCursor` is null after the last page.
  - In R0 pull is used only by restore (from the epoch); incremental pull and the clock-skew window are R6 (D-019).
- `sync/engine.ts`: `flush()` sends up to 200 due, non-quarantined queue entries in `seq` order with Clerk `getToken()`, only when Clerk's `userId` equals the session's `clerkUserId`.
  - 200 → delete accepted entries.
  - Network or 5xx → `attempts++`, `nextAttemptAt = now + min(5 min, 2^attempts s)`.
  - 401/403 → stop retrying; status `sign_in_to_back_up`.
  - **422** → set `quarantinedAt` and `lastError = code` on each rejected entry, and flush the rest of the batch again at once (M4). Quarantined entries are never sent again automatically (release policy: OQ P1-Q12).
  - **400** → resend the same entries one per request on the next attempt; an entry that still gets 400 alone is quarantined with `lastError = 'BAD_REQUEST'`.
  - Triggers: session becomes non-null (unlock), `online` (after `waitForClerk`), 5 s after a commit (debounced), every 60 s while visible and online.
- **Status when the Clerk user does not match (M1).** When Clerk has loaded and its `userId` is null or differs from the session's `clerkUserId` (after a refusal sign-out, an expired session or another person's sign-in), `flush()` sends nothing and `useSyncStatus()` returns `sign_in_to_back_up`. When Clerk has not loaded (offline), the status is `{ notBackedUp: n }` as usual.
- `sync/restore.ts`: replaces Task 3's stub; pages through pull from the epoch into `mazao-<businessId>` **without** queue entries. It never overwrites a row whose id has a `syncQueue` entry (defence in depth: Task 3 only restores on a phone with no account).
- `useSyncStatus()` (`SyncStatus` as spec §8) replaces the #17 stub hook behind the shell chip. Copy exactly `Backed up`, `Saving…`, `Not backed up (n)`, `Sign in to back up` in `en` (with `sw` values per the Global Constraints). Quarantined entries count in `n`.
- Banner when the oldest unsynced record is > 3 days old, when the status is `sign_in_to_back_up`, or when any entry is quarantined. Banner copy: OQ P1-Q12; interim en text "Connect to the internet to back up your records." for the first two cases and "Some records could not be backed up. Show this screen to the pilot team." for quarantine.
- `navigator.storage.persist()` after the first unlock.
- Mount point: a `<SyncRunner />` in `app/(app)/layout.tsx` (Task 5's file, same lane, merged first).

### Acceptance criteria

- [ ] Unit tests for `wire.ts`: `"150.00"` ↔ 15000; `"0.10"` ↔ 10; a Postgres `+00` timestamp normalises to the `Z` form; quantity keeps 3 decimals
- [ ] `test:db` push: the same batch twice leaves row counts unchanged and `accepted` lists every id both times (AC-11)
- [ ] `test:db` push: a row with a foreign `businessId` → 403 for the whole batch; a line whose parent transaction belongs to another business → 403; a sale whose `customer_id` belongs to another business → 403; a row whose `created_by` is not the caller's profile → 403 (AC-11, minor 6)
- [ ] `test:db` push: a customer id that exists under another business, sent with our business id, is not overwritten (AC-11)
- [ ] `test:db` push: LWW keeps the newer row when an older `updated_at` arrives second (AC-11)
- [ ] `test:db` push: `merchant_settings` upserts by `business_id`; an older `updated_at` arriving second leaves the newer settings in place (M5)
- [ ] `test:db` push: a batch with one row that fails its schema returns 422 naming only that id, and writes nothing
- [ ] `test:db` pull: 1,500 `transaction_items` and 20 customers all with the **same** timestamp return every row exactly once across pages, `nextCursor` advances and ends null, and another business's rows never appear (M3)
- [ ] Engine test with a fake fetch: 500 then success empties the queue with backoff; 403 stops retries and sets `Sign in to back up` (AC-11); no flush and status `sign_in_to_back_up` when Clerk's user differs from the device account or is null (D-039, M1)
- [ ] Engine test: a 422 naming 1 of 3 entries quarantines that one, the other 2 are accepted in the next request, the chip reads `Not backed up (1)` and the quarantine banner shows; later commits keep flushing (M4)
- [ ] Engine test: a 400 for a batch of 3 resends them one by one; only the one that still gets 400 is quarantined
- [ ] Restore test (fake-indexeddb + fake paged pull across 3 pages): after restore, `useCustomersWithBalance` and `useDaySummary(today)` match the source data and the queue is empty (R-019); a row with a pending queue entry is not overwritten
- [ ] Playwright against the build, signed in with `@clerk/testing` (skill `clerk-testing`) and `/api/sync/push` routed to a stub: records and queue entries seeded offline into the business database by the test (`page.evaluate`, since no record screens exist yet; test seeding is not a page write) show `Not backed up (n)`; going online shows `Saving…` then `Backed up` within 60 s (AC-17, automated part)
- [ ] No record contents logged on either side
- [ ] lint, typecheck, test and build pass

### Blocked by

- Task 2
- Task 4
- Task 5

---

## Task 7: P1-7 (QA): Phase 1 evidence on the preview and a real phone

### Parent

#2 (Phase 1). No blueprint step; collects the acceptance evidence that spans Tasks 3, 5 and 6 before Phases 2 to 4 build on them. Agent: qa. Model: default. Evidence is posted as a comment on #2; a branch `feat/p1-qa-auth-e2e` is used if new Playwright tests are added (the AC-19 run below is expected to add one).

### What to build

Proof, on the preview URL and a real Android phone, that a merchant can sign in, set a PIN, record offline, get backed up, restore on a second device and reset a forgotten PIN, and that nobody holding the phone can reset the PIN without the email code, before any screen is built on top.

### Acceptance criteria

- [ ] AC-14: privacy notice blocks sign-in until accepted; email code and Google both work (screenshots)
- [ ] AC-17 (Phase 1 part): on the preview (Neon `dev`), records seeded offline through the test seam, then online → chip `Backed up` within 60 s and a Neon query shows the rows with the right `business_id` and amounts
- [ ] **AC-19 (full data check, M10):** on browser profile A on the preview, sign in, set a PIN, seed through `page.evaluate` the Wanjiku deni scenario (sale 30000 paid 10000, payment 15000) and the Otieno opening balance 50000 into the business database with queue entries, go online and wait for `Backed up`; confirm the rows in Neon `dev`. On a **second, empty browser profile B**, sign in with the same account → restore runs → set PIN. Then compare, through `page.evaluate` calls to the B2 query functions, B's customer balances (Wanjiku 5000, Otieno 50000) and today's day summary with A's. Only the phone-UI part (the `/deni` list and Muhtasari on a real phone) moves to P4-8. Waived if Cut 1 is applied
- [ ] AC-18 (Phase 1 part, minor 10): close and reopen offline on a real phone; the PIN unlocks and the seeded records are still in the business database (record count before = after). The "all records still there" check on real screens is in P4-8
- [ ] AC-22: Forgot PIN online signs out of Clerk first, requires the email code, keeps data; a different Clerk user on the same phone is refused and Clerk is signed out afterwards
- [ ] C1 check: with an account on the phone and a still-valid Clerk session, opening `/sign-in` lands on `/lock`, and opening `/set-pin` directly lands on `/lock`; the old PIN still unlocks
- [ ] One PIN unlock timed on the 3 GB phone; if > 800 ms, raise it per P1-Q5 (Q-018)
- [ ] Results recorded per AC with pass/fail and evidence

### Blocked by

- Task 3
- Task 5
- Task 6

---

## Open questions (spec silent on merchant-visible behaviour)

Plan-local IDs; the main session assigns `Q-0xx` numbers when adding them to `planning/QUESTIONS.md`. Existing spec questions Q-014 to Q-018 still apply and are not yet in `QUESTIONS.md` (listed in the PR body). Each question names the interim the Builder implements until it is answered.

- **P1-Q1 (Task 3):** What does the merchant see while bootstrap and restore run after sign-in, and what happens if the network drops during restore? Options: retry button on the sign-in screen; or continue to set PIN with partial data and finish restore later. Interim: a spinner with "Bringing back your records…"; on failure the P1-Q2 message with a retry button, and set PIN is not reached until restore succeeds.
- **P1-Q2 (Task 3):** What does the sign-in screen show if bootstrap fails with a 5xx or network error after Clerk sign-in succeeded? Interim copy: "Could not reach Mazao. Check your connection and try again." with a retry button.
- **P1-Q3 (Tasks 3, 5):** Copy for Forgot PIN when the email code signs in a different account than the one on the phone (`reset_mismatch`). Interim: "That email is not the account on this phone. Use the email you signed up with." The blueprint only says "show an error and change nothing".
- **P1-Q4 (Task 5):** Should the PIN lockout wait have a ceiling? `30 s × 2^(n − 5)` reaches about 8.5 hours at 15 failures; a child playing with the phone could lock the merchant out for a market day. D-024 has no cap. Interim: no cap (D-024 as written).
- **P1-Q5 (Tasks 5, 7):** Same as Q-018: who records the superseding decision if 150,000 PBKDF2 iterations exceed 800 ms on the 3 GB phone?
- **P1-Q6 (Tasks 3, 6):** When the chip shows `Sign in to back up`, how does the merchant reach `/sign-in`? Signing in again is now safe (`go_lock` returns to `/lock` without touching the PIN), but nothing in R0 links to `/sign-in` once an account exists. Interim: the chip and banner stay non-interactive, and R-017 is mitigated by the week-1 coordinator visit (the coordinator opens `/sign-in` by URL). If the owner answers "tap the chip", Task 6 makes it a link to `/sign-in`.
- **P1-Q7 (Task 5):** The unlock screen shows the business name, but bootstrap creates it empty and Phase 2 sets it only in the local profile (Q-016). Interim: `/lock` shows the email alone until a profile with a non-empty name exists.
- **P1-Q8 (Task 6, technical, for the main session):** D-048 names `db.sql` for the conditional LWW upsert. If the Prisma 8 SQL builder cannot express `ON CONFLICT … DO UPDATE … WHERE`, may Task 6 use the parameterised `db.raw.sql` tagged template? Interim: yes (still no string-built SQL); proposed D-048 clarification in the PR body.
- **P1-Q9 (Task 5, M12):** After a correct PIN on `/lock`, where does the merchant go: always `/` (blueprint A4 task 3), or `nextRouteAfterPin()` (so an unfinished onboarding resumes)? Interim ASSUMPTION: `nextRouteAfterPin()`, because AC-32 requires onboarding to resume after unlocking. If the owner chooses `/`, AC-32's wording changes to resuming from Settings.
- **P1-Q10 (Tasks 5, Phase 3, M12):** A merchant halfway through a new sale who leaves the app for more than 5 minutes comes back to `/lock`, and the unsaved sale is lost. Should the draft survive the relock (kept in memory or in Dexie), and should unlock return to the page they were on? Interim: the draft is lost and unlock follows P1-Q9.
- **P1-Q11 (Task 3, M12):** Does Forgot PIN (`/sign-in?mode=reset`) ask the merchant to tick "I agree" again? Interim: yes, the box is unticked on every visit (AC-14 as written).
- **P1-Q12 (Task 6, M12):** Copy for the "not backed up for more than 3 days" banner, the "sign in to back up" banner and the quarantine banner; and who releases a quarantined record (an app update re-sends it once, or the coordinator only). Interim copy as in Task 6; quarantined entries are never re-sent automatically.
- **P1-Q13 (all screens, D-049):** (a) D-049 stores the locale on the device in `deviceDb.meta['locale']` (readable before sign-in and offline); confirm it never moves into the synced business profile in R0. Interim: device only. (b) D-049 says the language is "also offered once during sign-in or onboarding"; this revision's brief puts the switch only in Settings (P4-4). Which? Interim: Settings only; no switch in Phases 1 and 2. (c) In the English UI, do market words stay untranslated (D-005: "deni", "Faida Halisi") or become plain English ("Debts", "Net profit", D-049's merged interim)? Interim in these plans: untranslated, per D-005 and the revision brief, which **conflicts with D-049's interim**; the owner picks one and the losing text is edited (a dictionary-value change either way).
- **P1-Q14 (all screens, D-049, with Q-006):** Who supplies the Kiswahili text for keys with no approved Kiswahili (body copy, buttons, errors, privacy notice), and is Clerk's sign-in widget expected in Kiswahili? Interim: approved Kiswahili titles from `stitch-prompts.md`; English text in the `sw` value for everything else, listed per PR for the native-speaker check; Clerk widget in English.
