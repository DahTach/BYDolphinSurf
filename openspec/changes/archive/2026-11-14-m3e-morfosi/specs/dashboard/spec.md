# dashboard Specification

## Purpose
Delta for the Cruscotto under the M3E Morfosi change: hero glow/entrance choreography, kinetic countdown badge, tile ripple, count-ups, spring bar fills, queue press morphs and graceful empty/hidden states.

## MODIFIED Requirements

### Requirement: Next-due hero card
The Cruscotto SHALL render the hero card per the approved draft B1 of `ui-drafts/c-cruscotto.html`: `rounded-[32px] shadow-hero p-5` whose container is tinted by the selected activity's status — `scaduto` → `bg-errC` with `text-onErrC`, header chip `bg-err text-onErr`, badge `bg-err text-onErr`, "Registra ora" button `bg-err text-onErr`; `in-scadenza` → `bg-waC` with `text-onWaC`, chip and badge `bg-onWaC text-waC` (inverted tonal — the chip MUST NOT be `bg-waC` on the `bg-waC` container, see `specs/design-system`), button `bg-prim text-onPrim`; `ok` (future) → `bg-primC` with `text-onPrimC`, chip and badge `bg-onOkC text-okC` (inverted tonal for ≥3:1 contrast — the badge follows the same `variant × status` map as the chip, never `bg-prim text-onPrim`), button `bg-prim text-onPrim`. The status chip and countdown badge SHALL come from the shared status-chip component of `specs/design-system` (one component, one `variant × status` color map: `variant: 'hero'` for the chip, `variant: 'badge'` for the countdown badge — the badge variant owns the digit-strip DOM). Layout: header row (label "Prossima scadenza" 12px `label` bold uppercase `tracking-[0.08em]` at 60% opacity + status chip), the draft's car SVG centered at `h-24 w-auto` as the visual centerpiece (fills from the `carBody`/`carBodyErr`, `carAccent`/`carAccentErr` and `carWheel` tokens — `specs/design-system` Token hygiene), the countdown as a pill badge absolutely positioned at the car's top-right (`-top-1 right-2`, 12px `label` extrabold) reading "+N g" when overdue, "tra N g" when future and "oggi" when due today — always unpadded, never "+04" (due-today is in-scadenza, never overdue) with the kinetic digit roll of the Kinetic countdown badge requirement below, the activity title (22px `title` font-black), its spec line (13px `body-sm`, 70% opacity), and its interval/duration chips (`bg-white/[0.08] border-white/10` pills with the draft battery and clock inline SVGs), then the full-width "Registra ora" button (`rounded-full h-12`, 15px `button-large` bold). The card MUST NOT contain the pentagon cookie, the wavy path, or a display-size countdown number. The selected activity SHALL be the scaduta with the most recent due date; if none is scaduta, the one with the earliest future due date. When no activity exists at all, the hero area SHALL render a graceful Italian caption instead of an empty container. A data-driven hero swap retints the container and glow through their color transitions and snaps the badge text (never replaying entrances or rolls — `specs/design-system`).

#### Scenario: Most recent scaduta is featured
- **WHEN** the full seed derives 8 scadute and #5 has the most recent due date (09/11/2026) and today is 13/11/2026
- **THEN** the hero shows an `errC` container, chip "Scaduto", the car centered with badge "+4 g", title "Bilanciamento LFP 100%", spec "Carica AC 100% + top-balance 1–2 h", chips "Ogni 1 mese" and "1–2 h collegate", and an `bg-err` "Registra ora" button

#### Scenario: Future due is tinted primC
- **WHEN** no activity is scaduta and the hero is #9 (due 08/08/2027)
- **THEN** the hero shows a `primC` container, a `bg-onOkC text-okC` chip "OK", a `bg-onOkC text-okC` badge "tra N g" and a `bg-prim` button

#### Scenario: In-scadenza hero chip is visible
- **WHEN** the hero features the in-scadenza #10 on its `bg-waC` container
- **THEN** its chip and badge render `bg-onWaC text-waC` (≥3:1 contrast against the container) — never `bg-waC` on `bg-waC`

