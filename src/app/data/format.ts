/* Italian formatters & small pure date helpers (design D10) — no pipes, no libraries.
   All strings visible in ui-drafts/b-blade.html must be reproducible from here:
   "4.500", "09/10/2026", "08/2025", "Ogni mese" (card) / "Ogni 1 mese" (hero chip). */

/** yyyy-mm-dd → local Date at midnight (never ISO string parsing — timezone risk, design.md Risks). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** yyyy-mm → local Date at the first day of the month. */
export function parseMonthKey(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

/** Local Date → yyyy-mm-dd. */
export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Date → local midnight of the same day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Days from `today` back to `date` (positive when `date` is in the past). */
export function daysFrom(date: Date, today: Date): number {
  return Math.round((startOfDay(today).getTime() - startOfDay(date).getTime()) / 86_400_000);
}

/** date + months, clamped to the last day of the resulting month (31/01 + 1 → 28/02). */
export function addMonthsSafe(date: Date, months: number): Date {
  const dayOfMonth = date.getDate();
  const shifted = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(dayOfMonth, lastDay));
  return shifted;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 2026-11-09 → "09/11/2026" */
export function formatDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Date → "08/2027" */
export function formatMonth(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "2025-08" → "08/2025" */
export function formatMonthKey(key: string): string {
  return formatMonth(parseMonthKey(key));
}

/** Italian integer with "." thousands separator: 4500 → "4.500" (manual grouping — locale-independent). */
export function formatKm(km: number): string {
  return String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Italian compact: 4500 → "4,5k", 12000 → "12k" (sintesi footer live segment, design D7). */
export function formatCompactKm(km: number): string {
  const k = km / 1000;
  if (Number.isInteger(k)) return `${k}k`;
  return `${k.toFixed(1).replace('.', ',')}k`;
}

/** Italian decimal with comma: 13.9 → "13,9" */
export function formatDecimal(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value).replace('.', ',');
}

/** 80 → "80 €", 12.5 → "12,5 €" */
export function formatEur(value: number): string {
  return `${formatDecimal(value)} €`;
}

/** 2 → "2 h", 1.5 → "1,5 h" */
export function formatHours(value: number): string {
  return `${formatDecimal(value)} h`;
}

/** LFP card subtitle: 0.28 → "0,3%", 34.4 → "34%" */
export function formatPercent(value: number): string {
  const text = value < 1 ? value.toFixed(1).replace('.', ',') : String(Math.round(value));
  return `${text}%`;
}

/** "4.500" / "4,5" / "4 500" → 4500 · "13,9" → 13.9 · invalid → null */
export function parseNumber(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** "08/2025" → "2025-08" · invalid → null */
export function parseMonthInput(raw: string): string | null {
  const match = /^(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return `${match[2]}-${match[1]}`;
}

/* ─── Interval renderings of the draft (design D10) ─── */

/**
 * Base interval text on the activity card.
 * A "once + months (no km)" window (#2) renders "Una tantum" — the once treatment is the
 * headline, the earliest bound only drives derivation (mirrors the gemini draft label
 * "Once When New (+12–18m Touch-Up)"); the card line joins its note with " + "
 * ("Una tantum + ritocco ogni 12–18 mesi").
 */
export function intervalBase(interval: { months?: number; km?: number; once?: boolean }): string {
  if (interval.months != null && interval.km != null) {
    return `${interval.months} mesi / ${formatKm(interval.km)} km`;
  }
  if (interval.months != null && interval.once) return 'Una tantum';
  if (interval.months === 1) return 'Ogni mese';
  if (interval.months != null) return `Ogni ${interval.months} mesi`;
  if (interval.km != null) return `Ogni ${formatKm(interval.km)} km`;
  return 'Una tantum';
}

/** Full card interval line: "Ogni mese · con controllo pressione gomme" (#5). */
export function intervalLine(interval: { months?: number; km?: number; once?: boolean }, note?: string): string {
  const base = intervalBase(interval);
  if (note == null || note === '') return base;
  return base === 'Una tantum' ? `${base} + ${note}` : `${base} · ${note}`;
}

/** Hero interval chip rendering: "Ogni 1 mese" (#5). */
export function intervalHero(interval: { months?: number; km?: number; once?: boolean }): string {
  if (interval.months != null && interval.km != null) {
    return `${interval.months} mesi / ${formatKm(interval.km)} km`;
  }
  if (interval.months != null) return `Ogni ${interval.months} ${interval.months === 1 ? 'mese' : 'mesi'}`;
  if (interval.km != null) return `Ogni ${formatKm(interval.km)} km`;
  return 'Una tantum';
}
