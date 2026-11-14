# vehicle-data Specification

## Purpose
Requirements for the single vehicle profile persisted in localStorage, its editable fields on the Cruscotto, and Italian formatting of vehicle data.

## Requirements


### Requirement: Single vehicle profile persisted in localStorage
The app SHALL persist exactly one vehicle in localStorage under key `byd-dolphin:v1` (schema in `design.md` D4), seeded from `ui-drafts/b-blade.html`: model "Dolphin Surf", badge "2025 EU · 43,2 kWh", delivery month "08/2025", odometer 4.500 km. There SHALL be no backend, no sync, no multi-vehicle support.

#### Scenario: First run seeds the store
- **WHEN** the app starts and `byd-dolphin:v1` is absent
- **THEN** the store is seeded with the draft vehicle data (odometer 4.500 km, consegna 08/2025, consumo 13,9 kWh/100km) and written to localStorage

#### Scenario: Persistence across reloads
- **WHEN** the user changes any data and reloads the page
- **THEN** the changed data is restored from localStorage without re-seeding

### Requirement: Odometer and consegna filled text fields
The Cruscotto SHALL render the three vehicle fields "Chilometraggio" (numeric, `inputmode="numeric"`, "km" suffix), "Consegna" (month) and "Consumo medio" (numeric, kWh/100km, default 13,9) through the shared MD3 filled-text-field component per the approved draft §0 of `ui-drafts/c-cruscotto.html`: container `h-14 rounded-full px-5 pt-2`, at rest `bg-surfHiX` with floating label (10px semibold `text-onSurfV`); on focus-within `bg-surfHi` + `ring-2 ring-prim` with label bold `text-prim` — no bottom indicator and no squared corners (user revision: pill-shaped fields coherent with the app's rounded language); input `text-[16px] font-medium text-onSurf focus:outline-none` (16px `field` role) with the trailing suffix in 12px `label` `text-onSurfV`. The focus SHALL animate per `specs/design-system` (the 2px `prim` ring scales in from 1.06 over 250ms `--e-spring`, container and label colors transition over 250ms `--e-emph`), and the field styling SHALL use theme tokens only (no hardcoded colors). Edits persist and recompute derived statuses / the Cicli LFP card (resolved ND-3 behavior unchanged) — the recomputed values update without replaying any entrance, count-up or digit roll (per `specs/design-system`).

#### Scenario: Focus state anatomy
- **WHEN** the Chilometraggio field is focused
- **THEN** its container brightens to `bg-surfHi` and a 2px `bg-prim` ring scales in (1.06 → 1, 250ms spring) while its label turns bold `text-prim`; at rest it shows `bg-surfHiX` with muted label and no ring

#### Scenario: Odometer edit updates the store
- **WHEN** the user changes the Chilometraggio field to 4.750 km
- **THEN** `vehicle.odometerKm` becomes 4750 in localStorage and every km-derived activity status and "Ultimo/Prossimo" line is recomputed

#### Scenario: Consumption edit recomputes Cicli LFP
- **WHEN** the user changes "Consumo medio" to 15,0
- **THEN** `vehicle.consumptionKwhPer100Km` becomes 15 in localStorage and the Cicli LFP card recomputes (per `specs/dashboard`)

### Requirement: Italian formatting of vehicle data
Vehicle data SHALL be displayed with Italian formatting as in `ui-drafts/b-blade.html`: thousands separator "." for km ("4.500"), dates `dd/mm/yyyy` ("09/10/2026"), months `mm/yyyy` ("08/2025"), implemented by the pure helpers of `data/format.ts` (no new dependencies).

#### Scenario: Odometer display
- **WHEN** `vehicle.odometerKm` is 4500
- **THEN** the Chilometraggio field and all km chips render "4.500"
