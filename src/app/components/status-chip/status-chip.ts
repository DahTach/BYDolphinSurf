import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Status } from '../../data/status';

/* ONE shared status pill (design D13, specs/design-system): one component, one
   `status` TEXT map — no per-page copies of the pill markup or colour map.
   Palette proposta (h1-proposta-m3e): warm-white-on-black, UNA tinta, and colour
   lives ONLY in the text — every chip (card + hero) is a neutral container
   (bg-white/[0.08], no border, no dot) and the label is:
   - scaduto = terracotta (text-err);
   - ok / "in regola" / "in scadenza" = creme (text-prim).
   Same rule as the timeline fill, the countdown text and the hero CTA, so the
   card never tints its surface; the amber micro-icon now lives only in the
   "In sintesi" rows.
   Text sizes follow ui-drafts/d2-morfosi.html: card 10px, hero 11px. */

export type StatusChipVariant = 'card' | 'hero';

/** Status → text colour only (D13). Retint rides --e-fx (colour transition). */
const TEXT_CLASSES: Record<Status, string> = {
  'ok': 'text-prim',
  'in-scadenza': 'text-prim',
  'scaduto': 'text-err',
};

const LABELS: Record<Status, string> = {
  'scaduto': 'Scaduto',
  'ok': 'OK',
  'in-scadenza': 'In scadenza',
};

@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    /* Retint (status change / hero swap) rides the M3E effects curve --e-fx:
       text colour only, 250ms --d-small (the spatial curves stay out). */
    .pill {
      transition: color var(--d-small) var(--e-fx);
    }
  `,
  template: `
    <span [class]="pillClasses()">{{ renderedText() }}</span>
  `,
})
export class StatusChip {
  readonly status = input.required<Status>();
  readonly variant = input<StatusChipVariant>('card');
  /** Rendered text override ("tra 12 g" / "oggi" / "scad. dal 20/08"). */
  readonly text = input<string>('');

  protected readonly renderedText = computed((): string => this.text() || LABELS[this.status()]);

  /** Neutral container + status-coloured text — the only colour rule left. */
  protected readonly pillClasses = computed((): string => {
    const base =
      this.variant() === 'card'
        ? 'pill bg-white/[0.08] px-2.5 py-1 rounded-full t-caption whitespace-nowrap inline-flex items-center gap-1.5'
        : 'pill bg-white/[0.08] px-3 py-1 rounded-full t-meta font-bold whitespace-nowrap inline-flex items-center gap-1.5';
    return `${base} ${TEXT_CLASSES[this.status()]}`;
  });
}
