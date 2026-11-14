## ADDED Requirements

### Requirement: Mobile-frame layout
The app SHALL render all content inside a centered column with `max-width: 430px` on a full-black (`#000000`) page background, mirroring the "cornice mobile centrata" of `ui-drafts/b-blade.html` (body `bg-black`, `mx-auto max-w-[430px]`), with the same inner paddings (`px-4 pt-5 pb-36`).

#### Scenario: Desktop viewport
- **WHEN** the app is opened in a viewport wider than 430px
- **THEN** the content column is centered at 430px on a black background, as in `ui-drafts/b-blade.html`

### Requirement: Dark-only M3E token set
`src/styles.scss` SHALL define the draft palette and shadows via `@use "tailwindcss"` + `@theme`, mapping every color of `ui-drafts/b-blade.html` (`prim #e3a89b`, `primC #55291d`, `secC #3d3431`, `terC #463818`, `err #d98a80`, `errC #3e1d1c`, `surf…surfHiX #000000/#0e0d0d/#1e1c1d/#2a2728/#353132`, `onSurf #eae4e2`, `onSurfV #b9aca8`, `mut #8d817d`, `outline #463f3d`, `okC #1d3326`, `waC #363020` and their on-* pairs) and the `fab/hero/nav` shadows, with font Roboto Flex. The only non-`@theme` colors allowed are the draft's sintesi status dots (`bg-emerald-400/90`, `bg-amber-400/90`, `bg-rose-400/90`, Tailwind default palette as in `ui-drafts/b-blade.html`). The app MUST NOT provide a light palette, a theme toggle, or any other non-draft color. Token pattern mirrors `~/Developer/AutofficinaPindemonte/src/styles.scss`.

#### Scenario: Token rendering
- **WHEN** any screen renders
- **THEN** all surfaces and text use only the tokens listed above from `ui-drafts/b-blade.html`, and no theme-switch control exists anywhere in the app

### Requirement: App header
The app SHALL render the draft header from `ui-drafts/b-blade.html`: circular 44px avatar with primary-container background and "DS" initials, title "Dolphin Surf" (`text-[22px]` extrabold), badge chip "2025 EU · 43,2 kWh" as an outline pill (`border-outline`, `text-onSurfV`), and a gear icon button (inline SVG per draft) with `aria-label="Impostazioni"` that has no behavior in v1 (non-goal: settings screen).

#### Scenario: Header content
- **WHEN** the app loads
- **THEN** the header shows the DS avatar, "Dolphin Surf" title, "2025 EU · 43,2 kWh" chip and the non-functional gear button exactly as in `ui-drafts/b-blade.html`

### Requirement: Floating icon-only pill navbar
The app SHALL render the draft floating navbar from `ui-drafts/b-blade.html`: fixed at the bottom, centered within the 430px frame, `bg-surfC/90 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-nav` pill (`px-3 py-2`), four icon-only buttons (Cruscotto, Attività, Storico, Prodotti) using the draft inline SVGs and `aria-label`s. The active section's button SHALL get the `w-[52px] bg-primC` pill with `text-onPrimC` icon; inactive buttons are `w-12` with `text-mut` icons.

#### Scenario: Active section indicator
- **WHEN** the user is on the Attività section
- **THEN** the Attività button shows the primary-container pill while the other three icons stay muted, as in `ui-drafts/b-blade.html`

#### Scenario: Section switching
- **WHEN** the user taps a navbar button
- **THEN** the corresponding section (Cruscotto, Attività, Storico or Prodotti) becomes visible

### Requirement: Circular FAB
The app SHALL render the draft FAB from `ui-drafts/b-blade.html`: fixed bottom-right above the navbar (`bottom-24`, right offset `max(1rem, calc(50% - 199px))`), 56px circle, `bg-primC text-onPrimC`, `fab` shadow, plus inline SVG, `aria-label="Nuova registrazione"`.

#### Scenario: FAB opens capture form
- **WHEN** the user taps the FAB
- **THEN** the bottom-sheet capture form opens (per `specs/activities`); the hero/card "Registra" buttons use the one-tap quick registra instead (design D9)

### Requirement: App organization mirrors reference project
Code SHALL be organized exactly like `~/Developer/AutofficinaPindemonte/src/app`: `app.config.ts`, `app.routes.ts`, `app.ts`, `app.html`, `app.scss`, `pages/<page>/<page>.ts|.html|.scss`, `components/<name>/<name>.ts|.html`, no `.component` suffix, standalone zoneless components, TypeScript strict (enabled by tasks 1.0). Shared state lives under `src/app/data/` (`model.ts`, `seed.ts`, `store.ts`, `status.ts`, `format.ts`) using Angular signals only.

#### Scenario: New file placement
- **WHEN** a developer adds a screen or a reusable visual unit
- **THEN** it goes under `src/app/pages/` or `src/app/components/` with the reference naming (`dashboard.ts`, `navbar.ts`), never with a `.component` suffix
