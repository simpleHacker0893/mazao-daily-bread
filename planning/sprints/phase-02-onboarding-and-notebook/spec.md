# Phase 2: Onboarding & bring-in-your-notebook
> Release: R0 (pilot) · Milestone: R0 pilot, Gikomba, Mon 2026-10-26 · Blueprint steps: B4 tasks 2, 3 and 4 (sprint 001) · Depends on: Phase 0 (design system, shell, bilingual PageTitle), Phase 1 (auth, PIN, domain core, local commit service, sync), Phase 3 UI primitives from B3 (Chip, ChipGroup, MoneyInput, QtyInput, Sheet, customer picker) · Label: ready-for-agent

## Problem Statement

A Gikomba merchant who has just signed in and set a PIN meets an empty app. Mazao does not yet know what she sells, in what units, at what prices, whether she gives deni, when her customers usually pay, or which expenses she pays every day. Without that, every first sale means typing item names and prices from scratch, the deni due-date chips have no sensible default, and the expense form shows categories she never uses. That makes Mazao slower than her notebook on day one, which is the exact question the pilot is testing (requirements.md, "Is Mazao faster than my notebook, and do the numbers match?").

Her paper notebook also already holds money that matters: customers who owe her from last week, suppliers she owes, and stock sitting at the stall. If Mazao starts at zero, her deni list is wrong from the first minute and her stock counts go negative on the first sale, so she will not trust the numbers. If we enter those amounts as ordinary sales or purchases, Faida Halisi is overstated, which the spec lists as an anti-goal.

The merchant may also be interrupted (a customer arrives, the phone dies, the network drops). Onboarding must survive interruption, work fully offline after the first load, and never block her from recording a sale if she chooses to skip it.

## Solution

A short, tap-to-answer onboarding stepper ("Tuanze / Let's get started", RQ-4) runs right after the first PIN is set. It asks the R0 subset of the PRD section 8 rubric, one question per screen, mostly as chips and buttons, each with a one-line "why this matters". Every answer is saved on the phone immediately, so the merchant can stop at any point and resume later. The answers become a Zod-validated Merchant Operating Profile, which the merchant reviews on "Wasifu wa Biashara / Business profile" before it is saved to merchant settings. Items she listed become Bidhaa.

She then lands on "Leta Daftari Lako / Bring in your notebook" (RQ-5, D-011), with three tabs: customers who owe her, suppliers she owes, and stock she has. Each row she adds is committed at once through the single save path as an `opening_balance` or `stock_adjustment` with `source: 'onboarding'`, labelled "Brought forward", and excluded from Sales, COGS, Expenses and Faida Halisi. When she taps Done she arrives at Muhtasari with her deni and stock already correct and today's sales at 0.

First-run routing is decided by one function after every PIN entry: no saved profile means the onboarding stepper, otherwise Muhtasari. Skip saves a default profile so she is never trapped, and both onboarding and the notebook can be reopened from Mipangilio.

Visually, the onboarding stepper uses real photographs of Kenyan market life as full-screen backgrounds under a solid scrim, so the first minutes feel like her market and not like a form (Owner, 2026-10-24). The review and notebook screens are work screens: they stay clean on Chalk for sunlight legibility, with imagery only in the header band or the empty state.

## User Stories

