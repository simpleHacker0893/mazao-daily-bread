# How we build Mazao

We use a 120x-style Architect/Builder loop: **the handoff is a folder, not a conversation.** Planning lives in `planning/`, code lives at the repo root (`app/`, `domain/`, `local/`, `sync/`, `server/`, `ui/`; no `src/`), and the two meet through `acceptance.md`.

## From roadmap to code

```
planning/ROADMAP.md (phases 0-11)
  └─ planning/specs/phase-NN-*.md   (to-spec format: problem, solution, user stories, decisions, tests, scope)
       └─ GitHub issue "Spec: Phase NN - <title>"  (label ready-for-agent, milestone "Phase NN")
            └─ planning/sprints/NNN-<slug>/  (architect: requirements, blueprint, acceptance, handoff)
                 └─ one GitHub issue per blueprint step (scrum-architect), linked to the spec issue
                      └─ one branch + PR per step (frontend / backend / devops / qa) -> reviewer -> qa -> product-owner
```

- **Spec issues** are the "what and why". Sprint folders are the "how". Step issues are the "who and when".
- **Changing a spec:**
  1. Edit the Markdown file in a PR.
  2. Update the issue body with `gh issue edit <n> --body-file planning/specs/phase-NN-*.md`.
  3. Record any new decision as a D-xxx.
- **Publishing specs** (devops or scrum-architect), once per new phase:
  ```
  gh issue create --title "Spec: Phase NN - <title>" --body-file planning/specs/phase-NN-<slug>.md     --label ready-for-agent --label spec --label phase-NN --milestone "Phase NN - <title>"
  ```

## Automated design generation (Stitch MCP, D-046)
For each phase with UI, before building:
1. The `frontend` agent runs `stitch-utilities:stitch-loop` / `stitch-design:generate-design` over that phase's prompts in `docs/design/stitch-prompts.md`, in this order:
   1. apply the **Design system** prompt to the Stitch project "Mazao";
   2. for each screen prompt of the phase, generate MOBILE (and DESKTOP for the landing page).
2. It applies the imagery rules (D-045): photographic backgrounds with a scrim on landing, auth and onboarding; clean work screens.
3. It runs `impeccable critique` on each result, regenerates at most once, and exports screenshots to `docs/design/<release>/<screen>.png`.
4. The product owner approves the screenshots in the phase PR. Builders treat them as the visual reference; the blueprint wins on behaviour.

## The loop (per sprint)

```
1. PLAN      architect agent → planning/sprints/NNN-<slug>/{requirements,blueprint,acceptance,handoff-prompt}.md (+ reviewer adversarial pass)
2. DESIGN    Stitch prompts → Stitch screens → docs/design/<release>/ screenshots
3. SPLIT     scrum-architect → one task/issue per step, assigned to frontend / backend / devops / qa
4. BUILD     specialist agent per step: branch → tests first → code → Verify → PR
5. CHECK     CI (lint, typecheck, test, build) + Vercel preview per PR
6. REVIEW    reviewer agent (adversarial) → qa agent runs Verify/e2e → product-owner accepts against acceptance.md
7. MERGE     squash-merge to main → Vercel production deploy (devops)
8. CLOSE     qa runs the full acceptance.md with evidence → product-owner accepts → architect updates STATE/DECISIONS and plans NNN+1
```

### 1. Plan
- Ask: "Use the architect agent to plan sprint NNN for <release>."
- It reads `STATE`, `DECISIONS`, `DOMAIN`, `RISKS` and `QUESTIONS`, plus the last sprint's review. It proposes the four sprint files and writes them only after the owner approves.
- Unknown business facts go to `planning/QUESTIONS.md`, never into the blueprint as guesses.

### 2. Design with Stitch
1. In Stitch (MCP), create or open the project **Mazao** and apply the **Design system** prompt from `docs/design/stitch-prompts.md`.
2. Generate each screen tagged with the sprint's release, pasting the core token block where a prompt says so. Device: MOBILE.
3. Review on a phone-sized viewport and iterate with `stitch-design:generate-design` (edit and variants).
4. Export screenshots to `docs/design/<release>/` and commit them. They are the visual reference for the developers.
5. Optional: `stitch-build:react-components` to start components, then move them into `ui/` as Tailwind and Next.js client components. **The blueprint wins over the generated code** on behaviour, strings and data.

### 3. Issues
- The `devops` agent (or a developer) creates one GitHub issue per blueprint step with `gh issue create`. Each issue has:
  - title `<step-id>: <title>`;
  - the step's brief as the body;
  - labels `sprint-NNN` and `lane-a`/`lane-b`;
  - milestone `R<n>`.
- This is outward-facing: confirm with the owner before creating issues for the first time.

### 4. Build (specialist agents: frontend, backend, devops, qa)
- One step = one branch `feat/<step-id>-<slug>` = one PR.
- Tests come first for anything in `domain`, `local`, `sync` and `auth`.
- Before opening the PR, run the step's **Verify** commands and paste the output into the PR body.
- If the blueprint is silent on something that changes what a merchant sees, **stop and ask** (product-owner). Don't decide.

### 5. Automated checks
- `.github/workflows/ci.yml` runs on every PR: `pnpm install --frozen-lockfile → lint → typecheck → test → build`.
- Vercel deploys a preview per PR. The PR description links to it.
- Playwright runs locally for each UI step, and in full at sprint close (A6-style integration step).

### 6. Review
- "Use the reviewer agent on PR #N", then "use the qa agent to verify PR #N", then "use the product-owner agent to accept PR #N against planning/sprints/NNN/acceptance.md".
- It reads the diff and runs the read-only checks (`git diff`, tests). Its verdict per AC is **met / not met / not evidenced**.
- It never fixes code. Gaps become PR review comments, or items in the next sprint.

### 7. Merge and deploy
- Squash-merge once CI is green and the product owner approves.
- Production deploys from `main`. The `devops` agent runs migrations (`pnpm db:migrate`) **before** merging any PR that needs them.

### 8. Close the sprint
- The product owner runs every `acceptance.md` check on the production URL with a real phone and records the evidence.
- It updates `planning/STATE.md` (in place), `DECISIONS.md` (new D-xxx), `RISKS.md` and `QUESTIONS.md`, then plans the next sprint.

## Automation helpers
- **Two developers in parallel:**
  - each runs their lane's prompt from `handoff-prompt.md` in their own clone;
  - alternatively, one machine uses `git worktree` per lane (`superpowers:using-git-worktrees`).
- **Status:** `gh pr list --label sprint-NNN` and `gh issue list --milestone R<n>`.
- **Scheduled checks (optional, post-R0):** `/loop` or `/schedule` to run the reviewer on open PRs each morning.

## Releases
R0 Mon 2026-10-26 → R1 supplier side → R2 stock and Kazi → R3 Ripoti → R4 AI → R5 voice → R6 Mtandao and sync hardening. See `planning/STATE.md`.
