# Mazao: Stitch Prompts (v3)

## v3 changes (2026-10-24, D0 / issue #21)

v3 sits on top of v2. Where a v2 prompt below disagrees with this section, **this section wins**.

1. **English by default (owner change, supersedes the bilingual rule for design).** All screen copy is English: titles, bottom-nav labels (Overview, Sales, Debts, Expenses, More), section headings, buttons and body text. Do **not** stack a Kiswahili title over an English one. Wherever a v2 prompt says *"Title 'X' with 'Y' under it"*, render only the English **Y**. Kiswahili is a **user-selectable language**: an "English / Kiswahili" switch on Settings (§3.14, Language section) and shown once in the sign-in/onboarding flow (§3.1). Item names and market units stay as merchants say them (sukuma wiki, mayai, kilo, gunia, fundo, tray, M-Pesa). §11 is now the Kiswahili string table for the switched language. A decision record superseding D-004/D-040's language rule is still to be written in `planning/DECISIONS.md`.
2. **Imagery addendum (Q-012, D-045).** Photographs only, never illustrations.
   - Landing (§2.1), sign-in (§3.1), Set PIN (§3.2), Unlock (§3.3) and onboarding (§3.4 to §3.6): **"photographic background under a solid scrim, text on a solid Surface panel."**
   - Every other R0 screen: **"imagery only in the header band and empty state."**
   - Paste the matching line after the Core token block in each prompt.
3. **Mobile and desktop for every screen.** Each screen is generated on MOBILE (360px) and DESKTOP (1280px). App screens on desktop keep the **bottom navigation at every width (D-040): no sidebar, no rail**; use the width for a centred content column (max about 960px) and wider cards or tables. The landing page gets a genuinely desktop-optimised layout.
4. **Known conflicts, never show:** "Switch account" or "Add another account" (D-039); "Backing up" (the chip says "Saving…", RQ-1); snackbar "Undo" (records are immutable, D-018; use "View"); a tablet/desktop navigation rail (D-040).

Outputs of the D0 run live in [`docs/design/r0/`](r0/README.md).

---

## v2 notes

Prompts for generating Mazao's landing page and mobile app UI in Stitch. v2 replaced v1. The changes:
- a new landing page;
- a new palette and font, because v1's warm-paper palette is a known AI-default look;
- **Kiswahili + English titles everywhere.**

**Sources:**
- [`docs/PRD.md`](../PRD.md)
- [`docs/superpowers/specs/2026-10-24-mazao-mvp-design.md`](../superpowers/specs/2026-10-24-mazao-mvp-design.md), which wins on conflicts.
- `planning/DECISIONS.md`
- Design rules from the `design-taste-frontend`, `impeccable` and `apple-design` skills.

## How to use

1. Create **one** Stitch project called **"Mazao"**.
   - App screens use device **MOBILE**.
   - The landing page uses **MOBILE** first, then a **DESKTOP** variant.
2. Generate the **Design System** (§1) first and save it as the project design system.
3. Generate in release order:
   1. the landing page and all **R0** screens, for the pilot on Mon 26 Oct 2026;
   2. then R1 to R6.
4. Every app-screen prompt says **[Core token block]**. Paste the block below in its place, so each prompt works on its own.
5. Use edits for targeted changes, one change per edit. Don't regenerate a whole screen to fix one detail.
6. Export the approved screens to `docs/design/<release>/`. Stitch output is a visual reference; the Next.js + Tailwind build follows the blueprint for behaviour and text.

| Tag | Scope |
|---|---|
| R0 | Landing page; sign-in, PIN, onboarding, notebook import, Muhtasari, sales, expenses, customer deni, items, settings |
| R1 | Purchases and supplier deni |
| R2 | Repair jobs (Kazi) |
| R3 | Reports (Ripoti) and PDF |
| R4 | AI text entry, Review Card, model download consent |
| R5 | English voice capture |
| R6 | Mtandao network map |

## Language rule (owner requirement)

- **Every screen title, section heading, navigation label and key money label is bilingual.**
  - The Kiswahili word is primary and larger.
  - The English translation sits directly beneath it in smaller grey text.
  - Example: "Mauzo" with "Sales" under it.
  - Never put both on one line as "Mauzo · Sales".
- Body text, form labels and buttons are in English.
- Market words stay as merchants say them: *deni, Faida Halisi, ushuru, kilo, gunia, fundo, tray, kesho*.

### Core token block (paste wherever a prompt says [Core token block])

```
DESIGN SYSTEM (REQUIRED): Android phone 360x800, light theme only, built to be read in bright outdoor sunlight at a market stall. Product UI: plain, scannable, calm; the brand lives in precise details, not decoration. Colours: background Chalk #F3F5F2 (cool off-white, never cream); surfaces #FCFDFB with a 1px Line #D5DCD6 border; text Ink #141A16, secondary Moss Grey #4E5A52; ONE action colour, Sukuma Green #14532D (pressed #0D3B20), used only for primary buttons, the active nav item and focus rings; Deni Maize #8A5A00 text on Maize Tint #FFF1C9 for debts and warnings; Overdue Tomato #B42318 on #FDECEA only for overdue, errors and destructive actions; Slate #35556B only for M-Pesa segments in money bars. Font: Manrope only, tabular figures on every amount, format "KES 1,250", big money figures in Ink, 28-36sp bold. Radius rule: 8px on buttons, inputs, chips, list rows and cards; 16px top corners on bottom sheets only. Touch targets at least 48dp with 8dp gaps. ALL COPY IN ENGLISH (titles 22sp semibold Ink, one language per label, no stacked Kiswahili titles); item names and units stay as merchants say them (sukuma wiki, mayai, kilo, gunia, fundo, tray). Bottom nav: Overview, Sales, Debts, Expenses, More, at every width; no sidebar or rail. No gradients, glows, glass, emoji, em-dashes, decorative dots, avatars or illustrations.
```

