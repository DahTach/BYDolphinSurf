## Context

- Scaffold in place: Angular 22 (`ng new`, standalone, zoneless; tsconfig NOT strict yet — enabled by tasks 1.0), Tailwind v4 via `.postcssrc.json` + `@tailwindcss/postcss`, `src/styles.scss` stub with `@use "tailwindcss"` + `@theme` font only, `src/index.html` already `lang="it"` + `theme-color #000000`, bun (`packageManager: bun@1.4.4`).
- Design source of truth: `ui-drafts/b-blade.html` (static markup only, no logic). It defines colors, shapes, components and the exact content shown in v1.
- Code-structure source of truth: `~/Developer/AutofficinaPindemonte` — Angular 22 standalone zoneless app: `src/app/{app.config.ts, app.routes.ts, app.ts, app.html, app.scss, pages/<page>/<page>.ts|.html, components/<name>/<name>.ts|.html}` (no `.component` suffix), `styles.scss` with `@use "tailwindcss"` + `@theme` token pattern.
- Locked: localStorage-only persistence, dark-only, Italian UI, no backend/auth/sync, mobile frame max-width 430px, no new dependencies of any kind.

## Goals / Non-Goals

**Goals:** reproduce the `b-blade.html` screen set as working Angular 22 components with derived statuses over a minimal localStorage store; keep every visual decision traceable to the draft file.

**Non-Goals:** settings screen, light mode/theme toggle, backend/auth/sync/export, icon/chart/state libraries, extra pages beyond the four draft sections, data migration (greenfield).

## Decisions

**D1 — Design tokens in `src/styles.scss` via `@theme`** (mirror: `AutofficinaPindemonte/src/styles.scss`). Map the `tailwind.config` block of `ui-drafts/b-blade.html` 1:1 to `--color-*` names so draft class names keep working in v4: `prim #e3a89b` / `onPrim #402010`, `primC #55291d` / `onPrimC #f3d4c8`, `secC #3d3431` / `onSecC #eadcd5`, `terC #463818` / `onTerC #e6cd96`, `err #d98a80` / `onErr #441411`, `errC #3e1d1c` / `onErrC #f2c1ba`, `surf #000000`, `surfLox #0e0d0d`, `surfC #1e1c1d`, `surfHi #2a2728`, `surfHiX #353132`, `onSurf #eae4e2`, `onSurfV #b9aca8`, `mut #8d817d`, `outline #463f3d`, `okC #1d3326` / `onOkC #9cc7a8`, `waC #363020` / `onWaC #d9c084`; shadows `fab/hero/nav` as in the draft; font Roboto Flex (already stubbed). No light palette, no toggle (locked).

**D2 — App organization** (mirror: `AutofficinaPindemonte/src/app`). Keep `app.config.ts` (zoneless default, no extra providers), `app.routes.ts`, `app.ts/.html/.scss`. Add `pages/dashboard/`, `pages/activities/`, `pages/history/`, `pages/products/` and `components/navbar/`, `components/fab/`, `components/status-chip/` — folder-per-unit, `<name>.ts` + `<name>.html` (+ `.scss` only when needed), no `.component` suffix. App-wide state lives in `src/app/data/` (`model.ts`, `seed.ts`, `store.ts`, `status.ts`, `format.ts`): pure TS + Angular signals, no state library.

**D3 — Section navigation (resolved ND-6).** Four lazy Angular routes in `app.routes.ts` — `''` → `pages/dashboard` (Cruscotto), `'attivita'` → `pages/activities`, `'storico'` → `pages/history`, `'prodotti'` → `pages/products` — driven by the pill navbar (`routerLink` + `routerLinkActive`), mirroring `~/Developer/AutofficinaPindemonte/src/app/app.routes.ts`. The draft's single scroll is a static-markup artifact; the section specs are unchanged by routing.

**D4 — Persistence.** One localStorage key `byd-dolphin:v1` holding the full store; read on boot into signals, write on every mutation. Schema (minimal, derived from draft content):

```ts
interface Store {
  vehicle: { model: 'Dolphin Surf'; badge: '2025 EU · 43,2 kWh';
             deliveryMonth: '2025-08'; odometerKm: number;
             consumptionKwhPer100Km: number };  // avg consumption from car dashboard, default 13.9 (≈ WLTP) — feeds the Cicli LFP computation (D7)
  activities: Activity[];
  history: HistoryEntry[];
}
interface Activity {
  id: number;                 // draft numbering (#5 → 5)
  title: string;
  category: 'setup-iniziale' | 'routine' | 'fluidi-officina';
  interval: { months?: number; km?: number; once?: boolean };
  intervalNote?: string;      // suffix after "·" on the card interval line: "con controllo pressione gomme" (#5), "poi ogni 48.000 km" (#9), "ritocco ogni 12–18 mesi" (#2)
  durationNote?: string;      // hero chip: "1–2 h collegate" (#5)
  spec: string;               // spec line, e.g. "Carica AC 100% + top-balance 1–2 h"
  lastDone?: { date: string; odometerKm: number; note?: string };  // ISO yyyy-mm-dd; note renders as the "(PDI)" suffix (#10)
}
interface HistoryEntry {
  id: string; activityId?: number; title: string;
  date: string; odometerKm: number;
  place: string; durationHours?: number; costEur?: number;
}
```

