# design-system Specification

## Purpose
Delta for the design system under Rifiniture F: the Wavy progress indicator (M3E) grows a circular ring form (geometry pinned from `ui-drafts/f-wavy-ring.html`), and the old ring ban is scoped — only the wavy form is legal for circular progress.

## MODIFIED Requirements

### Requirement: Wavy progress indicator (M3E)
Progress MAY be rendered as a wavy M3E indicator — the expressive progress anatomy of `ui-drafts/e2-stat-grid.html` variant B and `ui-drafts/f-wavy-ring.html` — through a reusable primitive available to every screen, in two forms: the linear bar and the circular ring. The linear form stays legal everywhere (it leaves the "Stato veicolo" card of `specs/dashboard`, not the primitive). Both forms share ONE semantics: `pathLength="1000"` SHALL normalize the path; the fill SHALL be carved with the `stroke-dasharray` PAIR `dash gap` = `P 1000` (never a bare dash length) where `P = round(max(value% × 10, 45))` for any value > 0 — the dash is always rounded to an integer so the dash strings stay deterministic (18% → `stroke-dasharray="180 1000"`) — and `P = 0` at exactly 0; the track SHALL render in `surfHiX`; the fill color is set by the usage (`prim`, `onTerC`, …). Wave-head rules: 0% renders EMPTY (no head at all); any value > 0 gets the floor — exactly 45/1000 (`stroke-dasharray="45 1000"`) — so a tiny value stays a living wave head, never an empty track. Cap rule: `P` is capped at 1000 — ≥100% renders the full seamless fill (`stroke-dasharray="1000 1000"`; on the ring the seam hides because the periodic wavy path closes on its start point) and values above 100% (possible for Cicli LFP via the odometer) never exceed it. On activation the fill SHALL animate `stroke-dasharray` from `"0 1000"` to `"P 1000"` over 650ms `--e-spring` (activation only, per the Entrance and data-animation primitives requirement); data edits transition `stroke-dasharray` over `--d-small` (250ms) `--e-emph` and NEVER replay the entrance. Reduced motion shows the final fill immediately.

**Linear form (bar):** track and fill SHALL share ONE canonical sine-wave path copied verbatim from the mockup — `d="M2 6 Q9 -1 16 6 T30 6 T44 6 T58 6 T72 6 T86 6 T100 6 T114 6 T128 6 T142 6 T156 6 T170 6 T184 6 T198 6"` in `viewBox="0 0 200 12"`: midline y=6 starting at x=2 with x-extent 2→198 so the round caps stay inside the viewBox, first bump up (Q control point ±7 off-axis → true curve amplitude 3.5), half-period 14 (wavelength ≈28px); stroked `fill: none`, `stroke-width 4`, `stroke-linecap: round`. The SVG SHALL render `width: 100%`, `height: 12px` (`h-3`) with the default `preserveAspectRatio` (uniform scaling, centered) — exactly as the mockup renders.

**Circular form (ring):** track and fill SHALL share the verified ring geometry of `ui-drafts/f-wavy-ring.html` in `viewBox="0 0 120 120"`: the track is a smooth full `<circle cx="60" cy="60" r="52">` with `stroke-width: 3` (the round caps do not apply to the closed track); the fill is a wavy path around the same circle generated EXACTLY as `radius(θ) = 52 + 3.5 · sin(12θ)` with θ measured CLOCKWISE from 12 o'clock — the oscillation is parameterized by the ANGLE θ, never by arc length; the wave crosses the track radius at 12 o'clock (zero crossing) and its first crest sits OUTWARD (radius 55.5) at ≈6.8px of arc clockwise — giving exactly 12 waves around the full circle (integer wave count so the ring closes seamlessly; wavelength ≈27.2px of arc at r=52). The path SHALL be generated as the mockup's smooth sampled polyline: 20 samples per wave (240 segments around the ring), coordinates rounded to 0.1px, stroked `fill: none`, `stroke-width: 4.5`, `stroke-linecap: round` AND `stroke-linejoin: round` (the round joins absorb the faceting; ≤0.25px geometric deviation from the analytic curve is allowed), starting at 12 o'clock (θ = 0) and sweeping clockwise. The ring SHALL render at the usage's size (exactly 120px × 120px in the Stato veicolo card) with the default `preserveAspectRatio` (uniform scaling, centered).

**Circular-form carve-out:** only the wavy form is legal for circular progress. The old plain ring indicator (the track/progress/dot SVG of `ui-drafts/b-blade.html`, banned by `refine-cruscotto-md3`) MUST NOT be used — that ban targeted the plain ring-with-gap/dot artifact and never the wavy ring, which supersedes it as THE circular progress anatomy.

#### Scenario: Fill carves the wave to the value
- **WHEN** a wavy indicator (bar or ring) renders at 18% with a `prim` fill on a `surfHiX` track
- **THEN** the fill follows the track's CENTERLINE (bar: the canonical sine path; ring: the wavy path oscillating around the track's circle r=52) and its `stroke-dasharray` reads `180 1000` (dash 18% × 10, gap 1000 — the pair, never a bare dash length)

#### Scenario: Minimum wave head for tiny values
- **WHEN** a wavy indicator renders at 0,3%
- **THEN** the dash is floored at exactly 45 (`stroke-dasharray="45 1000"`) and shows a short visible wave head — never an empty track

#### Scenario: Zero value renders empty
- **WHEN** a wavy indicator renders at 0%
- **THEN** the fill renders empty (`stroke-dasharray="0 1000"`) — no wave head

