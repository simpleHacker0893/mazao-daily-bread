# Phase 8: AI assist (model test, model manager, local parsing, memory, Review Card, AI onboarding)
> Release: R4 · Milestone: R4 Andika Haraka (sprint 005) · Depends on: phases 1-4 (R0, including the model-test material collected at Gikomba on 2026-10-26), phase 5 (Purchases Agent), phase 6 (Jobs Agent) · Label: ready-for-agent

## Problem Statement
Manual forms are the main path (D-028), and after R3 they cover every record type. But a merchant serving a queue still has to tap through item pickers, quantities and payment chips. Merchants already think in short phrases like "sold sukuma 3 kilo 150 bob deni ya Wanjiku kesho", mixing English, Kiswahili and Sheng (spec §5).

The risk is the opposite failure: AI that guesses a wrong number and saves it is worse than no AI at all (spec §1, §2 anti-goals). On top of that:
- We don't yet know which small model can parse Gikomba phrases well enough on a 4 GB phone (D-030, R-008).
- Models are hundreds of MB and merchants pay for data (D-031).
- Onboarding is still tap-to-answer, while the owner wants a real interview once a cloud key exists (D-033).

## Solution
Six parts, delivered in this order so that a failed model test still leaves value:

1. **Model test harness (D-030, spec §8.5).** A hidden developer screen and script run the ~100 Gikomba phrases (and the noisy recordings) against each shortlisted model on 2 to 3 pilot-class phones, recording per-field parse accuracy, word error rate, time to Review Card, peak memory and download size. Results decide what ships, against the spec §8.5 pass bars.
2. **Model manager (D-031).** "Andaa Andika Haraka / Set up quick entry" (stitch-prompts §7.3): the phone check, a consent screen listing each download with its size, Wi-Fi only by default, resumable cached downloads, pause and delete.
3. **Local parsing with wllama (D-029)** in a Web Worker, on phones with ≥ 4 GB and a passing trial load. A sub-agent router (Sales, Purchases, Expenses, Jobs) turns text into a Zod-valid draft. Invalid output becomes a "please fill in" Review Card, never a silent failure.
4. **Embeddings memory** (multilingual-e5-small, transformers.js, local only). It resolves names in text to the merchant's real items, customers and suppliers, and learns from corrections made on the Review Card.
5. **Thibitisha / Review Card** (stitch-prompts §7.2, PRD §9.4): every field editable, Grill warnings and clarifying questions, and the exact button `[ ✅ Confirm & Save Record ]`, which calls the same commit path as manual entry (D-026, D-028).
6. **Cloud AI through Vercel AI Gateway (D-033)**, only when a team key exists, opt-in, text only:
   - opt-in cloud parsing for phones without the local model;
   - the Grill Agent onboarding interview (spec §8.4) with consent and the tap-to-answer fallback.

"Andika Haraka / Quick entry" (stitch-prompts §7.1) is the entry point. The mic stays disabled with "Voice coming soon" until phase 9.

## User Stories
1. As a mama mboga, I want to type "sold sukuma 3 kilo 150 bob deni ya Wanjiku kesho" and get a filled-in sale to check, so that recording takes one line instead of six taps.
2. As a kiosk owner, I want to type "mayai tray 1 cash 420", so that quick cash sales are as fast as speaking.
3. As a kiosk owner, I want to type "bought viazi 2 gunia 5600 paid 3000 Kariuki", so that purchases and supplier deni are drafted too.
4. As a boda rider, I want to type "fuel 300 mpesa", so that expenses are drafted with the right category.
5. As a mama mboga, I want to type "Otieno paid 500", so that a customer payment is drafted against the right Otieno.
6. As a repair fundi, I want to type "Tecno screen for Otieno, ready Friday, deposit 500", so that a job card with its deposit is drafted.
7. As a mama mboga, I want every draft to show what I typed next to what the app understood, so that I can spot a mistake before saving.
8. As a kiosk owner, I want to fix any field inline on the Review Card, so that I never have to start over.
9. As a mama mboga, I want the app to ask "Is 150 the total or the price per kilo?" when it isn't sure, so that it doesn't guess my money.
10. As a kiosk owner, I want the same warnings as the manual form (below cost, price far from usual, Wanjiku already owes KES 450), so that AI entries are checked as strictly as manual ones.
11. As a mama mboga, I want nothing saved until I press `[ ✅ Confirm & Save Record ]`, so that I stay in control of my books.
12. As a kiosk owner, I want the confirm button disabled with "Choose a customer to save this deni" when a hard rule fails, so that the AI can't create deni without a customer (D-038).
13. As a mama mboga, I want the app to learn that "sukuma" means my item "Sukuma wiki" and "Mama Shiro" is my customer, after I correct it once, so that the next draft is right.
14. As a kiosk owner, I want to see the download size and agree before any model downloads, and have it wait for Wi-Fi, so that my bundles aren't eaten (D-031).
15. As a kiosk owner, I want to pause a download, resume after Wi-Fi drops, and delete models to free space, so that I stay in charge of my phone.
16. As a mama mboga with a 3 GB phone, I want a clear "this phone doesn't have enough memory for quick entry; the normal forms still work" message, so that I don't feel the app is broken.
17. As a mama mboga with a 3 GB phone, I want to choose cloud quick entry if the team has turned it on, knowing only my typed text and item and customer names leave the phone, so that I still get help.
18. As a new merchant, I want an onboarding conversation that asks follow-up questions and explains why, so that my business profile fits how I really trade.
19. As a new merchant offline or who declines, I want the tap-to-answer onboarding instead, with the same result, so that I'm never blocked.
20. As a new merchant, I want to review the business profile the interview produced before it is saved, so that the AI can't set my rules without my agreement.
21. As a Chama treasurer, I want AI-made records to be marked as AI-drafted and merchant-confirmed, so that I know every number was checked by a person.
22. As a developer, I want the parser behind one interface with a fake implementation, so that the Review Card and commit flow are tested in CI without a 400 MB model.
23. As a developer, I want the golden phrase set to become a permanent regression suite (PRD §16.9), so that a model or prompt change can't silently lower accuracy.
24. As a developer, I want AI drafts and embeddings stored locally and never synced (D-021), so that the server never holds AI material.
25. As a developer, I want cloud AI routes to check membership and log no record contents (spec §8.6), so that privacy rules hold.
26. As a product owner, I want the model test results written up with a pass or fail per model before any parsing UI ships, so that the decision is evidence-based.
27. As a product owner, I want the whole AI layer switchable off with the app still fully useful, so that the manual-first principle holds (spec §8.1).

