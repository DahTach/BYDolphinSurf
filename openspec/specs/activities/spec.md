# activities Specification

## Purpose
Requirements for the Attività section: activity model and seed catalog, derived statuses, status/filter chips, activity cards, the FAB capture form and the status filter from the Cruscotto rows.

## Requirements


### Requirement: Activity model and seed catalog
Each activity SHALL have: numeric `id` (draft numbering), `title`, `category` (`setup-iniziale` | `routine` | `fluidi-officina`), `interval` (months and/or km, or `once`), optional `intervalNote` ("con controllo pressione gomme" #5, "poi ogni 48.000 km" #9, "ritocco ogni 12–18 mesi" #2), optional `durationNote` ("1–2 h collegate" #5), `spec` line, optional `lastDone` (date + odometer km + optional note, e.g. "PDI" #10), per `design.md` D4. The seed SHALL contain the FULL 11-activity catalog (resolved ND-1, design D8): #5/#9/#10/#2 verbatim from `ui-drafts/b-blade.html` (the only ones with `lastDone`), plus 7 translated from the `gemini_draft.html` `DEFAULT_TASKS` catalog, all never-done:
- #1 Parafanghi anteriori e posteriori — una tantum (nota "quando nuova / prima dell'inverno"), "Clip-on OEM / aftermarket modellati";
- #2 Antiruggine sottoscocca — 12 mesi + "ritocco ogni 12–18 mesi", "Lanoguard · Dinitrol 3125 / 4941", lastDone 20/08/2025 · 300 km;
- #3 Trattamento guarnizioni EPDM — ogni 6 mesi (nota "prima volta alla consegna"), "Molykote 111 / Krytox GPL 205 / glicerina";
- #4 Primo controllo BYD — 3 mesi / 5.000 km una tantum, "Ispezione telaio e serraggi officina BYD";
- #5 Bilanciamento LFP 100% — ogni mese, "Carica AC 100% + top-balance 1–2 h", lastDone 09/10/2026 · 4.100 km;
- #6 Spinotto di ricarica e guarnizione — 6 mesi / 7.500 km, "IPA 99% sui pin · Molykote 111 sulla guarnizione";
- #7 Rotazione gomme — 9 mesi / 10.000 km, "Rotazione ant./post. + controllo assetto";
- #8 Manutenzione severe — 12 mesi / 15.000 km, "Grasso pin pinze · aero shield · ritocco Lanoguard";
- #9 Olio riduttore — 24 mesi / 40.000 km + "poi ogni 48.000 km", "Castrol BOT384 · ≈ 500 ml", lastDone 08/08/2025 · 0 km;
- #10 Fluido freni DOT 4 — ogni 24 mesi, "DOT 4 / HZY6 · ≈ 1.100 ml", lastDone 15/04/2025 (PDI) · 0 km;
- #11 Liquido raffreddamento + 12V — 36 mesi / 70.000 km, "OAT -40°C (3,1–3,3 L) + test di carico 12V".

#### Scenario: Seeded card content matches draft
- **WHEN** the Attività list renders with the seed
- **THEN** the cards for #5, #9, #10 and #2 show the exact titles, interval lines and spec lines of `ui-drafts/b-blade.html`

#### Scenario: Chip counts reproduce the draft
- **WHEN** the filter chips compute their counts from the catalog
- **THEN** they show "Tutte (11) · Setup iniziale (4) · Routine (4) · Fluidi officina (3)" exactly as in `ui-drafts/b-blade.html`

### Requirement: Derived activity status
Status SHALL be derived, never stored: `scaduto` when today is past the due date or the odometer is past the due km; `in scadenza` when elapsed ≥ 75% of the interval (resolved ND-2); `ok` otherwise. Due date = `lastDone.date + interval.months`; due km = `lastDone.odometerKm + interval.km`; window intervals (#2 "12–18 mesi") use the earliest bound; a never-done activity derives its due from `vehicle.deliveryMonth` + interval, and a `once` activity never done is due at delivery (design D5).

#### Scenario: Overdue by days
- **WHEN** #5's due date (09/11/2026) is 3 days in the past
- **THEN** #5's status is `scaduto`

#### Scenario: In scadenza at the 75% threshold
- **WHEN** #10's elapsed time is ≈575 of 730 days (≈79% ≥ 75%) and its due date (15/04/2027) is still ahead
- **THEN** #10's status is `in scadenza`

#### Scenario: Inside interval
- **WHEN** #9's due (08/2027 · 40.000 km) is more than the 75% threshold away
- **THEN** #9's status is `ok`

### Requirement: Status chip rendering
Each activity card SHALL render the status chip through the shared status-chip component of `specs/design-system` — one component, one `variant × status` color map (`variant` API `card` | `hero` | `badge`; the `badge` variant owns the digit-strip DOM). Card variant (on `bg-surfC` cards, tonal, per `ui-drafts/b-blade.html` activity cards): "Scaduto" `bg-errC text-onErrC`, "OK" `bg-okC text-onOkC`, "In scadenza" `bg-waC text-onWaC`. Hero variant (on the tinted hero container, `specs/dashboard`): contrasting fills with ≥3:1 contrast against the container — `bg-err text-onErr` on `errC`, `bg-onWaC text-waC` on `waC`, `bg-onOkC text-okC` on `primC`; the countdown badge (`badge` variant) uses the same map fills as the hero chip. Both: rounded-full pill, with sizing owned by the shared component (per `ui-drafts/d2-morfosi.html`: card 10px, hero 11px, badge 12px extrabold) — the component owns colors AND sizing; pages must not override either.

#### Scenario: Chip colors per status
- **WHEN** activities #5, #9 and #10 are scaduto, ok and in scadenza
- **THEN** their cards use the errC, okC and waC chip variants respectively, as in the draft activity cards

#### Scenario: Hero chip variant
- **WHEN** the hero card features the scaduto #5
- **THEN** its chip uses the solid `bg-err text-onErr` hero variant, as in the draft hero card

#### Scenario: Hero chip on a waC container is visible
- **WHEN** the hero card features an in-scadenza activity on the `bg-waC` container
- **THEN** the hero chip renders `bg-onWaC text-waC` (≥3:1 contrast against the container) instead of the old invisible `bg-waC` fill

### Requirement: Filter chips with computed counts
The Attività section SHALL render the filter chips of `ui-drafts/b-blade.html`: "Tutte (N)", "Setup iniziale (n)", "Routine (n)", "Fluidi officina (n)" — pill-shaped, horizontally scrollable with hidden scrollbar; the selected chip shows `bg-secC text-onSecC font-bold` with the check inline SVG, unselected chips are `border-outline text-onSurfV`. Counts SHALL be computed from the catalog.

#### Scenario: Filtering by category
- **WHEN** the user selects "Routine"
- **THEN** only routine activities are listed and the Routine chip gets the selected secondary-container style with check icon

### Requirement: Activity card layout and Registra action
Each activity SHALL render as the draft card (`bg-surfC rounded-[24px] p-4`): id + title row, interval line, spec line, status chip, divider, last/next info line ("Ultimo: 09/10/2026 · 4.100 km" when done before, "Prossimo: 08/2027 · 40.000 km" when due ahead — Italian format per `data/format.ts`), and the "Registra" pill button (`bg-secC text-onSecC h-9 rounded-full`, 14px `text-button`). The card title renders at 15px (`card-title` role). Cards SHALL carry the shared state layers and the press shape morph (24px → 16px + `scale(.97)`, spring back on release, `specs/design-system`), and the card list SHALL enter with the staggered entrance (rise 16px + fade, 55ms stagger) on page/filter activation only — data edits MUST NOT replay the entrance (per `specs/design-system`).

#### Scenario: Registra updates activity and history
- **WHEN** the user taps "Registra" on the #5 card
- **THEN** a history entry for #5 (today, current odometer) is created immediately — one-tap quick registra, no form (behavior per `specs/activities`) — #5's `lastDone` updates and its status recomputes

#### Scenario: Card press morph
- **WHEN** the user presses an activity card
- **THEN** its radius eases 24px → 16px while it scales to .97, springing back on release

#### Scenario: List entrance on filter change
- **WHEN** the user switches the category filter
- **THEN** the visible cards stagger back in 55ms apart (no animation replays on unrelated change detection)

### Requirement: FAB bottom-sheet capture form
The FAB (app-shell) SHALL open a full capture form as an M3E bottom sheet per the approved draft FAB block of `ui-drafts/c-cruscotto.html`, opening through the FAB-to-sheet morph of `specs/app-shell` (circle → sheet geometry, 550ms `--e-spring`; close morphs back into the FAB over 450ms `--e-exit`; reduced motion = instant, no morph): drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Nuova registrazione" (15px bold), and the fields rebuilt on the shared MD3 filled-text-field component (same anatomy as the vehicle fields, with the focus motion and dark native `<select>` of `specs/design-system`), laid out in a `grid grid-cols-2 gap-4` sized by expected input length (constant 16px gaps on both axes): the activity selector `col-span-2` (all 11 catalog titles, rendered as a filled field with chevron — long titles need the full width), a row with date (default today) and odometer km (default current) as half-width columns, place `col-span-2` (free text), and a row with cost € and duration h (both optional) as half-width columns. Half-width fields SHALL keep their value in a `flex-1 min-w-0` slot with the trailing suffix `shrink-0` (12px `label` `text-onSurfV`) so long values truncate instead of overflowing. Saving SHALL create the same history entry + `lastDone` update as the quick registra and close the sheet (morph back). "Annulla" SHALL be an M3 text button (no border, `text-onSurfV font-bold`, 14px `text-button` = M3 label-large, auto-width `px-6`); "Registra" stays the filled `bg-prim text-onPrim rounded-full h-12 flex-1` button (15px `button-large`) — the footer pair matches the mockups (Annulla auto-width, Registra `flex-1`; the old equal-width pair is superseded); the sheet carries the dialog accessibility of `specs/app-shell` (`role="dialog"`, focus trap, Escape, focus restored to the FAB); validation unchanged (ISO date + numeric km required). No other capture UI exists.

#### Scenario: FAB form save
- **WHEN** the user selects #6, keeps today / 4.500 km, enters "Garage di casa" and saves
- **THEN** a history entry for #6 is created with those values, #6's `lastDone` becomes today · 4500 km and its status recomputes

#### Scenario: MD3 field anatomy in the sheet
- **WHEN** the user focuses any field of the sheet
- **THEN** that field shows the focus anatomy (brighter container, 2px prim ring scaling in, prim bold label) identical to the vehicle fields

#### Scenario: Sheet morphs both ways
- **WHEN** the user taps the FAB and then "Annulla"
- **THEN** the sheet morphs open from the FAB circle and morphs back into it on close, with the scrim fading in/out

#### Scenario: Field grid sized by expected input length
- **WHEN** the capture sheet renders
- **THEN** Attività and Luogo span both columns while Data + Chilometraggio share one row and Costo + Durata the next (constant 16px gaps on both axes), the fields keep the shared pill anatomy (`h-14`), and the footer, validation and save path are unchanged

#### Scenario: Half-column fields fit at 430px
- **WHEN** a half-column field renders a long value at the 430px frame width (e.g. a large odometer number or the native date control)
- **THEN** the value truncates within its `flex-1 min-w-0` slot, the 12px suffix stays visible and the field never overflows its column

### Requirement: Status filter from Cruscotto rows
The Attività page SHALL accept a `stato` query parameter (`ok` | `in-scadenza` | `scaduto`, set by the sintesi rows of `specs/dashboard`): when present, a dismissible filter chip renders above the category chips (selected style `bg-secC text-onSecC font-bold` with the check inline SVG, label "In regola (N)" / "In scadenza (N)" / "Scadute (N)" computed from the catalog, plus a trailing × button that removes the parameter); the card list SHALL show only activities whose derived status matches, AND-combined with the category filter. Deep links and back navigation SHALL behave identically to row taps.

#### Scenario: Row deep link filters the list
- **WHEN** the user opens `/attivita?stato=scaduto` with the full seed
- **THEN** only the 8 scadute cards are listed and the chip "Scadute (8) ×" is shown above the category chips

#### Scenario: Dismissing the filter
- **WHEN** the user taps the × on the status chip
- **THEN** the parameter is removed and all 11 activities are listed again

### Requirement: Empty filtered state
When the category and status filters combine to zero visible activities, the list SHALL render a friendly Italian empty state (e.g. "Nessuna attività corrisponde ai filtri") with a "Cancella filtro" action button (shared button anatomy) that clears the `stato` query parameter and resets the category filter to "Tutte", restoring the full list. Empty states MUST NOT render as a blank gap.

#### Scenario: Zero results show the empty state
- **WHEN** the user selects "Fluidi officina" while `stato=scaduto` filters the list to 0 activities
- **THEN** a friendly Italian empty state with the "Cancella filtro" button is shown instead of an empty list

#### Scenario: Cancella filtro restores the list
- **WHEN** the user taps "Cancella filtro"
- **THEN** the `stato` parameter is removed, the category resets to "Tutte" and all 11 activities are listed again
