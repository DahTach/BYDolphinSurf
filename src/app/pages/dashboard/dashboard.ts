import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { GaugeField } from '../../components/gauge-field/gauge-field';
import { StatusChip } from '../../components/status-chip/status-chip';
import { WavyProgress } from '../../components/wavy-progress/wavy-progress';
import {
  addMonthsSafe,
  daysFrom,
  formatCompactKm,
  formatDecimal,
  formatKm,
  formatMonthKey,
  formatPercent,
  intervalBase,
  intervalHero,
  parseIsoDate,
  parseMonthInput,
  parseMonthKey,
  parseNumber,
  startOfDay,
  todayIso,
} from '../../data/format';
import { Activity } from '../../data/model';
import { Status, deriveActivityStatus } from '../../data/status';
import { StoreService } from '../../data/store';
import { fillBar, playCelebrate, playEntrance, prefersReducedMotion, runCount } from '../../shared/motion';
/* Cruscotto (specs/dashboard + vehicle-data): the gemini "vehicle maintenance
   card" — neutral surfC card (28px radius, NO overflow clipping) topped by the mockup
   "car stage" (h1-proposta-m3e §1: flat dark studio panel, identity
   top-left and the big odometer bottom-left — the car sits as before and spills
   out of the card's right edge), then
   the 3 vehicle fields as editable Onda M3E gauge fields
   (consumo sx / chilometraggio hero al centro / consegna dx) and the ABORBED
   "Prossima scadenza" block under a hairline: eyebrow + status chip, activity
   title, the M3 timeline bar (scadenza tick + elapsed fill + plain countdown
   text over the marker), spec/interval chips bottom-left and the
   compact "Registra ora" CTA bottom-right (with the "Fatto ✓" celebration).
   Then the "Prossime" queue with row
   press morphs (4.5), tappable "In sintesi" MD3 rows with the ripple→deep-link
   choreography (rifiniture-e D1), one "Stato veicolo" card with the Onda M3E
   wavy fills (rifiniture-e D3/D4). All aggregations are computed from the
   store — no count is hard-coded.

   Motion discipline (design D11): entrances, count-ups and progress fills fire
   ONLY on route/pane activation (afterNextRender of this route component). Data
   edits snap values/dashes through their CSS transitions and never replay an
   entrance or count-up; mid-session hero swaps snap the countdown text
   and the timeline fill — the
   card itself stays neutral (status color survives only in the chip text,
   countdown text, fill and CTA). */

/** Ripple fade completes first, then the deep link (design D10). */
const NAV_DELAY_MS = 600;
/** The ripple ring is removed just after its 500ms fade (design D10). */
const RIPPLE_MS = 600;

interface HeroView {
  activity: Activity;
  status: Status;
  /** Unpadded countdown: "+N g" (overdue) / "tra N g" (future) / "oggi" */
  badge: string;
  /** CTA fill permutation (the merged card stays neutral surfC). */
  cta: string;
  /** Scadenza tick (due) position along the timeline track (0–100). */
  markerPct: number;
  /** Elapsed fill to today along the track (0–100, clamped). */
  fillPct: number;
  /** Countdown left% — the marker clamped so the text never overflows the row. */
  badgePct: number;
}

/** Hero CTA fill per status (specs/dashboard): red only when overdue. */
const HERO_CTA: Record<Status, string> = {
  'scaduto': 'bg-err text-onErr',
  'in-scadenza': 'bg-prim text-onPrim',
  'ok': 'bg-prim text-onPrim',
};

/* ── Scadenza timeline window (the M3 linear bar inside the vehicle card) ── */

/** Overrun past the due date: 30% of the interval span (an overrun stays visible). */
const OVERRUN = 0.3;
/** Fallback window (km-only / no date interval): due −30d → due +10d. */
const FALLBACK_PRE_DAYS = 30;
/** Fallback window tail, so the marker lands at 75% (30/40) there too. */
const FALLBACK_POST_DAYS = 10;
/** Countdown horizontal clamp (center %) so the text never overflows the row. */
const BADGE_MIN_PCT = 12;
const BADGE_MAX_PCT = 88;

