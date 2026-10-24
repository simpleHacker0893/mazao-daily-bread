# R0 Stitch designs (D0, issue #21)

Visual reference only. The blueprint wins on behaviour, strings and data, and builders never block on these files.

- **Stitch project:** `2699180917177352710` ("Mazao")
- **Design system asset:** `assets/1804728590969588898` ("Mazao Market Tool"). Export: [`DESIGN.md`](DESIGN.md)
- **Prompts:** [`../stitch-prompts.md`](../stitch-prompts.md) v3 (English by default, imagery addendum, mobile + desktop)
- **Naming:** `<section>-<slug>-<mobile|desktop>.png/.html`, so reruns overwrite cleanly. Approved screens go in this folder. Unapproved drafts go in `drafts/`.

## Status (2026-10-24 14:31 UTC): blocked on Stitch

Stitch generated the first two screens, then stopped finishing jobs. Since about 13:45 UTC, every `generate_screen_from_text` and `edit_screens` call has timed out, and no screen has appeared in the project afterwards. The project still lists the style-board edit as "Generating Screen..." and three landing photos as "Generating Image...". This covers about 18 requests, including one short prompt on `GEMINI_3_5_FLASH_LITE`. To rerun, generate only the screens below that have no ID.

## Screen register

| § | Screen | Mobile ID | Desktop ID | Status |
|---|---|---|---|---|
| 1 | Design system style board | n/a | `4b5b040d13a64a94b6d2eb827f53bd8b` | Draft. Stitch regenerated it automatically after the English-first design-system update. It still shows Kiswahili text in parentheses and a sentence containing the word "Undo", so it needs the pending edit before approval. An older bilingual board, `c404b3f7e7ef41ec93206a52638ca70c`, is superseded. |
| 2.1 | Landing page (/welcome) | `abae87db4d2e42b3965f011039c58fec` | not generated | Draft, **rejected**: it uses the v2 bilingual copy (Kiswahili headlines). It needs an English edit, then a desktop variant. |
| 3.1 | Welcome to Mazao (sign in + language switch) | not generated | not generated | Blocked |
| 3.2 | Set your PIN | not generated | not generated | Blocked |
| 3.3 | Unlock Mazao | not generated | not generated | Blocked |
| 3.4 | Let's get started (onboarding) | not generated | not generated | Blocked |
| 3.5 | Business profile | not generated | not generated | Blocked |
| 3.6 | Bring in your notebook | not generated | not generated | Blocked |
| 3.7 | Overview | not generated | not generated | Blocked (plus an optional Kiswahili variant) |
| 3.8 | New sale | not generated | not generated | Blocked |
| 3.9 | Sales | not generated | not generated | Blocked |
| 3.10 | New expense | not generated | not generated | Blocked |
| 3.11 | Customer debt | not generated | not generated | Blocked |
| 3.12 | Customer ledger + Record payment | not generated | not generated | Blocked |
| 3.13 | Items | not generated | not generated | Blocked |
| 3.14 | Settings (with English / Kiswahili switch) | not generated | not generated | Blocked |
| 10.1 | Backup status component | not generated | not generated | Blocked |
| 10.2 | Save anyway dialog | not generated | not generated | Blocked |

Supporting photos that Stitch generated for the landing page are saved in the repo under `public/images/stitch/` (reference them in code as `/images/stitch/<file>`): `mama-mboga-stall.jpg`, `notebook-hands.jpg`, `gikomba-aisle.jpg`, `duka-shelf.jpg`, `boda-rider.jpg`, `phone-fundi-kiosk.jpg`. Stitch IDs, in the same order: `da65c33e93a9411eb8c7df7eec4cf6e8` (mama mboga), `be6bc904b6ad4451af201c823a9aa13f` (notebook hands), `f1de9518c64a486f84ec8001cad09642` (Gikomba aisle), `bdf7eb1f6cd046bd8f4bad9203ce1c3f` (kiosk shelf), `a634ac4caa384b6b9433960b923f677a` (boda rider), `b143a01d738745419b75e40e01d27cdf` (phone fundi).

## Approval

The product owner has not approved any screen yet. Record approvals here and in the PR, then move each approved file out of `drafts/`.

## Rerun procedure

1. Run `list_screens` on project `2699180917177352710` and check for any screens that finished late.
2. For each row without an ID, run `generate_screen_from_text` with `deviceType: MOBILE`, `designSystem: assets/1804728590969588898`, the §-prompt from `stitch-prompts.md` and the v3 overrides (English copy, the matching imagery line, and the Core token block). Send **one request at a time** and wait for it to finish. Stitch appears to process one job per project, and parallel calls were silently lost.
3. Generate the desktop frame (1280) the same way with `deviceType: DESKTOP`. Keep the bottom navigation and use a centred column with a max width of about 960px. The landing page gets a true desktop layout.
4. Download each screenshot (append `=s0` to the `lh3.googleusercontent.com` URL for full size) and the HTML into this folder, named as above.
5. Before approval, check that no export contains "Switch account", "Add another account", "Backing up" or an "Undo" action.
