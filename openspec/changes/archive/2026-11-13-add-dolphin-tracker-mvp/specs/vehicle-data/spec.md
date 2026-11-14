## ADDED Requirements

### Requirement: Single vehicle profile persisted in localStorage
The app SHALL persist exactly one vehicle in localStorage under key `byd-dolphin:v1` (schema in `design.md` D4), seeded from `ui-drafts/b-blade.html`: model "Dolphin Surf", badge "2025 EU · 43,2 kWh", delivery month "08/2025", odometer 4.500 km. There SHALL be no backend, no sync, no multi-vehicle support.

#### Scenario: First run seeds the store
- **WHEN** the app starts and `byd-dolphin:v1` is absent
- **THEN** the store is seeded with the draft vehicle data (odometer 4.500 km, consegna 08/2025, consumo 13,9 kWh/100km) and written to localStorage

#### Scenario: Persistence across reloads
- **WHEN** the user changes any data and reloads the page
- **THEN** the changed data is restored from localStorage without re-seeding

### Requirement: Odometer and consegna filled text fields
The Cruscotto SHALL render the M3 filled text fields from `ui-drafts/b-blade.html`: "Chilometraggio" (numeric input, `inputmode="numeric"`, "km" suffix) and "Consegna" (month "08/2025"), both `h-14 bg-surfHiX rounded-t-[4px]` with the small `text-prim` floating label, exactly as in the draft. It SHALL additionally render a "Consumo medio" field (numeric, kWh/100km, same filled style, default 13,9) feeding the Cicli LFP computation (resolved ND-3, design D7).

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
