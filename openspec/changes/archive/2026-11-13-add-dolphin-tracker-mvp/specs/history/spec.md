## ADDED Requirements

### Requirement: History entry model
A history entry SHALL contain: `id`, optional `activityId`, `title`, `date` (ISO `yyyy-mm-dd`), `odometerKm`, `place`, optional `durationHours`, optional `costEur` — the fields visible in the draft rows ("Garage di casa — 2 h", "Officina Corsi — 80 €", `ui-drafts/b-blade.html`), per `design.md` D4.

#### Scenario: Entry captures draft fields
- **WHEN** a registra action completes for #2 at "Officina Corsi" for 80 €
- **THEN** the stored entry has title "Antiruggine sottoscocca", today's date, the current odometer, place, and cost 80 €

### Requirement: Storico list as pill rows
The Storico section SHALL render entries as the draft pill rows of `ui-drafts/b-blade.html` (`rounded-full bg-surfC pl-2 pr-4 py-1.5`): leading 44px circle (`bg-surfHi`) with the calendar inline SVG, title (`text-[14px] font-semibold`, truncated), meta line "`date · place — duration/cost`" (`text-[11px] text-mut`), trailing km chip (`bg-secC text-onSecC` pill, Italian format). Rows SHALL be ordered most recent first. Rows SHALL NOT be interactive in v1 (resolved ND-5: no row-tap; edits happen through the registra flow and the FAB form).

#### Scenario: Seeded history renders verbatim
- **WHEN** the Storico section renders with the seed
- **THEN** the three draft entries appear most recent first: "Bilanciamento LFP 100%" · 09/10/2026 · Garage di casa — 2 h · chip "4.100 km"; "Antiruggine sottoscocca" · 20/08/2025 · Officina Corsi — 80 € · chip "300 km"; "Consegna veicolo + PDI" · 08/08/2025 · BYD Store Milano — 0 € · chip "15 km"

#### Scenario: New registration appears on top
- **WHEN** the user registers an activity today
- **THEN** the new entry appears first in the Storico list with the current odometer in its km chip

### Requirement: Seed history entries
The store SHALL seed exactly the three history entries of `ui-drafts/b-blade.html`: LFP balance 09/10/2026 (Garage di casa, 2 h, 4.100 km), antiruggine 20/08/2025 (Officina Corsi, 80 €, 300 km), consegna+PDI 08/08/2025 (BYD Store Milano, 0 €, 15 km). No additional entries, no editing or deleting of entries in v1 (YAGNI).

#### Scenario: Seed matches draft count
- **WHEN** the app runs on first load
- **THEN** `history` contains exactly 3 entries with the dates, places, costs and km above
