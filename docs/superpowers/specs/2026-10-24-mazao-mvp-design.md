# Mazao MVP — Design Spec

**Date:** 2026-10-24
**Status:** Draft for approval
**Builds on:** [`docs/PRD.md`](../../PRD.md) v1.1. Where this spec and the PRD disagree, **this spec wins**. Anything not mentioned here stands as written in the PRD.

Decisions are tagged:
- **[Owner]**: decided by the product owner during the design interview.
- **[Builder call]**: decided by the designer and open to challenge.

---

## 0. Release plan and team

- **Team:** 2 developers working with Claude [Owner].
- **Cost:** everything runs on free tiers: Vercel free, Neon free, Clerk free [Owner].
- **R0, pilot test Monday 26 October 2026 with 5 Gikomba merchants** [Owner date; scope is a Builder call, accepted by default]. R0 proves the core question: "Is this faster than my notebook, and do the numbers match?"
  - Sign-in (email code or Google), install to home screen, set a 4-digit PIN (§6.1).
  - Tap-to-answer onboarding plus "Bring in your notebook" (§7.4).
  - Manual entry of sales (goods + services), expenses, customer deni and customer payments.
  - Muhtasari for today: Total Sales, Total Expenses, Faida Halisi, who owes what.
  - Fully offline, with push backup to Neon when online, so no records are lost.
  - **Also on Monday:** collect model-test material at Gikomba, about 100 real phrases plus noisy-market recordings on the merchants' phones (§8.5).
- **R1 and later**, in this order:
  1. purchases and supplier deni;
  2. inventory/stock depth and repair jobs;
  3. reports and PDF;
  4. AI parsing (after the model test);
  5. English voice;
  6. Mtandao.
- **Cut order if time runs short:** Mtandao → voice → embeddings memory. The ledger, deni, Faida Halisi, sync and onboarding are never cut.

The rest of this spec describes the full MVP. R0 is the first slice of it.

## 1. Intent

Mazao is a free, offline-first phone app (PWA) that lets small Kenyan merchants keep honest books faster than a paper notebook. The merchants are shopkeepers, mama mbogas, boda bodas, transporters and repair fundis. Mazao tracks what they sell (goods **and** services), what they buy, what they spend, who owes them, who they owe, and what they actually earned (Faida Halisi).

The MVP is a **proof of concept** with **5 merchants in Gikomba market, Nairobi** [Owner]. It succeeds if those merchants keep using it instead of paper and trust its numbers.

### Why it matters
Merchants lose money to forgotten deni, unseen stockouts and profit they can't measure. Cloud-only apps fail in markets with poor signal. AI that silently saves wrong numbers destroys trust faster than having no app at all.

## 2. Goals, non-goals, anti-goals

### Goals
1. Recording a sale, purchase, expense or payment is faster than writing it in a notebook. The manual path alone must achieve this.
2. Every core feature works with no internet after first sign-in.
3. Customer deni, supplier deni, stock and Faida Halisi are always correct and visible.
4. Goods merchants **and** service merchants (boda, transport, repairs) can use it from day one.
5. AI helps, through text parsing, English voice and onboarding, but never saves anything without the merchant's explicit confirmation.
6. The data model is ready for multi-person businesses with roles, though the MVP ships with one owner per business.

### Non-goals for the MVP
- Loans and a loan ledger (Mikopo), including links to lenders [Owner].
- Kiswahili voice input; Kiswahili screen content beyond page names [Owner, planned for later].
- Roles and attendant accounts in the UI (data model only) [Owner].
- Repair-job extras: photos, warranties, "item ready" SMS.
- Everything in PRD §5.2: M-Pesa API, SMS parsing, double-entry accounting, payroll, tax, native apps, barcodes, forecasting.
- Monetisation. The MVP is free [Owner].

### Anti-goals: failure even if it "works"
- A wrong number is saved because the AI guessed and the merchant didn't clearly confirm.
- A merchant loses records because the phone was offline or the browser cleared storage.
- The app is unusable on a typical 3 GB Android phone, or burns the merchant's data on a model download they didn't agree to.
- Profit is overstated, for example because deposits or money-in are counted as sales.

