# Phase 0 implementation plan (tickets #15–#22)

Spec: `planning/sprints/phase-00-design-system-and-landing/spec.md` (GitHub #1). Execution detail: `planning/sprints/001-r0-pilot/blueprint.md` steps A1a, A1b, A2, A6.6.
Each task = one GitHub ticket = one branch = one PR, squash-merged to `main` when review and CI pass. #21 (D0, Stitch) runs separately and is not a task here.

## Global Constraints

- Package manager **pnpm only**; never npm or yarn. Only `pnpm-lock.yaml` is committed.
- Latest Next.js, App Router, **no `src/`** (code folders at the repo root), React Compiler on; no hand-written `useMemo`/`useCallback`/`memo`; render stays pure. Build is `next build --webpack` (Serwist).
- Biome is the only linter/formatter; no ESLint or Prettier config.
- TypeScript strict + `noUncheckedIndexedAccess`.
- App pages are client pages reading only from Dexie; no server data fetching; no dynamic route segments (parameters in the query string).
- `/api/*` and Clerk are never cached by the service worker.
- Every UI string comes from i18n. The UI is English only, one language per label: page titles, navigation and routes (D-049, D-050). Kiswahili strings are kept typed in `i18n/sw.*` but the language switch ships in a later phase.
- Target phone: 3 GB RAM Android, Chrome, 360 px wide. Tap targets ≥ 48 px. Keep bundles small.
- Never log record contents, phone numbers or PIN material. No secrets in the repo; the owner keeps real keys in a git-ignored root `.env`.
- Design tokens: from `docs/design/stitch-prompts.md` (Chalk, Ink #141A16, Moss Grey, Surface #FCFDFB, Sukuma Green only action colour, Maize for deni, Manrope, 8 px radius, light theme, no gradients).
- A PR is ready only when `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass and the ticket's acceptance checks have been run. Test-first (red → green → refactor) for any logic.
- Branch `feat/<step-id>-<slug>` as named in the ticket; PR title `<step-id>: <summary>`; PR body lists `Closes #<ticket>` and the acceptance IDs, and pastes the verification output.

## Task 1: #15 P0-1 (A1a): Skeleton and shared contracts

### Parent

#1 (Phase 0: Design system, imagery & landing page). Blueprint step **A1a**, branch `feat/a1a-skeleton`.

### What to build

The base project that every other R0 step builds on, set up to the house rules, plus the frozen cross-lane contracts that lane B codes against (R-011). After this merges, a developer can clone, `pnpm install`, and start writing domain or UI code without any setup.

- Scaffold with the **latest** create-next-app in a sibling folder and copy it in (it refuses a non-empty folder), keeping the remote's initial commit. App Router, **no `src/`**, React Compiler on (with its Babel plugin, needed by the webpack build), Biome as the only linter/formatter, Tailwind, `@/*` alias.
- pnpm pinned via `packageManager`; only `pnpm-lock.yaml` committed.
- TypeScript strict plus `noUncheckedIndexedAccess`.
- Dependencies and scripts as listed in blueprint A1a and AGENTS.md; `build` is `next build --webpack` (D-042); `postinstall` runs Prisma generate.
- Contract stubs (typed and minimal):
  - Session: `{ profileId, businessId, clerkUserId, email } | null`, with set and clear.
  - Device database `mazao-device`: `accounts` keyed by `profileId` with `clerkUserId, email, businessId, pinHash, pinSalt, failedAttempts, lockedUntil, lastUnlockedAt`; `meta` keyed by `key`.
  - Route after PIN: async function returning a route, stubbed to `/` (implemented in Phase 3, B4).
  - i18n: shell and ledger dictionary halves merged into one, a `t()` lookup, and the five nav labels as keys with English and Kiswahili values.

### Acceptance criteria

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass locally
- [ ] No `src/` directory; no ESLint or Prettier config exists anywhere in the repo
- [ ] React Compiler is enabled and its Babel plugin is installed
- [ ] `packageManager` pins pnpm; no `package-lock.json` or `yarn.lock`
- [ ] `build` script uses the webpack build
- [ ] A unit test proves `t()` resolves a key from each dictionary half and that every nav label has both `sw` and `en`
- [ ] A unit test opens the device database (fake-indexeddb) and round-trips one `accounts` row and one `meta` row
- [ ] The PR body lists the contract shapes so both lanes can see them

### Blocked by

None (can start immediately).

## Task 2: #16 P0-2 (A1b): CI, Vercel fra1 preview and Prisma init

### Parent

#1 (Phase 0). Blueprint step **A1b**, branch `feat/a1b-ci-vercel-prisma`.

### What to build

Broken code can't reach `main`, every PR gets a phone-testable preview in `fra1`, and Phase 1 can add the database schema with no setup work.

- CI on PRs and `main`: pnpm setup, Node with pnpm cache, install with frozen lockfile, `biome ci`, typecheck, test, build.
- Prisma initialised at the **latest** version following its current docs (generator block and config file). Config declares the schema path; migrations use `DIRECT_URL` (Neon unpooled) and runtime uses `DATABASE_URL` (Neon pooled) (D-037). No models yet.
- Environment template listing the Clerk publishable and secret keys, the sign-in URL `/sign-in`, `DATABASE_URL` and `DIRECT_URL`. No secrets committed.
- Vercel project linked, region `fra1`, build command `pnpm build`, preview deploy per PR (D-035). The devops agent uses the Vercel CLI; the owner may need to sign in once.

### Acceptance criteria

- [ ] CI runs on the PR and is green (AC-01)
- [ ] `pnpm install` runs Prisma generate without error with no models defined
- [ ] The environment template lists all five variables, with comments saying which Neon URL is pooled and which is direct
- [ ] No secret values are committed (checked by a grep in the PR verification)
- [ ] Vercel project region is `fra1` and its build command is `pnpm build`
- [ ] The PR's preview URL loads

### Blocked by

- #15

## Task 3: #17 P0-3 (A2): App shell with English navigation and placeholder routes

### Parent

#1 (Phase 0). Blueprint step **A2** (shell part), branch `feat/a2-shell-nav`.

### What to build

A merchant opening any R0 page sees the Mazao shell: a bottom navigation with five English items, a More drawer for the less-used pages, a backup chip in the top bar, and an English page title. Every R0 route exists as a placeholder page, so later phases fill in content without touching routing.

- Design tokens from the design system in the Stitch prompt file as CSS variables (Chalk, Ink, Moss Grey, Sukuma Green as the only action colour, Maize for deni accents, 8 px radius, light theme). Manrope through the Next.js font loader.
- `PageTitle` primitive: one English title (22sp semibold Ink), no second-language caption (D-049); plus an on-image variant for scrimmed screens (colours that pass AA on the scrim). Created here, owned by lane B afterwards.
- AppShell: bottom nav at **every** width (no sidebar or rail, D-040): Overview `/`, Sales `/sales`, Debts `/debts`, Expenses `/expenses`, More (drawer: Items `/items`, Settings `/settings`). English labels only (D-050). Tap targets of at least 48 px.
- Sync chip in the top bar reading a sync-status hook, stubbed here (implemented in Phase 1, A5).
- Placeholder client pages, with no server data fetching and no dynamic segments, for: `/`, `/sales`, `/sales/new`, `/expenses`, `/expenses/new`, `/debts`, `/debts/customer` (id in the query string, read via `useSearchParams` inside `Suspense`), `/items`, `/settings`, `/onboarding`, `/onboarding/review`, `/notebook`, `/today`, and the shell pages `/lock` and `/set-pin`. Each renders its `PageTitle` through `t()`.
- Every string through i18n via `t(key)`; no hard-coded UI text.

### Acceptance criteria

- [ ] Playwright against the built app (`pnpm build && pnpm start`): every route listed renders its English `PageTitle`
- [ ] All five nav items and both More entries show their English label, with no Kiswahili caption
- [ ] Every nav item and drawer entry has a tap target of at least 48x48 px at a 360 px viewport
- [ ] Bottom nav is shown (and no sidebar) at 360 px and at 1280 px
- [ ] `/debts/customer?id=00000000-0000-4000-8000-000000000000` renders without a build or runtime error
- [ ] No hand-written `useMemo`, `useCallback` or `memo`
- [ ] lint, typecheck, test and build pass

### Blocked by

- #15

## Task 4: #18 P0-4 (A2): Installable PWA that opens cold offline

### Parent

#1 (Phase 0). Blueprint step **A2** (service worker part), branch `feat/a2-pwa-offline`.

### What to build

A merchant can add Mazao to their home screen, it opens full screen with the Mazao icon, and after the first load every R0 page opens with the network off, including a link with an id in the address. When a new version is ready they see "Update available. Tap to reload." and never get stuck on a stale build (R-010).

- Web manifest: name and short name "Mazao", standalone, start URL `/`, theme and background colours from the tokens, 192, 512 and maskable icons.
- Serwist service worker with **explicit** rules. Do not spread the default cache (it caches `/api` GETs and cross-origin calls):
  - Precache: build assets, plus every static route (all routes from the shell ticket, and `/welcome` once it exists) with the build ID as revision.
  - Navigations: NetworkFirst with a 3 s timeout, falling back to the precached page matched on **path only** (D-041).
  - NetworkOnly for `/api/*` and all Clerk domains.
  - CacheFirst for static build files, fonts and icons.
- Update flow: a waiting worker shows the toast; tapping it activates the new worker and reloads.

### Acceptance criteria

- [ ] Cold-offline Playwright test against the built app: load `/`, wait for the service worker to be ready, open a **new page** in the same context, go offline, open every route directly including `/sales/new` and `/debts/customer?id=00000000-0000-4000-8000-000000000000`; each renders its `PageTitle` (AC-09)
- [ ] After browsing online, no `/api/*` or Clerk response exists in any Cache Storage cache
- [ ] Manifest is served with standalone display, correct colours and 192, 512 and maskable icons (AC-13)
- [ ] The update toast appears when a new worker is waiting, and tapping it reloads onto the new version (tested, or demonstrated with recorded steps)
- [ ] Lighthouse PWA installability passes on the preview URL (recorded in the PR)
- [ ] lint, typecheck, test and build pass

### Blocked by

- #17

## Task 5: #19 P0-5: Imagery pipeline and manifest check

### Parent

#1 (Phase 0). Imagery pipeline (Owner, 2026-10-24), branch `feat/p0-imagery-pipeline`.

### What to build

A repeatable way to turn a source photograph into app-ready images, with a typed manifest that a test checks, so that no oversized, unlabelled, non-consented or unreadable-over-text image can slip in.

- A pipeline script: source image to AVIF and WebP at the mobile width (720 px; landing images also get a desktop width), with metadata (including GPS) stripped and each file at most 150 KB. It measures the worst-case contrast of the default scrim (Ink #141A16 at 70%, Surface #FCFDFB text) composited over the image's brightest region and writes it to the manifest, so the value is deterministic.
- A single typed manifest as the source of truth. The shape below is from the spec, inlined because it encodes the decision:

  ```ts
  type ImageEntry = {
    id: string;
    role: 'landing' | 'auth-background' | 'onboarding-background' | 'header' | 'empty-state';
    source: 'generated' | 'gikomba-photo';
    consentRef: string | null;   // required for an identifiable person in a gikomba-photo
    alt: { en: string };         // via i18n; empty only for decorative backgrounds
    focalPoint: { x: number; y: number };
    variants: { width: number; format: 'avif' | 'webp'; bytes: number }[];
    precache: boolean;           // only auth-background and onboarding-background
    scrimContrast: number | null;
  };
  ```
- First image set from the landing briefs (mama mboga at her stall, hands writing deni in an exercise book, crowded aisle from above, kiosk shelf, boda rider with a delivery crate, phone fundi at a repair bench), including at least one `auth-background` and one `onboarding-background`. Until Q-008 is answered, use generated images or photos with no identifiable faces; no real logos, phone numbers or M-Pesa details; no illustrations.
- A short consent script and register template for the pilot coordinator. The register itself lives outside the repo; only consent references are stored.
- Images are served as static files, not through the Next.js on-demand optimiser.

### Acceptance criteria

- [ ] A unit test over the manifest and files fails if: any file is over 150 KB; an entry lacks AVIF or WebP; `precache` is true for a role other than the two backgrounds; total precached bytes exceed 600 KB; alt text is missing on a non-decorative image; a `gikomba-photo` with an identifiable person has no `consentRef`; `scrimContrast` is below 4.5 on an image that carries text
- [ ] The test has a failing fixture for each rule, proving it fires
- [ ] Running the script twice on the same source produces identical output files and manifest values
- [ ] Output files carry no EXIF or GPS metadata (checked in the test)
- [ ] Consent script and register template exist in the docs
- [ ] lint, typecheck, test and build pass

### Blocked by

- #15

## Task 6: #20 P0-6: Scrimmed auth and onboarding backgrounds that work offline

### Parent

#1 (Phase 0). Imagery pipeline, rendering and caching part, branch `feat/p0-scrimmed-backgrounds`.

### What to build

Sign-in, PIN and onboarding screens greet the merchant with a familiar market photograph behind a solid scrim, and it is there even when they open the PIN screen offline. Work screens stay plain. Any header or empty-state image that fails to load simply disappears behind a plain colour, never a broken-image icon.

- A background component that renders a manifest image under a flat, solid scrim (no gradient), with interactive content on a solid Surface panel. It falls back to the plain background colour when the image is absent and uses the manifest focal point when cropping.
- Header and empty-state image components with the same fallback, lazy below the fold.
- Precache entries for `auth-background` and `onboarding-background` are generated from the manifest (one mobile variant each). Other roles use a capped runtime CacheFirst cache (30 entries).
- Backgrounds applied to the placeholder `/lock`, `/set-pin`, `/sign-in` and `/onboarding/*` pages, using the on-image `PageTitle` variant. No image sits behind numbers or form fields on any work screen.

### Acceptance criteria

- [ ] Playwright, built app, cold offline: `/lock` and `/onboarding` render their background image from cache
- [ ] Playwright: with an uncached header or empty-state image and the network off, the page shows no broken image, only the fallback colour
- [ ] The image entries in the precache list are derived from the manifest, not hand-written (a test compares them)
- [ ] The runtime image cache never holds more than 30 entries
- [ ] Text on the scrim uses colours that pass AA against the measured `scrimContrast`
- [ ] lint, typecheck, test and build pass

### Blocked by

- #18
- #19

## Task 7: #22 P0-8 (A6.6): Landing page at /welcome

### Parent

#1 (Phase 0). Blueprint **A6 task 6** (D-044), branch `feat/a6-landing-welcome`. **Cut 0**: dropped first if the team is behind at the Sunday 18:00 checkpoint. LockGuard then sends phones with no account to `/sign-in` and nothing else changes.

### What to build

A visitor who opens the Mazao link from WhatsApp sees a fast, light landing page at `/welcome` with daylight photographs of Gikomba, English headings (D-049), and one action, "Start free", that takes them to sign-in. A chama leader on a laptop sees a desktop layout.

- Built with the `design-taste-frontend` skill in Persuade mode, with dials DESIGN_VARIANCE 6, MOTION_INTENSITY 3 and VISUAL_DENSITY 4, and the same tokens as the app. Mobile first at 360 px, then 1280 px. Run the skill's pre-flight check before the PR.
- Sections exactly as §2.1 of the prompt file: header, asymmetric hero, notebook versus Mazao, offline story ("Hakuna mtandao? Sawa. / No network? Fine."), deni, goods and services bento, three actions, data yako ni yako, FAQ, closing band, footer. No logo wall, statistics, testimonials or ratings; no eyebrows; no em-dashes; no pills over photos; no scroll cue. Photographs sit behind text only under a solid scrim.
- Phone frames show real screenshots: the approved D0 exports until the built app exists. No div-based fake screenshots. If the D0 exports aren't ready, ship without the phone frames and add them later.
- Static: no Clerk component and no data fetching; precached. `/` stays the app.
- Copy that promises features outside R0 is changed (Q-010 assumption: "Ask us to delete your data anytime", and the WhatsApp reminders line is dropped).
- The footer links to a static, precached `/privacy` page (Q-011 assumption), with a placeholder support number until the owner supplies one.
- Every string, including FAQ answers and alt text, goes through i18n. Title and description meta only; no other SEO work.

### Acceptance criteria

- [ ] Playwright, built app: `/welcome` renders, and both CTAs navigate to `/sign-in`
- [ ] Below-the-fold images load lazily; text and the Start button render before images load
- [ ] An automated accessibility scan (axe via Playwright) reports no WCAG AA violations at 360 px and 1280 px
- [ ] The page works at 200% text size without horizontal scrolling at 360 px
- [ ] `/welcome` and `/privacy` open cold offline (added to the precache)
- [ ] Loading `/welcome` makes no Clerk script request and no `/api` request
- [ ] No string on the page bypasses i18n; every heading is a single English string
- [ ] lint, typecheck, test and build pass; the pre-flight checklist is pasted in the PR (contributes to AC-15 and AC-20)

### Blocked by

- #17
- #18
- #20

