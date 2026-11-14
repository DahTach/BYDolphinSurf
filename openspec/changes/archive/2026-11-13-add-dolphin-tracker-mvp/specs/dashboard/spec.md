## ADDED Requirements

### Requirement: Next-due hero card
The Cruscotto SHALL render the hero card from `ui-drafts/b-blade.html` (`rounded-[28px] bg-primC shadow-hero`): label "Prossima scadenza", status chip of the selected activity, the draft's stylized car SVG, the countdown on the pentagon cookie (104px, `white/[0.08]`, stroke-width 7) showing the days delta, the activity title (`text-[20px]` extrabold `text-onPrimC`), its interval/spec chips (white/10 pills with the draft's battery and clock inline SVGs), the wavy progress path (stroke `#f3d4c8`, as in the draft), and the full-width "Registra ora" filled button (`bg-prim text-onPrim`, rounded-full, `h-12`). The selected activity SHALL be the scaduta with the most recent due date (draft: #5 Bilanciamento LFP 100%, "+3 giorni fa"); if none is scaduta, the one with the earliest future due date.

#### Scenario: Most recent scaduta is featured
- **WHEN** the full 11-activity seed (design D8) derives 8 scadute and #5 has the most recent due date (09/11/2026) and today is 12/11/2026
- **THEN** the hero shows the chip "Scaduto" (`bg-err text-onErr`), countdown "+3" with "giorni fa", title "Bilanciamento LFP 100%", chips "Ogni 1 mese" and "1–2 h collegate", wavy progress and "Registra ora", exactly as in `ui-drafts/b-blade.html`

#### Scenario: Future due shows "tra N giorni"
- **WHEN** no activity is scaduta and the earliest future due is #9 (08/08/2027)
- **THEN** the hero features #9 with the countdown "tra N giorni", where N = days from today to 08/08/2027

#### Scenario: Registra ora creates a registration
- **WHEN** the user taps "Registra ora" on the hero
- **THEN** a history entry for the hero activity is created immediately (one-tap quick registra, design D9 — no form) and its status recomputes

### Requirement: In sintesi card
The Cruscotto SHALL render the "In sintesi" card from `ui-drafts/b-blade.html` (`rounded-[28px] bg-surfLox`): three rows "In regola" (emerald dot), "In scadenza" (amber dot), "Scadute" (rose dot), each with its count computed from the derived statuses and a circular chevron button (`bg-white/[0.08]`), plus the footer line "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" where the km segment is live from `vehicle.odometerKm` (Italian compact "4,5k") and the rest is static (resolved ND-4). Counts MUST be computed from data, never hard-coded.

#### Scenario: Counts reflect derived statuses
- **WHEN** the full 11-activity seed (design D8) derives 2 ok (#9, #11), 1 in scadenza (#10) and 8 scadute
- **THEN** the rows show 2 / 1 / 8 — computed from data; the draft's "Scadute 1" is superseded

### Requirement: Prontezza ring card
The Cruscotto SHALL render the "Prontezza" mini card from `ui-drafts/b-blade.html` (`bg-surfC rounded-[24px]`): ring indicator with gap and end dot where the track arc is circumference − gap (2π·20 − 15.1 = 110.6), the progress arc is `ok/total × 110.6` (formula invariant; the draft's 82% → 90.7 assumes 9/11 ok and is superseded by the computed fraction), the percentage in `text-2xl font-black` and the subtitle "N in regola".

#### Scenario: Ring reflects the seed fraction
- **WHEN** the full seed derives 2 ok of 11 activities (design D8)
- **THEN** the ring shows 18% (progress dasharray 20.1 over track 110.6, end dot at the progress angle) with subtitle "2 in regola"

### Requirement: Cicli LFP card
The Cruscotto SHALL render the "Cicli LFP" mini card from `ui-drafts/b-blade.html` (`bg-surfC rounded-[24px]`): the computed value "N/5.000", subtitle "≈ N% vita utile", and the linear bar (`h-1.5 bg-surfHiX` with `bg-prim` fill at the computed percentage). The value SHALL be computed per design D7 (resolved ND-3): `round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` of 5.000 Blade LFP cycles — the draft's static "1.721/5.000 · ≈ 34%" is superseded by the computed value.

#### Scenario: Card renders computed cycles
- **WHEN** odometer is 4.500 km and consumption is 13,9 kWh/100km
- **THEN** the card shows "14/5.000", "≈ 0,3% vita utile" and a 0,3% bar

#### Scenario: Consumption change recomputes cycles
- **WHEN** the user sets "Consumo medio" to 15,0 kWh/100km
- **THEN** the card recomputes to "16/5.000"
