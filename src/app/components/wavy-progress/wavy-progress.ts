import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, input, signal, untracked, viewChild } from '@angular/core';

import { prefersReducedMotion } from '../../shared/motion';

/* Reusable Onda M3E wavy progress primitive (specs/design-system "Wavy progress
   indicator (M3E)", rifiniture-e D4). Two shapes, ONE dash/motion contract:
   - `bar` (default): linear sine-wave bar (mirrors ui-drafts/e2-stat-grid.html
     variant B). Track and fill share ONE canonical sine-wave path (midline y=6,
     x-extent 2→198 so the round caps stay inside the viewBox, first bump up,
     half-period 14 → wavelength ≈28px, stroke-width 4, round caps), rendered
     `w-full h-3` with the default preserveAspectRatio.
   - `ring`: M3E CIRCULAR wavy ring (ui-drafts/f-wavy-ring.html variant A).
     viewBox 0 0 120 120 rendered `w-[120px] h-[120px]`; smooth track `<circle
     r=52>` stroke 3 `surfHiX`; wavy fill radius 52 + 3.5·sin(12θ) with θ
     clockwise from 12 o'clock (zero crossing at 12 o'clock, first crest outward
     at ≈6.8px of arc), exactly 12 waves so the path closes seamlessly on its
     start point, stroke 4.5 round joins/caps.
   `pathLength="1000"` normalizes the length: the fill is carved with the
   `stroke-dasharray` PAIR `P 1000` — `P = round(value% × 10)`, floored at exactly
   45 for any live value so tiny fills keep a visible wave head and capped at 1000
   (≥100% → `1000 1000`, the periodic path closes on its start point so the seam
   hides); 0% renders EMPTY (`0 1000`) — a zero-length dash with a round cap paints
   a dot, so the empty state switches the fill to butt caps (nothing renders).
   Two speeds on one element: the entrance fill animates the dash from `0 1000` to
   `P 1000` over 650ms `--d-bar` `--e-spring` on activation only (playFill(), once);
   later data edits transition `stroke-dasharray` over `--d-small` `--e-emph` and never
   replay the entrance. Reduced motion shows the final fill immediately. */

/** Matches the CSS token `--d-bar` (650ms): the entrance fill duration. */
const FILL_MS = 650;

/** The canonical sine path — copied verbatim from ui-drafts/e2-stat-grid.html variant B. */
const WAVE_PATH = 'M2 6 Q9 -1 16 6 T30 6 T44 6 T58 6 T72 6 T86 6 T100 6 T114 6 T128 6 T142 6 T156 6 T170 6 T184 6 T198 6';

/**
 * The ring wavy path — the `wavyRingPath` generator from ui-drafts/f-wavy-ring.html
 * with the pinned geometry: radius oscillates as `r + amplitude·sin(waves·θ)`, θ
 * measured CLOCKWISE from 12 o'clock (SVG y-down), so the zero crossing sits at
 * 12 o'clock and the FIRST crest is OUTWARD. `waves` whole periods make the
 * sampled polyline close seamlessly on its start point (60, 8); 20 samples per
 * wave keep it smooth under round joins/caps, coords to 0.1px.
 */
function wavyRingPath(cx: number, cy: number, r: number, amplitude: number, waves: number): string {
  const samples = 20;
  const n = waves * samples;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const angle = -Math.PI / 2 + 2 * Math.PI * t; // 12 o'clock, clockwise
    const radius = r + amplitude * Math.sin(2 * Math.PI * waves * t);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}

/** Pinned ring geometry: r=52, amplitude 3.5 (radius 48.5↔55.5), 12 waves. */
const RING_PATH = wavyRingPath(60, 60, 52, 3.5, 12);

