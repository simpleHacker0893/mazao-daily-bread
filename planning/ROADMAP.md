# ROADMAP: Mazao phases

Each **phase** is one sprint and one spec. The spec is `planning/sprints/phase-NN-<slug>/spec.md` and is published as a GitHub issue labelled `ready-for-agent`, with milestone = the phase. Phases 0–4 together are the **R0 pilot** (Gikomba, Mon 2026-10-26). They regroup the steps of the existing execution blueprint `planning/sprints/001-r0-pilot/blueprint.md`, which stays the step-by-step plan for the pilot.

| Phase | Title | Release | Blueprint steps (R0) | Depends on | Spec | Issue |
|---|---|---|---|---|---|---|
| 0 | Design system, imagery & landing page | R0 | A1a, A1b, A2, D0, A6.6 | — | `sprints/phase-00-design-system-and-landing/spec.md` | #1 |
| 1 | Authentication & data foundation | R0 | A3, A4, B1, B2, A5 | 0 | `sprints/phase-01-auth-and-data-foundation/spec.md` | #2 |
| 2 | Onboarding & bring-in-your-notebook | R0 | B4.2–B4.3, B4.5 | 1, 3 (UI primitives) | `sprints/phase-02-onboarding-and-notebook/spec.md` | #3 |
| 3 | Recording daily transactions | R0 | B3 | 1 | `sprints/phase-03-daily-transactions/spec.md` | #4 |
| 4 | Muhtasari dashboard, Today report & pilot readiness | R0 | B4.1, B4.4, A6 | 2, 3 | `sprints/phase-04-dashboard-and-daily-report/spec.md` | #5 |
| 5 | Purchases & supplier deni | R1 | sprint 005 (to plan) | 4 | `sprints/phase-05-purchases-and-supplier-deni/spec.md` | #6 |
| 6 | Stock depth & Kazi repair jobs | R2 | sprint 006 | 5 | `sprints/phase-06-stock-and-repair-jobs/spec.md` | #7 |
| 7 | Ripoti reports & data rights | R3 | sprint 007 | 4 (6 for job revenue) | `sprints/phase-07-reports-and-data-rights/spec.md` | #8 |
| 8 | AI assist (local parsing, Review Card, AI onboarding) | R4 | sprint 008 | 3, model test | `sprints/phase-08-ai-assist/spec.md` | #9 |
| 9 | English voice | R5 | sprint 009 | 8 | `sprints/phase-09-english-voice/spec.md` | #10 |
| 10 | Mtandao & sync hardening | R6 | sprint 010 | 5, 7 | `sprints/phase-10-mtandao-and-sync-hardening/spec.md` | #11 |
| 11 | Growth backlog (roles, Kiswahili UI, loans, phone OTP) | post-MVP | needs discovery | pilot debrief | `sprints/phase-11-growth-backlog/spec.md` | #12 |

## Sprint numbering
- Sprint `001-r0-pilot` delivers phases 0–4 in two parallel lanes. It's already planned.
- **Every phase has a folder** `planning/sprints/phase-NN-<slug>/` with its `spec.md`, which is the source of the GitHub spec issue.
- Phases 0–4 run from the shared R0 execution plan in `planning/sprints/001-r0-pilot/`.
- From phase 5 on, the `architect` agent adds `requirements.md`, `blueprint.md`, `acceptance.md` and `handoff-prompt.md` to that phase's folder, next to `spec.md`. It does this after the previous phase's acceptance, because each later spec has decisions it must record first (see each spec's Further Notes).

## Cross-phase rules (owner, 2026-10-24)
- **Imagery (D-045):**
  - The landing, auth and onboarding screens use market photography backgrounds under a solid scrim.
  - Work screens stay clean for sunlight legibility and use imagery only in headers and empty states.
- **Design taste:**
  - Dashboards and reports are built in impeccable **Operate** mode; the landing page in **Persuade** mode with the taste-skill pre-flight.
  - Bilingual titles everywhere (D-040).
- **Automated design prompts (D-046):** each phase with UI starts by generating its screens in Stitch from `docs/design/stitch-prompts.md` (Phase 0 automates the loop) and exporting reference screenshots to `docs/design/<release>/`.
- **Today report (D-047):** part of Phase 4 in R0. Period reports come in Phase 7.
