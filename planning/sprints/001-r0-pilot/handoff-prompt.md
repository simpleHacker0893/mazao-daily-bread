# Sprint 001: Handoff prompts (rev 2)

Each developer opens Claude Code in the repo root (on an up-to-date `main`), runs `/mcp` once to sign in to Neon and Clerk, and pastes **their** prompt. The lanes meet at the merge order in `blueprint.md` A6.

---

## Dev A prompt (skeleton, shell, auth, PIN, sync, deploy)

```
Mazao Sprint 001 (R0 pilot, Monday 2026-10-26). You orchestrate Lane A.

Read, in order: AGENTS.md, CLAUDE.md, planning/STATE.md, planning/DECISIONS.md (D-037 to D-044 supersede earlier ones),
planning/DOMAIN.md, planning/sprints/001-r0-pilot/requirements.md, blueprint.md, acceptance.md, docs/WORKFLOW.md.

Use the scrum-architect agent to split Lane A (steps A1a, A1b, A2, A3, A4, A5, A6) into tasks.
Then dispatch each step to the agent named in the blueprint's Agent column (frontend / backend / devops / qa),
in dependency order. A1a goes first and must merge fast, because Lane B is waiting on it.

For every step:
- branch feat/<step-id>-<slug>; tests first where listed; stay inside Lane A file ownership;
- the stack is fixed: pnpm, latest Next.js App Router, no src/, React Compiler on, Biome (no ESLint),
  `next build --webpack`, Prisma (latest) + @prisma/adapter-neon, Clerk, Serwist;
- run the step's Verify commands and paste the output into the PR "<step-id>: <summary>" with its AC IDs;
- reviewer agent, then qa agent, then product-owner agent, then merge.

If the blueprint is silent on something the merchant sees, stop and ask. Report after each step:
done / evidence / blockers. Start with A1a.
```

---

## Dev B prompt (domain, local data, screens, onboarding)

```
Mazao Sprint 001 (R0 pilot, Monday 2026-10-26). You orchestrate Lane B.

Read, in order: AGENTS.md, CLAUDE.md, planning/STATE.md, planning/DECISIONS.md (D-037 to D-044 supersede earlier ones),
planning/DOMAIN.md, planning/sprints/001-r0-pilot/requirements.md, blueprint.md, acceptance.md,
docs/design/stitch-prompts.md (design system, bilingual translation table).

Use the scrum-architect agent to split Lane B (steps B1, B2, B3, B4) into tasks, starting as soon as A1a is on main.
- B1 and B2 → backend agent, strongest model, strict test-first. The DOMAIN.md worked example
  (350 / 90 / 50 / 210) and the deni scenario (200 → 50 → 200) are the first tests. Money is integer cents everywhere.
- B3 and B4 → frontend agent (designer and Next.js expert). Follow docs/design/r0/ screenshots if present,
  otherwise the stitch-prompts tokens. Titles are bilingual (Kiswahili + English, D-040). Run impeccable
  critique/polish before each PR. Pages use only local/queries.ts and local/commit.ts.

For every step: branch feat/<step-id>-<slug>; stay inside Lane B file ownership; run the Verify commands;
PR "<step-id>: <summary>" with AC IDs and pasted output; reviewer agent, then qa agent, then product-owner agent, then merge.

If the blueprint is silent on something the merchant sees, stop and ask. Report after each step:
done / evidence / blockers.
```
