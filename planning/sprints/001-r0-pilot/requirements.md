# Sprint 001: R0 Pilot. Requirements

**Goal:** On **Mon 2026-10-26**, 5 Gikomba merchants can sign in, set a PIN, describe their business, bring in their notebook, and record a day of sales, expenses, deni and payments on their own phones. This has to work offline, never lose a record, and show a Faida Halisi they agree with.

**Question the pilot answers:** "Is Mazao faster than my notebook, and do the numbers match?"

**Team:** Dev A and Dev B, each working with Claude Code. Window: Sat 2026-10-24 afternoon → Mon 2026-10-26 07:00.

Relevant decisions: D-001…D-028, D-034…D-042 (D-038…D-042 supersede earlier ones where they conflict) (`planning/DECISIONS.md`). Terms: `planning/DOMAIN.md`.

## In scope

### RQ-1 App shell and install
- An installable PWA (manifest, icons, service worker). After the first load, every R0 screen opens with no network.
- Bottom navigation at every screen width (no sidebar in R0, D-040). Each item shows its Kiswahili label with a small English caption:
  - Muhtasari / Overview;
  - Mauzo / Sales;
  - Deni / Debts;
  - Gharama / Expenses;
  - Zaidi / More, which opens a drawer with **Bidhaa / Items** and **Mipangilio / Settings**.
- Every page title is bilingual: the Kiswahili title with the English translation beneath it (D-040).
- A top-bar chip shows sync state: `Backed up`, `Saving…`, `Not backed up (n)`, or `Sign in to back up`.
- All UI strings come from the i18n dictionary (D-005).

### RQ-2 First sign-in (needs internet)
- Clerk sign-in with **email one-time code** or **Google** (D-022). A plain-English privacy notice appears before sign-in and must be accepted (Q-001 interim).
- On success, the server creates a profile and a business with an owner membership, and returns their IDs. If the business already has data (new phone), the app restores it.

### RQ-3 PIN (D-023, D-024)
- A 4-digit PIN is required after the first sign-in. It's entered twice to confirm.
- Everyday unlock is email + PIN, online or offline. The app locks after 5 minutes in the background.
- Wrong-PIN backoff: after 5 failures, wait 30 s, doubling each time.
- **Forgot PIN:** needs internet. The merchant signs in with a Clerk email code, then sets a new PIN. Their local data is kept.
- **One merchant account per phone** in R0 (D-039). Forgot PIN signs out of Clerk first, so the email code is always required.

### RQ-4 Onboarding (tap-to-answer)
- The questions follow the PRD §8 rubric, cut down to R0 needs:
  - business name;
  - business type;
  - location;
  - sells goods, services or both;
  - up to 8 main items, each with kind, unit, fractional yes/no, selling price, and buying price (goods);
  - payment methods used;
  - gives deni yes/no and default due rule (kesho / Ijumaa / wiki ijayo / mwisho wa mwezi / none);
  - expense categories used.
- Each question shows one line on why it matters. Answers are chips or buttons wherever possible.
- **Skip** goes to Muhtasari with defaults, and onboarding can be resumed from Mipangilio. Progress is saved locally after every answer.
- Output: a Merchant Operating Profile (Zod-validated) stored in `merchant_settings`. The merchant reviews the profile on a summary screen before saving. The items they entered become Bidhaa.

### RQ-5 Bring in your notebook (D-011)
- After onboarding, and later from Mipangilio, the merchant can add:
  - opening customer deni: customer name, amount, optional due date;
  - opening supplier deni: supplier name, amount, optional due date;
  - opening stock per goods item.
- These show as "Brought forward" and are excluded from Sales, COGS, Expenses and Faida Halisi.

### RQ-6 Bidhaa (items)
- A list of items grouped by kind. Goods show **stock on hand** and a low-stock marker. There's an "Add item" form; editing items is not in R0:
  - `kind` (goods/service), name, unit, allows fractional;
  - selling price, plus buying price and low-stock threshold for goods.
- Services have no stock fields.
- Items can also be created inline from the sale form.

### RQ-7 Mauzo (sales)
- **New sale:**
  - one or more lines, each an item picker (recent items first, then search), quantity (fractional where the item allows), and unit price prefilled from the item and editable;
  - payment method cash / M-Pesa / other, and amount paid (defaults to the total);
  - optional M-Pesa reference.