@Component({
  selector: 'app-wavy-progress',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    :host {
      display: block;
    }

    /* Data-edit speed by default; the entrance overrides it while it plays. */
    .wavy-fill {
      transition: stroke-dasharray var(--d-small) var(--e-emph);
    }

    .wavy-fill.entering {
      transition: stroke-dasharray var(--d-bar) var(--e-spring);
    }
  `,
  template: `
    @if (shape() === 'ring') {
      <svg viewBox="0 0 120 120" class="w-[120px] h-[120px]" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="52" class="stroke-surfHiX" stroke-width="3" />
        <path #fillPath [class]="'wavy-fill ' + fill()" [attr.d]="ringPath" pathLength="1000" stroke-width="4.5" [attr.stroke-linecap]="emptyDash() ? 'butt' : 'round'" stroke-linejoin="round" [attr.stroke-dasharray]="displayDash()" />
      </svg>
    } @else {
      <svg viewBox="0 0 200 12" class="w-full h-3" fill="none" stroke-width="4" stroke-linecap="round" aria-hidden="true">
        <path class="stroke-surfHiX" [attr.d]="wavePath" pathLength="1000" />
        <path #fillPath [class]="'wavy-fill ' + fill()" [attr.d]="wavePath" pathLength="1000" [attr.stroke-linecap]="emptyDash() ? 'butt' : 'round'" [attr.stroke-dasharray]="displayDash()" />
      </svg>
    }
  `,
})
export class WavyProgress implements OnDestroy {
  /** Value in percent (0–100) — e.g. 18 for 18%. */
  readonly value = input<number>(0);
  /** Fill stroke as a token color class (e.g. 'stroke-prim', 'stroke-onTerC'). */
  readonly fill = input<string>('');
  /** Progress form: the linear bar (default) or the M3E circular wavy ring. */
  readonly shape = input<'bar' | 'ring'>('bar');

  protected readonly wavePath = WAVE_PATH;
  protected readonly ringPath = RING_PATH;

  /** The `P 1000` dash pair: empty at 0%, `round(max(value% × 10, 45))` above, capped at 1000. */
  protected readonly dash = computed(() => {
    const pct = this.value();
    return pct <= 0 ? '0 1000' : `${Math.min(Math.round(Math.max(pct * 10, 45)), 1000)} 1000`;
  });

  /** Empty until the activation entrance plays — so no fill paints before its reveal. */
  private readonly entered = signal(false);
  protected readonly displayDash = computed(() => (this.entered() ? this.dash() : '0 1000'));

  /** A zero-length dash paints a round-cap dot: the empty fill gets butt caps instead. */
  protected readonly emptyDash = computed(() => this.displayDash() === '0 1000');

  private readonly fillPath = viewChild('fillPath', { read: ElementRef });
  private played = false;
  private enterTimer = 0;

  /**
   * A data edit during the entrance window drops to the data-edit speed:
   * the `.entering` override is removed as soon as the dash target changes
   * (audit m1) — the base `--d-small` transition takes over from here.
   */
  private readonly dashEdit = effect(() => {
    this.dash();
    untracked(() => {
      if (!this.played || !this.entered() || !this.enterTimer) return;
      clearTimeout(this.enterTimer);
      this.enterTimer = 0;
      const path = this.fillPath()?.nativeElement as SVGPathElement | undefined;
      path?.classList.remove('entering');
    });
  });

  ngOnDestroy(): void {
    clearTimeout(this.enterTimer);
  }

  /**
   * Entrance fill (call on route/pane activation, once): `stroke-dasharray`
   * `"0 1000"` → `"P 1000"` over 650ms `--d-bar` `--e-spring`. Data edits later
   * transition the dash at the data-edit speed without replaying this. Reduced
   * motion renders the final fill immediately.
   */
  playFill(): void {
    if (this.played) return;
    this.played = true;

    if (prefersReducedMotion()) {
      this.entered.set(true);
      return;
    }

    const path = this.fillPath()?.nativeElement as SVGPathElement | undefined;
    path?.classList.add('entering');
    this.entered.set(true);
    this.enterTimer = window.setTimeout(() => {
      this.enterTimer = 0;
      path?.classList.remove('entering');
    }, FILL_MS);
  }
}
