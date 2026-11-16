# design-system Specification

## Purpose
Shared Material 3 Expressive design language: motion tokens and easings, reduced-motion behavior, interactive state layers, shape and type scale, press shape morphs, and the anatomy of buttons, status chips, text fields and empty states. All page requirements reference these primitives.

## Requirements


### Requirement: Motion tokens and easing scale
`src/styles.scss` SHALL define the motion foundation as CSS custom properties: `--e-emph: cubic-bezier(0.2,0,0,1)` (entrances, hovers — never opens), `--e-spring: cubic-bezier(0.34,1.4,0.64,1)` (overshoot ≈3% then settle: opens, radius morphs, badges, bars, the navbar indicator) and `--e-exit: cubic-bezier(0.3,0,1,1)` (closes). Every used duration SHALL be a named `--d-*` token of one scale: press 140ms, small 250ms, fade 350ms, medium 400ms, exit-flight 450ms, ripple 500ms, large 550–650ms (morph open 550ms, entrance rises and badge spring 550ms, digit rolls and the hero corner morph 600ms, progress fills 650ms), count-up 700ms. Delays are named tokens too (entrance stagger 55ms, sheet content fade delay 150ms). One documented exemption from the CSS token rule: JS-driven easing curves (the count-up's cubic ease-out) are documented in `design.md` and live in JS, not in component CSS. Asymmetric timing is the norm: open = 550ms `--e-spring`, close = 450ms `--e-exit` — the close/exit flight uses the exit-flight duration, NOT the large band. Animations SHALL target `transform`/`opacity` (plus explicitly-listed geometry properties for morphs) to stay compositor-friendly.

#### Scenario: Named duration tokens only
- **WHEN** any animated element renders (press, open, close, entrance, roll, ripple)
- **THEN** its transition/animation uses `--e-emph`, `--e-spring` or `--e-exit` with a named duration token of the scale, and no ad-hoc easing or duration values appear in components (JS easing curves documented in `design.md` are exempt)

### Requirement: Reduced-motion behavior
The app SHALL honor `@media (prefers-reduced-motion: reduce)` with a single outcome everywhere — instant snap: a global rule clamps ALL animation and transition durations and delays to `.01ms` so elements render at their final states immediately, and JS-driven motion (count-ups, digit rolls, staggers, morph delays, ripple/navigation delays) SHALL be skipped via a `matchMedia` gate (values jump to target, delays become 0). Sheets (FAB and settings) open and close instantly. There are NO fallback motions — no plain slide-up, no plain fade.

#### Scenario: Reduced motion snaps to final states
- **WHEN** the app runs with `prefers-reduced-motion: reduce` and a page with entrances, count-ups and bars is activated
- **THEN** every block is at its final position/opacity immediately, numbers show their final values, progress fills show their final state (linear width or wavy dash), and no stagger or digit roll occurs

#### Scenario: Reduced motion opens sheets instantly
- **WHEN** the FAB or the gear button is activated with `prefers-reduced-motion: reduce`
- **THEN** the sheet renders instantly in its final open position (no morph, slide or fade) and closes instantly

### Requirement: Interactive state layers
Every interactive element — navbar items, the FAB, filled/text/icon buttons, category filter chips, the dismissible `stato` chip and its × button, sintesi rows, queue rows, activity cards, settings-sheet rows and text fields — SHALL render a shared press state layer: a `white` overlay at `border-radius: inherit` with `opacity .06` on hover, `opacity .10` plus `scale(.97)` (140ms `--e-emph`) while pressed, and `focus-visible` a 2px `prim` outline with 2px offset (250ms `--e-spring` wherever the ring animates). Settings-sheet rows SHALL use a pill base radius (`rounded-full`) so their state layer and radius morph have a shape. Elements that are NOT interactive — history rows and product cards (per `openspec/specs/history/spec.md`, rows SHALL NOT be interactive in v1) — MUST NOT render press feedback of any kind. Every interactive control SHALL expose a ≥44px hit area (achieved with padding or a pseudo-element; the visible footprint may be smaller for chips and the × button). Native tap highlight SHALL be disabled. Every interactive element presses at `scale(.97)` — no `scale-95/0.98/0.99` drift; the in-card row press morph of Press shape morphs is a radius morph only.

#### Scenario: Press feedback on a settings row
- **WHEN** the user presses a settings-sheet row
- **THEN** the row shows the white overlay at `opacity .10` and scales to `.97` on its `rounded-full` pill shape, and releases back with the same 140ms timing as every other element

#### Scenario: Keyboard focus ring
- **WHEN** any interactive element receives keyboard focus
- **THEN** it shows a 2px `prim` ring with 2px offset (`focus-visible`), never a browser-default outline

#### Scenario: Non-interactive rows stay inert
- **WHEN** the user presses a Storico history row or a Prodotti card
- **THEN** no state layer, press scale or radius morph appears (they are non-interactive by spec)

#### Scenario: Tap targets
- **WHEN** any interactive control renders (including chips and the dismissible × )
- **THEN** its hit area measures at least 44×44px even where the visible footprint is smaller

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

### Requirement: Press shape morphs
Row-shaped and card-shaped interactive elements SHALL morph their corner radius while pressed — rows `rounded-full` → 22px (queue rows, settings-sheet rows), cards 24px → 16px (activity cards), in-card list rows square → 16px (the sintesi rows of `specs/dashboard`, mirroring `.press-row` of `ui-drafts/e-rifiniture.html`) — easing back on release; the radius transition uses 250ms `--e-spring` while the press scale stays on the 140ms `--e-emph` layer (two speeds on one element, per `ui-drafts/d2-morfosi.html`). Non-interactive rows/cards (history rows, product cards) morph nothing.

#### Scenario: Queue row press morph
- **WHEN** the user presses a Prossime queue row
- **THEN** its radius eases from pill to 22px (250ms spring) while the row scales to `.97`, and both spring back on release

#### Scenario: Settings row press morph
- **WHEN** the user presses a settings-sheet row
- **THEN** its pill radius eases toward 22px (250ms spring) under the `.97` press scale, springing back on release

#### Scenario: In-card row press morph
- **WHEN** the user presses a sintesi list row inside its clipped card
- **THEN** the square row eases toward `rounded-[16px]` (250ms `--e-spring`) under the uniform `scale(.97)` press layer — a radius morph only — and springs back on release

### Requirement: FAB press shape morph
While the FAB is pressed it SHALL morph from its circular shape toward a squircle (rounded-square) via its `border-radius` (250ms `--e-spring`) on top of the standard `scale(.97)` press layer, and spring back to the circle on release.

#### Scenario: FAB press morph
- **WHEN** the user holds the FAB
- **THEN** the circle eases to a squircle shape and, on release, springs back to the 56px circle

### Requirement: Button anatomy
Buttons SHALL come in three variants, all with state layers, press feedback and ≥44px hit areas: filled large (`rounded-full h-12`, `button-large` 15px bold, e.g. `bg-prim text-onPrim` — spans the full width for standalone CTAs, takes `flex-1` beside a text button in sheet footers) and filled compact (`rounded-full h-9 px-4`, `text-button` 14px bold, e.g. the card "Registra") — text button (no border, no fill, `text-button` 14px = M3 label-large, e.g. "Annulla" `text-onSurfV font-bold`, auto-width `px-6` in sheet footers) and icon button (40px circle). All use `scale(.97)` press and the `focus-visible` ring.


#### Scenario: Text button has no border
- **WHEN** the "Annulla" button renders in a sheet
- **THEN** it shows no border and no fill, only its 14px `text-button` label with the shared press layer

#### Scenario: Sheet footer button pair
- **WHEN** a bottom sheet renders its footer actions
- **THEN** "Annulla" is an auto-width text button (`px-6`) and "Registra" is the filled large button taking `flex-1` — never an equal-width pair

### Requirement: Status chip anatomy and contrast rule
Status pills — header status chips, card status chips and the hero countdown badge — SHALL come from ONE shared status-chip component with one `variant × status` color map (`variant` API: `card` | `hero` | `badge`; the `badge` variant owns the digit-strip DOM). One component, one color map — no per-page copies of the pill markup or the fill map. The map: `card` (on `surfC` cards, tonal) — `ok` `bg-okC text-onOkC`, `in-scadenza` `bg-waC text-onWaC`, `scaduto` `bg-errC text-onErrC`; `hero` and `badge` (on the tinted hero container) — `ok` `bg-onOkC text-okC`, `in-scadenza` `bg-onWaC text-waC`, `scaduto` `bg-err text-onErr`. Hero/badge pills sit on tinted hero containers and MUST achieve ≥3:1 fill contrast against that container. A chip whose fill equals its container's fill MUST NOT be rendered.

#### Scenario: In-scadenza hero chip is visible
- **WHEN** the hero container is `bg-waC` (in-scadenza)
- **THEN** its status chip and countdown badge use `bg-onWaC text-waC` (≥3:1 against the container), never `bg-waC` on `bg-waC`

#### Scenario: Card chips stay tonal
- **WHEN** an activity card on `bg-surfC` renders its status chip
- **THEN** the chip uses the tonal card-variant fill (e.g. `bg-errC text-onErrC`) as in the approved draft cards

#### Scenario: Badge shares the hero map
- **WHEN** the hero renders its countdown badge on the tinted container
- **THEN** the badge uses the same map fill as the hero chip for its status (`ok` `bg-onOkC text-okC`, `in-scadenza` `bg-onWaC text-waC`, `scaduto` `bg-err text-onErr`), never a fill equal to the container and never `bg-prim text-onPrim`

### Requirement: Text field focus motion and dark selects
The shared pill text field SHALL keep its approved anatomy (rest `bg-surfHiX rounded-full`, focus-within `bg-surfHi` + 2px `prim` ring, floating label 10px semibold `text-onSurfV` → bold `text-prim`) and add focus motion: the ring scales in from 1.06 to 1 over 250ms `--e-spring`, the container background transitions over 250ms `--e-emph` and the label color over 250ms. Native `<select>` elements rendered inside fields SHALL display dark (via the global `color-scheme: dark`), with no custom dropdown library. Field styling SHALL use theme tokens only (no hardcoded colors).

#### Scenario: Focus ring animates in
- **WHEN** a text field receives focus
- **THEN** its 2px `prim` ring scales from 1.06 to 1 with the 250ms `--e-spring` timing while the label turns bold `text-prim`

#### Scenario: Native select renders dark
- **WHEN** the activity selector field opens its native `<select>` popup
- **THEN** the control and popup render with the dark scheme (no light-gray OS default), with no custom dropdown implementation

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
### Requirement: Empty-state anatomy
Empty states SHALL render a friendly Italian caption (10px caption system or 13px body, `text-mut`) with an optional action button (shared button anatomy) instead of blank space; hidden/empty sections MUST NOT render as bare gaps.

#### Scenario: Empty state renders content
- **WHEN** a list or section has nothing to show
- **THEN** a graceful Italian caption (and an action where one exists, e.g. "Cancella filtro") is rendered instead of nothing

### Requirement: Token hygiene
Literal `#hex` and `rgba()` colors SHALL be banned in `src/` except for exactly four whitelisted cases: (a) token definitions in the `styles.scss` `@theme`/`:root` blocks, (b) Tailwind built-in `black`/`white` used with alpha as overlays/state layers (`bg-white/[0.06]`, `bg-black/70`), (c) derived-alpha variables of existing tokens, and (d) the `<meta name="theme-color">` value in `src/index.html` (which MUST equal the `surf` token value). All other colors SHALL resolve through `@theme` tokens. The cleanup SHALL cover: the car SVG body/accent hexes in `pages/dashboard/dashboard.ts`, the wheel hex `#2c130c` in `pages/dashboard/dashboard.html:39-40`, the body background/color `#000000`/`#eae4e2` and `::selection`'s `rgba(227,168,155,0.3)` in `src/styles.scss` (`::selection` becomes a derived-alpha variable of an existing token), and the frame's `bg-black` in `src/app/app.html:2` (→ `bg-surf`). Dividers and overlays SHALL use consistent token values. The empty `src/app/app.scss` SHALL be deleted together with its `styleUrl` reference (global styles live in `styles.scss`), and no zero-byte style file may remain referenced. Car-art colors are covered by the `carBody`/`carBodyErr`, `carAccent`/`carAccentErr` and `carWheel` extension tokens of `specs/app-shell` (the only authorized palette extension).

#### Scenario: No hardcoded component colors
- **WHEN** the dashboard renders the hero car SVG
- **THEN** its body, accent and wheel fills resolve through the `carBody`/`carBodyErr`, `carAccent`/`carAccentErr` and `carWheel` theme tokens, and no raw `#rrggbb`/`rgba()` literal remains in `src/` outside the four whitelisted cases (token definitions, alpha `black`/`white` overlays/state layers, derived-alpha vars, the `theme-color` meta value equal to `surf`)

#### Scenario: Empty style file removed
- **WHEN** the project builds
- **THEN** `app.scss` no longer exists as an empty referenced file (deleted with its `styleUrl`, or legitimately used)

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

