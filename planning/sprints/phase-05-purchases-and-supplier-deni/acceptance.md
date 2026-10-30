# Phase 5: Manunuzi and Deni la Wasambazaji — Acceptance Criteria

**Release:** R1 | **Milestone:** R1 Manunuzi | **Depends on:** Phases 1–4 (R0 pilot complete)

---

## Acceptance IDs

Each AC is verified by the `qa` agent with recorded evidence (Playwright videos, test outputs, manual checks). A PR is accepted only when its ACs pass.

---

### AC-01: Domain Core (Step 5.1)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-01.1** | `TxnType` includes `"purchase" | "supplier_payment"` | TypeScript compiles; `domain/types.ts` diff shows additions |
| **AC-01.2** | `DraftPurchase` and `DraftSupplierPayment` schemas validate correctly | Vitest: valid drafts parse; invalid drafts (negative money, >3 decimals qty, missing supplier on credit purchase) fail |
| **AC-01.3** | `supplierOwed` returns correct balance | Unit test: opening 5,000 + purchase 8,000 paid 2,000 + payment 1,000 = 10,000 owed; void reverses |
| **AC-01.4** | `openSupplierDeni` FIFO matches `openDeni` algorithm | Unit test: two credit purchases (3,000 then 4,000), payment 5,000 → open = 2,000 on second purchase; overpayment 1,000 carries forward |
| **AC-01.5** | `stockOnHand` includes purchase goods lines | Unit test: opening 10, purchase 5, sale 3 → 12; void purchase → 7 |
| **AC-01.6** | `rangeSummary` moneyOut = purchase paid + supplier payments + expenses by method | Unit test: cash purchase 3,000 + M-Pesa supplier payment 1,000 + cash expense 500 → cashOut 3,500, mpesaOut 1,000 |
| **AC-01.7** | `DENI_NEEDS_SUPPLIER` is hard error (throws with `override: true`) | Unit test: credit purchase without supplier → `CommitError` with code `DENI_NEEDS_SUPPLIER`; `override: true` still throws |
| **AC-01.8** | `BUYING_PRICE_CHANGED` fires when line price ≠ item.buyingPrice by > threshold | Unit test: item.buyingPrice 2,500, line 2,800, threshold 30% → warn; threshold 10% → block |
| **AC-01.9** | `POSSIBLE_DUPLICATE` fires for purchase/supplier_payment with same supplierId, type, total within 10 min | Unit test: two cash purchases same supplier, same total, 5 min apart → warn; 15 min apart → no fire; no supplierId → no fire |
| **AC-01.10** | `SUPPLIER_OVERPAID` warns when payment > owed | Unit test: owed 2,000, payment 3,000 → warn; payment 2,000 → no fire |
| **AC-01.11** | Operating profile parses old profiles with defaults for new fields | Unit test: profile without `supplierDefaultDueRule` / `buyingPriceChange` → defaults applied |
| **AC-01.12** | Extended worked example passes | Vitest: R0 day + purchase 2 gunia @ 2,800 paid 3,000 cash, supplier Mzee Kariuki → Sales 35,000, COGS 9,000, Expenses 5,000, Faida 21,000; cashOut 8,000; supplier owed 2,600 |
| **AC-01.13** | Domain test coverage ≥ 90% lines | `pnpm test domain --coverage` |

---