## Implementation Decisions

### Model test (runs first; its outcome gates the rest)
- The golden set comes from the R0 pilot collection (the model-test collection doc): ~100 phrases across sale, purchase, expense, payment, deni and job, each labelled with the expected draft; plus the noisy English recordings for phase 9.
- A harness runs each candidate (Qwen2.5-0.5B vs Qwen3-0.6B Q4 GGUF; whisper-base.en vs moonshine-base; multilingual-e5-small) on real phones and writes a results table.
- Pass bars (spec §8.5): ≥ 80% of typed phrases need no field corrections; English WER ≤ 20%; ≤ 5 s text to Review Card on a 4 GB phone.
- The outcome becomes a recorded decision (P8-A). If no LLM passes, local parsing ships off and only opt-in cloud parsing remains (if a key exists). If nothing passes and there is no key, this phase ships the model manager, memory and Review Card behind a flag, and Andika Haraka stays hidden.

### Modules and interfaces
- **Device capability:** `deviceAiSupport()` returns `{ llm: boolean, stt: boolean, embeddings: boolean, reason? }`, from `navigator.deviceMemory` ≥ 4 for the LLM (D-031) plus a trial load recorded per model.
- **Model manager:** a catalogue of models with ID, purpose, size in MB and version; `requestDownload(ids, { allowMobileData })` needs prior recorded consent; downloads are chunked, resumable and stored in browser storage, paused when not on Wi-Fi unless mobile data is allowed. Consent and state are kept in device storage, not synced. Model files are **not** precached by the service worker; `/api/*` stays network-only.
- **Parser** (one seam, three implementations: local wllama worker, cloud gateway, fake for tests):

```ts
type ParseResult =
  | { ok: true; kind: 'sale' | 'purchase' | 'expense' | 'customer_payment' | 'supplier_payment' | 'job';
      draft: unknown /* Zod-validated Draft* from the domain schemas */;
      fields: Record<string, { confidence: 'high' | 'medium' | 'low' }>;
      questions: { field: string; prompt: string; choices: string[] }[] }
  | { ok: false; partial: Record<string, unknown>; reason: 'unclear' | 'invalid_output' | 'timeout' };
```
- **Router:** a cheap first pass (keyword cues such as sold/bought/paid/fuel, plus nearest labelled examples by embedding) picks the sub-agent; the LLM is used to route only when the first pass is unsure. The sub-agents are Sales (sales, customer deni, customer payments), Purchases (purchases, supplier deni, supplier payments), Expenses, and Jobs (spec §8.2). Each has its own prompt and a grammar-constrained JSON output; prompt wording is the builder's choice (spec §15).
- **Entity resolution:** names in the draft are matched to local items, customers and suppliers by exact match, then alias memory, then embedding similarity above a threshold. Below the threshold the field is shown as "new customer?" or "pick item", never silently created.
- **Memory:** a local-only Dexie table of `{ kind, entityId, text, vector, source: 'name' | 'correction' }`. It is rebuilt from master data when the embedding model changes and appended when the merchant corrects a resolved field on the Review Card. Never synced (D-021).
- **Confidence words:** high, medium or low, from parser agreement plus the resolution score. No percentages (stitch-prompts §7.2).
- **Review Card:** renders any `ParseResult`, runs `runGrill` live on the edited draft, shows warnings in the Maize block and hard errors in Tomato. Block-level issues get the R0 "Save anyway" second tap (D-027). `[ ✅ Confirm & Save Record ]` (exact label, D-028) calls the existing commit function for that kind with `source` set to the AI source. Cancel discards the draft.
- **Drafts:** a local-only table with a 24-hour expiry (ASSUMPTION), so an interrupted draft can be resumed; never synced (D-021).

