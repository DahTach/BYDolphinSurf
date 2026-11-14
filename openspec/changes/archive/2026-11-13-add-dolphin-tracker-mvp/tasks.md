## 1. Foundation: tokens and app shell

- [x] 1.0 Align configs with the reference: enable `"strict": true` + `"strictTemplates": true` in `tsconfig.json` (mirror `~/Developer/AutofficinaPindemonte/tsconfig.json`) and mirror the explicit `provideZonelessChangeDetection()` provider of `~/Developer/AutofficinaPindemonte/src/app/app.config.ts` in `src/app/app.config.ts` — config alignment only, no dependencies.
- [x] 1.1 Replace `src/styles.scss` with the `@use "tailwindcss"` + `@theme` token set mapping every color/shadow of `ui-drafts/b-blade.html` (D1 list), following the token pattern of `~/Developer/AutofficinaPindemonte/src/styles.scss` (keep Roboto Flex already stubbed; no light palette).
- [x] 1.2 Turn `src/app/app.ts` / `app.html` / `app.scss` into the shell: 430px centered frame on black with the draft header (DS avatar, "Dolphin Surf", "2025 EU · 43,2 kWh" chip, inert gear button) mirroring `ui-drafts/b-blade.html` header and the root layout of `~/Developer/AutofficinaPindemonte/src/app/app.ts` + `app.html`.
- [x] 1.3 Create `src/app/components/navbar/navbar.ts` + `navbar.html` — floating icon-only pill navbar (4 buttons, inline SVGs, `aria-label`s, active pill `bg-primC`) mirroring `ui-drafts/b-blade.html` nav block.
- [x] 1.4 Create `src/app/components/fab/fab.ts` — circular FAB (`bg-primC`, plus SVG, `fab` shadow, right offset `max(1rem, calc(50% - 199px))`, `aria-label="Nuova registrazione"`) mirroring the FAB block of `ui-drafts/b-blade.html`.
- [x] 1.5 Create `src/app/components/status-chip/status-chip.ts` — shared status pill (Scaduto errC / OK okC / In scadenza waC) mirroring the chip styles in `ui-drafts/b-blade.html`.
- [x] 1.6 Wire `src/app/app.routes.ts` with four lazy routes mirroring `~/Developer/AutofficinaPindemonte/src/app/app.routes.ts` (resolved ND-6, design D3): `''` → `pages/dashboard` (Cruscotto), `'attivita'` → activities, `'storico'` → history, `'prodotti'` → products; the navbar drives them via `routerLink` + `routerLinkActive`.

## 2. Data layer (no libraries — signals + localStorage only)