### AC-02: Local Commit + Queries (Step 5.2)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-02.1** | `commitPurchase` creates supplier (if new), updates item buyingPrice, writes txn + lines + queue in one Dexie transaction | Vitest fake-indexeddb: count rows after commit = 1 supplier (if new) + 1 item update + 1 txn + N lines + queue entries in parent order |
| **AC-02.2** | Failed `commitPurchase` leaves no rows | Vitest: throw in Grill → all tables empty |
| **AC-02.3** | `override: true` stores block codes but throws for `DENI_NEEDS_SUPPLIER` | Vitest: credit purchase no supplier, override=true → still throws CommitError |
| **AC-02.4** | `commitSupplierPayment` writes payment + queue in one transaction | Vitest: row counts correct |
| **AC-02.5** | `commitVoid` on purchase reverses stock; negative stock triggers `NEGATIVE_STOCK` | Vitest: stock 3, void purchase of 5 → stock -2, override saves with `NEGATIVE_STOCK` code |
| **AC-02.6** | `useTodayPurchases` returns today's purchases with voided flag | Vitest + Playwright: matches domain `withVoided` |
| **AC-02.7** | `useSuppliersWithBalance` returns suppliers with owed>0 or credit, overdue first then by amount | Vitest: sort order correct |
| **AC-02.8** | `useSupplierLedger(id)` returns all records with running balance | Vitest: running balance matches manual calculation |
| **AC-02.9** | `useSuppliersDueThisWeek` returns suppliers with deni due within 7 days | Vitest: due date logic correct (Africa/Nairobi day) |
| **AC-02.10** | `useRecentSuppliers(n)` returns most recent n suppliers used in purchases | Vitest: order by latest purchase occurredAt |
| **AC-02.11** | `useRangeSummary(range)` returns correct figures for arbitrary range | Vitest: matches `rangeSummary` domain function |

---

### AC-03: Purchase Screens (Step 5.3)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-03.1** | `/manunuzi/new` loads offline, shows supplier chips, goods line editor, payment section | Playwright: cold offline route check |
| **AC-03.2** | New purchase with supplier, goods lines, partial payment saves; stock updates; supplier deni appears | Playwright: 2 gunia viazi @ 2,800, supplier Mzee Kariuki, paid 3,000 cash → `/manunuzi` shows it; `/debts/supplier` shows owed 2,600; `/items` shows stock +2 |
| **AC-03.3** | Credit purchase (paid 0) requires supplier (hard error blocks Save) | Playwright: attempt save without supplier → Save disabled, error shown; override not offered |
| **AC-03.4** | "Deni (I owe)" chip sets paid=0, paymentMethod=null | Playwright: select chip → paid shows 0, method shows "—" |
| **AC-03.5** | Due-date chips appear when remainder > 0 | Playwright: partial payment → due chips (kesho, ijumaa, wiki_ijayo, mwisho_wa_mwezi) shown |
| **AC-03.6** | Inline item creation works (like sale form) | Playwright: add new item in line editor → item saved, available for next line |
| **AC-03.7** | Buying price change warning shows both prices | Playwright: item.buyingPrice 2,500, enter 2,800 → warning "Viazi cost KES 2,800, up from KES 2,500 last time" |
| **AC-03.8** | Duplicate warning fires within 10 min for same supplier + total | Playwright: same purchase twice in 5 min → warn; 15 min → no warn |
| **AC-03.9** | `/manunuzi` list shows today's purchases with void; void reverses stock & deni | Playwright: void purchase → list updated, `/items` stock -2, `/debts/supplier` balance reversed |
| **AC-03.10** | All strings through `t()`; Kiswahili keys exist in `sw.ledger.ts` | Grep: no hardcoded strings in new files; `sw.ledger.ts` has all new keys |

---

### AC-04: Supplier Debt Screens (Step 5.4)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-04.1** | `/debts/supplier` loads offline, shows total owed, due this week, rows overdue first | Playwright: cold offline route check |
| **AC-04.2** | Row left bar: Maize (owed), Tomato (overdue) | Playwright: visual check |
| **AC-04.3** | Tap row → `/debts/supplier/ledger?id=` | Playwright: navigation works |
| **AC-04.4** | Ledger shows running balance right-aligned, "Brought forward" labels, voids struck through | Playwright: visual + data check |
| **AC-04.5** | "Pay supplier" sheet: amount, method, M-Pesa ref, new-balance preview accurate | Playwright: pay 1,000 cash → preview shows new balance; confirm → ledger updated, balance correct |
| **AC-04.6** | Overpay leaves supplier in credit (negative balance shown) | Playwright: owed 2,000, pay 3,000 → balance -1,000 (credit) |
| **AC-04.7** | Empty state: "You don't owe any supplier." | Playwright: fresh business → empty state shown |
| **AC-04.8** | Zaidi / More sheet includes "Deni la Wasambazaji / Supplier debt" | Playwright: open drawer → item present |
| **AC-04.9** | All strings through `t()`; Kiswahili keys exist | Grep check |

