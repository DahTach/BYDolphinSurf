# activities Specification

## Purpose
Delta for the Attività section under the M3E Morfosi change: unified status-chip component usage, card/row press morphs and entrance stagger, the empty filtered state with "Cancella filtro", and FAB sheet morph integration.

## MODIFIED Requirements

### Requirement: Status chip rendering
Each activity card SHALL render the status chip through the shared status-chip component of `specs/design-system` — one component, one `variant × status` color map (`variant` API `card` | `hero` | `badge`; the `badge` variant owns the digit-strip DOM). Card variant (on `bg-surfC` cards, tonal, per `ui-drafts/b-blade.html` activity cards): "Scaduto" `bg-errC text-onErrC`, "OK" `bg-okC text-onOkC`, "In scadenza" `bg-waC text-onWaC`. Hero variant (on the tinted hero container, `specs/dashboard`): contrasting fills with ≥3:1 contrast against the container — `bg-err text-onErr` on `errC`, `bg-onWaC text-waC` on `waC`, `bg-onOkC text-okC` on `primC`; the countdown badge (`badge` variant) uses the same map fills as the hero chip. Both: rounded-full pill, with sizing owned by the shared component (per `ui-drafts/d2-morfosi.html`: card 10px, hero 11px, badge 12px extrabold) — the component owns colors AND sizing; pages must not override either.

#### Scenario: Chip colors per status
- **WHEN** activities #5, #9 and #10 are scaduto, ok and in scadenza
- **THEN** their cards use the errC, okC and waC chip variants respectively, as in the draft activity cards

#### Scenario: Hero chip variant
- **WHEN** the hero card features the scaduto #5
- **THEN** its chip uses the solid `bg-err text-onErr` hero variant, as in the draft hero card

#### Scenario: Hero chip on a waC container is visible
- **WHEN** the hero card features an in-scadenza activity on the `bg-waC` container
- **THEN** the hero chip renders `bg-onWaC text-waC` (≥3:1 contrast against the container) instead of the old invisible `bg-waC` fill

### Requirement: Activity card layout and Registra action
Each activity SHALL render as the draft card (`bg-surfC rounded-[24px] p-4`): id + title row, interval line, spec line, status chip, divider, last/next info line ("Ultimo: 09/10/2026 · 4.100 km" when done before, "Prossimo: 08/2027 · 40.000 km" when due ahead — Italian format per `data/format.ts`), and the "Registra" pill button (`bg-secC text-onSecC h-9 rounded-full`, 14px `text-button`). The card title renders at 15px (`card-title` role). Cards SHALL carry the shared state layers and the press shape morph (24px → 16px + `scale(.97)`, spring back on release, `specs/design-system`), and the card list SHALL enter with the staggered entrance (rise 16px + fade, 55ms stagger) on page/filter activation only — data edits MUST NOT replay the entrance (per `specs/design-system`).

#### Scenario: Registra updates activity and history
- **WHEN** the user taps "Registra" on the #5 card
- **THEN** a history entry for #5 (today, current odometer) is created immediately — one-tap quick registra, no form (behavior per `specs/activities`) — #5's `lastDone` updates and its status recomputes

#### Scenario: Card press morph
- **WHEN** the user presses an activity card
- **THEN** its radius eases 24px → 16px while it scales to .97, springing back on release

#### Scenario: List entrance on filter change
- **WHEN** the user switches the category filter
- **THEN** the visible cards stagger back in 55ms apart (no animation replays on unrelated change detection)

### Requirement: FAB bottom-sheet capture form
The FAB (app-shell) SHALL open a full capture form as an M3E bottom sheet per the approved draft FAB block of `ui-drafts/c-cruscotto.html`, opening through the FAB-to-sheet morph of `specs/app-shell` (circle → sheet geometry, 550ms `--e-spring`; close morphs back into the FAB over 450ms `--e-exit`; reduced motion = instant, no morph): drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Nuova registrazione" (15px bold), and the fields rebuilt on the shared MD3 filled-text-field component (same anatomy as the vehicle fields, with the focus motion and dark native `<select>` of `specs/design-system`): activity selector (all 11 catalog titles, rendered as a filled field with chevron), date (default today), odometer km (default current), place, cost € and duration h (both optional). Saving SHALL create the same history entry + `lastDone` update as the quick registra and close the sheet (morph back). "Annulla" SHALL be an M3 text button (no border, `text-onSurfV font-bold`, 14px `text-button` = M3 label-large); "Registra" stays the filled `bg-prim text-onPrim rounded-full h-12` button (15px `button-large`); the sheet carries the dialog accessibility of `specs/app-shell` (`role="dialog"`, focus trap, Escape, focus restored to the FAB); validation unchanged (ISO date + numeric km required). No other capture UI exists.

#### Scenario: FAB form save
- **WHEN** the user selects #6, keeps today / 4.500 km, enters "Garage di casa" and saves
- **THEN** a history entry for #6 is created with those values, #6's `lastDone` becomes today · 4500 km and its status recomputes

#### Scenario: MD3 field anatomy in the sheet
- **WHEN** the user focuses any field of the sheet
- **THEN** that field shows the focus anatomy (brighter container, 2px prim ring scaling in, prim bold label) identical to the vehicle fields

#### Scenario: Sheet morphs both ways
- **WHEN** the user taps the FAB and then "Annulla"
- **THEN** the sheet morphs open from the FAB circle and morphs back into it on close, with the scrim fading in/out

## ADDED Requirements

### Requirement: Empty filtered state
When the category and status filters combine to zero visible activities, the list SHALL render a friendly Italian empty state (e.g. "Nessuna attività corrisponde ai filtri") with a "Cancella filtro" action button (shared button anatomy) that clears the `stato` query parameter and resets the category filter to "Tutte", restoring the full list. Empty states MUST NOT render as a blank gap.

#### Scenario: Zero results show the empty state
- **WHEN** the user selects "Fluidi officina" while `stato=scaduto` filters the list to 0 activities
- **THEN** a friendly Italian empty state with the "Cancella filtro" button is shown instead of an empty list

#### Scenario: Cancella filtro restores the list
- **WHEN** the user taps "Cancella filtro"
- **THEN** the `stato` parameter is removed, the category resets to "Tutte" and all 11 activities are listed again
