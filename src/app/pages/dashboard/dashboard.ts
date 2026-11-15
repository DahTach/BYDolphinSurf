import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { StatusChip } from '../../components/status-chip/status-chip';
import { TextField } from '../../components/text-field/text-field';
import { WavyProgress } from '../../components/wavy-progress/wavy-progress';
import {
  daysFrom,
  formatCompactKm,
  formatDecimal,
  formatKm,
  formatMonthKey,
  formatPercent,
  intervalBase,
  intervalHero,
  parseMonthInput,
  parseNumber,
  todayIso,
} from '../../data/format';
import { Activity } from '../../data/model';
import { Status, deriveActivityStatus } from '../../data/status';
import { StoreService } from '../../data/store';
import { playEntrance, prefersReducedMotion, runCount } from '../../shared/motion';
/* Cruscotto (specs/dashboard + vehicle-data): MD3 filled vehicle fields (6.1),
   hero B1 with corner morph + kinetic countdown badge and NO ambient glow
   (rifiniture-e D6), "Prossime" queue with row press morphs (4.5), tappable
   "In sintesi" MD3 rows with the ripple→deep-link choreography (rifiniture-e D1),
   one "Stato veicolo" card with the Onda M3E wavy fills (rifiniture-e D3/D4).
   All aggregations are computed from the store — no count is hard-coded.

   Motion discipline (design D11): entrances, count-ups and progress fills fire
   ONLY on route/pane activation (afterNextRender of this route component). Data
   edits snap values/dashes/tints through their CSS transitions and never replay
   an entrance, count-up or digit roll; mid-session hero swaps retint the container
   and snap the badge text (the shared status-chip owns that timeline). */

/** Ripple fade completes first, then the deep link (design D10). */
const NAV_DELAY_MS = 600;
/** The ripple ring is removed just after its 500ms fade (design D10). */
const RIPPLE_MS = 600;

interface HeroView {
  activity: Activity;
  status: Status;
  /** Unpadded countdown: "+N g" (overdue) / "tra N g" (future) / "oggi" */
  badge: string;
  tint: HeroTint;
}

/** Hero color permutations per status (specs/dashboard — single source of truth). */
interface HeroTint {
  /** container */
  card: string;
  /** header label at 60% opacity */
  label: string;
  /** spec line at 70% opacity */
  subtle: string;
  /** interval/duration chip text */
  chipText: string;
  /** car SVG fills (carBody / carAccent tokens, specs/design-system) */
  carBody: string;
  carAccent: string;
  button: string;
}

const HERO_TINT: Record<Status, HeroTint> = {
  'scaduto': {
    card: 'bg-errC text-onErrC',
    label: 'text-onErrC/60',
    subtle: 'text-onErrC/70',
    chipText: 'text-onErrC',
    carBody: 'fill-carBodyErr',
    carAccent: 'fill-carAccentErr',
    button: 'bg-err text-onErr',
  },
  'in-scadenza': {
    card: 'bg-waC text-onWaC',
    label: 'text-onWaC/60',
    subtle: 'text-onWaC/70',
    chipText: 'text-onWaC',
    carBody: 'fill-carBody',
    carAccent: 'fill-carAccent',
    button: 'bg-prim text-onPrim',
  },
  'ok': {
    card: 'bg-primC text-onPrimC',
    label: 'text-onPrimC/60',
    subtle: 'text-onPrimC/70',
    chipText: 'text-onPrimC',
    carBody: 'fill-carBody',
    carAccent: 'fill-carAccent',
    button: 'bg-prim text-onPrim',
  },
};

interface QueueItem {
  id: number;
  title: string;
  /** "interval · spec", truncated */
  sub: string;
  status: Status;
  /** "scad. dal gg/mm" / "tra N g" / "oggi" */
  chip: string;
}

