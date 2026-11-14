## ADDED Requirements

### Requirement: Product reference cards
The Prodotti section SHALL render the two static cards of `ui-drafts/b-blade.html` (`bg-surfC rounded-[24px] p-4`) with verbatim content:
- "Sicuri su EPDM" with chip "<1–2% rigonfiamento" (`bg-okC text-onOkC`); check list: Krytox GPL 205 — lubrificante PFPE inerte, Molykote 111 — pasta PDMS pura, Glicerina pura — grado farmaceutico; MAI box (`bg-errC`, warning inline SVG): "MAI: WD-40, vaselina, spray siliconici";
- "Antiruggine sottoscocca" with chip "70 kV dielettrico" (`bg-terC text-onTerC`); check list: Lanoguard — lanolina senza solventi, Dinitrol 3125 / 4941 — cera sintetica elastica; MAI box: "MAI su dischi freno, connettori AT, piastra batteria".
Check icons and warning triangles SHALL be the draft's inline SVGs; the content SHALL be static component data, not persisted in the store.

#### Scenario: MAI warnings always visible
- **WHEN** the Prodotti section renders
- **THEN** both cards show their MAI warning box exactly as in `ui-drafts/b-blade.html`

#### Scenario: Products are read-only static content
- **WHEN** the user browses Prodotti
- **THEN** no card is editable, none is stored in localStorage, and no registra action exists in this section