v2's block (bilingual titles) is retired; see "v3 changes" above.

---

## 1. Design System (generate first)

Design system for Mazao, an offline bookkeeping app for Kenyan market traders on low-cost Android phones. The app is used standing at a stall, in direct sun, often with one hand, between customers. It should feel like a sturdy, honest tool: a good weighing scale or a well-kept ledger. Money numbers must be impossible to misread.

**Design Read:** Operate-mode product UI for Gikomba merchants, with a plain-spoken, physical market-tool language, leaning toward Material 3 structure themed with Mazao tokens.

**Why these choices:**
- **Palette:**
  - The greens come from sukuma wiki and the market canopy.
  - Maize yellow marks deni because it reads as "attention, not danger".
  - Tomato red is reserved for overdue money only.
  - The background is a cool chalk, not cream, so it stays crisp in glare.
- **Font: Manrope.** It has clear, open numerals (1, 4, 7 and 0 are distinct at small sizes), tabular figures so KES columns line up, and full Latin coverage for Kiswahili names.

**DESIGN SYSTEM (REQUIRED):**
- **Platform:** Android, 360x800, Material 3 structure:
  - bottom navigation bar on phones;
  - bottom navigation at every width in R0 (D-040); a tablet navigation rail comes after the pilot;
  - system back gesture respected;
  - edge-to-edge with safe insets.
- **Theme:** light only, for sunlight. A dark theme comes later.
- **Colours:**
  - Chalk #F3F5F2 background.
  - Surface #FCFDFB.
  - Line #D5DCD6.
  - Ink #141A16.
  - Moss Grey #4E5A52.
  - Sukuma Green #14532D, the only action colour.
  - Deni Maize #8A5A00 on #FFF1C9.
  - Overdue Tomato #B42318 on #FDECEA.
  - Slate #35556B for M-Pesa data only.
- **Contrast:** all text at least WCAG AA; money figures AAA, i.e. Ink on Surface.
- **Type (Manrope, one family):**
  - screen title 22sp/28 semibold;
  - English subtitle 14sp/20 Moss Grey;
  - section label 16sp semibold;
  - body 16sp/24;
  - small 13sp;
  - hero money 36sp bold tabular, tracking -0.01em.
- **Shape:** 8px radius everywhere; bottom sheets 16px top corners only. No pills except toggle chips, which are also 8px.
- **Components:**
  - filled primary button, 52dp, full width;
  - outlined secondary button;
  - text button;
  - 8px-radius filter and choice chips, 44dp;
  - large numeric money input;
  - bottom sheet;
  - snackbar with a "View" link (corrections use Void, never Undo, D-018);
  - list rows with a left status bar (Maize for deni, Tomato for overdue);
  - skeleton loaders shaped like the real rows.
- **Navigation, bilingual:**

  | Kiswahili | English |
  |---|---|
  | Muhtasari | Overview |
  | Mauzo | Sales |
  | Deni | Debts |
  | Gharama | Expenses |
  | Zaidi | More |

  Each item has an icon, the Kiswahili label at 12sp and the English caption at 11sp. "Zaidi" opens a sheet listing:

  | Kiswahili | English |
  |---|---|
  | Manunuzi | Purchases |
  | Deni la Wasambazaji | Supplier debt |
  | Bidhaa | Items |
  | Kazi | Repair jobs |
  | Mtandao | Network |
  | Ripoti | Reports |
  | Mipangilio | Settings |

- **Sync status:** a top-bar chip with an icon and text. "Backed up" uses a cloud-check icon, "Not backed up (3)" a cloud-off icon, "Sign in to back up" a cloud-alert icon.
- **Icons:** one outline family, 24dp, stroke 1.75, always with a text label.
- **Motion:**
  - instant press feedback;
  - 200ms critically damped transitions;
  - sheets rise from the button that opened them and return the same way;
  - with reduced motion, these become cross-fades.

**Do not:**
- purple or blue AI glow;
- gradients as decoration, glassmorphism;
- three equal cards in a row, cards inside cards;
- small uppercase eyebrow labels above every section;
- decorative coloured dots;
- avatar circles or fake profile photos;
- generic names (John Doe);
- emoji in the UI (the one exception is the Review Card confirm label, see §7.2);
- em-dashes;
- everything centred;
- spinners in the middle of content where a skeleton fits;
- tiny grey text on chalk;
- centred long paragraphs.

**Show:** a style board with:
- colour swatches with names and hex;
- the type scale, with a bilingual title sample ("Mauzo" over "Sales");
- buttons in all states (default, pressed, disabled, loading);
- chips;
- a money row with tabular figures;
- an input with an error;
- the sync chip in 3 states;
- the bilingual bottom navigation;
- a bottom sheet;
- a skeleton row.

---

## 2. Landing page (R0)

### 2.1 Mazao landing page

The public page at the Mazao web address, shown to visitors who aren't signed in.
- **Primary audience:** Gikomba merchants opening a link on their phone (mama mbogas, kiosk owners, boda riders, repair fundis).
- **Secondary audience:** Chama leaders and NGO partners on a laptop.
- **Goal:** one action, "Anza bure / Start free", which leads to sign-in.

**Design Read:** Persuade landing page for Kenyan market traders on phones, with a plain-spoken, photographic market language, leaning toward Tailwind + Manrope and real daylight photography. Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 4. These are low-motion, light pages because visitors are on cheap phones and paid data.

