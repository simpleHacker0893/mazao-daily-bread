# Phase 10: Mtandao and sync hardening (network map, server recompute, conflict observability)
> Release: R6 · Milestone: R6 Mtandao and sync (sprint 007) · Depends on: phases 1-4 (R0 sync), phase 5 (suppliers), phase 6 (jobs), phase 7 (period ranges, ledgers) · Label: ready-for-agent

## Problem Statement
**Mtandao.** A merchant's business is a web of relationships: the regulars who buy daily, the supplier who gives credit, the item that brings most customers. Lists and reports show these one at a time. Merchants and the people who back them (a Chama, a lender) can't see at a glance who the business depends on and where its deni is concentrated. D-010 promises a read-only map built from local data that works offline.

**Sync hardening.** R0's sync is deliberately minimal: idempotent push, a pull used only for restore, last-write-wins on client clocks (D-020), and balances computed only on the phone (D-019). Spec §10 says the server is the source of truth and recomputes derived values, and the pilot success measure is "100% of offline records reach the server within 24 h of reconnecting" (spec §12). Today we can't prove that measure, and several failure modes are invisible:
- a queue entry stuck on a validation error retries forever;
- a master-data update loses a last-write-wins race silently because a phone's clock was wrong;
- an incremental pull filtered on client `created_at` would miss records that were created offline earlier but pushed later;
- there is no way to detect that the phone and the server disagree about a customer's deni.

## Solution
**Mtandao / Network** (spec §7.3, stitch-prompts §9.1), read-only and offline:
- The business sits at the centre; customers (filled circle), suppliers (outlined circle) and items (square) are the nodes. Lines show selling and buying links, with thickness by money in the period and a Tomato ring for open deni.
- Period chips: This week, This month, All time. The map shows the top ~50 nodes by activity and groups the rest as "+N more".
- Tapping a node opens a sheet ("Otieno Ouma bought KES 5,600 this month and owes KES 1,200. Top item: Mayai.") with "Open ledger". Zoom and centre controls.
- An accessible list view shows the same data as a table, for screen readers and the weakest phones.

**Sync hardening:**
- **Server recompute:** the same pure domain functions run on the server over the server ledger. A reconciliation check compares per-party balances, stock and ID-set digests with the phone's, and repairs gaps by re-queueing local rows or pulling missing server rows.
- **Server-received cursor:** every synced row gets a server-stamped `received_at`, and incremental pull pages on it, not on client timestamps.
- **Conflict reporting:** push returns which master-data updates lost last-write-wins, and the phone pulls the winning version.
- **Dead-letter handling:** rows rejected for validation are quarantined with a "needs attention" state, not retried forever.
- **Backup health:** a panel in Mipangilio and content-free server logs and metrics, so the team can prove the spec §12 measure.

## User Stories
1. As a kiosk owner, I want to see my business at the centre with my customers, suppliers and items around it, so that I understand who my business depends on.
2. As a mama mboga, I want the thickest lines to show where most money flows this month, so that I know my most important customers and suppliers.
3. As a kiosk owner, I want customers who owe me marked with a red ring, so that I see where my deni is concentrated.
4. As a mama mboga, I want to tap a customer and see what they bought, what they owe and their top item, so that I can decide whether to keep giving credit.
5. As a kiosk owner, I want to open a supplier's ledger from the map, so that I can go from the picture to the details in one tap.
6. As a kiosk owner, I want to switch the map between this week, this month and all time, so that I can see changes over time.
7. As a mama mboga on a 3 GB phone, I want the map to stay smooth by showing the top 50 and grouping the rest, so that the app doesn't freeze.
8. As a merchant using a screen reader or a slow phone, I want a list view of the same relationships, so that I get the information without the graph.
9. As a merchant, I want the map to work offline, so that it's useful at the stall.
10. As a Chama treasurer, I want to see that a merchant's sales are spread across many customers rather than one, so that I can judge the risk of a loan.
11. As a mama mboga, I want to be sure every record I made offline reached the backup, so that I never lose my books (R-002).
12. As a kiosk owner, I want the app to tell me plainly if a record couldn't be backed up and what to do, so that problems don't stay hidden.
13. As a merchant, I want my phone and the backup to agree on every customer's deni, so that a restore on a new phone shows the same numbers.
14. As a merchant whose phone clock was wrong, I want my latest edit to an item not to be silently lost, so that prices stay right.
15. As a merchant, I want a "Backup health" screen with the last successful backup time and anything waiting, so that I can check before changing phones.
16. As a developer, I want incremental pull to page on a server-stamped time, so that rows pushed late are never skipped.
17. As a developer, I want push to report last-write-wins losses, so that the client can fetch the winning version instead of showing stale data.
18. As a developer, I want rows rejected for validation quarantined with their error code, so that one bad row doesn't block the queue or retry forever.
19. As a developer, I want a reconciliation endpoint that returns balances and ID-set digests computed by the same domain code as the client, so that drift is detected objectively.
20. As a developer, I want server logs and metrics to contain counts, IDs and timings only, never record contents or phone numbers, so that the AGENTS privacy rule holds.
21. As a product owner, I want a dashboard of queue age, sync success and reconciliation mismatches across pilot businesses, so that I can report the spec §12 "100% within 24 h" measure.
22. As a product owner, I want the map designed with restraint (no decorative network art), so that it reads as a tool, not a screensaver.
23. As a developer, I want the graph library loaded only on the Mtandao route, so that the rest of the app stays small on 3 GB phones.

