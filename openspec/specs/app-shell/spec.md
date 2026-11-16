# app-shell Specification

## Purpose
Requirements for the app shell: mobile-frame layout, dark-only M3E token set, header with settings sheet, floating navbar, FAB and code organization.

## Requirements


### Requirement: Mobile-frame layout
The app SHALL render all content inside a centered column with `max-width: 430px` on a full-black (`#000000`) page background, mirroring the "cornice mobile centrata" of `ui-drafts/b-blade.html` (body `bg-black`, `mx-auto max-w-[430px]`), with the same inner paddings (`px-4 pt-5 pb-36`).

#### Scenario: Desktop viewport
- **WHEN** the app is opened in a viewport wider than 430px
- **THEN** the content column is centered at 430px on a black background, as in `ui-drafts/b-blade.html`

### Requirement: Dark-only M3E token set
`src/styles.scss` SHALL define the warm-white palette (matching the car body, user decision 2026-11-16: the b-blade coral accents are retired) and shadows via `@use "tailwindcss"` + `@theme` (`prim #ede6da`, `primC #54483b`, `secC #413830`, `terC #4a3e21`, `err #d98a80`, `errC #3e1d1c`, `surf…surfHiX #000000/#0e0d0d/#1e1c1d/#2a2728/#353132`, `onSurf #eae4e2`, `onSurfV #b9aca8`, `mut #8d817d`, `outline #463f3d`, `okC #1d3326`, `waC #363020` and their on-* pairs: `onPrim #2a2218`, `onPrimC #ede6da`, `onSecC #e9dfd2`, `onTerC #e8dab7`, `onErr #441411`, `onErrC #f2c1ba`, `onOkC #9cc7a8`, `onWaC #d9c084`) and the `fab/hero/nav` shadows, with font Roboto Flex. Every color SHALL come from these `@theme` tokens. The app MUST NOT provide a light palette, a theme toggle, or any other non-draft color. Token pattern mirrors `~/Developer/AutofficinaPindemonte/src/styles.scss`. One documented extension is authorized (M3E Morfosi): the car-art tokens `carBody`/`carBodyErr` (`#c96f60`/`#b96357`), `carAccent`/`carAccentErr` (`#55291d`/`#3e1d1c`) and `carWheel` (`#2c130c`) — the exact hexes from `src/app/pages/dashboard/dashboard.ts` and `src/app/pages/dashboard/dashboard.html:39-40`, mapped to the SVG fills as in the current code — SHALL be declared in `styles.scss` alongside the palette; the palette itself remains otherwise locked.

#### Scenario: Token rendering
- **WHEN** any screen renders
- **THEN** all surfaces and text use only the tokens listed above from `ui-drafts/b-blade.html`, and no theme-switch control exists anywhere in the app

#### Scenario: Car-art tokens are the only palette extension
- **WHEN** the car SVG colors are inspected in `src/styles.scss`
- **THEN** they exist as `carBody`/`carBodyErr`, `carAccent`/`carAccentErr` and `carWheel` tokens declared alongside the draft palette (`#c96f60`, `#b96357`, `#55291d`, `#3e1d1c`, `#2c130c`) and no other color has been added to the palette

### Requirement: App header
The app SHALL render the draft header from `ui-drafts/b-blade.html`: circular 44px avatar with primary-container background and "DS" initials, title "Dolphin Surf" (`text-[22px]` extrabold), badge chip "2025 EU · 43,2 kWh" as an outline pill (`border-outline`, `text-onSurfV`), and a gear icon button (inline SVG per draft) with `aria-label="Impostazioni"` that opens the settings bottom sheet (see the Settings sheet requirement below). The header SHALL be `sticky top-0` within the 430px frame and scroll-aware per `ui-drafts/d3-vivace.html`: as the window scrolls, over the first 96px it condenses continuously and reversibly — avatar scales 1 → 0.85, title scales 1 → 0.95 and translates 2px (`origin-left`), the spec chip fades to 65% opacity, and a `surf/80 backdrop-blur` condensation bar fades in behind the header — driven by a single progress value `p = clamp(scrollY / 96, 0, 1)` written from a `requestAnimationFrame`-throttled passive scroll listener (the app scrolls on the window), with listener/rAF cleanup on destroy. Route changes SHALL scroll back to the top of the frame (`scrollPositionRestoration: 'enabled'` in the router config, or equivalent), and fragment navigation (e.g. `#veicolo`) SHALL keep the native anchor jump — the header condensation follows the resulting scroll position. With reduced motion the header swaps between the two states instantly at the 96px threshold.

