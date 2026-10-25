# Phase 0: Design system, imagery & landing page
> Release: R0 (pilot) · Milestone: R0 pilot, Gikomba, Mon 2026-10-26 · Blueprint steps: A1a, A1b, A2, D0, A6 task 6 (landing at `/welcome`) · Depends on: none · Label: ready-for-agent

## Problem Statement

A Gikomba merchant who hears about Mazao from the pilot team, or opens a link a friend sent on WhatsApp, has nothing to look at yet. There is no page that tells them, in words and pictures they recognise from their own market, what Mazao is, that it is free, that it works with no network, and that their deni and profit stay theirs. There is no app to install, and no screen that opens when the network drops in a crowded aisle.

The two developers building R0 over one weekend have the same gap from the other side. The repo holds only documents. There is no project skeleton, no shared contracts for the two lanes to code against, no CI, no deploy target, no service worker, no navigation, and no visual reference beyond a long prompt file. If every builder invents their own look, the pilot screens will be inconsistent and will drift toward generic AI-default styling that does not read in direct sun on a cheap Android phone.

The owner has also decided (Owner, 2026-10-24) that screens should carry real imagery of Kenyan market life. Without a defined pipeline, images would arrive at random sizes, without consent from the people photographed, without a guaranteed contrast for the text placed over them, and either missing offline or bloating the offline cache on a 3 GB phone with paid data.

## Solution

From the merchant's side: a visitor who opens the Mazao address sees a fast, light landing page at `/welcome` with daylight photographs of Gikomba (a mama mboga at her stall, hands writing deni in an exercise book, a busy aisle, a boda rider, a repair fundi). Every heading is bilingual, Kiswahili first with English beneath (D-040). One action, "Anza bure / Start free", takes them to sign-in. They can add Mazao to their home screen, and from then on the app shell, bottom navigation and every R0 page open even with the network off. Sign-in, PIN and onboarding screens greet them with a market photograph behind a solid scrim, while the work screens (forms, lists, Muhtasari) stay plain and high-contrast for sunlight.

From the team's side: Phase 0 delivers everything the later phases stand on.
1. **Automated Stitch generation (D0, automated).** The design system, the landing page (mobile, then desktop) and every R0 screen are generated in Stitch from `docs/design/stitch-prompts.md` through the Stitch MCP, driven by the `stitch-utilities:stitch-loop` and `stitch-design:generate-design` skills, and exported as screenshots for builders (Owner, 2026-10-24).
2. **Imagery pipeline.** A repeatable way to source, record consent for, optimise, scrim and cache every image, with a manifest that a test checks.
3. **Landing page** at `/welcome` (D-044), built to the `design-taste-frontend` rules in Persuade mode.
4. **App skeleton and tooling** (A1a, A1b): pnpm, latest Next.js App Router with no `src/`, React Compiler, Biome, webpack build for Serwist, Prisma initialised, CI, Vercel in `fra1`, and the frozen cross-lane contracts.
5. **PWA shell** (A2): manifest and icons, Serwist service worker with explicit cache rules, bilingual bottom navigation, the `PageTitle` primitive, a stubbed sync chip, placeholder pages for every route, and a cold-offline test.

The sprint-001 blueprint stays the execution plan. This spec regroups its steps into one phase and adds the owner's imagery and automation decisions on top.

## User Stories

