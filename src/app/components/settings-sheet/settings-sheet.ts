import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { StoreService } from '../../data/store';
import { prefersReducedMotion } from '../../shared/motion';

/* Settings bottom sheet (design D12, specs/app-shell; mirrors the `.sheet` block of
   ui-drafts/d2-morfosi.html). Opened by the header gear in app.html. Spring slide-up
   translateY(100%)→0 550ms --e-spring / close 450ms --e-exit + scrim fade 400ms.
   Rows sit on the shared `.mrow` pill base with state layers and the press radius
   morph. (1) "Ripristina dati iniziali" — first tap swaps the row to the inline
   confirm "Confermi il ripristino?" with Annulla/Conferma text buttons; Conferma
   calls store.resetToSeed() and closes. (2) "Consegna e consumo" — closes and
   navigates to the Cruscotto vehicle fields (fragment veicolo).
   Dialog a11y: role=dialog + aria-modal, focus into the sheet, Tab trap, Escape
   closes, focus restored to the gear. The sheet stays mounted (inert,
   pointer-events: none) until the exit completes before unmounting. */

/** The sheet stays mounted this long after close begins before unmounting (--d-exit-flight). */
const EXIT_MS = 450;

@Component({
  selector: 'app-settings-sheet',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  styles: `
    .overlay {
      pointer-events: none;
    }

    .overlay.open {
      pointer-events: auto;
    }

    .scrim {
      opacity: 0;
      transition: opacity var(--d-medium) var(--e-emph);
    }

    .overlay.open .scrim {
      opacity: 1;
    }

    .sheet {
      transform: translateY(100%);
      transition: transform var(--d-exit-flight) var(--e-exit);
    }

    .overlay.open .sheet {
      transform: translateY(0);
      transition: transform var(--d-large) var(--e-spring);
    }
  `,
  template: `
    @if (mounted()) {
      <div #overlay class="overlay fixed inset-0 z-50" [class.open]="isOpen()" [attr.inert]="isOpen() ? null : ''">
        <div class="scrim absolute inset-0 bg-black/70" (click)="close()"></div>
        <div class="absolute inset-x-0 bottom-0">
          <div class="mx-auto max-w-[430px]">
            <div
              #dialog
              class="sheet bg-surfC rounded-t-sheet shadow-sheet px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-1"
              tabindex="-1"
              role="dialog"
              aria-modal="true"
              aria-label="Impostazioni"
            >
              <div class="w-9 h-1 rounded-full bg-outline mx-auto"></div>
              <p class="t-card-title text-onSurf pb-2">Impostazioni</p>

              @if (!confirming()) {
                <button type="button" (click)="confirming.set(true)" class="mrow press w-full flex items-center gap-3 py-3 text-left">
                  <span class="w-9 h-9 rounded-full bg-surfHi flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-onSurfV" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>
                  </span>
                  <span class="flex-1">
                    <span class="block t-body font-semibold text-onSurf">Ripristina dati iniziali</span>
                    <span class="block t-meta text-mut">Torna al seed di consegna (conferma richiesta)</span>
                  </span>
                </button>
              } @else {
                <div class="w-full flex items-center gap-3 py-3">
                  <span class="w-9 h-9 rounded-full bg-surfHi flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-onSurfV" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>
                  </span>
                  <span class="flex-1">
                    <span class="block t-body font-semibold text-onSurf">Confermi il ripristino?</span>
                    <span class="block t-meta text-mut">Torna al seed di consegna</span>
                  </span>
                  <button type="button" (click)="cancelReset()" class="btn btn-text h-10 px-3 shrink-0">Annulla</button>
                  <button type="button" (click)="confirmReset()" class="btn btn-text h-10 px-3 shrink-0 text-err">Conferma</button>
                </div>
              }

              <button type="button" (click)="goToVehicle()" class="mrow press w-full flex items-center gap-3 py-3 text-left">
                <span class="w-9 h-9 rounded-full bg-surfHi flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-onSurfV" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.8 1.7"/></svg>
                </span>
                <span class="flex-1">
                  <span class="block t-body font-semibold text-onSurf">Consegna e consumo</span>
                  <span class="block t-meta text-mut">Modifica i dati base del veicolo</span>
                </span>
              </button>

              <p class="t-meta text-mut pt-3 border-t border-white/[0.06]">BYD Dolphin Surf · tracker v1 · dati solo sul dispositivo</p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SettingsSheet implements OnDestroy {
  private readonly store = inject(StoreService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly mounted = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly confirming = signal(false);

  private readonly dialogRef = viewChild('dialog', { read: ElementRef });

  private restoreFocus: HTMLElement | null = null;
  private closeTimer = 0;

  open(): void {
    if (this.isOpen()) return;
    this.stopCloseTimer();
    this.confirming.set(false);
    this.restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.mounted.set(true);

    // Mount at translateY(100%) first (the measure forces that style recalc), then open.
    afterNextRender(
      () => {
        this.dialogRef()?.nativeElement.getBoundingClientRect();
        this.isOpen.set(true);
        // Focus lands once the .open render has dropped `inert` from the overlay.
        afterNextRender(() => this.dialogRef()?.nativeElement.focus(), { injector: this.injector });
      },
      { injector: this.injector },
    );
  }

  protected close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false); // inert immediately: pointer-events none + unreachable by keyboard
    this.confirming.set(false);
    this.stopCloseTimer();

    if (prefersReducedMotion()) {
      this.mounted.set(false);
      this.restoreTriggerFocus();
      return;
    }
    // The sheet stays mounted (inert) for the whole exit flight before unmounting.
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = 0;
      if (this.isOpen()) return;
      this.mounted.set(false);
      this.restoreTriggerFocus();
    }, EXIT_MS);
  }

  ngOnDestroy(): void {
    this.stopCloseTimer();
  }

  protected cancelReset(): void {
    this.confirming.set(false);
  }

  protected confirmReset(): void {
    this.store.resetToSeed();
    this.close();
  }

  protected goToVehicle(): void {
    this.close();
    this.router.navigate([''], { fragment: 'veicolo' });
  }

  /** Dialog a11y: Escape closes, Tab stays inside the sheet. */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') this.trapTab(event);
  }

  private trapTab(event: KeyboardEvent): void {
    const dialog = this.dialogRef()?.nativeElement as HTMLElement | undefined;
    if (dialog == null) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  private stopCloseTimer(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = 0;
  }

  private restoreTriggerFocus(): void {
    const trigger = this.restoreFocus;
    this.restoreFocus = null;
    if (trigger != null && trigger.isConnected) trigger.focus();
  }
}
