import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/* Shared MD3 filled pill text field (design D14, specs/design-system + vehicle-data):
   rounded-full container — no bottom indicator, no squared corners. rest = bg-surfHiX
   + floating label 10px semibold text-onSurfV; focus-within = bg-surfHi + 2px prim
   ring that scales in from 1.06 over 250ms --e-spring (d2 .field focus block) with
   the label turning bold text-prim (250ms --e-emph, container bg 250ms --e-emph).
   The ring lives on ::before so ::after stays free for the shared .press state
   layer (specs/design-system: text fields are in the press set). Input 16px
   `field` role font-medium with optional trailing suffix (label 12px, shrink-0);
   the value sits in a `flex-1 min-w-0` slot so long values truncate instead of
   overflowing half-width columns (rifiniture-e D5). With
   `options` it renders a filled select with chevron — appearance-none + the global
   color-scheme: dark make the native popup dark (no dropdown lib).
   Single source of MD3 anatomy for the 3 Cruscotto vehicle fields AND the
   FAB-sheet fields. No forms library — the raw input value is emitted via
   valueChange on the native event chosen by commitOn ('change' = on commit,
   'input' = per keystroke). */

export interface TextFieldOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-text-field',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .field {
      position: relative;
      background-color: var(--color-surfHiX);
      transition:
        background-color var(--d-small) var(--e-emph),
        transform var(--d-press) var(--e-emph);
    }
    .field::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 2px var(--color-prim);
      opacity: 0;
      transform: scale(1.06);
      transition:
        opacity var(--d-small) var(--e-spring),
        transform var(--d-small) var(--e-spring);
      pointer-events: none;
    }
    .field:focus-within {
      background-color: var(--color-surfHi);
    }
    .field:focus-within::before {
      opacity: 1;
      transform: scale(1);
    }
    .field-label {
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
      color: var(--color-onSurfV);
      transition: color var(--d-small) var(--e-emph);
    }
    .field:focus-within .field-label {
      font-weight: 700;
      color: var(--color-prim);
    }
    .field-input {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-onSurf);
    }
    .field-suffix {
      font-size: 12px;
      color: var(--color-onSurfV);
    }
  `,
  template: `
    <div class="field press h-14 rounded-full px-5 pt-2">
      <p class="field-label">{{ label() }}</p>
      @if (options().length > 0) {
        <div class="flex items-center justify-between gap-2 mt-1">
          <select
            [attr.aria-label]="ariaLabel() || label()"
            class="field-input flex-1 min-w-0 appearance-none bg-transparent p-0 focus:outline-none"
            (change)="emitValue($event)"
          >
            @for (option of options(); track option.value) {
              <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
            }
          </select>
          <svg class="w-4 h-4 text-onSurfV shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      } @else {
        <div class="flex items-baseline gap-2 mt-1">
          <input
            [attr.aria-label]="ariaLabel() || label()"
            [type]="type()"
            [attr.inputmode]="inputmode()"
            [value]="value()"
            (input)="emitValue($event)"
            (change)="emitValue($event)"
            class="field-input flex-1 min-w-0 bg-transparent p-0 focus:outline-none"
          />
          @if (suffix(); as suffix) {
            <span class="field-suffix shrink-0">{{ suffix }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class TextField {
  readonly label = input.required<string>();
  readonly value = input<string>('');
  readonly type = input<string>('text');
  readonly inputmode = input<'numeric' | 'decimal' | 'text' | undefined>(undefined);
  readonly suffix = input<string>('');
  /** Overrides the accessible name when it differs from the visible label (FAB: "Costo in euro"). */
  readonly ariaLabel = input<string>('');
  /** When non-empty the field renders as a filled select with chevron (design D8). */
  readonly options = input<TextFieldOption[]>([]);
  /** Native event driving valueChange: 'change' commits on blur/Enter, 'input' per keystroke. Selects (with `options`) always commit on `change`. */
  readonly commitOn = input<'change' | 'input'>('change');

  readonly valueChange = output<string>();

  protected emitValue(event: Event): void {
    // <select> only fires `change` (no per-keystroke `input`): options force
    // `change` semantics regardless of commitOn, so the field always emits.
    const commitEvent = this.options().length > 0 ? 'change' : this.commitOn();
    if (event.type !== commitEvent) return;
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