#### Scenario: 100% renders the full seamless ring (`1000 1000`)
- **WHEN** a wavy indicator renders at 100% or more
- **THEN** the dash caps at 1000 (`stroke-dasharray="1000 1000"`) and the fill covers the whole path — on the ring with no seam showing at 12 o'clock, because the periodic wavy path closes on its start point

#### Scenario: Fill entrance on activation
- **WHEN** the hosting pane becomes active
- **THEN** the fill animates `stroke-dasharray` from `"0 1000"` to `"P 1000"` over 650ms `--e-spring` exactly once — the carve growing along the path (bar: from the left end; ring: CLOCKWISE from 12 o'clock) — and with reduced motion the final fill renders immediately

#### Scenario: Data edits transition the dash without replay
- **WHEN** a data edit changes the value of an already-active wavy indicator
- **THEN** `stroke-dasharray` transitions to the new `P 1000` over 250ms `--d-small` `--e-emph` and the entrance does not replay

#### Scenario: Ring geometry closes seamlessly
- **WHEN** the circular form renders (viewBox `0 0 120 120`, track `r=52` stroke 3)
- **THEN** the active wavy path follows `radius(θ) = 52 + 3.5 · sin(12θ)` (θ clockwise from 12 o'clock) — oscillating radially between 48.5 and 55.5 with exactly 12 waves over the full circle, a zero crossing at 12 o'clock and its first crest OUTWARD at ≈6.8px of arc — stroked 4.5 with round caps and joins, sampled at 20 points per wave (240 segments, ≤0.25px deviation from the analytic curve), and the path closes seamlessly at 12 o'clock with no visible seam

#### Scenario: Only the wavy ring is circular progress
- **WHEN** a screen renders circular progress
- **THEN** it is the wavy ring of this requirement — the old plain ring-with-gap/dot indicator stays banned and never renders

### Requirement: Shape and type scale
The app SHALL use one radius scale — pill `rounded-full` (FAB, buttons, chips, fields, rows, navbar), 20px boxes (e.g. the Prodotti MAI box), 24px cards, 28px sheets/large panels, 32px hero — with no drift between pages (e.g. the Prodotti MAI box `rounded-2xl` becomes 20px). The type scale SHALL use named roles covering every mandated size, with no sizes outside these roles: `caption` 10px bold as the single caption system (two documented styles: eyebrow — uppercase, `tracking-[0.14em]`, `mut`; inline — normal case, inherits color), `meta` 11px, `label` 12px (hero label, hero badge, card labels, field suffix), `body-sm` 13px, `body` 14px and `text-button` 14px (M3 label-large), `button-large` 15px and `card-title` 15px, `field` 16px, `title` 22px (hero activity title, sintesi row counts), `display` 26–30px (`font-black`; e.g. in-ring stat values 26px). Section spacing SHALL follow one rhythm: page blocks separated by 24px (`space-y-6`), eyebrow→content 16px (`space-y-4`), sheet inner padding 20px (`px-5`) — no ad-hoc gaps.

#### Scenario: Radius scale is consistent
- **WHEN** boxes, cards, sheets and the hero render on any page
- **THEN** their corner radii are 20px, 24px, 28px and 32px respectively, and the Prodotti MAI box uses 20px instead of `rounded-2xl`

#### Scenario: One caption system
- **WHEN** any caption renders (section captions, field labels, row labels)
- **THEN** it uses the `caption` role (its eyebrow or inline documented style) or the documented per-role size of the scale, with no ad-hoc caption sizes

#### Scenario: No sizes outside the type roles
- **WHEN** any text renders on any page
- **THEN** its size is one of the named roles (10/11/12/13/14/15/16/22/26–30px) — e.g. the "Annulla" text button renders at `text-button` 14px (M3 label-large) while the filled "Registra" renders at `button-large` 15px and the compact card "Registra" at `text-button` 14px — with no ad-hoc sizes

#### Scenario: One spacing rhythm
- **WHEN** page sections, eyebrow labels and sheets lay out
- **THEN** page blocks are 24px apart (`space-y-6`), eyebrow→content is 16px (`space-y-4`) and sheet inner padding is 20px (`px-5`), with no ad-hoc gaps

### Requirement: Entrance and data-animation primitives
Shared animation primitives SHALL be available and SHALL fire only on route/pane activation (never on every change-detection cycle): staggered block entrance (rise 16px + fade, 550ms `--e-emph`, 55ms stagger per sibling), number count-up (`--d-count-up` 700ms, JS cubic ease-out — the documented JS easing exemption) and progress fill (650ms `--e-spring`; progress may render as bars (linear or wavy) or the wavy ring per the Wavy progress indicator (M3E) requirement). Data edits (registrations, field changes) update values, bar widths, ring dash fills and status tints through the existing width/color/`stroke-dasharray` transitions but NEVER replay entrances, count-ups or digit rolls; a hero swap retints the container and snaps the badge text. Reduced motion snaps everything to final state.

#### Scenario: Staggered entrance on activation
- **WHEN** a route becomes active
- **THEN** its blocks rise 16px and fade in, each delayed 55ms after the previous one, and the entrance does not replay on unrelated change-detection cycles

#### Scenario: Count-up on activation
- **WHEN** a pane with `data-count` numbers becomes active
- **THEN** each number animates from 0 to its value in ~700ms and then holds the exact final value

#### Scenario: Data edits do not replay animation
- **WHEN** a value, bar width, ring dash fill or status tint changes after a data edit on the active page
- **THEN** the value updates, the bar or wavy fill animates only its width/dash/color transition and no entrance, count-up or digit roll replays
