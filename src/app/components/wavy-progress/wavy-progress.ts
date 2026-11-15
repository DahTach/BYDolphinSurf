import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, input, signal, untracked, viewChild } from '@angular/core';

import { prefersReducedMotion } from '../../shared/motion';

/* Reusable Onda M3E wavy progress primitive (specs/design-system "Wavy progress
   indicator (M3E)", rifiniture-e D4; mirrors ui-drafts/e2-stat-grid.html variant B).
   Track and fill share ONE canonical sine-wave path (midline y=6, x-extent 2→198 so
   the round caps stay inside the viewBox, first bump up, half-period 14 → wavelength
   ≈28px, stroke-width 4, round caps), rendered `w-full h-3` with the default
   preserveAspectRatio. `pathLength="1000"` normalizes the length: the fill is carved
   with the `stroke-dasharray` PAIR `P 1000` — `P = value% × 10`, floored at exactly 45
   for any live value so tiny fills keep a visible wave head; 0% renders EMPTY (`0 1000`).
   Two speeds on one element: the entrance fill animates the dash from `0 1000` to
   `P 1000` over 650ms `--d-bar` `--e-spring` on activation only (playFill(), once);
   later data edits transition `stroke-dasharray` over `--d-small` `--e-emph` and never
   replay the entrance. Reduced motion shows the final fill immediately. */

/** Matches the CSS token `--d-bar` (650ms): the entrance fill duration. */
const FILL_MS = 650;

/** The canonical sine path — copied verbatim from ui-drafts/e2-stat-grid.html variant B. */
const WAVE_PATH = 'M2 6 Q9 -1 16 6 T30 6 T44 6 T58 6 T72 6 T86 6 T100 6 T114 6 T128 6 T142 6 T156 6 T170 6 T184 6 T198 6';

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
    <svg viewBox="0 0 200 12" class="w-full h-3" fill="none" stroke-width="4" stroke-linecap="round" aria-hidden="true">
      <path class="stroke-surfHiX" [attr.d]="wavePath" pathLength="1000" />
      <path #fillPath [class]="'wavy-fill ' + fill()" [attr.d]="wavePath" pathLength="1000" [attr.stroke-dasharray]="displayDash()" />
    </svg>
  `,
})
export class WavyProgress implements OnDestroy {
  /** Value in percent (0–100) — e.g. 18 for 18%. */
  readonly value = input<number>(0);
  /** Fill stroke as a token color class (e.g. 'stroke-prim', 'stroke-onTerC'). */
  readonly fill = input<string>('');

  protected readonly wavePath = WAVE_PATH;

  /** The `P 1000` dash pair: empty at 0%, `max(value% × 10, 45)` above (specs/design-system). */
  protected readonly dash = computed(() => {
    const pct = this.value();
    return pct <= 0 ? '0 1000' : `${Math.max(pct * 10, 45)} 1000`;
  });

  /** Empty until the activation entrance plays — so no fill paints before its reveal. */
  private readonly entered = signal(false);
  protected readonly displayDash = computed(() => (this.entered() ? this.dash() : '0 1000'));

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
