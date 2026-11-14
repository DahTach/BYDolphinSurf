## MODIFIED Requirements

### Requirement: FAB bottom-sheet capture form
The FAB (app-shell) SHALL open a full capture form as an M3E bottom sheet per the approved draft FAB block of `ui-drafts/c-cruscotto.html`: drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Nuova registrazione" (15px bold), and the fields rebuilt on the shared MD3 filled-text-field component (same anatomy as the vehicle fields): activity selector (all 11 catalog titles, rendered as a filled field with chevron), date (default today), odometer km (default current), place, cost € and duration h (both optional). Saving SHALL create the same history entry + `lastDone` update as the quick registra. "Annulla" SHALL be an M3 text button (no border, `text-onSurfV text-sm font-bold`); "Registra" stays the filled `bg-prim text-onPrim rounded-full h-12` button; validation unchanged (ISO date + numeric km required). No other capture UI exists in v1.

#### Scenario: FAB form save
- **WHEN** the user selects #6, keeps today / 4.500 km, enters "Garage di casa" and saves
- **THEN** a history entry for #6 is created with those values, #6's `lastDone` becomes today · 4500 km and its status recomputes

#### Scenario: MD3 field anatomy in the sheet
- **WHEN** the user focuses any field of the sheet
- **THEN** that field shows the focus anatomy (brighter container, 2px prim ring, prim bold label) identical to the vehicle fields

## ADDED Requirements

### Requirement: Status filter from Cruscotto tiles
The Attività page SHALL accept a `stato` query parameter (`ok` | `in-scadenza` | `scaduto`, set by the sintesi tiles of `specs/dashboard`): when present, a dismissible filter chip renders above the category chips (selected style `bg-secC text-onSecC font-bold` with the check inline SVG, label "In regola (N)" / "In scadenza (N)" / "Scadute (N)" computed from the catalog, plus a trailing × button that removes the parameter); the card list SHALL show only activities whose derived status matches, AND-combined with the category filter. Deep links and back navigation SHALL behave identically to tile taps.

#### Scenario: Tile deep link filters the list
- **WHEN** the user opens `/attivita?stato=scaduto` with the full seed
- **THEN** only the 8 scadute cards are listed and the chip "Scadute (8) ×" is shown above the category chips

#### Scenario: Dismissing the filter
- **WHEN** the user taps the × on the status chip
- **THEN** the parameter is removed and all 11 activities are listed again
