import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, OnDestroy, signal, untracked, viewChild, viewChildren } from '@angular/core';

import { Status } from '../../data/status';
import { prefersReducedMotion } from '../../shared/motion';

/* ONE shared status pill (design D13, specs/design-system): one component, one
   `variant × status` color map — no per-page copies of the pill markup or fill map.
   - `card`  (on surfC cards, tonal)  — ok bg-okC/onOkC · in-scadenza bg-waC/onWaC · scaduto bg-errC/onErrC
   - `hero` / `badge` (on the tinted hero container — ≥3:1 fill contrast) —
     ok bg-onOkC/text-okC · in-scadenza bg-onWaC/text-waC · scaduto bg-err/text-onErr
     (a chip MUST never render a fill equal to its container's fill).
   Text sizes follow ui-drafts/d2-morfosi.html: card 10px, hero 11px, badge 12px.
   The `badge` variant owns the kinetic digit-strip DOM (design D7): the rendered
   text is ALWAYS unpadded ("+230 g" / "tra 12 g" / "oggi", never "+04"), digit
   cells derive from the rendered text (variable count), each digit is a masked
   strip (1.15em cells, 0-9 twice) translating -(10+value)×1.15em, 600ms --d-roll
   --e-spring, 55ms stagger; the settle tick (scale 1→1.08→1) runs on a NESTED
   inner span so it never clobbers the entrance pop. Call playEntrance() at
   route/pane activation (T0): pop T+750ms, rolls T+800ms + stagger, tick ≈80ms
   after the last cell settles. Mid-session text changes SNAP without roll;
   reduced motion renders the final text immediately (no roll, no tick). */

export type StatusChipVariant = 'card' | 'hero' | 'badge';

interface ChipSegment {
  readonly kind: 'text' | 'digit';
  readonly char: string;
  readonly value: number;
}

/** One `variant × status` color map (D13). */
const CARD_CLASSES: Record<Status, string> = {
  'ok': 'bg-okC text-onOkC',
  'in-scadenza': 'bg-waC text-onWaC',
  'scaduto': 'bg-errC text-onErrC',
};

const TINTED_CLASSES: Record<Status, string> = {
  'ok': 'bg-onOkC text-okC',
  'in-scadenza': 'bg-onWaC text-waC',
  'scaduto': 'bg-err text-onErr',
};

const LABELS: Record<Status, string> = {
  'scaduto': 'Scaduto',
  'ok': 'OK',
  'in-scadenza': 'In scadenza',
};

/* Kinetic badge timeline from activation T0 (design D7). JS choreography lives
   here (like runCount's JS easing); the animated CSS uses the named tokens. */
const T_POP_MS = 750; // badge pop starts (550ms = --d-large)
const T_ROLL_MS = 800; // digit strips roll (600ms = --d-roll, stagger --stagger)
const POP_MS = 550; // token --d-large
const ROLL_MS = 600; // token --d-roll
const STAGGER_MS = 55; // token --stagger
const TICK_GAP_MS = 80; // settle tick ≈80ms after the last cell settles

/** Strip of digits 0-9 repeated twice: translate -(10+value)×1.15em lands on the
 *  second occurrence after one full roll (d3 odometer technique). */
const STRIP_CELLS: readonly number[] = Array.from({ length: 20 }, (_, i) => i);

function stripY(value: number): string {
  // lands on the second 0-9 occurrence after one full odometer roll
  return `translateY(${Math.round(-(10 + value) * 1.15 * 100) / 100}em)`;
}

function parseSegments(text: string): ChipSegment[] {
  const out: ChipSegment[] = [];
  let buf = '';
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (buf !== '') {
        out.push({ kind: 'text', char: buf, value: 0 });
        buf = '';
      }
      out.push({ kind: 'digit', char: ch, value: Number(ch) });
    } else {
      buf += ch;
    }
  }
  if (buf !== '') out.push({ kind: 'text', char: buf, value: 0 });
  return out;
}

