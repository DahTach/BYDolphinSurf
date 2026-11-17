import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { Fab } from './components/fab/fab';
import { Navbar } from './components/navbar/navbar';
import { SettingsSheet } from './components/settings-sheet/settings-sheet';
import { prefersReducedMotion } from './shared/motion';
import { UpdateService } from './services/update.service';

/* App shell (design D8/D11, specs/app-shell):
   - Scroll-aware header (d3 cherry-pick): `sticky top-0` inside the 430px frame,
     condensed by one progress value `--cond` = clamp(scrollY / 96, 0, 1) written
     from a rAF-throttled passive window-scroll listener (the app scrolls on the
     window). CSS calc() fans it out: avatar scale 1→0.85, title scale/translate,
     spec chip dim, surf/80 blur bar fade-in. No transitions on the interpolated
     props (cursor-locked, fully reversible). Reduced motion = instant swap at the
     96px threshold. Listener + rAF cleaned up on destroy.
   - Route transition (D11): the incoming routed page slides +12px → 0 with fade
     (400ms --e-emph) on real route (component) changes — the outgoing page swaps
     immediately since the router destroys it (incoming-only). Fragment-only
     navigations (e.g. #veicolo) reuse the component and play nothing. */

/** Condensation distance of the header (design D8). */
const COND_PX = 96;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Fab, SettingsSheet],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .frame {
      --cond: 0;
    }

    /* Cursor-locked condensation: no transitions on the interpolated props */
    .cond-bar {
      opacity: var(--cond);
    }

    .cond-avatar {
      transform: scale(calc(1 - 0.15 * var(--cond)));
    }

    .cond-title {
      transform: scale(calc(1 - 0.05 * var(--cond))) translateX(calc(2px * var(--cond)));
      transform-origin: left;
    }

    .cond-chip {
      opacity: calc(1 - 0.35 * var(--cond));
    }

    /* Incoming-only route transition (design D11) */
    .route-pane.route-in {
      animation: paneIn var(--d-medium) var(--e-emph) both;
    }

    @keyframes paneIn {
      from {
        opacity: 0;
        transform: translateX(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  private readonly router = inject(Router);
  /** Self-updating PWA: starts the ngsw update flow (update.service.ts). */
  private readonly update = inject(UpdateService);
  private readonly routerSub: Subscription;

  private readonly frame = viewChild('frame', { read: ElementRef });
  private readonly pane = viewChild('routePane', { read: ElementRef });

  private rafId = 0;
  private lastRoute: unknown = null;

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const route = this.router.routerState.snapshot.root.firstChild?.routeConfig ?? null;
      // Only a real route swap plays the transition (fragment/query-only changes don't).
      if (route !== this.lastRoute) {
        this.lastRoute = route;
        this.replayRouteIn();
      }
      this.updateCond(); // route changes land at the top of the frame
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll);
    this.updateCond();
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    cancelAnimationFrame(this.rafId);
  }

  private readonly onScroll = (): void => {
    if (this.rafId !== 0) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.updateCond();
    });
  };

  /** One custom property per frame (design D8). Reduced motion = threshold swap. */
  private updateCond(): void {
    const frame = this.frame()?.nativeElement as HTMLElement | undefined;
    if (frame == null) return;
    const y = window.scrollY;
    const p = prefersReducedMotion() ? (y >= COND_PX ? 1 : 0) : Math.min(1, Math.max(0, y / COND_PX));
    frame.style.setProperty('--cond', p.toFixed(3));
  }

  private replayRouteIn(): void {
    const pane = this.pane()?.nativeElement as HTMLElement | undefined;
    if (pane == null) return;
    pane.classList.remove('route-in');
    void pane.offsetWidth;
    pane.classList.add('route-in');
  }
}