## 3. Users and pilot

| Who | Sells | Typical needs |
|---|---|---|
| Mama mboga / produce trader | Goods by kilo, fundo, gunia, tray | Deni, spoilage, low stock |
| Kiosk / small shop | Many small goods | Stock, supplier deni, cash vs M-Pesa |
| Boda boda / transporter | Services (trips, deliveries) | Daily income, fuel and repair costs |
| Repair fundi (phone, bike, electronics) | Services + parts | Job tracking, deposits, parts cost |

- **Pilot:** 5 merchants in Gikomba [Owner]. The mix is a [Builder call]: aim for at least one goods trader, one shop, one boda/transporter and one repair fundi.
- **Price:** free [Owner].

## 4. How it gets made (stack)

| Layer | Choice | Tag |
|---|---|---|
| App type | PWA in mobile Chrome (installable, offline) | Owner |
| Framework | Next.js App Router, TypeScript, Tailwind CSS | PRD |
| Hosting | Vercel, free tier | Owner |
| Server DB | Neon serverless PostgreSQL, free tier, EU (Frankfurt) region, since no Kenyan region exists | Owner (free tier); Builder call (region) |
| Auth | Clerk for first sign-in and recovery (email code + Google; phone OTP after the pilot), then a local 4-digit PIN. See §6.1 | Owner |
| Local DB | IndexedDB via Dexie.js | PRD |
| Validation | Zod | Builder call (PRD allowed Zod or Valibot) |
| Local LLM runtime | **wllama** (llama.cpp in WASM, GGUF, CPU or WebGPU), replacing `@qvac/sdk`, which doesn't run in browsers | Owner (Q19) |
| Speech-to-text, embeddings | **transformers.js** (ONNX in the browser) | Owner (Q19) |
| Cloud AI (opt-in) | Vercel AI Gateway with a key the team provides later; provider and model chosen then. **Off until a key exists. Not in R0.** | Owner |
| Text-to-speech | Browser `speechSynthesis` (English) | Builder call |
| PDF | Client-side PDF generation so reports work offline. Library is the builder's choice. | Builder call |
| Mtandao graph view | A lightweight browser graph library (e.g. Cytoscape.js or react-force-graph) rendering local data. Library is the builder's choice. | Builder call |

**Graphify** is a developer tool for mapping the codebase and docs. It is **not** part of the merchant-facing app.

**Minimum phone** [Owner]: Android 10+, Chrome, 3 GB RAM for the app. The **local parsing LLM** is offered only on phones with **≥ 4 GB RAM** (checked with `navigator.deviceMemory` plus a trial load). Those phones get manual entry plus opt-in cloud parsing.

The smaller **speech-to-text and embedding models** (~80–120 MB each) are offered on all supported phones, subject to the same trial load. If a trial load fails, that feature stays off on that phone [Builder call].

## 5. Language

- **Page names and navigation are in Kiswahili** [Owner]: Muhtasari, Mauzo, Manunuzi, Deni la Wateja, Deni la Wasambazaji, Gharama, Bidhaa, Kazi (repair jobs), Mtandao, Ripoti, Mipangilio.
- **All other screen text is in English** [Owner]. Market words stay as merchants say them: *deni, Faida Halisi, ushuru, kilo, gunia, fundo, ndume, tray* [Builder call].
- All UI strings go through an i18n layer from day one so Kiswahili can be added without rewrites [Builder call].
- **Voice input is English only** in the MVP [Owner].
- **Typed AI input** must handle English mixed with Swahili and Sheng words, e.g. *"sold sukuma 3 kilo 150 bob deni ya Wanjiku kesho"* [Builder call].

## 6. Tenancy and identity (changes PRD §7.1, §13.1, §14)

The tenant is now the **business**, not the person [Owner, Q14]:

- `profiles`: the person, linked to `clerk_user_id`.
- `businesses`: the tenant. Every business-owned row carries `business_id`.
- `business_members(business_id, profile_id, role)`. In the MVP the only role is `owner`, and each profile owns exactly one business, created automatically on first sign-in.
- Every record also stores `created_by` (profile id) so attendants can be added later without data migration.
- Membership lives in Mazao's own tables, not Clerk Organizations. Membership must be readable offline, and Clerk Organizations can be reconsidered when roles ship [Builder call].
- Every API route verifies the Clerk session and checks that `business_id` belongs to the caller. Neon RLS or equivalent server-side filtering enforces this.