#### Scenario: Header content
- **WHEN** the app loads
- **THEN** the header shows the DS avatar, "Dolphin Surf" title, "2025 EU · 43,2 kWh" chip and the gear button exactly as in `ui-drafts/b-blade.html`

#### Scenario: Gear opens the settings sheet
- **WHEN** the user taps the gear button
- **THEN** the settings bottom sheet opens

#### Scenario: Header condenses on scroll
- **WHEN** the user scrolls down through the first 96px
- **THEN** the avatar shrinks toward 0.85, the title scales/translates slightly, the spec chip dims and the blurred `surf/80` bar fades in, interpolated per frame (no stepped jump)

#### Scenario: Header restores on scroll up
- **WHEN** the user scrolls back to the top
- **THEN** the header smoothly returns to its full state (avatar 1, title 1, chip 100%, bar invisible)

#### Scenario: Header stays visible while scrolling
- **WHEN** the user scrolls page content beneath the header
- **THEN** the header remains stuck at the top of the 430px frame (`sticky top-0`) with the `surf/80 backdrop-blur` condensation bar keeping it legible over the content

#### Scenario: Route change lands at the top
- **WHEN** the user navigates between sections
- **THEN** the new page starts scrolled to the top of the frame and the header is fully expanded

#### Scenario: Fragment jump keeps native anchor behavior
- **WHEN** the user triggers navigation to `#veicolo` (e.g. via "Consegna e consumo")
- **THEN** the browser jumps natively to the vehicle fields and the header condensation matches the resulting scroll position

#### Scenario: Reduced motion swaps at the threshold
- **WHEN** the user scrolls past 96px with `prefers-reduced-motion: reduce`
- **THEN** the header swaps instantly between expanded and condensed states at the threshold (no interpolation)

### Requirement: Settings sheet
The gear button SHALL open an M3E bottom sheet per the approved draft settings block of `ui-drafts/c-cruscotto.html`: `bg-surfC rounded-t-[28px] shadow-sheet px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]` (safe-area aware bottom padding) with a drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Impostazioni" (15px bold), a `bg-black/70` backdrop (tap closes), and the rows: (1) "Ripristina dati iniziali" (sub "Torna al seed di consegna (conferma richiesta)", leading 36px `bg-surfHi` icon circle) — first tap replaces the row with the confirm prompt "Confermi il ripristino?" plus Annulla/Conferma text buttons; Conferma calls `store.resetToSeed()` (overwrite state with the seed store and persist) and closes the sheet; (2) "Consegna e consumo" (sub "Modifica i dati base del veicolo") — closes the sheet and navigates to the Cruscotto vehicle fields (fragment `veicolo`); footer info line "BYD Dolphin Surf · tracker v1 · dati solo sul dispositivo" (11px `text-mut`, top border). The sheet SHALL animate per the shared sheet motion: slide up `translateY(100%) → 0` with 550ms `--e-spring`, scrim `bg-black/70` fading in over 400ms `--e-emph`, and closing with 450ms `--e-exit` (the sheet stays mounted until the exit completes; the overlay is inert — `pointer-events: none`, unreachable by keyboard — during the exit). Rows are pill-shaped (`rounded-full`) and carry the shared state layers, press feedback and press radius morph of `specs/design-system`. The sheet SHALL implement dialog accessibility: `role="dialog"` with `aria-modal="true"`, focus moves into the sheet on open, Tab focus is trapped inside, Escape closes, and focus is restored to the gear button on close. With reduced motion the sheet opens and closes instantly.

#### Scenario: Reset restores the seed
- **WHEN** the user taps "Ripristina dati iniziali", then "Confermi il ripristino?" → Conferma
- **THEN** the store is replaced with the seed data (odometer 4.500 km, seed activities/history) and persisted to localStorage

#### Scenario: Consegna e consumo jumps to the fields
- **WHEN** the user taps "Consegna e consumo"
- **THEN** the sheet closes and the app shows the Cruscotto scrolled to the vehicle fields