/** Blade LFP: 43,2 kWh usable, ≈5.000 cycle life (design D7 of the MVP). */
const LFP_KWH = 43.2;
const LFP_TOTAL_CYCLES = 5000;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatusChip, TextField, WavyProgress],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    /* ── Hero container (design D6): corner morph 48→32px over 600ms --e-emph on
          entrance; tint changes retint through color transitions (design D11).
          No ambient glow (rifiniture-e D6): shadow-hero is the only depth cue. ── */
    .hero {
      position: relative;
      border-radius: 48px;
      transition:
        border-radius var(--d-roll) var(--e-emph),
        background-color var(--d-fade) var(--e-emph),
        color var(--d-fade) var(--e-emph);
    }

    .hero.in {
      border-radius: var(--radius-hero);
    }

    /* ── Sintesi row ripple (design D10): 12px center-origin ring, scale 14 + fade. ── */
    .ripple-ring {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 12px;
      height: 12px;
      transform: translate(-50%, -50%) scale(0);
      border-radius: 9999px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%);
      animation: ripple var(--d-ripple) var(--e-emph) forwards;
      pointer-events: none;
    }

    @keyframes ripple {
      to {
        transform: translate(-50%, -50%) scale(14);
        opacity: 0;
      }
    }
  `,
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly store = inject(StoreService);
  protected readonly vehicle = this.store.vehicle;

  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject(ElementRef);
  private readonly routerSub: Subscription;

  private readonly today = new Date();

  /* ── Hero "Prossima scadenza" + queue "Prossime" (specs/dashboard: scadute by most
        recent due first, then the rest by earliest due) ── */

  private readonly ordered = computed(() => {
    const vehicle = this.vehicle();
    const candidates = this.store
      .activities()
      .map((activity) => ({ activity, derived: deriveActivityStatus(activity, vehicle, this.today) }))
      .filter((entry) => entry.derived.dueDate != null);
    const scadute = candidates
      .filter((entry) => entry.derived.status === 'scaduto')
      .sort((a, b) => (b.derived.dueDate as Date).getTime() - (a.derived.dueDate as Date).getTime());
    const others = candidates
      .filter((entry) => entry.derived.status !== 'scaduto')
      .sort((a, b) => (a.derived.dueDate as Date).getTime() - (b.derived.dueDate as Date).getTime());
    return [...scadute, ...others];
  });

  protected readonly hero = computed<HeroView | null>(() => {
    const pick = this.ordered()[0];
    if (pick == null) return null;
    const days = daysFrom(pick.derived.dueDate as Date, this.today);
    return {
      activity: pick.activity,
      status: pick.derived.status,
      // due-today ⇒ in-scadenza (status.ts: same day is never overdue) ⇒ "oggi", not "+0 g"
      badge: days > 0 ? `+${days} g` : days === 0 ? 'oggi' : `tra ${Math.abs(days)} g`,
      tint: HERO_TINT[pick.derived.status],
    };
  });

  protected readonly heroInterval = computed(() => {
    const hero = this.hero();
    return hero != null ? intervalHero(hero.activity.interval) : '';
  });

  /** The 2 activities after the hero in the same priority order (specs/dashboard). */
  protected readonly queue = computed<QueueItem[]>(() =>
    this.ordered()
      .slice(1, 3)
      .map((entry) => {
        const due = entry.derived.dueDate as Date;
        const overdue = entry.derived.status === 'scaduto';
        const days = daysFrom(due, this.today);
        return {
          id: entry.activity.id,
          title: entry.activity.title,
          sub: `${intervalBase(entry.activity.interval)} · ${entry.activity.spec}`,
          status: entry.derived.status,
          chip: overdue ? `scad. dal ${formatDayMonth(due)}` : days === 0 ? 'oggi' : `tra ${Math.abs(days)} g`,
        };
      }),
  );

  /* ── In sintesi (specs/dashboard) — computed counts, count-up displays on activation ── */

  protected readonly sintesi = computed(() => {
    const vehicle = this.vehicle();
    const counts = { ok: 0, 'in-scadenza': 0, scaduto: 0 };
    for (const activity of this.store.activities()) {
      counts[deriveActivityStatus(activity, vehicle, this.today).status]++;
    }
    return counts;
  });

  protected readonly countOk = signal(0);
  protected readonly countWa = signal(0);
  protected readonly countErr = signal(0);

  /** Live km segment of the sintesi footer: Italian compact "4,5k" (resolved ND-4). */
  protected readonly footerKm = computed(() => formatCompactKm(this.vehicle().odometerKm));

  /* ── Stato veicolo (rifiniture-e D3/D4) ── */

  private readonly prontezza = computed(() => {
    const vehicle = this.vehicle();
    const statuses = this.store.activities().map((activity) => deriveActivityStatus(activity, vehicle, this.today).status);
    const ok = statuses.filter((s) => s === 'ok').length;
    return { ok, total: statuses.length, fraction: statuses.length > 0 ? ok / statuses.length : 0 };
  });

  protected readonly prontezzaPercent = computed(() => Math.round(this.prontezza().fraction * 100));

  protected readonly prontezzaDisplay = signal(0);

  protected readonly prontezzaSubtitle = computed(() => `${this.prontezza().ok} di ${this.prontezza().total} in regola`);

  /* ── Cicli LFP (resolved ND-3) ── */

  protected readonly cicli = computed(() =>
    Math.round((this.vehicle().odometerKm / 100) * (this.vehicle().consumptionKwhPer100Km / LFP_KWH)),
  );

  protected readonly cicliDisplay = signal(0);

  protected readonly cicliPercent = computed(() => (this.cicli() / LFP_TOTAL_CYCLES) * 100);

  protected readonly cicliLabel = computed(() => formatPercent(this.cicliPercent()));

  /* ── Motion orchestration (design D11: activation-only) ── */

  private readonly heroBadge = viewChild('heroBadge', { read: StatusChip });
  private readonly prontezzaWave = viewChild('prontezzaWave', { read: WavyProgress });
  private readonly cicliWave = viewChild('cicliWave', { read: WavyProgress });

  private readonly activated = signal(false);
  private pendingNavTimer = 0;
  private delayClearTimer = 0;
  private countCancels: Array<() => void> = [];

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      // Any other navigation cancels a pending row deep-link (specs/dashboard).
      if (event instanceof NavigationStart) this.cancelPendingNav();
    });

    // Pane activation: entrances, badge timeline, count-ups and wavy fills — once.
    afterNextRender(() => this.activate());

    // Data edits: snap displays/dashes through their transitions — never replay.
    effect(() => {
      const counts = this.sintesi();
      const pz = this.prontezzaPercent();
      const cl = this.cicli();
      untracked(() => {
        if (!this.activated()) return;
        // A data edit wins over any in-flight count-up: cancel the rAF runs so
        // their final frames can't pin pre-edit values (audit M1).
        for (const cancel of this.countCancels) cancel();
        this.countCancels = [];
        this.countOk.set(counts.ok);
        this.countWa.set(counts['in-scadenza']);
        this.countErr.set(counts.scaduto);
        this.prontezzaDisplay.set(pz);
        this.cicliDisplay.set(cl);
      });
    });

    // Structural swaps (hero/queue appearing mid-session) reveal freshly mounted
    // entrance blocks instantly — existing blocks never replay their entrance.
    effect(() => {
      this.hero();
      this.queue();
      untracked(() => {
        if (!this.activated()) return;
        afterNextRender(() => this.revealMountedBlocks(), { injector: this.injector });
      });
    });
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
    clearTimeout(this.pendingNavTimer);
    clearTimeout(this.delayClearTimer);
    for (const cancel of this.countCancels) cancel();
    this.countCancels = [];
  }

  private activate(): void {
    const root = this.host.nativeElement as HTMLElement;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('.enter, .hero'));
    playEntrance(blocks);
    // Drop the stagger delays once the entrance is over so press morphs, retints and
    // radius morphs transition at full speed later (never delayed by the entrance).
    this.delayClearTimer = window.setTimeout(
      () => {
        for (const el of blocks) el.style.transitionDelay = '0ms';
      },
      blocks.length * 55 + 1150,
    );

    // Kinetic badge: the absolute T0 timeline (pop T+750, rolls T+800, tick) is
    // internal to the shared status-chip (design D7).
    this.heroBadge()?.playEntrance();

    const counts = this.sintesi();
    this.countCancels.push(
      runCount(counts.ok, (value) => this.countOk.set(value)),
      runCount(counts['in-scadenza'], (value) => this.countWa.set(value)),
      runCount(counts.scaduto, (value) => this.countErr.set(value)),
    );

    const pz = this.prontezzaPercent();
    this.countCancels.push(
      runCount(pz, (value) => this.prontezzaDisplay.set(value)),
      runCount(this.cicli(), (value) => this.cicliDisplay.set(value)),
    );

    // Onda M3E fills: the entrance dash animation, once (rifiniture-e D4).
    this.prontezzaWave()?.playFill();
    this.cicliWave()?.playFill();
    this.activated.set(true);
  }

  private revealMountedBlocks(): void {
    const root = this.host.nativeElement as HTMLElement;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('.enter:not(.in), .hero:not(.in)'))) {
      el.style.transitionDelay = '0ms';
      el.style.transition = 'none';
      el.classList.add('in');
      void el.offsetHeight; // commit the revealed state without transitioning
      el.style.transition = '';
    }
  }

  /* ── In sintesi rows (rifiniture-e D1): ripple + deep link at 600ms ── */

  protected onRow(event: MouseEvent, stato: Status): void {
    this.cancelPendingNav();

    // Keyboard activation (click with detail 0) and reduced motion navigate immediately.
    if (event.detail === 0 || prefersReducedMotion()) {
      void this.router.navigate(['/attivita'], { queryParams: { stato } });
      return;
    }

    const row = event.currentTarget as HTMLElement;
    const ring = document.createElement('span');
    ring.className = 'ripple-ring';
    row.appendChild(ring);
    window.setTimeout(() => ring.remove(), RIPPLE_MS);

    // The 500ms ripple fade completes before the jump (600ms).
    this.pendingNavTimer = window.setTimeout(() => {
      this.pendingNavTimer = 0;
      void this.router.navigate(['/attivita'], { queryParams: { stato } });
    }, NAV_DELAY_MS);
  }

  private cancelPendingNav(): void {
    clearTimeout(this.pendingNavTimer);
    this.pendingNavTimer = 0;
  }

  /* ── Registra flow (specs/activities: one-tap quick registra) ── */

  protected registraHero(): void {
    const hero = this.hero();
    if (hero != null) this.registra(hero.activity.id);
  }

  protected registra(activityId: number): void {
    this.store.registerActivity(activityId, { date: todayIso(), odometerKm: this.vehicle().odometerKm });
  }

  /* ── Vehicle fields (specs/vehicle-data) — wiring unchanged ── */

  protected onOdometer(value: string): void {
    const km = parseNumber(value);
    if (km != null && km >= 0) this.store.setOdometer(km);
  }

  protected onDeliveryMonth(value: string): void {
    const month = parseMonthInput(value);
    if (month != null) this.store.setDeliveryMonth(month);
  }

  protected onConsumption(value: string): void {
    const consumption = parseNumber(value);
    if (consumption != null && consumption > 0) this.store.setConsumption(consumption);
  }

  protected readonly formatKm = formatKm;
  protected readonly formatMonthKey = formatMonthKey;
  protected readonly formatDecimal = formatDecimal;
}

/** "20/08" for the queue chip (dd/mm). */
function formatDayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}
