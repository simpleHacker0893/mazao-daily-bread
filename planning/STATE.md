# STATE: Mazao

_Rolling snapshot. Edit in place; never append a log._

**Updated:** 2026-10-24 (Sat)
**Phase:** Sprint 001 (R0 pilot build) is planned and ready for the Builders.
**Next milestone:** R0 pilot with 5 merchants in Gikomba, **Mon 2026-10-26**.

## Source documents
- Product: `docs/PRD.md` (v1.1)
- Design spec (wins over the PRD where they conflict): `docs/superpowers/specs/2026-10-24-mazao-mvp-design.md`
- UI prompts for Stitch: `docs/design/stitch-prompts.md`
- How we work: `docs/WORKFLOW.md`

## Where we are
- Discovery and design interview are done. Decisions are recorded in `planning/DECISIONS.md`.
- The repo holds docs only. No app code exists yet.
- Sprint 001 blueprint is at **rev 2**: it includes the adversarial review fixes and the owner's stack changes:
  - Prisma replaces Drizzle (D-037);
  - no `src/` directory, Biome, React Compiler, latest versions (D-043);
  - bilingual titles (D-040);
  - landing page at `/welcome` (D-044).
- Agent team in `.claude/agents/`: architect, scrum-architect, frontend, backend, devops, qa, reviewer, product-owner.
- Neon and Clerk are set up:
  - **CLIs:** `neonctl`, `clerk`;
  - **MCPs:** `.mcp.json`;
  - **skills:** `neon-*`, `clerk-*`.
- **Design prompts:** `docs/design/stitch-prompts.md` v2, with the landing page, the anti-cliché design system, and the bilingual translation table.
- `origin/main` on GitHub has one "Initial commit" containing a README. Local `main` has no commits yet.

## Phases
See `planning/ROADMAP.md`. Phases 0–4 form the R0 pilot. Specs are in `planning/specs/` and are published as GitHub issues.

## Release map

| Release | Sprint | Scope | Status |
|---|---|---|---|
| R0 | 001 | Sign-in + PIN, tap onboarding, notebook import, sales/expenses/customer deni/payments, today's Muhtasari, offline + backup | **Planned** |
| R1 | 002 | Purchases (Manunuzi), supplier deni (Deni la Wasambazaji), supplier payments | Not planned |
| R2 | 003 | Stock depth (adjustments, low-stock), repair jobs (Kazi) | Not planned |
| R3 | 004 | Ripoti: periods, deni ageing, PDF, read-back, export/delete | Not planned |
| R4 | 005 | Model test results → local AI parsing, Review Card, AI onboarding (if a key exists) | Not planned |
| R5 | 006 | English voice | Not planned |
| R6 | 007 | Mtandao network view, sync hardening (server recompute) | Not planned |

Cut order if time runs short: Mtandao → voice → embeddings memory.

## Owner actions before Monday
See `planning/QUESTIONS.md`, Q-001 to Q-003.
