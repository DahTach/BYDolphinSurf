## Context

- `rifiniture-e` (archived 2026-11-15) shipped the Onda M3E linear wavy progress in the "Stato veicolo" card. The user's reference (screenshot) is instead the Material 3 Expressive **circular** wavy progress — smooth ring track, active portion as a wavy stroke along the arc, value in the center. `ui-drafts/f-wavy-ring.html` renders it (two composition variants; the geometry was verified at 4× zoom) and is the visual source of truth.
- Mockups are the visual source of truth. Stack constraints locked: Angular 22 standalone + signals, zoneless, TS strict, Tailwind 4, bun, no new dependencies.
- Store/derivations untouched: ND-3 cycle formula, status derivation, seed — all unchanged.

## Goals / Non-Goals

**Goals:** replace the linear wavy bars of the "Stato veicolo" card with the circular wavy progress (composition A), growing the shared wavy primitive with a ring form, and scope the old ring ban so it never forbids the mandated wavy ring.

**Non-Goals:** no other pages/cards; the linear wavy form stays spec'd and available; no motion-token/state-layer changes; no new dependencies; no data/seed/status changes; no hero/sintesi/sheet changes; no return of the old plain ring-with-dot indicator.

## Decisions

**D1 — Reference and composition:** the user reference (screenshot) is the M3E circular wavy progress; composition **A "Valore al centro, etichette sotto"** of `ui-drafts/f-wavy-ring.html` is chosen over B ("Tutto nel cerchio") on 2026-11-16 — the number stays the fulcrum, the wave is its expressive halo, and only the label + support line sit below the ring.

