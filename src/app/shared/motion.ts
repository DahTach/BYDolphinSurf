/* Shared entrance / data-animation primitives (design D1/D11, specs/design-system).
   Mirrors the motion engine of ui-drafts/d2-morfosi.html (`.enter`, `runCount`, `.bar`)
   as Angular-friendly helpers. The entrance/count-up/bar primitives run ONCE on
   route/pane activation (from a router/activation effect) — never on raw change
   detection — and all snap instantly to the final state under
   `prefers-reduced-motion: reduce` (single outcome everywhere: instant snap, no
   fallback motions). The celebration primitives (playBloom/playCelebrate, mockup
   demo ②) are event-driven — one tap, one play — under the same reduced-motion
   contract.

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

/* ════════════════════════════════════════════════════════════════════════════
   "Fatto!" celebration (mockup h1-proposta-m3e demo ②, styles in src/styles.scss
   `.bloom`): the register CTA is the app's most important action, so registering
   gets its moment. Unlike the entrance/count-up primitives these are EVENT-driven
   (one tap = one play), never activation-only — but they keep the same reduced
   motion contract: instant snap, no choreography.
   ════════════════════════════════════════════════════════════════════════════ */

/** Matches the mockup bloom keyframes (700ms). */
const BLOOM_MS = 700;
/** The "Fatto ✓" state stays on ≈1.6s before the CTA reverts (mockup). */
const FATTO_MS = 1600;
/** Pop curve of the "Fatto ✓" flip — the CSS token `--e-spring` verbatim. */
const FATTO_EASING = 'cubic-bezier(0.38, 1.21, 0.22, 1)';
/** Outlined-cream fill of the done state (mockup `.celebrate-btn.done`). */
const FATTO_BORDER = 'rgba(237, 230, 218, 0.35)';

/**
 * Celebration bloom: append a radial-gradient circle at `el`'s center that
 * scales 0 → 11 while fading out over 700ms (`--e-emph`, `.bloom` in
 * styles.scss), then remove it. No-op under prefers-reduced-motion.
 *
 * The trigger hosts the bloom (`.press`/`.btn` are `position: relative` → its own
 * box is the positioning context); a static element falls back to its parent.
 *
 * Usage:
 *   playBloom(btn); // warm flash from the button's center
 */
export function playBloom(el: HTMLElement): void {
  if (prefersReducedMotion()) return;

  let host = el;
  if (getComputedStyle(host).position === 'static') {
    host = el.parentElement ?? el;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  }

  const box = el.getBoundingClientRect();
  const hostBox = host.getBoundingClientRect();
  const bloom = document.createElement('span');
  bloom.className = 'bloom';
  bloom.setAttribute('aria-hidden', 'true');
  bloom.style.left = `${box.left - hostBox.left + box.width / 2}px`;
  bloom.style.top = `${box.top - hostBox.top + box.height / 2}px`;
  host.appendChild(bloom);
  void bloom.offsetWidth; // reflow so the animation always starts from frame 0
  bloom.classList.add('go');
  window.setTimeout(() => bloom.remove(), BLOOM_MS);
}

/**
 * The "Fatto ✓" moment for a register button (mockup demo ②): swap the label to
 * "Fatto ✓", flip the fill to transparent + 1px cream border + cream text, pop
 * 0.9 → 1.06 → 1 (`--e-spring`) and bloom from the center — then restore the
 * original label and look after ≈1.6s. The flip uses INLINE styles + the Web
 * Animations API on purpose: Angular class bindings (`[class]="h.cta + …"`)
 * re-rendering after the store update must not clobber the moment. Re-entry
 * safe: a celebrating button ignores new taps. Under reduced motion the label
 * and look still flip (instantly — no pop, no bloom), then revert.
 *
 * Usage:
 *   playCelebrate(btn); // after the store update, on the clicked CTA
 */
export function playCelebrate(btn: HTMLElement): void {
  if (btn.dataset['fatto'] != null) return;
  btn.dataset['fatto'] = '1';

  const label = btn.textContent ?? '';
  const prev = {
    background: btn.style.backgroundColor,
    borderStyle: btn.style.borderStyle,
    borderWidth: btn.style.borderWidth,
    borderColor: btn.style.borderColor,
    color: btn.style.color,
  };

  btn.textContent = 'Fatto ✓';
  btn.style.backgroundColor = 'transparent';
  btn.style.borderStyle = 'solid';
  btn.style.borderWidth = '1px';
  btn.style.borderColor = FATTO_BORDER;
  btn.style.color = 'var(--color-prim)';
  playBloom(btn);

  if (!prefersReducedMotion()) {
    btn.animate(
      [
        { transform: 'scale(0.9)' },
        { transform: 'scale(1.06)', offset: 0.45 },
        { transform: 'scale(1)' },
      ],
      { duration: 550, easing: FATTO_EASING },
    );
  }

  window.setTimeout(() => {
    btn.textContent = label;
    btn.style.backgroundColor = prev.background;
    btn.style.borderStyle = prev.borderStyle;
    btn.style.borderWidth = prev.borderWidth;
    btn.style.borderColor = prev.borderColor;
    btn.style.color = prev.color;
    delete btn.dataset['fatto'];
  }, FATTO_MS);
}

