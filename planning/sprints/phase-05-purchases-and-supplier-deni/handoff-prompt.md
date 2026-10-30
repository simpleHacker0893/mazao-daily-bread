# Phase 5 Handoff Prompt

**For:** `scrum-architect` agent (sprint orchestration)  
**When:** After Phase 4 acceptance, before Phase 5 starts  
**Input:** This prompt + `requirements.md`, `blueprint.md`, `acceptance.md`, `spec.md` in this folder

---

## Your Task

Break Phase 5 into the six steps defined in `blueprint.md`, create GitHub issues for each, assign to the correct specialist agent, and track progress. Call cuts at the checkpoint if behind.

---

## Phase 5 Steps (from blueprint.md)

| Step | Agent | Branch | Depends on | Description |
|------|-------|--------|------------|-------------|
| **5.1** | `backend` (strongest) | `feat/b5-domain-purchases` | — | Domain types, schemas, ledger, summary, grill, operating-profile + tests |
| **5.2** | `backend` (strongest) | `feat/b5-commit-purchases` | 5.1 | `commitPurchase`, `commitSupplierPayment`, updated `commitVoid`, queries + tests |
| **5.3** | `frontend` | `feat/b5-purchase-screens` | 5.1, 5.2 (commit) | `/manunuzi`, `/manunuzi/new` screens + Playwright |
| **5.4** | `frontend` | `feat/b5-supplier-debt-screens` | 5.1, 5.2 (queries) | `/debts/supplier`, `/debts/supplier/ledger?id=` + Playwright |
| **5.5** | `frontend` | `feat/b5-muhtasari-today-updates` | 5.3, 5.4 | Muhtasari supplier deni, money out, quick action; Today report updates |
| **5.6** | `backend` | `feat/b5-sync-prisma` | 5.1 | Prisma CHECK constraint, wire schemas, sync route tests |

---

## Decisions to Confirm with Owner (Before 5.1)

| ID | Decision | Status |
|----|----------|--------|
| **P5-A** | Confirmed purchase updates item's `buyingPrice` to purchase unit price (refines D-015) | ⏳ Pending |
| **P5-B** | `DENI_NEEDS_SUPPLIER` hard error; fully paid purchases may have no supplier | ⏳ Pending |
| **P5-C** | "Deni (I owe)" = UI shortcut only; `paymentMethod` = null when nothing paid | ⏳ Pending |
| **P5-D** | Supplier list at `/debts/supplier` + Zaidi entry + `/debts` switch (Customers/Suppliers) | ⏳ Pending |

**Action:** Present these to the owner (via `product-owner` agent or directly). Record confirmed decisions in `planning/DECISIONS.md` with IDs P5-A through P5-D. Do not start 5.1 until all four are confirmed.

---

## GitHub Issues to Create

Create 6 issues in `simpleHacker0893/mazao-daily-bread` with:

- **Labels:** `ready-for-agent`, `phase-5`
- **Milestone:** `R1 Manunuzi`
- **Assignee:** (leave blank; scrum-architect assigns when step starts)

### Issue 1: "5.1: Domain core — purchases & supplier debt"
```
**Agent:** backend (strongest model)
**Branch:** feat/b5-domain-purchases
**Depends on:** Phase 4 complete
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#51-domain-core-dev-b-strongest-model-test-first
**ACs:** AC-01.1 through AC-01.13 in acceptance.md
**Verify:** pnpm test domain --coverage (≥90%), pnpm lint && pnpm typecheck && pnpm build
```

### Issue 2: "5.2: Local commit + queries — purchases & supplier debt"
```
**Agent:** backend (strongest model)
**Branch:** feat/b5-commit-purchases
**Depends on:** 5.1 merged
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#52-local-commit--queries-dev-b-strongest-model
**ACs:** AC-02.1 through AC-02.11
**Verify:** pnpm test local/commit.test.ts, pnpm test local/queries.test.ts, pnpm lint && pnpm typecheck && pnpm build
```

### Issue 3: "5.3: Purchase screens — /manunuzi, /manunuzi/new"
```
**Agent:** frontend
**Branch:** feat/b5-purchase-screens
**Depends on:** 5.1, 5.2 (commit) merged
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#53-purchase-screens-dev-a-frontend-agent
**ACs:** AC-03.1 through AC-03.10
**Verify:** pnpm build && pnpm exec playwright test e2e/manunuzi.spec.ts
```

### Issue 4: "5.4: Supplier debt screens — /debts/supplier, /debts/supplier/ledger"
```
**Agent:** frontend
**Branch:** feat/b5-supplier-debt-screens
**Depends on:** 5.1, 5.2 (queries) merged
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#54-supplier-debt-screens-dev-a-frontend-agent
**ACs:** AC-04.1 through AC-04.9
**Verify:** pnpm build && pnpm exec playwright test e2e/supplier-debt.spec.ts
```

### Issue 5: "5.5: Muhtasari & Today report updates"
```
**Agent:** frontend
**Branch:** feat/b5-muhtasari-today-updates
**Depends on:** 5.3, 5.4 merged
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#55-muhtasari--today-report-updates-dev-a-frontend-agent
**ACs:** AC-05.1 through AC-05.8
**Verify:** pnpm build && pnpm exec playwright test e2e/muhtasari-today.spec.ts
```

