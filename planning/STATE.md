# STATE: Mazao

_Rolling snapshot. Edit in place; never append a log._

**Updated:** 2026-10-24 (Sat, evening)
**Phase:** Phase 0 (design system, imagery and landing) is in progress. The app skeleton and Neon backend are on `main`.
**Next milestone:** R0 pilot with 5 merchants in Gikomba, **Mon 2026-10-26**.

## Source documents
- Product: `docs/PRD.md` (v1.1)
- Design spec (wins over the PRD where they conflict): `docs/superpowers/specs/2026-10-24-mazao-mvp-design.md`
- UI prompts for Stitch: `docs/design/stitch-prompts.md` (v3)
- Stitch screen register: `docs/design/r0/README.md`
- How we work: `docs/WORKFLOW.md`

## Where we are

**On `main`:**
- **App skeleton (#15, PR #25, merged):** Next.js 16.4 App Router with no `src/`, React Compiler, Biome, Tailwind through PostCSS, `next build --webpack`, pnpm 12, strict TypeScript with `noUncheckedIndexedAccess`.
- **Shared contracts (frozen; changes need both lanes to agree):**
  - `auth/session.ts`: `useSession()`, `setSession()`, `clearSession()`;
  - `local/device-db.ts`: Dexie `mazao-device`, with `accounts` (key `profileId`) and `meta` (key `key`);
  - `local/routing.ts`: `nextRouteAfterPin()`, a stub returning `/`;
  - `i18n/`: `en` and `sw` dictionaries (shell and ledger halves) and `t(key, locale = "en")`.
- **Neon backend (branch `feat/setup-neon-clerk`):**
  - linked to org `org-misty-fire-11909289`, project `raspy-dust-94340460` ("mazao-daily-bread", `aws-eu-central-1`, Postgres 18), branch `production`;
  - `neon.ts` declares Postgres and a private `assets` bucket, provisioned with `neon deploy`;
  - `server/db.ts` holds the Prisma 8 client on the pooled `DATABASE_URL`;
  - `server/storage.ts` uses the Files SDK on `assets`;
  - `GET /api/health` returns `{"database":"ok","storage":"ok"}`, verified on `pnpm start` and on `pnpm dev` (full upload → download → delete round trip).
- **Prisma 8 (D-048):** owner's choice of the latest version. 8.0.0-rc.27 CLI with `@prisma/orm-postgres` 8.0.0-rc.20. The contract (`prisma/contract.prisma`) is still empty; models come in Phase 1 (A5).
- **Language (D-049):** English is the default UI language; Kiswahili is a switch in Settings. This supersedes the Kiswahili-first and bilingual naming in D-004 and D-040. Open question: do market words (deni, Faida Halisi) stay untranslated in English?
- **Stitch (D0, #21, partial; PR #28 merged as "Part of #21"):**
  - project `2699180917177352710`, design system "Mazao Market Tool", prompts v3 (English-first, mobile + desktop);
  - only the style board and a landing draft exist, and the landing draft is rejected because its copy is Kiswahili;
  - the six landing photos are in `public/images/stitch/`;
  - **blocked:** Stitch stopped finishing jobs after about 13:45 UTC (about 18 calls timed out). None of the R0 app screens (§3.1–3.14, §10.1, §10.2) exist. Rerun them one at a time, as described in `docs/design/r0/README.md`.
- Phases 1–4 have per-ticket plans in `planning/sprints/phase-0N-*/plan.md`, revised for D-049 (PRs #23, #24, #26, #27).

**Not done yet:**
- **Clerk:** both CLIs are signed in, but `init --app app_3L8uFOUNkjToZiKTMKFjuraVa69` (provider, `proxy.ts`, `/sign-in`) has not run.
- **A1b (#16):** CI workflow, Vercel project in `fra1` with preview deploys.
- **A2 (#17, #18), imagery (#19, #20), landing (#22).** The specialist agents for #16, #17 and #19 were stopped with the scrum-architect before opening PRs. Their worktrees under `.claude/worktrees/` may hold partial work.

## Known issues
- **The Tailwind scan must skip `.claude/` and `.agents/`** (`@source not` in `app/globals.css`). The agent worktrees there otherwise crash the webpack build with `WasmHash ... reading 'length'`. Vitest and tsc exclude them too.
- **`pg` prints an SSL-mode notice** (`sslmode=require` is treated as `verify-full`). This is harmless.

## Phases
See `planning/ROADMAP.md`. Phases 0–4 form the R0 pilot. Specs are in `planning/sprints/phase-NN-*/spec.md` and are published as GitHub issues #1–#12. The Phase 0 tickets are #15–#22.

## Issue status

| Issue | Ticket | Status |
|---|---|---|
| #15 | A1a skeleton + contracts | **Done** (PR #25) |
| #16 | A1b CI, Vercel, Prisma init | Open. Prisma init and the Neon env template are already done here; CI and Vercel remain |
| #17 | A2 app shell + nav | Open (unblocked) |
| #18 | A2 installable offline PWA | Open |
| #19 | Imagery pipeline | Open (unblocked; Stitch photos available) |
| #20 | Auth/onboarding backgrounds | Open |
| #21 | D0 Stitch designs | **Partial** (PR #28); blocked on Stitch |
| #22 | Landing at /welcome | Open |

## Owner actions before Monday
- Check the Stitch project in the web UI. Jobs are stuck in "Generating…".
- Answer the D-049 market-words question.
- See `planning/QUESTIONS.md`, Q-001 to Q-003.
