# Mazao design system (Stitch export, v3)

Stitch project `2699180917177352710` ("Mazao"), design system asset `assets/1804728590969588898` ("Mazao Market Tool").

Theme settings: light mode, Manrope for headline, body and label, `ROUND_EIGHT`, colour variant `FIDELITY`, primary `#14532D`, secondary `#4E5A52`, tertiary `#8A5A00`, neutral `#F3F5F2`.

The design markdown sent to Stitch with `update_design_system` follows. The project's stored `designTheme.designMd` still shows the earlier v2 (bilingual) text, because Stitch had not applied the update when this was exported.

---

Offline bookkeeping app for Kenyan market traders (Gikomba) on low-cost Android phones, used standing at a stall in direct sun, often one-handed. Feels like a sturdy honest tool: a good weighing scale or a well-kept ledger. Money must be impossible to misread.

## Colours (light theme only)
- Chalk #F3F5F2 page background (cool off-white, never cream)
- Surface #FCFDFB cards and sheets, 1px Line #D5DCD6 border
- Ink #141A16 text and money figures
- Moss Grey #4E5A52 secondary text
- Sukuma Green #14532D (pressed #0D3B20): the ONLY action colour; primary buttons, active nav item, focus rings
- Deni Maize #8A5A00 text on Maize Tint #FFF1C9: debts and warnings
- Overdue Tomato #B42318 on #FDECEA: overdue, errors, destructive only
- Slate #35556B: M-Pesa segments in money bars only

## Type
Manrope only, tabular figures on every amount, format "KES 1,250". Screen title 22/28 semibold, subtitle 14/20 Moss Grey, section 16 semibold, body 16/24, small 13, hero money 36 bold (tracking -0.01em).

## Language
The UI is ENGLISH by default: titles, navigation, buttons and body text are all English, one language per label (no bilingual stacked titles). Kiswahili is a user-selectable language (English / Kiswahili switch in Settings and once during sign-in/onboarding). Market unit words and item names stay as merchants say them: kilo, gunia, fundo, tray, sukuma wiki, mayai, M-Pesa.

## Shape and layout
8px radius on buttons, inputs, chips, rows, cards; bottom sheets 16px top corners only. Touch targets at least 48dp with 8dp gaps. Primary button filled 52dp full width. Mobile: Android 360x800, edge-to-edge. Desktop 1280: same bottom navigation, centred content column (max ~960px), wider cards and tables; never a sidebar or rail.

## Navigation
Bottom navigation at every width (no sidebar, no rail): Overview, Sales, Debts, Expenses, More.

## Sync chip
Top-bar chip: "Backed up" (cloud-check), "Not backed up (3)" (cloud-off), "Saving…" (small ring), "Sign in to back up" (cloud-alert, Maize).

## Imagery
Photographs only, never illustrations: natural daylight Kenyan market photography.

## Do not
No gradients, glows, glass, emoji, em-dashes, decorative dots, avatars, illustrations, purple/blue AI glow, cards in cards, uppercase eyebrows, generic names. Snackbars use a "View" link and never offer a reversal action (records are immutable; corrections use Void). No account switching or adding accounts on one phone.
