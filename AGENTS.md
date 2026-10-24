# AGENTS.md: Mazao

Mazao is an offline-first PWA bookkeeping app for small Kenyan merchants who sell goods and services: sales, expenses, deni, stock and Faida Halisi, plus local AI later. The R0 pilot runs with 5 merchants in Gikomba on **Mon 2026-10-26**.

## Read before doing anything
1. `planning/STATE.md`: where we are now.
2. `planning/DECISIONS.md`: house rules (D-xxx). Don't contradict them; propose a superseding decision instead.
3. `planning/DOMAIN.md`: terms, transaction types, the worked example.
4. The current sprint folder, `planning/sprints/<latest>/`: `requirements.md`, `blueprint.md`, `acceptance.md`.
5. Background only: `docs/superpowers/specs/2026-10-24-mazao-mvp-design.md` (the spec, which wins over `docs/PRD.md`).

## House rules for code
- **Offline first:**
  - App pages are client pages that read only from Dexie, with no server data fetching.
  - `/api/*` is never cached by the service worker.
- **One save path:** every record goes through `local/commit.ts`: Zod parse → `runGrill` → a single Dexie transaction with sync-queue entries. Pages never write to Dexie directly.
- **Money:**
  - integer **cents** in `domain` and the client;
  - `numeric(14,2)` on the server;
  - conversion only in `sync/wire.ts`;
  - `lineTotal = Math.round(qty * unitPrice)`.
- **Ledger:**
  - Confirmed transactions are immutable. Corrections are `void` + a new record.
  - Balances and stock are **derived** from the ledger, never stored.
- **Tenancy:** every business-owned row has `businessId` and `createdBy`. Server routes call `requireMember()` and reject any row from another business.
- **Pure numbers:** all maths lives in `domain` as pure functions with tests. Hooks and components never calculate money.
- **AI (R4+):** nothing AI-produced is saved without the Review Card and the exact button `[ ✅ Confirm & Save Record ]`.
- **Strings:** every UI string comes from `i18n` via `t(key, locale)`. English is the default; the merchant can switch to Kiswahili (D-049). Add every new key to both `en.*` and `sw.*` halves.
- **Next.js:** latest version, App Router, **no `src/`** (code folders at the repo root), React Compiler on. Don't hand-add `useMemo`/`useCallback`/`memo`, and keep render pure. Build with `next build --webpack` (Serwist).
- **Phones:** the target is a 3 GB RAM Android phone running Chrome. Keep bundles small and lazy-load heavy screens; tap targets are ≥ 48 px.
- **Privacy:** never log record contents, phone numbers or PIN material. The PIN never leaves the device.

## Commands
```
pnpm install         # package manager is pnpm only; never npm or yarn
pnpm dev             # local dev
pnpm lint            # Biome check (no ESLint)
pnpm format          # Biome format --write
pnpm typecheck
pnpm test            # vitest
pnpm e2e             # playwright
pnpm build
pnpm db:generate     # prisma contract emit (Prisma 8, D-048; also runs on postinstall)
pnpm db:migrate:dev  # prisma migration plan --name <slug> (plans a migration from the contract diff)
pnpm db:migrate      # prisma db migrate (applies planned migrations; uses DIRECT_URL)
```
A PR is ready only when `lint`, `typecheck`, `test` and `build` pass and the step's Verify commands have been run.

## Git
- Branches: `feat/<step-id>-<slug>`, e.g. `feat/b1-domain-core`. One blueprint step = one PR.
- PR title: `<step-id>: <summary>`. The body lists the acceptance IDs (AC-xx) it advances and pastes the verification output.
- Never push to `main` directly. Never skip hooks.

## Roles (see `.claude/agents/`)
- **architect:** writes each sprint's spec folder (requirements, blueprint, acceptance, handoff) using the 120x method.
- **scrum-architect:** splits the blueprint into tasks, assigns them to specialists, tracks them and calls the cuts.
- **frontend:** frontend designer and Next.js expert (pages, UI, PWA shell, landing page, Stitch → components).
- **backend:** domain maths, Dexie commit service, sync, API routes, Prisma + Neon, Clerk server side.
- **devops:** Vercel, Neon, Clerk (CLIs and MCPs), env vars, CI, migrations, deploys.
- **qa:** Playwright e2e against the build, device checks, the acceptance run.
- **reviewer:** adversarial review of every PR and every blueprint.
- **product-owner:** product decisions and accepting a sprint against `acceptance.md`.
- **developer:** generalist builder for small cross-cutting tasks.

The full loop is in `docs/WORKFLOW.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
