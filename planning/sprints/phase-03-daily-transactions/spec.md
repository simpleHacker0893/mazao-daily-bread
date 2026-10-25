# Phase 3: Recording daily transactions
> Release: R0 (pilot) · Milestone: R0 pilot, Gikomba, Mon 2026-10-26 · Blueprint steps: B3 (sprint 001), building on B1 and B2 · Depends on: Phase 0 (shell, bottom nav, PageTitle, tokens), Phase 1 (domain core, local commit service and queries, PIN, sync) · Label: ready-for-agent

## Problem Statement

A Gikomba merchant's day is a stream of small money events between customers: three kilo of sukuma wiki for cash, a tray of mayai on M-Pesa, a delivery trip, a regular who takes goods on deni until Friday, ushuru at the gate, a customer paying back part of last week's deni, and the occasional mistake that has to be undone. Today she writes these in a school exercise book, or not at all, and at night she cannot say what she earned, who owes her, or how much stock is left.

For Mazao to beat the notebook, every one of these events must take seconds to record with one hand, work with no signal, and never silently produce a wrong number. Deni must always belong to a named customer, or it vanishes from tracking (D-038). Stock must go down when goods are sold, but services such as trips and repairs have no stock (D-006). A wrong entry cannot be edited away, because confirmed records are immutable (D-018); it must be voided and re-entered, visibly. Unusual entries (selling below cost, a price far from usual, stock going negative, a likely duplicate) should be questioned but never refused, because the merchant knows what really happened (D-027).

## Solution

Phase 3 delivers the ledger screens of blueprint B3, all reading from and writing to the phone only (Dexie) through the single save path:

- **Bidhaa / Items** (RQ-6): items grouped by kind, goods showing stock on hand and a low-stock marker, and an "Add item" sheet. Items can also be created inline from the sale form.
- **Mauzo Mapya / New sale** (RQ-7): one or more lines (goods and services mixed), fractional quantity where the item allows it, prefilled editable price, payment method chips (cash, M-Pesa, other), amount paid defaulting to the total, optional M-Pesa reference. If paid is less than total, the remainder is deni: a customer is required and due-date chips appear with the profile default preselected.
- **Mauzo / Sales** (RQ-7): today's list with time, items, total and a deni badge; a detail sheet with Void.
- **Gharama Mpya / New expense and Gharama / Expenses** (RQ-8): amount, category chips from the profile plus "Add category", payment method, note, date; today's list with Void.
- **Deni la Wateja** (RQ-9): customers with a balance above 0, overdue first then by amount, totals on top; the customer ledger with a running balance; Record payment.
- **Grill rules in the UI** (RQ-11): hard stops disable Save with the reason; warnings show inline above Save; a rule set to `block` asks for a second "Save anyway" tap and stores the override on the record.

**A full Gikomba day in Mazao** (the shape the screens are designed around; amounts are illustrative):

1. 06:30, before opening. Mama Wanjiku already brought in her notebook (Phase 2): 10 tray mayai, 20 kilo sukuma wiki, Otieno owes 500. Bidhaa shows the stock.
2. 07:10. A walk-in buys 3 kilo sukuma wiki at KES 50. She taps "New sale", taps the sukuma wiki chip in Recent, sets 3, Cash is preselected, amount paid equals total, Save. Under 15 seconds. Stock drops to 17 kilo.
3. 07:40. A customer buys 2.5 kilo with the half-step button, pays on M-Pesa and reads out the code; she types it into "M-Pesa code (optional)".
4. 08:15. Her nephew does a delivery, "Trip Gikomba to Town" KES 200, M-Pesa. A service line: no stock moves, no cost of goods.
5. 09:00. Wanjiku (the customer) takes 1 tray mayai at KES 420, pays 100 cash. Paid is less than total, so the deni section opens: "Deni KES 320" in Maize, she picks Wanjiku from recent customers and taps "Ijumaa". Without a customer, Save stays disabled with "Choose who owes this" (D-038).
6. 09:30. She pays ushuru KES 50 cash at the gate: "New expense", Ushuru chip, Save.
7. 11:00. She sells mayai at KES 300 instead of 420. A Maize warning says the price is far from usual; she taps Save anyway (warn level does not need a second tap in the default profile) and it saves.
8. 13:20. Otieno pays 300 of his brought-forward 500 on M-Pesa: Deni, Otieno, Record payment, KES 300, M-Pesa. His balance shows 200 instantly.
9. 15:00. She realises the 07:40 sale was entered twice. She opens Mauzo, taps the duplicate, Void, confirms. It stays in the list struck through, marked "Voided", and its stock returns.
10. All day the phone may have no signal. Every save is on the phone first; the sync chip shows "Not backed up (n)" until the network returns, then "Backed up".

