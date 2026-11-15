# dashboard Specification

## Purpose
Requirements for the Cruscotto (home) screen: the next-due hero card with one-tap quick registra, the "In sintesi" status rows, the "Prossime" queue and the "Stato veicolo" card.

## Requirements


### Requirement: Next-due hero card
The Cruscotto SHALL render the hero card per the approved draft B1 of `ui-drafts/c-cruscotto.html`: `rounded-[32px] shadow-hero p-5` whose container is tinted by the selected activity's status — `scaduto` → `bg-errC` with `text-onErrC`, header chip `bg-err text-onErr`, badge `bg-err text-onErr`, "Registra ora" button `bg-err text-onErr`; `in-scadenza` → `bg-waC` with `text-onWaC`, chip and badge `bg-onWaC text-waC` (inverted tonal — the chip MUST NOT be `bg-waC` on the `bg-waC` container, see `specs/design-system`), button `bg-prim text-onPrim`; `ok` (future) → `bg-primC` with `text-onPrimC`, chip and badge `bg-onOkC text-okC` (inverted tonal for ≥3:1 contrast — the badge follows the same `variant × status` map as the chip, never `bg-prim text-onPrim`), button `bg-prim text-onPrim`. The status chip and countdown badge SHALL come from the shared status-chip component of `specs/design-system` (one component, one `variant × status` color map: `variant: 'hero'` for the chip, `variant: 'badge'` for the countdown badge — the badge variant owns the digit-strip DOM). Layout: header row (label "Prossima scadenza" 12px `label` bold uppercase `tracking-[0.08em]` at 60% opacity + status chip), the draft's car SVG centered at `h-24 w-auto` as the visual centerpiece (fills from the `carBody`/`carBodyErr`, `carAccent`/`carAccentErr` and `carWheel` tokens — `specs/design-system` Token hygiene), the countdown as a pill badge absolutely positioned at the car's top-right (`-top-1 right-2`, 12px `label` extrabold) reading "+N g" when overdue, "tra N g" when future and "oggi" when due today — always unpadded, never "+04" (due-today is in-scadenza, never overdue) with the kinetic digit roll of the Kinetic countdown badge requirement below, the activity title (22px `title` font-black), its spec line (13px `body-sm`, 70% opacity), and its interval/duration chips (`bg-white/[0.08] border-white/10` pills with the draft battery and clock inline SVGs), then the full-width "Registra ora" button (`rounded-full h-12`, 15px `button-large` bold). The card MUST NOT contain the pentagon cookie, the wavy path, or a display-size countdown number. The selected activity SHALL be the scaduta with the most recent due date; if none is scaduta, the one with the earliest future due date. When no activity exists at all, the hero area SHALL render a graceful Italian caption instead of an empty container. A data-driven hero swap retints the container through its color transition and snaps the badge text (never replaying entrances or rolls — `specs/design-system`).

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
- **THEN** the container retints through its color transition, the badge text snaps to the new value without a roll, and no entrance replays

