import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';

import { TextField, TextFieldOption } from '../text-field/text-field';
import { parseNumber, todayIso } from '../../data/format';
import { StoreService } from '../../data/store';
import { prefersReducedMotion } from '../../shared/motion';

/* Circular FAB with the M3E press shape morph + the FAB→sheet morph (design D4/D12,
   specs/app-shell; mirrors `.morph` / `openFab` / `closeFab` of ui-drafts/d2-morfosi.html).
   Press morph: while :active the circle eases to a squircle under the shared
   scale(.97) press layer and springs back. Morph: one mounted overlay container
   starts at the FAB circle geometry and transitions left/right/bottom/height/
   border-radius/background-color/box-shadow to the full sheet (550ms --e-spring;
   close 450ms --e-exit); the inner form is pinned to its FINAL screen position
   (--morph-drift compensates the center drift), so the expanding window reveals
   planted content; the + icon rotates out; the scrim fades 400ms. Angular survival:
   the overlay stays mounted with pointer-events: none + inert for >=450ms
   (--d-exit-flight) after close begins before being unrendered — never torn down
   mid-transition. Dialog a11y: role=dialog + aria-modal, focus into the sheet,
   Tab trap, Escape closes, focus restored to the FAB. Reduced motion = no morph:
   the sheet opens and closes instantly (the CSS clamp kills every transition).

   The form (per specs/activities, rifiniture-e D5) lays out its fields per expected
   input length in one `grid grid-cols-2 gap-4` (Attività and Luogo full-width, the
   other pairs half/half; half values truncate in their flex-1 min-w-0 slot) with the
   mockup footer pair ("Annulla" auto-width, "Registra" flex-1). Validation and save
   are unchanged: ISO date + numeric km required, submit disabled otherwise; saving
   creates the same history entry + lastDone update as the one-tap quick registra. */

/** Overlay stays mounted this long after close begins before unmounting (--d-exit-flight). */
const EXIT_MS = 450;