#### Scenario: Registra ora creates a registration
- **WHEN** the user taps "Registra ora" on the hero
- **THEN** a history entry for the hero activity is created immediately (one-tap quick registra — no form) and its status recomputes

#### Scenario: Hero swap retints and snaps
- **WHEN** "Registra ora" moves the hero to the next activity with a different status
- **THEN** the container and glow retint through their color transitions, the badge text snaps to the new value without a roll, and no entrance replays

### Requirement: In sintesi card
The Cruscotto SHALL render the "In sintesi" card per the approved draft (`rounded-[28px] bg-surfLox p-5`): the heading "In sintesi", three TAPPABLE tonal tiles in `grid grid-cols-3 gap-2.5` (`rounded-[20px] px-2 py-3.5 text-center`): "In regola" `bg-okC text-onOkC`, "In scadenza" `bg-waC text-onWaC`, "Scadute" `bg-errC text-onErrC` — each with its count (26px `display` font-black) and label (10px `caption` bold at 80% opacity). Tiles SHALL use the shared state layers with the tile press `scale(.95)` and, on tap, an expanding ripple ring (12px center-origin ring, 2px `white/35` border with radial `white/18`→transparent fill, scaling ~14× and fading over 500ms `--e-emph`); navigation to `/attivita` with `queryParams { stato }` (`ok` / `in-scadenza` / `scaduto`) SHALL fire 600ms after the tap so the 500ms ripple fade completes first (immediately with reduced motion); a second tile activation or any other navigation cancels the pending navigation, and keyboard activation (Enter/Space) navigates immediately with no delay. Counts SHALL animate with the count-up primitive of `specs/design-system` on pane activation and MUST be computed from data, never hard-coded; data edits update the counts without replaying the count-up (per `specs/design-system`). The status dots (emerald/amber/rose) are removed — the tile color carries the state. The footer line stays "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" with the km segment live from `vehicle.odometerKm`.

