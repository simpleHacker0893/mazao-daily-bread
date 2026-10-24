# RISKS: Mazao

| ID | Risk | Likelihood / Impact | Mitigation | Owner |
|---|---|---|---|---|
| R-001 | R0 isn't ready for Mon 2026-10-26 (2 devs, ~1.5 days) | High / High | Two parallel lanes; Sun 18:00 checkpoint; R0 cut order in `sprints/001-r0-pilot/blueprint.md` §Cuts | Both devs |
| R-002 | A merchant loses records (offline phone, browser clears storage) | Medium / Critical | IndexedDB + `navigator.storage.persist()`; push backup on every reconnect; unsynced banner after 3 days; restore by pull | Dev A |
| R-003 | Wrong numbers break trust (Faida Halisi, deni) | Medium / Critical | Pure domain functions with unit tests on the DOMAIN.md worked example; immutable ledger + voids | Dev B |
| R-004 | Merchant forgets PIN while offline | Medium / Medium | Recovery needs internet (D-023); explain this at PIN creation; pilot staff carry a hotspot on Monday | PO |
| R-005 | Pilot merchants have no usable email | Medium / High | Google sign-in also works; check with each merchant before Monday (Q-002) | Owner |
| R-006 | Data stored in the EU without the needed DPA paperwork | Medium / High | Privacy notice in onboarding; ODPC check (Q-001) before real data | Owner |
| R-007 | Swahili speech-to-text too poor | High / Medium | Voice is English-only; Swahili deferred (D-032) | — |
| R-008 | Local LLM too heavy for pilot phones | High / Medium | Manual-first; ≥ 4 GB gate; model test before the AI build (R4) | — |
| R-009 | Free-tier limits (Neon compute hours, Clerk MAU, Vercel) | Low / Medium | 5 users is far below the limits; monitor in DevOps checklist | DevOps |
| R-010 | Service worker serves a stale build after deploy | Medium / Medium | Serwist `skipWaiting` + an "update available, tap to reload" toast | Dev A |
| R-011 | Two devs editing the same files at once | Medium / Medium | Lane file ownership in the blueprint; shared contracts (`domain/types.ts`) are frozen after step B1 | Both |