@Component({
  selector: 'app-fab',
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  styles: `
    /* FAB press shape morph: circle → squircle while pressed (design D4) */
    .fab-btn {
      border-radius: 50%;
      transition:
        transform var(--d-press) var(--e-emph),
        border-radius var(--d-small) var(--e-spring),
        opacity var(--d-fade) var(--e-emph);
    }

    .fab-btn:active {
      border-radius: 30%;
    }

    .fab-hidden {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    /* ── FAB→sheet morph (design D4): the container IS the FAB circle at rest and
          the sheet when .open — geometry properties transition between the two. ── */
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

    .morph {
      position: absolute;
      left: calc(100% - max(1rem, 50% - 199px) - 56px);
      right: max(1rem, 50% - 199px);
      bottom: 6rem; /* FAB bottom-24 */
      height: 56px;
      border-radius: 9999px;
      background-color: var(--color-primC);
      color: var(--color-onPrimC);
      overflow: hidden;
      box-shadow: var(--shadow-fab);
      transition:
        left var(--d-exit-flight) var(--e-exit),
        right var(--d-exit-flight) var(--e-exit),
        bottom var(--d-exit-flight) var(--e-exit),
        height var(--d-exit-flight) var(--e-exit),
        border-radius var(--d-exit-flight) var(--e-exit),
        background-color var(--d-exit-flight) var(--e-exit),
        box-shadow var(--d-exit-flight) var(--e-exit);
    }

    .overlay.open .morph {
      left: max(0px, 50% - 215px); /* full-bleed in the 430px frame */
      right: max(0px, 50% - 215px);
      bottom: 0;
      height: var(--sheet-h, 470px);
      border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
      background-color: var(--color-surfC);
      box-shadow: var(--shadow-sheet);
      transition:
        left var(--d-large) var(--e-spring),
        right var(--d-large) var(--e-spring),
        bottom var(--d-large) var(--e-spring),
        height var(--d-large) var(--e-spring),
        border-radius var(--d-large) var(--e-spring),
        background-color var(--d-large) var(--e-spring),
        box-shadow var(--d-large) var(--e-spring);
    }

    /* Planted content: pinned to its final screen position (the window reveals it) */
    .morph-inner {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: min(430px, var(--morph-w, 430px));
      transform: translateX(calc(-50% - var(--morph-drift, 171px)));
      transition: transform var(--d-exit-flight) var(--e-exit);
    }

    .overlay.open .morph-inner {
      transform: translateX(-50%);
      transition: transform var(--d-large) var(--e-spring);
    }

    .morph-body {
      opacity: 0;
      transform: translateY(12px);
      transition:
        opacity var(--d-fade) var(--e-exit),
        transform var(--d-fade) var(--e-exit);
    }

    .overlay.open .morph-body {
      opacity: 1;
      transform: none;
      transition:
        opacity var(--d-fade) var(--e-emph) var(--d-content-delay),
        transform var(--d-fade) var(--e-emph) var(--d-content-delay);
    }

    .morph-plus {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 24px;
      height: 24px;
      opacity: 1;
      transform: rotate(0deg) scale(1);
      transition:
        opacity var(--d-small) var(--e-exit),
        transform var(--d-small) var(--e-exit);
    }

    .overlay.open .morph-plus {
      opacity: 0;
      transform: rotate(90deg) scale(0.6);
      transition:
        opacity var(--d-small) var(--e-emph),
        transform var(--d-fade) var(--e-spring);
    }
  `,
  template: `
    <button
      #fabBtn
      type="button"
      aria-label="Nuova registrazione"
      (click)="open()"
      class="press fab-btn fixed z-40 bottom-24 w-14 h-14 bg-primC text-onPrimC shadow-fab flex items-center justify-center right-[max(1rem,calc(50%_-_199px))]"
      [class.fab-hidden]="mounted()"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
    </button>

    <!-- Overlay mounted from open until >=450ms after close begins (design D4) -->
    @if (mounted()) {
      <div #overlay class="overlay fixed inset-0 z-50" [class.open]="isOpen()" [attr.inert]="isOpen() ? null : ''">
        <div class="scrim absolute inset-0 bg-black/70" (click)="close()"></div>
        <div #dialog class="morph" tabindex="-1" role="dialog" aria-modal="true" aria-label="Nuova registrazione">
          <svg class="morph-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          <div class="morph-inner">
            <form #morphBody class="morph-body px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]" (submit)="save($event)">
              <div class="w-9 h-1 rounded-full bg-outline mx-auto"></div>
              <p class="mt-4 t-card-title text-onSurf">Nuova registrazione</p>

              <!-- Griglia per lunghezza attesa (rifiniture-e D5): full · mezza+mezza ·
                   full · mezza+mezza — stacco costante di 16px in entrambe le direzioni -->
              <div class="mt-4 grid grid-cols-2 gap-4">
                <app-text-field
                  class="col-span-2"
                  label="Attività"
                  [value]="activityValue()"
                  [options]="activityOptions()"
                  (valueChange)="onActivityId($event)"
                />
                <app-text-field
                  label="Data"
                  type="date"
                  [value]="date()"
                  (valueChange)="onDate($event)"
                />
                <app-text-field
                  label="Chilometraggio"
                  inputmode="numeric"
                  suffix="km"
                  commitOn="input"
                  [value]="km()"
                  (valueChange)="onKm($event)"
                />
                <app-text-field
                  class="col-span-2"
                  label="Luogo"
                  commitOn="input"
                  [value]="place()"
                  (valueChange)="onPlace($event)"
                />
                <app-text-field
                  label="Costo"
                  ariaLabel="Costo in euro"
                  inputmode="decimal"
                  suffix="€"
                  commitOn="input"
                  [value]="cost()"
                  (valueChange)="onCost($event)"
                />
                <app-text-field
                  label="Durata"
                  ariaLabel="Durata in ore"
                  inputmode="decimal"
                  suffix="h"
                  commitOn="input"
                  [value]="duration()"
                  (valueChange)="onDuration($event)"
                />
              </div>

              <div class="mt-5 flex items-center gap-3">
                <!-- Annulla auto-width, Registra flex-1 (rifiniture-e D5) -->
                <button type="button" (click)="close()" class="btn btn-text h-12 px-6">Annulla</button>
                <button type="submit" class="btn btn-filled flex-1" [disabled]="!valid()">Registra</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class Fab implements OnDestroy {
  private readonly store = inject(StoreService);
  private readonly injector = inject(Injector);

  protected readonly mounted = signal(false);
  protected readonly isOpen = signal(false);

  protected readonly activities = computed(() => [...this.store.activities()].sort((a, b) => a.id - b.id));
  protected readonly activityOptions = computed<TextFieldOption[]>(() => this.activities().map((activity) => ({ value: String(activity.id), label: activity.title })));

  protected readonly activityId = signal<number | null>(null);
  /** String projection for the select field's [value] (templates can't call String()). */
  protected readonly activityValue = computed(() => (this.activityId() != null ? String(this.activityId()) : ''));
  protected readonly date = signal('');
  protected readonly km = signal('');
  protected readonly place = signal('');
  protected readonly cost = signal('');
  protected readonly duration = signal('');

  protected readonly valid = computed(
    () =>
      this.activityId() != null &&
      parseNumber(this.km()) != null &&
      /^\d{4}-\d{2}-\d{2}$/.test(this.date()), // cleared date ⇒ invalid, never persist ''
  );

  /** The morph container doubles as the dialog surface (geometry + focus target). */
  private readonly fabBtnRef = viewChild('fabBtn', { read: ElementRef });
  private readonly dialogRef = viewChild('dialog', { read: ElementRef });
  private readonly bodyRef = viewChild('morphBody', { read: ElementRef });
  private readonly overlayRef = viewChild('overlay', { read: ElementRef });

  private closeTimer = 0;

  ngOnDestroy(): void {
    this.stopCloseTimer();
  }

  protected open(): void {
    if (this.isOpen()) return;
    this.stopCloseTimer();

    this.activityId.set(this.activities()[0]?.id ?? null);
    this.date.set(todayIso());
    this.km.set(String(this.store.vehicle().odometerKm));
    this.place.set('');
    this.cost.set('');
    this.duration.set('');

    this.mounted.set(true);

    // Mount at the closed (FAB circle) geometry first: measuring forces that style
    // recalc, then .open transitions left/right/bottom/height/radius/bg/shadow.
    afterNextRender(
      () => {
        this.measureMorph();
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
    this.stopCloseTimer();

    if (prefersReducedMotion()) {
      this.mounted.set(false);
      this.restoreTriggerFocus();
      return;
    }
    // The overlay stays mounted (inert) for the whole exit flight before unmounting.
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = 0;
      if (this.isOpen()) return;
      this.mounted.set(false);
      this.restoreTriggerFocus();
    }, EXIT_MS);
  }

  protected save(event: Event): void {
    event.preventDefault();
    const activityId = this.activityId();
    const odometerKm = parseNumber(this.km());
    if (activityId == null || odometerKm == null || !/^\d{4}-\d{2}-\d{2}$/.test(this.date())) return;

    const cost = parseNumber(this.cost());
    const duration = parseNumber(this.duration());
    this.store.registerActivity(activityId, {
      date: this.date(),
      odometerKm,
      place: this.place(),
      ...(cost != null ? { costEur: cost } : {}),
      ...(duration != null ? { durationHours: duration } : {}),
    });
    this.close();
  }

  protected onActivityId(value: string): void {
    const id = Number(value);
    this.activityId.set(Number.isFinite(id) ? id : null);
  }

  protected onDate(value: string): void {
    this.date.set(value);
  }

  protected onKm(value: string): void {
    this.km.set(value);
  }

  protected onPlace(value: string): void {
    this.place.set(value);
  }

  protected onCost(value: string): void {
    this.cost.set(value);
  }

  protected onDuration(value: string): void {
    this.duration.set(value);
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

  /** Geometry + planted-content offsets for the morph (exact at any viewport width). */
  private measureMorph(): void {
    const morph = this.dialogRef()?.nativeElement as HTMLElement | undefined;
    const body = this.bodyRef()?.nativeElement as HTMLElement | undefined;
    const overlay = this.overlayRef()?.nativeElement as HTMLElement | undefined;
    if (morph == null || body == null || overlay == null) return;
    const width = Math.min(430, overlay.clientWidth);
    morph.style.setProperty('--morph-w', `${width}px`);
    void morph.offsetWidth; // settle the content width before measuring its height
    morph.style.setProperty('--sheet-h', `${body.offsetHeight}px`);
    // --morph-drift pins the planted form to its FINAL screen position: when open the
    // morph spans the frame and the form rests at the overlay center, so the closed
    // geometry must shift it back by morphCenterX − overlayCenterX. (The 171px CSS
    // default is the 430px-viewport value kept for first paint.)
    const morphCenterX = morph.getBoundingClientRect().left + morph.offsetWidth / 2;
    morph.style.setProperty('--morph-drift', `${morphCenterX - overlay.clientWidth / 2}px`);
  }

  private stopCloseTimer(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = 0;
  }

  private restoreTriggerFocus(): void {
    // Focus is always restored to the FAB trigger (specs/app-shell).
    this.fabBtnRef()?.nativeElement.focus();
  }
}
