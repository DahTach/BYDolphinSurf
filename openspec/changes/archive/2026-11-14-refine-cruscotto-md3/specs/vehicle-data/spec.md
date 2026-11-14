## MODIFIED Requirements

### Requirement: Odometer and consegna filled text fields
The Cruscotto SHALL render the three vehicle fields "Chilometraggio" (numeric, `inputmode="numeric"`, "km" suffix), "Consegna" (month) and "Consumo medio" (numeric, kWh/100km, default 13,9) through the shared MD3 filled-text-field component per the approved draft §0 of `ui-drafts/c-cruscotto.html`: container `h-14 rounded-full px-5 pt-2`, at rest `bg-surfHiX` with floating label (10px semibold `text-onSurfV`); on focus-within `bg-surfHi` + `ring-2 ring-prim` with label bold `text-prim` — no bottom indicator and no squared corners (user revision: pill-shaped fields coherent with the app's rounded language); input `text-[16px] font-medium text-onSurf focus:outline-none` with the trailing suffix in 12px `text-onSurfV`. Edits persist and recompute derived statuses / the Cicli LFP card (resolved ND-3 behavior unchanged).

#### Scenario: Focus state anatomy
- **WHEN** the Chilometraggio field is focused
- **THEN** its container brightens to `bg-surfHi` and gains a 2px `bg-prim` ring while its label turns bold `text-prim`; at rest it shows `bg-surfHiX` with muted label and no ring

#### Scenario: Odometer edit updates the store
- **WHEN** the user changes the Chilometraggio field to 4.750 km
- **THEN** `vehicle.odometerKm` becomes 4750 in localStorage and every km-derived activity status and "Ultimo/Prossimo" line is recomputed

#### Scenario: Consumption edit recomputes Cicli LFP
- **WHEN** the user changes "Consumo medio" to 15,0
- **THEN** `vehicle.consumptionKwhPer100Km` becomes 15 in localStorage and the Cicli LFP card recomputes (per `specs/dashboard`)
