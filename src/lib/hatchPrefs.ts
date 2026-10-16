import { useSyncExternalStore } from 'react';

/**
 * Hatch-day reminder settings, saved on the device.
 *  daysBefore: which days before the hatch date to remind (0 = on hatch day)
 *  hour:       the time of day for the phone reminders
 */
export interface HatchPrefs {
  enabled: boolean;
  daysBefore: number[];
  hour: number;
}

export const DEFAULT_HATCH_PREFS: HatchPrefs = { enabled: true, daysBefore: [3, 1, 0], hour: 8 };
export const DAY_CHOICES = [7, 3, 2, 1, 0];
export const HOUR_CHOICES = [6, 7, 8, 9, 12, 15, 18];

const KEY = 'kukutrack_hatch_prefs';
const EVENT = 'kukutrack-hatch-prefs';

const clean = (p: Partial<HatchPrefs> | null | undefined): HatchPrefs => {
  const days = Array.isArray(p?.daysBefore)
    ? Array.from(new Set(p!.daysBefore.filter((d) => Number.isInteger(d) && d >= 0 && d <= 30))).sort((a, b) => b - a)
    : DEFAULT_HATCH_PREFS.daysBefore;
  const hour = Number.isInteger(p?.hour) && (p!.hour as number) >= 0 && (p!.hour as number) <= 23 ? (p!.hour as number) : DEFAULT_HATCH_PREFS.hour;
  return { enabled: p?.enabled !== false, daysBefore: days, hour };
};

let cache: HatchPrefs | null = null;
let cacheRaw: string | null | undefined;

export const loadHatchPrefs = (): HatchPrefs => {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (cache && raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? clean(JSON.parse(raw)) : DEFAULT_HATCH_PREFS;
  } catch {
    cache = DEFAULT_HATCH_PREFS;
  }
  return cache;
};

export const saveHatchPrefs = (next: Partial<HatchPrefs>): HatchPrefs => {
  const merged = clean({ ...loadHatchPrefs(), ...next });
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // storage unavailable: the choice applies until the app is closed
    cache = merged;
  }
  window.dispatchEvent(new Event(EVENT));
  return merged;
};

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};

/** The current settings; screens update when they change. */
export const useHatchPrefs = (): HatchPrefs => useSyncExternalStore(subscribe, loadHatchPrefs, () => DEFAULT_HATCH_PREFS);
