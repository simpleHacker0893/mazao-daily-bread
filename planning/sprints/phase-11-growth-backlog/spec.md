# Phase 11: Growth backlog (roles, multi-account phones, Kiswahili, Mikopo, phone OTP, monetisation)
> Release: post-MVP · Milestone: Growth backlog (unscheduled) · Depends on: phases 1-10, the week-4 pilot debrief · Label: Not ready: needs discovery

## Problem Statement
The MVP makes deliberate cuts so that 5 Gikomba merchants can use it on a free stack, and each cut leaves a known gap:

- **Roles and attendants** (D-012): a kiosk with a shop assistant, or a mama mboga whose daughter minds the stall, can't let a second person record sales without sharing the owner's PIN and seeing everything. The data model is ready (`business_members.role`, `created_by` on every row, D-016), but the product isn't.
- **Multi-account phones** (D-025, cut by D-039 for R0): families and stall neighbours share phones, but R0 allows one merchant account per phone.
- **Kiswahili UI and voice** (D-004, D-032): many merchants prefer Kiswahili, and the MVP is English body text with bilingual titles only. Kiswahili speech-to-text failed to meet quality expectations so far (R-007).
- **Loans / Mikopo** (D-009, Q-007): merchants who borrow (Chama, M-Shwari, Fuliza, M-KOPA) have cash figures that drift from reality because loan money in and repayments out aren't recorded.
- **Phone OTP sign-in** (Q-005, D-022): some merchants have no usable email (R-005).
- **Monetisation and verified reports** (D-003, spec §16): the product is free on free tiers. Chamas and microlenders may value reports they can trust more than a merchant-made PDF, which could fund the product. But this touches privacy and consent deeply.

None of these has enough evidence yet to specify. Each needs discovery, mostly from the week-4 pilot debrief, before it becomes a ready-for-agent phase.

## Solution
Treat this file as a discovery backlog, not a build spec. Each theme below gets a discovery task with a question to answer, the evidence needed, and a sketch of the likely shape so that later specs start from decisions, not a blank page. When a theme's questions are answered, the architect splits it into its own phase spec (with label ready-for-agent) and records superseding decisions.

1. **Roles and attendants:** owner invites an attendant by email or phone; attendant role can record sales, expenses and payments but can't see Faida Halisi, reports, supplier deni or export, and can't void others' records; per-person attribution through `created_by`; device unlock per person. Decide whether membership moves to Clerk Organizations (D-017 said reconsider when roles ship).
2. **Multi-account per phone:** bring back D-025: several email + PIN accounts on one phone, each with its own local database, an account picker on the lock screen, and sync flushing only for the matching Clerk user (D-039 rule generalised).
3. **Kiswahili UI and voice:** translate the i18n dictionary with a native speaker (Q-006 first); a language switch in Mipangilio "Lugha / Language"; Kiswahili read-back; a separate Kiswahili speech-model test like spec §8.5 before any Kiswahili voice. Embeddings already use multilingual-e5-small so memory needs no re-embedding (spec §8.2).
4. **Mikopo / Loans:** a minimal loan ledger: loan received (money in, not a sale), repayments (money out, interest as an expense), balance per lender. Profit unaffected except interest. Out of scope until Q-007 shows it matters.
5. **Phone OTP:** Clerk SMS sign-in for +254 alongside email and Google, depending on cost (Q-005).
6. **Monetisation and verified reports:** explore a merchant-consented, server-generated report with a verification link or code that a Chama or lender can check, built on phase 10 server recompute. Free core stays free (D-003 until superseded).

## User Stories
1. As a kiosk owner, I want my shop assistant to record sales on her own phone under her own name, so that I know who sold what without sharing my PIN.
2. As a kiosk owner, I want attendants unable to see my Faida Halisi, supplier deni or reports, so that my business figures stay private.
3. As a kiosk owner, I want to remove an attendant who leaves, so that they can't record anything after that day.
4. As a mama mboga, I want my daughter to record sales when she minds the stall, so that the day's book is complete.
5. As a mama mboga sharing a phone with my neighbour, I want each of us to have our own account and PIN on the phone, so that our books never mix.
6. As a boda rider, I want to pick my account on the lock screen, so that switching users on a shared phone is fast.
7. As a mama mboga, I want the whole app in Kiswahili, so that I can read every screen comfortably.
8. As a kiosk owner, I want to switch between English and Kiswahili in Mipangilio, so that I choose what suits me.
9. As a mama mboga, I want to speak in Kiswahili or Sheng and have it understood, so that voice works the way I really talk.
10. As a mama mboga, I want read-back in Kiswahili, like "Mauzo ya shilingi mia moja yamehifadhiwa" (PRD §9.5), so that confirmations sound natural.
11. As a kiosk owner who borrows from my Chama, I want to record a loan and its repayments, so that my cash numbers match my real cash.
12. As a boda rider paying off a bike loan, I want loan repayments kept separate from fuel and repairs, so that my profit isn't understated by the principal.
13. As a mama mboga without email, I want to sign in with my phone number and an SMS code, so that I can use Mazao at all.
14. As a Chama treasurer, I want a report I can verify came from Mazao and wasn't edited, so that I can trust it when deciding a loan.
15. As a microlender, I want the merchant to choose exactly what I can see and for how long, so that I get evidence without unlimited access to their data.
16. As a kiosk owner, I want to grant and revoke a lender's access to a verified report, so that I stay in control (DPA).
17. As a product owner, I want the week-4 debrief to measure how much the missing loan ledger hurts, so that Mikopo is built only if it matters (Q-007).
18. As a product owner, I want to know the real cost of +254 SMS on Clerk, so that phone OTP doesn't break the free-tier promise (D-003, Q-005).
19. As a product owner, I want a native speaker to check every Kiswahili string, so that the translation earns trust instead of losing it (Q-006).
20. As a product owner, I want a pricing hypothesis tested with real Chamas and lenders before any build, so that monetisation doesn't damage merchant trust.
21. As a developer, I want roles enforced on the server in `requireMember()` and in the commit service, so that hiding a screen is never the only control.
22. As a developer, I want multi-account phones to keep each account's local database and PIN fully separate, so that one account can never read another's records.
23. As a developer, I want a Kiswahili speech-model test with the same harness as phase 8, so that Kiswahili voice ships only on evidence.
24. As a developer, I want any loan ledger to keep Faida Halisi rules intact (principal is never income or expense), so that profit stays honest (D-014).

