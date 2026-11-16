# Rifiniture F

## Why

`rifiniture-e` put the Onda M3E linear wavy bars in the "Stato veicolo" card, but the user's reference (screenshot) is the Material 3 Expressive **circular** wavy progress — a smooth ring track with the active portion drawn as a wavy stroke along the arc and the value in the center. The approved mockup `ui-drafts/f-wavy-ring.html` (variant A "Valore al centro, etichette sotto", geometry verified at 4× zoom) is the visual source of truth. One focused refinement; the `refine-cruscotto-md3` ring ban must be scoped so it retires only the old plain ring-with-dot, never the wavy ring we now mandate.

## What Changes

- **Wavy progress primitive grows a circular form**: `viewBox="0 0 120 120"` ring — smooth track `<circle cx="60" cy="60" r="52">` stroke 3px `surfHiX`; active = wavy path on the same circle (radius 52 ± 3.5, exactly 12 waves so the ring closes seamlessly, stroke 4.5px round caps AND joins, sampled path, 12 o'clock clockwise start), `pathLength="1000"`, carved with the same dash pair `P 1000` (`P = round(max(value% × 10, 45))` capped at 1000 — ≥100% → `1000 1000`; 0% empty). Same motion contract as the bar: entrance `"0 1000"` → `"P 1000"` (650ms `--e-spring`, activation only), data edits transition over `--d-small` `--e-emph` without replay, reduced motion = final fill. The linear form stays spec'd and legal (it just leaves this card).
- **"Stato veicolo" card → rings, composition A**: each cell = 120px × 120px ring with the display value centered inside (Prontezza "18" 26px `display` + "%" 14px bold `mut`; Cicli "14" 26px + "/5.000" 12px bold `mut`), below the ring the centered label 12px `label` `onSurfV` and support 11px `meta` `mut`. Card scaffold unchanged; linear wavy bars leave the card. Values/supports stay store-computed (ND-3 untouched).
- **Ring ban superseded**: the delta retires the `refine-cruscotto-md3` "ring indicator MUST NOT" wording — the banned artifact is the OLD plain ring-with-dot SVG; the circular WAVY progress is now the mandated form (only the wavy form is legal for circular progress).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `design-system`: "Wavy progress indicator (M3E)" gains the circular form (ring geometry, dash semantics, motion; ring-ban carve-out: only the wavy form is legal for circular progress).
- `dashboard`: "Stato veicolo card" — rings composition A replace the linear waves; the ring ban wording is replaced by the wavy-ring mandate.

## Impact

- Code: `components/wavy-progress/` (ring form — `shape` input or sibling component, implementer's call), `pages/dashboard/*` (Stato veicolo cells); spec deltas for `design-system`, `dashboard`.
- No new dependencies; no data/seed/status logic changes (ND-3 unchanged).

## Non-goals

No other pages/cards; the linear wavy form stays spec'd and available; no motion-token/state-layer changes; no new dependencies; no data/seed/status changes; no hero/sintesi/sheet changes; no return of the old plain ring-with-dot indicator.
