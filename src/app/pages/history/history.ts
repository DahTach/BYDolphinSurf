import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, viewChildren } from '@angular/core';

import { formatEur, formatDate, formatHours, formatKm } from '../../data/format';
import { HistoryEntry } from '../../data/model';
import { StoreService } from '../../data/store';
import { playEntrance } from '../../shared/motion';

/* Storico (ui-drafts/b-blade.html §4): pill rows, most recent first, non-interactive
   (resolved ND-5 — no row-tap in v1). Polish: type roles + the staggered `.enter`
   entrance on route activation only (design D11); rows get NO press feedback. */

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './history.html',
})
export class History {
  protected readonly store = inject(StoreService);

  protected readonly entries = computed(() =>
    [...this.store.history()].sort((a, b) => b.date.localeCompare(a.date)),
  );

  /** "09/10/2026 · Garage di casa — 2 h" / "20/08/2025 · Officina Corsi — 80 €" */
  protected meta(entry: HistoryEntry): string {
    const extra = [
      entry.durationHours != null ? formatHours(entry.durationHours) : null,
      entry.costEur != null ? formatEur(entry.costEur) : null,
    ]
      .filter((part) => part != null)
      .join(' · ');
    const place = entry.place !== '' ? ` · ${entry.place}` : '';
    return `${formatDate(entry.date)}${place}${extra !== '' ? ` — ${extra}` : ''}`;
  }

  protected readonly km = (entry: HistoryEntry): string => `${formatKm(entry.odometerKm)} km`;

  private readonly rowBlocks = viewChildren('rowBlock', { read: ElementRef });

  constructor() {
    // Staggered entrance on route activation only (design D11) — data edits that
    // add rows never replay it.
    afterNextRender(() => this.playEntranceOn(this.rowBlocks()));
  }

  /** Replays the `.enter` entrance on `blocks` via the shared playEntrance().
   *  Blocks render `enter in` (revealed), so the replay first snaps them back to
   *  the hidden start state with transitions disabled: a plain class restart on a
   *  revealed block is cancelled by CSS transition retargeting and would be a
   *  no-op. */
  private playEntranceOn(blocks: readonly ElementRef<HTMLElement>[]): void {
    const els = blocks.map((ref) => ref.nativeElement);
    for (const el of els) {
      el.style.transition = 'none';
      el.classList.remove('in');
    }
    if (els.length > 0) void els[0].offsetHeight; // commit the hidden start state without transitioning
    for (const el of els) el.style.transition = '';
    playEntrance(els);
  }
}