## Implementation Decisions
Not decided. These are the likely shapes, for discovery to confirm or reject:

- **Roles:** the `business_members.role` CHECK gains `attendant` (D-016 anticipated this). One profile per business is relaxed for attendants (the R0 unique `profile_id` constraint means one business per profile; attendants of several businesses would need it changed). The permission matrix is one pure domain function, used by the server route guard and the client UI. Rows already carry `created_by`, so no data migration is needed.

```ts
type Role = 'owner' | 'attendant';
type Permission = 'record' | 'void_own' | 'void_any' | 'view_profit' | 'view_supplier_deni' | 'export' | 'manage_members' | 'delete_business';
```
- **Pull scoping for attendants:** attendants may need a reduced pull (for example no purchases or supplier rows), which changes the phase 10 pull contract. To be decided.
- **Multi-account phones:** the device database already keys accounts by `profileId`; the lock screen gains an account picker; LockGuard and the sync engine are generalised from the single-account rule (D-039) to "flush only the business of the Clerk user currently signed in".
- **Kiswahili:** a second dictionary with the same keys, chosen per profile `preferred_language` (already on `businesses`, spec §13). Market words stay untranslated (D-005).
- **Mikopo:** probably new transaction types `loan_received` and `loan_repayment` (principal and interest split), a `lenders` party table or lender as a supplier kind, and cash-flow-only effects. Supersedes D-009 if built.
- **Phone OTP:** a Clerk configuration change plus sign-in UI; D-022 superseded.
- **Verified reports:** a server-generated report from phase 10 recomputed data, with a signed hash and a short verification code; access grants with expiry. Needs a privacy review and possibly ODPC advice (Q-001).

## Testing Decisions
Discovery work is validated with evidence, not code tests: debrief notes, interview counts, cost quotes, and a native-speaker review. When themes become build specs, they follow the same seams as earlier phases:
- **Roles:** route tests that every write and pull path enforces the permission matrix (an attendant token can't pull supplier rows or void others' records); domain table tests of the permission function.
- **Multi-account:** local-API tests that two accounts on one fake IndexedDB never see each other's rows, and that sync never flushes account A's queue with account B's Clerk session (extends AC-22).
- **Kiswahili:** an i18n test that every English key has a Kiswahili value and that market words are untouched; Playwright snapshots of titles in both languages; a Kiswahili speech-model harness with its own WER bar.
- **Mikopo:** domain tests that loans never change Sales, COGS or Faida Halisi except interest expense, extending the DOMAIN.md worked example.
- **Verified reports:** route tests that a verification code reveals only what the merchant granted and expires on time.

## Out of Scope
Until discovery promotes a theme to its own phase, nothing here is built. Also excluded even after discovery unless a new decision says otherwise:
- M-Pesa API integration and SMS parsing, payroll, tax, native apps, barcodes, forecasting (PRD §5.2).
- Selling or sharing merchant data with lenders without explicit per-report consent.
- Paid tiers that remove core bookkeeping from the free product (D-003).

## Further Notes
- **Owner decisions needed per theme:**
  - **Roles:** what attendants may see and do; Clerk Organizations or Mazao tables (D-017); pricing impact on Clerk MAU limits (R-009).
  - **Multi-account:** whether to restore D-025 as written; how a shared phone is unlocked safely.
  - **Kiswahili:** priority versus other themes; who the native-speaker reviewer is (Q-006); whether Sheng is in scope for voice.
  - **Mikopo:** the Q-007 debrief result; which lenders matter (Chama, M-Shwari, Fuliza, M-KOPA are ASSUMPTIONS from spec §16).
  - **Phone OTP:** the Clerk +254 SMS cost and who pays (Q-005, D-003).
  - **Monetisation:** who pays (merchant, Chama or lender); what "verified" means legally; ODPC position (Q-001, R-006).
- **Discovery inputs:** week-1 and week-4 debrief questions in the pilot debrief doc, pilot usage numbers from phase 10 observability, and the Kiswahili title check.
- **Risks:** R-005 (no email) drives phone OTP; R-006 (DPA) drives verified reports and attendants' access; R-007 drives the Kiswahili voice test; R-009 (free tiers) applies to SMS and more members.
- ASSUMPTION: themes would be prioritised from debrief evidence. A plausible order is phone OTP, roles, Kiswahili UI, multi-account, Mikopo, monetisation, but this is not decided.