1. As a mama mboga who has just set her PIN, I want Mazao to take me straight into "Tuanze / Let's get started", so that I do not have to find setup on my own.
2. As a kiosk owner, I want each onboarding question on its own screen with big tap answers, so that I can answer with one thumb while standing at my stall.
3. As a mama mboga, I want a short "why this matters" line under each question, so that I understand why Mazao asks about deni or units and I answer honestly.
4. As a boda rider, I want to type my business name once (for example "Kamau Boda Gikomba"), so that it shows on my profile and later on my shared summaries.
5. As a repair fundi, I want to pick my business type from chips (for example vegetable trader, shop or kiosk, boda or transport, repair), so that I do not have to spell it.
6. As a kiosk owner, I want to set my location in a few words (for example "Gikomba Market"), so that my profile describes where I trade.
7. As a boda rider, I want to answer "I sell services" instead of goods, so that Mazao does not ask me about stock I do not have (D-006).
8. As a repair fundi, I want to answer "both goods and services", so that I can list spare parts with stock and labour as a service.
9. As a mama mboga, I want to add up to 8 main items with kind, unit, half-units yes/no, selling price and buying price, so that my first sale is a few taps instead of typing.
10. As a mama mboga, I want to choose units from the market list (kilo, gunia, tray, piece, crate, bag, litre, fundo, ndume, other), so that items are measured the way I really sell them.
11. As a mama mboga, I want to mark sukuma wiki as "can sell half units (like half a kilo)", so that I can later sell 2.5 kilo without a warning.
12. As a boda rider, I want a service item such as "Trip Gikomba to Town" to ask only for a name, a unit (trip, job or piece) and a price, so that I am not asked for buying price or stock (D-006).
13. As a kiosk owner, I want Mazao to stop me adding a ninth item during onboarding and tell me I can add more in Bidhaa, so that onboarding stays under 10 minutes.
14. As a mama mboga, I want to tick the payment methods I accept (cash, M-Pesa, other), so that the sale form shows only what I use.
15. As a kiosk owner, I want to answer whether I give deni, and if yes pick when customers usually pay (kesho, Ijumaa, wiki ijayo, mwisho wa mwezi, or no usual day), so that the due-date chip is preselected on every deni sale.
16. As a boda rider who never gives deni, I want to answer "no" and skip the due-day follow-up, so that I am not asked irrelevant questions.
17. As a mama mboga, I want to tick my usual expense categories (transport, ushuru, bags, and so on) from the default list and add my own, so that the expense form shows my categories first.
18. As a kiosk owner, I want a progress bar with "step n of N" and roughly how long is left, so that I know onboarding is short.
19. As a mama mboga, I want every answer saved the moment I tap it, so that a customer interruption or a dead battery does not lose my progress.
20. As a mama mboga who closed the app halfway, I want to reopen Mazao, enter my PIN, and continue at the question I left, so that I do not start again.
21. As a kiosk owner in a rush, I want "Skip for now" on every question, so that I can start selling immediately with sensible defaults.
22. As a kiosk owner who skipped, I want to resume onboarding later from Mipangilio with my earlier answers still filled in, so that skipping is not a dead end.
23. As a mama mboga, I want a Back button that keeps my answers, so that I can fix a wrong tap.
24. As a mama mboga, I want to review all my answers on "Wasifu wa Biashara / Business profile" before anything is saved, so that I can catch mistakes.
25. As a kiosk owner on the review screen, I want an "Edit" link per section that takes me to that question and back to the review, so that I do not redo the whole flow.
26. As a mama mboga, I want unanswered sections on the review screen to say "Not answered. Tap to add." in Maize, so that I can see what is missing without being blocked.
27. As a mama mboga, I want the review to show the warning settings (unusual price above 30%, below cost, negative stock) as "warn", so that I know Mazao will warn and not refuse.
28. As a mama mboga, I want "Set up Mazao" to create my items in Bidhaa and take me to "Leta Daftari Lako", so that I go straight on to my notebook.
29. As a mama mboga, I want to enter each customer who owes me from my notebook (name, amount, optional due date), so that my Deni la Wateja is right from day one.
30. As a mama mboga, I want to pick an existing customer by name if I already created them, so that I do not end up with two "Wanjiku" entries.
31. As a kiosk owner, I want to enter suppliers I owe (name, amount, optional due date), so that Muhtasari shows what I owe even before purchases arrive in R1.
32. As a mama mboga, I want to enter how much stock I have now for each goods item (for example 10 tray mayai), so that my stock count is right before my first sale.
33. As a mama mboga, I want brought-forward amounts clearly labelled "Brought forward" and the helper "This is not counted as sales", so that I trust that my profit today is not inflated (D-011).
34. As a mama mboga, I want a running "Brought forward: KES 1,950" total under the customer tab, so that I can check it against the total in my notebook.
35. As a mama mboga who typed 4,500 instead of 450, I want to void a notebook row and enter it again, so that I can correct mistakes without deleting history (D-018).
36. As a kiosk owner, I want "Do this later" on the notebook screen, so that I can bring in my notebook in the evening from Mipangilio.
37. As a kiosk owner, I want Mazao to warn me if I enter the same customer and the same amount twice within 10 minutes, so that I do not double-count a deni (D-026, POSSIBLE_DUPLICATE).
38. As a mama mboga, I want the whole flow (questions, review, notebook) to work in airplane mode, so that weak signal at Gikomba never stops me (RQ-1, RQ-12).
39. As a mama mboga, I want the onboarding screens to show a real photo of a Kenyan market behind the question, so that the app feels like it belongs to my world.
40. As a mama mboga reading in bright sun, I want the text over those photos to sit on a solid dark or light scrim with strong contrast, so that I can read every word (WCAG AA).
41. As a mama mboga on paid data, I want those photos to be small and already stored on the phone, so that onboarding does not use my bundles or load slowly.
42. As a kiosk owner using TalkBack, I want the photos ignored by the screen reader and every chip announced with its label and selected state, so that onboarding is usable without sight.
43. As a merchant who does not read Kiswahili well, I want every title bilingual (for example "Tuanze" with "Let's get started" under it, "Leta Daftari Lako" with "Bring in your notebook"), so that I always know where I am (D-040).
44. As a mama mboga, I want the due-day chips to show the Kiswahili word with the English under it (Kesho / Tomorrow, Ijumaa / Friday, Wiki ijayo / Next week, Mwisho wa mwezi / End of month), so that both readers understand them.
45. As a merchant restoring on a new phone, I want Mazao to skip onboarding because my profile came back with the restore, so that I am not asked the same questions twice (RQ-2, A5 restore).
46. As a merchant who re-runs onboarding from Mipangilio, I want items I already have not to be duplicated, so that my Bidhaa list stays clean.
47. As a pilot coordinator, I want onboarding plus notebook plus first sale to fit inside 10 minutes for a first-time user, so that AC-15 passes on Monday.
48. As a developer, I want onboarding progress, the profile and the notebook entries to go only through the local commit service, so that the one-save-path rule holds and everything is backed up by sync.
49. As a developer, I want the routing decision after PIN to be one pure, tested function of local state, so that first-run, resume and restored phones are always routed the same way.

