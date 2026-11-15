# Rifiniture E

## Why

`m3e-morfosi` shipped the M3E language, but two dashboard patterns read as dated against the approved mockups `ui-drafts/e-rifiniture.html` (Block 3A "Righe MD3") and `ui-drafts/e2-stat-grid.html` (variant B "Onda M3E" + sheet block): the three tonal tiles in "In sintesi" lack the MD3 list anatomy, the stat cards use plain linear bars, the FAB sheet's 2-column layout mis-sizes free-text inputs, and the user rejected the hero ambient glow ("not very material 3"). Refinement pass (4 items); mockups are the visual source of truth.

## What Changes

- **In sintesi → Righe MD3 (variant A)**: tiles + `bg-surfLox` wrapper become ONE `bg-surfC rounded-[24px]` card holding the heading, three tappable rows and the footer km line — rows separated by inset hairline elements (`h-px bg-white/[0.06] mx-4`, not row borders; one more hairline above the footer); row = 40px status-tonal icon circle + 20px glyph, 15px label + static 11px gloss with no figures of any kind, 22px count + chevron. Rows keep state layers, radius-only press morph (`rounded-[16px]`, universal `scale(.97)`), count-up and the `/attivita?stato=` deep link.
- **Prontezza + Cicli LFP → ONE "Stato veicolo" card** with the Onda M3E wavy progress (reusable design-system primitive): 2-col cells over a wavy SVG (canonical mockup path, `pathLength=1000`, dash pair `P 1000` with `P = max(value% × 10, 45)` — 0% empty; `prim`/`onTerC` fills on `surfHiX`; 650ms `--e-spring` fill entrance). Linear-bar cards replaced.
- **FAB sheet fields per expected input length**: `grid grid-cols-2 gap-4` (16px) — Attività full-width, Data + Chilometraggio, Luogo full-width, Costo + Durata; half fields fit (`flex-1 min-w-0` value, `shrink-0` suffix) and the footer matches the mockups ("Annulla" auto-width `px-6`, "Registra" `flex-1`). Anatomy, validation and save path unchanged.
- **Hero glow REMOVED** (element + breathing animation) with its dead `--d-breathe` token: hero keeps tint map, corner morph, badge timeline, entrance; `shadow-hero` is the only depth cue.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `dashboard`: "In sintesi card" → rows (inset hairlines, one-card container); "Prontezza linear bar card" + "Cicli LFP card" → one "Stato veicolo card"; "Hero ambient glow and entrance choreography" → "Hero entrance choreography".
- `activities`: "FAB bottom-sheet capture form" length-based field grid (half-field fit, mockup footer); "Status filter from Cruscotto tiles" → rows wording.
- `design-system`: ADD "Wavy progress indicator (M3E)"; entrance bars linear-or-wavy; reduced-motion glow removed; motion tokens drop breathe + ambient-loop exemption; state layers rows + uniform `.97`; press morphs in-card row flavor; type-scale example tidy.
- `vehicle-data`: "Cicli LFP card" references → "Stato veicolo card".

## Impact

- Code: `pages/dashboard/*`, `components/fab/`, shared wavy-progress primitive, `src/styles.scss` cleanups (`.press-tile`, `--d-breathe`, `.hero-glow`); spec deltas for `dashboard`, `activities`, `design-system`, `vehicle-data`.
- No new dependencies; no data/seed/status logic changes (ND-3 unchanged).

## Non-goals

- No hero redesign beyond glow removal; no other pages (Storico/Prodotti/Attività lists unchanged apart from the sheet); no motion-token/state-layer VALUE changes (the ruling-mandated removal of dead tile/glow references and the `--d-breathe` token is in scope); no new dependencies; no data/seed/status logic changes; no return of the ring indicator; no navbar/FAB/sheet-motion changes.
