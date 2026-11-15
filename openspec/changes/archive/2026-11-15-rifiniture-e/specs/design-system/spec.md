# design-system Specification

## Purpose
Shared Material 3 Expressive design language: motion tokens and easings, reduced-motion behavior, interactive state layers, shape and type scale, press shape morphs, and the anatomy of buttons, status chips, text fields and empty states. All page requirements reference these primitives. Delta under Rifiniture E: the reusable Onda M3E wavy progress, linear-or-wavy bar wording, reduced-motion cleanup, the breathe-token and ambient-loop exemption removal, the uniform `.97` press scale and the in-card row press morph.

## ADDED Requirements

### Requirement: Wavy progress indicator (M3E)
Progress MAY be rendered as a wavy M3E indicator — the expressive progress anatomy of `ui-drafts/e2-stat-grid.html` variant B — through a reusable primitive available to every screen. Track and fill SHALL share ONE canonical sine-wave path copied verbatim from the mockup — `d="M2 6 Q9 -1 16 6 T30 6 T44 6 T58 6 T72 6 T86 6 T100 6 T114 6 T128 6 T142 6 T156 6 T170 6 T184 6 T198 6"` in `viewBox="0 0 200 12"`: midline y=6 starting at x=2 with x-extent 2→198 so the round caps stay inside the viewBox, first bump up (Q control point ±7 off-axis → true curve amplitude 3.5), half-period 14 (wavelength ≈28px); stroked `fill: none`, `stroke-width 4`, `stroke-linecap: round`. The SVG SHALL render `width: 100%`, `height: 12px` (`h-3`) with the default `preserveAspectRatio` (uniform scaling, centered) — exactly as the mockup renders. `pathLength="1000"` SHALL normalize the path; the fill SHALL be carved with the `stroke-dasharray` PAIR `dash gap` = `P 1000` (never a bare dash length) where `P = value% × 10` (18% → `stroke-dasharray="180 1000"`). The track SHALL render in `surfHiX`; the fill color is set by the usage (`prim`, `onTerC`, …). Wave-head rules: 0% renders EMPTY (no head at all); any value > 0 gets `P = max(value% × 10, 45)` — the floor is exactly 45/1000 (`stroke-dasharray="45 1000"`) so the 0,3% bar stays a living wave head, never an empty track. On activation the fill SHALL animate `stroke-dasharray` from `"0 1000"` to `"P 1000"` over 650ms `--e-spring` (activation only, per the Entrance and data-animation primitives requirement); data edits transition `stroke-dasharray` over `--d-small` (250ms) `--e-emph` and NEVER replay the entrance. Reduced motion shows the final fill immediately.

#### Scenario: Fill carves the wave to the value
- **WHEN** a wavy indicator renders at 18% with a `prim` fill on a `surfHiX` track
- **THEN** the fill path shares the track geometry and its `stroke-dasharray` reads `180 1000` (dash 18% × 10, gap 1000 — the pair, never a bare dash length)

#### Scenario: Minimum wave head for tiny values
- **WHEN** a wavy indicator renders at 0,3%
- **THEN** the dash is floored at exactly 45 (`stroke-dasharray="45 1000"`) and shows a short visible wave head — never an empty track

#### Scenario: Zero value renders empty
- **WHEN** a wavy indicator renders at 0%
- **THEN** the fill renders empty (`stroke-dasharray="0 1000"`) — no wave head

#### Scenario: Fill entrance on activation
- **WHEN** the hosting pane becomes active
- **THEN** the fill animates `stroke-dasharray` from `"0 1000"` to `"P 1000"` over 650ms `--e-spring` exactly once, and with reduced motion the final fill renders immediately

#### Scenario: Data edits transition the dash without replay
- **WHEN** a data edit changes the value of an already-active wavy indicator
- **THEN** `stroke-dasharray` transitions to the new `P 1000` over 250ms `--d-small` `--e-emph` and the entrance does not replay

## MODIFIED Requirements