## Implementation Decisions

**Modules and interfaces**

- **Onboarding progress store (local only).** Holds the in-progress answers in the business database's `onboarding` table, written after every answer. It never syncs: it is a draft, not a record. Interface: `loadProgress()`, `saveAnswer(step, value)`, `markSkipped()`, `markCompleted()`, `reset()`. The shape below encodes the skip and resume rules:

  ```ts
  type OnboardingProgress = {
    status: 'in_progress' | 'skipped' | 'completed';
    stepIndex: number;                       // question to resume at
    answers: Partial<OperatingProfileAnswers>; // only validated answers are kept
    draftItems: DraftOnboardingItem[];       // at most 8, not yet Bidhaa
    updatedAt: string;                       // toISOString()
  };
  ```

- **Question script.** A static, ordered list of the RQ-4 questions: business name, business type, location, sells (goods / services / both), main items (up to 8), payment methods, deni yes/no with default due rule, expense categories. Each entry carries its i18n keys (bilingual title, question, why-line), its answer control (text, single chip, multi chip, item list) and a validator taken from the Merchant Operating Profile schema. Questions that do not apply are skipped by rule: the due-rule follow-up only when deni is "yes"; buying price and half-units only for goods items. The progress bar counts the questions that apply to this merchant, not a fixed 10 (see Further Notes on the Stitch "6 of 10" mock).
- **Profile builder.** A pure function from answers plus `defaultProfile()` to a full Merchant Operating Profile. Unanswered fields fall back to the default profile. Rules are not asked in R0: every rule stays at the R0 default `warn`, price variance threshold 30% (D-026, RQ-11). The review screen shows them read-only.
- **Review screen** ("Wasifu wa Biashara / Business profile"). Grouped sections (Business, Items you sell, Services, Payments, Customer deni, Expenses, Warnings), simple dividers, no cards inside cards. "Set up Mazao" calls, in order: `saveSettings(profile)`, then `addItem` once per draft item, then `markCompleted()`, then navigates to the notebook. All writes go through the local commit service, so each produces sync-queue entries in the same Dexie transaction (AGENTS.md "One save path").
- **Item de-duplication on re-run.** When onboarding is re-run, a draft item whose name (case- and space-insensitive) and kind match an existing active item is not added again. Bidhaa editing is cut from R0 (blueprint "Already cut"), so a changed price for an existing item is not applied; the review screen says so for that item. ASSUMPTION: name plus kind is a good enough match for 5 pilot merchants.
- **Notebook screen** ("Leta Daftari Lako / Bring in your notebook"). Three tabs, each with the English under the Kiswahili: Wanaonidai (Customers who owe me), Ninaowadai (Suppliers I owe), Stoki (Stock I have).
  - Customer row: customer picker (search existing, or create by name plus optional phone via `upsertCustomer`), amount via MoneyInput, optional due date via the same chips as sales. Commits `commitOpening({ customerId, amount, dueDate?, source: 'onboarding' })`.
  - Supplier row: supplier name (create via `upsertSupplier`), amount, optional due date. Commits `commitOpening({ supplierId, ... })`.
  - Stock row: one row per goods item with a QtyInput (fractional only if the item allows it, max 3 decimals). Commits `commitStockAdjustment({ itemId, quantity, source: 'onboarding' })`, valued at the item's buying price (D-011, D-015). Services never appear on this tab (D-006).
  - Each row commits immediately when added, rather than on a final "Save notebook" tap, so an interruption never loses entered rows. The bottom button therefore reads "Done" and goes to Muhtasari; "Do this later" goes to Muhtasari without changes. This reconciles the Stitch "Save notebook" button with blueprint B4 task 3.
  - Entered rows list under each tab, newest first, labelled "Brought forward", with a Void action (confirm step) that calls `commitVoid`. Voided rows stay visible, struck through, labelled "Voided" (D-018, RQ-7 void rules).
  - Running total per tab ("Brought forward: KES 1,950") is computed by a domain function over active opening transactions, never in the component (AGENTS.md "Pure numbers").