- If paid < total, the remainder is **deni**: a customer is required (pick or create by name + optional phone), and a due date is offered as chips using the profile default.
- **Sales list for today:** time, items, total, deni badge. Tapping a sale shows its detail and a **Void** action.
- **Void** is a reversing record that needs a confirm step (D-018). The voided sale stays visible, struck through and marked "Voided".

### RQ-8 Gharama (expenses)
- New expense: amount, category chips (from the profile, plus "Add category"), payment method, note, date (default now).
- Expenses list for today. Void works the same way as for sales.

### RQ-9 Deni la Wateja
- A list of customers with balance > 0: overdue first, then by amount. Each row shows name, balance and earliest due date. Totals at the top.
- **Customer ledger:** every sale-on-credit, payment, opening balance and void, with a running balance.
- **Record payment:** amount, method, optional M-Pesa reference. The balance can go negative, which means the customer is in credit.
- Overdue means the oldest unpaid credit, with payments allocated FIFO, has a due date before today (Africa/Nairobi).

### RQ-10 Muhtasari (today)
- Today's Total Sales, COGS, Total Expenses and **Faida Halisi**.
- Money in by method: cash and M-Pesa (sale amount paid + customer payments).
- Totals for customer deni outstanding and supplier deni (opening balances only in R0).
- Top 5 customers who owe, and goods items at or below their low-stock threshold.
- Quick actions: **New sale · New expense · Record payment**.

### RQ-11 Grill rules on save (D-026, D-027)
- **Hard stops (can't be overridden):** schema invalid; arithmetic mismatch (line totals ≠ total; paid > total for a sale); **deni without a customer** (D-038).
- **Warn or block** (set per rule in the profile, default **warn** in R0):
  - stock going negative;
  - unit price below unit cost;
  - unit price more than 30% from the item's selling price;
  - same type + same customer + same total within 10 minutes (duplicate). This never fires for walk-in sales without a customer.
- Warnings appear inline above Save. **Block** needs a second tap, "Save anyway", and the override reasons are stored on the record.

### RQ-12 Offline and backup (D-018…D-021)
- Every confirmed record is written to IndexedDB first, together with a sync-queue entry in the same Dexie transaction. The UI updates immediately.
- Push to the server is idempotent and runs:
  - on start;
  - on the `online` event;
  - 5 s after a save;
  - every 60 s while online.
- It backs off exponentially, up to 5 minutes.
- The app requests persistent storage. If records stay unsynced for more than 3 days, a banner shows.
- Pull-restore runs on first sign-in on a new phone.

### RQ-13 Mipangilio
- Account email, change PIN, lock now.
- Re-run onboarding, Bring in your notebook.
- Sync status and a "Back up now" button, plus app version.

### RQ-15 Leo / Today report (D-047, Owner)
- Route `/today`, with the title "Leo" over "Today". It's reached from Muhtasari ("See everything today") and works offline.
- It lists every record of the Nairobi day in time order: sales, expenses, payments received, deni given, opening balances (under "Brought forward"), and voids (struck through).
- Totals reconcile exactly with Muhtasari.
- A per-customer section shows each customer active today: bought, paid, owes now.
- **"Share today's summary"** sends plain text (business name, date, Sales, Expenses, Faida Halisi, cash and M-Pesa in, deni given) through the Web Share API, falling back to copy. Customer names are left out by default.

### RQ-14 Pilot kit (docs, not code)
- `docs/pilot/install-guide.md`: Chrome → Add to Home screen → sign in → PIN, with screenshots added Sunday night.
- `docs/pilot/model-test-collection.md`: how to collect ~100 phrases and the noisy recordings (D-030).
- `docs/pilot/debrief.md`: the week-1 and week-4 questions, mapped to spec §12 success measures.

## Out of scope for R0
- Purchases, supplier payments, supplier ledger screen. Opening supplier deni is captured but not managed.
- Stock adjustments beyond opening stock, Kazi, Ripoti/PDF, read-back, export/delete.
- All AI and voice, Mtandao, roles.
- Server-side balance recomputation.
- Kiswahili UI text beyond the bilingual titles and labels.
- Multi-account phones, the ≥ 768 px sidebar, Repeat last sale, editing items (cut to fit the time; see the blueprint).