### Requirement: Motion tokens and easing scale
`src/styles.scss` SHALL define the motion foundation as CSS custom properties: `--e-emph: cubic-bezier(0.2,0,0,1)` (entrances, hovers — never opens), `--e-spring: cubic-bezier(0.34,1.4,0.64,1)` (overshoot ≈3% then settle: opens, radius morphs, badges, bars, the navbar indicator) and `--e-exit: cubic-bezier(0.3,0,1,1)` (closes). Every used duration SHALL be a named `--d-*` token of one scale: press 140ms, small 250ms, fade 350ms, medium 400ms, exit-flight 450ms, ripple 500ms, large 550–650ms (morph open 550ms, entrance rises and badge spring 550ms, digit rolls and the hero corner morph 600ms, progress fills 650ms), count-up 700ms. Delays are named tokens too (entrance stagger 55ms, sheet content fade delay 150ms). One documented exemption from the CSS token rule: JS-driven easing curves (the count-up's cubic ease-out) are documented in `design.md` and live in JS, not in component CSS. Asymmetric timing is the norm: open = 550ms `--e-spring`, close = 450ms `--e-exit` — the close/exit flight uses the exit-flight duration, NOT the large band. Animations SHALL target `transform`/`opacity` (plus explicitly-listed geometry properties for morphs) to stay compositor-friendly.

#### Scenario: Named duration tokens only
- **WHEN** any animated element renders (press, open, close, entrance, roll, ripple)
- **THEN** its transition/animation uses `--e-emph`, `--e-spring` or `--e-exit` with a named duration token of the scale, and no ad-hoc easing or duration values appear in components (JS easing curves documented in `design.md` are exempt)

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
The app SHALL use one radius scale — pill `rounded-full` (FAB, buttons, chips, fields, rows, navbar), 20px boxes (e.g. the Prodotti MAI box), 24px cards, 28px sheets/large panels, 32px hero — with no drift between pages (e.g. the Prodotti MAI box `rounded-2xl` becomes 20px). The type scale SHALL use named roles covering every mandated size, with no sizes outside these roles: `caption` 10px bold as the single caption system (two documented styles: eyebrow — uppercase, `tracking-[0.14em]`, `mut`; inline — normal case, inherits color), `meta` 11px, `label` 12px (hero label, hero badge, card labels, field suffix), `body-sm` 13px, `body` 14px and `text-button` 14px (M3 label-large), `button-large` 15px and `card-title` 15px, `field` 16px, `title` 22px (hero activity title, sintesi row counts), `display` 26–30px (`font-black`; e.g. stat values 30px). Section spacing SHALL follow one rhythm: page blocks separated by 24px (`space-y-6`), eyebrow→content 16px (`space-y-4`), sheet inner padding 20px (`px-5`) — no ad-hoc gaps.

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

### Requirement: Entrance and data-animation primitives
Shared animation primitives SHALL be available and SHALL fire only on route/pane activation (never on every change-detection cycle): staggered block entrance (rise 16px + fade, 550ms `--e-emph`, 55ms stagger per sibling), number count-up (`--d-count-up` 700ms, JS cubic ease-out — the documented JS easing exemption) and progress fill (650ms `--e-spring`; bars may be linear — 0 → target width — or wavy per the Wavy progress indicator (M3E) requirement). Data edits (registrations, field changes) update values, bar widths and status tints through the existing width/color transitions but NEVER replay entrances, count-ups or digit rolls; a hero swap retints the container and snaps the badge text. Reduced motion snaps everything to final state.

#### Scenario: Staggered entrance on activation
- **WHEN** a route becomes active
- **THEN** its blocks rise 16px and fade in, each delayed 55ms after the previous one, and the entrance does not replay on unrelated change-detection cycles

#### Scenario: Count-up on activation
- **WHEN** a pane with `data-count` numbers becomes active
- **THEN** each number animates from 0 to its value in ~700ms and then holds the exact final value

#### Scenario: Data edits do not replay animation
- **WHEN** a value, bar width or status tint changes after a data edit on the active page
- **THEN** the value updates, the bar or wavy fill animates only its width/dash/color transition and no entrance, count-up or digit roll replays

### Requirement: Button anatomy
Buttons SHALL come in three variants, all with state layers, press feedback and ≥44px hit areas: filled large (`rounded-full h-12`, `button-large` 15px bold, e.g. `bg-prim text-onPrim` — spans the full width for standalone CTAs, takes `flex-1` beside a text button in sheet footers) and filled compact (`rounded-full h-9 px-4`, `text-button` 14px bold, e.g. the card "Registra") — text button (no border, no fill, `text-button` 14px = M3 label-large, e.g. "Annulla" `text-onSurfV font-bold`, auto-width `px-6` in sheet footers) and icon button (40px circle). All use `scale(.97)` press and the `focus-visible` ring.

#### Scenario: Sheet footer button pair
- **WHEN** a bottom sheet renders its footer actions
- **THEN** "Annulla" is an auto-width text button (`px-6`) and "Registra" is the filled large button taking `flex-1` — never an equal-width pair

### Requirement: Reduced-motion behavior
The app SHALL honor `@media (prefers-reduced-motion: reduce)` with a single outcome everywhere — instant snap: a global rule clamps ALL animation and transition durations and delays to `.01ms` so elements render at their final states immediately, and JS-driven motion (count-ups, digit rolls, staggers, morph delays, ripple/navigation delays) SHALL be skipped via a `matchMedia` gate (values jump to target, delays become 0). Sheets (FAB and settings) open and close instantly. There are NO fallback motions — no plain slide-up, no plain fade.

#### Scenario: Reduced motion snaps to final states
- **WHEN** the app runs with `prefers-reduced-motion: reduce` and a page with entrances, count-ups and bars is activated
- **THEN** every block is at its final position/opacity immediately, numbers show their final values, progress fills show their final state (linear width or wavy dash), and no stagger or digit roll occurs

#### Scenario: Reduced motion opens sheets instantly
- **WHEN** the FAB or the gear button is activated with `prefers-reduced-motion: reduce`
- **THEN** the sheet renders instantly in its final open position (no morph, slide or fade) and closes instantly
