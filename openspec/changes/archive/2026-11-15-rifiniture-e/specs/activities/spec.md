# activities Specification

## Purpose
Delta for Attività under Rifiniture E: the FAB capture sheet lays out its fields per expected input length (with the half-field fit rule and the mockup footer pair), and the status-filter wording follows the sintesi rows.

## MODIFIED Requirements

### Requirement: FAB bottom-sheet capture form
The FAB (app-shell) SHALL open a full capture form as an M3E bottom sheet per the approved draft FAB block of `ui-drafts/c-cruscotto.html`, opening through the FAB-to-sheet morph of `specs/app-shell` (circle → sheet geometry, 550ms `--e-spring`; close morphs back into the FAB over 450ms `--e-exit`; reduced motion = instant, no morph): drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Nuova registrazione" (15px bold), and the fields rebuilt on the shared MD3 filled-text-field component (same anatomy as the vehicle fields, with the focus motion and dark native `<select>` of `specs/design-system`), laid out in a `grid grid-cols-2 gap-4` sized by expected input length (constant 16px gaps on both axes): the activity selector `col-span-2` (all 11 catalog titles, rendered as a filled field with chevron — long titles need the full width), a row with date (default today) and odometer km (default current) as half-width columns, place `col-span-2` (free text), and a row with cost € and duration h (both optional) as half-width columns. Half-width fields SHALL keep their value in a `flex-1 min-w-0` slot with the trailing suffix `shrink-0` (12px `label` `text-onSurfV`) so long values truncate instead of overflowing. Saving SHALL create the same history entry + `lastDone` update as the quick registra and close the sheet (morph back). "Annulla" SHALL be an M3 text button (no border, `text-onSurfV font-bold`, 14px `text-button` = M3 label-large, auto-width `px-6`); "Registra" stays the filled `bg-prim text-onPrim rounded-full h-12 flex-1` button (15px `button-large`) — the footer pair matches the mockups (Annulla auto-width, Registra `flex-1`; the old equal-width pair is superseded); the sheet carries the dialog accessibility of `specs/app-shell` (`role="dialog"`, focus trap, Escape, focus restored to the FAB); validation unchanged (ISO date + numeric km required). No other capture UI exists.

#### Scenario: FAB form save
- **WHEN** the user selects #6, keeps today / 4.500 km, enters "Garage di casa" and saves
- **THEN** a history entry for #6 is created with those values, #6's `lastDone` becomes today · 4500 km and its status recomputes

#### Scenario: MD3 field anatomy in the sheet
- **WHEN** the user focuses any field of the sheet
- **THEN** that field shows the focus anatomy (brighter container, 2px prim ring scaling in, prim bold label) identical to the vehicle fields

#### Scenario: Sheet morphs both ways
- **WHEN** the user taps the FAB and then "Annulla"
- **THEN** the sheet morphs open from the FAB circle and morphs back into it on close, with the scrim fading in/out

#### Scenario: Field grid sized by expected input length
- **WHEN** the capture sheet renders
- **THEN** Attività and Luogo span both columns while Data + Chilometraggio share one row and Costo + Durata the next (constant 16px gaps on both axes), the fields keep the shared pill anatomy (`h-14`), and the footer, validation and save path are unchanged

#### Scenario: Half-column fields fit at 430px
- **WHEN** a half-column field renders a long value at the 430px frame width (e.g. a large odometer number or the native date control)
- **THEN** the value truncates within its `flex-1 min-w-0` slot, the 12px suffix stays visible and the field never overflows its column

### Requirement: Status filter from Cruscotto rows
The Attività page SHALL accept a `stato` query parameter (`ok` | `in-scadenza` | `scaduto`, set by the sintesi rows of `specs/dashboard`): when present, a dismissible filter chip renders above the category chips (selected style `bg-secC text-onSecC font-bold` with the check inline SVG, label "In regola (N)" / "In scadenza (N)" / "Scadute (N)" computed from the catalog, plus a trailing × button that removes the parameter); the card list SHALL show only activities whose derived status matches, AND-combined with the category filter. Deep links and back navigation SHALL behave identically to row taps.

#### Scenario: Row deep link filters the list
- **WHEN** the user opens `/attivita?stato=scaduto` with the full seed
- **THEN** only the 8 scadute cards are listed and the chip "Scadute (8) ×" is shown above the category chips

#### Scenario: Dismissing the filter
- **WHEN** the user taps the × on the status chip
- **THEN** the parameter is removed and all 11 activities are listed again

## RENAMED Requirements

- FROM: ### Requirement: Status filter from Cruscotto tiles
- TO: ### Requirement: Status filter from Cruscotto rows