@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .badge-off { opacity: 0; }
    .badge-pop { animation: badge-pop var(--d-large) var(--e-spring) both; }
    .badge-tick { animation: badge-tick var(--d-medium) var(--e-spring); }
    .tick-wrap { display: inline-flex; align-items: center; }
    .seg { white-space: pre; }
    .digit { display: inline-flex; height: 1.15em; overflow: hidden; vertical-align: bottom; }
    .strip { display: flex; flex-direction: column; }
    .strip > span { display: block; height: 1.15em; line-height: 1.15em; }
    @keyframes badge-pop {
      from { opacity: 0; transform: scale(0.6); }
      70% { opacity: 1; transform: scale(1.03); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes badge-tick {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
  `,
  template: `
    @if (variant() === 'badge') {
      <span #pill [class]="pillClasses()">
        <span class="sr-only">{{ renderedText() }}</span>
        <span class="tick-wrap" [class.badge-tick]="tickOn()" aria-hidden="true">
          @for (seg of segments(); track seg) {
            @if (seg.kind === 'digit') {
              <span class="digit">
                <!-- data-value lives ON THE STRIP: playEntrance() rolls the strip to
                     stripY(dataset.value) and reads it from this element. -->
                <span #strip class="strip" [attr.data-value]="seg.value" [style.transform]="stripY(seg.value)">
                  @for (cell of cells; track cell) {
                    <span>{{ cell % 10 }}</span>
                  }
                </span>
              </span>
            } @else {
              <span class="seg">{{ seg.char }}</span>
            }
          }
        </span>
      </span>
    } @else {
      <span [class]="pillClasses()">{{ renderedText() }}</span>
    }
  `,
})
export class StatusChip implements OnDestroy {
  readonly status = input.required<Status>();
  readonly variant = input<StatusChipVariant>('card');
  /** Rendered text override. Badge: the unpadded countdown ("+230 g" / "tra 12 g" / "oggi"). */
  readonly text = input<string>('');

  protected readonly cells = STRIP_CELLS;
  protected readonly stripY = stripY;

  /** Hidden → pop phase of the badge entrance (empty for card/hero). */
  protected readonly phase = signal<'badge-off' | 'badge-pop' | ''>('');
  protected readonly tickOn = signal(false);

  private readonly pillRef = viewChild('pill', { read: ElementRef });
  private readonly stripRefs = viewChildren('strip', { read: ElementRef });
  private timers: ReturnType<typeof setTimeout>[] = [];
  private firstChange = true;

  constructor() {
    // Mid-session value/status changes (hero swap) snap: drop any in-flight
    // entrance choreography; the fresh digit strips render at their targets.
    effect(() => {
      const key = `${this.status()}|${this.renderedText()}`;
      untracked(() => {
        if (this.firstChange) {
          this.firstChange = false;
          return;
        }
        this.stopTimeline();
      });
    });
  }

  protected readonly renderedText = computed((): string => this.text() || LABELS[this.status()]);

  protected readonly segments = computed((): ChipSegment[] => parseSegments(this.renderedText()));

  protected readonly pillClasses = computed((): string => {
    const status = this.status();
    const base =
      this.variant() === 'card'
        ? 'px-2.5 py-1 rounded-full t-caption whitespace-nowrap'
        : this.variant() === 'hero'
          ? 'px-3 py-1 rounded-full t-meta font-bold whitespace-nowrap'
          : 'px-2.5 py-1 rounded-full t-label font-extrabold shadow-fab inline-flex items-center';
    const colors = this.variant() === 'card' ? CARD_CLASSES[status] : TINTED_CLASSES[status];
    return `${base} ${colors} ${this.phase()}`.trim();
  });

  /**
   * Kinetic entrance from activation T0 (design D7): pop T+750ms, digit rolls
   * T+800ms + 55ms stagger, settle tick ≈80ms after the last cell settles
   * ("oggi" has no digit cells: pop + tick only). Reduced motion: final text
   * immediately. Mid-session text changes snap without roll (see the effect).
   */
  playEntrance(): void {
    this.stopTimeline();
    if (this.variant() !== 'badge') return;

    const strips = this.stripRefs().map((ref) => ref.nativeElement as HTMLElement);
    const n = strips.length;

    if (prefersReducedMotion()) return;

    // Roll from a full odometer loop: reset to cell "0" without transition.
    for (const s of strips) {
      s.style.transition = 'none';
      s.style.transform = 'translateY(0)';
    }
    void this.pillRef()?.nativeElement.offsetHeight;

    this.phase.set('badge-off'); // hidden until the pop
    this.timers.push(setTimeout(() => this.phase.set('badge-pop'), T_POP_MS));

    strips.forEach((s, i) => {
      this.timers.push(
        setTimeout(() => {
          s.style.transition = 'transform var(--d-roll) var(--e-spring)';
          // Roll to the strip's own digit (data-value is bound on the strip element).
          s.style.transform = stripY(Number(s.dataset['value'] ?? 0));
        }, T_ROLL_MS + i * STAGGER_MS),
      );
    });

    const settle = n > 0 ? T_ROLL_MS + (n - 1) * STAGGER_MS + ROLL_MS : T_POP_MS + POP_MS;
    this.timers.push(setTimeout(() => this.tickOn.set(true), settle + TICK_GAP_MS));
  }

  ngOnDestroy(): void {
    this.stopTimeline();
  }

  private stopTimeline(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.phase.set('');
    this.tickOn.set(false);
  }
}