- **First-run routing.** `nextRouteAfterPin()` reads local settings: no saved profile means `/onboarding`, otherwise `/` (blueprint B4 task 4). It is the only place this decision is made. Onboarding status `skipped` still has a saved (default) profile, so it routes to `/`. A phone restored by pull (A5) has the merchant's settings, so it routes to `/`.
- **Skip.** "Skip for now" saves the profile built from whatever valid answers exist so far on top of `defaultProfile()` (via `saveSettings`), marks progress `skipped`, keeps the draft answers and items for resume, and goes to Muhtasari. Draft items are not turned into Bidhaa on skip. ASSUMPTION: requirements say "Skip goes to Muhtasari with defaults"; keeping already-given answers is read as consistent with that.
- **Resume.** Mipangilio "Redo onboarding answers" opens the stepper at the first question, prefilled from the saved profile and any draft. "Bring in your notebook" in Mipangilio opens the same notebook screen at any time (RQ-5, RQ-13).

**Data rules**

- Opening customer and supplier deni are `opening_balance` transactions: `totalAmount = amount`, `amountPaid = 0`, exactly one of `customerId` / `supplierId` (blueprint B1 conventions, D-011).
- Opening stock is a `stock_adjustment` with `totalAmount = 0` and a positive line quantity. ASSUMPTION: the notebook accepts only positive stock quantities; zero is ignored and negative is refused in the UI.
- None of these count in Sales, COGS, Expenses or Faida Halisi, and payments, opening balances and stock adjustments are never sales (D-011, D-014). They do count in customer balance, supplier owed and stock on hand, all derived from the ledger, never stored (D-019).
- An opening customer deni is a credit for FIFO allocation and overdue logic (blueprint B1 `openDeni`), so a brought-forward amount with a due date before today shows as overdue on Deni la Wateja.
- Money is integer cents everywhere on the client; `MoneyInput` converts whole shillings to cents (D-013).
- The Merchant Operating Profile is stored in `merchant_settings` and synced last-write-wins on `updated_at`, keyed by business (D-020, A5).
- No onboarding answers leave the phone except the saved profile through normal sync. There is no cloud AI interview in R0 (D-033).
- Grill rules apply to notebook entries through the same save path (D-026). `DENI_NEEDS_CUSTOMER` cannot fire because an opening customer deni always has a customer; `POSSIBLE_DUPLICATE` can warn.

