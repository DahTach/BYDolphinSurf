/* Seed data (design D8, resolved ND-1) — the FULL 11-activity catalog.
   #5/#9/#10/#2 verbatim from ui-drafts/b-blade.html (the only ones with `lastDone`);
   the other 7 translated from the gemini_draft.html DEFAULT_TASKS catalog (num/category/
   months/km/spec data), all never-done. History: the 3 draft entries verbatim.
   With today = 12/11/2026 this derives: 2 in regola (#9, #11) / 1 in scadenza (#10) /
   8 scadute (#1–#8) — always recomputed, never hard-coded. */

import { Store } from './model';

export function createSeedStore(): Store {
  return {
    vehicle: {
      model: 'Dolphin Surf',
      badge: '2025 EU · 43,2 kWh',
      deliveryMonth: '2025-08',
      odometerKm: 4500,
      consumptionKwhPer100Km: 13.9,
    },
    activities: [
      {
        id: 1,
        title: 'Parafanghi anteriori e posteriori',
        category: 'setup-iniziale',
        interval: { once: true },
        intervalNote: 'quando nuova / prima dell\u2019inverno',
        spec: 'Clip-on OEM / aftermarket modellati',
      },
      {
        id: 2,
        title: 'Antiruggine sottoscocca',
        category: 'setup-iniziale',
        // earliest bound of the "12–18 mesi" window drives the derivation (design D5);
        // `once` renders the draft card line "Una tantum + ritocco ogni 12–18 mesi"
        interval: { once: true, months: 12 },
        intervalNote: 'ritocco ogni 12\u201318 mesi',
        spec: 'Lanoguard \u00b7 Dinitrol 3125 / 4941',
        lastDone: { date: '2025-08-20', odometerKm: 300 },
      },
      {
        id: 3,
        title: 'Trattamento guarnizioni EPDM',
        category: 'setup-iniziale',
        interval: { months: 6 },
        intervalNote: 'prima volta alla consegna',
        spec: 'Molykote 111 / Krytox GPL 205 / glicerina',
      },
      {
        id: 4,
        title: 'Primo controllo BYD',
        category: 'setup-iniziale',
        interval: { months: 3, km: 5000, once: true },
        spec: 'Ispezione telaio e serraggi officina BYD',
      },
      {
        id: 5,
        title: 'Bilanciamento LFP 100%',
        category: 'routine',
        interval: { months: 1 },
        intervalNote: 'con controllo pressione gomme',
        durationNote: '1\u20132 h collegate',
        spec: 'Carica AC 100% + top-balance 1\u20132 h',
        lastDone: { date: '2026-10-09', odometerKm: 4100 },
      },
      {
        id: 6,
        title: 'Spinotto di ricarica e guarnizione',
        category: 'routine',
        interval: { months: 6, km: 7500 },
        spec: 'IPA 99% sui pin \u00b7 Molykote 111 sulla guarnizione',
      },
      {
        id: 7,
        title: 'Rotazione gomme',
        category: 'routine',
        interval: { months: 9, km: 10000 },
        spec: 'Rotazione ant./post. + controllo assetto',
      },
      {
        id: 8,
        title: 'Manutenzione severe',
        category: 'routine',
        interval: { months: 12, km: 15000 },
        spec: 'Grasso pin pinze \u00b7 aero shield \u00b7 ritocco Lanoguard',
      },
      {
        id: 9,
        title: 'Olio riduttore',
        category: 'fluidi-officina',
        interval: { months: 24, km: 40000 },
        intervalNote: 'poi ogni 48.000 km',
        spec: 'Castrol BOT384 \u00b7 \u2248 500 ml',
        lastDone: { date: '2025-08-08', odometerKm: 0 },
      },
      {
        id: 10,
        title: 'Fluido freni DOT 4',
        category: 'fluidi-officina',
        interval: { months: 24 },
        intervalNote: 'sostituzione obbligatoria',
        spec: 'DOT 4 / HZY6 \u00b7 \u2248 1.100 ml',
        lastDone: { date: '2025-04-15', odometerKm: 0, note: 'PDI' },
      },
      {
        id: 11,
        title: 'Liquido raffreddamento + 12V',
        category: 'fluidi-officina',
        interval: { months: 36, km: 70000 },
        spec: 'OAT -40\u00b0C (3,1\u20133,3 L) + test di carico 12V',
      },
    ],
    history: [
      { id: 'h-lfp', activityId: 5, title: 'Bilanciamento LFP 100%', date: '2026-10-09', odometerKm: 4100, place: 'Garage di casa', durationHours: 2 },
      { id: 'h-antiruggine', activityId: 2, title: 'Antiruggine sottoscocca', date: '2025-08-20', odometerKm: 300, place: 'Officina Corsi', costEur: 80 },
      { id: 'h-consegna', title: 'Consegna veicolo + PDI', date: '2025-08-08', odometerKm: 15, place: 'BYD Store Milano', costEur: 0 },
    ],
  };
}
