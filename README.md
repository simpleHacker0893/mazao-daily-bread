# Mazao

**Mazao** is an offline-first, AI-assisted bookkeeping Progressive Web App for informal Kenyan micro-merchants: mama mbogas, market traders, kiosk owners, boda riders, transporters and repair fundis. It records sales, purchases, expenses and services, tracks **deni** (credit) owed by customers and to suppliers, and shows true profit (**Faida Halisi**). It works with no internet, on a 3 GB Android phone, in a market in full sun.

> Status: **planning complete, build starting.** The R0 pilot runs with 5 merchants in Gikomba market, Nairobi, on **Mon 26 Oct 2026**.

## Principles
- **Offline-first:** every record is saved on the phone first and backed up when there's signal.
- **Manual-first, AI-assisted:** fast forms come first. AI (from R4) only drafts records, and nothing is saved without the merchant tapping **`[ ✅ Confirm & Save Record ]`**.
- **Honest numbers:** confirmed records can't be edited; corrections are voids. Balances and stock are derived from the ledger.
- **Bilingual titles:** every page title and nav label is Kiswahili with the English translation underneath.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js App Router (latest), TypeScript, Tailwind CSS, React Compiler; **no `src/`** |
| Tooling | pnpm, Biome (lint and format), Vitest, Playwright |
| PWA | Serwist service worker (`next build --webpack`) |
| Local data | IndexedDB through Dexie (source of truth on the phone) |
| Server data | Neon Postgres (Frankfurt) through Prisma (latest) and `@prisma/adapter-neon` |
| Auth | Clerk (email code or Google) for first sign-in, then a local 4-digit PIN |
| Hosting | Vercel (free tier) |
| AI (R4+) | On-device: wllama (small Qwen), transformers.js (Whisper / embeddings); opt-in cloud through Vercel AI Gateway |

## Roadmap
Each phase is one sprint with a spec in `planning/sprints/phase-NN-*/spec.md`, tracked as a GitHub issue with its own milestone.

| Phase | Scope | Release | Issue |
|---|---|---|---|
| 0 | Design system, imagery & landing page | R0 pilot | [#1](../../issues/1) |
| 1 | Authentication & data foundation | R0 pilot | [#2](../../issues/2) |
| 2 | Onboarding & bring-in-your-notebook | R0 pilot | [#3](../../issues/3) |
| 3 | Recording daily transactions | R0 pilot | [#4](../../issues/4) |
| 4 | Muhtasari dashboard, Today report & pilot readiness | R0 pilot | [#5](../../issues/5) |
| 5 | Purchases & supplier deni | R1 | [#6](../../issues/6) |
| 6 | Stock depth & Kazi repair jobs | R2 | [#7](../../issues/7) |
| 7 | Ripoti reports & data rights | R3 | [#8](../../issues/8) |
| 8 | AI assist | R4 | [#9](../../issues/9) |
| 9 | English voice | R5 | [#10](../../issues/10) |
| 10 | Mtandao & sync hardening | R6 | [#11](../../issues/11) |
| 11 | Growth backlog | post-MVP | [#12](../../issues/12) |

Full map: [`planning/ROADMAP.md`](planning/ROADMAP.md).

## Repository map
```
AGENTS.md / CLAUDE.md        rules for coding agents and the Claude Code setup
docs/PRD.md                  product requirements (v1.1)
docs/superpowers/specs/      MVP design spec
docs/design/stitch-prompts.md  Stitch prompts: design system, landing page, every screen
docs/WORKFLOW.md             how we plan, design, build, review and ship
docs/agents/                 issue tracker, triage labels, domain-docs config
planning/STATE.md            where we are now
planning/DECISIONS.md        decision log (D-001 onward)
planning/DOMAIN.md           glossary, transaction types, worked example
planning/ROADMAP.md          phases 0-11
planning/sprints/001-r0-pilot/   R0 execution plan: requirements, blueprint, acceptance, handoff prompts
planning/sprints/phase-NN-*/ one folder per phase (spec.md, then the sprint files)
.claude/agents/              agent team (architect, scrum-architect, frontend, backend, devops, qa, reviewer, product-owner)
.mcp.json                    Neon + Clerk MCP servers (OAuth, no secrets)
```

## How we work
1. The **architect** agent writes the phase's sprint files from its spec. The **scrum-architect** splits them into tasks.
2. The **frontend** agent generates the screens in Stitch from `docs/design/stitch-prompts.md`, using impeccable for design quality.
3. The **frontend**, **backend** and **devops** agents build each step test-first, one branch and one PR per step.
4. The **reviewer** agent reviews the PR, **qa** verifies it on the built app (offline, on a phone), and the **product-owner** accepts it against `acceptance.md`.

Details: [`docs/WORKFLOW.md`](docs/WORKFLOW.md).

## Getting started (developers)
App code arrives with blueprint step **A1a**. Until then:
1. Read `AGENTS.md`, then `planning/STATE.md` and `planning/DECISIONS.md`.
2. Paste your lane's prompt from [`planning/sprints/001-r0-pilot/handoff-prompt.md`](planning/sprints/001-r0-pilot/handoff-prompt.md) into Claude Code.
3. Sign in once:
   - `neonctl auth`;
   - `clerk auth login`;
   - `/mcp` in Claude Code (Neon and Clerk).

Once the scaffold lands:
```
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e        # Playwright against the production build
```
Environment variables are listed in `.env.example`: Clerk keys, `DATABASE_URL` (Neon pooled) and `DIRECT_URL` (Neon unpooled).

## Privacy
Merchant data is stored on the phone and backed up to Neon in the EU. Raw audio never leaves the device, and cloud AI is opt-in only. The PIN never leaves the phone. We follow the principles of the Kenya Data Protection Act, 2019.
