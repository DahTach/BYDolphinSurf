# design-system Specification

## Purpose
Shared Material 3 Expressive design language: motion tokens and easings, reduced-motion behavior, interactive state layers, shape and type scale, press shape morphs, and the anatomy of buttons, status chips, text fields and empty states. All page requirements reference these primitives.

## ADDED Requirements

### Requirement: Motion tokens and easing scale
`src/styles.scss` SHALL define the motion foundation as CSS custom properties: `--e-emph: cubic-bezier(0.2,0,0,1)` (entrances, hovers — never opens), `--e-spring: cubic-bezier(0.34,1.4,0.64,1)` (overshoot ≈3% then settle: opens, radius morphs, badges, bars, the navbar indicator) and `--e-exit: cubic-bezier(0.3,0,1,1)` (closes). Every used duration SHALL be a named `--d-*` token of one scale: press 140ms, small 250ms, fade 350ms, medium 400ms, exit-flight 450ms, ripple 500ms, large 550–650ms (morph open 550ms, entrance rises and badge spring 550ms, digit rolls and the hero corner morph 600ms, bar fills 650ms), count-up 700ms, breathe 6000ms (ambient loops, e.g. the hero glow). Delays are named tokens too (entrance stagger 55ms, sheet content fade delay 150ms). Two documented exemptions from the CSS token rule: ambient loops may only use `--d-breathe` with `ease-in-out`, and JS-driven easing curves (the count-up's cubic ease-out) are documented in `design.md` and live in JS, not in component CSS. Asymmetric timing is the norm: open = 550ms `--e-spring`, close = 450ms `--e-exit` — the close/exit flight uses the exit-flight duration, NOT the large band. Animations SHALL target `transform`/`opacity` (plus explicitly-listed geometry properties for morphs) to stay compositor-friendly.

#### Scenario: Named duration tokens only
- **WHEN** any animated element renders (press, open, close, entrance, roll, ripple)
- **THEN** its transition/animation uses `--e-emph`, `--e-spring` or `--e-exit` with a named duration token of the scale (ambient loops use `--d-breathe`), and no ad-hoc easing or duration values appear in components (JS easing curves documented in `design.md` are exempt)

### Requirement: Reduced-motion behavior
The app SHALL honor `@media (prefers-reduced-motion: reduce)` with a single outcome everywhere — instant snap: a global rule clamps ALL animation and transition durations and delays to `.01ms` so elements render at their final states immediately, and JS-driven motion (count-ups, digit rolls, staggers, morph delays, ripple/navigation delays) SHALL be skipped via a `matchMedia` gate (values jump to target, delays become 0). Sheets (FAB and settings) open and close instantly. There are NO fallback motions — no plain slide-up, no plain fade. The hero ambient glow remains visible at a static opacity of `.55`.

#### Scenario: Reduced motion snaps to final states
- **WHEN** the app runs with `prefers-reduced-motion: reduce` and a page with entrances, count-ups and bars is activated
- **THEN** every block is at its final position/opacity immediately, numbers show their final values, bars show their final widths, and no stagger or digit roll occurs

#### Scenario: Reduced motion opens sheets instantly
- **WHEN** the FAB or the gear button is activated with `prefers-reduced-motion: reduce`
- **THEN** the sheet renders instantly in its final open position (no morph, slide or fade) and closes instantly

#### Scenario: Reduced motion keeps the glow
- **WHEN** the hero renders with `prefers-reduced-motion: reduce`
- **THEN** the ambient glow is visible and static at opacity `.55` (no breathing)

### Requirement: Interactive state layers
Every interactive element — navbar items, the FAB, filled/text/icon buttons, category filter chips, the dismissible `stato` chip and its × button, sintesi tiles, queue rows, activity cards, settings-sheet rows and text fields — SHALL render a shared press state layer: a `white` overlay at `border-radius: inherit` with `opacity .06` on hover, `opacity .10` plus `scale(.97)` (140ms `--e-emph`) while pressed, and `focus-visible` a 2px `prim` outline with 2px offset (250ms `--e-spring` wherever the ring animates). Settings-sheet rows SHALL use a pill base radius (`rounded-full`) so their state layer and radius morph have a shape. Elements that are NOT interactive — history rows and product cards (per `openspec/specs/history/spec.md`, rows SHALL NOT be interactive in v1) — MUST NOT render press feedback of any kind. Every interactive control SHALL expose a ≥44px hit area (achieved with padding or a pseudo-element; the visible footprint may be smaller for chips and the × button). Native tap highlight SHALL be disabled. The single press-scale exception is the sintesi tile at `scale(.95)`; all other elements use `scale(.97)` — no `scale-95/0.98/0.99` drift.

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
The app SHALL use one radius scale — pill `rounded-full` (FAB, buttons, chips, fields, rows, navbar), 20px tiles, 24px cards, 28px sheets/large panels, 32px hero — with no drift between pages (e.g. the Prodotti MAI box `rounded-2xl` becomes 20px). The type scale SHALL use named roles covering every mandated size, with no sizes outside these roles: `caption` 10px bold as the single caption system (two documented styles: eyebrow — uppercase, `tracking-[0.14em]`, `mut`; inline — normal case, inherits color), `meta` 11px, `label` 12px (hero label, hero badge, card labels, field suffix), `body-sm` 13px, `body` 14px and `text-button` 14px (M3 label-large), `button-large` 15px and `card-title` 15px, `field` 16px, `title` 22px, `display` 26–30px (`font-black`; tile counts 26px, stat values 30px). Section spacing SHALL follow one rhythm: page blocks separated by 24px (`space-y-6`), eyebrow→content 16px (`space-y-4`), sheet inner padding 20px (`px-5`) — no ad-hoc gaps.

#### Scenario: Radius scale is consistent
- **WHEN** tiles, cards, sheets and the hero render on any page
- **THEN** their corner radii are 20px, 24px, 28px and 32px respectively, and the Prodotti MAI box uses 20px instead of `rounded-2xl`

#### Scenario: One caption system
- **WHEN** any caption renders (section captions, field labels, tile labels)
- **THEN** it uses the `caption` role (its eyebrow or inline documented style) or the documented per-role size of the scale, with no ad-hoc caption sizes

#### Scenario: No sizes outside the type roles
- **WHEN** any text renders on any page
- **THEN** its size is one of the named roles (10/11/12/13/14/15/16/22/26–30px) — e.g. the "Annulla" text button renders at `text-button` 14px (M3 label-large) while the full-width filled "Registra" renders at `button-large` 15px and the compact card "Registra" at `text-button` 14px — with no ad-hoc sizes

#### Scenario: One spacing rhythm
- **WHEN** page sections, eyebrow labels and sheets lay out
- **THEN** page blocks are 24px apart (`space-y-6`), eyebrow→content is 16px (`space-y-4`) and sheet inner padding is 20px (`px-5`), with no ad-hoc gaps

### Requirement: Press shape morphs
Row-shaped and card-shaped interactive elements SHALL morph their corner radius while pressed — rows `rounded-full` → 22px (queue rows, settings-sheet rows), cards 24px → 16px (activity cards) — easing back on release; the radius transition uses 250ms `--e-spring` while the press scale stays on the 140ms `--e-emph` layer (two speeds on one element, per `ui-drafts/d2-morfosi.html`). Non-interactive rows/cards (history rows, product cards) morph nothing.

#### Scenario: Queue row press morph
- **WHEN** the user presses a Prossime queue row
- **THEN** its radius eases from pill to 22px (250ms spring) while the row scales to `.97`, and both spring back on release

#### Scenario: Settings row press morph
- **WHEN** the user presses a settings-sheet row
- **THEN** its pill radius eases toward 22px (250ms spring) under the `.97` press scale, springing back on release

### Requirement: FAB press shape morph
While the FAB is pressed it SHALL morph from its circular shape toward a squircle (rounded-square) via its `border-radius` (250ms `--e-spring`) on top of the standard `scale(.97)` press layer, and spring back to the circle on release.

#### Scenario: FAB press morph
- **WHEN** the user holds the FAB
- **THEN** the circle eases to a squircle shape and, on release, springs back to the 56px circle

### Requirement: Button anatomy
Buttons SHALL come in three variants, all with state layers, press feedback and ≥44px hit areas: filled — full-width (`rounded-full h-12`, `button-large` 15px bold, e.g. `bg-prim text-onPrim`, for CTAs and sheet submits) and compact (`rounded-full h-9 px-4`, `text-button` 14px bold, e.g. the card "Registra") — text button (no border, no fill, `text-button` 14px = M3 label-large, e.g. "Annulla" `text-onSurfV font-bold`) and icon button (40px circle). All use `scale(.97)` press and the `focus-visible` ring.

#### Scenario: Text button has no border
- **WHEN** the "Annulla" button renders in a sheet
- **THEN** it shows no border and no fill, only its 14px `text-button` label with the shared press layer

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
Shared animation primitives SHALL be available and SHALL fire only on route/pane activation (never on every change-detection cycle): staggered block entrance (rise 16px + fade, 550ms `--e-emph`, 55ms stagger per sibling), number count-up (`--d-count-up` 700ms, JS cubic ease-out — the documented JS easing exemption) and progress-bar fill (0 → target width, 650ms `--e-spring`). Data edits (registrations, field changes) update values, bar widths and status tints through the existing width/color transitions but NEVER replay entrances, count-ups or digit rolls; a hero swap retints the container and glow and snaps the badge text. Reduced motion snaps everything to final state.

#### Scenario: Staggered entrance on activation
- **WHEN** a route becomes active
- **THEN** its blocks rise 16px and fade in, each delayed 55ms after the previous one, and the entrance does not replay on unrelated change-detection cycles

#### Scenario: Count-up on activation
- **WHEN** a pane with `data-count` numbers becomes active
- **THEN** each number animates from 0 to its value in ~700ms and then holds the exact final value

#### Scenario: Data edits do not replay animation
- **WHEN** a value, bar width or status tint changes after a data edit on the active page
- **THEN** the value updates, the bar animates only its width/color transition and no entrance, count-up or digit roll replays

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
