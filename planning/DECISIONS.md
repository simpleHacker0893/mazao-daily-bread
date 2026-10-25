# DECISIONS: Mazao

These are house rules. Don't re-litigate them; to change one, propose a superseding decision.

- **Owner**: decided by the product owner.
- **Arch**: Architect call, which the owner can challenge.
- **Full reasoning:** `docs/superpowers/specs/2026-10-24-mazao-mvp-design.md` (the "spec").

## Product
- **D-001 (Owner):** Users are Kenyan small merchants who sell **goods and services**: shops, mama mbogas, boda bodas, transporters and repair fundis.
- **D-002 (Owner):** The pilot is **5 merchants in Gikomba market, Nairobi**, starting **Mon 2026-10-26**.
- **D-003 (Owner):** The product is free. Every service runs on a free tier (Vercel, Neon, Clerk).
- **D-004 (Owner):** Language:
  - English UI text.
  - **Kiswahili page and navigation names**: Muhtasari, Mauzo, Manunuzi, Deni la Wateja, Deni la Wasambazaji, Gharama, Bidhaa, Kazi, Mtandao, Ripoti, Mipangilio.
  - Kiswahili UI and voice come later.
- **D-005 (Arch):** Market words stay untranslated: deni, Faida Halisi, ushuru, kilo, gunia, fundo, ndume, tray. All UI strings go through the i18n dictionary.
- **D-006 (Owner):** Items have `kind` = `goods` | `service`. Services have no stock and `unit_cost` defaults to 0.
- **D-007 (Owner):** **Repair job card (Kazi)**:
  - statuses `received → in_progress → ready → collected` (+ `cancelled`);
  - labour lines plus parts lines from stock.
  - No photos, warranties or SMS in the MVP.
- **D-008 (Arch):** Job money:
  - A deposit is a customer payment, so the customer is in credit.
  - Marking the job **ready** creates the linked sale, and that's when stock, revenue and COGS are counted.
- **D-009 (Owner):** **Loans are out of the MVP entirely**: no ledger and no lender links.
- **D-010 (Owner):** **Mtandao** is a read-only relationship map built from local data and works offline. It ships in R6.
- **D-011 (Arch):** **"Bring in your notebook"**:
  - Opening customer and supplier deni are recorded as `opening_balance` transactions.
  - Opening stock is a `stock_adjustment` valued at buying price.
  - None of these count in Sales, COGS, Expenses or Faida Halisi.
- **D-012 (Owner):** One owner per business in the MVP. Roles and attendants come later.

## Money
- **D-013 (Arch):** Money is held as **integer cents** in the client and domain code. The server stores `numeric(14,2)`. Conversion happens only at the sync boundary.
- **D-014 (Arch):** Calculations:
  - Total Sales = confirmed sale lines (goods + services).
  - COGS = goods lines × `unit_cost` captured at sale time.
  - Faida Halisi = Sales − COGS − Expenses.
  - Payments, deposits, opening balances and stock adjustments are never sales.
- **D-015 (Arch):** `unit_cost` defaults to the item's current `buying_price` when the record is confirmed. There is no FIFO or weighted-average costing.

## Data and sync
- **D-016 (Owner):** The tenant is the **business**:
  - Every business-owned row has `business_id` and `created_by`.
  - Tables: `profiles`, `businesses`, `business_members(role)`, with the only role being `owner` in the MVP.
- **D-017 (Arch):** Membership lives in Mazao's own tables, not in Clerk Organizations.
- **D-018 (Arch):** IDs are client-generated UUID v4. Confirmed transactions are **immutable**. A correction is a `void` transaction plus a new record.
- **D-019 (Arch):** Balances (customer deni, supplier owed) and stock are **derived from the ledger**, not stored. The client computes them from Dexie. Server-side recompute arrives with sync hardening (R6).
- **D-020 (Arch):** Sync behaviour:
  - **Push** is idempotent: transactions use `ON CONFLICT (id) DO NOTHING`, and master data is last-write-wins on `updated_at`.
  - **Pull** returns all of the business's rows changed since a timestamp, which is also used for new-phone restore.
- **D-021 (Arch):** AI drafts never sync. The app requests persistent storage, and shows a "connect to back up" banner if records stay unsynced for more than 3 days.

## Auth
- **D-022 (Owner):** Clerk is used **only for first sign-in, recovery and the sync token**. The sign-in methods are **email one-time code** and **Google**. Phone OTP comes after the pilot.
- **D-023 (Owner):** **4-digit PIN** for everyday unlock (email + PIN), online or offline. "Forgot PIN" needs internet and uses a Clerk email code, after which the merchant sets a new PIN.
- **D-024 (Arch):** PIN storage and locking:
  - The PIN is stored as PBKDF2-SHA256 (150,000 iterations, 16-byte random salt), in IndexedDB only. It is never sent to the server and is never the online password.
  - The app locks after 5 minutes in the background.
  - After 5 wrong PINs there is a 30-second wait, which doubles with each further failure.
- **D-025 (Arch):** Shared phones can hold several accounts (email + PIN each), and each account's local data is kept separate.

