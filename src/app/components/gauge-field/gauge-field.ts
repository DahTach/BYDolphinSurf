import { ChangeDetectionStrategy, Component, computed, input, output, signal, viewChild } from '@angular/core';

import { WavyProgress } from '../wavy-progress/wavy-progress';

/* Editable Onda M3E gauge field (the gemini vehicle maintenance card): one
   `app-wavy-progress` ring (shape="ring", ONE geometry at two box tiers via the
   shared `size` input — 120 hero / 100 sides) with the EDITABLE value centered
   inside the ring — a transparent `type="text"` input (tabular, font-black,
   22px hero / 18px sides, no spinners possible) — over a 10px derived sub-line,
   and the label under the gauge.

   The label pill IS the focus indicator (gemini's label pill promoted to an
   edit affordance): focused = `bg-secC text-onSecC rounded-full px-3 py-1`,
   plain `text-mut` otherwise. The pill padding is always reserved so the row
   never shifts; only bg/colour transition (250ms --e-emph).

   Commit semantics mirror the shared text-field (`change` = on commit):
   `valueChange` emits the raw string and the parent store handlers decide.
   Signals are synchronous, so right after the emit `value()` tells whether the
   commit landed: a rejected (garbage) or reformattable commit reverts the DOM
   text to the formatted store value immediately; `(blur)` re-syncs as a second
   net. The ring's own contract stays untouched: entrance fill via `playFill()`
   (activation-only, the dashboard orchestrates), 250ms data-edit transitions,
   reduced-motion static. */

@Component({
  selector: 'app-gauge-field',
  imports: [WavyProgress],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .gauge-value {
      /* type="text" + inputmode keeps numeric keyboards WITHOUT spinners */
      transition: color var(--d-small) var(--e-emph);
    }

    .gauge-label {
      transition:
        background-color var(--d-small) var(--e-emph),
        color var(--d-small) var(--e-emph);
    }
  `,
  template: `
    <div class="flex flex-col items-center">
      <div class="relative" [style.width.px]="size()" [style.height.px]="size()">
        <app-wavy-progress #wave shape="ring" [value]="percent()" [size]="size()" fill="stroke-prim" />
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2">
          <input
            class="gauge-value w-full min-w-0 bg-transparent border-0 p-0 text-center font-black tabular-nums text-onSurf outline-none whitespace-nowrap"
            [style.font-size.px]="large() ? 22 : 18"
            type="text"
            autocomplete="off"
            spellcheck="false"
            [attr.inputmode]="inputmode()"
            [attr.aria-label]="label()"
            [value]="value()"
            (focus)="focused.set(true)"
            (blur)="focused.set(false); syncValue($event)"
            (change)="commit($event)"
          />
          <p class="t-caption font-medium leading-none text-mut tabular-nums whitespace-nowrap">{{ sub() }}</p>
        </div>
      </div>
      <span
        class="gauge-label mt-2 rounded-full px-3 py-1 t-meta font-medium whitespace-nowrap"
        [class]="focused() ? 'bg-secC text-onSecC' : 'text-mut'"
        >{{ label() }}</span
      >
    </div>
  `,
})
export class GaugeField {
  /** Gauge label under the ring — doubles as the input's accessible name. */
  readonly label = input.required<string>();
  /** Formatted display value (e.g. "4.500" / "13,9" / "08/2025"). */
  readonly value = input<string>('');
  /** Derived sub-line under the value, inside the ring (e.g. "/ 5.000 km"). */
  readonly sub = input<string>('');
  /** Ring fill in percent (0–100) — the gauge's honest semantics live in the parent. */
  readonly percent = input<number>(0);
  /** Ring box edge in px: 120 hero tier / 100 side tier (wavy-progress geometry scales). */
  readonly size = input<number>(120);
  /** Mobile keyboard hint (the raw input stays type="text"). */
  readonly inputmode = input<'numeric' | 'decimal' | 'text' | undefined>(undefined);

  /** Raw committed string on `change` (Enter / blur) — the parent validates. */
  readonly valueChange = output<string>();

  protected readonly focused = signal(false);
  /** The 120px hero tier renders the value at 22px, the 100px tier at 18px. */
  protected readonly large = computed(() => this.size() >= 120);

  private readonly wave = viewChild('wave', { read: WavyProgress });

  /** Entrance fill (activation-only) — forwarded to the ring primitive. */
  playFill(): void {
    this.wave()?.playFill();
  }

  protected commit(event: Event): void {
    const el = event.target as HTMLInputElement;
    const before = this.value();
    this.valueChange.emit(el.value);
    // A rejected commit leaves `value()` untouched → revert the raw text right
    // away. A commit that reformats to the same string (e.g. "4500" → "4.500")
    // lands here too and gets its canonical formatting restored.
    if (this.value() !== before) return;
    el.value = before;
  }

  /** Blur safety net: the DOM text always ends on the formatted store value. */
  protected syncValue(event: Event): void {
    (event.target as HTMLInputElement).value = this.value();
  }
}
