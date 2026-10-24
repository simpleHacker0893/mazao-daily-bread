# Sprint 001: R0 Pilot. Blueprint

Read these first:
- `requirements.md` (what to build);
- `acceptance.md` (how it's judged);
- `planning/DECISIONS.md` and `planning/DOMAIN.md`.

Every step below can be started cold from its own brief.

_Rev 2 (2026-10-24): includes the adversarial review fixes and the Prisma switch (D-037). The decisions behind the scope changes are D-038 to D-040._

## Lanes and timeline

Two developers work in parallel, each with Claude Code agents (see `docs/WORKFLOW.md` for which specialist agent takes which step). Each step is one PR. **Strongest model** = the step needs the most careful reasoning; use the strongest Claude model available.

| Step | Lane | When (EAT) | Depends on | Agent | Model |
|---|---|---|---|---|---|
| A1a Skeleton + contracts | Dev A | Sat 15:00–15:45 | — | backend | default |
| B1 Domain core | Dev B | Sat 15:45–22:00 | A1a | backend | **strongest** |
| A1b CI + Vercel + Prisma init | Dev A | Sat 15:45–17:00 | A1a | devops | default |
| A2 PWA shell + nav | Dev A | Sat 17:00–23:00 | A1a | frontend | default |
| D0 Stitch screens (R0) | Product owner | Sat, any time | — | frontend (design) | — |
| A3 Auth + server schema | Dev A | Sun 08:00–12:00 | A1b | backend | default |
| B2 Local data + commit service | Dev B | Sun 08:00–12:00 | B1 | backend | **strongest** |
| A4 PIN lock | Dev A | Sun 12:00–14:30 | A2, A3 | frontend | default |
| B3 Ledger screens | Dev B | Sun 12:00–18:00 | A2, B2 | frontend | default |
| A5 Sync push/pull | Dev A | Sun 14:30–19:00 | A3, B2 | backend | **strongest** |
| **Checkpoint** | both | **Sun 18:00** | — | scrum-architect | apply §Cuts if behind |
| B4 Muhtasari + onboarding + notebook | Dev B | Sun 18:00–23:00 | B3 | frontend | default |
| A6 Mipangilio, integrate, deploy, pilot kit | Dev A (+B from 23:00) | Sun 19:00 → Mon 07:00 | all | devops + qa | default |

Every PR is reviewed by the `reviewer` agent, and the `qa` agent runs its Verify commands, before the product owner accepts it.

**Already cut from R0 to fit the time** (D-039, D-040): one merchant account per phone; no ≥ 768 px sidebar (the mobile layout is used at every width); no "Repeat last sale"; the Bidhaa list shows stock and lets merchants add items, but not edit them.

**File ownership** (R-011):
- **Dev A:**
  - `app/(shell)/*`, `app/(app)/layout.tsx` (AppShell + LockGuard), `app/(app)/mipangilio`;
  - `app/api/*`, `auth/*`, `sync/*`, `server/*`, `ui/shell/*` (nav, SyncChip, update toast);
  - `proxy.ts`, `prisma/*`, `public/*`, config files, `i18n/en.shell.ts`.
- **Dev B:**
  - `domain/*`, `local/*` (including `nextRouteAfterPin()`);
  - every other `app/(app)/*` page;
  - `ui/*` primitives and `ui/ledger/*`;
  - `i18n/en.ledger.ts`.
- **Shared contracts, created by A1a and changed only with both devs agreeing in the PR:**
  - `domain/types.ts` and `domain/schemas.ts`, frozen after B1;
  - `auth/session.ts` (`useSession()` shape);
  - `local/device-db.ts` (schema);
  - `i18n/en.ts` (merges the two halves).

## Target structure
```
# repo root (no src/ directory, D-043)
proxy.ts                     # Clerk middleware, at the repo root next to app/
app/
  layout.tsx                 # html, fonts, <ClerkProvider> (root, no `dynamic` prop), Providers
  manifest.ts                # PWA manifest
  sw.ts                      # Serwist service worker source
  (shell)/sign-in/[[...sign-in]]/page.tsx
  (shell)/lock/page.tsx      # PIN unlock
  (shell)/set-pin/page.tsx
  (app)/layout.tsx           # AppShell: bottom nav, sync chip, LockGuard
  (app)/page.tsx             # Muhtasari
  (app)/mauzo/page.tsx, mauzo/new/page.tsx
  (app)/gharama/page.tsx, gharama/new/page.tsx
  (app)/deni/page.tsx, deni/customer/page.tsx   # customer ledger: /deni/customer?id=<uuid> (static route, precachable)
  (app)/bidhaa/page.tsx
  (app)/mipangilio/page.tsx
  (app)/onboarding/page.tsx, onboarding/review/page.tsx
  (app)/notebook/page.tsx
  api/bootstrap/route.ts
  api/sync/push/route.ts
  api/sync/pull/route.ts
domain/        types.ts schemas.ts money.ts ledger.ts summary.ts grill.ts dates.ts operating-profile.ts
local/         device-db.ts business-db.ts commit.ts queries.ts routing.ts (nextRouteAfterPin)
sync/          engine.ts wire.ts
auth/          pin.ts session.ts
server/        db.ts (PrismaClient singleton + PrismaNeon adapter) tenant.ts
i18n/          en.ts en.shell.ts en.ledger.ts t.ts
ui/            primitives (Button, Sheet, Chip, MoneyInput, PageTitle, …), shell/, ledger/
prisma/          # schema.prisma + migrations/
prisma.config.ts # Prisma config (schema path, migrate datasource = DIRECT_URL)
e2e/             # Playwright (runs against `pnpm build && pnpm start`, never `dev`)
```

**Rules:**
- Every page under `(app)`, plus `(shell)/lock` and `(shell)/set-pin`, is a **client page with no server data fetching and no dynamic route segments**. Data comes only from Dexie. Parameters go in the query string, read through `useSearchParams` wrapped in `<Suspense>`. This lets the service worker precache every page.
- **Page titles are bilingual** (D-040): the `PageTitle` primitive renders the Kiswahili title with the English translation beneath it. Bottom-nav items show the Kiswahili label with a small English caption.

---

## A1a: Skeleton + contracts (Dev A, ~45 min)

**Context:** the repo has only docs (`AGENTS.md`, `CLAUDE.md`, `planning/`, `docs/`, `.claude/`, `.agents/`). **`create-next-app` refuses to scaffold into a folder that holds these.**

**Tasks**
1. `git pull origin main` (the remote has an Initial commit with a README; keep it), then branch `feat/a1a-skeleton`.
2. Scaffold in a sibling folder and copy across:
   ```
   cd .. && pnpm create next-app@latest mazao-scaffold --ts --tailwind --biome --app --no-src-dir --react-compiler --turbopack=false --import-alias "@/*" --use-pnpm
   ```
   - Use the **latest** create-next-app. If a flag isn't recognised (`--react-compiler`, `--turbopack=false`), drop it and answer the interactive prompt instead: **No** to src/, **Biome** as the linter, **Yes** to React Compiler.
   - Copy everything except `.git` and `README.md` into the repo, run `pnpm install`, then delete `../mazao-scaffold`.
   - Confirm that `next.config.ts` has `reactCompiler: true` and that `babel-plugin-react-compiler` is installed (it's needed with the webpack build). There must be **no** `eslint.config.*` or `.eslintrc*`: Biome is the only linter and formatter (D-043).
3. Pin pnpm: `corepack use pnpm@latest` (this writes `packageManager`). Commit `pnpm-lock.yaml` and never a `package-lock.json`.
4. Install the dependencies:
   - `pnpm add dexie dexie-react-hooks zod @clerk/nextjs @prisma/client @prisma/adapter-neon @serwist/next serwist`
   - `pnpm add -D prisma vitest @vitest/coverage-v8 fake-indexeddb @testing-library/react @testing-library/jest-dom jsdom @playwright/test`
5. Scripts:
   - `dev`, `start`, `lint` (`biome check .`), `format` (`biome format --write .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`, `e2e` (`playwright test`);
   - **`build` is `next build --webpack`**, because Serwist doesn't support Turbopack. The same command goes into Vercel's build settings.
   - `postinstall` runs `prisma generate`.
   - `db:generate` (`prisma generate`), `db:migrate:dev` (`prisma migrate dev`), `db:migrate` (`prisma migrate deploy`).
6. `tsconfig` strict, plus `noUncheckedIndexedAccess: true`.
7. **Contract stubs** (typed and minimal, so both lanes code against them):
   - `auth/session.ts`: `useSession(): { profileId; businessId; clerkUserId; email } | null`, plus `setSession` / `clearSession`.
   - `local/device-db.ts`: Dexie `mazao-device`, with
     - `accounts(&profileId, clerkUserId, email, businessId, pinHash, pinSalt, failedAttempts, lockedUntil, lastUnlockedAt)`;
     - `meta(key)`.
   - `local/routing.ts`: `nextRouteAfterPin(): Promise<string>` returning `'/'`. Dev B implements it in B4.
   - `i18n/en.shell.ts`, `en.ledger.ts`, `en.ts` (which merges them), and `t()`. Include the nav labels as `{ sw, en }` pairs (D-040).
8. Commit and merge quickly. B1 starts as soon as this is on `main`.

**Verify:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## A1b: CI + Vercel + Prisma init (Dev A / devops)
1. `.github/workflows/ci.yml` on PRs and `main`: `pnpm/action-setup` → `actions/setup-node` (`cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm exec biome ci .` → typecheck → test → build.
2. `pnpm prisma init`. Use the **latest** Prisma and follow its current docs for the generator block and `prisma.config.ts`; don't copy older-version snippets.
3. `.env.example`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`;
   - `DATABASE_URL` (Neon pooled, runtime), `DIRECT_URL` (Neon unpooled, migrations).
4. Link the Vercel project, region `fra1`, with the build command `pnpm build`. Preview deploys run per PR.

**Verify:** CI is green on the PR, and the preview URL loads.

---

## B1: Domain core (Dev B, strongest model, test-first)

**Context:** pure TypeScript with no React, Dexie or network. Every number the merchant sees comes from these functions. Use `planning/DOMAIN.md` for terms and the worked example.

**Tasks** (write the tests first, in `domain/*.test.ts`):
1. **`types.ts`:**
   - Common fields:
     - `Id = string` (uuid v4, client-generated);
     - `Cents = number` (integer);
     - timestamps are strings produced **only** by `new Date().toISOString()` (UTC, ending in `Z`);
     - `dueDate` is `YYYY-MM-DD`.
   - Entities:
     - `Item { id, businessId, kind: 'goods'|'service', name, unit, allowsFractional, sellingPrice: Cents, buyingPrice: Cents, lowStockThreshold: number|null, isActive, createdBy, createdAt, updatedAt }`
     - `Customer { id, businessId, name, phone?, notes?, isFavorite, createdBy, createdAt, updatedAt }`
     - `Supplier`: same shape as Customer.
     - `Txn { id, businessId, type: 'sale'|'expense'|'customer_payment'|'opening_balance'|'stock_adjustment'|'void', occurredAt, source: 'manual'|'onboarding', paymentMethod: 'cash'|'mpesa'|'other'|null, customerId?, supplierId?, voidsTxnId?, expenseCategory?, description?, dueDate?, dueDateNote?, totalAmount: Cents, amountPaid: Cents, externalReference?, overrides: string[], createdBy, createdAt }`
     - `TxnLine { id, txnId, businessId, itemId?, itemKind: 'goods'|'service'|null, description, quantity: number, unit, unitPrice: Cents, unitCost: Cents }`
   - **Conventions:**
     - Payments: `totalAmount = amountPaid = amount`.
     - `opening_balance`: `totalAmount = amount`, `amountPaid = 0`, exactly one of customerId/supplierId.
     - `stock_adjustment`: `totalAmount = 0`, and lines carry ±quantity.
     - `void`: `totalAmount = 0`, `voidsTxnId` is set, and it **copies `customerId`/`supplierId` from the original**, so ledgers indexed by party show it.
     - `purchase` and `supplier_payment` are not in the union until R1.
2. **`schemas.ts`:**
   - A Zod schema per entity, plus `DraftSale` / `DraftExpense` / `DraftPayment` / `DraftOpening` / `DraftStockAdjustment`.
   - Money is a non-negative integer.
   - `quantity` has at most 3 decimal places (it matches `numeric(14,3)`).
3. **`money.ts`:**
   - `toCents(kes: string|number)` is `Math.round(Number(kes) * 100)`. `fromCents`.
   - `formatKES(cents)` → `"KES 1,250"`, with decimals only when non-zero.
   - `lineTotal(qty, unitPrice) = Math.round(qty * unitPrice)`. The same rounding is used everywhere.
4. **`ledger.ts`:**
   - `activeTxns(txns)` drops voided originals and voids.
   - `customerBalance(customerId, txns)`.
   - `openDeni(customerId, txns)`: FIFO allocation of payments to the oldest credit. Credits are the sale remainders **and opening balances**. A customer's overpayment (negative balance) carries forward and settles later credits. It returns the open items with remaining amount and dueDate.
   - `isOverdue(customerId, txns, today)`.
   - `supplierOwed(supplierId, txns)`: opening balances only in R0.
   - `stockOnHand(itemId, txns, lines)`: adjustments − sale lines, for goods only.
   - `canVoid(txn, txns)`: false for a `void` txn, and false for a txn that has already been voided.
5. **`summary.ts`:** `daySummary(txns, lines, range)` returns `{ sales, cogs, expenses, faidaHalisi, cashIn, mpesaIn, otherIn }`:
   - sales = Σ sale line totals;
   - cogs = Σ goods lines `Math.round(qty*unitCost)`;
   - cash/M-Pesa/other in = sale `amountPaid` by method + customer payments by method.
6. **`dates.ts`:**
   - `nairobiDayRange(day: 'YYYY-MM-DD') → [startISO, endISO)` (EAT is UTC+3 all year).
   - `todayInNairobi()`.
   - `resolveDueRule('kesho'|'ijumaa'|'wiki_ijayo'|'mwisho_wa_mwezi', today)` → `YYYY-MM-DD`. Ijumaa means the next Friday; if today is Friday, it means the Friday after.
7. **`grill.ts`:** `runGrill(draft, ctx) → { hardErrors: Issue[], issues: Issue[] }`.
   - `ctx` = items, lines, txns, operating profile, now.
   - **Hard errors** (cannot be overridden): `SCHEMA`, `ARITHMETIC`, `PAID_EXCEEDS_TOTAL`, and **`DENI_NEEDS_CUSTOMER`** (D-038).
   - **Warn/block, set by the profile** (R0 default `warn`):
     - `NEGATIVE_STOCK`;
     - `BELOW_COST`;
     - `PRICE_VARIANCE` (> threshold %, default 30, from sellingPrice);
     - `POSSIBLE_DUPLICATE`: same type + **set** customerId + totalAmount within 10 min. It never fires for walk-in cash sales without a customer.
   - Issue = `{ code, severity: 'warn'|'block', messageKey, lineIndex? }`.
8. **`operating-profile.ts`:**
   - Zod schema `{ businessName, businessType, location, sells: 'goods'|'services'|'both', paymentMethods[], deniEnabled, defaultDueRule|null, expenseCategories[], rules: { negativeStock:'warn'|'block', belowCost:'warn'|'block', priceVariance:{ mode:'warn'|'block', thresholdPct }, duplicate:'warn'|'block' } }`.
   - `defaultProfile()`.

**Required tests:**
- The DOMAIN.md worked example: Sales 35000, COGS 9000, Expenses 5000, Faida 21000 cents; cash 15000, M-Pesa 20000.
- Deni scenario:
  1. Wanjiku buys 300 and pays 100 → 200.
  2. She pays 150 → 50.
  3. Voiding the payment → 200.
  4. The void appears in her party-filtered ledger.
- Opening balance for Otieno, 500 → 500, and the day's sales stay 0.
- `openDeni`: FIFO across two credits; an opening balance as a credit; an overpayment carried forward.
- `canVoid` rejects void-of-void and a double void.
- 0.5 kilo × 120 = 60.
- A record at 00:30 EAT counts in that EAT day, not the previous one.
- Each grill rule fires and doesn't fire. `DENI_NEEDS_CUSTOMER` is in `hardErrors`. A duplicate without a customer doesn't fire.
- `resolveDueRule` on a Friday.

**Verify:** `pnpm test domain --coverage` with ≥ 90% line coverage for `domain`.

**Exit:** merged. `types.ts` and `schemas.ts` are frozen; post them in the PR description.

---

## A2: PWA shell + navigation (Dev A, frontend agent)

**Context:** the app must install and open **cold** offline. Every page is static (see Rules).

**Tasks**
1. `app/manifest.ts`:
   - name "Mazao", short_name "Mazao", `display: standalone`, `start_url: "/"`;
   - theme and background colours from the **design-system tokens** in `docs/design/stitch-prompts.md`;
   - 192/512 icons plus a maskable icon in `public/icons/`.
2. Serwist (`@serwist/next`, webpack build). **Don't spread `defaultCache`.** It caches `/api` GETs and cross-origin calls. Write explicit rules instead:
   - **Precache:** the build assets, plus `additionalPrecacheEntries` for every static route: `/`, `/mauzo`, `/mauzo/new`, `/gharama`, `/gharama/new`, `/deni`, `/deni/customer`, `/bidhaa`, `/mipangilio`, `/onboarding`, `/onboarding/review`, `/notebook`, `/lock`, `/set-pin`, `/leo`, `/welcome` (once built). Each has `revision` = the build ID.
   - **Navigations:** NetworkFirst with a 3 s timeout, falling back to the precached page **matched on the path only** (`ignoreSearch: true`), so `/deni/customer?id=…` works offline.
   - **NetworkOnly** for `/api/*`, and for all Clerk domains (`*.clerk.accounts.dev`, `clerk.*`, the Clerk frontend API).
   - **CacheFirst** for `/_next/static/*`, fonts and icons.
3. Update flow: when a new service worker is waiting, show a toast ("Update available. Tap to reload."); `skipWaiting` on tap.
4. `(app)/layout.tsx` AppShell:
   - a bottom nav with 5 items at every screen width (no sidebar in R0), each Kiswahili label over a small English caption:
     - Muhtasari / Overview `/`;
     - Mauzo / Sales `/mauzo`;
     - Deni / Debts `/deni`;
     - Gharama / Expenses `/gharama`;
     - Zaidi / More (drawer: Bidhaa / Items, Mipangilio / Settings).
   - Tap targets ≥ 48 px. Font and colours from the design-system tokens, through `next/font`.
5. `PageTitle` primitive (Kiswahili title + English subtitle) in `ui/`. A2 creates it and Dev B owns it afterwards.
6. `SyncChip` in `ui/shell/`, reading `useSyncStatus()`. A2 stubs the hook; A5 implements it.
7. Placeholder pages for every route, using `PageTitle` and `t()`.
8. Playwright `e2e/offline-shell.spec.ts` (`webServer`: `pnpm build && pnpm start`), **cold**:
   1. Load `/` and wait for `navigator.serviceWorker.ready`.
   2. Open a **new page** in the same context and `context.setOffline(true)`.
   3. Open every route directly, including `/deni/customer?id=00000000-0000-4000-8000-000000000000` and `/mauzo/new`. Each must render its `PageTitle`.

**Verify:** `pnpm build && pnpm exec playwright test e2e/offline-shell.spec.ts`. The Lighthouse PWA installability check passes on the preview URL.

---

## D0: Stitch screens (product owner + frontend agent, not blocking)
- In Stitch, create the project "Mazao" and apply the design-system prompt from `docs/design/stitch-prompts.md`.
- Generate the landing page and the **R0** screens in the order the file lists them, then export screenshots to `docs/design/r0/` and commit.
- B3 and B4 use them as the visual reference; without them they follow the tokens. Builders don't block on D0.

---

## A3: Auth + server schema (Dev A, backend agent)

**Context:** Clerk is used only for first sign-in, recovery and sync tokens (D-022). The tenant is the business (D-016). Prisma + Neon (D-037), in Frankfurt (D-035).

**Tasks**
1. Clerk instance:
   - **Email code** and **Google** on; passwords and phone off.
   - Set the session lifetime to the maximum the plan allows (the default is 7 days), so backups don't stop in pilot week 2.
   - A development instance is acceptable for 5 pilot users.
2. **`proxy.ts` at the repo root**, next to `app/` (no `src/`, D-043; Next only reads it from the same level as `app/`):
   - `export default clerkMiddleware()`, with a matcher covering `/api/:path*` and Clerk's required paths.
   - **Don't call `auth.protect()`**: it redirects or returns 404. `requireMember()` returns the 401/403.
   - **Never redirect app pages**, because they must render offline.
3. `<ClerkProvider>` goes in the **root** `layout.tsx` without the `dynamic` prop, so pages stay static. App pages must not wait on `isLoaded`. Only sign-in, bootstrap and sync use Clerk.
4. Sign-in page:
   - a privacy-notice card (what we store; stored in the EU; how to delete) with an "I agree" checkbox; Clerk `<SignIn />` is enabled only after it's ticked;
   - after sign-in: bootstrap, then restore (A5) if `hasData`, then `/set-pin`.
5. Prisma models in `prisma/schema.prisma`:
   - snake_case through `@@map`/`@map`; `@db.Uuid` ids with **no** `@default` on synced tables; `@db.Decimal(14,2)` money; `@db.Decimal(14,3)` quantities.
   - CHECK constraints go in the migration SQL (`prisma migrate dev --create-only`, then edit).
   - The tables:
     - `profiles(id uuid pk default gen_random_uuid(), clerk_user_id text unique not null, email, full_name, created_at, updated_at)`
     - `businesses(id uuid pk default gen_random_uuid(), name, business_type, market_location, currency_code char(3) default 'KES', timezone default 'Africa/Nairobi', created_at, updated_at)`
     - `business_members(business_id fk, profile_id fk **unique**, role check in ('owner'), created_at, pk(business_id, profile_id))`. The unique `profile_id` enforces one business per owner (D-012) and makes bootstrap race-safe.
     - `customers`, `suppliers`: `(id uuid pk, business_id fk not null, name not null, phone, notes, is_favorite default false, created_by uuid not null, created_at, updated_at)`
     - `items(id, business_id, kind check in ('goods','service'), name, unit, allows_fractional, selling_price, buying_price, low_stock_threshold numeric(14,3) null, is_active, created_by, created_at, updated_at)`
     - `transactions(id uuid pk, business_id, type check in (R0 types), occurred_at timestamptz, source, payment_method null, customer_id null, supplier_id null, voids_transaction_id null, expense_category, description, due_date date, due_date_note, total_amount check >= 0, amount_paid check >= 0, external_reference, overrides jsonb default '[]', created_by, created_at)`. There's no `updated_at` (transactions are immutable) and no balance columns.
     - `transaction_items(id uuid pk, transaction_id fk → transactions, business_id, item_id null, item_kind, description, quantity check <> 0, unit, unit_price, unit_cost, created_at)`
     - `merchant_settings(business_id pk fk, settings jsonb not null default '{}', updated_at)`
   - Indexes on `(business_id, created_at)` for transactions and transaction_items, and `(business_id, updated_at)` for the master tables.
6. Migrations: `pnpm db:migrate:dev` against the Neon `dev` branch, then `pnpm db:migrate` against `main`.
   - `server/db.ts` exports one `PrismaClient` with `PrismaNeon` (`@prisma/adapter-neon`, WebSocket pool, which supports interactive transactions), cached on `globalThis` in dev.
7. `server/tenant.ts`: `requireMember()` → `{ profileId, businessId }` from the Clerk `auth()` userId. It throws 401 with no session and 403 with no membership.
8. `POST /api/bootstrap`, in **one interactive transaction** (`prisma.$transaction(async tx => …)`):
   1. Upsert the profile by `clerk_user_id`.
   2. Find the membership. If there's none, create the business and the owner membership.
   3. On a unique violation of `business_members.profile_id` (P2002), a concurrent call won, so re-read the membership.
   4. Return `{ profileId, businessId, clerkUserId, email, hasData }`.

**Verify:**
- Route tests against the Neon `dev` branch (or a local Postgres):
  - `Promise.all([bootstrap(), bootstrap()])` → one profile, one business, one membership;
  - no session → 401.
- **One smoke test against the real build** (`pnpm build && pnpm start`, then a real fetch to `/api/bootstrap` with no cookie → 401, not 500). This proves `proxy.ts` is wired up.
- Manual: sign in on the preview → the rows appear in Neon.

---

## B2: Local data + commit service (Dev B, strongest model)

**Context:** IndexedDB is the operational source of truth (D-018…D-021). There is **one save path** for every record (D-026). Code against the A1a contracts (`device-db.ts`, `session.ts`).

**Tasks**
1. `business-db.ts`, Dexie DB `mazao-<businessId>`:
   - tables `items, customers, suppliers, txns, lines, settings, syncQueue(++seq, table, rowId, op, attempts, nextAttemptAt, lastError), onboarding(key)`;
   - indexes: `txns: id, occurredAt, type, customerId, supplierId, voidsTxnId`; `lines: id, txnId, itemId`.
2. `commit.ts`:
   - `commitSale(draft, opts)`, `commitExpense`, `commitPayment`, `commitOpening`, `commitStockAdjustment`, `commitVoid(txnId)`, `addItem`, `upsertCustomer`, `upsertSupplier`, `saveSettings`.
   - Each one:
     1. Zod-parses.
     2. Runs `runGrill`. `hardErrors` throw `CommitError`, **with no override possible**. Block-level `issues` throw `NeedsOverride(issues)` unless `opts.override === true`, in which case their codes go into `txn.overrides`.
     3. Stamps uuids, `createdBy`, `createdAt`/`occurredAt` (`toISOString()`), and `unitCost` (= item.buyingPrice, D-015).
     4. In **one Dexie transaction**, writes the rows and syncQueue entries **in parent order**: a new customer first, then the txn, then the lines.
   - `commitVoid` rejects when `!canVoid`, and copies the party IDs from the original.
3. `queries.ts`, `useLiveQuery` hooks that call only B1 functions:
   - `useToday()` returns `todayInNairobi()`. It refreshes on `visibilitychange` and every 60 s, so the figures roll over at midnight.
   - Lists: `useTodaySales()` / `useTodayExpenses()` (query `occurredAt` within `nairobiDayRange(today)`), `useCustomersWithBalance()`, `useCustomerLedger(id)`, `useItemsWithStock()`, `useRecentItems(n)`.
   - Figures: `useDaySummary(today)`, `useLowStock()`.
   - `useUnsyncedCount()`: **unsynced records = queue entries whose table ≠ `lines`**, so one sale counts once.
4. `useBusinessDb()` context: opens `mazao-<businessId>` from `useSession()`.

**Verify:** Vitest with `fake-indexeddb/auto`:
- A credit sale with a new customer creates exactly 1 customer, 1 txn, n lines, and queue entries in parent order, in one transaction.
- A failed commit leaves no rows.
- `override: true` stores the block codes but **still throws** for `DENI_NEEDS_CUSTOMER`.
- With a profile seeded `rules.negativeStock = 'block'`, overselling throws `NeedsOverride`, and with override it saves with `overrides: ['NEGATIVE_STOCK']`.
- A void reverses the balance and the stock; a second void is rejected.

---

## A4: PIN lock (Dev A, frontend agent)

**Context:** everyday unlock is email + PIN offline (D-023, D-024). **One merchant account per phone** (D-039).

**Tasks**
1. `auth/pin.ts`:
   - `hashPin(pin, salt)` uses WebCrypto PBKDF2-SHA256, 150,000 iterations, 32-byte output, salt 16 random bytes.
   - `verifyPin` with a constant-time comparison.
   - Time one unlock on the 3 GB phone in A6. If it takes > 800 ms, lower the iterations to 100,000 and record that in DECISIONS.
2. `/set-pin`:
   - two 4-digit entries; they must match; reject `0000`, `1234`, and `1111` through `9999` (the same digit repeated four times);
   - create/update the `accounts` row (with `clerkUserId`). Copy: "Remember this PIN. To reset it you will need internet."
   - Then `router.replace(await nextRouteAfterPin())`.
3. `/lock`: shows the account email and a PIN pad. On success, `setSession(...)` and go to `/`. Backoff: after the 5th failure, `lockedUntil = now + 30 s × 2^(failures−5)`.
4. `LockGuard` in `(app)/layout.tsx`:
   - no device account → `/welcome` if the landing page shipped (D-044), otherwise `/sign-in`;
   - an account but no session → `/lock`;
   - hidden for more than 5 min (`visibilitychange`) → lock.
5. **Forgot PIN:**
   - offline → "Connect to the internet to reset your PIN".
   - online → **`await clerk.signOut()` first** (so a still-valid session can't skip the email code) → Clerk sign-in → bootstrap must return the same `profileId`, otherwise show an error and change nothing → `/set-pin`.
6. Signing in with a different Clerk user on a phone that already has an account shows: "This phone belongs to <email>. Ask the owner to remove their account in Mipangilio first." Removal is out of R0. Nothing is overwritten.

**Verify:**
- Vitest for hash/verify/backoff.
- Playwright `e2e/pin.spec.ts` (against the build): seed an account, go offline; wrong ×5 shows a countdown ≥ 30 s; the right PIN unlocks; hidden for more than 5 min (fake clock) relocks.

---

## B3: Ledger screens (Dev B, frontend agent)

**Context:**
- Implements RQ-6…RQ-9 and the RQ-11 UI.
- The visual reference is `docs/design/r0/`, or failing that the tokens in `docs/design/stitch-prompts.md`.
- Pages use only `commit.ts` and `queries.ts`.
- Use the frontend skills listed in `CLAUDE.md`.

**Tasks**
1. Primitives in `ui/`: `Button, Chip, ChipGroup, MoneyInput` (integer shillings → cents), `QtyInput` (fractional per item, max 3 decimals), `Sheet`, `IssueList`, `SaveAnywayDialog`.
2. **Bidhaa / Items** `/bidhaa`:
   - a list grouped by kind; goods rows show **stock on hand** with a low-stock marker;
   - an "Add item" sheet with a kind toggle, where services hide the stock fields;
   - no edit in R0.
3. **Mauzo / Sales:**
   - **`/mauzo/new`:**
     - line editor; item picker sheet (recent → search → "Add new item");
     - payment method chips; amount paid defaults to the total.
     - When paid < total: a deni section with the customer picker/creator and due chips (profile default preselected).
     - A live `runGrill` preview above Save. Hard errors disable Save with the reason shown. `NeedsOverride` opens `SaveAnywayDialog`.
   - **`/mauzo`:** today's list, a detail sheet, and Void (with confirmation; hidden when `!canVoid`).
4. **Gharama / Expenses:** `/gharama/new` and `/gharama`, with category chips from the profile plus "Add category".
5. **Deni / Debts:**
   - `/deni`: overdue first, the total outstanding, and a "Record payment" button per row.
   - `/deni/customer?id=…`: ledger with a running balance, "Brought forward" labels, voided rows struck through and labelled "Voided", and a payment sheet.

**Verify:** Playwright `e2e/ledger.spec.ts` against the build, offline after unlock:
1. The worked example entered through the UI.
2. Wanjiku 300 / paid 100 → `/deni` shows 200.
3. A payment of 150 → 50.
4. Void the payment → 200, with the voided row shown.
5. Opening stock of 10 tray mayai, sell 3 → Bidhaa shows 7.

---

## A5: Sync push/pull (Dev A, backend agent, strongest model)

**Context:** idempotent backup (D-020). Cents on the client, numeric on the server (D-013).

**Tasks**
1. `sync/wire.ts`: Zod wire schemas plus `toWire` / `fromWire`.
   - Cents ↔ decimal string `"150.00"`, parsed with `Math.round(Number(s) * 100)`.
   - Timestamps are normalised with `new Date(x).toISOString()`, because Postgres returns `+00`, not `Z`, and Dexie range queries need the exact format.
2. `POST /api/sync/push`:
   - body `{ rows: { table, row }[] }`, max 500.
   - `requireMember()`. 403 for the whole batch if any `row.businessId !== businessId`, or if any `transaction_items.transaction_id` belongs to another business.
   - In **one interactive transaction**, in parent order (customers, suppliers, items, merchant_settings, transactions, transaction_items):
     - **transactions and lines:** `createMany({ data, skipDuplicates: true })`.
     - **master tables:** `$executeRaw` per row, `INSERT … ON CONFLICT (id) DO UPDATE SET … WHERE t.updated_at < EXCLUDED.updated_at AND t.business_id = EXCLUDED.business_id`. The second condition stops one business overwriting another's row. Values go only through the tagged template.
     - **`merchant_settings`:** conflict target `(business_id)`.
   - **`accepted` = every ID in the batch once the transaction commits**, including duplicates that were skipped, so the queue always drains.
3. `GET /api/sync/pull?since=ISO`: the business's rows with `updated_at` (master) or `created_at` (txns/lines) > since, paged at 1,000. Returns `{ rows, nextSince }`.
4. `sync/engine.ts`:
   - `flush()` reads up to 200 queue entries due now, in `seq` order, and POSTs them with the Clerk `getToken()`.
   - **It flushes only when Clerk's `userId` equals the session's `clerkUserId`.**
   - On success it deletes the accepted entries.
   - 5xx or a network error → `attempts++`, with `nextAttemptAt = now + min(5 min, 2^attempts s)`.
   - **401/403 → stop retrying** and set the status to `Sign in to back up`.
   - Triggers: unlock, the `online` event, 5 s after a commit (debounced), and every 60 s while visible and online.
   - On `online` while Clerk is `!isLoaded` (a cold offline start), remount `<ClerkProvider key={n}>` so clerk-js loads.
5. `restore()`: when bootstrap reports `hasData`, pull from the epoch into the business DB **without creating queue entries**, before `/set-pin`.
6. `useSyncStatus()`:
   - `Backed up` | `Saving…` | `Not backed up (n)` | `Sign in to back up`;
   - the banner shows when the oldest unsynced record is more than 3 days old, **or** the status is `Sign in to back up`.
7. `navigator.storage.persist()` after the first unlock.

**Verify:**
- Route tests (Neon `dev` branch):
  - the same batch twice → counts unchanged **and `accepted` contains every ID both times**;
  - a foreign `businessId` → 403;
  - a foreign customer `id` with our businessId → not overwritten;
  - LWW keeps the newer row;
  - `merchant_settings` upserts by `business_id`.
- Engine test (mocked fetch): 500 → backoff, then success → queue empty; 403 → no retry and the status is `Sign in to back up`.
- Manual on the preview:
  - record offline, reconnect → rows in Neon within 60 s;
  - a second browser profile signs in to the same account → restore shows the same deni and today's totals.

---

## B4: Muhtasari + onboarding + notebook (Dev B, frontend agent)

**Context:** RQ-4, RQ-5, RQ-10.

**Tasks**
1. **Muhtasari / Overview** `/`:
   - Faida Halisi / Net profit (big tabular numeral), with Sales, COGS and Expenses;
   - money in: cash and M-Pesa;
   - deni outstanding and supplier deni (opening);
   - top 5 who owe;
   - low stock;
   - quick actions;
   - a day-1 empty state.
2. **Onboarding** `/onboarding`:
   - one RQ-4 question per screen, each with a "why this matters" line, chips, and Back/Next/Skip; every answer is saved to `onboarding` locally;
   - the item step adds up to 8 items inline.
   - `/onboarding/review` shows the summary with an edit link per section. Confirm → `saveSettings` → `addItem` ×n → `/notebook`.
3. **Notebook** `/notebook`:
   - tabs: Customers who owe you / You owe suppliers / Stock you have;
   - each row → `commitOpening` / `commitStockAdjustment` with `source: 'onboarding'`;
   - Done → `/`.
4. **Leo / Today report** `/leo` (RQ-15, D-047):
   - `useTodayReport(today)` in `local/queries.ts` returns the day's records and per-customer activity, built from the same domain functions as Muhtasari, so the totals match by construction;
   - a "Share today's summary" button (`navigator.share`, falling back to clipboard).
5. `local/routing.ts` `nextRouteAfterPin()`: no profile in settings → `/onboarding`; otherwise `/`.

**Verify:**
- `e2e/onboarding.spec.ts` against the build: 3 items (one a service) → review → notebook (Otieno owes 500, 10 tray mayai) → Muhtasari shows deni outstanding 500 and today's sales 0.
- Skip → Muhtasari with defaults.

---

## A6: Mipangilio, integrate, deploy, pilot kit (Dev A; Dev B joins at 23:00; devops + qa agents)

**Tasks**
1. **Mipangilio / Settings** `/mipangilio`:
   - account email, change PIN (verify the current PIN, then `/set-pin`), lock now;
   - re-run onboarding, open the notebook;
   - sync status + "Back up now" (`flush()`), app version.
2. Merge order: A3 → B2 → A4 → B3 → A5 → B4 → A6. Rebase each PR on `main`. Run the full Playwright suite on the integrated build.
3. Production: Vercel `fra1` with the production env vars. `pnpm db:migrate` against Neon `main` **before** the deploy.
4. Device check on 2 real Android phones (one 3 GB). Time the PIN unlock (A4 task 1). Measure:
   - install;
   - sign-in;
   - PIN;
   - onboarding;
   - offline sale;
   - reconnect → backup;
   - sign-in → first record, with a target of ≤ 10 min.
5. Write the RQ-14 pilot docs.
6. **Optional (first cut): landing page** at `/welcome` (D-044), built by the `frontend` agent from the Landing prompt in `docs/design/stitch-prompts.md`. It's static and precached, and LockGuard sends phones with no account there.
7. Tag `v0.1.0-r0`. The product owner updates `planning/STATE.md` after the acceptance run.

**Verify:** run `acceptance.md` in full and record the evidence in the PR.

---

## Cuts (applied in order at the Sun 18:00 checkpoint if behind)
Already applied: multi-account (D-039), the sidebar, Repeat last sale, Bidhaa edit.
0. The landing page (`/welcome`). LockGuard then sends phones with no account straight to `/sign-in`. Waives nothing.
1. Restore-by-pull. Push stays; a new phone starts empty, one phone per merchant. **Waives AC-19.**
2. Onboarding reduced to business name, type and items. **Waives part of AC-15**: the time target still applies.
3. The `PRICE_VARIANCE` and `POSSIBLE_DUPLICATE` rules.
3a. The per-customer section and Share on `/leo`. The chronological list and totals stay. **Waives AC-28.**
4. The Gharama list screen; the new-expense form stays. Today's expenses still show on Muhtasari.

**Never cut:**
- offline save;
- PIN lock;
- push backup;
- correct Faida Halisi and deni;
- the privacy notice;
- void;
- bilingual titles.