## Validation ("Grill rules")
- **D-026 (Arch):** The Transaction-Mode checks are **deterministic code** in one shared save path, used by both manual and AI entry:
  - arithmetic;
  - deni without a customer;
  - negative stock;
  - selling below cost;
  - price more than 30% from the item's price;
  - duplicates (same type, party and amount within 10 minutes).
- **D-027 (Arch):** "Block" can always be overridden with a second "Save anyway" tap, and the override is stored on the record. Only arithmetic and schema errors are hard stops.

## AI (not in R0)
- **D-028 (Owner):** Manual entry is the main path, and **nothing AI-made is saved without the Review Card and `[ ✅ Confirm & Save Record ]`**.
- **D-029 (Owner):** Local AI:
  - **wllama** for the parsing LLM;
  - **transformers.js** for speech-to-text and embeddings.
  - `@qvac/sdk` is dropped because it has no browser support.
- **D-030 (Owner):** Model test shortlist:
  - Qwen2.5-0.5B vs Qwen3-0.6B (Q4 GGUF);
  - whisper-base.en vs moonshine-base;
  - multilingual-e5-small.
- **D-031 (Owner):** Minimum phone is Android 10+, Chrome, 3 GB RAM. The local LLM requires ≥ 4 GB RAM. Model downloads need the merchant's consent and run on Wi-Fi only by default.
- **D-032 (Owner):** **Voice is English-only.** Audio never leaves the phone. If no speech model passes the model test, voice ships off.
- **D-033 (Owner):** Cloud AI goes through **Vercel AI Gateway with a team-provided key**. It is off until a key exists, opt-in, and text only. The onboarding Grill Agent interview uses it. Until then, onboarding is tap-to-answer.

## Platform
- **D-034 (Owner):** PWA on Vercel (free), Neon (free), Clerk (free).
- **D-035 (Arch):** Region: Neon `aws-eu-central-1` (Frankfurt) and Vercel functions in `fra1`.
- **D-036 (Arch):** Stack:
  - Next.js App Router (latest), TypeScript strict, Tailwind CSS, pnpm; see D-043 for layout and tooling;
  - Dexie 4 + dexie-react-hooks, Zod;
  - **Prisma ORM** (see D-037);
  - Serwist for the service worker;
  - Vitest + fake-indexeddb, Playwright.
- **D-037 (Owner, 2026-10-24, supersedes Drizzle in D-036):** The server database uses **Prisma ORM, latest version**, connected to Neon through the **`@prisma/adapter-neon` driver adapter**.
  - The schema lives in `prisma/schema.prisma`, with config in `prisma.config.ts`.
  - Migrations use `prisma migrate`.
  - The generated client is a singleton in `server/db.ts`.
  - **Two connection strings:** `DATABASE_URL` is Neon's pooled URL, used at runtime through the adapter. `DIRECT_URL` is Neon's unpooled URL, used by migrations.
  - Postgres-specific writes that Prisma can't express, such as the conditional last-write-wins upsert, use parameterised `prisma.$executeRaw` with tagged templates. There is no string-built SQL.

## Superseding decisions (2026-10-24, from the plan review)
- **D-038 (Arch, refines D-026/D-027):** `DENI_NEEDS_CUSTOMER` is a **hard error that can't be overridden**. Unpaid money must always belong to a customer, or it disappears from deni tracking. The other rules stay warn/block, with "Save anyway".
- **D-039 (Owner via cut, supersedes D-025 for R0):** **One merchant account per phone** in R0.
  - The device account stores `clerkUserId`.
  - Sync only flushes while Clerk's signed-in user matches it.
  - Forgot PIN signs out of Clerk first, so the email code is always required.
  - Several accounts per phone comes back after the pilot.
- **D-040 (Owner, refines D-004):** **Every page title and navigation label is bilingual**: the Kiswahili title, with the English translation directly beneath it in smaller text, for people who don't know Kiswahili. Body text stays English.
  - Applies to key money labels too (Faida Halisi / Net profit).
  - R0 uses the mobile layout (bottom nav) at every width, with no sidebar.
- **D-041 (Arch):** Customer ledger route is `/deni/customer?id=<uuid>`. App pages use no dynamic segments, so the service worker can precache every page.
- **D-042 (Arch):** The build uses `next build --webpack`, because Serwist doesn't support Turbopack.
- **D-043 (Owner, 2026-10-24):** Project layout and tooling:
  - **no `src/` directory**: `app/`, `proxy.ts` and the code folders sit at the repo root;
  - **Biome** is the only linter and formatter (no ESLint or Prettier);
  - **React Compiler** is enabled (`reactCompiler: true`), and code doesn't hand-memoise;
  - all dependencies use their **latest** stable versions at scaffold time.
- **D-044 (Arch, owner to confirm):** The public **landing page** lives at `/welcome` (Persuade mode, prompt in `docs/design/stitch-prompts.md`).
  - `/` stays the app (Muhtasari).
  - LockGuard sends a phone with no device account to `/welcome`, which links to `/sign-in`.
  - It is static and precached. It's built in R0 only if time allows; it's the first cut.