/** Local date ± days (DST-safe: day arithmetic on the date field). */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Timeline window + positions for the hero activity:
 * - window start = the activity's `lastDone.date`, or `due − interval months`
 *   when never done; degenerate/absent date intervals fall back to the sane
 *   `due −30d → due +10d` window;
 * - window end = `due + 30%` of the interval span, so the due marker sits at
 *   ≈76.9% (1/1.3 — 75% on the fallback window) and an overrun renders past it;
 * - fill = elapsed to today, clamped 0–100 (err when past the marker);
 * - badge = the marker %, clamped so the countdown never overflows the row.
 */
function timelinePositions(
  activity: Activity,
  due: Date,
  today: Date,
): { markerPct: number; fillPct: number; badgePct: number } {
  const months = activity.interval.months;
  let start =
    activity.lastDone != null
      ? parseIsoDate(activity.lastDone.date)
      : months != null && months > 0
        ? addMonthsSafe(due, -months)
        : due;
  const fallback = start.getTime() >= due.getTime(); // km-only / no date interval / degenerate
  if (fallback) start = addDays(due, -FALLBACK_PRE_DAYS);

  const spanMs = due.getTime() - start.getTime();
  const endMs = fallback ? addDays(due, FALLBACK_POST_DAYS).getTime() : due.getTime() + spanMs * OVERRUN;
  const totalMs = endMs - start.getTime();
  const markerPct = (spanMs / totalMs) * 100;
  const elapsedMs = startOfDay(today).getTime() - start.getTime();
  const fillPct = clampPercent((elapsedMs / totalMs) * 100);
  return {
    markerPct,
    fillPct,
    badgePct: Math.min(BADGE_MAX_PCT, Math.max(BADGE_MIN_PCT, markerPct)),
  };
}

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

/** Lifetime odometer horizon (the sintesi footer "… / 300k km"): the km gauge fallback. */
const LIFETIME_KM = 300_000;
/** Consegna gauge horizon: the app's 15-year window (sintesi footer "Orizzonte 15 anni"). */
const MONTHS_HORIZON = 180;
/** Typical EV consumption band (kWh/100km) driving the consumo gauge fill. */
const CONSUMO_MIN = 8;
const CONSUMO_MAX = 25;

/** Gauge fill percent clamped to 0–100 (or to `min`–100 for gauges with a floor). */
function clampPercent(pct: number, min = 0): number {
  return Math.min(100, Math.max(min, pct));
}