**Tokens:** the same palette as the app (Chalk #F3F5F2, Ink #141A16, Moss Grey #4E5A52, Sukuma Green #14532D as the only action colour, Maize #8A5A00 for deni accents), Manrope, 8px radius, light theme locked. Mobile first at 360px, then a 1280px desktop variant. Bilingual headings: Kiswahili primary, English directly beneath in smaller grey.

**Sections, top to bottom (each uses a different layout):**
1. **Header**, one line, 64px:
   - "Mazao" wordmark in Ink;
   - text link "Ingia / Sign in";
   - filled Sukuma Green button "Anza bure / Start free".
2. **Hero, asymmetric split.** On desktop: copy on the left (5 columns), a tall photo on the right (7 columns). On mobile: copy stacked, photo below.
   - Headline (Kiswahili, max 2 lines): "Daftari lako la biashara, sasa kwenye simu."
   - Subtext (English, max 20 words): "Your business notebook on your phone. Sales, deni and real profit, even with no network."
   - Primary button "Anza bure / Start free". Secondary text link "See how it works".
   - **Photo brief:** a mama mboga at her stall in Gikomba in daylight, sukuma wiki bundles and tomatoes in front, glancing at her Android phone. Real, unposed, warm skin tones, no stock smile.
   - A slot for a real screenshot of the Muhtasari screen, shown as an actual phone frame partly overlapping the photo's lower-left edge.
3. **Paper notebook vs Mazao.** A two-column comparison on desktop, stacked on mobile.
   - Left: **photo brief**, close-up of hands writing deni names in a worn school exercise book with a biro.
   - Right: heading "Daftari linalokupigia hesabu" with the English "A notebook that does the maths for you". Four grouped rows, without hairlines on every row:
     - who owes you, and since when;
     - profit after the cost of goods and expenses;
     - works with no network;
     - backed up if you lose your phone.
4. **Offline story.** A full-bleed photo with text below it, not on it.
   - **Photo brief:** a crowded Gikomba aisle from above, sacks of potatoes, people moving.
   - Heading "Hakuna mtandao? Sawa." with the English "No network? Fine." One line: "Everything saves on your phone first and backs up when you connect."
5. **Deni you can see.** A split with a narrow phone screenshot slot of the Deni la Wateja screen on the right and copy on the left.
   - Heading "Jua nani anakudai" with the English "Know who owes you".
   - Three short lines: overdue first; due dates on every deni; payments update instantly.
6. **Made for goods and services.** An asymmetric bento with exactly 4 photo cells (one large, three smaller), each with a one-line caption under the photo, never over it:
   - mama mboga ("Sell by kilo, fundo or tray");
   - kiosk shelf ("Track stock that runs low");
   - boda rider with a delivery crate ("Record trips and fuel");
   - phone fundi at a repair bench ("Repair jobs with deposits").
7. **Start in three actions.** One horizontal row on desktop, a vertical list on mobile. Large verbs, no step numbers:
   - "Ingia / Sign in";
   - "Weka PIN / Set a PIN";
   - "Andika mauzo / Record a sale".

   Each has one plain sentence under it.
8. **Your data is yours.** A text-only, two-column grouped list.
   - Heading "Data yako ni yako" with the English "Your data is yours".
   - Points:
     - the PIN never leaves your phone;
     - backups are stored securely in the EU;
     - ask us to delete it anytime;
     - no ads.
9. **Questions (FAQ).** An accordion with 5 questions:
   - "Is it free?"
   - "Does it work without internet?"
   - "What if I lose my phone?"
   - "Can I use it for a boda or repair business?"
   - "Is it in Kiswahili?" (Answer: "Titles now, full Kiswahili soon.")
10. **Closing band:** one line, "Anza leo / Start today", with the same "Anza bure / Start free" button.
11. **Footer:** wordmark, Privacy notice, WhatsApp support link (number to be added), © 2026 Mazao.

**Rules:**
- No logo wall, statistics, testimonials or star ratings. The pilot hasn't happened yet.
- No small uppercase eyebrows.
- No em-dashes.
- No pills over photos.
- No scroll cue.
- Photos are natural daylight photography of Kenyan markets, never illustrations or fake dashboards built from boxes.

---

## 3. R0 app screens

### 3.1 Karibu Mazao / Welcome to Mazao (sign in)

First-run sign-in. Reassuring and fast; the merchant signs in once on their own phone.

**[Core token block]**

**Layout, top to bottom:**
1. **Header:** "Mazao" wordmark. Title "Karibu Mazao" with "Welcome to Mazao" under it. Body: "Keep your sales, deni and profit in one safe place."
2. **Privacy card:**
   - three short lines: what we store; stored in the EU; you can delete it;
   - a checkbox "I agree to the privacy notice", with a "Read it" link.
   - Sign-in stays disabled until it's ticked.
3. **Email field:** labelled "Email address", sample "wanjiku.mboga@gmail.com". Primary button "Send me a code".
4. **Code state:** "Enter the 6-digit code sent to wanjiku.mboga@gmail.com". Six large digit boxes, "Resend in 0:45", primary "Continue".
5. **Divider and secondary:** a divider "or", then an outlined "Continue with Google" with the Google G mark.
6. **Footer note** in Moss Grey: "Internet is needed only for this first sign-in. After that Mazao opens offline with your PIN."

**States:**
- Offline: a Maize banner, "You're offline. Connect once to sign in.", with the send button disabled.
- Wrong code: Tomato text under the boxes.

### 3.2 Weka PIN / Set your PIN

The merchant creates the 4-digit PIN used every day, online or offline.

**[Core token block]**

**Layout:**
1. **Top bar:** back. Title "Weka PIN" with "Set your PIN" under it.
2. **Heading:** "Choose 4 numbers". Helper: "You'll open Mazao with this PIN every day, even with no internet."
3. **PIN:** four large square slots (8px radius) that fill with Ink as digits are entered.
4. **Keypad:** a 3x4 grid (1-9, empty, 0, backspace), each key 64dp tall, digits 28sp. Press feedback is instant.
5. **Confirm state:** "Enter the same PIN again".
6. **Maize note:** "Avoid 1234 or your birth year. To reset a forgotten PIN you will need internet."

**States:**
- "The PINs don't match. Try again." in Tomato, with a short horizontal shake (a fade under reduced motion).
- Weak PIN (1111, 1234) blocked with an explanation.

### 3.3 Fungua Mazao / Unlock Mazao

The everyday unlock screen. It opens offline, and returns after 5 minutes in the background.

**[Core token block]**

**Layout:**
1. **Account:**
   - top-left, the business name "Mama Wanjiku Mboga" (16sp semibold) with the email "wanjiku.mboga@gmail.com" under it in Moss Grey;
   - (no account switching in R0, D-039);
   - sync chip "Not backed up (3)".
2. **Title:** "Fungua Mazao" with "Unlock Mazao" under it.
3. **PIN and keypad:** four PIN slots, then the large keypad as on Weka PIN.
4. **Links:** "Forgot PIN?" (Sukuma Green text button) . No "Add another account" in R0 (D-039).

**States:**
- "Wrong PIN. 3 tries left."
- Lockout: "Too many tries. Wait 30 seconds", with a live countdown and a disabled keypad.
- Forgot PIN while offline, in a Maize card: "Connect to the internet to reset your PIN with an email code."

### 3.4 Tuanze / Let's get started (onboarding question)

One tap-to-answer onboarding question. The whole flow takes under 10 minutes.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Tuanze" with "Let's get started" under it; text button "Skip for now".
2. **Progress:** a thin 8-segment bar with segment 6 filled (RQ-4 has 8 questions). Text "Customer deni, 6 of 8", and on the right "About 3 min left".
3. **Question** (20sp semibold): "Do you give customers goods on deni?"
4. **Why this matters:** a collapsible row with an info icon: "If yes, Mazao asks who the customer is on every deni sale and reminds you when payment is due."
5. **Answers:** three full-width choice rows (8px radius, 56dp): "Yes, often", "Sometimes", "Never". After "Yes, often", a follow-up slides in from below: "When do customers usually pay?" with chips "Kesho", "Ijumaa", "Wiki ijayo", "Mwisho wa mwezi". Each chip has its English under it: Tomorrow, Friday, Next week, End of month.
6. **Bottom bar:** outlined "Back" and filled "Next".

**States:** snackbar "Saved. You can finish later." It works offline without any warning.

### 3.5 Wasifu wa Biashara / Business profile (onboarding review)

Review of the Merchant Operating Profile before saving.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Wasifu wa Biashara" with "Business profile" under it. Helper: "Check these answers. You can change them later in Settings."
2. **Sections:** grouped sections with simple dividers, not cards inside cards. Each has an "Edit" text button on the right.
   - **Business:** Mama Wanjiku Mboga. Vegetable trader, Gikomba Market.
   - **Items you sell:** chips "Sukuma wiki, kilo", "Spinach, fundo", "Mayai, tray", "Viazi, gunia".
   - **Services:** chip "Delivery, per trip".
   - **Payments:** Cash, M-Pesa, deni allowed.
   - **Customer deni:** a customer is required; default due date kesho; overdue reminders on.
   - **Expenses:** chips Transport, Ushuru, Bags, Fuel.
   - **Warnings:**
     - unusual price: warn above 30%;
     - below cost: warn;
     - negative stock: warn.
3. **Primary button:** "Set up Mazao". Text button: "Change answers".

**States:** an unanswered section shows "Not answered. Tap to add." in Maize.

### 3.6 Leta Daftari Lako / Bring in your notebook

Copy what is already in the paper notebook. These entries are marked "Brought forward" and never count as sales.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Leta Daftari Lako" with "Bring in your notebook" under it. Helper: "Add what people owe you, what you owe, and the stock you have now. This is not counted as sales."
2. **Tabs**, each with the English below:
   - "Wanaonidai" (Customers who owe me);
   - "Ninaowadai" (Suppliers I owe);
   - "Stoki" (Stock I have).
3. **Customers tab:** rows with name, amount (right-aligned, tabular) and due date:
   - Wanjiku, KES 450, kesho;
   - Otieno Ouma, KES 1,200, Friday;
   - Mama Achieng, KES 300, no date.

   An inline add row: Name, Amount (KES), due-date chips.
4. **Total:** a total row in Maize: "Brought forward: KES 1,950".
5. **Bottom:** primary "Save notebook"; text button "Do this later".

**Empty state:** "Start with the person who owes you the most." with an "Add customer" button.

### 3.7 Muhtasari / Overview (today)

The home screen. Today's money must be readable in 3 seconds, in sunlight.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Muhtasari" with "Overview" under it. On the right, the sync chip "Backed up". Date line "Saturday 24 October".
2. **Profit block** (no card, full width):
   - label "Faida Halisi" with "Net profit today" under it;
   - figure "KES 1,340" at 36sp bold, tabular, in Ink;
   - under it, three aligned columns: Sales KES 3,200 / Cost of goods KES 1,410 / Expenses KES 450.
3. **Money in today:** a single horizontal bar split into Cash KES 1,900 (Ink) and M-Pesa KES 850 (Slate), with labels below each part. Deni is not money in: beneath the bar, a separate Maize line "Given on deni today: KES 450".
4. **Who owes you:**
   - section title "Wanaokudai" with "Who owes you" under it;
   - total "KES 2,400 from 5 customers";
   - two rows: "Otieno Ouma KES 1,200, 2 days overdue" (Tomato left bar) and "Wanjiku KES 450, due kesho" (Maize left bar);
   - text button "See all deni".
5. **Low stock:** "Mayai: 1 tray left", "Sukuma wiki: 2 kilo left".
6. **Quick actions:** one full-width primary "New sale" button, then a row of two outlined buttons, "New expense" and "Record payment".
7. **Bottom nav:** the bilingual bottom nav with Muhtasari active.

**States:**
- First day: "No sales yet today. Record your first sale.", with the New sale button.
- Loading: skeleton rows.
- Offline: the chip reads "Not backed up (3)" and everything else works.

### 3.8 Mauzo Mapya / New sale

Recording a sale takes under 15 seconds. It handles goods, services and deni.

**[Core token block]**

**Layout:**
1. **Top bar:** close. Title "Mauzo Mapya" with "New sale" under it.
2. **Item picker:**
   - search field "Find an item";
   - a horizontal row of recent items as 8px chips: "Sukuma wiki, KES 60/kilo", "Mayai, KES 420/tray", "Spinach, KES 20/fundo", and "Gikomba to Town trip, KES 200" with a small "service" tag.
3. **Lines:**
   - "Sukuma wiki" with a quantity stepper and a half-step button showing 2½ kilo; at KES 60 each, the line is KES 150 (right-aligned, tabular).
   - "Gikomba to Town trip" with quantity 1 at KES 200. There's no stock line for services.

   Each line has edit-price and remove icons.
4. **Total row:** "Total KES 350" at 28sp bold.
5. **Payment:** segmented choice "Cash", "M-Pesa", "Other" (deni is never a payment method; it is the unpaid remainder, DOMAIN.md), then "Amount paid" prefilled with the total. M-Pesa reveals "M-Pesa code (optional)".
6. **Deni section**, shown when paid is less than the total:
   - "Paid now KES 100";
   - "Deni KES 250" in Maize;
   - customer picker (required) with recent customers Wanjiku and Otieno Ouma;
   - due chips "Kesho", "Ijumaa", "Wiki ijayo", "Pick date".
7. **Warning row** (Maize): "Sukuma wiki at KES 60 is 40% above your usual KES 43." with buttons "Price is right" and "Fix price".
8. **Sticky bottom:** primary "Save sale, KES 350".

**States:**
- Deni without a customer: Tomato helper text "Choose who owes this".
- Stock warning: "Only 1 tray of mayai in stock."

### 3.9 Mauzo / Sales (today's list)

**[Core token block]**

**Layout:**
1. **Top bar:** title "Mauzo" with "Sales" under it. Date chips "Today", "Yesterday", "This week".
2. **Summary:** two lines.
   - "12 sales, KES 3,200".
   - Under it: Cash KES 1,900, M-Pesa KES 850, Deni KES 450, in aligned columns.
3. **List rows** (no card borders, simple dividers):
   - 10:42. Sukuma wiki 2½ kilo, Gikomba to Town trip. KES 350, with a Maize "Deni: Wanjiku" tag.
   - 09:15. Mayai 1 tray. KES 420, M-Pesa.
   - 08:30. Spinach 5 fundo. KES 100, Cash.

   An unsynced row shows a small cloud-off icon.
4. **Button:** an extended "New sale" button, bottom right.
5. **Bottom nav:** Mauzo active.

**Interactions:**
- Tapping a row opens a detail sheet with "Void sale".
- A voided row is struck through with the label "Voided".

**Empty state:** "No sales today yet." with a New sale button.

### 3.10 Gharama Mpya / New expense

**[Core token block]**

**Layout:**
1. **Top bar:** close. Title "Gharama Mpya" with "New expense" under it.
2. **Amount:** a large input "KES 0" (36sp, tabular), with the number keypad open.
3. **Category:** a wrapping set of 8px chips with icons: Transport, Ushuru, Fuel, Repairs (Matengenezo), Bags, Rent, Airtime, Electricity, County fees, Other, and "+ New category".
4. **Paid with:** segmented "Cash" / "M-Pesa".
5. **Note:** optional, sample "Ushuru at Gikomba gate".
6. **Date:** "Today", with a change link.
7. **Sticky bottom:** primary "Save expense, KES 50".
8. **Recent expenses** below the form: "Ushuru KES 50, today", "Fuel KES 300, yesterday".

**States:** a snackbar after saving, "Expense saved. Net profit updated.", with a "View" link (no Undo; corrections use Void).

### 3.11 Deni la Wateja / Customer debt

**[Core token block]**

**Layout:**
1. **Top bar:** title "Deni la Wateja" with "Customer debt" under it. Search icon.
2. **Total:** "Customers owe you KES 2,400" (28sp bold). Under it, "KES 1,200 overdue" in Tomato.
3. **Filters:** chips "All", "Overdue", "Due this week", "Favourites".
4. **List**, overdue first. Each row has a coloured left bar, a name, a right-aligned amount and a due line:
   - Otieno Ouma, KES 1,200, 2 days overdue (Tomato);
   - Wanjiku (star icon), KES 450, due kesho (Maize);
   - Mama Achieng, KES 300, no due date (Moss Grey);
   - Kamau Njoroge, KES 450, due Friday.

   Each row has a "Record payment" icon button.
5. **Button:** extended "Add customer".
6. **Bottom nav:** Deni active.

**Empty state:** "Nobody owes you money right now."

### 3.12 Customer ledger and Record payment

**[Core token block]**

**Layout:**
1. **Top bar:** back. Name "Otieno Ouma" with the phone number "0712 345 678" under it. Star and call icons.
2. **Balance:** "Otieno owes you KES 1,200" in Tomato because it's overdue. "Due Thu 22 Oct, 2 days late."
3. **Actions:** primary "Record payment" (sharing a reminder comes in a later phase).
4. **History**, newest first. Each row has the date, what happened, the amount, and the running balance right-aligned:
   - 24 Oct: payment received, minus KES 300, M-Pesa QJK7H2X9. Balance KES 1,200.
   - 20 Oct: sale on deni, plus KES 900, Mayai 2 tray and Sukuma 1 kilo. Balance KES 1,500.
   - 15 Oct: brought forward, plus KES 600, with a grey "Brought forward" tag. Balance KES 600.
5. **Record payment sheet**, open, rising from the button:
   - amount "KES 500" with chips "All KES 1,200", "KES 500", "KES 200";
   - Cash / M-Pesa; optional M-Pesa code;
   - preview "New balance: KES 700";
   - primary "Save payment".

**States:** overpaying shows "That's KES 100 more than Otieno owes. It will be kept as credit."

### 3.13 Bidhaa / Items

**[Core token block]**

**Layout:**
1. **Top bar:** title "Bidhaa" with "Items" under it. Search icon.
2. **Filters:** chips "All", "Goods", "Services", "Low stock".
3. **Rows:** name, then unit and prices on a second line, with stock right-aligned:
   - Sukuma wiki: kilo, sells KES 60, buys KES 40. Stock 2 kilo, with a Maize "Low" tag.
   - Mayai: tray, KES 420 / KES 360. Stock 1 tray, Low.
   - Viazi: gunia, KES 3,500 / KES 2,800. Stock 3 gunia.
   - Gikomba to Town trip: service, KES 200. Tag "Service, no stock".
4. **Button:** extended "Add item".
5. **Add item sheet**, open:
   - segmented "Goods" / "Service";
   - Name;
   - unit chips (kilo, gunia, tray, piece, crate, bag, litre, fundo, ndume, other), hidden for a service;
   - buying and selling price;
   - current stock and "Warn me when stock is below";
   - switch "Can sell half units (like ½ kilo)";
   - primary "Save item".

**Empty state:** "Add what you sell, like sukuma wiki or a delivery trip."

### 3.14 Mipangilio / Settings

**[Core token block]**

**Layout:**
1. **Top bar:** title "Mipangilio" with "Settings" under it.
2. **Biashara / Business:**
   - "Mama Wanjiku Mboga, Gikomba Market";
   - rows "Edit business profile" and "Redo onboarding answers";
   - row "Bring in your notebook".
3. **Usalama / Security:** "Change PIN", "Lock after 5 minutes", "Lock now" (one account per phone in R0, D-039).
4. **Hifadhi / Backup:**
   - "Last backup: today 10:45. Nothing waiting." with a "Back up now" button;
   - warning variant in Tomato: "Not backed up for 3 days. Connect to the internet."
5. **Lugha / Language:** "Screen text: English. Full Kiswahili coming soon."
6. **Andika Haraka / Quick entry:** greyed out with the tag "Coming soon".
7. **Data yako / Your data:** "To export or delete your data, contact us" with the support contact (self-serve export and delete arrive in Phase 7).
8. **Kuhusu / About:** version, privacy notice, "Sign out of this phone".

Each section title is bilingual, with Kiswahili over English.

**States:** offline disables "Back up now" and shows "Offline".

---

## 4. R1 screens

### 4.1 Manunuzi Mapya / New purchase

**[Core token block]**

**Layout:**
1. **Top bar:** close. Title "Manunuzi Mapya" with "New purchase" under it.
2. **Supplier:** recent chips "Mzee Kariuki (viazi)", "Gikomba Egg Depot", "+ New supplier".
3. **Lines** (goods only), with quantity, unit and buying price:
   - Viazi 2 gunia at KES 2,800 = KES 5,600;
   - Mayai 5 tray at KES 360 = KES 1,800.

   Helper: "Stock goes up when you save."
4. **Total:** "KES 7,400".
5. **Payment:** "Cash", "M-Pesa", "Other", then "Paid now". When paid is less than the total: "Paid now KES 3,000", "I owe KES 4,400" in Maize, due chips "Kesho", "Ijumaa", "Wiki ijayo" with English beneath.
6. **Warning row:** "Viazi cost KES 2,800, up from KES 2,500 last time."
7. **Sticky:** primary "Save purchase, KES 7,400".

### 4.2 Deni la Wasambazaji / Supplier debt

**[Core token block]**

**Layout:**
1. **Top bar:** title "Deni la Wasambazaji" with "Supplier debt" under it.
2. **Total:** "You owe suppliers KES 6,900". "KES 4,400 due this week" in Maize.
3. **Rows:**
   - Mzee Kariuki, KES 4,400, due Friday (Maize bar);
   - Gikomba Egg Depot, KES 2,500, 1 day overdue (Tomato bar).
4. **Ledger state** after tapping a row:
   - "You owe Mzee Kariuki KES 4,400";
   - primary "Pay supplier";
   - history rows: purchase on deni plus KES 4,400, payment minus KES 1,000, brought forward;
   - running balance right-aligned.
5. **Pay supplier sheet:** amount, Cash / M-Pesa, "New balance" preview.

**Empty state:** "You don't owe any supplier."

---

## 5. R2 screens

### 5.1 Kazi / Repair jobs

**[Core token block]**

**Layout:**
1. **Top bar:** title "Kazi" with "Repair jobs" under it. Search.
2. **Status tabs with counts:** "Received (3)", "In progress (2)", "Ready (1)", "Collected".
3. **Alert row** (Maize): "1 ready but not collected. 1 past its promised date."
4. **Job rows:**
   - Tecno Spark 10, cracked screen. Otieno Ouma. Promised Fri 30 Oct. Deposit KES 500. Status "In progress".
   - Boda chain and sprocket. Kamau Njoroge. Promised today. Status "Ready".
   - Radio with no sound. Mama Achieng. Promised date passed (Tomato). Status "Received".
5. **Button:** extended "New job".

**Empty state:** "No jobs yet. Add one when a customer brings in an item."

### 5.2 Kazi #014 / Job card

**[Core token block]**

**Layout:**
1. **Top bar:** back. Title "Kazi #014" with "Job card" under it. Customer "Otieno Ouma, 0712 345 678".
2. **Status stepper:** Received, In progress (current), Ready, Collected. A small Tomato "Cancel job" text button.
3. **Item:** "Tecno Spark 10, cracked screen". Note: "Customer wants an original screen". Promised Fri 30 Oct.
4. **Work:**
   - labour: "Screen fitting, service, KES 500";
   - part: "Tecno Spark screen, 1 piece, KES 2,200, from stock";
   - buttons "+ Labour" and "+ Part".
5. **Money:** total KES 2,700. Deposit paid KES 500 (M-Pesa). "Balance on collection KES 2,200" in Maize.
6. **Bottom:**
   - primary "Mark ready". Its helper text: "This records the sale. Parts leave stock now."
   - On a ready job, the primary becomes "Collected, record payment".

---

## 6. R3 screens

### 6.1 Ripoti / Reports

Credible enough to show a Chama treasurer or a microloan officer.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Ripoti" with "Reports" under it. Period chips "Today", "This week", "This month" (selected), "Custom".
2. **Profit:**
   - "Faida Halisi" with "Net profit" under it;
   - "October: KES 28,450" (36sp);
   - three aligned columns: Sales KES 96,200 / Cost of goods KES 52,300 / Expenses KES 15,450.
3. **Cash flow:** a two-row table:
   - Cash in KES 71,000, out KES 48,000;
   - M-Pesa in KES 22,300, out KES 9,800.
4. **Top items:** horizontal bars with no background track: Sukuma wiki KES 21,400, Mayai KES 18,900, Gikomba to Town trip KES 9,000.
5. **Deni ageing:** customer deni by age, in 4 columns: "Not due", "1 to 7 days", "8 to 30 days", "Over 30 days". The same table follows for supplier debt.
6. **Actions:** primary "Download PDF"; outlined "Share" and "Read aloud".

**States:** note "Reports work offline."

### 6.2 Ripoti ya PDF / PDF report

**[Core token block]**

**Layout:**
1. **Top bar:** back. Title "Ripoti ya PDF" with "PDF report" under it. Share icon.
2. **A4 page preview** (white page, thin border):
   - header "Mama Wanjiku Mboga, Gikomba Market. Business report, 1-31 October 2026. Made with Mazao.";
   - profit table: Sales, Cost of goods, Expenses, Faida Halisi (Net profit);
   - cash flow table;
   - customer and supplier deni ageing;
   - top 5 items;
   - footer "All records confirmed by the merchant. Brought-forward balances are not counted as profit." and the page number.
3. **Bottom:** primary "Save PDF"; outlined "Share on WhatsApp".

---

## 7. R4 screens

### 7.1 Andika Haraka / Quick entry

Type a record the way you'd say it, and Mazao drafts it.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Andika Haraka" with "Quick entry" under it. Chip "Runs on this phone".
2. **Text box:** a large text area. Sample: "sold sukuma 3 kilo 150 bob deni ya Wanjiku kesho".
3. **Examples:** tappable chips "mayai tray 1 cash 420", "fuel 300 mpesa", "Otieno paid 500".
4. **Action:** primary "Make draft". A disabled mic button with the hint "Voice coming soon".
5. **Loading:** a skeleton in the shape of the Review Card, with the text "Reading your entry".
6. **Footer:** "Nothing is saved until you check and confirm."

**States:**
- No model: "Quick entry needs a one-time download (about 400 MB, Wi-Fi)" with a "Set up" button.
- Couldn't understand: "Some parts weren't clear. Please fill them in." This opens the prefilled form.

### 7.2 Thibitisha / Check and confirm (Review Card)

Every AI-drafted record passes through this card. Trust is the whole point.

**[Core token block]**

**Layout:**
1. **Header:**
   - title "Thibitisha" with "Check and confirm" under it;
   - a "Sale" type tag;
   - a "Confidence: high" label. Use words, not a fake-precise percentage.
2. **What you typed:** the quoted text in a grey block: "sold sukuma 3 kilo 150 bob deni ya Wanjiku kesho".
3. **Fields**, each editable inline with a pencil:
   - Customer: Wanjiku;
   - Item: Sukuma wiki;
   - Quantity 3, unit kilo, price KES 50 per kilo;
   - Total KES 150;
   - Paid KES 0;
   - Deni KES 150, in Maize;
   - Due: Kesho (Sun 25 Oct).
4. **Warnings** (Maize block):
   - "KES 50 per kilo is below your usual KES 60."
   - "Wanjiku already owes KES 450. The new total will be KES 600."
   - A question: "Is 150 the total or the price per kilo?" with choices "Total" and "Per kilo".
5. **Bottom:** outlined "Cancel" and a full-width primary button labelled exactly: **[ ✅ Confirm & Save Record ]**. This label and its emoji are a product requirement; keep it exactly.

**States:** a blocking issue disables confirm and shows "Choose a customer to save this deni" in Tomato.

### 7.3 Andaa Andika Haraka / Set up quick entry (model download consent)

**[Core token block]**

**Layout:**
1. **Top bar:** title "Andaa Andika Haraka" with "Set up quick entry" under it.
2. **Explanation:** "Mazao can read entries like 'sold mayai tray 1 cash 420' and fill the form for you. It runs on your phone, so your records stay private and it works offline."
3. **Downloads**, as rows with checkboxes and sizes right-aligned:
   - entry model, about 400 MB, required;
   - memory for your items and customers, about 120 MB, recommended;
   - English voice, about 80 MB, coming soon (disabled).
4. **Data note:** "Total about 520 MB. Downloads only on Wi-Fi." Switch "Allow mobile data", off.
5. **Phone check:** "This phone: 4 GB memory. Supported." with a check icon.
6. **Buttons:** primary "Download on Wi-Fi"; text "Not now".
7. **Progress state:** "132 MB of 520 MB. Paused when Wi-Fi drops." with a Pause button.

**States:** unsupported phone: "This phone doesn't have enough memory for quick entry. The normal forms still work."

---

## 8. R5 screens

### 8.1 Sema / Speak (English voice)

**[Core token block]**

**Layout:**
1. **Top bar:** close. Title "Sema" with "Speak" under it. Chip "English only".
2. **Mic button:** a large round mic button (120dp, Sukuma Green) labelled "Hold to talk". This is the one round control in the app, because it's a physical press-and-hold target.
3. **Listening state:** a level meter that moves with the voice (no looping pulse), a timer "0:04", and the text "Listening. Hold the phone close."
4. **Transcript:** "sold two trays of eggs to Otieno, he paid 500, the rest on deni until Friday", with buttons "Try again" and "Edit text".
5. **Action:** primary "Make draft", which opens Thibitisha.
6. **Note:** "Your voice stays on this phone and is deleted after reading."

**States:**
- Unclear audio: "That wasn't clear. Try again or type it." with a "Type instead" button.
- No voice model: the setup prompt.

---

## 9. R6 screens

### 9.1 Mtandao / Network

A map of who the business trades with and who owes what.

**[Core token block]**

**Layout:**
1. **Top bar:** title "Mtandao" with "Network" under it. Period chips "This week", "This month" (selected), "All time".
2. **Legend:** a key with shapes, not decorative dots:
   - filled circle = customer;
   - outlined circle = supplier;
   - square = item;
   - Tomato ring = owes money.
3. **Map:**
   - the business "Mama Wanjiku Mboga" as a large Sukuma Green node in the centre;
   - customers Wanjiku, Otieno Ouma (Tomato ring, owes KES 1,200), Mama Achieng and Kamau Njoroge;
   - suppliers Mzee Kariuki and Gikomba Egg Depot;
   - items Sukuma wiki, Mayai and Viazi;
   - line thickness = money this month, with "KES 9,400" on the thickest line;
   - a grouped node "+12 more".
4. **Selected-node sheet:** "Otieno Ouma bought KES 5,600 this month and owes KES 1,200. Top item: Mayai." Button "Open ledger".
5. **Controls:** zoom in, zoom out and "Centre" buttons.

**Empty state:** "Record a few sales and purchases to see your network."

---

## 10. Shared components

### 10.1 Backup status (component, R0)

**[Core token block]**

**Show on one board:**
1. **Top-bar chip:**
   - "Backed up" (cloud-check icon);
   - "Not backed up (3)" (cloud-off icon);
   - "Saving…" (small progress ring inside the chip only);
   - "Sign in to back up" (cloud-alert icon, Maize).
2. **Inline banner** (Maize, dismissible): "You're offline. Your records are safe on this phone and will back up when you connect."
3. **Warning banner** (Tomato border): "Not backed up for 3 days. Connect soon so you don't lose records." Button "Back up now".
4. **Snackbar:** "Sale saved. It will back up when you're online." with a "View" link (no Undo, D-018).

### 10.2 Save anyway dialog (component, R0)

Shown when a warning rule set to "block" stops a save. The merchant can still record what really happened.

**[Core token block]**

**Layout:**
1. **Title:** a warning icon (Maize) and the title "Stock looks wrong".
2. **Body:** "Mazao shows 0 trays of mayai, but you're selling 2. If you really sold them, your stock count is probably off."
3. **Choices** as two radio rows:
   - "My stock count is wrong. Save and set stock to 2 trays" (recommended, preselected);
   - "Save anyway. I'll fix stock later".
4. **Buttons:** outlined "Go back"; primary "Save".
5. **Footnote** in Moss Grey: "We'll note that this was saved with a warning."

---

## 11. Translation table (Kiswahili to English)

v3: the UI ships in English; this table is the source for the **Kiswahili** language option, not for on-screen bilingual titles.

Native-speaker check needed for rows marked ⚑. These are titles we wrote, not established terms.

| Kiswahili | English | Where | Check |
|---|---|---|---|
| Muhtasari | Overview | nav, title | |
| Mauzo | Sales | nav, title | |
| Mauzo Mapya | New sale | title | ⚑ |
| Manunuzi | Purchases | nav | |
| Manunuzi Mapya | New purchase | title | ⚑ |
| Deni | Debts | nav | |
| Deni la Wateja | Customer debt | title | |
| Deni la Wasambazaji | Supplier debt | title | |
| Wanaokudai | Who owes you | Muhtasari section | ⚑ |
| Wanaonidai / Ninaowadai | Customers who owe me / Suppliers I owe | notebook tabs | ⚑ |
| Gharama | Expenses | nav | |
| Gharama Mpya | New expense | title | ⚑ |
| Bidhaa | Items | nav, title | |
| Stoki | Stock | notebook tab | ⚑ |
| Kazi | Repair jobs | nav, title | ⚑ (Kazi literally means "work/job") |
| Mtandao | Network | nav, title | |
| Ripoti | Reports | nav, title | |
| Ripoti ya PDF | PDF report | title | |
| Mipangilio | Settings | nav, title | |
| Zaidi | More | nav | |
| Faida Halisi | Net profit | money label | |
| Karibu Mazao | Welcome to Mazao | title | |
| Weka PIN | Set your PIN | title | ⚑ |
| Fungua Mazao | Unlock Mazao | title | ⚑ |
| Tuanze | Let's get started | title | ⚑ |
| Wasifu wa Biashara | Business profile | title | ⚑ |
| Leta Daftari Lako | Bring in your notebook | title | ⚑ |
| Andika Haraka | Quick entry | title | ⚑ |
| Andaa Andika Haraka | Set up quick entry | title | ⚑ |
| Thibitisha | Check and confirm | title | ⚑ |
| Sema | Speak | title | ⚑ |
| Biashara / Usalama / Hifadhi / Lugha / Data yako / Kuhusu | Business / Security / Backup / Language / Your data / About | settings sections | ⚑ |
| Kesho / Ijumaa / Wiki ijayo / Mwisho wa mwezi | Tomorrow / Friday / Next week / End of month | due chips | |
| Anza bure / Ingia / Anza leo | Start free / Sign in / Start today | landing CTAs | ⚑ |
| Daftari lako la biashara, sasa kwenye simu | Your business notebook, now on your phone | landing hero | ⚑ |
| Hakuna mtandao? Sawa. | No network? Fine. | landing | ⚑ |
| Jua nani anakudai | Know who owes you | landing | ⚑ |
| Data yako ni yako | Your data is yours | landing | ⚑ |
| Daftari linalokupigia hesabu | A notebook that does the maths for you | landing | ⚑ (coined phrase, likely needs rewording) |

**Tip:** after generating §1, export the design system to `DESIGN.md` with `stitch-utilities:design-md`. Generate later screens against it.