## User Stories

1. As a mama mboga, I want to open "New sale" from the Mauzo list or Muhtasari in one tap, so that I can record a sale while the customer is still in front of me.
2. As a mama mboga, I want my recent items as tap chips at the top of the picker, so that most sales need no typing.
3. As a kiosk owner, I want to add a new item from inside the sale form when it is not in my list, so that a new product does not stop the sale.
4. As a mama mboga, I want the unit price prefilled from the item and editable, so that I can record a bargained price.
5. As a mama mboga, I want to sell 2.5 kilo with a half-step button, so that fractional quantities are quick to enter for items that allow them (DOMAIN units, `allowsFractional`).
6. As a kiosk owner, I want items that do not allow fractions (like a tray or a piece) to accept whole numbers only, so that I cannot sell 1.5 crates by mistake.
7. As a boda rider, I want to record "Trip Gikomba to Town KES 200" as a service line, so that my income counts as sales without any stock (D-006).
8. As a repair fundi, I want one sale with a labour service line and a goods spare-part line, so that both count in Sales and only the part adds to cost of goods (D-014).
9. As a mama mboga, I want each line total and the sale total shown in big tabular figures (for example "Total KES 350"), so that I can read the amount back to the customer.
10. As a mama mboga, I want to pick Cash, M-Pesa or Other with one tap, with my usual method preselected from my profile, so that payment is one tap.
11. As a kiosk owner, I want an optional M-Pesa code field when I pick M-Pesa, so that I can match it to my M-Pesa messages later.
12. As a mama mboga, I want amount paid to default to the total, so that a normal cash sale needs no extra input.
13. As a mama mboga, I want the unpaid remainder to show as "Deni KES 320" in Maize as soon as paid is less than total, so that I see that this sale creates deni (DOMAIN: deni is the remainder, not a payment method).
14. As a mama mboga, I want a sale with deni to require a customer, with no way around it, so that no unpaid money is ever lost from my deni list (D-038).
15. As a mama mboga, I want to pick a recent customer or create one with just a name and an optional phone, so that recording deni takes seconds.
16. As a mama mboga, I want the customer picker to show existing names as I type, so that I do not create a second "Wanjiku".
17. As a mama mboga, I want due-date chips Kesho / Tomorrow, Ijumaa / Friday, Wiki ijayo / Next week, Mwisho wa mwezi / End of month, Pick date, with my profile default preselected, so that the due date is one tap.
18. As a mama mboga, I want Ijumaa on a Friday to mean next Friday, so that the due date is never today (blueprint B1 `resolveDueRule`).
19. As a kiosk owner, I want Save disabled with a clear reason if paid is more than the total, so that I never record more money than the sale (PAID_EXCEEDS_TOTAL, hard stop).
20. As a mama mboga, I want a warning when the stock of an item would go below zero, but still be able to save, so that a wrong stock count does not stop a real sale (NEGATIVE_STOCK, default warn, AC-06).
21. As a kiosk owner, I want a warning when I sell below my buying price, so that I notice a loss-making sale (BELOW_COST).
22. As a mama mboga, I want a warning when the price is more than 30% away from my usual price, so that I catch a typing mistake like 4200 for 420 (PRICE_VARIANCE).
23. As a kiosk owner, I want a warning when I record the same type, same customer and same total within 10 minutes, so that I do not double-record a deni sale (POSSIBLE_DUPLICATE).
24. As a mama mboga selling to walk-ins, I want no duplicate warning on two identical cash sales without a customer, so that a busy morning of identical sales is not interrupted.
25. As a kiosk owner whose profile is set to block negative stock, I want a "Save anyway" second tap when I oversell, and the record to remember it was saved with a warning, so that I can record reality and later see why (D-027, AC-08).
26. As a mama mboga, I want the sale to appear in today's list in under a second after Save, so that I trust it was recorded (AC-20).
27. As a mama mboga, I want today's sales list with time, items, total and a Maize "Deni: Wanjiku" badge, so that I can scan my day.
28. As a mama mboga, I want to tap a sale to see its lines, payment, customer, due date and any warnings it was saved with, so that I can answer a customer's question.
29. As a mama mboga who entered a sale twice, I want to void it with a confirm step, so that the mistake is reversed but the history stays (D-018).
30. As a mama mboga, I want a voided sale to stay in the list struck through and marked "Voided", so that I can see what was corrected.
31. As a mama mboga, I want voiding a sale to return its stock and remove its deni, so that my numbers are right after a correction.
32. As a kiosk owner, I want no Void button on a record that is already voided or on a void itself, so that I cannot double-reverse (blueprint B1 `canVoid`).
33. As a mama mboga who voided the wrong sale, I want to simply record it again as a new sale, so that correction is always "void plus new record".
34. As a mama mboga, I want to record an expense with a large amount field, a category chip, a payment method and an optional note, so that ushuru at the gate takes seconds.
35. As a kiosk owner, I want "Add category" for an expense type I pay often, so that it appears as a chip next time.
36. As a mama mboga, I want to change an expense date when I forgot to record yesterday's rent, so that it counts on the right day.
37. As a mama mboga, I want today's expenses listed with Void, so that I can correct a wrong expense the same way as a sale.
38. As a mama mboga, I want Deni la Wateja to list everyone who owes me, overdue first then the largest amounts, with the total owed and the overdue total at the top, so that I know whom to chase.
39. As a mama mboga, I want each deni row to show the name, balance and earliest due date, with a Tomato bar for overdue and Maize for not yet due, so that I see urgency at a glance, and the words "overdue" or "due kesho" so colour is not the only signal.
40. As a mama mboga, I want a customer's ledger with every deni sale, payment, brought-forward amount and void, each with a running balance, so that I can show the customer exactly how the amount was reached.
41. As a mama mboga, I want to record a payment from the deni list row, the customer ledger or Muhtasari, with amount, method and optional M-Pesa code, so that paying back deni is quick from wherever I am.
42. As a mama mboga whose customer pays more than they owe, I want Mazao to keep the extra as credit and say so, so that the next purchase is netted off (DOMAIN: negative balance means credit).
43. As a mama mboga, I want a customer who pays part of their deni to see the payment cover their oldest deni first, so that "overdue" reflects what is really still unpaid (FIFO, RQ-9).
44. As a mama mboga, I want to void a payment I recorded by mistake from the customer ledger, so that the balance goes back (AC-04: 300 paid 100 is 200, pay 150 is 50, void the payment is 200).
45. As a mama mboga, I want Bidhaa to list goods with stock on hand and a "Low" tag at or below my threshold, and services tagged "Service, no stock", so that I know what to restock.
46. As a merchant who does not read Kiswahili, I want every title in this phase bilingual (Mauzo / Sales, Mauzo Mapya / New sale, Gharama / Expenses, Gharama Mpya / New expense, Deni la Wateja / Customer debt, Bidhaa / Items), so that I always know where I am (D-040).
47. As a kiosk owner in a dead zone, I want every screen in this phase to work in airplane mode, including opening a customer ledger directly, so that signal never stops trade (AC-09, D-041).
48. As a mama mboga using TalkBack, I want amounts read as "KES 1,250", warnings announced when they appear, and Save's disabled reason read out, so that I can record sales without sight.
49. As a pilot coordinator, I want to enter the DOMAIN.md worked example and the deni scenario through these screens on a real phone and see exactly the expected numbers, so that I can sign off AC-03 and AC-04.
50. As a developer, I want screens to call only the commit and query APIs and never compute money, so that every number comes from tested domain functions (AGENTS.md "Pure numbers").