@Component({
  selector: 'app-dashboard',
  imports: [GaugeField, RouterLink, StatusChip, WavyProgress],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
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

    /* ── Car stage (mockup h1-proposta-m3e §1): full-bleed dark studio panel at
          the top of the #veicolo card — flat radial backdrop only (no glow, no
          floor line, no sweep). NO overflow hidden anywhere: the panel clips its
          own gradient with the card's top-corner radius, while the car spills out
          of the card's right edge (the page keeps the horizontal bleed inside
          body { overflow-x: clip }). ── */
    .stage {
      position: relative;
      height: 250px;
      border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
      background: radial-gradient(130% 110% at 50% 125%, #262019 0%, #17130f 48%, #0b0908 100%);
    }

    /* ── Car shot: the 479×243 tight-cut PNG at 318px (no padding, no negative-margin
          cropping). Width MUST match .car-drive below (a wider flex child would
          overflow its positioned wrapper and shift the geometry). ── */
    .car-shot {
      display: block;
      width: 318px;
    }

    /* ── Car placement: exactly where it was inside the stage — 318px wide,
          right-anchored, bottom-anchored — but no longer clipped: the nose spills
          ~18px outside the card's right edge (the "sbordo" the user asked for).
          Entrance (design D11): drive-in from the RIGHT on this OUTER wrapper —
          from translateX(72px) scale(.96) → rest, 900ms spring. Activation-only:
          carIn() flips with the playEntrance trigger, so data edits never replay
          the drive-in and mid-session hero swaps mount already "in". The car then
          stays put (no idle float). ── */
    .car-drive {
      position: absolute;
      right: -18px;
      bottom: 18px;
      width: 318px;
      display: flex;
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transform: translateX(72px) scale(0.96);
      /* ≈150ms after the hero rise begins (T+55 stagger + 150 ≈ 200ms), then
         springs to rest over 900ms with the --e-spring overshoot */
      transition:
        opacity 900ms var(--e-spring) 200ms,
        transform 900ms var(--e-spring) 200ms;
    }

    .car-drive.in {
      opacity: 1;
      transform: none;
    }

    /* ── Scadenza timeline fill: the shared ".bar" primitive plays the entrance
          (0→target, 650ms --d-bar --e-spring); once live, width data edits ride
          the gauge contract speed — 250ms --d-small — and never replay. ── */
    .tl-live {
      transition: width var(--d-small) var(--e-emph);
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
    const due = pick.derived.dueDate as Date;
    const days = daysFrom(due, this.today);
    return {
      activity: pick.activity,
      status: pick.derived.status,
      // due-today ⇒ in-scadenza (status.ts: same day is never overdue) ⇒ "oggi", not "+0 g"
      badge: days > 0 ? `+${days} g` : days === 0 ? 'oggi' : `tra ${Math.abs(days)} g`,
      cta: HERO_CTA[pick.derived.status],
      ...timelinePositions(pick.activity, due, this.today),
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

  /* ── Gemini vehicle gauges (editable vehicle fields as Onda M3E rings) —
        honest, computed fills. The three raw handlers below stay the only
        write path (specs/vehicle-data) ── */

  /**
   * Chilometraggio gauge target: the NEAREST km-based activity deadline ahead
   * of the odometer (status.ts dueKm = last-done km + interval, anchored at 0
   * when never done — e.g. "Primo controllo BYD" → 5.000 km). Falls back to the
   * 300k lifetime horizon when nothing km-based lies ahead.
   */
  protected readonly kmTarget = computed(() => {
    const vehicle = this.vehicle();
    const upcoming = this.store
      .activities()
      .map((activity) => deriveActivityStatus(activity, vehicle, this.today).dueKm)
      .filter((dueKm): dueKm is number => dueKm != null && dueKm > vehicle.odometerKm);
    return upcoming.length > 0 ? Math.min(...upcoming) : LIFETIME_KM;
  });

  /** "/ 5.000 km" — or "/ 300.000 km" on the lifetime fallback. */
  protected readonly kmSub = computed(() => `/ ${formatKm(this.kmTarget())} km`);

  /** km / target, clamped 0–100 (the ring keeps its 2% min head / 0% empty). */
  protected readonly kmFill = computed(() => clampPercent((this.vehicle().odometerKm / this.kmTarget()) * 100));

  /** Consumo gauge sub-line (unit of the editable value). */
  protected readonly consumoSub = 'kWh/100km';

  /** clamp((v−8)/17, 2%, 100%) — the typical EV band 8–25 kWh/100km. */
  protected readonly consumoFill = computed(() =>
    clampPercent(((this.vehicle().consumptionKwhPer100Km - CONSUMO_MIN) / (CONSUMO_MAX - CONSUMO_MIN)) * 100, 2),
  );

  /** Whole months since delivery (the editable "08/2025" month). */
  protected readonly mesiConsegna = computed(() => {
    const delivery = parseMonthKey(this.vehicle().deliveryMonth);
    return Math.max(
      0,
      (this.today.getFullYear() - delivery.getFullYear()) * 12 + (this.today.getMonth() - delivery.getMonth()),
    );
  });

  /** "15 mesi" (Italian singular below 2). */
  protected readonly consegnaSub = computed(() => {
    const mesi = this.mesiConsegna();
    return `${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`;
  });

  /** months / 180 (the 15-year horizon), clamped 0–100. */
  protected readonly consegnaFill = computed(() => clampPercent((this.mesiConsegna() / MONTHS_HORIZON) * 100));

  /* ── Motion orchestration (design D11: activation-only) ── */

  private readonly gaugeFields = viewChildren(GaugeField);
  private readonly prontezzaWave = viewChild('prontezzaWave', { read: WavyProgress });
  private readonly cicliWave = viewChild('cicliWave', { read: WavyProgress });
  private readonly timelineFill = viewChild('timelineFill', { read: ElementRef });

  /**
   * Hero car drive-in (specs/dashboard): flipped once with the activation
   * trigger below. Starts already "in" under reduced motion (final state
   * immediately) and stays "in" for mid-session hero swaps, which mount the car
   * revealed — never a replay.
   */
  protected readonly carIn = signal(prefersReducedMotion());

  private readonly activated = signal(false);
  private pendingNavTimer = 0;
  private delayClearTimer = 0;
  private countCancels: Array<() => void> = [];
  /** Activity id behind the rendered timeline fill (hero-swap snap detection). */
  private timelineId = -1;

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      // Any other navigation cancels a pending row deep-link (specs/dashboard).
      if (event instanceof NavigationStart) this.cancelPendingNav();
    });

    // Pane activation: entrances, count-ups and wavy fills — once.
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

    // Scadenza timeline fill data edits: 250ms width transitions, never a
    // replay (the entrance fill stays activation-only). A mid-session hero swap
    // snaps the fill to the new activity's window — the countdown text snaps with it.
    effect(() => {
      const hero = this.hero();
      untracked(() => {
        if (!this.activated()) return;
        const el = this.timelineFill()?.nativeElement as HTMLElement | undefined;
        if (hero == null || el == null) return;
        el.classList.add('tl-live'); // data-edit speed from now on
        if (hero.activity.id !== this.timelineId) {
          el.style.transition = 'none'; // hero swap: snap, no transition
          el.style.width = `${hero.fillPct}%`;
          void el.offsetWidth;
          el.style.transition = '';
        } else {
          el.style.width = `${hero.fillPct}%`;
        }
        this.timelineId = hero.activity.id;
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
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('.enter'));
    playEntrance(blocks);
    // Drop the stagger delays once the entrance is over so press morphs, retints and
    // radius morphs transition at full speed later (never delayed by the entrance).
    this.delayClearTimer = window.setTimeout(
      () => {
        for (const el of blocks) el.style.transitionDelay = '0ms';
      },
      blocks.length * 55 + 1150,
    );

    // Hero car drive-in: same activation-only trigger (specs/dashboard).
    this.carIn.set(true);

    // Scadenza timeline fill: 0→target over 650ms --e-spring (the shared .bar
    // primitive), once — later data edits ride the 250ms width transition.
    const hero = this.hero();
    const fillEl = this.timelineFill()?.nativeElement as HTMLElement | undefined;
    if (hero != null && fillEl != null) {
      fillBar(fillEl, hero.fillPct);
      this.timelineId = hero.activity.id;
    }

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

    // Onda M3E fills: the entrance dash animation, once (rifiniture-e D4) —
    // the 3 vehicle gauges fill with the same activation-only trigger.
    for (const gauge of this.gaugeFields()) gauge.playFill();
    this.prontezzaWave()?.playFill();
    this.cicliWave()?.playFill();
    this.activated.set(true);
  }

  private revealMountedBlocks(): void {
    const root = this.host.nativeElement as HTMLElement;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('.enter:not(.in)'))) {
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

  /** Hero CTA click: register + the "Fatto ✓" moment (mockup demo ②) on the button. */
  protected registraHero(event: Event): void {
    const hero = this.hero();
    if (hero == null) return;
    this.registra(hero.activity.id);
    const btn = event.currentTarget as HTMLElement | null;
    if (btn != null) playCelebrate(btn);
  }

  protected registra(activityId: number): void {
    this.store.registerActivity(activityId, { date: todayIso(), odometerKm: this.vehicle().odometerKm });
  }

  /* ── Vehicle fields (specs/vehicle-data) — wiring unchanged: the gemini gauge
        fields emit the raw string on commit, invalid input is reverted by the
        gauge field itself and never reaches the store ── */

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