## Implementation Decisions

### Mtandao (client only, D-010)
- Domain function `buildNetwork(period, data, { maxNodes: 50 })` returns nodes and edges:

```ts
type NetNode = { id: Id; kind: 'business' | 'customer' | 'supplier' | 'item' | 'group';
  label: string; volume: Cents; owes: Cents /* customers: positive deni; suppliers: what we owe */; groupedCount?: number };
type NetEdge = { from: Id; to: Id; direction: 'sells_to' | 'buys_from' | 'item_flow'; volume: Cents };
```
  Volume = confirmed sale or purchase totals in the period (voids excluded); `owes` = current balance (not period-bound). Ranking is by volume; the remainder collapses into one group node per kind.
- Rendering: a lightweight graph library, the builder's choice (spec §4), dynamically imported. The layout is computed in a worker or with a node-count cap so the main thread stays responsive. Legend uses shapes, not decorative dots (stitch-prompts §9.1).
- Routes (static, D-041, precached): `/mtandao`, with the list view as `/mtandao?view=list`. Node taps route to the existing ledgers: `/debts/customer?id=`, the phase 5 supplier ledger, and the phase 6 item page.
- Zaidi adds Mtandao / Network. Empty state: "Record a few sales and purchases to see your network." This empty state may use the one header illustration allowed; the map itself has no imagery.

### Sync hardening
- **Schema changes vs R0:** every synced table (customers, suppliers, items, jobs, merchant_settings, transactions, transaction_items) gets `received_at timestamptz not null default now()`, set by the server on insert and on every accepted master-data update, and indexed on `(business_id, received_at)`. A new table `sync_events(id, business_id, kind, table_name, row_id, code, created_at)` records conflicts and rejections with no contents. ASSUMPTION: 30-day retention.
- **Pull contract:** `GET /api/sync/pull?cursor=<opaque>` pages by `(received_at, id)` and returns `{ rows, nextCursor, hasMore }`. The R0 `since` parameter stays supported for restore (it becomes cursor zero).
- **Push contract** (extends R0):

```ts
type PushResult = {
  accepted: Id[];                                  // as R0: every ID applied or already present
  staleMasterData: { table: string; id: Id }[];    // LWW lost: server row newer; client should pull it
  rejected: { table: string; id: Id; code: 'SCHEMA' | 'FK_MISSING' | 'TENANT' }[]; // never retried automatically
};
```
  Today the whole batch is rejected on any failure. Rejection becomes per-row, except tenancy violations, which still fail the whole batch with 403 (R0 rule).