## Implementation Decisions

**Modules and interfaces**

- **UI primitives** (blueprint B3 task 1): Button, Chip, ChipGroup, MoneyInput (whole shillings in, integer cents out, D-013), QtyInput (fractional only when the item allows, at most 3 decimals, matching `numeric(14,3)`), Sheet, IssueList, SaveAnywayDialog, plus the PageTitle owned from Phase 0. Phase 2 and Phase 4 reuse these.
- **Pickers.** Item picker sheet: Recent (from the recent-items query), then search, then "Add new item" (opens the Add item sheet and returns the new item to the line). Customer picker: recent customers, search-as-you-type over existing names, "Create" with name plus optional phone via `upsertCustomer`. A new customer is written in the same Dexie transaction as the sale, before the txn (blueprint B2 parent order).
- **Save flow.** Every form follows one outcome model, which encodes D-026, D-027 and D-038:

  ```ts
  type SaveOutcome =
    | { kind: 'saved'; txnId: Id }
    | { kind: 'hard_error'; issues: Issue[] }      // SCHEMA, ARITHMETIC, PAID_EXCEEDS_TOTAL, DENI_NEEDS_CUSTOMER: never overridable
    | { kind: 'needs_override'; issues: Issue[] }; // block-level rules: second tap "Save anyway", codes stored in txn.overrides
  ```

  - A live grill preview runs `runGrill` on the draft as the merchant types (via the domain, never re-implemented in the page) and shows issues inline above Save. Hard errors disable Save and show the reason next to the field (for example "Choose who owes this" at the customer picker).
  - Warn-level issues are shown but Save works on the first tap (R0 default, AC-06).
  - Block-level issues: Save opens SaveAnywayDialog; "Save anyway" calls the commit again with `override: true`. The stored record carries the override codes (AC-08).
  - `DENI_NEEDS_CUSTOMER` with `override: true` still fails (AC-07).