---

### AC-05: Muhtasari & Today Report (Step 5.5)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-05.1** | Muhtasari shows supplier deni total (sum of all supplierOwed) | Playwright: matches domain calculation |
| **AC-05.2** | Muhtasari shows "Due this week" amount (Maize) | Playwright: matches `supplierDueWithin(txns, today, 7)` |
| **AC-05.3** | Muhtasari shows money out (cash/mpesa/other) next to money in | Playwright: visual layout check |
| **AC-05.4** | Muhtasari shows "New purchase" quick action for goods/both profiles | Playwright: profile sells goods → button present; services only → hidden |
| **AC-05.5** | Today report chronological list includes purchases & supplier payments | Playwright: entries appear in time order |
| **AC-05.6** | Today report totals include money out by method | Playwright: cash out, mpesa out shown |
| **AC-05.7** | Share summary text includes money-out line | Playwright: `navigator.share` / clipboard text contains money out |
| **AC-05.8** | Property test: Today totals = rangeSummary for today | Unit test: `useTodayReport` totals === `rangeSummary(nairobiDayRange(today))` |

---

### AC-06: Sync + Prisma (Step 5.6)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-06.1** | Prisma contract CHECK constraint accepts `purchase` and `supplier_payment` | `pnpm db:generate` succeeds; `contract.json` shows updated check |
| **AC-06.2** | Push idempotent: same batch twice → counts unchanged, `accepted` has all IDs both times | Route test against Neon dev branch |
| **AC-06.3** | Foreign `businessId` → 403 for whole batch | Route test |
| **AC-06.4** | Foreign `supplierId` with our `businessId` not overwritten (LWW with business guard) | Route test |
| **AC-06.5** | Wire conversion cents ↔ decimal string only in `sync/wire.ts` | Grep: no other cents/decimal conversions |
| **AC-06.6** | Manual: record purchase offline, reconnect → rows in Neon within 60s | Preview deploy test |
| **AC-06.7** | Manual: second browser profile same account → restore shows same supplier deni | Preview deploy test |

---

## Global Acceptance (Sprint Close)

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-GLOBAL-1** | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass | CI green |
| **AC-GLOBAL-2** | Full Playwright suite passes against `pnpm build && pnpm start` | `pnpm e2e` green |
| **AC-GLOBAL-3** | Cold-offline route check passes for all new routes | Playwright: `/manunuzi`, `/manunuzi/new`, `/debts/supplier`, `/debts/supplier/ledger?id=...` |
| **AC-GLOBAL-4** | No regressions in R0 ACs (sales, expenses, debts, items, Muhtasari, Today, onboarding, PIN, sync) | `pnpm e2e` includes R0 specs |
| **AC-GLOBAL-5** | All new i18n keys present in both `en.ledger.ts` and `sw.ledger.ts` | TypeScript compiles (sw typed against en) |
| **AC-GLOBAL-6** | Service worker precaches all new static routes | `pnpm build` → `sw.js` precache manifest includes new routes |

---

## Evidence Package (Product Owner Review)

The `qa` agent delivers a single comment on the sprint's tracking issue with:

1. **Playwright videos** for AC-03, AC-04, AC-05 (offline journeys)
2. **Test output** for AC-01, AC-02, AC-06 (Vitest + route tests)
3. **Manual check screenshots** for AC-06.6, AC-06.7 (Neon data)
4. **CI log** showing all pipelines green
5. **Coverage report** showing domain ≥ 90%

The `product-owner` agent accepts the sprint when all ACs have ✅ evidence.