#### Scenario: Sheet open/close motion
- **WHEN** the user opens and then closes the settings sheet (backdrop tap or Escape)
- **THEN** it springs up over 550ms with the scrim fading in, and reverses with the 450ms exit easing (no abrupt snap; reduced motion = instant)

#### Scenario: Sheet dialog semantics and focus management
- **WHEN** the settings sheet opens or closes
- **THEN** it carries `role="dialog"` + `aria-modal="true"`, focus moves into the sheet on open, Tab is trapped inside, Escape closes it, focus returns to the gear button on close, and the overlay is inert (`pointer-events: none`, unreachable by keyboard) while the exit plays

### Requirement: Floating icon-only pill navbar
The app SHALL render the draft floating navbar from `ui-drafts/b-blade.html`: fixed at the bottom, centered within the 430px frame, `bg-surfC/90 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-nav` pill (`px-3 py-2`), four icon-only buttons (Cruscotto, Attività, Storico, Prodotti) using the draft inline SVGs and `aria-label`s (no labels — icon-only stays). The buttons SHALL carry NO background fill: the single sliding/morphing `bg-primC` indicator pill IS the active button's background. The indicator SHALL be one absolutely-positioned pill that slides between items (400ms `--e-spring`) while stretching wider mid-flight (peak `max(from,to) + 18px` at ≈55% of a 450ms `--e-emph` width animation) and settling to the target item's width. The active button only widens 48px → 52px (250ms) and flips its icon color to `text-onPrimC`; inactive buttons stay `w-12` with `text-mut` icons. The active icon pops 1 → 1.15 → 1 (400ms `--e-spring`). Window resize re-places the indicator without animation. Reduced motion = instant placement.

#### Scenario: Active section indicator
- **WHEN** the user is on the Attività section
- **THEN** the single `bg-primC` indicator pill sits at the Attività button (widened to 52px, `onPrimC` icon) while the other three buttons stay fill-less with muted icons, as in `ui-drafts/b-blade.html`

#### Scenario: Section switching
- **WHEN** the user taps a navbar button
- **THEN** the corresponding section (Cruscotto, Attività, Storico or Prodotti) becomes visible

#### Scenario: Fluid indicator morph
- **WHEN** the user taps another navbar item
- **THEN** the indicator pill slides to the item, bulging wider mid-flight and settling at the item's width, and the newly active icon pops 1 → 1.15 → 1

#### Scenario: Resize re-places the indicator
- **WHEN** the window is resized while a section is active
- **THEN** the indicator pill is re-placed under the active button without animation

### Requirement: Circular FAB
The app SHALL render the draft FAB from `ui-drafts/b-blade.html`: fixed bottom-right above the navbar (`bottom-24`, right offset `max(1rem, calc(50% - 199px))`), 56px circle, `bg-primC text-onPrimC`, `fab` shadow, plus inline SVG, `aria-label="Nuova registrazione"`. The FAB SHALL carry the shared state layers and the press shape morph of `specs/design-system` (circle → squircle while pressed, spring back), and SHALL open the capture form through the FAB-to-sheet morph (below), hiding itself (fade + `scale(.8)`) while the morphed sheet is open.

#### Scenario: FAB opens capture form
- **WHEN** the user taps the FAB
- **THEN** the bottom-sheet capture form opens (per `specs/activities`); the hero/card "Registra" buttons use the one-tap quick registra instead (no form — behavior per `specs/activities`)

#### Scenario: FAB press feedback
- **WHEN** the user holds the FAB
- **THEN** it morphs toward a squircle under the `scale(.97)` press layer and springs back on release

### Requirement: App organization mirrors reference project
Code SHALL be organized exactly like `~/Developer/AutofficinaPindemonte/src/app`: `app.config.ts`, `app.routes.ts`, `app.ts`, `app.html`, `pages/<page>/<page>.ts|.html|.scss`, `components/<name>/<name>.ts|.html`, no `.component` suffix, standalone zoneless components, TypeScript strict (enabled by tasks 1.0). Shared state lives under `src/app/data/` (`model.ts`, `seed.ts`, `store.ts`, `status.ts`, `format.ts`) using Angular signals only. `app.scss` is removed from the mandated file list: this change deletes the empty `src/app/app.scss` together with its `styleUrl` reference, and global styles live in `src/styles.scss`.

