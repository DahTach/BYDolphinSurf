## 1. Foundation

- [x] 1.1 Create `src/app/components/text-field/text-field.ts` — shared MD3 filled-text-field per design D1 (markup mirroring `ui-drafts/c-cruscotto.html` §0): rest pill `bg-surfHiX rounded-full` + label `text-onSurfV`; focus-within `bg-surfHi` + `ring-2 ring-prim` + label bold `text-prim` (no bottom indicator, no squared corners — rounded like the rest of the app); inputs for label/value/type/inputmode/suffix/options and `commitOn` (`'change'` commits on blur — vehicle fields; `'input'` per keystroke — FAB fields), `valueChange` output (no forms library); reference structure `~/Developer/AutofficinaPindemonte/src/app/components/`.
- [x] 1.2 Add `resetToSeed()` to `src/app/data/store.ts` — overwrite the state signal with `createSeedStore()` and persist via the existing write path (mirrors `setOdometer`/`mutate`).

## 2. Cruscotto (pages/dashboard)

- [x] 2.1 Rebuild the hero per design D2 / draft B1 (`ui-drafts/c-cruscotto.html` §B1): status-tinted `rounded-[32px]` container (scaduto errC / in-scadenza waC / ok primC with the chip/badge/button color map), header label + chip, car SVG centered `h-24` (tinted #b96357/#3e1d1c on errC, #c96f60/#55291d otherwise), "+N g" / "tra N g" badge `-top-1 right-2`, title 22 black, spec line, chips `bg-white/[0.08] border-white/10`; REMOVE the pentagon cookie, wavy path and 40px countdown number; keep the selection rule and one-tap registra.
- [x] 2.2 Add the "Prossime" queue per design D3 / draft §C: computed 2 activities after the hero (same priority order), pill rows with calendar circle, title+sub, trailing chip ("scad. dal gg/mm" errC / "tra N g" secC), tap → `/attivita`; caption + hidden when empty.
- [x] 2.3 Rebuild "In sintesi" per design D4 / draft sintesi block: three tappable tonal tiles (okC/waC/errC, count 26px, label 10px, `active:scale-[0.97]`) with `routerLink` + `queryParams { stato }`; remove the emerald/amber/rose dots; keep heading + km-live footer.
- [x] 2.4 Rebuild Prontezza + Cicli per design D5 / draft stat block: neutral `bg-surfC rounded-[24px] p-4` in `grid-cols-2`, numbers 30px font-black, linear rounded bars (`bg-surfHiX` track + `bg-prim` fill at the real fraction, cicli `min-w-[4px]`); REMOVE the ring SVG and its constants (RING_RADIUS/RING_TRACK/...).
- [x] 2.5 Replace the three vehicle fields with the `text-field` component (per design D1), wiring the existing store handlers (`onOdometer`/`onDeliveryMonth`/`onConsumption`); add `id="veicolo"` to the fields wrapper for the settings-sheet jump.

## 3. App shell

- [x] 3.1 Create `src/app/components/settings-sheet/settings-sheet.ts` per design D7 / draft settings block: handle, title, "Ripristina dati iniziali" with inline confirm → `store.resetToSeed()`, "Consegna e consumo" → navigate `['']` fragment `veicolo`, info footer; backdrop tap closes; wire it to the header gear button in `src/app/app.html`.

## 4. Attività

- [x] 4.1 Read the `stato` query param (`ActivatedRoute.queryParamMap`) and render the dismissible status chip above the category chips per design D6 (`specs/activities`); AND-combine with the category filter; × clears the param (`router.navigate` with no stato).
- [x] 4.2 Rebuild the FAB sheet fields on the `text-field` component per design D8 / draft FAB block: drag handle, activity select as filled field with chevron, "Annulla" as text button (no border), validation unchanged.

## 5. Verification

- [x] 5.1 Run `bun run build` and fix all strict-TypeScript/template errors; no dependency or tooling added.
- [x] 5.2 Side-by-side check against `ui-drafts/c-cruscotto.html`: §0 field anatomy (rest + focus), hero B1 (tint map, badge position, no cookie/wavy/number), queue rows with "scad. dal 20/08"/"scad. dal 01/08" (#8 never-done ⇒ due anchors on delivery month 08/2025 + 12 mesi; #2 anchors on its lastDone), tiles 2/1/8 navigating to `/attivita?stato=...`, neutral stat bars (18% / 0,3% with visible pill), FAB sheet + settings sheet; calibration today 13/11/2026: hero badge "+4 g".
