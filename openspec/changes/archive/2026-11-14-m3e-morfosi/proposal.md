# M3E Morfosi

## Why

The shipped UI is M3-flavored but not genuinely Material 3 Expressive: there is no motion language (no easing/duration tokens, no reduced-motion handling), interactive elements give almost no press feedback (settings rows have none), shapes and type sizes drift between pages, and the status chip has a contrast bug (the `bg-waC` hero chip on the `bg-waC` hero is invisible). An approved mockup exists — `ui-drafts/d2-morfosi.html` ("Morfosi": motion + shape morphing) — plus two features worth cherry-picking from `ui-drafts/d3-vivace.html` (kinetic countdown badge, scroll-aware header). The user authorized a full component-rework pass.

## What Changes

- Motion foundation: easing tokens + named duration scale (press 140 / small 250 / fade 350 / medium 400 / exit-flight 450 / ripple 500 / large 550–650 / count-up 700ms), 55ms entrance stagger, `prefers-reduced-motion` kill-switch (instant snap everywhere); animate transform/opacity.
- Universal state layers (hover/active/focus ring) + press scale on every interactive element (history rows/product cards stay non-interactive — no press feedback); press shape morphs (rows pill→22px, cards 24→16px).
- Shape & type scale normalization (radius 20/24/28/32 + pill; type roles caption 10 / meta 11 / label 12 / body-sm 13 / body + text-button 14 / button-large + card title 15 / field 16 / title 22 / display 26–30 — no sizes outside these roles).
- FAB: press shape-morph (circle→squircle) and the d2 centerpiece — FAB→sheet geometry morph (open 550ms spring / close 450ms exit), scrim fade.
- Navbar: fluid active indicator that slides and stretches mid-flight — the indicator IS the single `bg-primC` pill (buttons carry no fill); active icon pop.
- Hero: breathing status-tinted ambient glow, 48→32px corner morph on entrance, delayed badge spring; kinetic odometer badge digit roll with always-unpadded text ("+N g" / "tra N g" / "oggi", never "+04"), activation-only rolls and snap-on-change (d3 cherry-pick).
- Sticky scroll-aware header condensing over the first ~96px (d3 cherry-pick); route change lands at the top, fragment jumps keep native anchor behavior.
- Dashboard: sintesi tile ripple + 600ms delayed deep-link (cancellable, keyboard immediate), count-up numbers, spring bar fills, queue entrance stagger, graceful empty/hidden states.
- Sheet motion (settings + FAB sheets): spring slide-up + scrim, drag handle, exit-eased close, dialog a11y (focus trap, Escape, focus restored to the trigger).
- Component rework: status chip/badge redesign as ONE component with ONE `variant × status` color map (`card` | `hero` | `badge`) and a ≥3:1 container-contrast rule (fixes the invisible hero chip), buttons, text-field focus motion + dark `select`, empty states, token cleanup (hardcoded hexes in `dashboard.ts`/`dashboard.html`/`styles.scss`/`app.html`, empty `app.scss`).
- Consistency: one press-feedback value set, one spacing rhythm (page blocks 24px `space-y-6`, eyebrow→content 16px `space-y-4`, sheet padding 20px `px-5`), one caption system.

## Capabilities

### New Capabilities

- `design-system`: motion tokens/easings/durations, reduced-motion, state layers, shape & type scale, press shape morphs, chip/button/field anatomy.

### Modified Capabilities

- `app-shell`: navbar fluid indicator, FAB→sheet morph wiring, scroll-aware header, sheet motion, route/section transitions.
- `dashboard`: hero glow/corner morph/badge spring + kinetic digit roll, tile ripple, count-ups, bar fills, queue stagger, empty states.
- `activities`: card/row press morphs, entrance stagger, empty state with "Cancella filtro", FAB sheet morph integration.
- `vehicle-data`: field focus motion, vehicle-field token cleanup.

## Impact

- Code: `src/styles.scss` (tokens), `components/fab/`, `components/navbar/`, `components/settings-sheet/`, `components/status-chip/`, `components/text-field/`, `pages/dashboard/*`, `pages/activities/*`, `pages/vehicle-data` fields, `app.ts`/`app.html`; possibly delete empty `app.scss`.
- No new dependencies (bun + existing Tailwind); no data-model/seed/status-logic changes; Storico/Prodotti keep content (shared polish only, folded into `design-system`).

## Non-goals

- No car stage / floating car / parallax; no navbar labels; no 24px cinematic entrances or letter-spacing animation (d2 uses 16px rise); no theme toggle/light mode; no new pages; no icon library; no data model/seed/status logic changes; no content changes to Storico/Prodotti.