Status is **derived, never stored**. No library (locked).

**D5 — Status derivation** (`data/status.ts`, pure functions): due date = `lastDone.date + interval.months`; due km = `lastDone.odometerKm + interval.km`. `scaduto` when today is past the due date or the odometer is past the due km; `ok` when comfortably inside the interval; `in scadenza` in between — **resolved (ND-2): `in scadenza` when elapsed ≥ 75% of the interval** (verified to reproduce all four draft examples, incl. #10 at ≈79% of 24 mesi). Never-done activities: due = `vehicle.deliveryMonth` + interval, same rule; a `once` activity never done is due at delivery (⇒ scaduto). Window intervals (#2 "12–18 mesi") use the EARLIEST bound (12 mesi → due 20/08/2026 → scaduto, as drafted).

**D6 — Hero "Prossima scadenza".** Selection: among `scaduto` activities the one with the MOST RECENT due date (reproduces draft #5 "+3 giorni fa" under the full seed); if none is scaduto, the one with the earliest future due date. Countdown = days past due, label "giorni fa" (draft: "+3", due 09/11/2026 vs today 12/11/2026); a future due date shows "tra N giorni" (resolved ND-5b). Car SVG, pentagon cookie, wavy path, "Registra ora" button: copy the draft SVGs/markup verbatim (decorative wavy line, full width, stroke `#f3d4c8`).

**D7 — Dashboard derivations.** "In sintesi" counts = activities per derived status (full seed: **2 in regola / 1 in scadenza / 8 scadute**); dots emerald/amber/rose as in draft. Prontezza = ok / total (full seed: 2/11 → 18%); ring formula reverse-engineered from the draft so any fraction renders exactly: track arc = circumference(2πr, r=20) − gap 15.1 = 110.6; progress arc = fraction × 110.6 (full seed → 20.1; the draft's 82% → 90.7 assumes 9/11 ok and is superseded — the formula is the invariant); end dot at the progress angle. **Cicli LFP (resolved ND-3): computed from odometer** — `cicli = round(vehicle.odometerKm / 100 × vehicle.consumptionKwhPer100Km / 43.2)` against 5.000 total cycles (Blade LFP: 43,2 kWh usable, ≈5.000 cycle life; default consumption 13,9 kWh/100km ≈ WLTP 310 km, user-editable via the "Consumo medio" field per D4). With the seed (4.500 km · 13,9) → "14/5.000 · ≈ 0,3% vita utile"; the draft's static "1.721/5.000 · ≈ 34%" is superseded. **Footer sintesi (resolved ND-4):** "Orizzonte 15 anni · 4,5k / 300k km · 1,5%" — the km segment is live from `vehicle.odometerKm` (Italian compact "4,5k" format), everything else static as in the draft.

**D8 — Seed data** (`data/seed.ts`). Vehicle: odometer 4.500 km, consegna 08/2025, consumo 13,9 kWh/100km. **Resolved (ND-1):** the seed contains the FULL 11-activity catalog — `ui-drafts/b-blade.html` defines #5/#9/#10/#2 verbatim (the only ones with `lastDone`); the other 7 come from the `gemini_draft.html` `DEFAULT_TASKS` catalog (num 1–11; Setup 4 / Routine 4 / Fluidi 3 — reproducing the draft chips "Tutte (11) · Setup iniziale (4) · Routine (4) · Fluidi officina (3)"), translated to Italian, all never-done:

- #1 Parafanghi anteriori e posteriori — una tantum `{ once: true }` (nota "quando nuova / prima dell'inverno"), spec "Clip-on OEM / aftermarket modellati";
- #2 Antiruggine sottoscocca — `{ once: true, months: 12 }` + nota "ritocco ogni 12–18 mesi" (the `once` renders the draft card line "Una tantum + ritocco ogni 12–18 mesi"; derivation still uses the earliest 12-month bound), spec "Lanoguard · Dinitrol 3125 / 4941", lastDone 20/08/2025 · 300 km → scaduto;
- #3 Trattamento guarnizioni EPDM — `{ months: 6 }` (nota "prima volta alla consegna"), spec "Molykote 111 / Krytox GPL 205 / glicerina";
- #4 Primo controllo BYD — `{ months: 3, km: 5000, once: true }`, spec "Ispezione telaio e serraggi officina BYD";
- #5 Bilanciamento LFP 100% — `{ months: 1 }` + nota "con controllo pressione gomme", durationNote "1–2 h collegate", spec "Carica AC 100% + top-balance 1–2 h", lastDone 09/10/2026 · 4.100 km → scaduto;
- #6 Spinotto di ricarica e guarnizione — `{ months: 6, km: 7500 }`, spec "IPA 99% sui pin · Molykote 111 sulla guarnizione";
- #7 Rotazione gomme — `{ months: 9, km: 10000 }`, spec "Rotazione ant./post. + controllo assetto";
- #8 Manutenzione severe — `{ months: 12, km: 15000 }`, spec "Grasso pin pinze · aero shield · ritocco Lanoguard";
- #9 Olio riduttore — `{ months: 24, km: 40000 }` + nota "poi ogni 48.000 km", spec "Castrol BOT384 · ≈ 500 ml", lastDone 08/08/2025 · 0 km → ok (reproduces "Prossimo: 08/2027 · 40.000 km");
- #10 Fluido freni DOT 4 — `{ months: 24 }` + nota "sostituzione obbligatoria", spec "DOT 4 / HZY6 · ≈ 1.100 ml", lastDone 15/04/2025 · 0 km (nota "PDI") → in scadenza;
- #11 Liquido raffreddamento + 12V — `{ months: 36, km: 70000 }`, spec "OAT -40°C (3,1–3,3 L) + test di carico 12V".

History: LFP 09/10/2026 Garage di casa 2 h · 4.100 km; Antiruggine 20/08/2025 Officina Corsi 80 € · 300 km; Consegna+PDI 08/08/2025 BYD Store Milano 0 € · 15 km. Derived counts under the full seed (today 12/11/2026): **2 in regola (#9, #11) / 1 in scadenza (#10) / 8 scadute (#1–#8)** — always computed from data, never hard-coded; the draft's "Scadute 1" is superseded.

**D9 — Registra flow (resolved ND-5).** "Registra" / "Registra ora" on hero and cards = ONE-TAP quick registra: creates a history entry (activity title, today's date, current odometer), updates `lastDone`, recomputes status — no form. The FAB opens the full capture form as an M3E bottom sheet (mirroring the draft's surfaces: `bg-surfC`, rounded-top): activity selector (the 11 catalog titles), date (default today), odometer km (default current), place, cost €, duration h — saving creates the same entry and persists per D4.

**D10 — Formatting & assets.** Italian formats as in the draft: dates `dd/mm/yyyy`, months `mm/yyyy`, thousands separator `.` (4.500 km); small pure helpers in `data/format.ts` (no pipes/libraries), including both interval renderings of the draft: "Ogni mese" (activity card) and "Ogni 1 mese" (hero chip). All icons are the draft's inline SVGs (Lucide-style paths) copied verbatim; no icon library (locked). Numbers in chips are computed, never hard-coded (see D8).

## Risks / Trade-offs

- [Draft numbers internally inconsistent (Scadute 1 vs 2 scadute; 82% vs seed fraction; static 1.721 cicli)] → all counts computed from data (D7/D8); ND-1 resolved with the full catalog, so the filter chips reproduce the draft exactly while sintesi/prontezza/LFP show computed values.
- [Draft was written for Tailwind CDN v3-style config] → v4 `@theme` mapping keeps class names valid; arbitrary values (`rounded-[28px]`, `bg-white/[0.08]`) work in v4.
- [localStorage unavailable/cleared] → guard reads; fall back to seed data; no error UI beyond seed state.
- [Date math bugs around timezones] → store dates as `yyyy-mm-dd` strings, compare via local-date parsing only.
- [Zoneless change detection misses mutations] → all state via signals; mutate only through `store.ts` methods.

## Migration Plan

Greenfield: first run seeds `byd-dolphin:v1` if absent (D8); no data migration. Rollback = discard the change; localStorage key can be removed manually.

## Resolved Decisions (previously open questions)

- **ND-1** RESOLVED — full 11-activity catalog seeded: M3E draft's 4 verbatim + 7 translated from `gemini_draft.html` (D8).
- **ND-2** RESOLVED — "in scadenza" at elapsed ≥ 75% of the interval; never-done ⇒ deliveryMonth + interval; `once` never done ⇒ due at delivery (D5).
- **ND-3** RESOLVED — Cicli LFP computed: `round(km/100 × consumo / 43.2)` vs 5.000; consumption user-editable, default 13,9 (D4, D7).
- **ND-4** RESOLVED — sintesi footer: km live from odometer, rest static (D7).
- **ND-5** RESOLVED — one-tap quick registra (hero/cards) + FAB bottom-sheet capture form; future countdown "tra N giorni" (D6, D9).
- **ND-6** RESOLVED — four lazy routes (D3).
