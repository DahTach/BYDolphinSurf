/* App-wide state (design D2/D4) — Angular signals only, no state library (zoneless:
   every mutation flows through signals, so change detection picks it up).
   One localStorage key `byd-dolphin:v1` holds the full store; read on boot into signals
   (seed when absent or unreadable), write-through on every mutation. */

import { Injectable, computed, signal } from '@angular/core';

import { Activity, HistoryEntry, Store } from './model';
import { createSeedStore } from './seed';

const STORAGE_KEY = 'byd-dolphin:v1';

export interface RegistrationInput {
  /** ISO yyyy-mm-dd */
  date: string;
  odometerKm: number;
  place?: string;
  durationHours?: number;
  costEur?: number;
}

function loadStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw != null) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidStore(parsed)) return parsed;
    }
  } catch {
    // localStorage unavailable/cleared or corrupt → fall back to seed (design.md Risks)
  }
  const seed = createSeedStore();
  writeStore(seed);
  return seed;
}

function isValidStore(value: unknown): value is Store {
  if (value == null || typeof value !== 'object') return false;
  const store = value as Partial<Store>;
  return (
    store.vehicle != null &&
    typeof store.vehicle.odometerKm === 'number' &&
    Array.isArray(store.activities) &&
    Array.isArray(store.history)
  );
}

function writeStore(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // persistence unavailable — the in-memory store keeps working
  }
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly state = signal<Store>(loadStore());

  readonly vehicle = computed(() => this.state().vehicle);
  readonly activities = computed(() => this.state().activities);
  readonly history = computed(() => this.state().history);

  setOdometer(km: number): void {
    this.updateVehicle({ odometerKm: km });
  }

  setConsumption(consumptionKwhPer100Km: number): void {
    this.updateVehicle({ consumptionKwhPer100Km: consumptionKwhPer100Km });
  }

  setDeliveryMonth(deliveryMonth: string): void {
    this.updateVehicle({ deliveryMonth });
  }

  /**
   * Quick registra + FAB form path (design D9): creates the history entry, updates the
   * activity's `lastDone`, persists — status recomputes from data.
   */
  registerActivity(activityId: number, input: RegistrationInput): void {
    const activity = this.state().activities.find((a) => a.id === activityId);
    if (activity == null) return;

    const entry: HistoryEntry = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `reg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      activityId,
      title: activity.title,
      date: input.date,
      odometerKm: input.odometerKm,
      place: input.place ?? '',
      ...(input.durationHours != null ? { durationHours: input.durationHours } : {}),
      ...(input.costEur != null ? { costEur: input.costEur } : {}),
    };

    this.mutate((store) => ({
      ...store,
      activities: store.activities.map((a) => replaceLastDone(a, activityId, input)),
      history: [...store.history, entry],
    }));
  }

  /** Settings sheet "Ripristina dati iniziali" (refine-cruscotto-md3 design D7): overwrites
      the whole state with the seed store and persists — same write path as the mutations. */
  resetToSeed(): void {
    this.mutate(() => createSeedStore());
  }

  private updateVehicle(patch: Partial<Store['vehicle']>): void {
    this.mutate((store) => ({ ...store, vehicle: { ...store.vehicle, ...patch } }));
  }

  private mutate(mutator: (store: Store) => Store): void {
    const next = mutator(this.state());
    this.state.set(next);
    writeStore(next);
  }
}

function replaceLastDone(activity: Activity, activityId: number, input: RegistrationInput): Activity {
  if (activity.id !== activityId) return activity;
  return { ...activity, lastDone: { date: input.date, odometerKm: input.odometerKm } };
}