### Issue 6: "5.6: Sync + Prisma contract — purchases & supplier debt"
```
**Agent:** backend
**Branch:** feat/b5-sync-prisma
**Depends on:** 5.1 merged
**Spec:** planning/sprints/phase-05-purchases-and-supplier-deni/blueprint.md#56-sync--prisma-contract-dev-a-backend-agent
**ACs:** AC-06.1 through AC-06.7
**Verify:** pnpm db:generate, pnpm test sync/wire.test.ts, pnpm test sync/routes.test.ts, pnpm lint && pnpm typecheck && pnpm build
```

---

## Checkpoint

**When:** After 5.2 merges (both lanes have working commit & queries)  
**Who:** You (`scrum-architect`)  
**Action:** 
- Review progress on all 6 steps
- If behind, apply cuts in order (blueprint.md "Cuts" section):
  0. Supplier ledger "Pay supplier" sheet → inline on ledger row
  1. `BUYING_PRICE_CHANGED` → warn only
  2. "Due this week" on Muhtasari → supplier list only
  3. `SUPPLIER_OVERPAID` warn → drop
- Reassign/re-sequence remaining steps
- Update GitHub issue statuses

---

## Review & Acceptance Flow

For **each PR**:
1. `reviewer` agent runs adversarial review (correctness, security/tenancy, offline, money bugs, blueprint conformance)
2. `qa` agent runs the step's Verify commands + Playwright specs
3. `product-owner` agent accepts against `acceptance.md` ACs with evidence

**Sprint close:** When all 6 steps merged and Global ACs (AC-GLOBAL-1 through AC-GLOBAL-6) pass, you (`scrum-architect`) compile the evidence package and the `product-owner` accepts the sprint.

---

## Key Files to Watch (R-011 Shared Contracts)

These are frozen after 5.1 merges — any change needs both Dev A and Dev B agreement in a PR:

- `domain/types.ts` — TxnType union, DraftPurchase, DraftSupplierPayment
- `domain/schemas.ts` — Zod schemas for new drafts
- `local/device-db.ts` — **No changes expected in Phase 5** (no new tables)
- `i18n/en.ts`, `i18n/sw.ts` — merged halves; Kiswahili keys typed against English

---

## Skills to Use

| Task | Skill |
|------|-------|
| Domain maths, commit service, sync, API routes, Prisma | `ecc:prisma-patterns`, `ecc:postgres-patterns`, `ecc:database-migrations`, `neon-postgres`, `neon-postgres-branches` |
| Writing test-first domain code | `superpowers:test-driven-development` |
| Frontend screens (Next.js App Router, React Compiler, Tailwind) | `vercel:nextjs`, `vercel:react-best-practices`, `frontend-design`, `impeccable` |
| Playwright e2e against build | `ecc:e2e-testing` |
| PR review | `mattpocock-skills:code-review`, `ecc:code-review` |
| Verification before completion | `superpowers:verification-before-completion` |

---

## Risks to Monitor

| Risk | Mitigation |
|------|------------|
| **R-003 (wrong numbers):** purchases leak into Faida Halisi | Extended worked example test guards it; `rangeSummary` keeps Sales/COGS/Expenses/Faida formulas unchanged |
| **R-011 (shared files):** Dev A and Dev B both touch `domain/types.ts` in 5.1 | 5.1 is Dev B only; Dev A waits for 5.1 merge before 5.3/5.4 |
| **Stitch screens not ready** | Visual reference = `docs/design/r0/` or tokens in `stitch-prompts.md`; builders don't block on D0 |
| **PIN unlock timing on 3 GB phone** | Already measured in Phase 4; no new crypto in Phase 5 |

---

## Next Phase Dependency

Phase 6 (Stock depth & Kazi) depends on:
- Phase 5 `commitPurchase` raising stock (for low-stock view)
- Phase 5 `supplierOwed` / `openSupplierDeni` (for supplier payments in jobs later)
- Phase 5 Prisma CHECK constraint (Phase 6 adds more types to same constraint)

Ensure 5.1 and 5.6 are solid before Phase 6 `backend` starts its domain step.

---

## Quick Reference: Commands

```bash
# Dev
pnpm dev

# Verify step
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Domain tests with coverage
pnpm test domain --coverage

# Local commit/query tests
pnpm test local/commit.test.ts
pnpm test local/queries.test.ts

# Playwright against build (never dev!)
pnpm build && pnpm exec playwright test e2e/<spec>.spec.ts

# Prisma contract emit
pnpm db:generate

# Sync route tests (Neon dev branch)
pnpm test sync/routes.test.ts

# Full e2e suite
pnpm e2e
```

---

## Communication

- Post decision confirmations in `planning/DECISIONS.md`
- Post step completion (with verification output) in the GitHub issue
- Escalate product questions to `product-owner` agent instead of deciding
- Tag `@simpleHacker0893` in PR descriptions for owner visibility

---

**Ready to start.** Confirm P5-A through P5-D with owner, then create the 6 GitHub issues and assign 5.1 to `backend` agent.