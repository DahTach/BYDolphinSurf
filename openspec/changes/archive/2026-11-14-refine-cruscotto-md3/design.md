## Context

- v1 shipped and verified (archived: `openspec/changes/archive/2026-11-13-add-dolphin-tracker-mvp`); canonical specs live in `openspec/specs/`.
- User review flagged: non-MD3 inputs (Cruscotto + FAB form), inert gear, hero/sintesi/stat-card design, no "what's next" after the first deadline.
- Approved design source: `ui-drafts/c-cruscotto.html` (same tokens as `ui-drafts/b-blade.html`; sections: §0 fields, B1 hero, queue, sintesi tiles, neutral stat cards, FAB sheet, settings sheet). User picked: **hero B1**, queue yes, tiles → filtered Attività, settings sheet, neutral stat cards.
- Code-structure reference stays `~/Developer/AutofficinaPindemonte`; no new dependencies.

## Goals / Non-Goals

**Goals:** make the Cruscotto feel MD3-correct and more expressive per the approved draft; make sintesi interactive; surface the next 2 deadlines; give the gear a real function.

**Non-Goals:** restyling Storico/Prodotti/Attività cards (beyond the status filter), new pages, theme toggle, export.

## Decisions

**D1 — Shared MD3 filled-text-field** (`src/app/components/text-field/text-field.ts`, new; markup mirrors draft §0): container `h-14 rounded-full px-5 pt-2` with `bg-surfHiX` at rest → `bg-surfHi` + `ring-2 ring-prim` on `focus-within`; floating label 10px semibold `text-onSurfV` → bold `text-prim` on focus-within; **no bottom indicator and no squared corners** (user revision: pill-shaped fields coherent with the app's rounded language — supersedes the earlier `rounded-t-[4px]` + bottom-line anatomy). Inputs: `text-[16px] font-medium text-onSurf focus:outline-none`, optional trailing suffix slot (km / kWh/100 / € / h). Used by the 3 vehicle fields AND the 5 FAB-sheet fields (single source of MD3 anatomy). Angular `input`/`output` — no forms library (locked). Value emission is driven by a `commitOn` input: `'change'` commits on blur/Enter (vehicle fields — avoids mid-typing store rewrites), `'input'` emits per keystroke (FAB fields feed live validation).

**D2 — Hero B1** (draft §B1): `rounded-[32px] shadow-hero p-5 space-y-4`; container tint follows the hero activity's status: `scaduto` → `bg-errC` + text `text-onErrC`, header chip `bg-err text-onErr`, badge `bg-err text-onErr`, button `bg-err text-onErr`; `in-scadenza` → `bg-waC`/`text-onWaC`, chip `bg-waC text-onWaC`, badge `bg-waC text-onWaC`, button `bg-prim text-onPrim`; `ok` (future) → `bg-primC`/`text-onPrimC`, chip `bg-okC text-onOkC`, badge `bg-prim text-onPrim`, button `bg-prim text-onPrim`. Header row: label "Prossima scadenza" 12px bold uppercase tracking-[0.08em] at 60% opacity + status chip. Car SVG (same paths as the draft, tinted variant #b96357/#3e1d1c on errC, original #c96f60/#55291d on primC/waC) centered `h-24 w-auto`; countdown badge absolute `-top-1 right-2` pill 12px extrabold: overdue "+N g", future "tra N g", due-today "oggi" (same day is in-scadenza, never overdue — status.ts). Title 22px font-black, spec line 13px at 70%, chips `bg-white/[0.08] border-white/10` (battery + clock inline SVGs). **No wavy, no pentagon cookie, no display-size number.** Selection rule unchanged (scaduta with most recent due, else earliest future due).

**D3 — "Prossime" queue** (draft §C queue block): the 2 activities following the hero in the same priority order (scadute by most recent due first, then future by earliest due; hero excluded); tappable pill rows `rounded-full bg-surfC pl-2 pr-3 py-1.5`: leading 40px `bg-surfHi` circle with the draft calendar SVG, title 14px semibold truncated + sub-line 11px mut (interval · spec truncated), trailing chip 10px bold: scaduta → `bg-errC text-onErrC` "scad. dal dd/mm"; otherwise → `bg-secC text-onSecC` "tra N g". Tap navigates to `/attivita`. Hidden when fewer than 1 activity remains after the hero.

**D4 — Sintesi tiles** (draft sintesi block): keep the `bg-surfLox rounded-[28px]` card, heading and km-live footer; replace the three list rows with `grid grid-cols-3 gap-2.5` tappable tiles `rounded-[20px] px-2 py-3.5 text-center` + `active:scale-[0.97]`: In regola → `bg-okC text-onOkC`, In scadenza → `bg-waC text-onWaC`, Scadute → `bg-errC text-onErrC`; count 26px font-black, label 10px bold at 80%. Tap → `routerLink /attivita` with `queryParams { stato: 'ok' | 'in-scadenza' | 'scaduto' }`. Dots (emerald/amber/rose) disappear — the tile color carries the state.

**D5 — Prontezza + Cicli neutral** (draft stat block): back to `grid grid-cols-2 gap-3`, cards `bg-surfC rounded-[24px] p-4`; number 30px font-black (unit/suffix `text-sm` bold mut), sub-line 11px mut, bar `h-1.5 rounded-full bg-surfHiX` with `bg-prim` fill = real fraction (cicli: `min-w-[4px]` so 0,3% stays visible). **No ring/track/dot (removed with their constants), no wavy.** Subtitle prontezza "N di M in regola".

**D6 — Status filter in Attività**: the page reads the `stato` query param (`ok` | `in-scadenza` | `scaduto`); when present, a dismissible chip renders above the category chips (selected style `bg-secC text-onSecC font-bold` with the check SVG, label "Scadute (N)" / "In scadenza (N)" / "In regola (N)", trailing × button that clears the param); filter ANDs with the category chips and the card list re-derives. Direct URL entry works the same.

**D7 — Settings sheet** (draft settings block): gear button opens a M3E bottom sheet (`bg-surfC rounded-t-[28px] shadow-sheet px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]`, drag handle `w-9 h-1 rounded-full bg-outline mx-auto`, backdrop `bg-black/70` tap-to-close): rows 48px leading 36px `bg-surfHi` icon circles — (1) "Ripristina dati iniziali" + sub "Torna al seed di consegna": first tap swaps the row content to "Confermi il ripristino?" with Annulla/Conferma text buttons → `store.resetToSeed()` (new: overwrite state with `createSeedStore()` + persist, same write path as existing mutations) and closes; (2) "Consegna e consumo" + sub "Modifica i dati base del veicolo" → closes and navigates to Cruscotto scrolling/focusing the vehicle fields (fields wrapper gets `id="veicolo"`, navigate with fragment). Footer info line "BYD Dolphin Surf · tracker v1 · dati solo sul dispositivo". New component `src/app/components/settings-sheet/settings-sheet.ts`.

**D8 — FAB sheet polish** (draft FAB block): drag handle, all 5 fields (attività select, data, km, luogo, costo, durata) rebuilt on the text-field component (D1 — the select renders as a filled field with chevron); "Annulla" becomes an M3 text button (no border, `text-onSurfV text-sm font-bold`), "Registra" stays the filled `bg-prim` button; validation unchanged (ISO date regex + numeric km).

## Risks / Trade-offs

- [Hero tint per status needs chip/badge/button color permutations] → single `statusTint` map in the dashboard component; one source of truth.
- [Query-param filter can arrive on any navigation] → read via `ActivatedRoute.queryParamMap` computed, works for tiles, direct URL and back-button.
- [Reset wipes user data without app-level undo] → inline confirm step before `resetToSeed()`; localStorage key unchanged.

## Migration Plan

None (UI + one additive store method). Rollback = revert the change.

## Resolved Decisions (user, this round)

- Hero = B1 (car centerpiece, badge countdown, no wavy/cookie/display number).
- Queue = 2 pill rows shown in Cruscotto.
- Sintesi = tiles navigating to status-filtered Attività.
- Gear = settings sheet (reset with confirm + consegna/consumo jump + info footer).
- Stat cards = neutral surfC 2 columns, linear rounded bars, no wavy/ring.
