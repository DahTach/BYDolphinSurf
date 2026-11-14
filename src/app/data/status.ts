/* Pure status derivation (design D5) — statuses are derived, never stored.
   Calibrated on the four draft examples of ui-drafts/b-blade.html:
   #5 scaduto (+3 giorni fa, due 09/11/2026) · #9 OK · #10 in scadenza (≈79% ≥ 75%) · #2 scaduto.
   Resolved ND-2: "in scadenza" when elapsed ≥ 75% of the interval; never-done activities
   derive the due from vehicle.deliveryMonth + interval (a `once` never done is due at
   delivery ⇒ scaduto); window intervals (#2 "12–18 mesi") use the earliest bound. */

import { Activity, Vehicle } from './model';
import { addMonthsSafe, daysFrom, parseIsoDate, parseMonthKey } from './format';

export type Status = 'ok' | 'in-scadenza' | 'scaduto';

export interface DerivedStatus {
  status: Status;
  /** next due date (null when a `once` activity is already done — nothing due anymore) */
  dueDate: Date | null;
  /** next due odometer reading */
  dueKm: number | null;
}

/** "in scadenza" threshold — resolved ND-2 */
const EXPIRING_THRESHOLD = 0.75;

export function deriveActivityStatus(activity: Activity, vehicle: Vehicle, today: Date): DerivedStatus {
  const interval = activity.interval;
  const lastDone = activity.lastDone;
  const delivery = parseMonthKey(vehicle.deliveryMonth);

  // Anchor = last done, or (never done) the delivery for time and 0 km for the odometer.
  const timeAnchor = lastDone != null ? parseIsoDate(lastDone.date) : delivery;
  const kmAnchor = lastDone?.odometerKm ?? 0;

  const dueDate =
    lastDone == null && interval.once && interval.months == null && interval.km == null
      ? delivery // `once` never done ⇒ due at delivery (⇒ scaduto)
      : interval.months != null
        ? addMonthsSafe(timeAnchor, interval.months)
        : interval.once && lastDone == null
          ? delivery // `once` never done, no months/km ⇒ due at delivery
          : null; // `once` already done (no months/km) ⇒ nothing due anymore
  const dueKm = interval.km != null ? kmAnchor + interval.km : null;

  const odometerKm = vehicle.odometerKm;
  // daysFrom(due, today) > 0 ⇒ today is past the due date (same day ⇒ not overdue yet ⇒ in scadenza at 100%)
  const pastDate = dueDate != null && daysFrom(dueDate, today) > 0;
  const pastKm = dueKm != null && odometerKm > dueKm;

  if (pastDate || pastKm) return { status: 'scaduto', dueDate, dueKm };

  // Elapsed fraction per eligible dimension (window intervals use the earliest bound via months).
  let elapsed = 0;
  if (dueDate != null && dueDate.getTime() > timeAnchor.getTime()) {
    elapsed = Math.max(elapsed, (startOf(today).getTime() - timeAnchor.getTime()) / (dueDate.getTime() - timeAnchor.getTime()));
  }
  if (dueKm != null && dueKm > kmAnchor) {
    elapsed = Math.max(elapsed, (odometerKm - kmAnchor) / (dueKm - kmAnchor));
  }

  return { status: elapsed >= EXPIRING_THRESHOLD ? 'in-scadenza' : 'ok', dueDate, dueKm };
}

function startOf(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