### 6.1 Sign-in and the 4-digit PIN [Owner]

- **First sign-in (needs internet):**
  - The merchant signs in with Clerk, using an **email one-time code** or **Google** [Owner: email].
  - Phone-number OTP comes after the pilot, because SMS to +254 may not be free [Builder call].
- **Set a PIN:** at the end of setup the merchant must create a **4-digit PIN**.
  - The PIN is stored on the phone only as a salted hash (PBKDF2 or similar), never in plain text, and never sent to the server.
- **Everyday unlock:** **email + PIN**, online or offline.
  - It's checked on the phone itself.
  - The app locks again after 5 minutes in the background.
  - After 5 wrong PINs there's a 30-second wait, and the wait doubles with each further failure [Builder call].
- **Backup sync:** the Clerk session stays saved in the background and is used only to sync when online.
  - If it expires, sync pauses, and the merchant is asked to confirm by email code the next time they're online.
  - Their records stay available through the PIN throughout.
- **Forgot PIN / new phone (needs internet):** the merchant signs in through Clerk's email code, then sets a new PIN.
  - On a new phone, data comes back from the server backup.
- **The PIN is not the online account password.** 4 digits would be guessable over the internet. Online identity always uses Clerk's emailed code or Google [Builder call].
- **Shared phones:** a second merchant can add their own email + PIN on the same phone. Each account's local data is kept separate [Builder call].

## 7. Functional scope

Everything in PRD §7 stands, with these changes.

### 7.1 Items: goods and services [Owner, Q1]
- Inventory items gain `kind`: `goods` | `service`.
- **Goods** behave as in PRD §7.3: stock, units, buying and selling price, low-stock threshold.
- **Services** have a name and default price. They have **no stock** and a default `unit_cost` of 0. Examples: "Trip town–Gikomba", "Delivery", "Screen fitting labour".
- A sale can mix goods and service lines. Both count in Total Sales. Only goods lines (and parts on repair jobs) add to COGS.
- Default expense categories add **fuel**, **repairs / matengenezo**, and **vehicle / bike costs** to the PRD list.

### 7.2 Repair job card ("Kazi") [Owner, Q22]
- **Create a job:** customer (required), item description (e.g. "Tecno phone, cracked screen"), promised date, optional note.
- **Lines:**
  - **labour** (a service line);
  - **parts** (goods lines from stock).
- **Status flow:** `received → in_progress → ready → collected`, with an extra `cancelled` status.
- **Money** [Builder call, so stock and profit stay honest]:
  - A **deposit** taken at intake is recorded as a **customer payment**. Before the sale exists, this gives the customer a negative balance (credit), as PRD §14.3 already allows.
  - When the job is marked **ready**, the merchant confirms the final lines. That creates a **sale** transaction linked to the job (`job_id`). This is when parts leave stock, and when revenue and COGS are counted.
  - The customer's balance nets out automatically: the sale total minus the deposit becomes their deni.
  - Moving to **collected** records any remaining payment.
- **Dashboard:** "Ready, not collected" and "Promised date passed" lists.
- **Cancelling** a job with a deposit leaves the customer in credit until it's refunded through a payment-out.

### 7.3 Mtandao: network view [Owner, Q13]
- A **read-only relationship map**:
  - the business sits at the centre;
  - customers, suppliers and items are the nodes;
  - lines show buying and selling links;
  - line thickness shows volume over the selected period;
  - red marks show open deni.
- Tapping a node opens that customer's, supplier's or item's ledger.
- It is built entirely from local data and works offline.
- Period filter: this week, this month, or all time.
- For performance on weak phones, it shows the top ~50 nodes by activity and groups the rest [Builder call].

