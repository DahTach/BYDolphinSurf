## Why

The project has an approved static design draft (`ui-drafts/b-blade.html`, Material 3 Expressive dark-on-black) and an Angular 22 scaffold, but no working app. This change turns the draft's screen set into the v1 MVP: an offline, single-user maintenance tracker for one BYD Dolphin Surf 2025 EU (43,2 kWh), Italian UI, dark-only.

## What Changes

- Implement the draft UI from `ui-drafts/b-blade.html` as live Angular components: app header (DS avatar, vehicle badge, gear button), Cruscotto (filled odometer/consegna/consumo text fields, hero "Prossima scadenza" card with countdown on pentagon cookie + wavy progress + "Registra ora", "In sintesi" card with status counts, mini cards Prontezza ring + Cicli LFP bar), Attività (filter chips + the full 11-activity catalog), Storico (pill list rows), Prodotti (2 cards with MAI warnings), floating icon-only pill navbar, circular FAB.
- Add localStorage persistence (single key) for the vehicle, activities and history entries — schema in `design.md`.
- Derive activity statuses (`scaduto` / `in scadenza` / `ok`) from last-done + interval, matching the draft examples (#5 scaduto, #9 OK, #10 in scadenza, #2 scaduto).
- One-tap "Registra" buttons create a history entry at today + current odometer; the FAB opens a bottom-sheet capture form (activity, date, km, place, cost, duration).
- Mirror code organization of `~/Developer/AutofficinaPindemonte` — `src/app/{app.config.ts, app.routes.ts, app.ts, app.html, app.scss, pages/, components/}`, new file naming without `.component` suffix, zoneless standalone components.
- Define the M3E coral-on-black tokens in `src/styles.scss` with the `@use "tailwindcss"` + `@theme` pattern from the reference `styles.scss`.

RESOLVED: all 6 previously-open decisions — full 11-activity seed catalog (gemini draft), "in scadenza" at ≥75% elapsed, Cicli LFP computed from odometer + editable consumption, sintesi footer km-live, one-tap + FAB bottom-sheet capture, 4 lazy routes — see `design.md` D3–D9.

## Capabilities

### New Capabilities

- `app-shell`: mobile-frame layout (max-width 430px centered), dark-only M3E token set, floating pill navbar with 4 sections, circular FAB, app header.
- `vehicle-data`: vehicle profile (Dolphin Surf 2025 EU · 43,2 kWh), odometer, consegna and consumo medio inputs, localStorage persistence.
- `dashboard`: Cruscotto aggregations — next-due hero card with countdown, sintesi status counts, prontezza ring, cicli LFP.
- `activities`: activity catalog with time/km intervals, filter chips, pill cards with derived status, registra action.
- `history`: storico entries (date, km, place, cost/duration) list and creation.
- `products`: static product reference cards (EPDM, antiruggine) with MAI warnings.

### Modified Capabilities

(none — `openspec/specs/` is empty; this is the first change)

## Impact

- Code: `src/app/**` (pages, components, routes per reference layout), `src/styles.scss` (tokens only), `src/index.html` (already correct: `lang="it"`, theme-color `#000000`).
- No new dependencies, no tooling changes; bun stays the package manager.
- No backend/API/auth; localStorage only. Breaking changes: none (greenfield).

## Non-goals

- No settings screen, no light mode, no theme toggle (the header gear button is rendered as in the draft but stays non-functional in v1).
- No backend, auth, sync, or data export.
- No icon library, chart library, or state library — inline SVG (as in `b-blade.html`) and Angular signals only.
- No extra pages beyond the draft's four sections (Cruscotto, Attività, Storico, Prodotti).