**First-time visitor**
1. As a first-time visitor (a mama mboga who got a link on WhatsApp), I want the landing page to open quickly on my phone over paid data, so that I do not give up before I see what Mazao is.
2. As a first-time visitor, I want to see photographs of a real Kenyan market and people like me, so that I believe Mazao was made for my kind of business and not copied from abroad.
3. As a first-time visitor, I want the headline in Kiswahili with the English directly beneath, so that I understand it whichever language I read more easily.
4. As a first-time visitor, I want one clear "Anza bure / Start free" button, so that I know exactly what to do next.
5. As a first-time visitor, I want to see the paper notebook compared with Mazao, so that I understand it does the maths my notebook cannot (who owes me, Faida Halisi).
6. As a first-time visitor, I want to read "Hakuna mtandao? Sawa. / No network? Fine.", so that I know it works in a Gikomba aisle with no signal.
7. As a first-time visitor who runs a boda or repair business, I want to see that Mazao covers services as well as goods, so that I do not assume it is only for shops.
8. As a first-time visitor, I want a short "Your data is yours" section, so that I know my PIN never leaves my phone and backups are stored in the EU.
9. As a first-time visitor, I want a short FAQ (free, offline, lost phone, boda or repair, Kiswahili), so that my main doubts are answered without calling anyone.
10. As a first-time visitor, I want the page to show real screenshots of the app inside a phone frame, so that what I see is what I will get, not a mock made of boxes.
11. As a first-time visitor on a slow connection, I want text and the Start button to appear before the photographs finish loading, so that I can act even if images are slow.
12. As a first-time visitor whose phone has "data saver" on, I want below-the-fold photographs to load only when I scroll to them, so that the page does not eat my bundle.
13. As a first-time visitor reading in bright sun, I want any text placed over a photograph to sit on a solid scrim, so that I can still read it.
14. As a first-time visitor who uses a screen reader or large text, I want every photograph to have a meaningful description and the page to work at 200% text size, so that the page is usable for me too.
15. As a chama leader or NGO partner on a laptop, I want a desktop layout of the landing page, so that I can judge Mazao before recommending it to members.

**Merchant (installing and moving around the app)**
16. As a merchant (kiosk owner), I want to add Mazao to my home screen from Chrome and have it open full screen with the Mazao icon, so that it feels like a real app.
17. As a merchant, I want every R0 page to open after the first load even when the network is off, so that I can record sales in a dead spot.
18. As a merchant, I want a page I open from a shared or saved link (for example a customer ledger with an id in the address) to open offline too, so that links never show a browser error.
19. As a merchant, I want the bottom navigation on every screen with five items (Muhtasari / Overview, Mauzo / Sales, Deni / Debts, Gharama / Expenses, Zaidi / More), so that I always know where I am.
20. As a merchant who does not read Kiswahili well, I want every navigation label and page title to show its English translation beneath, so that I am never lost (D-040).
21. As a merchant, I want "Zaidi / More" to open a drawer with Bidhaa / Items and Mipangilio / Settings, so that less-used pages are one tap away without crowding the bar.
22. As a merchant with big fingers using one hand at the stall, I want every tap target at least 48 px, so that I do not hit the wrong item.
23. As a merchant, I want a chip at the top of the screen that will show my backup state, so that I always know whether my records are safe (stubbed now, live in Phase 1).
24. As a merchant, I want a small "Update available. Tap to reload." message when a new version is ready, so that I get fixes without reinstalling and never get stuck on a stale build (R-010).
25. As a merchant using the app in sunlight, I want the work screens (forms, lists, Muhtasari) to stay plain with no busy background photographs, so that numbers are impossible to misread.
26. As a merchant, I want the sign-in, PIN and onboarding screens to show a familiar market photograph, so that the first minutes feel welcoming and local.
27. As a merchant who opens the PIN screen offline, I want its background photograph to be there as well, so that the app does not look broken when I have no network.
28. As a merchant on a 3 GB phone, I want the app to cache only the few images it needs offline, so that it does not fill my storage.
29. As a merchant, I want empty pages (no sales yet, nobody owes me) to show a friendly image and one clear action, so that a blank screen does not confuse me.
30. As a merchant, I want an image that failed to load to simply disappear behind a plain colour, so that I never see a broken-image icon.

**Merchant (privacy and consent)**
31. As a Gikomba trader who was photographed for Mazao, I want my consent asked and recorded before my photo is used, and the right to have it removed, so that my image is not used without my agreement.
32. As a merchant, I want no photograph to show a real, identifiable person's name, phone number or M-Pesa details, so that nobody's private information appears in the app.