### 7.4 Starting balances from the paper notebook [Builder call]
At the end of onboarding, and any time later from Mipangilio, a **"Bring in your notebook"** step lets the merchant enter:
- **Opening customer deni:** customer + amount + optional due date. This creates an `opening_balance` transaction that raises the customer's balance.
- **Opening supplier deni:** supplier + amount + optional due date. This creates an `opening_balance` transaction that raises `balance_owed`.
- **Opening stock:** quantity per goods item, recorded as a `stock_adjustment` and valued at the item's buying price.

`opening_balance` transactions count in **no** Total Sales, COGS, Expenses or Faida Halisi figures, and they are labelled "Brought forward" in ledgers and deni ageing.

### 7.5 Removed or deferred
- Loans: no ledger, no links [Owner, Q21]. Known limitation: borrowed money isn't recorded, so cash-on-hand figures may differ from reality for merchants with loans. The pilot debrief should measure how much this hurts.

## 8. AI layer (replaces PRD §9.1 and part of §9.5)

### 8.1 Principle: manual-first [Builder call, accepted Q9]
- Every flow has a fast manual path: forms, favourite items, one-tap "repeat last sale", and recent customers.
- AI is an add-on, and the app must be fully useful with all AI switched off.
- **Nothing AI-produced is saved without the Review Card and `[ ✅ Confirm & Save Record ]`.** The PRD §9.4 Review Card stands unchanged.

### 8.2 Components

| Job | Where it runs | Model (shortlist, decided by the model test in §8.5) |
|---|---|---|
| Parse typed/spoken text into a draft record | Local (wllama) on ≥ 4 GB phones; otherwise opt-in cloud | `Qwen2.5-0.5B-Instruct` Q4 GGUF vs `Qwen3-0.6B` Q4 GGUF |
| English speech-to-text | Local only (transformers.js) | `whisper-base.en` vs `moonshine-base` |
| Embeddings for memory (items, customers, past corrections) | Local only (transformers.js) | `multilingual-e5-small`, chosen so Kiswahili works later without re-embedding [Owner, Q23] |
| Grill Agent onboarding interview | Cloud via AI Gateway, opt-in, once a key exists; tap-to-answer until then | — |
| Read-back confirmation | Browser `speechSynthesis`, English | — |

- **Model downloads:** only after the merchant agrees, with the size in MB shown. They download automatically only on Wi-Fi. Downloads can resume and are cached in the browser [Owner, Q25].
- **Sub-agent routing** (PRD §9.2) stays: Sales, Purchases, Expenses. Add **Jobs**, which drafts a job card from text such as "Tecno screen for Otieno, ready Friday, deposit 500".
- **Structured output:** the parser must emit JSON that passes a Zod schema. Invalid output becomes a "couldn't understand, please fill in" Review Card prefilled with whatever parsed, never a silent failure.

### 8.3 Grill Agent, Transaction Mode [Builder call]
The validation checks in PRD §9.3 are implemented as **deterministic code rules, not LLM judgement**, so they are predictable and testable:
- arithmetic;
- missing customer or supplier on deni;
- price outside the merchant's variance threshold;
- selling below cost;
- stock going negative;
- likely duplicates (same type, party and amount within 10 minutes);
- unclear due date or unit.

Rule strictness (warn or block) comes from the Merchant Operating Profile. The LLM's only job is turning text into a draft. The rules produce the warnings and questions shown on the Review Card.

**The rules run in the single shared save path**, so they apply to manual and AI entries alike [Builder call]:
- On manual forms, the same warnings appear inline above the save button.
- **"Block" never stops a merchant recording what really happened.** It needs a deliberate second tap ("Save anyway — stock count is wrong"), and the override is stored on the record.
- Arithmetic and schema errors are the only hard stops.

### 8.4 Grill Agent, Onboarding Mode [Owner, Q24]
- The onboarding is a **real AI interview**. It follows the PRD §8 rubric (10 topics), asks conversational follow-ups, and explains why each question matters.
- It runs on a **cloud model through Vercel AI Gateway**, using a key the team provides [Owner]:
  - First sign-in already needs internet, and a 0.5B local model can't run a good interview [Builder call].
  - The merchant sees a short consent screen first, because onboarding answers are sent to the cloud AI.
  - **Until a key is configured, and in R0, onboarding is the tap-to-answer version.**
