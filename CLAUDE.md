@AGENTS.md

## Claude Code specifics

### Subagents (`.claude/agents/`)
`architect` (specs per sprint) → `scrum-architect` (splits and assigns) → `frontend` (designer + Next.js expert) / `backend` / `devops` → `reviewer` (every PR) → `qa` (evidence) → `product-owner` (accepts).

`developer` is a generalist for small tasks. The `impeccable-*` agents come with the impeccable skill.

### MCP servers (`.mcp.json`)
`Neon` and `clerk`, both remote with OAuth. Run `/mcp` once to sign in. The CLIs `neonctl` and `clerk` are installed globally (see `.claude/agents/devops.md`).

### Skills to use in this project

| When | Skill |
|---|---|
| Planning a sprint or reviewing a Builder report | `120x-architect` (via the `architect` agent; `product-owner` for Builder Review), `ecc:blueprint` |
| Writing any domain, commit or sync code | `superpowers:test-driven-development` |
| Executing a sprint's steps | `superpowers:executing-plans` or `superpowers:subagent-driven-development` |
| Before saying a step is done | `superpowers:verification-before-completion` |
| Next.js App Router (latest, no `src/`, React Compiler) | `vercel:nextjs`, `vercel:react-best-practices`, `vercel:next-upgrade` |
| Clerk sign-in, `proxy.ts`, `auth()`, instance config | `clerk-nextjs-patterns`, `clerk-setup`, `clerk-cli`, `clerk-testing` |
| Prisma, Postgres, Neon | `ecc:prisma-patterns`, `ecc:postgres-patterns`, `ecc:database-migrations`, `neon-postgres`, `neon-postgres-branches` |
| Playwright and offline tests | `ecc:e2e-testing` |
| Generating UI in Stitch | `stitch-design:generate-design`, `stitch-utilities:enhance-prompt` (prompts in `docs/design/stitch-prompts.md`) |
| Turning Stitch screens into components | `stitch-build:react-components` (adapt to Next.js + Tailwind; don't add Vite) |
| UI design, polish and critique | `frontend-design`, `impeccable`, `design-taste-frontend` (landing), `apple-design` (motion/feel), `ui-ux-pro-max` |
| Charts (R3 reports) | `dataviz` |
| Deploys and env | `vercel:deploy`, `vercel:env` |
| Reviewing a PR | `mattpocock-skills:code-review`, `ecc:code-review` |
| Glossary and decision records | `mattpocock-skills:domain-modeling` |

Don't reach for cloud AI SDKs or `@qvac/sdk` (D-029, D-033).

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on `simpleHacker0893/mazao-daily-bread` (use `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. The glossary is `planning/DOMAIN.md` and decisions are `planning/DECISIONS.md` (D-xxx). See `docs/agents/domain.md`.
