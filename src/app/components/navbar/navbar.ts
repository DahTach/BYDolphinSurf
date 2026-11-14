import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, inject, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { prefersReducedMotion } from '../../shared/motion';

/* Floating icon-only pill navbar with the fluid indicator (design D5, specs/app-shell;
   mirrors .nav-ind / navPop / placeIndicator of ui-drafts/d2-morfosi.html).
   The single sliding `bg-primC` pill IS the active button's background — buttons carry
   NO fill of their own. The pill translates via --x (400ms --e-spring) while the
   indStretch keyframe bulges its width to max(from,to)+18px at 55% of the 450ms
   --e-emph flight and settles on the active button's 52px. The active button widens
   48→52px (250ms) and flips its icon to onPrimC; the icon pops 1→1.15→1 (400ms
   --e-spring). Window resize re-places the pill without animation; reduced motion
   places it instantly (no stretch, no pop). */

/** Routes behind the four buttons (index = activeIndex). */
const NAV_PATHS = ['/', '/attivita', '/storico', '/prodotti'];
/** Button width transition (--d-small 250ms) + margin before the exact re-place. */
const SETTLE_MS = 280;

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .nav-pill {
      position: relative;
    }

    /* One fluid indicator pill — the ONLY bg-primC fill in the navbar */
    .nav-ind {
      position: absolute;
      left: 0;
      top: 8px;
      height: 40px;
      width: 52px;
      border-radius: var(--radius-pill);
      background-color: var(--color-primC);
      transform: translateX(var(--x, 0px));
      transition: transform var(--d-medium) var(--e-spring);
      pointer-events: none;
    }

    .nav-ind.stretch {
      animation: indStretch var(--d-exit-flight) var(--e-emph);
    }

    /* Width flight is fixed by the 52px invariant: the pill only ever rests on the
       ACTIVE button (52px), so from = to = 52px and the peak is max(from, to) + 18px = 70px. */
    @keyframes indStretch {
      0% {
        width: 52px;
      }
      55% {
        width: 70px;
      }
      100% {
        width: 52px;
      }
    }

    /* Buttons: no background — the indicator IS their fill. Widen 48→52 when active.
       The transition list also carries the shared press transform (unlayered
       component CSS would otherwise clobber the layered press transition). */
    .nav-btn {
      width: 48px;
      height: 40px;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        width var(--d-small) var(--e-emph),
        transform var(--d-press) var(--e-emph);
    }

    .nav-btn.active {
      width: 52px;
    }

    .nav-icon {
      color: var(--color-mut);
      transition: color var(--d-small) var(--e-emph);
    }

    .nav-btn.active .nav-icon {
      color: var(--color-onPrimC);
    }

    .nav-btn.pop .nav-icon {
      animation: navPop var(--d-medium) var(--e-spring);
    }

    @keyframes navPop {
      0% {
        transform: scale(1);
      }
      45% {
        transform: scale(1.15);
      }
      100% {
        transform: scale(1);
      }
    }
  `,
  templateUrl: './navbar.html',
})
export class Navbar implements OnDestroy {
  private readonly router = inject(Router);
  private readonly routerSub: Subscription;

  protected readonly activeIndex = signal(0);

  private readonly buttons = viewChildren('navBtn', { read: ElementRef });
  private readonly navInd = viewChild('navInd', { read: ElementRef });

  private firstPlacement = true;
  private settleTimer = 0;

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.syncActive();
    });
    this.syncActive();

    // Indicator placement + icon pop only when the active section changes. Reading
    // the refs here also re-runs this effect once the view (and the refs) exist.
    effect(() => {
      const index = this.activeIndex();
      const ready = this.buttons().length > 0 && this.navInd() != null;
      untracked(() => {
        if (!ready) return;
        const first = this.firstPlacement;
        this.firstPlacement = false;
        this.placeIndicator(!first);
        if (!first) this.popIcon(index);
      });
    });

    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
    window.removeEventListener('resize', this.onResize);
    clearTimeout(this.settleTimer);
  }

  private readonly onResize = (): void => {
    this.placeIndicator(false);
  };

  private syncActive(): void {
    const path = this.router.url.split('?')[0].split('#')[0];
    const found = NAV_PATHS.findIndex((route) => (route === '/' ? path === '/' : path === route || path.startsWith(`${route}/`)));
    this.activeIndex.set(found >= 0 ? found : 0);
  }

  /**
   * Place the indicator pill on the active button. Animate = slide (400ms --e-spring)
   * + indStretch width bulge (450ms --e-emph). The buttons' 48→52px width transition
   * is still settling at call time, so an animated placement schedules one exact
   * no-animation re-place after it completes (resize re-places without animation).
   */
  private placeIndicator(animate: boolean): void {
    clearTimeout(this.settleTimer);
    const btn = this.buttons()[this.activeIndex()]?.nativeElement as HTMLElement | undefined;
    const ind = this.navInd()?.nativeElement as HTMLElement | undefined;
    if (btn == null || ind == null) return;

    ind.style.setProperty('--x', `${btn.offsetLeft}px`);
    if (!animate || prefersReducedMotion()) return;

    ind.classList.remove('stretch');
    void ind.offsetWidth; // restart the width flight
    ind.classList.add('stretch');
    this.settleTimer = window.setTimeout(() => this.placeIndicator(false), SETTLE_MS);
  }

  private popIcon(index: number): void {
    if (prefersReducedMotion()) return;
    const btn = this.buttons()[index]?.nativeElement as HTMLElement | undefined;
    if (btn == null) return;
    btn.classList.remove('pop');
    void btn.offsetWidth;
    btn.classList.add('pop');
  }
}