#### Scenario: Tiles show computed counts
- **WHEN** the full seed derives 2 ok (#9, #11), 1 in scadenza (#10) and 8 scadute
- **THEN** the tiles show 2 / 1 / 8 (rolling up from 0 on activation)

#### Scenario: Tile ripple then filtered navigation
- **WHEN** the user taps the "Scadute 8" tile
- **THEN** the tile scales to .95 and a ripple ring expands and fades (500ms), and 600ms after the tap the app navigates to `/attivita?stato=scaduto` and the Attività page shows only the scadute

#### Scenario: Second activation or navigation cancels the pending jump
- **WHEN** the user taps a second tile (or navigates by any other means) before the 600ms elapse
- **THEN** the pending navigation is cancelled and only the latest intent takes effect

#### Scenario: Keyboard activation navigates immediately
- **WHEN** the user activates a tile with Enter/Space
- **THEN** the app navigates to `/attivita?stato=...` immediately, with no delay

### Requirement: Prontezza linear bar card
The Cruscotto SHALL render the "Prontezza" card per the approved draft (`bg-surfC rounded-[24px] p-4`, 2-column grid): label "Prontezza" (12px `label` `text-onSurfV`), the percentage in 30px `display` font-black with "%" at `text-sm` bold `text-mut`, the subtitle "N di M in regola" (11px `meta` `text-mut`), and a linear rounded bar `h-1.5 rounded-full bg-surfHiX` with an `bg-prim` fill of `percent%` width. On pane activation the percentage SHALL count up (~700ms) and the bar fill SHALL animate from 0 to its target width (650ms `--e-spring`); reduced motion shows the final values immediately. Data edits update the value and bar width through the existing width/color transitions only — never replaying the count-up or entrance (per `specs/design-system`). The ring indicator (track/progress/dot SVG) MUST NOT be used.

#### Scenario: Bar reflects the seed fraction
- **WHEN** the full seed derives 2 ok of 11 activities
- **THEN** the card shows 18%, "2 di 11 in regola" and an 18% bar fill (animated from 0 on activation)

### Requirement: Cicli LFP card
The Cruscotto SHALL render the "Cicli LFP" card per the approved draft (`bg-surfC rounded-[24px] p-4`, 2-column grid): label "Cicli LFP", the value "N/5.000" in 30px `display` font-black (suffix `text-sm` bold `text-mut`), the subtitle "≈ N% vita utile", and a linear rounded bar `h-1.5 rounded-full bg-surfHiX` with an `bg-prim` fill at the real computed fraction with `min-w-[4px]`. The value SHALL be computed per the resolved ND-3 formula (unchanged from `refine-cruscotto-md3`): `round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` of 5.000 Blade LFP cycles. On pane activation the value SHALL count up and the bar fill SHALL animate from 0 (650ms `--e-spring`); reduced motion shows final values immediately. Data edits recompute the value and bar width through the existing width/color transitions only — never replaying the count-up or entrance (per `specs/design-system`).

#### Scenario: Card renders computed cycles
- **WHEN** odometer is 4.500 km and consumption is 13,9 kWh/100km
- **THEN** the card shows "14/5.000", "≈ 0,3% vita utile" and a 0,3% bar fill (visible min-width pill)

#### Scenario: Consumption change recomputes cycles
- **WHEN** the user sets "Consumo medio" to 15,0 kWh/100km
- **THEN** the card recomputes to "16/5.000"

### Requirement: Prossime queue
The Cruscotto SHALL render a "Prossime" queue below the hero per the approved draft §C: the 2 activities following the hero in the same priority order (scadute by most recent due date first, then the rest by earliest due date; the hero excluded), each as a tappable pill row (`rounded-full bg-surfC pl-2 pr-3 py-1.5 text-left`): leading 40px `bg-surfHi` circle with the draft calendar inline SVG, title (14px `body` semibold, truncated) over a sub-line (11px `meta` `text-mut`, truncated: interval · spec), and a trailing chip rendered through the shared status-chip component of `specs/design-system` (`variant="card"` with a custom `text` — one component, one color map, never a per-page fill): `scaduto` → `bg-errC text-onErrC` "scad. dal gg/mm"; `in-scadenza` → `bg-waC text-onWaC` "tra N g" ("oggi" when due today); `ok` → `bg-okC text-onOkC` "tra N g". Rows SHALL carry the shared state layers and the press shape morph (pill → 22px + `scale(.97)`, `specs/design-system`), and SHALL enter with the staggered entrance (55ms) on pane activation. Tapping a row navigates to `/attivita`. A caption "Prossime · dopo la prossima" precedes the rows; when no activity remains after the hero, the queue SHALL render a graceful Italian caption instead of being hidden.

#### Scenario: Queue shows the next two
- **WHEN** the Cruscotto renders with the full seed (hero = #5, today 13/11/2026)
- **THEN** the queue shows #2 "Antiruggine sottoscocca" with chip "scad. dal 20/08" and #8 "Manutenzione severe" with chip "scad. dal 01/08" (never-done due anchors on delivery month 08/2025 + 12 mesi)

#### Scenario: Queue tap navigates
- **WHEN** the user taps the #2 queue row
- **THEN** the app navigates to the Attività section

#### Scenario: Empty queue shows a caption
- **WHEN** no activity remains after the hero
- **THEN** the queue area renders a graceful Italian caption (e.g. "Nessun'altra scadenza in vista") instead of nothing

## ADDED Requirements

### Requirement: Hero ambient glow and entrance choreography
The hero SHALL render a breathing ambient glow behind its container: a status-tinted radial fill (the status color: `err` when scaduto, `wa` when in scadenza, `prim` when ok — never `bg-waC`-style fill equal to the container), inset ≈6px beyond the hero, `filter: blur(70px)`, breathing `scale 1 → 1.06 / opacity .45 → .7` over `--d-breathe` (≈6s) ease-in-out infinite. On entrance the hero container corner morphs 48px → 32px over 600ms `--e-emph`, and the badge pop starts at T+750ms from route/pane activation (550ms `--e-spring`, scale .6 → 1.03 → 1) — the absolute timeline of the Kinetic countdown badge requirement below. The "car entrance" is the hero block's entrance rise (0–550ms from activation). A data-driven hero swap retints the container and glow through their color transitions and snaps the badge text — never replaying the entrance. Reduced motion: glow static at opacity `.55`, no corner morph, badge appears with the card.

#### Scenario: Glow breathes behind the hero
- **WHEN** the Cruscotto renders with the scaduto hero
- **THEN** a blurred (≈70px) err-tinted glow breathes (scale 1→1.06, opacity .45→.7, `--d-breathe` ≈6s loop) behind the hero container

#### Scenario: Entrance choreography
- **WHEN** the Cruscotto is activated at T0
- **THEN** the hero block ("car entrance") rises/fades in over 0–550ms, the corners morph 48px → 32px over 600ms, and the badge pop starts at T+750ms

#### Scenario: Hero swap retints and snaps
- **WHEN** a registration changes the featured activity mid-session
- **THEN** the container and glow retint through their color transitions, the badge text snaps to the new value and no entrance replays

### Requirement: Kinetic countdown badge
The hero countdown badge SHALL render its text ALWAYS unpadded — "+N g" / "tra N g" / "oggi", never zero-padded (never "+04"). The digit cells SHALL derive from the current rendered text (variable count: "+4 g" = 1 digit cell, "+230 g" = 3 digit cells): each digit is a masked strip (cell height 1.15em, `overflow: hidden` window, digits 0–9 repeated) translating `-(10 + value) × 1.15em` over 600ms `--e-spring` with 55ms stagger per digit position, followed by a settle tick (scale 1 → 1.08 → 1, 400ms `--e-spring`) applied to a nested inner span so it never clobbers the entrance pop transform. Masked strips roll ONLY on page/route activation; mid-session value changes (e.g. the hero swaps after "Registra ora") SNAP to the new text without a roll. "oggi" has no digit cells — it plays the pop and settle tick only. Absolute timeline from route/pane activation (T0): the hero/car entrance rise runs 0–550ms ("car entrance" = the hero block's entrance rise); the badge pop starts at T+750ms (550ms spring); the digit strips roll starting at T+800ms (55ms stagger, 600ms each); the settle tick plays ≈80ms after the LAST digit cell settles — the last cell settles at T+800 + (n−1)×55 + 600 ms where n is the digit-cell count (≈T+1480ms for 1 cell). The badge keeps its approved placement (`-top-1 right-2` overlapping the car) and 12px `label` extrabold sizing. Reduced motion: no roll and no tick — the text shows its final value immediately.

#### Scenario: Digits roll into place
- **WHEN** the Cruscotto hero activates at T0 showing "+4 g"
- **THEN** the badge pops at T+750ms, its digit rolls (600ms) starting at T+800ms with 55ms stagger, and the settle tick plays ≈80ms after the last digit cell settles

#### Scenario: Text is never padded
- **WHEN** the hero shows an overdue badge for an activity 4 days late
- **THEN** it reads "+4 g" — never "+04 g"

#### Scenario: Digit cells follow the rendered text
- **WHEN** the hero shows "+230 g" and elsewhere "+4 g"
- **THEN** the first badge rolls three digit cells (2, 3, 0) and the second rolls a single cell — the cell count derives from the rendered text

#### Scenario: "oggi" pops without a roll
- **WHEN** the hero activity is due today
- **THEN** the badge reads "oggi" and plays only the pop and settle tick (no digit roll)

#### Scenario: Mid-session changes snap
- **WHEN** a "Registra ora" swap changes the badge value mid-session
- **THEN** the badge text snaps to the new value with no roll and no tick

#### Scenario: Reduced motion shows final digits
- **WHEN** the hero activates with reduced motion
- **THEN** the badge displays "+4 g" immediately with no roll or tick
