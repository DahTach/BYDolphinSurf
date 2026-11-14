## MODIFIED Requirements

### Requirement: Next-due hero card
The Cruscotto SHALL render the hero card per the approved draft B1 of `ui-drafts/c-cruscotto.html`: `rounded-[32px] shadow-hero p-5` whose container is tinted by the selected activity's status — `scaduto` → `bg-errC` with `text-onErrC`, header chip `bg-err text-onErr`, badge `bg-err text-onErr`, "Registra ora" button `bg-err text-onErr`; `in-scadenza` → `bg-waC` with `text-onWaC`, chip and badge `bg-waC text-onWaC`, button `bg-prim text-onPrim`; `ok` (future) → `bg-primC` with `text-onPrimC`, chip `bg-okC text-onOkC`, badge and button `bg-prim text-onPrim`. Layout: header row (label "Prossima scadenza" 12px bold uppercase `tracking-[0.08em]` at 60% opacity + status chip), the draft's car SVG centered at `h-24 w-auto` as the visual centerpiece, the countdown as a pill badge absolutely positioned at the car's top-right (`-top-1 right-2`, 12px extrabold) reading "+N g" when overdue, "tra N g" when future and "oggi" when due today (due-today is in-scadenza, never overdue), the activity title (22px font-black), its spec line (13px, 70% opacity), and its interval/duration chips (`bg-white/[0.08] border-white/10` pills with the draft battery and clock inline SVGs), then the full-width "Registra ora" button (`rounded-full h-12`, 15px bold). The card MUST NOT contain the pentagon cookie, the wavy path, or a display-size countdown number. The selected activity SHALL be the scaduta with the most recent due date; if none is scaduta, the one with the earliest future due date (unchanged).

#### Scenario: Most recent scaduta is featured
- **WHEN** the full seed derives 8 scadute and #5 has the most recent due date (09/11/2026) and today is 13/11/2026
- **THEN** the hero shows an `errC` container, chip "Scaduto", the car centered with badge "+4 g", title "Bilanciamento LFP 100%", spec "Carica AC 100% + top-balance 1–2 h", chips "Ogni 1 mese" and "1–2 h collegate", and an `bg-err` "Registra ora" button

#### Scenario: Future due is tinted coral
- **WHEN** no activity is scaduta and the hero is #9 (due 08/08/2027)
- **THEN** the hero shows a `primC` container, an `okC` chip "OK", badge "tra N g" and a `bg-prim` button

#### Scenario: Registra ora creates a registration
- **WHEN** the user taps "Registra ora" on the hero
- **THEN** a history entry for the hero activity is created immediately (one-tap quick registra — no form) and its status recomputes

### Requirement: In sintesi card
The Cruscotto SHALL render the "In sintesi" card per the approved draft (`rounded-[28px] bg-surfLox p-5`): the heading "In sintesi", three TAPPABLE tonal tiles in `grid grid-cols-3 gap-2.5` (`rounded-[20px] px-2 py-3.5 text-center active:scale-[0.97]`): "In regola" `bg-okC text-onOkC`, "In scadenza" `bg-waC text-onWaC`, "Scadute" `bg-errC text-onErrC` — each with its count (26px font-black) and label (10px bold at 80% opacity); tapping a tile navigates to `/attivita` with `queryParams { stato }` (`ok` / `in-scadenza` / `scaduto`). The status dots (emerald/amber/rose) are removed — the tile color carries the state. The footer line stays "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" with the km segment live from `vehicle.odometerKm`. Counts MUST be computed from data, never hard-coded.

#### Scenario: Tiles show computed counts
- **WHEN** the full seed derives 2 ok (#9, #11), 1 in scadenza (#10) and 8 scadute
- **THEN** the tiles show 2 / 1 / 8

#### Scenario: Tile navigates to filtered activities
- **WHEN** the user taps the "Scadute 8" tile
- **THEN** the app navigates to `/attivita?stato=scaduto` and the Attività page shows only the scadute

### Requirement: Prontezza ring card
The Cruscotto SHALL render the "Prontezza" card per the approved draft (`bg-surfC rounded-[24px] p-4`, 2-column grid): label "Prontezza" (12px `text-onSurfV`), the percentage in 30px font-black with "%" at `text-sm` bold `text-mut`, the subtitle "N di M in regola" (11px `text-mut`), and a linear rounded bar `h-1.5 rounded-full bg-surfHiX` with an `bg-prim` fill of `percent%` width. The ring indicator (track/progress/dot SVG) MUST NOT be used.

#### Scenario: Bar reflects the seed fraction
- **WHEN** the full seed derives 2 ok of 11 activities
- **THEN** the card shows 18%, "2 di 11 in regola" and an 18% bar fill

### Requirement: Cicli LFP card
The Cruscotto SHALL render the "Cicli LFP" card per the approved draft (`bg-surfC rounded-[24px] p-4`, 2-column grid): label "Cicli LFP", the value "N/5.000" in 30px font-black (suffix `text-sm` bold `text-mut`), the subtitle "≈ N% vita utile", and a linear rounded bar `h-1.5 rounded-full bg-surfHiX` with an `bg-prim` fill at the real computed fraction with `min-w-[4px]`. The value SHALL be computed per design: `round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` of 5.000 Blade LFP cycles.

#### Scenario: Card renders computed cycles
- **WHEN** odometer is 4.500 km and consumption is 13,9 kWh/100km
- **THEN** the card shows "14/5.000", "≈ 0,3% vita utile" and a 0,3% bar fill (visible min-width pill)

## ADDED Requirements

### Requirement: Prossime queue
The Cruscotto SHALL render a "Prossime" queue below the hero per the approved draft §C: the 2 activities following the hero in the same priority order (scadute by most recent due date first, then the rest by earliest due date; the hero excluded), each as a tappable pill row (`rounded-full bg-surfC pl-2 pr-3 py-1.5 text-left active:scale-[0.99]`): leading 40px `bg-surfHi` circle with the draft calendar inline SVG, title (14px semibold, truncated) over a sub-line (11px `text-mut`, truncated: interval · spec), and a trailing chip (10px bold): scaduta → `bg-errC text-onErrC` "scad. dal gg/mm"; otherwise → `bg-secC text-onSecC` "tra N g" ("oggi" when due today). Tapping a row navigates to `/attivita`. A caption "Prossime · dopo la prossima" precedes the rows; the queue is hidden when no activity remains after the hero.

#### Scenario: Queue shows the next two
- **WHEN** the Cruscotto renders with the full seed (hero = #5, today 13/11/2026)
- **THEN** the queue shows #2 "Antiruggine sottoscocca" with chip "scad. dal 20/08" and #8 "Manutenzione severe" with chip "scad. dal 01/08" (never-done due anchors on delivery month 08/2025 + 12 mesi)

#### Scenario: Queue tap navigates
- **WHEN** the user taps the #2 queue row
- **THEN** the app navigates to the Attività section
