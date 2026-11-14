import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { StatusChip } from '../../components/status-chip/status-chip';
import { formatDate, formatKm, formatMonth, intervalLine, todayIso } from '../../data/format';
import { Activity, Category } from '../../data/model';
import { DerivedStatus, Status, deriveActivityStatus } from '../../data/status';
import { StoreService } from '../../data/store';
import { playEntrance } from '../../shared/motion';

/* Attività (ui-drafts/b-blade.html §3 + refine-cruscotto-md3 design D6): filter chips a
   pillola with computed counts, an optional dismissible `stato` filter chip (from the
   Cruscotto sintesi tiles, AND-combined with the category filter), and the full
   11-activity catalog as draft cards. "Registra" = one-tap quick registra (design D9).
   Chip consolidation (task 5.4): ONE chip pattern for the category chips and the
   `stato` chip — single @for markup + chipClasses() — and the card status chips
   render through the shared app-status-chip (no per-page fill map). */

type ChipKey = 'tutte' | Category;

interface FilterChip {
  key: ChipKey;
  label: string;
  count: number;
}

interface ActivityCard {
  activity: Activity;
  status: Status;
  /** "Ultimo: 09/10/2026 · 4.100 km" / "Prossimo: 08/2027 · 40.000 km" */
  infoLine: string;
}

const STATO_LABELS: Record<Status, string> = {
  'ok': 'In regola',
  'in-scadenza': 'In scadenza',
  'scaduto': 'Scadute',
};

@Component({
  selector: 'app-activities',
  imports: [StatusChip],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './activities.html',
  styles: `
    /* Filter-chip state transitions (d2 .fchip): 250ms --e-emph on
       fill/border/text plus the 140ms --e-emph press transform of the shared
       .press layer — two speeds on one element, like .mcard (design D9). */
    .fchip {
      transition:
        background-color var(--d-small) var(--e-emph),
        border-color var(--d-small) var(--e-emph),
        color var(--d-small) var(--e-emph),
        transform var(--d-press) var(--e-emph);
    }
  `,
})
export class Activities {
  protected readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly selected = signal<ChipKey>('tutte');

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  /** `stato` query param (design D6): null when absent or not a valid status. */
  protected readonly statoFilter = computed<Status | null>(() => {
    const stato = this.queryParamMap().get('stato');
    return stato === 'ok' || stato === 'in-scadenza' || stato === 'scaduto' ? stato : null;
  });

  protected statoLabel(stato: Status): string {
    return STATO_LABELS[stato];
  }

  protected readonly statoCounts = computed<Record<Status, number>>(() => {
    const vehicle = this.store.vehicle();
    const counts: Record<Status, number> = { ok: 0, 'in-scadenza': 0, scaduto: 0 };
    for (const activity of this.store.activities()) counts[deriveActivityStatus(activity, vehicle, this.today).status]++;
    return counts;
  });

  protected clearStato(): void {
    // relativeTo keeps the /attivita URL — without it an empty commands array resolves to root
    this.router.navigate([], { relativeTo: this.route, queryParams: { stato: null } });
  }

  /** Empty-state "Cancella filtro" (specs/activities): removes `stato` and resets
   *  the category to "Tutte", restoring the full list. */
  protected clearFilters(): void {
    this.selected.set('tutte');
    this.router.navigate([], { relativeTo: this.route, queryParams: { stato: null } });
  }

  /** Category filter chips ("Tutte" + the three categories) with counts. */
  protected readonly chips = computed<FilterChip[]>(() => {
    const counts: Record<ChipKey, number> = { tutte: 0, 'setup-iniziale': 0, routine: 0, 'fluidi-officina': 0 };
    for (const activity of this.store.activities()) {
      counts.tutte++;
      counts[activity.category]++;
    }
    return [
      { key: 'tutte', label: 'Tutte', count: counts.tutte },
      { key: 'setup-iniziale', label: 'Setup iniziale', count: counts['setup-iniziale'] },
      { key: 'routine', label: 'Routine', count: counts.routine },
      { key: 'fluidi-officina', label: 'Fluidi officina', count: counts['fluidi-officina'] },
    ];
  });

  /** ONE chip pattern (task 5.4) for the category chips AND the `stato` chip:
   *  selected = secC fill + check icon, unselected = outline border (the 1px
   *  border is always present, so selection never shifts the layout). */
  protected chipClasses(selected: boolean): string {
    return (
      'fchip press hit-area shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-pill t-label font-bold border ' +
      (selected ? 'border-transparent bg-secC text-onSecC' : 'border-outline text-onSurfV')
    );
  }

  private readonly today = new Date();

  protected readonly cards = computed<ActivityCard[]>(() => {
    const vehicle = this.store.vehicle();
    const selected = this.selected();
    const stato = this.statoFilter();
    return [...this.store.activities()]
      .filter((activity) => selected === 'tutte' || activity.category === selected)
      .sort((a, b) => a.id - b.id)
      .map((activity) => {
        const derived = deriveActivityStatus(activity, vehicle, this.today);
        return { activity, status: derived.status, infoLine: infoLine(activity, derived) };
      })
      .filter((card) => stato == null || card.status === stato);
  });

  protected select(filter: ChipKey): void {
    if (this.selected() === filter) return;
    this.selected.set(filter);
  }

  protected registra(activityId: number): void {
    this.store.registerActivity(activityId, { date: todayIso(), odometerKm: this.store.vehicle().odometerKm });
  }

  protected readonly intervalLine = intervalLine;

  private readonly headerBlock = viewChildren('headerBlock', { read: ElementRef });
  private readonly listBlocks = viewChildren('listBlock', { read: ElementRef });

  constructor() {
    // Staggered entrance (design D11, specs/activities): fires on page activation
    // AND on filter activation ("List entrance on filter change") — data edits
    // ("Registra") never replay it. Blocks render `enter in` (revealed) so DOM
    // added later by data edits is never stuck hidden; playEntranceOn snaps them
    // back to the hidden start state before replaying.
    let firstRun = true;
    effect(() => {
      this.selected();
      this.statoFilter();
      const all = firstRun;
      firstRun = false;
      afterNextRender(
        () => this.playEntranceOn(all ? [...this.headerBlock(), ...this.listBlocks()] : this.listBlocks()),
        { injector: this.injector },
      );
    });
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

/**
 * Draft rule (all three drafted examples): done recently / overdue / expiring → "Ultimo: …";
 * comfortably inside the interval (ok) → "Prossimo: …".
 */
function infoLine(activity: Activity, derived: DerivedStatus): string {
  const lastDone = activity.lastDone;
  if (lastDone != null && derived.status !== 'ok') {
    const note = lastDone.note != null ? ` (${lastDone.note})` : '';
    return `Ultimo: ${formatDate(lastDone.date)}${note} · ${formatKm(lastDone.odometerKm)} km`;
  }
  const month = derived.dueDate != null ? formatMonth(derived.dueDate) : '';
  const km = derived.dueKm != null ? ` · ${formatKm(derived.dueKm)} km` : '';
  return `Prossimo: ${month}${km}`;
}
