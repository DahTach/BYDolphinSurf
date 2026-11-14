/* Store schema (design D4) — field set derived from the content of ui-drafts/b-blade.html. */

export interface Interval {
  months?: number;
  km?: number;
  once?: boolean;
}

export interface LastDone {
  /** ISO yyyy-mm-dd */
  date: string;
  odometerKm: number;
  /** renders as the "(PDI)" suffix (#10) */
  note?: string;
}

export type Category = 'setup-iniziale' | 'routine' | 'fluidi-officina';

export interface Activity {
  /** draft numbering (#5 → 5) */
  id: number;
  title: string;
  category: Category;
  interval: Interval;
  /** suffix after "·" on the card interval line: "con controllo pressione gomme" (#5), "poi ogni 48.000 km" (#9), "ritocco ogni 12–18 mesi" (#2) */
  intervalNote?: string;
  /** hero chip: "1–2 h collegate" (#5) */
  durationNote?: string;
  /** spec line, e.g. "Carica AC 100% + top-balance 1–2 h" */
  spec: string;
  lastDone?: LastDone;
}

export interface Vehicle {
  model: 'Dolphin Surf';
  badge: '2025 EU · 43,2 kWh';
  /** yyyy-mm */
  deliveryMonth: string;
  odometerKm: number;
  /** avg consumption from car dashboard, default 13.9 (≈ WLTP) — feeds the Cicli LFP computation (D7) */
  consumptionKwhPer100Km: number;
}

export interface HistoryEntry {
  id: string;
  activityId?: number;
  title: string;
  /** ISO yyyy-mm-dd */
  date: string;
  odometerKm: number;
  place: string;
  durationHours?: number;
  costEur?: number;
}

export interface Store {
  vehicle: Vehicle;
  activities: Activity[];
  history: HistoryEntry[];
}