- [x] 2.1 Create `src/app/data/model.ts` with `Store`, `Activity`, `HistoryEntry` types from `design.md` D4 (including `intervalNote`, `durationNote` and `lastDone.note`), field set derived from the content of `ui-drafts/b-blade.html`.
- [x] 2.2 Create `src/app/data/seed.ts` with the full seed (resolved ND-1, design D8): vehicle (4.500 km, 08/2025, consumo 13,9), the 11 activities — #5/#9/#10/#2 verbatim from `ui-drafts/b-blade.html` with their notes ("con controllo pressione gomme", "poi ogni 48.000 km", "1–2 h collegate", "(PDI)"; #2 interval `{ once: true, months: 12 }` + nota "ritocco ogni 12–18 mesi"; #10 nota "sostituzione obbligatoria"), the other 7 translated from `gemini_draft.html` DEFAULT_TASKS (all never-done) — and the 3 history entries verbatim.
- [x] 2.3 Create `src/app/data/store.ts` — load `byd-dolphin:v1` into signals on boot, seed when absent, write-through on mutation (`registerActivity`, `setOdometer`); state access via signals only (zoneless; signals-only state discipline per design.md D2 — `~/Developer/AutofficinaPindemonte/src/app/app.config.ts` is the zoneless reference, its `app.ts` contains no signals; no state library).
- [x] 2.4 Create `src/app/data/status.ts` — pure derivation of `scaduto` / `in scadenza` / `ok` from `lastDone` + interval, calibrated on the four draft examples in `ui-drafts/b-blade.html` (#5 scaduto +3 giorni, #9 OK, #10 in scadenza ≈79%, #2 scaduto); threshold RESOLVED ND-2: `in scadenza` when elapsed ≥ 75%; never-done activities derive the due from `vehicle.deliveryMonth` + interval (a `once` never done is due at delivery); window intervals (#2) use the earliest bound (design D5).
- [x] 2.5 Create `src/app/data/format.ts` — Italian formatters (dd/mm/yyyy, mm/yyyy, thousands "." for km) reproducing the strings visible in `ui-drafts/b-blade.html` ("4.500", "09/10/2026", "08/2027"), with both interval renderings ("Ogni mese" for cards, "Ogni 1 mese" for the hero chip).

## 3. Vehicle data section (inside Cruscotto)

- [x] 3.1 Build the three M3 filled text fields "Chilometraggio" (numeric, "km" suffix), "Consegna" and "Consumo medio" (kWh/100km, default 13,9 — feeds Cicli LFP per design D7) mirroring `ui-drafts/b-blade.html` text-field markup, bound to `store` signals; odometer and consumption edits persist and recompute derived statuses / the LFP card.

## 4. Dashboard page (Cruscotto)

- [x] 4.1 Create `src/app/pages/dashboard/dashboard.ts` + `dashboard.html` hero card: "Prossima scadenza" (`bg-primC rounded-[28px]`), status chip, car SVG, countdown on pentagon cookie (gap+stroke per draft), title, interval/spec chips, wavy progress path, "Registra ora" button — all markup mirrored from `ui-drafts/b-blade.html`; hero selection per design D6 (scaduta with most recent due date, else earliest future due) with countdown "giorni fa" / "tra N giorni" (resolved ND-5b).
- [x] 4.2 Add the "In sintesi" card (`bg-surfLox rounded-[28px]`): three status rows with computed counts + chevron circles (full seed: 2 / 1 / 8, per `specs/dashboard`), footer "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" with the km segment live from `vehicle.odometerKm` and the rest static (resolved ND-4), mirroring `ui-drafts/b-blade.html`.
- [x] 4.3 Add the "Prontezza" card: ring with gap + end dot using the track 110.6 / progress fraction formula from `design.md` D7 — with the full seed this renders 18% / dasharray 20.1 / "2 in regola"; the draft's 82% / 90.7 (9/11 ok) is superseded. Do NOT hard-code 82% or 90.7.
- [x] 4.4 Add the "Cicli LFP" card computing `round(odometerKm / 100 × consumo / 43.2)` of 5.000 per design D7 (resolved ND-3): with the seed it shows "14/5.000 · ≈ 0,3% vita utile"; the draft's static "1.721/5.000 · ≈ 34%" is superseded. Linear bar mirroring `ui-drafts/b-blade.html`.

## 5. Activities page (Attività)

- [x] 5.1 Create `src/app/pages/activities/activities.ts` + `activities.html` filter chips row ("Tutte/Setup iniziale/Routine/Fluidi officina" with computed counts, selected chip `bg-secC` + check SVG, hidden-scrollbar overflow) mirroring `ui-drafts/b-blade.html`.
- [x] 5.2 Render the activity card list (`bg-surfC rounded-[24px]`: id+title, interval line, spec line, `status-chip`, divider, "Ultimo/Prossimo" line via `data/format.ts`, "Registra" pill button) mirroring the four cards of `ui-drafts/b-blade.html`.

## 6. History page (Storico)

- [x] 6.1 Create `src/app/pages/history/history.ts` + `history.html` — pill rows (leading calendar circle, title, "place — duration/cost" meta, trailing km chip, most recent first) mirroring the Storico rows of `ui-drafts/b-blade.html`; rows non-interactive (resolved ND-5: no row-tap in v1).

## 7. Products page (Prodotti)

- [x] 7.1 Create `src/app/pages/products/products.ts` + `products.html` — the two static cards ("Sicuri su EPDM" + MAI box, "Antiruggine sottoscocca" + MAI box) with inline SVG checks/warning triangles, content verbatim from `ui-drafts/b-blade.html`, as component data (not in the store).

## 8. Registra flow

- [x] 8.1 Implement the registra flows (resolved ND-5, design D9): one-tap quick registra shared by hero "Registra ora" and card "Registra" (today's `HistoryEntry` at current odometer, update `activity.lastDone`, persist via `store`, recompute status) and the FAB bottom-sheet capture form (activity, date, km, place, cost, duration) saving the same entry — behavior per `specs/activities` + `specs/history`.

## 9. Verification

- [x] 9.1 Run `bun run build` (existing script in `package.json`, `@angular/build:application` builder in `angular.json`) and fix all strict-TypeScript/template errors; no dependency or tooling added.
- [x] 9.2 Side-by-side check of every section against `ui-drafts/b-blade.html` (colors, radii 28/24dp, pills, cookie, wavy, ring gap+dot, FAB, navbar) and against the seed strings of `specs/dashboard`, `specs/activities`, `specs/history`, `specs/products`.