- **Fallback:** if the merchant declines, is offline, or the call fails, they get the same rubric as **tap-to-answer questions**. This is the PRD §16.3 "manual fallback".
- Both paths produce the same **Merchant Operating Profile** (PRD §8.14), extended with service items and job settings. It's validated with a Zod schema and shown to the merchant for review before saving.
- PRD §8.15 UX rules stand: under 10 minutes, skip and resume, progress saved locally, editable later in Mipangilio.

### 8.5 Model test (new, before AI build) [Owner, Q23]
- **Test set:** ~100 Gikomba-style phrases covering sales, purchases, expenses, payments and jobs. They include mixed English/Swahili/Sheng typed text and English speech recorded in a noisy market on 2–3 pilot-class phones.
- **Measure:**
  - parse accuracy per field;
  - word error rate for speech-to-text;
  - time to Review Card;
  - peak memory;
  - download size.
- **Pass bars** [Builder call]:
  - ≥ 80% of typed phrases produce a Review Card needing no field corrections;
  - English speech-to-text word error rate ≤ 20%;
  - time from text to Review Card ≤ 5 s on a 4 GB phone.
- If no local LLM passes, local parsing ships off and phones use opt-in cloud parsing.
- If no speech model passes, **voice input ships off in the MVP**. Typing remains, and audio never goes to the cloud. Voice is a pilot extra, not a pilot requirement [Builder call].
- The test set becomes the permanent AI golden test (PRD §16.9).

### 8.6 Cloud AI rules [Owner, Q11 and Q26]
- **Configured only through Vercel AI Gateway with a team-provided key. With no key, all cloud AI paths are hidden.**
- **Off by default.** The merchant turns it on in Mipangilio or at the onboarding consent screen.
- **Text only. Audio never leaves the phone in the MVP.**
- Calls go through a Next.js route that checks the Clerk session and forwards the minimum context: the text plus the relevant item and customer names.
- Mazao stores no prompts or responses server-side beyond normal error logs, and logs must not contain record contents.

## 9. Money rules (adds to PRD §10)

- **Total Sales** = confirmed sale lines (goods + services, including repair jobs).
- **COGS** = goods lines and repair parts, each at the `unit_cost` captured at sale time.
- **Total Expenses** = confirmed expenses.
- **Faida Halisi** = Total Sales − COGS − Total Expenses.
- **Not counted in sales:**
  - customer payments, including job deposits;
  - stock adjustments.
- **Cash flow** is reported separately, split by payment method (cash / M-Pesa / other), as in PRD §10.2.
- **Unit cost** for a goods line defaults to the item's current `buying_price` at confirmation time [Builder call]. FIFO/weighted-average costing is out of scope.

## 10. Offline and sync (adds to PRD §12)

All of these are [Builder call]:

- **IDs:** all IDs are client-generated UUIDs, so records created offline keep their identity.
- **Immutable records:** confirmed transactions can't be changed. A correction is a **void** (a reversing record that points to the original) followed by a new record. Each has its own Review Card.
- **Idempotent push:** pushing the same record twice is a no-op.
- **Derived values:** customer/supplier balances and stock are **derived values**. They're updated locally for instant display and recomputed from the ledger on the server, which is the source of truth.
- **Conflicts:**
  - Transactions are append-only, so they can't conflict.
  - Mutable master data (items, customers, suppliers, settings) uses last-write-wins per field, with `updated_at`.
- **Storage:**
  - The app requests persistent storage (`navigator.storage.persist()`).
  - If records stay unsynced for more than 3 days, the app shows a "connect to back up" banner.
- **Drafts:** AI drafts never sync (PRD §12.1).

## 11. Privacy (adds to PRD §13)
- No raw audio is stored or sent.
- Model downloads and cloud AI each need explicit consent.
- **Data export:** JSON + CSV from Mipangilio.
- **Account deletion:** a working "delete my business data" request that removes the server data and clears the local data.
- **Law:** follow the Kenya Data Protection Act principles (PRD §13.3).

## 12. Success measures for the pilot (replaces PRD §4.2 targets for now)

