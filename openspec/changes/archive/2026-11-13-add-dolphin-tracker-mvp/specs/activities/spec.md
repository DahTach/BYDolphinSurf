## ADDED Requirements

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
Each activity card SHALL render the status chip of `ui-drafts/b-blade.html` via a shared status-chip component with two variants: card variant — "Scaduto" `bg-errC text-onErrC`, "OK" `bg-okC text-onOkC`, "In scadenza" `bg-waC text-onWaC` (draft activity cards) — and hero variant — solid `bg-err text-onErr` (draft hero card chip). Both: rounded-full pill, `text-[11px] font-bold`.

#### Scenario: Chip colors per status
- **WHEN** activities #5, #9 and #10 are scaduto, ok and in scadenza
- **THEN** their cards use the errC, okC and waC chip variants respectively, as in the draft activity cards

#### Scenario: Hero chip variant
- **WHEN** the hero card features the scaduto #5
- **THEN** its chip uses the solid `bg-err text-onErr` hero variant, as in the draft hero card

### Requirement: Filter chips with computed counts
The Attività section SHALL render the filter chips of `ui-drafts/b-blade.html`: "Tutte (N)", "Setup iniziale (n)", "Routine (n)", "Fluidi officina (n)" — pill-shaped, horizontally scrollable with hidden scrollbar; the selected chip shows `bg-secC text-onSecC font-bold` with the check inline SVG, unselected chips are `border-outline text-onSurfV`. Counts SHALL be computed from the catalog.

#### Scenario: Filtering by category
- **WHEN** the user selects "Routine"
- **THEN** only routine activities are listed and the Routine chip gets the selected secondary-container style with check icon

### Requirement: Activity card layout and Registra action
Each activity SHALL render as the draft card (`bg-surfC rounded-[24px] p-4`): id + title row, interval line, spec line, status chip, divider, last/next info line ("Ultimo: 09/10/2026 · 4.100 km" when done before, "Prossimo: 08/2027 · 40.000 km" when due ahead — Italian format per `data/format.ts`), and the "Registra" pill button (`bg-secC text-onSecC h-9 rounded-full`).

#### Scenario: Registra updates activity and history
- **WHEN** the user taps "Registra" on the #5 card
- **THEN** a history entry for #5 (today, current odometer) is created immediately — one-tap quick registra, no form (design D9) — #5's `lastDone` updates and its status recomputes

### Requirement: FAB bottom-sheet capture form
The FAB (app-shell) SHALL open a full capture form as an M3E bottom sheet (mirroring the draft's surfaces: `bg-surfC`, rounded-top corners): activity selector (the 11 catalog titles), date (default today), odometer km (default current), place, cost € and duration h (both optional). Saving SHALL create the same history entry + `lastDone` update as the quick registra (design D9). No other capture UI exists in v1.

#### Scenario: FAB form save
- **WHEN** the user selects #6, keeps today / 4.500 km, enters "Garage di casa" and saves
- **THEN** a history entry for #6 is created with those values, #6's `lastDone` becomes today · 4500 km and its status recomputes