- **Client engine:** rejected rows move to a quarantine state with their code, shown in Backup health with "Send to support" (a content-free diagnostic code) and, for `FK_MISSING`, an automatic re-queue of the missing parent. `staleMasterData` triggers a targeted pull. A periodic incremental pull runs after a successful push (ASSUMPTION: at most every 15 minutes) so the phone converges with server truth.
- **Clock skew:** the push request carries the client's current time; the server records the skew in `sync_events` when it is over 5 minutes (ASSUMPTION threshold), and the Backup health panel warns "Your phone's clock looks wrong". Last-write-wins stays on `updated_at` (D-020); only observability is added, unless P10-B decides otherwise.
- **Server recompute (D-019):** the `domain` package runs on the server unchanged (pure TypeScript, cents). The route `GET /api/sync/reconcile` (`requireMember()`) returns per-customer balance, per-supplier owed, per-item stock, and per-table digests (count plus a hash of sorted IDs per month). The client computes the same locally. Mismatch handling:
  - an ID missing on the server → re-queue the local row;
  - an ID missing locally → pull it;
  - same IDs but different totals → log a `sync_events` mismatch for the team (that would be a domain bug) and show nothing alarming to the merchant.
  Derived values are never stored on the server (D-019); the route computes on demand. Runs after a full queue drain, at most daily (ASSUMPTION).
- **Observability:** structured server logs with business ID, table, counts, codes and durations only. A team-only page or query pack reports per-business oldest-unsynced age, last push, quarantine count and reconcile mismatches, to measure spec §12. Free-tier limits apply (D-003, R-009).
- **Session expiry:** Clerk session expiry already maps to "Sign in to back up" (R0); Backup health adds the time since the last successful push.

### Screens
- `/settings/backup` "Hifadhi / Backup" health panel (stitch-prompts translation table): last backup time, records waiting, quarantined records with plain-English reasons, clock warning, and "Back up now".
- Design: Operate mode, core tokens, Tomato only for genuinely failed records; no charts here.

## Testing Decisions
- Good tests check convergence and what the merchant sees, not retry timings or library internals.
- **Primary seam: the sync routes** (push, pull, reconcile) against a Neon dev branch, driven by a scripted client using the real local engine with fake IndexedDB, because convergence is the behaviour that matters.
- Tests:
  - A row created offline on day 1 and pushed on day 3 is returned by an incremental pull whose cursor is after day 1 (the bug this phase fixes).
  - A master-data push with an older `updated_at` is reported in `staleMasterData`; the client pulls and ends with the server version.
  - A schema-invalid row is rejected per-row, the rest of the batch is accepted, and the queue drains except the quarantined row.
  - Reconcile: delete a server row behind the client's back → the client re-queues it → digests match. Remove a local row → the client pulls it → balances match.
  - Server and client `customerBalance` agree for the DOMAIN.md worked example and the phase 5 and 6 scenarios (prior art: AC-03, AC-04, AC-11).
  - Logs captured during the suite contain no customer names, amounts or phone numbers.
- **Domain tests:** `buildNetwork` ranks, groups beyond 50, excludes voids, and sets `owes` correctly; period boundaries in Africa/Nairobi.
- **Playwright on the built app:** offline, open Mtandao, tap a node, open the ledger; the list view renders the same top customer; the cold-offline route check is extended to `/mtandao` and `/settings/backup`.
- Manual: Mtandao on a 3 GB phone with 200 customers stays responsive (interaction under 200 ms, ASSUMPTION target).

## Out of Scope
- Editing anything from the map, social features, sharing the map.
- Multi-device live sync, CRDTs, field-level merge (D-020 stays last-write-wins per row).
- Server-stored balances or materialised reports.
- Lender or Chama access to a merchant's data (phase 11).
- Background Sync API reliance (not dependable on all target phones); triggers remain as in R0.

## Further Notes
- **Decisions the architect must record before building:**
  - **P10-A:** `received_at` on all synced tables and the cursor-based pull contract (refines D-020).
  - **P10-B:** whether last-write-wins should use server receive time instead of client `updated_at` when skew is detected.
  - **P10-C:** per-row rejection and quarantine semantics in push (refines R0 batch rejection, keeping 403 for tenancy).
  - **P10-D:** the reconcile digest format and schedule; `sync_events` retention.
  - **P10-E:** the graph library choice and the 50-node cap.
- **Open questions:** none of Q-001 to Q-007 block this phase. Q-001 affects `sync_events` retention wording.
- **Risks:** R-002 (lost records) is the reason for this phase; R-009 (free-tier compute for reconcile and pull); R-010 (stale service worker after the pull contract changes, so keep the `since` parameter working for one release). Per the STATE cut order, Mtandao is cut first if time runs short; sync hardening is never cut.