**Pilot coordinator**
33. As a pilot coordinator, I want a stable production address with the landing page, so that I can share one link with the 5 merchants on Monday.
34. As a pilot coordinator, I want the exported R0 screen images, so that I can prepare the install guide and show merchants what to expect.
35. As a pilot coordinator taking photos in Gikomba, I want a simple consent script and register, so that I collect consent the same way every time.

**Developer**
36. As a developer, I want a project skeleton with pnpm, latest Next.js, no `src/`, React Compiler, Biome and strict TypeScript, so that I start coding on the house rules immediately (D-043).
37. As a developer in lane B, I want the shared contracts (session shape, device database schema, i18n dictionary halves, route-after-PIN stub) merged within the first 45 minutes, so that I can code against them in parallel (R-011).
38. As a developer, I want CI to run Biome, typecheck, tests and the webpack build on every PR, so that broken code never reaches `main` (AC-01).
39. As a developer, I want every PR to get a Vercel preview in `fra1`, so that I can test on a real phone before merging (D-035).
40. As a developer, I want Prisma initialised with the latest version, two connection strings documented, and generate running on install, so that Phase 1 can add the schema without setup work (D-037).
41. As a developer, I want the service worker rules written explicitly (no default cache), so that `/api/*` and Clerk calls are never cached.
42. As a developer, I want a cold-offline Playwright test that opens every route on the built app, so that an offline regression fails CI instead of failing in the market (AC-09).
43. As a developer, I want the R0 Stitch screenshots in one folder with stable names, so that I can match my page to its design without opening Stitch.
44. As a developer, I want an image manifest that a test checks for size, format, alt text, consent and precache role, so that a wrong image cannot slip in.

**Product owner**
45. As the product owner, I want the Stitch design system, landing page and R0 screens generated automatically from the prompt file, so that the visual reference exists by Saturday night without hand work.
46. As the product owner, I want to approve each generated screen before it is exported, so that nothing off-brand becomes the builders' reference.
47. As the product owner, I want the landing page to be cut first if the team is behind at the Sunday 18:00 checkpoint, so that it never endangers offline save, PIN or backup (blueprint Cut 0).

## Implementation Decisions

**Phase grouping (Owner, 2026-10-24).** Phases 0 to 4 together are the R0 pilot. Each phase is one sprint-sized unit and one GitHub spec issue labelled `ready-for-agent`. Phase 0 regroups blueprint steps A1a, A1b, A2, D0 and the optional landing task from A6. The blueprint remains the execution plan, branch names stay `feat/<step-id>-<slug>`, and the merge order in A6 is unchanged.

