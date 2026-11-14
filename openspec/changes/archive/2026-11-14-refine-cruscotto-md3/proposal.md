# Refine Cruscotto MD3

## Why

User review of the shipped v1 flagged the Cruscotto: inputs and FAB form are not proper MD3, the hero card design underwhelms (cookie + giant number + wavy), "In sintesi" is inert, the Prontezza/Cicli cards are not MD3E, the gear button does nothing, and the home screen shows only the next deadline. An approved revision draft exists: `ui-drafts/c-cruscotto.html` (user picked hero B1, queue, tiles, settings sheet, neutral stat cards).

## What Changes

- Shared MD3 filled-text-field component as a rounded pill (rest: `bg-surfHiX rounded-full`; focus: brighter container + 2px prim ring + prim label — no bottom indicator, no squared corners, coherent with the app's rounded language) used by the 3 Cruscotto fields and the FAB-sheet fields.
- Hero "Prossima scadenza" rebuilt per draft B1: container tinted by status (scaduto → errC, in scadenza → waC, future → primC), the car SVG as the centerpiece (h-24, centered), countdown as a "+N g" / "tra N g" badge overlapping the car, no wavy/cookie/display number.
- New "Prossime" queue: the 2 activities after the hero (same priority ordering) as tappable pill rows.
- "In sintesi": three tonal tappable tiles (okC/waC/errC) navigating to Attività with a `stato` query-param filter; Attività gains a dismissible status chip.
- Prontezza + Cicli: neutral surfC cards in 2 columns, refined typography, plain rounded linear MD3 bars (no wavy, no ring).
- Gear button opens a settings sheet: "Ripristina dati iniziali" (inline confirm → store reset to seed), "Consegna e consumo" (jump to the Cruscotto fields), info footer.
- FAB sheet: drag handle, MD3 fields, "Annulla" as an M3 text button.

## Capabilities

### Modified Capabilities

- `dashboard`: hero card, sintesi card, prontezza card, cicli card — all redesigned per draft.
- `vehicle-data`: filled text fields get proper MD3 anatomy/focus states.
- `app-shell`: header gear opens the settings sheet.
- `activities`: FAB bottom-sheet form MD3 polish; new status filter from the sintesi tiles.

### New Capabilities

(none — all changes live in existing capabilities)

## Impact

- Code: `src/app/components/text-field/` (new), `pages/dashboard/*`, `pages/activities/*`, `components/fab/*` (sheet markup), new `components/settings-sheet/`, `data/store.ts` (`resetToSeed()`), `app.routes.ts` (unchanged).
- No new dependencies; bun only; all visuals from `ui-drafts/c-cruscotto.html`.

## Non-goals

- No restyle of Storico/Prodotti/Attività cards beyond the status filter; no theme toggle; no new pages; no data export; no icon library.

RESOLVED by user: hero = B1 (badge on car, car centered, no wavy/cookie/display number); queue = 2 pill rows; sintesi = tiles → filtered Attività; gear = settings sheet with reset + consegna/consumo; stat cards = neutral 2-col with linear bars.
