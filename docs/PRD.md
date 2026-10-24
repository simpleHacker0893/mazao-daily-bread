# MAZAO — Product Requirements Document

> Offline-first, AI-powered business management PWA for Kenyan informal micro-merchants

## Document Control

| Item | Detail |
|---|---|
| Product name | Mazao |
| Document type | Product Requirements Document |
| Version | 1.1 |
| Date | 24 October 2026 |
| Status | Draft for review and implementation |
| Platform | Progressive Web App |
| Primary market | Kenyan informal micro-merchants |
| Primary languages | Swahili-first, English secondary |
| Document owner | Product / Engineering |
| Distribution | Internal product, design, engineering, QA |

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users and Personas](#3-target-users-and-personas)
4. [Product Goals and Success Metrics](#4-product-goals-and-success-metrics)
5. [Scope](#5-scope)
6. [Product Principles](#6-product-principles)
7. [Core Functional Modules](#7-core-functional-modules)
8. [Grill Agent Onboarding and Merchant Discovery](#8-grill-agent-onboarding-and-merchant-discovery)
9. [AI Intelligence Layer](#9-ai-intelligence-layer)
10. [Financial Summaries and Reporting](#10-financial-summaries-and-reporting)
11. [Technical Architecture](#11-technical-architecture)
12. [Offline-First Architecture](#12-offline-first-architecture)
13. [Security, Privacy, and Compliance](#13-security-privacy-and-compliance)
14. [Data Model and Database Schema](#14-data-model-and-database-schema)
15. [Implementation Plan](#15-implementation-plan)
16. [MVP Definition of Done](#16-mvp-definition-of-done)
17. [Risks and Mitigations](#17-risks-and-mitigations)
18. [Glossary](#18-glossary)
19. [Appendix A: Database Schema Reference](#19-appendix-a-database-schema-reference)

---

## 1. Executive Summary

Mazao is an offline-first, AI-powered business management Progressive Web App built for informal Kenyan micro-merchants such as mama mbogas, market traders, small retail shop owners, cereal sellers, fruit sellers, egg traders, and kiosk operators.

The product solves the friction of paper-notebook bookkeeping, unrecorded cash and M-Pesa flows, untracked customer debt, supplier debt, stockouts, and unclear profit. It is designed for the reality of intermittent or zero internet connectivity in local markets.

Mazao allows merchants to record sales, purchases, expenses, customer deni, and supplier deni using simple Swahili-first interfaces, voice input, and AI-assisted parsing. The system works offline first, stores records locally using IndexedDB, and syncs to Neon Serverless PostgreSQL when connectivity returns.

A key differentiator is the **Grill Agent**. The Grill Agent has two modes:

- **Onboarding Mode** — Interviews a new merchant to understand their specific business model, units, deni practices, expenses, reporting needs, and AI validation preferences.
- **Transaction Mode** — Validates parsed transactions against merchant-specific rules, historical data, and local vector memory before the merchant confirms the record.

Mazao does not auto-save AI-generated records. Every record must pass through an Interactive Review Card and be explicitly confirmed by the merchant using:

```text
[ ✅ Confirm & Save Record ]
```

Mazao provides daily summaries, low-stock warnings, customer deni tracking, supplier debt deadlines, Total Sales, COGS, Total Expenses, Net Profit known as **Faida Halisi**, downloadable PDF reports, and audio summaries.

## 2. Problem Statement

Informal Kenyan micro-merchants often manage their businesses using memory, paper notebooks, WhatsApp notes, or fragmented cash records.

This creates several problems:

- **Bookkeeping friction** — Recording every sale, purchase, and expense manually is slow and inconsistent.
- **Unrecorded cash and M-Pesa flows** — Merchants receive money through cash and M-Pesa but often do not separate sales, debt repayment, and personal money.
- **Customer deni is poorly tracked** — Many merchants give goods on credit and rely on memory or paper to remember who owes them.
- **Supplier debt is poorly tracked** — Merchants may receive stock on credit and fail to track urgent payment deadlines.
- **Stock is not visible** — Merchants may not know when stock is running low, leading to lost sales.
- **Profit is unclear** — Merchants may know cash in hand but not true profit after cost of goods and expenses.
- **Connectivity is unreliable** — Cloud-only apps fail in markets with poor network, expensive data, or zero connectivity.

Mazao addresses this by making record-keeping fast, local, offline-capable, voice-friendly, and trustworthy.

## 3. Target Users and Personas

### 3.1 Primary persona: Mama Mboga / Fresh Produce Trader

| Attribute | Description |
|---|---|
| Business type | Vegetable and fresh produce seller |
| Location | Market stall, roadside, estate |
| Units | kilo, fundo, ndume, tray, piece |
| Pain points | Customer deni, spoilage, low stock, unclear profit |
| Connectivity | Intermittent or offline |
| Device | Low/mid-range Android phone |

### 3.2 Secondary persona: Small Retail Shop Owner

| Attribute | Description |
|---|---|
| Business type | Kiosk or small retail shop |
| Products | Household items, snacks, soap, cooking oil, airtime |
| Payment methods | Cash, M-Pesa, occasional deni |
| Pain points | Too many items, supplier payments, mixed cash/M-Pesa |
| Need | Stock tracking, daily summary, monthly report |

### 3.3 Tertiary persona: Market Supplier / Wholesaler-lite

| Attribute | Description |
|---|---|
| Business type | Supplies smaller sellers |
| Pain points | Tracking goods given on credit |
| Need | Customer and supplier ledgers, due dates, payment tracking |

## 4. Product Goals and Success Metrics

### 4.1 Product goals

Mazao must:

- Make business recording faster than paper.
- Work offline after initial setup.
- Support Swahili and informal market language.
- Track customer deni and supplier deni separately.
- Provide clear daily and monthly profit.
- Prevent AI errors through human confirmation.
- Produce credible reports for personal use, Chama, and microfinance verification.
- Personalize onboarding for each merchant.

### 4.2 Success metrics

| Metric | Target |
|---|---|
| Merchant completes first confirmed record | Within 10 minutes including onboarding |
| Weekly retention after activation | 40% after 4 weeks |
| Offline record creation success | 95% |
| AI parse acceptance rate | 80% |
| Review correction rate | Less than 20% |
| Sync success after connectivity | 99% within 24 hours |
| Crash-free sessions | 99.5% |
| PDF report generation | Under 5 seconds for typical monthly report |
| Onboarding completion | Under 10 minutes for typical merchant |

## 5. Scope

### 5.1 In scope for MVP

- PWA app shell using Next.js App Router.
- Tailwind CSS responsive UI with sidebar dashboard layout.
- Clerk authentication with Phone OTP and Google Sign-In.
- Offline-first local database using IndexedDB and Dexie.js.
- Neon Serverless PostgreSQL for durable server storage.
- Inventory management with localized units.
- Sales recording.
- Purchase recording.
- Expense recording.
- Customer deni ledger.
- Supplier deni ledger.
- Customer payments.
- Supplier payments.
- Dashboard summaries.
- Financial calculations including Faida Halisi.
- PDF report generation.
- Local AI transaction parsing using Qwen 1.5B GGUF via `@qvac/sdk`.
- Local Whisper-based speech-to-text.
- TTS confirmation.
- Grill Agent Transaction Mode.
- Grill Agent Onboarding Mode.
- Merchant-specific configuration.
- Local vector RAG memory.
- Sync engine.
- Tenant isolation by `user_id`.

### 5.2 Out of scope for MVP

- Direct M-Pesa API integration.
- Automatic M-Pesa SMS parsing.
- Full double-entry accounting.
- Multi-branch management.
- Employee roles and permissions.
- Payroll.
- Tax filing.
- Bank reconciliation.
- Native Android or iOS app.
- Barcode scanning.
- Advanced inventory forecasting.

## 6. Product Principles

1. **Offline-first, not offline fallback** — Core features must work without internet.
2. **Human-in-the-loop AI** — AI may suggest and validate, but the merchant confirms every saved record.
3. **Merchant-specific configuration** — Each merchant is different. Onboarding must configure Mazao to match their business.
4. **Trust over automation** — A wrong saved record is worse than an unconfirmed suggestion.
5. **Swahili-first language** — Terms like deni, ushuru, kesho, kilo, gunia, and Faida Halisi must feel natural.
6. **Low-data and low-device-friendly** — The app must respect storage, memory, and network limitations.
7. **Simple financial truth** — Show cash, deni, stock, and profit clearly.

## 7. Core Functional Modules

### 7.1 Authentication and Profile

Mazao uses Clerk for authentication.

**Requirements**

- Support Phone OTP login.
- Support Google Sign-In.
- Create a Mazao profile after first authentication.
- Store `clerk_user_id` in the `profiles` table.
- Use internal profile UUID as `user_id`.
- Isolate all merchant data by `user_id`.
- Cache profile locally for offline use after successful login.
- Allow merchant to enter business name, location, phone, and preferred language.

### 7.2 Sidebar Dashboard and Overview

Mazao uses a clean sidebar dashboard layout.

**Sidebar items**

- Muhtasari / Overview
- Mauzo / Sales
- Manunuzi / Purchases
- Deni la Wateja / Customer Debt
- Deni la Wasambazaji / Supplier Debt
- Gharama / Expenses
- Bidhaa / Inventory
- Ripoti / Reports
- Mipangilio / Settings

**Dashboard requirements**

- Show daily Total Sales.
- Show daily Total Expenses.
- Show Faida Halisi.
- Show cash/M-Pesa in and out where payment method is recorded.
- Show low-stock warnings.
- Show overdue customer deni.
- Show urgent supplier debt deadlines.
- Show favorite customers and suppliers.
- Show sync status.
- Show AI model availability.
- Provide quick actions for New Sale, New Purchase, New Expense, and Record Payment.

### 7.3 Inventory and Stock Management

**Requirements**

- Merchant can create inventory items.
- Each item supports localized units: kilo, gunia, tray, piece, crate, bag, litre, fundo, ndume, other.
- Each item stores buying price.
- Each item stores selling price.
- Each item stores current stock quantity.
- Each item stores low-stock threshold.
- Confirmed sales deduct stock.
- Confirmed purchases add stock.
- Manual stock adjustments are supported.
- Fractional quantities are supported where relevant, for example half kilo.
- Inventory works offline.

### 7.4 Customer Deni Tracking

Mazao maintains a customer debt ledger called **Deni la Wateja**.

**Requirements**

- Merchant can create customers.
- Customers have: `name`, `phone`, `notes`, `is_favorite`, `balance`.
- Positive customer balance means the customer owes the merchant.
- Merchant can record credit sale linked to customer.
- Merchant can record customer payment.
- Customer balance increases by credit amount on credit sale.
- Customer balance decreases by payment amount.
- Transactions can include due date.
- AI should parse phrases like: *kesho*, *wiki ijayo*, *Ijumaa*, *mwisho wa mwezi*.
- Customer ledger shows open deni, overdue deni, and due dates.
- Favorite customers can be pinned.

### 7.5 Supplier Deni Tracking

Mazao maintains a supplier debt ledger called **Deni la Wasambazaji**.

**Requirements**

- Merchant can create suppliers.
- Suppliers have: `name`, `phone`, `notes`, `is_favorite`, `balance_owed`.
- Positive supplier balance owed means the merchant owes the supplier.
- Merchant can record credit purchase linked to supplier.
- Merchant can record supplier payment.
- Supplier balance increases by credit amount on credit purchase.
- Supplier balance decreases by supplier payment.
- Supplier transactions can include due date.
- Dashboard shows urgent supplier payment deadlines.
- Favorite suppliers can be pinned.

### 7.6 Expenses

**Requirements**

- Merchant can record expenses offline.
- Expenses include categories.
- Default categories include: transport, ushuru / market fees, rent, bags, county fees, airtime, electricity, miscellaneous.
- Merchant can create custom categories.
- Expense records include amount, date, payment method, and note.
- Expenses are included in profit calculation.
- AI should categorize common expense phrases.

## 8. Grill Agent Onboarding and Merchant Discovery

This is a **mandatory MVP feature**.

### 8.1 Purpose

The Grill Agent Onboarding Mode interviews a new merchant during first run.

Its purpose is to understand:

- The merchant's business type.
- The products sold.
- The units used.
- The pricing behavior.
- The payment methods used.
- The customer deni policy.
- The supplier payment behavior.
- The common expenses.
- The reporting needs.
- The AI validation preferences.

The output is a **Merchant Operating Profile** that configures Mazao for that specific merchant.

### 8.2 Onboarding position in product flow

```text
Sign in
  ↓
Create profile
  ↓
Grill Agent Onboarding
  ↓
Generate Merchant Operating Profile
  ↓
Configure database, AI rules, dashboard, and reports
  ↓
Merchant starts using Mazao
```

### 8.3 Onboarding rubric

The Grill Agent must follow a structured rubric.

**Rubric areas**

1. Business identity
2. Business rhythm
3. Products and units
4. Pricing and margins
5. Sales and payment behavior
6. Customer deni policy
7. Supplier and purchase behavior
8. Expense tracking
9. Reporting and verification needs
10. AI assistance and validation preferences

### 8.4 Business identity questions

**Purpose:** Identify the business. Configure reports. Configure language.

**Example questions:**

- What is your business name?
- What type of business do you run?
- Where do you operate?
- What language do you prefer?

**Example answers:**

```text
Business name: Mama Naliaka Mboga
Business type: vegetable trader
Location: market stall
Language: Swahili
```

### 8.5 Business rhythm questions

**Purpose:** Configure report periods. Configure due date logic. Configure market days and payment days.

**Example questions:**

- Which days are busiest?
- Which days do you buy stock?
- Do you prefer daily, weekly, or monthly summaries?
- Do customers usually pay on specific days?

**Example answer:**

```text
Busy days: Monday and Saturday
Stock days: Tuesday and Friday
Summary preference: daily
Common payment day: Friday
```

### 8.6 Products and units questions

**Purpose:** Configure inventory. Configure AI unit parsing. Configure stock deductions.

**Example questions:**

- What do you sell most?
- How do you measure each item?
- Do you sell fractional quantities?
- Do you want low-stock warnings?

**Example answer:**

```text
Sukuma wiki: kilo
Spinach: fundo
Viazi: gunia
Mayai: tray
```

### 8.7 Pricing and margin questions

**Purpose:** Configure Grill Agent anomaly detection. Prevent wrong AI parsing.

**Example questions:**

- Do your prices change often?
- Do you negotiate with customers?
- Should Mazao warn you if a price looks unusual?
- Should Mazao warn you if a sale appears below cost?

**Example configuration:**

```text
Price anomaly warning: enabled
Negative margin warning: enabled
Price variance threshold: 30%
```

### 8.8 Payment behavior questions

**Purpose:** Configure payment methods. Configure M-Pesa reference tracking. Configure cash flow dashboard.

**Example questions:**

- How do customers usually pay?
- Do you want to record M-Pesa codes?
- Do you want to separate cash and M-Pesa?
- Do you often give discounts?

**Example configuration:**

```text
Payment methods: cash, M-Pesa, deni
Track M-Pesa reference: yes
Separate cash and M-Pesa: yes
```

### 8.9 Customer deni policy questions

**Purpose:** Configure Deni la Wateja. Configure due date defaults. Configure overdue warnings.

**Example questions:**

- Do you give customers deni?
- How often?
- Do you want to record every customer who owes you?
- When do customers usually pay?
- Do you want overdue deni warnings?
- Do you want a maximum deni limit per customer?

**Example configuration:**

```text
Customer deni enabled: yes
Require customer for credit sale: yes
Default due rule: kesho
Overdue warnings: enabled
Max credit per customer: KES 1000
```

### 8.10 Supplier debt policy questions

**Purpose:** Configure Deni la Wasambazaji. Configure supplier payment deadlines. Configure purchase tracking.

**Example questions:**

- Do you buy from suppliers?
- Do suppliers give you stock on credit?
- Do you want to record supplier debt?
- When do you usually pay suppliers?
- Do you want urgent payment reminders?

**Example configuration:**

```text
Supplier tracking enabled: yes
Supplier credit enabled: yes
Urgent deadline warnings: enabled
Default supplier payment rule: weekly
```

### 8.11 Expense tracking questions

**Purpose:** Configure expense categories. Configure profit calculation. Configure report breakdown.

**Example questions:**

- What expenses do you usually pay?
- Do you pay ushuru?
- Do you pay transport?
- Do you want expenses in reports?

**Example configuration:**

```text
Default expense categories:
- transport
- ushuru
- bags
- miscellaneous
```

### 8.12 Reporting and verification questions

**Purpose:** Configure dashboard. Configure PDF reports. Configure audio summaries.

**Example questions:**

- Do you want daily summaries?
- Do you want weekly or monthly reports?
- Do you need reports for Chama or microloan?
- Do you want audio summaries?
- Do you want downloadable PDF reports?

**Example configuration:**

```text
Daily summary: enabled
Weekly summary: enabled
PDF export: enabled
Audio summary: enabled
Report purpose: Chama and microloan
```

### 8.13 AI assistance and validation questions

**Purpose:** Configure AI behavior. Configure strictness. Configure voice features.

**Example questions:**

- Do you want voice entry?
- Do you want audio confirmation?
- Should Mazao ask if something is unclear?
- Should Mazao warn on unusual prices?
- Should Mazao warn or block negative stock?
- Should Mazao remember common items and customers?

**Example configuration:**

```text
Voice entry: enabled
Audio confirmation: enabled
Ask clarifying questions: enabled
Price anomaly mode: warn
Negative stock mode: warn
Remember common entities: enabled
```

### 8.14 Onboarding output

The Grill Agent produces a Merchant Operating Profile.

**Example:**

```json
{
  "merchant_profile": {
    "business_name": "Mama Naliaka Mboga",
    "business_type": "vegetable_trader",
    "preferred_language": "sw-KE"
  },
  "inventory_defaults": {
    "items": [
      {
        "name": "sukuma wiki",
        "unit": "kilo",
        "allows_fractional": true
      },
      {
        "name": "viazi",
        "unit": "gunia",
        "allows_fractional": false
      }
    ]
  },
  "customer_debt_policy": {
    "deni_enabled": true,
    "require_customer_for_credit_sale": true,
    "default_due_rule": "kesho",
    "overdue_warnings_enabled": true
  },
  "supplier_debt_policy": {
    "supplier_tracking_enabled": true,
    "urgent_deadline_warnings_enabled": true
  },
  "expense_policy": {
    "default_categories": [
      "transport",
      "ushuru",
      "bags",
      "miscellaneous"
    ]
  },
  "ai_preferences": {
    "voice_entry_enabled": true,
    "audio_confirmation_enabled": true,
    "price_anomaly_mode": "warn",
    "negative_stock_mode": "warn"
  }
}
```

### 8.15 Onboarding UX rules

- Onboarding should take under 10 minutes.
- Merchant can skip and resume later.
- Questions can be answered by voice, text, or buttons.
- Progress is saved locally.
- Merchant can edit answers later in Settings.
- Onboarding must work offline after initial load.
- Onboarding must not block manual record entry if skipped.
- The Grill Agent should explain why each question matters.
- The merchant must be able to see and review the generated configuration.
- Onboarding answers must affect future AI parsing and validation.

## 9. AI Intelligence Layer

### 9.1 Local AI engine

| Component | Technology |
|---|---|
| Local LLM | Quantized Qwen 1.5B GGUF |
| Runtime | `@qvac/sdk` |
| Speech-to-text | Local WebAssembly Whisper model |
| Text-to-speech | Local/browser TTS |
| Embeddings | Local embedding model |
| Vector memory | IndexedDB |
| Execution | Web Worker |
| Connectivity | Offline-first after model download |

### 9.2 Sub-agent routers

Mazao uses dedicated sub-agent prompt profiles.

**Sales Agent** handles: sales, customer deni, item quantities, unit prices, payment received, due dates.

**Purchases Agent** handles: purchases, supplier deni, stock intake, buying prices, supplier payment deadlines.

**Expenses Agent** handles: expenses, categories, amount, payment method, description.

### 9.3 Grill Agent Transaction Mode

The Grill Agent Transaction Mode validates parsed records.

It checks:

- Arithmetic correctness.
- Missing customer for credit sale.
- Missing supplier for credit purchase.
- Price anomalies.
- Negative margin.
- Stock insufficiency.
- Duplicate transactions.
- Due date ambiguity.
- Currency assumptions.
- Unit ambiguity.
- Merchant-specific rules from onboarding.

The Grill Agent **does not auto-save**.

It outputs:

- Valid or invalid.
- Confidence score.
- Warnings.
- Questions.
- Corrected payload.

### 9.4 Interactive Review Card

Every AI-parsed record must appear in a Review Card.

The Review Card must show:

- Record type.
- Transcript or source input.
- Customer or supplier.
- Items.
- Quantity.
- Unit.
- Price.
- Amount paid.
- Deni amount.
- Due date.
- AI warnings.
- Inline editing controls.
- Cancel button.
- Confirm button.

The confirm button must be labeled:

```text
[ ✅ Confirm & Save Record ]
```

No record is saved unless the merchant confirms.

### 9.5 Voice-to-voice loop

```text
Merchant speaks
  ↓
Whisper STT transcribes locally
  ↓
Sub-agent parses transaction
  ↓
Grill Agent validates
  ↓
Review Card appears
  ↓
Merchant edits if needed
  ↓
Merchant confirms
  ↓
Record saved locally
  ↓
TTS confirmation plays
  ↓
Record syncs later
```

Example TTS confirmation:

```text
Mauzo ya shilingi mia moja yamehifadhiwa.
```

## 10. Financial Summaries and Reporting

### 10.1 Core calculations

| Metric | Formula |
|---|---|
| Total Sales | Sum of confirmed sale total amounts |
| COGS | Sum of confirmed sale line costs |
| Total Expenses | Sum of confirmed expense amounts |
| Faida Halisi | Total Sales minus COGS minus Total Expenses |

### 10.2 Cash flow

Cash flow is separate from profit.

```text
Cash In =
  sale amount paid
  + customer payments

Cash Out =
  purchase amount paid
  + supplier payments
  + expenses
```

### 10.3 Reporting requirements

- Merchant can view daily summary.
- Merchant can view weekly summary.
- Merchant can view monthly summary.
- Merchant can select custom period.
- Report includes Total Sales.
- Report includes COGS.
- Report includes Total Expenses.
- Report includes Faida Halisi.
- Report includes customer deni aging.
- Report includes supplier debt aging.
- Report includes top-selling items.
- Report includes low-stock summary.
- Report can be downloaded as PDF.
- Report can be shared.
- Report can be read aloud via TTS.
- Report should be suitable for Chama and microloan verification.

## 11. Technical Architecture

### 11.1 Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router |
| Styling | Tailwind CSS |
| PWA | Service Worker, Web App Manifest |
| Local database | IndexedDB via Dexie.js |
| Server database | Neon Serverless PostgreSQL |
| Authentication | Clerk |
| Local LLM | Quantized Qwen 1.5B GGUF |
| Local LLM runtime | `@qvac/sdk` |
| Speech-to-text | Local Whisper WASM |
| Text-to-speech | Local/browser TTS |
| Vector memory | IndexedDB embeddings |
| Validation | Zod or Valibot |
| Reports | PDF generation |
| Charts | Lightweight chart library |

### 11.2 High-level architecture

```text
Merchant UI
  ↓
Next.js PWA Shell
  ↓
Local AI Worker
  ↓
Local IndexedDB
  ↓
Sync Engine
  ↓
Neon PostgreSQL
```

### 11.3 Major components

**Client components**

- App shell
- Sidebar dashboard
- Local repositories
- Commit service
- Sync engine
- Model manager
- AI worker
- Whisper STT service
- TTS service
- Vector memory service
- Review Card
- Onboarding flow

**Server components**

- Clerk authentication verification
- Profile resolution API
- Sync push API
- Sync pull API
- Report helper API
- Neon PostgreSQL database

## 12. Offline-First Architecture

### 12.1 Offline rules

- Confirmed records are first written to IndexedDB.
- UI updates immediately.
- Sync queue entry is created.
- Sync happens when online.
- AI drafts are not synced unless confirmed.
- Failed syncs are retried.
- Server is durable source of truth.
- Local DB is operational source of truth while offline.

### 12.2 Local storage tables

```text
profiles
customers
suppliers
inventory
transactions
transactionItems
syncQueue
aiMemory
embeddings
merchantSettings
merchantBusinessRules
onboardingSessions
```

### 12.3 Sync states

```text
local_only
pending_push
pushing
synced
failed
conflict
```

## 13. Security, Privacy, and Compliance

### 13.1 Authentication

- Clerk handles authentication.
- Backend verifies Clerk JWT.
- Internal profile UUID is used as tenant `user_id`.
- All merchant data is tenant-scoped.

### 13.2 Data privacy

- Raw audio is not stored by default.
- AI processing is local by default.
- Merchant data is not sent to external AI without explicit opt-in.
- Merchant can export data.
- Merchant can delete account and data.
- Phone numbers are treated as personal data.
- M-Pesa references are stored only if merchant enters them.

### 13.3 Compliance considerations

The product should respect:

- Kenya Data Protection Act, 2019 principles.
- Consent for voice processing.
- Minimal data collection.
- Clear data deletion process.
- Secure transmission using HTTPS.

## 14. Data Model and Database Schema

### 14.1 Core entities

- `profiles`
- `customers`
- `suppliers`
- `inventory`
- `transactions`
- `transaction_items`
- `merchant_settings`
- `merchant_onboarding_sessions`
- `merchant_business_rules`

### 14.2 Profiles

Stores merchant identity.

```text
id
clerk_user_id
full_name
business_name
phone
market_location
preferred_language
currency_code
timezone
created_at
updated_at
```

### 14.3 Customers

Stores customer records.

```text
id
user_id
name
phone
notes
is_favorite
balance
created_at
updated_at
```

`balance` meaning:

```text
Positive balance = customer owes merchant
Negative balance = merchant may owe customer or customer has credit
```

### 14.4 Suppliers

Stores supplier records.

```text
id
user_id
name
phone
notes
is_favorite
balance_owed
created_at
updated_at
```

`balance_owed` meaning:

```text
Positive balance_owed = merchant owes supplier
Negative balance_owed = supplier may owe merchant or merchant overpaid
```

### 14.5 Inventory

Stores products and stock.

```text
id
user_id
name
category
unit
buying_price
selling_price
stock_qty
low_stock_threshold
sku
is_active
created_at
updated_at
```

### 14.6 Transactions

Stores sales, purchases, expenses, payments, and adjustments.

```text
id
user_id
type
status
occurred_at
source
ai_confidence
description
expense_category
payment_method
customer_id
supplier_id
parent_transaction_id
due_date
due_date_note
currency_code
total_amount
amount_paid
credit_amount
external_reference
created_at
updated_at
```

`credit_amount` is generated as:

```text
credit_amount = total_amount - amount_paid
```

### 14.7 Transaction items

Stores line items for transactions.

```text
id
transaction_id
user_id
inventory_id
description
quantity
unit_price
unit_cost
line_total
line_cost
created_at
```

### 14.8 Merchant settings

Stores merchant-specific settings.

```text
user_id
settings
created_at
updated_at
```

Example settings:

```json
{
  "language": "sw-KE",
  "voice_enabled": true,
  "audio_confirmation": true,
  "price_anomaly_mode": "warn",
  "negative_stock_mode": "warn"
}
```

### 14.9 Merchant onboarding sessions

Stores onboarding progress.

```text
id
user_id
status
mode
answers
completed_at
created_at
updated_at
```

Status values:

```text
in_progress
completed
skipped
abandoned
```

Mode values:

```text
ai
manual
hybrid
```

### 14.10 Merchant business rules

Stores structured rules generated by onboarding.

```text
id
user_id
rule_key
rule_value
is_active
created_at
updated_at
```

Example rule keys:

```text
customer_debt_policy
supplier_debt_policy
pricing_rules
inventory_units
expense_categories
reporting_preferences
due_date_defaults
validation_modes
```

## 15. Implementation Plan

### Phase 0 — Repository, Skills, and Project Bootstrap

**Goals:**
- Create GitHub repository.
- Configure documentation.
- Configure Claude Code and skills.
- Create GitHub milestones and labels.
- Store PRD and architecture docs.

**Deliverables:**
- Repo created.
- Docs folder created.
- Planning docs committed.
- Skills configured.
- GitHub project board created.

### Phase 1 — PWA Foundation

**Goals:**
- Create Next.js App Router app.
- Add Tailwind CSS.
- Add sidebar dashboard layout.
- Add PWA manifest.
- Add service worker.
- Add offline shell.

**Deliverables:**
- App runs locally.
- App is installable.
- Routes exist for all major modules.
- App shell works offline after first load.

### Phase 2 — Authentication, Profile, and Neon Setup

**Goals:**
- Add Clerk authentication.
- Create profile mapping.
- Add Neon PostgreSQL schema.
- Add tenant isolation.
- Add profile API.

**Deliverables:**
- Merchant can sign in.
- Profile is created.
- `user_id` tenant key exists.
- Database schema is deployed.
- RLS policies are configured.

### Phase 2.5 — Grill Agent Onboarding and Merchant Discovery

**Goals:**
- Build onboarding rubric.
- Build onboarding UI.
- Build onboarding session persistence.
- Build Merchant Operating Profile output.
- Configure merchant-specific rules.
- Connect onboarding config to future transaction validation.

**Deliverables:**
- Merchant completes onboarding.
- Merchant can skip and resume.
- Onboarding answers save locally.
- Onboarding answers sync when online.
- Merchant settings and business rules are stored.
- Future AI parsing uses onboarding configuration.

### Phase 3 — Offline Data Layer

**Goals:**
- Add Dexie local database.
- Add local repositories.
- Add sync queue.
- Add commit service.
- Add local balance and stock projections.

**Deliverables:**
- Records can be created offline.
- Records persist after refresh.
- Sync queue works.
- Local projections update immediately.

### Phase 4 — Core Ledger Modules

**Goals:**
- Build inventory CRUD.
- Build customer CRUD.
- Build supplier CRUD.
- Build expense CRUD.
- Build sale entry.
- Build purchase entry.
- Build customer payment.
- Build supplier payment.

**Deliverables:**
- Merchant can record core business activity.
- Stock updates correctly.
- Deni balances update correctly.
- Dashboard reflects records immediately.

### Phase 5 — Dashboard, Financial Calculations, and Reports

**Goals:**
- Build dashboard summaries.
- Build financial calculation service.
- Build deni aging service.
- Build low-stock alerts.
- Build PDF report.
- Build TTS summary.

**Deliverables:**
- Dashboard shows key indicators.
- Faida Halisi calculates correctly.
- PDF can be generated offline.
- Audio summary can be played.

### Phase 6 — AI Intelligence Layer

**Goals:**
- Add model manager.
- Add Qwen local parsing.
- Add Whisper STT.
- Add TTS confirmation.
- Add sub-agent router.
- Add Grill Agent Transaction Mode.
- Add local vector RAG memory.
- Add Interactive Review Card.

**Deliverables:**
- Voice input can be transcribed locally.
- Transaction can be parsed.
- Grill Agent validates parsed record.
- Merchant can review and edit.
- Record saves only after confirmation.
- TTS confirmation plays.

### Phase 7 — Sync Hardening

**Goals:**
- Make sync idempotent.
- Add retry logic.
- Add conflict handling.
- Add server-side balance recomputation.
- Add export and deletion.

**Deliverables:**
- Offline records sync safely.
- Duplicate pushes do not create duplicates.
- Sync failures retry.
- Tenant isolation is enforced.

### Phase 8 — Testing and Pilot Readiness

**Goals:**
- Add unit tests.
- Add integration tests.
- Add E2E tests.
- Add offline simulation tests.
- Add AI golden test set.
- Add pilot onboarding script.

**Deliverables:**
- Critical flows pass tests.
- Pilot merchant can complete onboarding.
- Pilot merchant can record first transaction.
- Reports are credible.

## 16. MVP Definition of Done

Mazao MVP is complete when the following are true.

### 16.1 Repository and planning

- [ ] Repo, docs, PRD, architecture, and implementation plan are committed.
- [ ] GitHub milestones, labels, and issues are created.
- [ ] Skills for GitHub, Anthropic agents, Claude Code, and Superpower skills are connected.

### 16.2 Authentication and tenant identity

- [ ] Merchant can sign in with Clerk Phone OTP or Google.
- [ ] A profile is created with `clerk_user_id`.
- [ ] Internal `profiles.id` is used as `user_id`.
- [ ] All merchant data is isolated by `user_id`.

### 16.3 Grill Agent onboarding

- [ ] New merchant is taken through Grill Agent Onboarding after first sign-in.
- [ ] Onboarding follows a structured rubric covering: business identity, business rhythm, products and units, pricing behavior, payment methods, customer deni policy, supplier deni policy, expense categories, reporting needs, AI/validation preferences.
- [ ] The Grill Agent asks questions conversationally.
- [ ] Manual fallback exists if AI is unavailable.
- [ ] Onboarding can be completed by voice, text, or simple buttons.
- [ ] Merchant can skip onboarding and complete it later.
- [ ] Onboarding progress is saved locally.
- [ ] Onboarding answers produce a structured Merchant Operating Profile.
- [ ] Merchant Operating Profile is saved locally.
- [ ] Merchant Operating Profile syncs to server when online.
- [ ] Onboarding configures: default units, expense categories, deni rules, supplier rules, payment method defaults, report preferences, AI validation preferences.
- [ ] Onboarding answers affect future transaction parsing and validation.
- [ ] Merchant can review and edit onboarding answers later.
- [ ] Onboarding works offline after initial app load.
- [ ] Onboarding completes in under 10 minutes for a typical merchant.

### 16.4 Offline foundation

- [ ] Core app works offline.
- [ ] IndexedDB stores local records.
- [ ] Sync queue works.
- [ ] Offline records sync safely when online.

### 16.5 Core ledger

- [ ] Merchant can add inventory items.
- [ ] Inventory supports localized units.
- [ ] Merchant can record sales offline.
- [ ] Confirmed sales reduce stock.
- [ ] Merchant can record purchases offline.
- [ ] Confirmed purchases increase stock.
- [ ] Merchant can record expenses offline.
- [ ] Merchant can record customer deni.
- [ ] Merchant can record supplier deni.
- [ ] Customer balance updates correctly.
- [ ] Supplier balance owed updates correctly.
- [ ] Customer payments reduce customer balance.
- [ ] Supplier payments reduce supplier balance owed.

### 16.6 Dashboard and reports

- [ ] Dashboard shows daily sales.
- [ ] Dashboard shows expenses.
- [ ] Dashboard shows Faida Halisi.
- [ ] Dashboard shows cash/M-Pesa flow where payment method is recorded.
- [ ] Dashboard shows low-stock warnings.
- [ ] Dashboard shows overdue customer deni.
- [ ] Dashboard shows urgent supplier debt deadlines.
- [ ] Merchant can generate a PDF report.
- [ ] PDF report includes: Total Sales, COGS, Total Expenses, Faida Halisi, customer deni aging, supplier debt aging.
- [ ] Report can be shared.
- [ ] TTS can read a short summary if enabled.

### 16.7 AI transaction layer

- [ ] Local AI can parse a merchant transaction where model is available.
- [ ] Whisper STT works locally where model is available.
- [ ] Sub-agent router sends input to Sales, Purchases, or Expenses agent.
- [ ] Grill Agent Transaction Mode validates parsed records.
- [ ] Review Card shows parsed fields.
- [ ] Merchant can edit parsed fields inline.
- [ ] No AI record is saved without merchant confirmation.
- [ ] Confirm button is labeled `[ ✅ Confirm & Save Record ]`.
- [ ] TTS confirmation plays after confirmed save if enabled.
- [ ] Manual entry works if AI is unavailable.

### 16.8 Security and sync

- [ ] API routes validate Clerk auth.
- [ ] Server enforces tenant isolation.
- [ ] Sync is idempotent.
- [ ] Failed sync retries safely.
- [ ] Merchant data export is available.
- [ ] Merchant data deletion is available or clearly stubbed.

### 16.9 Testing and pilot readiness

- [ ] Critical financial calculations have tests.
- [ ] Offline record creation has tests.
- [ ] Sync retry and duplicate-push behavior has tests.
- [ ] Onboarding rubric has golden test cases.
- [ ] AI parsing has golden Swahili test phrases.
- [ ] Pilot merchant can complete sign-in, onboarding, and first record within 10 minutes.

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Qwen model too heavy for low-end phones | AI unusable | Provide manual fallback and model gating |
| Whisper accuracy in noisy markets | Poor transcription | Allow retry and text fallback |
| AI hallucinations | Wrong records | Grill Agent plus mandatory human confirmation |
| Merchant distrust of AI | Low adoption | Review Card, explicit confirm, audio confirmation |
| Offline sync conflicts | Incorrect balances | Append-only ledger and balance recomputation |
| Storage quota eviction | Local data loss | Sync early, warn user, server restore |
| Data privacy concerns | Legal/trust risk | Local AI by default, minimal telemetry, consent |
| Poor connectivity | Data trapped locally | Queue/retry, offline reports, export later |
| Ambiguous Swahili/Sheng phrases | Parsing errors | RAG memory, onboarding config, corrections |

## 18. Glossary

| Term | Meaning |
|---|---|
| Deni | Debt or credit obligation |
| Deni la Wateja | Customer debt owed to merchant |
| Deni la Wasambazaji | Supplier debt owed by merchant |
| Ushuru | Market fee or levy |
| Faida Halisi | Net profit |
| Kesho | Tomorrow |
| Gunia | Sack or bag unit |
| Kilo | Kilogram unit |
| Tray | Tray unit, commonly eggs |
| Chama | Informal savings or welfare group |
| Mama mboga | Vegetable seller |
| M-Pesa | Mobile money payment service |
| Grill Agent | AI validation and onboarding agent |
| Merchant Operating Profile | Structured configuration generated during onboarding |

## 19. Appendix A: Database Schema Reference

This appendix provides the key SQL structures for the Mazao MVP.

### 19.1 Profiles

```sql
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  full_name text,
  business_name text,
  phone text,
  market_location text,
  preferred_language text not null default 'sw-KE',
  currency_code char(3) not null default 'KES',
  timezone text not null default 'Africa/Nairobi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 19.2 Customers

```sql
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  is_favorite boolean not null default false,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_id_user_id_key unique (id, user_id)
);
```

### 19.3 Suppliers

```sql
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  is_favorite boolean not null default false,
  balance_owed numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_id_user_id_key unique (id, user_id)
);
```

### 19.4 Inventory

```sql
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text,
  unit text not null default 'piece',
  buying_price numeric(14,2) not null default 0 check (buying_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  stock_qty numeric(14,3) not null default 0,
  low_stock_threshold numeric(14,3) not null default 5,
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_id_user_id_key unique (id, user_id)
);
```

### 19.5 Transactions

```sql
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  status text not null default 'confirmed',
  occurred_at timestamptz not null default now(),
  source text not null default 'manual',
  ai_confidence numeric(4,3),
  description text,
  expense_category text,
  payment_method text not null default 'cash',
  customer_id uuid,
  supplier_id uuid,
  parent_transaction_id uuid,
  due_date date,
  due_date_note text,
  currency_code char(3) not null default 'KES',
  total_amount numeric(14,2) not null check (total_amount >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  credit_amount numeric(14,2) generated always as (total_amount - amount_paid) stored,
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_id_user_id_key unique (id, user_id)
);
```

### 19.6 Transaction Items

```sql
create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  user_id uuid not null references profiles(id) on delete cascade,
  inventory_id uuid,
  description text,
  quantity numeric(14,3) not null check (quantity <> 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  line_total numeric(14,2) generated always as (quantity * unit_price) stored,
  line_cost numeric(14,2) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);
```

### 19.7 Merchant Settings

```sql
create table if not exists merchant_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 19.8 Merchant Onboarding Sessions

```sql
create table if not exists merchant_onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'in_progress',
  mode text not null default 'ai',
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_sessions_id_user_id_key unique (id, user_id)
);
```

### 19.9 Merchant Business Rules

```sql
create table if not exists merchant_business_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rule_key text not null,
  rule_value jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_business_rules_id_user_id_key unique (id, user_id),
  constraint merchant_business_rules_user_rule_key unique (user_id, rule_key)
);
```

---

*End of Document*