**Imagery and visual rules (Owner, 2026-10-24)**

- Onboarding stepper screens (Tuanze) use a full-screen photograph of Kenyan market life (for example a Gikomba stall in daylight, a boda at the market gate, a fundi's bench) behind the content. A **solid** scrim (one flat colour at fixed opacity, no gradient, per the "no gradients" token rule) sits between the photo and all text. Text over the scrim meets WCAG AA (4.5:1 for body, 3:1 for 18sp+ titles), checked against the brightest region of each photo. Answer chips and inputs sit on solid Surface #FCFDFB panels, never directly on the photo.
- The review and notebook screens are work screens: Chalk background, no full-screen photo. Imagery is allowed only in the top header band or in the notebook empty state ("Start with the person who owes you the most.").
- Images are real photographs, AVIF with a WebP fallback, each at most 150 KB, sized for a 360x800 viewport at 2x. No illustrations, no fake screenshots built from divs, no stock smiles (stitch-prompts.md landing rules).
- Images are decorative: empty alt text, ignored by screen readers. They are precached by the service worker so onboarding is fully offline, and a missing image falls back to the solid scrim colour with no layout shift. An image never blocks a tap.
- Bilingual titles on every screen via the PageTitle primitive (D-040). Body, form labels and buttons are English; market words untranslated (D-005).
- Tap targets at least 48 px; Manrope; Sukuma Green only for the primary button, active state and focus ring; Maize for "Not answered" and deni; tokens from stitch-prompts.md.

## Testing Decisions

A good test checks external behaviour only: what the merchant sees, and what the local ledger answers when asked. It does not assert on component state, internal function calls or the shape of private stores.

**Seam 1, data behaviour (Vitest with fake-indexeddb):** the local commit and query API is the only seam. Tests drive it exactly as the screens do (`saveSettings`, `addItem`, `upsertCustomer`, `commitOpening`, `commitStockAdjustment`, `commitVoid`, the onboarding progress store, `nextRouteAfterPin`) and assert through the query layer (customer balance, deni list, supplier owed, stock on hand, day summary).
- Otieno opening balance 500: deni list shows 500, today's Sales 0, Faida Halisi 0 (AC-05 prior art).
- Opening stock 10 tray mayai, then a sale of 3: stock on hand 7 (AC-06 prior art).
- A voided opening balance returns the customer to 0 and stays in the ledger as Voided.
- An opening deni with a due date of yesterday makes the customer overdue.
- `nextRouteAfterPin`: no settings goes to `/onboarding`; skipped (default profile saved) goes to `/`; completed goes to `/`; restored settings go to `/`.
- Skip with two answers saved: the stored profile has those answers and default values for the rest, and no items were created.
- Re-running onboarding with an item that already exists does not create a second item.
- Each onboarding answer survives "closing the app" (reopening the database) and resumes at the saved step.
- Every write in this phase produces sync-queue entries in parent order in the same transaction (customer before its opening balance).

**Seam 2, screens (Playwright against `pnpm build && pnpm start`, offline after unlock):** `e2e/onboarding.spec.ts` per blueprint B4: 3 items, one a service, then review, then notebook (Otieno owes 500, 10 tray mayai), then Muhtasari shows deni outstanding 500 and today's sales 0. Plus: Skip goes to Muhtasari with defaults; reload mid-stepper resumes at the same question; onboarding routes are reachable cold offline (AC-09 route list already includes `/onboarding`, `/onboarding/review`, `/notebook`).

**Visual checks:** onboarding screens at 360x800 run through impeccable critique for contrast over imagery; image weight checked in the build output (each at most 150 KB).

**Prior art:** acceptance.md AC-05, AC-06, AC-15; blueprint B4 Verify; the DOMAIN.md worked example (Sales 350, COGS 90, Expenses 50, Faida Halisi 210) must still hold after a notebook import, since brought-forward entries change none of those figures.

## Out of Scope

- The cloud AI Grill Agent interview, consent screen and conversational follow-ups (D-033, R4). Voice answers (D-032, R5).
- PRD section 8 rubric topics not in RQ-4: business rhythm, pricing behaviour, supplier policy questions, reporting preferences, AI preferences, preferred language, maximum deni per customer.
- Asking the merchant to choose warn or block per rule. R0 keeps every rule at `warn`; `block` is set only by seeded tests (AC-08).
- Editing an existing item's price or unit (Bidhaa edit is cut from R0).
- Managing supplier deni: supplier ledger, supplier payments, purchases (R1). Opening supplier deni is captured only.
- Stock adjustments other than opening stock (R2).
- Importing a notebook by photo, OCR or file.
- More than 8 items in onboarding (more can be added in Bidhaa).
- Several merchant accounts on one phone (D-039).

## Further Notes

- **Acceptance covered:** AC-05, AC-06 (opening stock part), AC-09 (onboarding routes offline), AC-15 (time to first sale), AC-21 (bilingual titles on Tuanze, Wasifu wa Biashara, Leta Daftari Lako). Cut 2 in the blueprint reduces onboarding to business name, type and items and waives part of AC-15 (time target still applies).
- **Proposed new acceptance checks** (numbered after the Today report checks proposed in Phase 4, AC-24 to AC-30):
  - **AC-31:** Every onboarding background image is AVIF or WebP, at most 150 KB, precached, and all text over it passes WCAG AA at 360x800 in an impeccable critique pass.
  - **AC-32:** Closing the app on onboarding question 5 and unlocking again resumes at question 5 with earlier answers intact; Skip then Mipangilio "Redo onboarding answers" shows the earlier answers.
- **Questions:** Q-006 (native-speaker check of Tuanze, Wasifu wa Biashara, Leta Daftari Lako, Wanaonidai, Ninaowadai, Stoki). Proposed new question for the owner: who supplies the market photographs, and is there consent from any recognisable person in them (ASSUMPTION: photos are owner-provided or licensed, with consent). Q-002 (merchant email) gates reaching onboarding at all.
- **Risks:** R-001 (time; onboarding sits in B4 after the Sun 18:00 checkpoint and is the subject of Cut 2), R-003 (wrong numbers if brought-forward entries leaked into sales), R-011 (B4 touches `nextRouteAfterPin`, owned by Dev B, called from Dev A's set-pin page).
- **Inconsistencies noticed:**
  - Stitch 3.4 shows a 10-segment progress bar ("6 of 10"), but RQ-4 has 8 questions; the bar counts applicable questions.
  - Stitch 3.4 offers "Yes, often / Sometimes / Never" for deni, but the profile has a boolean `deniEnabled`; "Yes, often" and "Sometimes" both map to `true`.
  - Stitch 3.6 has a "Save notebook" button; blueprint B4 commits each row; this spec commits per row and labels the button "Done".
  - Phase 2 depends on primitives built in Phase 3 (B3), because the blueprint orders B4 after B3.