- **Mauzo Mapya / New sale** calls `commitSale(draft, opts)`. Lines carry `itemId`, `itemKind`, quantity, unit and unit price; `unitCost` is stamped by the commit service from the item's buying price at confirm time, services 0 (D-015, D-006). `lineTotal = Math.round(qty * unitPrice)` everywhere (AGENTS.md "Money").
  - Payment method chips: cash, M-Pesa, other, filtered to the profile's payment methods. Deni is not a method; it is the unpaid remainder.
  - An "All on deni" shortcut sets amount paid to 0. ASSUMPTION: with nothing paid, `paymentMethod` is stored as null, which the B1 type allows; to verify against the frozen schemas.
  - When `amountPaid < totalAmount`: the deni section shows the remainder, requires a customer, and offers due chips (`resolveDueRule`, profile default preselected, or none if the profile has no default). "Pick date" stores a `YYYY-MM-DD` due date.
- **Mauzo / Sales list** reads today's sales (Nairobi day, `occurredAt`), newest first. Rows: time, item summary, total, method, Maize deni badge with customer name, struck-through "Voided" state, a small cloud-off icon while unsynced. Detail sheet shows the lines, payment, customer, due date, overrides ("Saved with a warning: stock") and Void when `canVoid` is true.
- **Void** calls `commitVoid(txnId)` after a confirm step ("Void this sale? It stays in your records, marked Voided. Stock and deni go back."). The void copies the party IDs so it shows in the customer ledger (blueprint B1 conventions). Voided originals stay visible. Correction is void plus a new record; there is no edit.
- **Gharama Mpya / New expense** calls `commitExpense`: amount, category chips from the profile plus "Add category" (ASSUMPTION: a new category is appended to the profile's expense categories via `saveSettings`), method chips cash, M-Pesa, other, optional note, date defaulting to now (an earlier date sets `occurredAt` to that Nairobi day). **Gharama / Expenses** lists today's expenses with Void (blueprint Cut 4 may drop this list; the form stays).
- **Deni la Wateja** reads customers with balance above 0. Sort: overdue first, then by balance descending. Header: total outstanding and overdue total (Tomato). Row: name, balance, earliest open due date from `openDeni`, a "Record payment" button.
- **Customer ledger** at `/debts/customer?id=<uuid>` (D-041; static route read through search params, precached). Shows balance ("Otieno owes you KES 1,200", Tomato only when overdue), then history newest first: date, what happened (sale on deni with items, payment with method and code, Brought forward tag, Voided rows struck through), amount and running balance. Void is offered on payment and opening-balance rows; sale rows open the sale detail.
- **Record payment sheet** calls `commitPayment({ customerId, amount, method, externalReference? })`. Quick chips: "All KES n" and round amounts below it. A preview shows the new balance from the domain. Overpaying shows "That's KES 100 more than Otieno owes. It will be kept as credit." and saves.
- **Bidhaa / Items** lists active items grouped Goods then Services. Goods rows: name, unit, selling and buying price, stock on hand (`stockOnHand`), a Maize "Low" tag at or below `lowStockThreshold`. Services: "Service, no stock". Add item sheet: kind toggle (services hide unit list beyond trip, job, piece; hide buying price, threshold and stock), name, unit chips, selling price, buying price and low-stock threshold for goods, "Can sell half units" switch. Calls `addItem`. No editing in R0.

**Data rules**

- Sales = confirmed sale lines (goods and services); COGS = goods lines at captured `unitCost`; payments, opening balances and stock adjustments are never sales (D-014).
- Customer deni from a sale = total minus paid, only with a customer (DOMAIN transaction table). Balances and stock are derived from the ledger, never stored (D-019).
- Overdue = oldest unpaid credit after FIFO allocation of payments has a due date before today in Africa/Nairobi (RQ-9). Credits with no due date are never overdue.
- One payment method per sale. A split cash and M-Pesa payment is recorded as the main method only. ASSUMPTION: acceptable for the pilot; flagged for the debrief.
- Confirmed transactions are immutable; IDs are client-generated UUID v4 (D-018). Every commit writes rows and sync-queue entries in one Dexie transaction; a failed commit leaves nothing (blueprint B2).
- The duplicate rule never fires without a set customer (RQ-11), so walk-in sales and expenses never trigger it.
- The unsynced count counts records, not lines, so one sale counts once (AC-16).

**Visual rules**

- Work screens: Chalk background, no photographs (Owner, 2026-10-24, imagery only in headers or empty states). Empty states ("No sales today yet.", "Nobody owes you money right now.", "Add what you sell, like sukuma wiki or a delivery trip.") may carry one small optimised photograph (AVIF or WebP, at most 150 KB) above the message.
- Manrope with tabular figures on every amount, "KES 1,250" format; Maize for deni, Tomato only for overdue, errors and destructive actions; Sukuma Green only for the primary action, active nav and focus; 8 px radius; 48 px targets; bilingual titles (D-040); no gradients, no em-dashes, no emoji.

## Testing Decisions

A good test checks external behaviour only: the numbers and rows the merchant would see, given the records she entered. It never asserts on component internals or on how a hook is wired.

**Seam 1, data behaviour (Vitest with fake-indexeddb):** the local commit and query API, the same calls the screens make.
- The DOMAIN.md worked example through `commitSale` and `commitExpense`, read back through the day summary query: Sales 35000, COGS 9000, Expenses 5000, Faida Halisi 21000 cents; cash 15000, M-Pesa 20000 (AC-03).
- Deni scenario: Wanjiku 300 paid 100 gives 200; payment 150 gives 50; void the payment gives 200, and the void appears in her ledger (AC-04).
- Opening stock 10 tray, sell 3 gives 7; sell 8 more saves with a NEGATIVE_STOCK warning under the default profile (AC-06).
- Deni with no customer throws even with `override: true` (AC-07). Seeded `negativeStock: 'block'`: overselling needs override and stores `['NEGATIVE_STOCK']` (AC-08).
- Service line: no stock change, cost 0. Fractional 0.5 kilo at 120 gives 60.
- Overpayment makes the balance negative and a later deni sale nets against it.
- Voiding a sale returns stock and deni; a second void is rejected.
- A sale with a new customer writes exactly one customer, one txn and n lines, queue entries in parent order.

**Seam 2, screens (Playwright against `pnpm build && pnpm start`, offline after unlock):** `e2e/ledger.spec.ts` per blueprint B3 Verify (worked example through the UI; Wanjiku 300/100 to 200; payment 150 to 50; void to 200 with the voided row; opening stock 10 sell 3 shows 7). Plus: the deni section blocks Save until a customer is picked; `/debts/customer?id=...` opens cold offline (AC-09).

**Performance:** on the 3 GB phone, new sale opens in under 2 s after unlock and a save appears in the list in under 1 s (AC-20), timed in A6.

**Prior art:** acceptance.md AC-03, AC-04, AC-06, AC-07, AC-08, AC-09, AC-20; blueprint B2 and B3 Verify; DOMAIN.md worked example (350 / 90 / 50 / 210) and deni scenario (200, 50, 200).

## Out of Scope

- Purchases (Manunuzi), supplier payments and the supplier ledger (R1).
- Stock adjustments beyond opening stock, stock counts, spoilage (R2). The Stitch Save anyway option "My stock count is wrong. Save and set stock to 2 trays" is not built in R0; only "Save anyway" is.
- Repair job cards (Kazi), deposits linked to jobs (R2).
- Editing items or transactions; "Repeat last sale"; prefilled re-entry after a void (cut, blueprint "Already cut").
- Split payments across two methods in one sale.
- Sales and expense lists for days other than today (Stitch shows Yesterday and This week chips; R0 is today only). Voiding an earlier day's sale is possible only from the customer ledger for deni sales.
- Deni list filters (Overdue, Due this week, Favourites), customer search, favourite toggling, call and "Share reminder" buttons on the ledger.
- Item favourites (RQ-7 says "recent and favourites first", but items have no favourite field in the frozen B1 types; R0 shows recent only).
- An "Undo" snackbar after save (Stitch 10.1); correction is Void, so a save never disappears silently.
- AI text or voice entry and the Review Card (R4, R5).

## Further Notes

- **Acceptance covered:** AC-03, AC-04, AC-06, AC-07, AC-08, AC-09 (ledger routes), AC-16 (offline recording and unsynced count), AC-20, AC-21 (titles in this phase).
- **Proposed new acceptance check** (numbered after Phase 4's AC-24 to AC-30 and Phase 2's AC-31 and AC-32):
  - **AC-33:** "Full Gikomba day" e2e: the ten steps of the Solution narrative run offline end to end, then Muhtasari and the Today report (Phase 4) agree with the expected totals, and Bidhaa stock and Deni balances match a hand-calculated sheet.
- **Questions:** Q-006 (Mauzo Mapya, Gharama Mpya titles need a native-speaker check). Q-007 (borrowed money unrecorded may make cash look wrong; watch at the debrief).
- **Risks:** R-001 (B3 is a 6-hour step; Cut 3 drops PRICE_VARIANCE and POSSIBLE_DUPLICATE, Cut 4 drops the Gharama list), R-003 (wrong numbers; mitigated by the single save path and domain tests), R-011 (Dev B owns these pages and `ui/*`).
- **Inconsistencies noticed:**
  - Stitch 3.8 shows "Deni" as a third payment segment; DOMAIN.md says deni is not a payment method. This spec uses cash, M-Pesa, other plus an "All on deni" shortcut.
  - Stitch 3.10 and 3.8 show only Cash and M-Pesa; DOMAIN.md and RQ-7/RQ-8 include "other".
  - Stitch 3.13 Add item has a "current stock" field; RQ-6 has none (opening stock comes from the notebook, Phase 2). ASSUMPTION: R0 omits it from Add item.
  - Stitch 10.2's "set stock to n" choice would need a stock adjustment outside R0.
