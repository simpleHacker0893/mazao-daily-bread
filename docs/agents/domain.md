# Domain Docs

How the engineering skills should read Mazao's domain documentation. The repo is **single-context**, but it keeps its glossary and decisions in `planning/` (the 120x Operating Pack) instead of `GLOSSARY.md` and `docs/adr/`.

## Before exploring, read these
- **`planning/DOMAIN.md`:** the glossary. Terms (deni, Faida Halisi, Mauzo, Kazi, Mtandao…), transaction types, the worked example.
- **`planning/DECISIONS.md`:** the decision log. D-xxx entries act as ADRs; later superseding entries (D-037+) win over the ones they supersede.
- Also useful: `planning/ROADMAP.md` (phases), `planning/sprints/phase-NN-*/spec.md` (phase specs), and the current `planning/sprints/*/`.

Don't create `GLOSSARY.md` or `docs/adr/`. New terms go into `planning/DOMAIN.md`, and new decisions are appended to `planning/DECISIONS.md` as the next D-xxx (via the `architect` agent or `/domain-modeling`).

## File structure
```
/
├── planning/
│   ├── DOMAIN.md        ← glossary
│   ├── DECISIONS.md     ← decision log (ADR equivalent)
│   ├── ROADMAP.md
│   └── sprints/
├── app/  domain/  local/  sync/  server/  ui/   (no src/)
```

## Use the glossary's vocabulary
When your output names a domain concept (an issue title, a test name, a proposal), use the term as defined in `planning/DOMAIN.md`. If a concept you need isn't there, you're either inventing language the project doesn't use or you've found a real gap. Note real gaps for `/domain-modeling`.

## Flag decision conflicts
If your output contradicts a D-xxx, say so explicitly and propose a superseding decision rather than silently overriding it:

> _Contradicts D-019 (derived balances), but worth reopening because…_