### Requirement: In sintesi card
The Cruscotto SHALL render "In sintesi" as ONE `bg-surfC rounded-[24px]` card (clipped, `overflow-hidden`) per variant A "Righe MD3" of `ui-drafts/e-rifiniture.html` Block 3A — the tonal tiles and the old `bg-surfLox` wrapper of `m3e-morfosi` are retired and dropped entirely. The card contains, top to bottom: the "In sintesi" heading, three tappable list rows separated by INSET hairline elements (`h-px bg-white/[0.06] mx-4` — separate divider elements, NOT row borders, so the row's radius morph stays clean exactly as the mockup guards), and at the bottom the footer line "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" (km segment live from `vehicle.odometerKm`) behind one more inset hairline element. Each row SHALL carry: a leading 40px circular icon container with the status tonal fill (`bg-okC` / `bg-waC` / `bg-errC`) holding a 20px stroked glyph in the matching on-color (`onOkC` check / `onWaC` clock-alert / `onErrC` alert-triangle), a text stack (label 15px `card-title`-weight `text-onSurf` — "In regola" / "In scadenza" / "Scadute" — over a sub-line 11px `meta` `text-mut`), and a trailing count (22px `title`-role `font-black` `text-onSurf`) with a 20px chevron `text-mut`. The sub-lines SHALL be static, truthful Italian glosses of the status criterion (e.g. "interventi in tempo" / "in arrivo a breve" / "da registrare" — exact wording is implementer judgment) and contain NO figures of any kind — never invented data derivations such as "entro 30 giorni", never counts or fractions. Rows SHALL use the shared state layers with the in-card row press morph (radius morph only — square → `rounded-[16px]`, 250ms `--e-spring` spring back on release, under the universal `scale(.97)` press layer — `specs/design-system`) and, on tap, the existing expanding ripple ring (12px center-origin ring, 2px `white/35` border with radial `white/18`→transparent fill, scaling ~14× and fading over 500ms `--e-emph`); navigation to `/attivita` with `queryParams { stato }` (`ok` / `in-scadenza` / `scaduto`) SHALL fire 600ms after the tap so the 500ms ripple fade completes first (immediately with reduced motion); a second row activation or any other navigation cancels the pending navigation, and keyboard activation (Enter/Space) navigates immediately with no delay. Counts SHALL animate with the count-up primitive of `specs/design-system` on pane activation and MUST be computed from data, never hard-coded; data edits update the counts without replaying the count-up (per `specs/design-system`).

#### Scenario: One card holds heading, rows and footer
- **WHEN** the "In sintesi" block renders
- **THEN** the heading, the three rows (inset hairline elements between them) and the footer line all sit inside the single `bg-surfC rounded-[24px]` card — the footer behind one more inset hairline element — and no `bg-surfLox` wrapper remains

#### Scenario: Rows show computed counts
- **WHEN** the full seed derives 2 ok (#9, #11), 1 in scadenza (#10) and 8 scadute
- **THEN** the three rows show 2 / 1 / 8 (rolling up from 0 on activation) with their static status glosses

#### Scenario: Sub-lines are static glosses
- **WHEN** the rows render
- **THEN** each sub-line is a static Italian gloss of its status criterion and contains no figures of any kind (e.g. never "entro 30 giorni" or "2 di 11")

#### Scenario: Row ripple then filtered navigation
- **WHEN** the user taps the "Scadute" row
- **THEN** the row morphs its radius toward 16px under the `.97` press scale while a ripple ring expands and fades (500ms), and 600ms after the tap the app navigates to `/attivita?stato=scaduto` and the Attività page shows only the scadute

#### Scenario: Second activation or navigation cancels the pending jump
- **WHEN** the user taps a second row (or navigates by any other means) before the 600ms elapse
- **THEN** the pending navigation is cancelled and only the latest intent takes effect

#### Scenario: Keyboard activation navigates immediately
- **WHEN** the user activates a row with Enter/Space
- **THEN** the app navigates to `/attivita?stato=...` immediately, with no delay

### Requirement: Stato veicolo card
The Cruscotto SHALL render ONE "Stato veicolo" card replacing the former Prontezza and Cicli LFP stat cards: `bg-surfC rounded-[24px] p-5` with the eyebrow "STATO VEICOLO" (caption eyebrow style — 10px `caption` bold uppercase `tracking-[0.14em]` `text-mut`) and a `grid grid-cols-2 gap-4` of two stat cells (grid items, NOT stacked rows). Each cell SHALL carry: a label 12px `label` `text-onSurfV` ("Prontezza" / "Cicli LFP"), the display value 30px `display` `font-black` `text-onSurf` with a 13px bold `text-mut` suffix ("%" / "/5.000") on a non-wrapping display line, a support line 11px `meta` `text-mut` ("2 di 11 in regola" / "≈ 0,3% vita utile"), and below it a wavy M3E progress indicator per the Wavy progress indicator (M3E) requirement of `specs/design-system` — track `surfHiX`, fill `prim` for Prontezza and `onTerC` for Cicli LFP. Values SHALL be computed from the store: Prontezza = ok activities / total activities (2 of 11 → 18%); Cicli LFP per the resolved ND-3 formula (unchanged from `refine-cruscotto-md3`): `round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` of 5.000 Blade LFP cycles (4.500 km · 13,9 kWh/100km → 14/5.000 · "≈ 0,3% vita utile"). On pane activation the values SHALL count up (existing primitive) and the wavy fills SHALL animate in per the primitive (`stroke-dasharray` `"0 1000"` → `"P 1000"`, 650ms `--e-spring`); reduced motion shows final values and fills immediately. Data edits update values and fills through the primitive's `stroke-dasharray` transition only — never replaying the count-up or entrance (per `specs/design-system`). The ring indicator (track/progress/dot SVG) MUST NOT be used.

#### Scenario: Card renders computed values
- **WHEN** the full seed derives 2 ok of 11 activities and the odometer is 4.500 km with 13,9 kWh/100km
- **THEN** the card shows "18%" with support "2 di 11 in regola" and a `prim` wavy fill at 18% (`stroke-dasharray="180 1000"`), and "14/5.000" with support "≈ 0,3% vita utile" and an `onTerC` wavy fill at its computed fraction

#### Scenario: Tiny value keeps a visible wave head
- **WHEN** the Cicli LFP fraction is ≈0,3%
- **THEN** the fill renders the minimum wave head (dash floor `45 1000`) — the mark reads as living, never empty

#### Scenario: Consumption change recomputes cycles
- **WHEN** the user sets "Consumo medio" to 15,0 kWh/100km
- **THEN** the card recomputes to "16/5.000" and the fill transitions its `stroke-dasharray` without replaying the entrance or count-up

#### Scenario: Display line never wraps
- **WHEN** the card renders its 30px values with their suffixes
- **THEN** each value and suffix stay on one non-wrapping line (e.g. "14" + "/5.000")

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

### Requirement: Hero entrance choreography
On entrance the hero container corner morphs 48px → 32px over 600ms `--e-emph`, and the badge pop SHALL start at T+750ms from route/pane activation (550ms `--e-spring`, scale .6 → 1.03 → 1) — the absolute timeline of the Kinetic countdown badge requirement of `specs/dashboard`. The "car entrance" is the hero block's entrance rise (0–550ms from activation). The hero MUST NOT render an ambient glow (removed per the user — the glow element and its breathing animation are gone): `shadow-hero` is the only depth cue. A data-driven hero swap retints the container through its color transition and snaps the badge text — never replaying the entrance. Reduced motion: no corner morph, badge appears with the card.

#### Scenario: Entrance choreography
- **WHEN** the Cruscotto is activated at T0
- **THEN** the hero block ("car entrance") rises/fades in over 0–550ms, the corners morph 48px → 32px over 600ms, and the badge pop starts at T+750ms

#### Scenario: No ambient glow
- **WHEN** the Cruscotto renders the hero
- **THEN** no glow element or breathing animation exists behind the hero — `shadow-hero` is the only depth cue

#### Scenario: Hero swap retints and snaps
- **WHEN** a registration changes the featured activity mid-session
- **THEN** the container retints through its color transition, the badge text snaps to the new value and no entrance replays

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
