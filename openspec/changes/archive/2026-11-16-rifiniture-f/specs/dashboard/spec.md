# dashboard Specification

## Purpose
Delta for the Cruscotto under Rifiniture F: the "Stato veicolo" card renders the circular wavy progress (composition A) instead of the linear wavy bars, and the ring ban is scoped to the old plain ring-with-dot.

## MODIFIED Requirements

### Requirement: Stato veicolo card
The Cruscotto SHALL render ONE "Stato veicolo" card replacing the former Prontezza and Cicli LFP stat cards: `bg-surfC rounded-[24px] p-5` with the eyebrow "STATO VEICOLO" (caption eyebrow style — 10px `caption` bold uppercase `tracking-[0.14em]` `text-mut`) and a `grid grid-cols-2 gap-4` of two stat cells (grid items, NOT stacked rows), per composition A "Valore al centro, etichette sotto" of `ui-drafts/f-wavy-ring.html`. Each cell SHALL carry a circular wavy progress ring per the Wavy progress indicator (M3E) requirement of `specs/design-system` — exactly 120px × 120px (`w-[120px] h-[120px]`), centered; track `surfHiX`, fill `prim` for Prontezza and `onTerC` for Cicli LFP — with the display value centered INSIDE the ring via `absolute inset-0 flex items-center justify-center` on one non-wrapping line (`whitespace-nowrap`, `leading-none tracking-tight`): "18" 26px `display` `font-black` `text-onSurf` + "%" 14px bold `text-mut` (Cicli: "14" 26px + "/5.000" 12px bold `text-mut`). The single-line value SHALL scale DOWN rather than overflow or wrap: the value figure renders 26px by default, 22px at more than 6 glyphs and 18px at more than 8 glyphs (glyphs counted on the value figure — digits and separators, e.g. "123.456" is 7 glyphs; the "%" / "/5.000" suffixes keep their fixed 14px / 12px sizes and `whitespace-nowrap` stays). Below the ring, centered: the label 12px `label` `text-onSurfV` at `mt-3` ("Prontezza" / "Cicli LFP") and the support line 11px `meta` `text-mut` at `mt-1` ("2 di 11 in regola" / "≈ 0,3% vita utile"). The linear wavy bars leave the card (the linear form of `specs/design-system` stays spec'd and legal for other uses). Values SHALL be computed from the store: Prontezza = ok activities / total activities, its percent being `round(ok / total × 100)` (2 of 11 → 18%); Cicli LFP per the resolved ND-3 formula (unchanged from `refine-cruscotto-md3`): `round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` of 5.000 Blade LFP cycles (4.500 km · 13,9 kWh/100km → 14/5.000 · "≈ 0,3% vita utile"). The ring's `value` input SHALL bind the COMPUTED final percent — the activation count-up animates only the text values (binding the count-up signal would re-trigger the dash effect every frame and silently degrade the entrance). On pane activation the values SHALL count up (existing primitive) and the ring fills SHALL animate in per the primitive (`stroke-dasharray` `"0 1000"` → `"P 1000"`, 650ms `--e-spring`); reduced motion shows final values and fills immediately. Data edits update values and fills through the primitive's `stroke-dasharray` transition only — never replaying the count-up or entrance (per `specs/design-system`). Circular progress SHALL be the wavy ring of `specs/design-system`: the `refine-cruscotto-md3` ban on the ring indicator (track/progress/dot SVG) is scoped to that old plain ring-with-dot artifact and stays in force only against it — it MUST NOT be read as forbidding the wavy ring mandated here.

#### Scenario: Rings carve computed values
- **WHEN** the full seed derives 2 ok of 11 activities and the odometer is 4.500 km with 13,9 kWh/100km
- **THEN** the Prontezza ring carves its wavy arc at 18% (`stroke-dasharray="180 1000"`, `prim`) and the Cicli ring at ≈0,3% with the floored dash (`stroke-dasharray="45 1000"`, `onTerC`), with supports "2 di 11 in regola" and "≈ 0,3% vita utile"

#### Scenario: Value centered in the ring, labels below
- **WHEN** a stat cell renders
- **THEN** the display value ("18" + "%" / "14" + "/5.000") is centered inside the ring via `absolute inset-0 flex items-center justify-center` on one non-wrapping line (`leading-none tracking-tight`), and below the ring sit the centered 12px label (`mt-3`) and the 11px support line (`mt-1`)

#### Scenario: Ring fill entrance on activation
- **WHEN** the pane becomes active
- **THEN** the ring fills animate `stroke-dasharray` from `"0 1000"` to `"P 1000"` over 650ms `--e-spring` exactly once — the carve growing CLOCKWISE from 12 o'clock — and reduced motion shows the final fills immediately

#### Scenario: Data edits transition the rings without replay
- **WHEN** the user sets "Consumo medio" to 15,0 kWh/100km
- **THEN** the card recomputes to "16/5.000", the ring `stroke-dasharray` transitions to the new `P 1000` at the data-edit speed (`--d-small` `--e-emph`), and neither the entrance nor the count-up replays

#### Scenario: Zero cycles ring renders empty
- **WHEN** the Cicli LFP value is 0 of 5.000
- **THEN** its ring renders empty (`stroke-dasharray="0 1000"`) — no wave head — while the centered value reads "0/5.000"