#### Scenario: New file placement
- **WHEN** a developer adds a screen or a reusable visual unit
- **THEN** it goes under `src/app/pages/` or `src/app/components/` with the reference naming (`dashboard.ts`, `navbar.ts`), never with a `.component` suffix

#### Scenario: No app.scss in the shell
- **WHEN** the app shell is organized per the reference project
- **THEN** `app.ts`/`app.html` exist without an `app.scss` counterpart (deleted with its `styleUrl`) and the global styles live in `src/styles.scss`

### Requirement: FAB-to-sheet morph
Tapping the FAB SHALL morph its circle geometry into the bottom sheet per `ui-drafts/d2-morfosi.html`: a single mounted container starts at the FAB's circle geometry (56px, `rounded-full`, `bg-primC`, `fab` shadow) and transitions `left/right/bottom/height/border-radius/background-color/box-shadow` to the sheet geometry (`rounded-t-[28px]`, `bg-surfC`, `shadow-sheet`, full-bleed in the 430px frame) over 550ms `--e-spring`; the sheet content is pinned to its final position and fades in (350ms `--e-emph`, 150ms delay); the `+` icon rotates out (90°, scale .6); the `bg-black/70` scrim fades in over 400ms. Closing reverses the geometry to the FAB circle over 450ms `--e-exit` (content fades out first, scrim fades out); after close begins the overlay becomes inert immediately (`pointer-events: none`, unreachable by keyboard) and SHALL remain mounted for at least 450ms (the exit-flight duration) before being unrendered — it MUST NOT be torn down mid-transition by `@if`/`@for`. Close triggers: "Annulla", successful save, scrim tap and Escape. The sheet SHALL implement dialog accessibility: `role="dialog"` with `aria-modal="true"`, focus moves into the sheet on open, Tab focus is trapped inside, Escape closes, and focus is restored to the FAB on close. With reduced motion there is no morph: the sheet opens and closes instantly.

#### Scenario: FAB morphs into the sheet
- **WHEN** the user taps the FAB
- **THEN** the circle expands into the full bottom sheet (550ms spring), the scrim fades in and the form content fades in after the window has started opening

#### Scenario: Sheet morphs back into the FAB
- **WHEN** the user closes the sheet via Annulla, save, scrim or Escape
- **THEN** the sheet geometry shrinks back into the FAB circle (450ms exit easing) and the FAB reappears at its resting position

#### Scenario: No torn transitions
- **WHEN** the sheet is closed and the close animation is running
- **THEN** the overlay element remains mounted with `pointer-events: none` for ≥450ms (the exit-flight duration) after close begins before it is unrendered, with no frame where content is clipped away abruptly

#### Scenario: Sheet dialog semantics and focus management
- **WHEN** the FAB sheet opens or closes
- **THEN** it carries `role="dialog"` + `aria-modal="true"`, focus moves into the sheet on open, Tab is trapped inside, Escape closes it, focus returns to the FAB on close, and the overlay is inert (`pointer-events: none`, unreachable by keyboard) while the exit plays

### Requirement: Route transition and entrance orchestration
On route/section change the incoming page SHALL animate in (slide +12px → 0 with fade, 400ms `--e-emph`) and its blocks SHALL run the staggered entrance of `specs/design-system` (rise 16px + fade, 55ms stagger). The outgoing page swaps immediately (the router destroys it — incoming-only transitions). Route changes scroll to the top of the frame (per the App header requirement). Entrances, count-ups and bar fills SHALL be triggered only on route/pane activation — never on every change-detection cycle — and data edits NEVER replay them (values, bar widths and tints update through the existing width/color transitions only, per `specs/design-system`). Reduced motion renders the page instantly.

#### Scenario: Route change plays the entrance
- **WHEN** the user navigates from Cruscotto to Attività
- **THEN** the Attività page slides/fades in and its blocks stagger in 55ms apart

#### Scenario: No replay on change detection
- **WHEN** a signal updates a counter on the active page without a route change
- **THEN** no entrance animation replays

#### Scenario: Data edits do not replay entrances
- **WHEN** a registration or field edit changes values on the active page
- **THEN** values, bar widths and tints update without any entrance, count-up or digit-roll replay