**1. Stitch generation runner (D0, automated; Owner, 2026-10-24).**
- Driven by an agent using the Stitch MCP through the `stitch-utilities:stitch-loop` and `stitch-design:generate-design` skills. It is a repeatable procedure, not app code.
- Order, matching the prompt file's "How to use": create or reuse one Stitch project "Mazao"; generate the Design System (§1) and save it as the project design system; generate the landing page (§2.1) on MOBILE then a DESKTOP variant; generate every R0 screen (§3.1 to §3.14) and the two R0 shared components (§10.1, §10.2) on MOBILE, pasting the Core token block wherever a prompt says so.
- Imagery addendum: for the landing page, sign-in (§3.1), Weka PIN (§3.2), Fungua Mazao (§3.3) and onboarding (§3.4, §3.5, §3.6), the runner appends the owner's imagery rule (photographic background under a solid scrim, text on a solid surface panel). For all other R0 screens it appends "imagery only in the header band and empty state". This overrides the Core token block's "no illustrations" only to allow photographs, never illustrations.
- Edits follow the prompt file's rule: one targeted change per edit, no full regeneration to fix a detail.
- Approval gate: the product owner approves each screen; only approved screens are exported.
- Output: one screenshot per approved screen and state into the R0 design export folder (named in Further Notes), named by prompt section number and slug so reruns overwrite cleanly, plus a design markdown export of the design system (the prompt file's tip, via `stitch-utilities:design-md`). The runner records the Stitch project and screen IDs it used so a rerun regenerates only missing or rejected screens.
- Stitch output is a visual reference only. The blueprint wins on behaviour, strings and data. Builders never block on D0.
- Known conflicts the runner must correct with an edit before approval (see Further Notes): "Switch account" and "Add another account" on Fungua Mazao (D-039), "Backing up" chip wording versus "Saving…" (RQ-1), and the snackbar "Undo" (records are immutable, D-018).

**2. Imagery pipeline (Owner, 2026-10-24).**
- Roles. Every image has exactly one role: `landing`, `auth-background` (sign-in, set PIN, unlock), `onboarding-background` (onboarding questions, review, notebook), `header` or `empty-state`. Work screens (forms, lists, Muhtasari) may use only `header` and `empty-state` images. No role permits images behind numbers or form fields.
- Sources. Either Stitch or image generation, or real Gikomba photographs taken with consent. Briefs come from the landing prompt (mama mboga at her stall, hands writing deni in an exercise book, crowded aisle from above, kiosk shelf, boda rider with a delivery crate, phone fundi at a repair bench). Generated images must not imitate a real identifiable person, must not show real brand logos, phone numbers or M-Pesa details, and are never illustrations or fake dashboards.
- Consent for real photographs. Each identifiable person gives informed consent (purpose, where it appears, how to withdraw) before use. A consent register links each photo to a consent reference. The register itself holds personal data and is kept outside the public repo by the product owner; the repo stores only the consent reference. Withdrawal means the image is removed in the next deploy. ASSUMPTION: verbal consent recorded on the register by the pilot coordinator is acceptable for the pilot; Q-008 asks the owner to confirm.
- Optimisation. Each image is exported as AVIF with a WebP fallback, each file at most 150 KB. Backgrounds get a mobile width (ASSUMPTION: 720 px wide, covering 360 px at 2x density) and, for the landing page only, a desktop width. Metadata (including GPS location) is stripped. Images are served as pre-optimised static files, not through the Next.js on-demand image optimiser, because optimiser responses are dynamic and cannot be precached, and they count against Vercel free-tier limits (D-003).
- Scrims. Text never sits directly on a photograph. A scrim is a flat, solid layer in a design-system colour (no gradient, per the design system's "no gradients" rule). Interactive content (the sign-in card, the PIN pad, onboarding answers) sits on a solid Surface panel, not on the photo. Any text placed on the scrim must meet WCAG AA against the worst case: 4.5:1 for body text and 3:1 for large text, measured against the scrim composited over the image's brightest region. ASSUMPTION: the default scrim is Ink #141A16 at 70% opacity with Surface #FCFDFB text; the measured contrast, not the opacity, is the rule. The English caption under a bilingual title on a scrim uses an on-image caption colour that passes AA; the normal Moss Grey caption is only used on Chalk or Surface.
- Caching. Only `auth-background` and `onboarding-background` images are precached by the service worker, one mobile variant each (AVIF, with WebP only if the device lacks AVIF support; ASSUMPTION: total precached imagery at most 600 KB). `landing`, `header` and `empty-state` images are fetched on demand with a capped runtime cache (ASSUMPTION: CacheFirst, at most 30 entries), and every placement degrades to its plain background colour when the image is absent, so offline pages never show a broken-image icon.
- Manifest. A single typed manifest is the source of truth for images and drives both rendering and precache entries:

  ```ts
  type ImageEntry = {
    id: string;                       // stable slug
    role: 'landing' | 'auth-background' | 'onboarding-background' | 'header' | 'empty-state';
    source: 'generated' | 'gikomba-photo';
    consentRef: string | null;        // required when source = 'gikomba-photo' and a person is identifiable
    alt: { en: string };              // empty string only for purely decorative backgrounds
    focalPoint: { x: number; y: number }; // 0..1, keeps the subject visible when cropped
    variants: { width: number; format: 'avif' | 'webp'; bytes: number }[];
    precache: boolean;                // true only for auth-background and onboarding-background
    scrimContrast: number | null;     // worst-case measured ratio for text placed on this image
  };
  ```
- Alt text comes through i18n like every other string (D-005). Purely decorative backgrounds behind a titled screen have empty alt text so screen readers are not repeated at.

**3. Landing page at `/welcome` (D-044).**
- Static, client-renderable, precached page; `/` stays the app (Muhtasari). LockGuard (Phase 1) sends a phone with no device account to `/welcome`. If Cut 0 is applied at the Sunday checkpoint, LockGuard sends it to `/sign-in` instead and nothing else changes.
- Built to the `design-taste-frontend` skill rules in Persuade mode, with the dials from the prompt file (DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 4), the same tokens as the app (Chalk, Ink, Moss Grey, Sukuma Green as the only action colour, Maize for deni accents, Manrope, 8 px radius, light theme), mobile first at 360 px then a 1280 px desktop layout, and the skill's pre-flight check before the PR.
- Sections exactly as §2.1 of the prompt file (header, asymmetric hero, notebook versus Mazao, offline story, deni, goods and services bento, three actions, data yako ni yako, FAQ, closing band, footer), with its rules: no logo wall, statistics, testimonials or ratings; no eyebrows; no em-dashes; no pills over photos; no scroll cue. Owner, 2026-10-24 adds: photographs may be used as section backgrounds under a solid scrim where the layout puts text on them.
- Phone-frame slots show real screenshots (approved Stitch exports until the built app exists, then screenshots of the built app). No div-based fake screenshots.
- The page contains no Clerk component and no data fetching, so it stays static and light. Both CTAs link to `/sign-in`.
- Copy that would promise features not in R0 is changed (see Q-010): "export or delete anytime" and "reminders to share on WhatsApp" are R3 or later.
- Every string, including FAQ answers and alt text, goes through the i18n dictionary; headings are bilingual pairs.

**4. App skeleton and tooling (A1a, A1b; D-036, D-037, D-042, D-043).**
- Scaffolded with the latest create-next-app in a sibling folder and copied in (the tool refuses a non-empty folder), keeping the remote's initial commit. No `src/`; code folders at the repo root. React Compiler on with its Babel plugin present for the webpack build. Biome is the only linter and formatter; no ESLint or Prettier config may exist. pnpm pinned through `packageManager`; only `pnpm-lock.yaml` is committed. TypeScript strict with `noUncheckedIndexedAccess`.
- Scripts as listed in AGENTS.md. `build` is `next build --webpack` (D-042), and Vercel uses the same command. `postinstall` runs Prisma generate.
- Cross-lane contracts created here and changed only with both developers agreeing in the PR (R-011):
  - Session: `{ profileId, businessId, clerkUserId, email } | null` with set and clear operations.
  - Device database `mazao-device`: `accounts` keyed by `profileId` with `clerkUserId, email, businessId, pinHash, pinSalt, failedAttempts, lockedUntil, lastUnlockedAt`, and `meta` keyed by `key`.
  - Route after PIN: an async function returning a route, stubbed to `/`, implemented in Phase 3 (B4).
  - i18n: two dictionary halves (shell and ledger) merged into one, a `t()` lookup, and navigation labels as `{ sw, en }` pairs (D-040).
- Prisma initialised at the latest version following its current docs; config declares the schema path and uses `DIRECT_URL` for migrations and `DATABASE_URL` (pooled) at runtime (D-037). No models yet (Phase 1).
- Environment template lists the Clerk publishable and secret keys, the sign-in URL `/sign-in`, `DATABASE_URL` and `DIRECT_URL`. No secrets in the repo.
- CI on PRs and `main`: install with frozen lockfile, Biome CI, typecheck, test, build. Vercel project linked, region `fra1`, preview per PR.

**5. PWA shell (A2; D-040, D-041, D-042).**
- Manifest: name and short name "Mazao", standalone, start URL `/`, theme and background colours from the design tokens, 192, 512 and maskable icons.
- Service worker (Serwist) with explicit rules and no spread of the default cache:
  - Precache: build assets; every static route with the build ID as revision: `/`, `/sales`, `/sales/new`, `/expenses`, `/expenses/new`, `/debts`, `/debts/customer`, `/items`, `/settings`, `/onboarding`, `/onboarding/review`, `/notebook`, `/lock`, `/set-pin`, plus `/welcome` (D-044) and the precache-flagged images from the manifest.
  - Navigations: NetworkFirst with a 3 s timeout, falling back to the precached page matched on path only, so query-string routes work offline (D-041).
  - NetworkOnly for `/api/*` and all Clerk domains.
  - CacheFirst for static build files, fonts and icons; the capped runtime image cache from the imagery pipeline.
- Update flow: a waiting worker shows the update toast; tapping it activates the new worker and reloads (R-010).
- AppShell: bottom navigation at every width, no sidebar or rail (D-040), five items with a Kiswahili label over a small English caption, the Zaidi drawer, tap targets of at least 48 px, Manrope through the Next.js font loader, tokens as CSS variables.
- `PageTitle` primitive: Kiswahili title (22sp semibold Ink) with English directly beneath (14sp Moss Grey), never on one line. It also has an on-image variant for scrimmed screens. Created here, owned by lane B afterwards.
- Sync chip in the top bar reading a sync-status hook, stubbed here and implemented in Phase 1 (A5).
- Placeholder pages for every route, each rendering its `PageTitle` through `t()`, as client pages with no server data fetching and no dynamic segments.

## Testing Decisions

A good test checks behaviour a merchant or builder can observe (a page opens offline, a title shows both languages, an image is within budget), never internal structure such as component trees or class names.

Seams, highest first:
- **Playwright against the built app** (`pnpm build && pnpm start`, never dev). This is the main seam for Phase 0.
  - Cold offline (prior art: AC-09 and the A2 brief): load `/`, wait for the service worker, open a new page in the same context, go offline, open every route directly including `/welcome`, `/sales/new` and `/debts/customer?id=00000000-0000-4000-8000-000000000000`; each renders its bilingual `PageTitle`.
  - Offline imagery: with the network off, `/lock` and `/onboarding` render their background image from cache; a header or empty-state image that is not cached leaves no broken-image element.
  - Navigation: all five nav items and the two Zaidi entries show Kiswahili plus English (AC-21 for the shell part); every tap target is at least 48 px.
  - Cache rules: after browsing, no `/api/*` or Clerk response exists in any cache.
  - Landing: `/welcome` renders, both CTAs lead to `/sign-in`, below-the-fold images are lazy, and an automated accessibility scan reports no AA violations (ASSUMPTION: axe through Playwright).
- **Imagery manifest check (unit test).** Pure input to output over the manifest and the files: every file at most 150 KB; AVIF and WebP present; `precache` true only for the two background roles; total precached bytes within budget; alt text present unless decorative; `consentRef` present for every identifiable Gikomba photo; `scrimContrast` at least 4.5 wherever text is placed on the image. The contrast value is computed by the pipeline from the scrim colour composited over the image's brightest region, so it is deterministic.
- **Tooling checks.** CI green on the PR (AC-01); no ESLint or Prettier config exists; the build command is the webpack build; Lighthouse PWA installability passes on the preview URL.
- **Design output check (manual, product owner).** Every R0 section in the prompt file has an approved export in the R0 design folder, and none shows "Switch account", "Add another account" or "Undo".

Not tested here: domain maths, PIN, sync (Phase 1).

## Out of Scope
- Sign-in, PIN, LockGuard redirects and the privacy notice behaviour (Phase 1), though their background images are produced here.
- Database models, migrations, API routes and sync (Phase 1).
- Real content on the ledger, Muhtasari, onboarding and notebook pages (Phases 2 to 4); this phase ships placeholders.
- R1 to R6 Stitch screens, a dark theme, a navigation rail or sidebar at any width (D-040).
- Kiswahili body text beyond bilingual titles and labels (D-004).
- Illustrations, icon art beyond one outline icon family, video, animation beyond the prompt file's motion rules.
- Analytics, cookie banners, SEO work beyond a title and description on `/welcome`.
- Generating screenshots for the install guide (Phase 4, A6).

## Further Notes

**Locations:** prompts in `docs/design/stitch-prompts.md`; approved R0 exports in `docs/design/r0/`; execution plan in `planning/sprints/001-r0-pilot/blueprint.md`.

**Open questions**
- **Q-008:** Is verbal consent recorded by the pilot coordinator on a register enough for photographs of identifiable Gikomba traders, or is a signed form needed? Linked to Q-001. Until answered, use generated images or photos with no identifiable faces on the public landing page.
- **Q-009:** D-044 is "Arch, owner to confirm". The owner's imagery decision (Owner, 2026-10-24) names the landing page explicitly; does that confirm `/welcome` as the landing route?
- **Q-010:** Landing copy promises "export or delete anytime" and "reminders to share on WhatsApp", which are not in R0. What replaces them for the pilot? ASSUMPTION: "Ask us to delete your data anytime" and drop the WhatsApp line.
- **Q-011:** Footer needs the WhatsApp support number and the full privacy notice text; who supplies them, and is the notice a static page reachable from both the landing footer and the sign-in card? ASSUMPTION: a static, precached `/privacy` page.
- **Q-012:** The auth and onboarding prompts in the prompt file do not yet carry the imagery rule, and the Core token block forbids "illustrations". Should the prompt file be updated to v3 (runner addendum made permanent)?
- Q-006 (native-speaker check of invented titles, including the landing headlines) still applies.

**Risks**
- **R-012:** Stitch MCP quota, latency or output quality delays D0. Mitigation: D0 never blocks builders; they follow the tokens.
- **R-013:** Photographs over-scrimmed to pass contrast look muddy, or under-scrimmed fail in sunlight. Mitigation: interactive content always on a solid Surface panel; measured contrast is the gate.
- **R-014:** Precached imagery grows the first install on paid data. Mitigation: only the two background roles, one mobile variant, total budget enforced by test.
- **R-015:** Real-photo consent is not obtained in time for Monday. Mitigation: generated images first, swap in consented photos later.
- **R-016:** The landing page competes for Saturday time with the shell. Mitigation: it is Cut 0 in the blueprint; skeleton, contracts and shell are never cut.

**Acceptance covered by this phase:** AC-01 (CI green), AC-09 (cold offline shell), AC-13 (install as standalone app with icon), AC-21 (bilingual navigation and titles, shell part; page titles completed in later phases). Contributes to AC-20 (small bundles, lazy screens) and AC-15 (landing to sign-in path).

**Contradictions found in the source docs (for the product owner)**
- D-044 says LockGuard sends a phone with no account to `/welcome`; blueprint A4 says `/sign-in`, and the A2 precache list omits `/welcome`. This spec follows D-044 and falls back to `/sign-in` only under Cut 0.
- The prompt file's design system mentions a navigation rail on tablets; D-040 says bottom navigation at every width in R0.
- The Fungua Mazao prompt shows "Switch account" and "Add another account", which D-039 removes for R0.
- The backup component shows "Backing up" and a snackbar "Undo"; RQ-1 uses "Saving…", and records are immutable (D-018), so undo can only mean void.
- The Save anyway dialog offers "set stock to 2 trays", which is a stock adjustment beyond opening stock, out of R0.