**D2 — Ring geometry pinned from the verified mockup:** SVG `viewBox="0 0 120 120"`; track = smooth full `<circle cx="60" cy="60" r="52">`, stroke 3px `surfHiX`; active = a wavy path around the same circle generated EXACTLY as `radius(θ) = 52 + 3.5 · sin(12θ)` with θ measured CLOCKWISE from 12 o'clock — the oscillation is parameterized by the ANGLE θ (never by arc length), the wave crosses the track radius at 12 o'clock (zero crossing) and its first crest sits OUTWARD (radius 55.5) at ≈6.8px of arc clockwise — giving **exactly 12 waves** around the full circle (integer wave count so the ring closes seamlessly at 12 o'clock; wavelength ≈27.2px of arc at r=52), stroke 4.5px, round caps AND round joins. The path is the mockup's smooth sampled polyline — 20 samples per wave (240 segments around the ring), coordinates to 0.1px, round joins absorbing the faceting (≤0.25px geometric deviation from the analytic curve) — starting at 12 o'clock sweeping clockwise. `pathLength="1000"`; the fill is carved with the same dash pair `P 1000`, `P = round(max(value% × 10, 45))` for values > 0 (rounded so the dash strings stay deterministic), capped at 1000 — ≥100% renders the full seamless ring `1000 1000` (the seam hides because the periodic wavy path closes on its start point), which covers Cicli values above 5.000 reached via the odometer. 0% renders EMPTY (`0 1000`) — a manual check guards renderers that paint a round-cap dot on a zero-length dash. Fill colors `prim` (Prontezza) / `onTerC` (Cicli). Same motion contract as the bar: entrance `"0 1000"` → `"P 1000"` (650ms `--e-spring`) on activation only, the carve growing CLOCKWISE from 12 o'clock; data edits transition `stroke-dasharray` over `--d-small` `--e-emph` and never replay; reduced motion renders the final fill immediately. The wave-head floor, empty rule and cap are shared with the bar — one semantic, two forms.

**D3 — The `refine-cruscotto-md3` ring ban is scoped, not contradictory:** that ban targeted the OLD plain ring-with-gap/dot SVG of `ui-drafts/b-blade.html`. The wavy ring supersedes it: the old plain ring/dot indicator stays banned, and only the circular WAVY form is legal for circular progress. The delta retires the "The ring indicator (track/progress/dot SVG) MUST NOT be used" wording from the Stato veicolo card requirement and replaces it with the wavy-ring mandate + the carve-out in the design-system requirement — no wording anywhere forbids the ring we are mandating.

**D4 — Composition A cell anatomy (from the mockup):** the card scaffold is unchanged (`bg-surfC rounded-[24px] p-5`, eyebrow "STATO VEICOLO", `grid grid-cols-2 gap-4`). Each cell: the ring (exactly 120px × 120px, `w-[120px] h-[120px]`, centered) with the display value centered inside via `absolute inset-0 flex items-center justify-center` (`leading-none tracking-tight`, `whitespace-nowrap`) — Prontezza "18" 26px `display` `font-black` `onSurf` + "%" 14px bold `mut`; Cicli "14" 26px + "/5.000" 12px bold `mut`. The single line scales DOWN rather than overflowing or wrapping: the value figure renders 26px by default, 22px at more than 6 glyphs, 18px at more than 8 glyphs (glyphs counted on the value figure — digits and separators; the suffixes keep their fixed 14px/12px). Below the ring, centered: label 12px `label` `onSurfV` at `mt-3` ("Prontezza" / "Cicli LFP"), then support 11px `meta` `mut` at `mt-1` ("2 di 11 in regola" / "≈ 0,3% vita utile"). Values/supports stay computed from the store (ND-3 untouched); the ring's `value` input binds the COMPUTED final percent — the activation count-up animates only the text values (binding the count-up signal would re-trigger the dash effect every frame and silently degrade the entrance). The in-ring value is 26px of the `display` role; the scale's 30px end currently has NO consumer (nothing renders a display-sized stat value outside the rings) — the type scale itself is unchanged.

**D5 — Implementation latitude:** the ring form joins the shared primitive as a `shape` input (`'bar' | 'ring'`, defaulting to `bar`) or a sibling ring component — implementer's call; the spec stays form-agnostic ("the wavy progress primitive, bar or ring form"). The linear bar leaves the Stato veicolo card but remains spec'd and legal.

## Risks / Trade-offs

- [Ring seam at 12 o'clock] → D2's integer wave count (exactly 12) makes the sampled path close seamlessly; the geometry is scenario-asserted.
- [Ban wording lingering and forbidding the mandated ring] → D3: the delta rewrites both wordings in the same change; task 3 is a verification-only sweep of `openspec/specs/`.
- [Tiny ring fills rendering as nothing] → shared wave-head rules (`0 1000` empty, `45 1000` floor above 0) carried into the ring semantics, scenario-asserted at 0,3%.

## Migration Plan

None (UI + specs only; no data or dependency changes). Rollback = revert the change.

## Resolved Decisions (user, this round)

- The user reference (screenshot) = M3E circular wavy progress; composition A "Valore al centro, etichette sotto" chosen over B "Tutto nel cerchio" (2026-11-16).
- Ring params pinned from the verified mockup: generator `radius(θ) = 52 + 3.5 · sin(12θ)` (θ clockwise from 12 o'clock, zero crossing at 12 o'clock, first crest outward at ≈6.8px of arc), exactly 12 waves so the ring closes seamlessly (wavelength ≈27.2px of arc at r=52), amplitude 3.5px, 12 o'clock start sweeping clockwise, stroke 4.5px round caps AND joins, smooth sampled polyline (20 samples/wave = 240 segments, coordinates to 0.1px, ≤0.25px deviation).
- The `refine-cruscotto-md3` ring ban is scoped to the OLD plain ring-with-dot SVG; the circular wavy progress supersedes it and is now the mandated circular form (only the wavy form is legal for circular progress).
- Value 26px `display` in-ring (the value figure scales down to 22px/18px past 6/8 glyphs instead of wrapping); the `display` scale's 30px end currently has no consumer — the scale itself is unchanged.
- Dash semantics are shared across forms: `P = round(max(value% × 10, 45))` for values > 0 (floor exactly 45/1000), 0% empty (`0 1000`), P capped at 1000 (≥100% → `1000 1000`), always the pair `P 1000`.