### Cloud AI (only when a key exists, D-033)
- `GET /api/ai/status` returns `{ cloudEnabled: boolean }` from server configuration; when false, every cloud entry point is hidden.
- `POST /api/ai/parse`: `requireMember()`; body `{ text, hints: { items: string[], customers: string[], suppliers: string[] } }` capped in size; returns a `ParseResult`. It forwards only that minimum context (spec §8.6). Text only; audio is rejected. It stores no prompts or responses and logs no contents.
- `POST /api/ai/onboarding`: streamed interview turns following the PRD §8 rubric (10 topics), ending in an operating-profile proposal that must pass the operating-profile Zod schema and goes to the existing review screen. Consent screen first; on decline, offline or error it falls back to the tap-to-answer flow with answers so far kept (spec §8.4).
- Provider and model are chosen when the key arrives (Q-004). Merchant opt-in for cloud parsing is a Mipangilio switch, off by default (spec §8.6).

### Schema changes vs R0
- `transactions.source` CHECK adds `ai_local` and `ai_cloud` (R0 has `manual` and `onboarding`). Proposed decision P8-B; it lets reports and pilot measures count AI-confirmed records without syncing drafts.
- The operating profile gains `ai: { quickEntry: boolean, cloudParsing: boolean, rememberEntities: boolean, askClarifying: boolean }` (PRD §8.13), all off by default except `askClarifying`.
- Local only (not synced): model consent, model state, drafts, memory.

### Screens and routes
- Static routes, precached: `/andika` (Andika Haraka), `/andika/thibitisha` (Review Card, draft ID in the query), `/mipangilio/ai` (Andaa Andika Haraka and model manager).
- Entry point: a Quick entry action on Muhtasari and the new-record forms, shown only when quick entry is enabled and a parser is available.
- Design: stitch-prompts §7. "Runs on this phone" chip; a Review Card skeleton while parsing; footer "Nothing is saved until you check and confirm." No purple or blue AI glow, sparkles or chat bubbles; the Review Card looks like a form, not a chat.

## Testing Decisions
- Good tests check what the merchant sees and what gets saved, never prompt text or model internals.
- **Primary seam: the parser interface plus the local commit API.** With the fake parser: text → Review Card state → confirm → the same records as manual entry; cancel → nothing saved; a hard error → confirm disabled.
- **Domain tests:** the confirm path uses the same `runGrill` as manual entry, proven by a table test running every R0 Grill case through both entry paths.
- **Golden suite:** the labelled phrase set runs against the real local model in a device harness (not CI), and is scored per field against the spec §8.5 bar. CI runs it with recorded model outputs to test routing, resolution and Zod handling.
- **Route tests:** `/api/ai/*` returns 401 without a session, 404 or disabled when no key exists, rejects oversize input, and logs contain no request text.
- **Playwright on the built app:** with the fake parser enabled by a test flag: Andika Haraka → Review Card → edit a field → `[ ✅ Confirm & Save Record ]` → the record appears in Mauzo offline. The button label is asserted exactly.
- Manual device checks: download consent, Wi-Fi-only pause, the 3 GB unsupported message, time to Review Card on a 4 GB phone.

## Out of Scope
- Voice input and transcription UI (phase 9); this phase only measures speech models.
- Kiswahili-first parsing quality targets beyond the mixed phrases in the golden set (phase 11).
- AI that edits or voids existing records, AI insights or forecasting (PRD §5.2), chat assistants.
- Syncing drafts, memory or model state (D-021).
- Server-side storage of prompts or responses (spec §8.6).

## Further Notes
- **Decisions the architect must record before building:**
  - **P8-A:** model test outcome, meaning which models ship, with the measured numbers.
  - **P8-B:** `source` values `ai_local` and `ai_cloud` on transactions.
  - **P8-C:** confidence thresholds for entity resolution and when a field is shown as "low".
  - **P8-D:** draft expiry, and where model files are stored (Cache Storage or the origin private file system).
  - **P8-E:** whether phones under 4 GB may run the embeddings memory alone, to improve manual pickers.
- **Open questions:** **Q-004** (cloud provider, model and key date) blocks the cloud parts and AI onboarding only; Q-006 for "Andika Haraka", "Andaa Andika Haraka" and "Thibitisha"; Q-001 for cloud consent wording.
- **Risks:** R-008 (local LLM too heavy) is the main one, mitigated by test-first; R-009 (AI Gateway spend on a free product, D-003); R-002 (storage pressure from 400+ MB of models can make Chrome evict data, so persistent storage must be granted before any download). Model sizes quoted on screens (about 400 MB and 120 MB, stitch-prompts §7.3) are ASSUMPTIONS until the model test measures them.
