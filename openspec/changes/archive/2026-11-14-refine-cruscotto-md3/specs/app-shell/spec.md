## MODIFIED Requirements

### Requirement: App header
The app SHALL render the draft header from `ui-drafts/b-blade.html`: circular 44px avatar with primary-container background and "DS" initials, title "Dolphin Surf" (`text-[22px]` extrabold), badge chip "2025 EU · 43,2 kWh" as an outline pill (`border-outline`, `text-onSurfV`), and a gear icon button (inline SVG per draft) with `aria-label="Impostazioni"` that opens the settings bottom sheet (see the Settings sheet requirement below).

#### Scenario: Header content
- **WHEN** the app loads
- **THEN** the header shows the DS avatar, "Dolphin Surf" title, "2025 EU · 43,2 kWh" chip and the gear button exactly as in `ui-drafts/b-blade.html`

#### Scenario: Gear opens the settings sheet
- **WHEN** the user taps the gear button
- **THEN** the settings bottom sheet opens

## ADDED Requirements

### Requirement: Settings sheet
The gear button SHALL open an M3E bottom sheet per the approved draft settings block of `ui-drafts/c-cruscotto.html`: `bg-surfC rounded-t-[28px] shadow-sheet px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]` (safe-area aware bottom padding) with a drag handle (`w-9 h-1 rounded-full bg-outline mx-auto`), title "Impostazioni" (15px bold), a `bg-black/70` backdrop (tap closes), and the rows: (1) "Ripristina dati iniziali" (sub "Torna al seed di consegna (conferma richiesta)", leading 36px `bg-surfHi` icon circle) — first tap replaces the row with the confirm prompt "Confermi il ripristino?" plus Annulla/Conferma text buttons; Conferma calls `store.resetToSeed()` (overwrite state with the seed store and persist) and closes the sheet; (2) "Consegna e consumo" (sub "Modifica i dati base del veicolo") — closes the sheet and navigates to the Cruscotto vehicle fields (fragment `veicolo`); footer info line "BYD Dolphin Surf · tracker v1 · dati solo sul dispositivo" (11px `text-mut`, top border).

#### Scenario: Reset restores the seed
- **WHEN** the user taps "Ripristina dati iniziali", then "Confermi il ripristino?" → Conferma
- **THEN** the store is replaced with the seed data (odometer 4.500 km, seed activities/history) and persisted to localStorage

#### Scenario: Consegna e consumo jumps to the fields
- **WHEN** the user taps "Consegna e consumo"
- **THEN** the sheet closes and the app shows the Cruscotto scrolled to the vehicle fields