- **D-045 (Owner, 2026-10-24):** **Imagery.**
  - **Where:** the landing, sign-in/auth and onboarding screens use photographic **background images** of Kenyan market life under a solid scrim (WCAG AA). App work screens (forms, lists, Muhtasari, reports) stay clean for sunlight legibility and use imagery only in headers and empty states.
  - **Sources:** Stitch or image generation, or real Gikomba photos taken with written consent. No div-based fake screenshots.
  - **Format:** AVIF/WebP, ≤ 150 KB each. Only the auth and onboarding backgrounds are precached.
- **D-046 (Owner, 2026-10-24):** **Phases.**
  - The project is delivered in phases 0–11 (`planning/ROADMAP.md`). Each phase has a spec in `planning/sprints/phase-NN-*/spec.md`, published as a GitHub issue labelled `ready-for-agent`, with a milestone per phase. Phases 0–4 form the R0 pilot.
  - Each phase with UI begins by generating its screens in Stitch from the prompt file through the Stitch MCP. This is automated in Phase 0.
- **D-047 (Owner, 2026-10-24):** R0 adds a **"Leo / Today" daily report**:
  - every record of the day in time order, with totals that reconcile to Muhtasari;
  - each customer's activity for the day;
  - "share today's summary" as plain text (Web Share API, with a copy fallback).

  Period reports and PDF stay in Phase 7.
- **D-048 (Owner, 2026-10-24, supersedes the client and migration parts of D-037; overrides "stable" in D-043 for Prisma only):** The server database uses **Prisma ORM 8** (`prisma` 8.0.0-rc.27 CLI with `@prisma/orm-postgres` 8.0.0-rc.20, the newest published and the toolchain version that CLI is built on), both pinned exactly because they are release candidates.
  - The owner chose the latest Prisma over the 7.10.1 stable line. Prisma 8 has no `@prisma/client` or `@prisma/adapter-neon`; it is contract-first.
  - The data contract is `prisma/contract.prisma`. `prisma contract emit` writes `prisma/contract.json` and `prisma/contract.d.ts` (both committed); it runs on `postinstall` and as `pnpm db:generate`.
  - Migrations: `prisma migration plan --name <slug>` (`pnpm db:migrate:dev`), then `prisma db migrate` (`pnpm db:migrate`). The CLI connects with `DATABASE_URL_UNPOOLED` (Neon's direct URL, the name `neon env pull` writes; replaces `DIRECT_URL`), falling back to `DATABASE_URL`.
  - The runtime client (`server/db.ts`, `postgres({ contract })` from `@prisma/orm-postgres`) is wired to Neon with the Neon setup; the runtime keeps using `DATABASE_URL` (pooled).
  - Raw SQL for the conditional last-write-wins upsert uses Prisma 8's typed SQL lane (`db.sql`), never string-built SQL.
  - Prisma 8 needs PostgreSQL 15 or newer (Neon meets this).

- **D-049 (Owner, 2026-10-24, supersedes the naming parts of D-004 and D-040):** **English is the default UI language; Kiswahili is a switch.**
  - Every string (page titles, navigation, buttons, body text) shows in English by default. The bilingual "Kiswahili title with English beneath" pattern of D-040 is dropped.
  - The merchant can switch the whole UI to Kiswahili in Mipangilio/Settings (also offered once during sign-in or onboarding). The choice is stored on the phone in the device database `meta` table under the key `locale`.
  - i18n contract: `i18n/en.*.ts` and `i18n/sw.*.ts`, each split into shell (Dev A) and ledger (Dev B) halves; the Kiswahili halves are typed against the English keys, so a missing translation fails typecheck. `t(key, locale = "en")`.
  - Open (owner to confirm): whether market words from D-005 (deni, Faida Halisi, ushuru…) stay untranslated in the English UI. Until confirmed, the English UI uses plain English (Debts, Net profit) and the Kiswahili UI uses the market words.
  - Still in force from D-040: the mobile layout (bottom nav) at every width, with no sidebar.
- **D-050 (Owner, 2026-10-25, supersedes the route names in D-041 and the open market-words question in D-049 for R0):** **Routes, route folders and navigation are English; Kiswahili translation comes in a later phase.**
  - Routes: Overview `/`, `/sales`, `/sales/new`, `/expenses`, `/expenses/new`, `/debts`, `/debts/customer?id=<uuid>`, `/items`, `/settings`, `/today`, plus `/onboarding`, `/onboarding/review`, `/notebook`, `/lock`, `/set-pin`, `/welcome`. The folders under `app/` use the same names.
  - Bottom nav: Overview, Sales, Debts, Expenses, More (drawer: Items, Settings). One English label per item and one English page title; no Kiswahili caption.
  - D-041's rule still holds with the new path: no dynamic segments, the customer id travels in the query string.
  - Kiswahili strings stay in `i18n/sw.*`, typed against the English keys, so the later translation phase only adds the Settings switch and the `meta.locale` read.
