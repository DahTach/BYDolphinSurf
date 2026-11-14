/* Shared entrance / data-animation primitives (design D1/D11, specs/design-system).
   Mirrors the motion engine of ui-drafts/d2-morfosi.html (`.enter`, `runCount`, `.bar`)
   as Angular-friendly helpers. All of them are meant to run ONCE on route/pane
   activation (from a router/activation effect) — never on raw change detection —
   and all snap instantly to the final state under `prefers-reduced-motion: reduce`
   (single outcome everywhere: instant snap, no fallback motions).

   Token mapping (CSS tokens live in src/styles.scss `:root`):
   - entrance: .enter / .in classes — 550ms `--d-large` `--e-emph`, 16px rise
   - stagger:  55ms per sibling — CSS token `--stagger`
   - count-up: 700ms `--d-count-up`, JS cubic ease-out (the documented D1/D11
     easing exemption — the curve lives here in JS, not in CSS)
   - bars:     .bar class — 0→target width, 650ms `--d-bar` `--e-spring` */

/** Matches the CSS token `--stagger` (55ms). */
const STAGGER_MS = 55;
/** Matches the CSS token `--d-count-up` (700ms). */
const COUNT_UP_MS = 700;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * JS-side reduced-motion gate for discrete steps (count-ups, digit rolls,
 * staggers, morph/ripple/navigation delays): when true, jump to the final
 * state and use zero delays.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Per-index entrance stagger delay in ms (0 under reduced motion).
 * Use with `style.transitionDelay` (the global reduced-motion clamp also
 * zeroes inline delays as a second safety net).
 */
export function staggerDelay(index: number): number {
  return prefersReducedMotion() ? 0 : index * STAGGER_MS;
}

/**
 * (Re)play the staggered `.enter` entrance on the given blocks: each block gets
 * `.in` plus a per-index `--stagger` transition delay. Restarts cleanly when
 * called again (class remove → forced reflow → class add).
 *
 * Usage (activation-only):
 *   playEntrance(this.blockEls()); // .enter blocks of the active route/pane
 */
export function playEntrance(blocks: Iterable<HTMLElement>): void {
  const list = Array.from(blocks);
  for (const el of list) {
    el.classList.remove('in');
    el.style.transitionDelay = '0ms';
  }
  if (list.length === 0) return;
  void list[0].offsetHeight; // force reflow so the entrance can retrigger
  list.forEach((el, i) => {
    el.style.transitionDelay = `${staggerDelay(i)}ms`;
    el.classList.add('in');
  });
}

/**
 * Count 0 → `target` over 700ms (`--d-count-up`) with a JS cubic ease-out — the
 * documented D1 easing exemption. `set` receives the rounded intermediate values
 * and, as its last call, the exact final value. Under reduced motion `set` is
 * called once with the target.
 *
 * Usage (feed a signal; the template keeps rendering it):
 *   runCount(42, (v) => this.count.set(v));
 * Returns a cancel function — the owning component calls it on destroy so no frames run past teardown.
 */
export function runCount(target: number, set: (value: number) => void): () => void {
  if (prefersReducedMotion()) {
    set(target);
    return () => {};
  }
  const t0 = performance.now();
  let raf = 0;
  let cancelled = false;
  const frame = (now: number): void => {
    if (cancelled) return;
    const p = Math.min((now - t0) / COUNT_UP_MS, 1);
    set(p < 1 ? Math.round(target * (1 - Math.pow(1 - p, 3))) : target);
    if (p < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

/**
 * Fill a `.bar` element from 0 to `widthPct` (650ms `--d-bar` `--e-spring`) on
 * activation. Data edits later just assign `bar.style.width` (or a stable style
 * binding): the `.bar` CSS transition animates the width change and nothing
 * replays. Under reduced motion the global clamp makes the fill instant.
 *
 * Usage:
 *   fillBar(barEl, 78); // → width 0 → 78%
 */
export function fillBar(bar: HTMLElement, widthPct: number): void {
  bar.style.width = '0%';
  void bar.offsetWidth; // force reflow so the fill replays on re-activation
  bar.style.width = `${widthPct}%`;
}