| Measure | Target |
|---|---|
| Sign-in → onboarding → first confirmed record | ≤ 10 min, unaided, for 4 of 5 merchants |
| Still recording after 4 weeks | 3 of 5 merchants, ≥ 4 days/week |
| Records created offline that reach the server | 100% within 24 h of reconnecting |
| AI drafts confirmed without edits | ≥ 80% (where AI is used) |
| Merchant says the Faida Halisi / deni numbers match reality | 5 of 5 at the week-4 debrief |
| Monthly PDF report generated | < 5 s on a 3 GB phone |

## 13. Schema changes vs PRD Appendix A

These are [Builder call] except tenancy (Owner, Q14):

- **New tables:**
  - `businesses(id, name, business_type, market_location, preferred_language, currency_code, timezone, …)`
  - `business_members(business_id, profile_id, role, created_at)`
- **`profiles`:** keeps person fields only. Business fields move to `businesses`.
- **Tenancy columns:** `user_id` → `business_id` on customers, suppliers, inventory, transactions, transaction_items, merchant_settings, onboarding sessions and business rules, and `created_by uuid` is added.
- **`inventory`:** add `kind text not null default 'goods' check (kind in ('goods','service'))`. Service items ignore stock fields.
- **New table `jobs`:** `(id, business_id, customer_id, item_description, promised_date, status, note, created_by, created_at, updated_at)`.
- **`transactions`:**
  - add `job_id uuid null` and `voids_transaction_id uuid null`;
  - `type` covers `sale | purchase | expense | customer_payment | supplier_payment | stock_adjustment | opening_balance | void`;
  - payments can carry a `direction` (in/out) for refunds.
- **`transaction_items`:** add `item_kind` (snapshot of goods/service at sale time).

## 14. Delivery order (adjusts PRD §15)

R0 for Monday (§0) is a vertical slice that takes the minimum from Phases 1–5. The phases below describe the full MVP after R0.

1. **Phase 0:**
   - Repo, docs, this spec.
   - **Model test (§8.5) run early**, because it is the largest technical risk and decides what Phase 6 builds.
2. **Phase 1:** PWA shell with Kiswahili navigation, offline shell, i18n.
3. **Phase 2:** Clerk, profiles, businesses and membership, Neon schema, tenant checks.
4. **Phase 3:** Dexie data layer, commit service, sync queue, void-and-replace.
5. **Phase 4:** Ledgers: goods and service items, customers, suppliers, sales, purchases, expenses, payments, **repair jobs**.
6. **Phase 5:** Dashboard, Faida Halisi, deni ageing, PDF, read-back, **Mtandao**.
7. **Phase 6:** Onboarding Grill Agent (cloud + tap fallback), Merchant Operating Profile, then the AI parsing layer using the test winners, rule-based Transaction Mode, and the Review Card.
8. **Phase 7:** Sync hardening, server recomputation, export and delete.
9. **Phase 8:** Tests (financial maths, offline, sync idempotency, golden AI set), then the pilot in Gikomba.

The onboarding interview depends on settings and the profile model, so it moves later than PRD Phase 2.5. Until it ships, a skippable tap-to-answer onboarding stands in [Builder call].

## 15. Left to the builder
- Graph, PDF and chart libraries.
- Exact Dexie table layout, and the sync batching and backoff timings.
- Visual design, within the PRD's sidebar layout and low-end-phone performance limits.
- Prompt wording for each sub-agent and the onboarding interview.
- The exact Gikomba pilot merchant mix and recruitment.

## 16. Open questions for later (not blocking the MVP)
- **Before Monday (owner action, not a build item):**
  - Confirm whether Mazao must register with Kenya's ODPC and publish a privacy notice before collecting real merchant data, given the data is stored in the EU.
  - Confirm each pilot merchant has an email address they can open on their phone.
- Phone-number sign-in (SMS OTP) after the pilot.
- Which cloud AI provider and model to use once the key exists.
- Kiswahili voice: which ASR model, and when? It needs its own model test.
- Loans ledger and lender links (Safaricom, M-KOPA) after the pilot.
- Roles and attendant accounts; whether to move membership to Clerk Organizations.
- Monetisation, e.g. verified reports for Chamas and microlenders.
