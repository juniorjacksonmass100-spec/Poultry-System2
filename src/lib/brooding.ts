import { BroodingRecord } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Format a date using the device's local calendar day (avoids UTC day shifts). */
export const localDateISO = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** "2026-10-07" -> local midnight (so "today" never flips because of time zones) */
export const parseLocalDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export type HatchPhase = 'upcoming' | 'today' | 'overdue' | 'done' | 'failed';

export interface HatchCountdown {
  phase: HatchPhase;
  /** Whole days until the expected hatch date. Negative when overdue. */
  daysLeft: number;
  /** Days since the eggs were set (0 on the day they were set) */
  dayNumber: number;
  totalDays: number;
  /** 0-100 */
  percent: number;
  hatchDate: Date | null;
}

export const hatchCountdown = (rec: BroodingRecord, now: Date = new Date()): HatchCountdown => {
  const today = startOfDay(now);
  const start = parseLocalDate(rec.start_date);
  const hatch = parseLocalDate(rec.expected_hatch_date);

  const fromDates = start && hatch ? Math.round((hatch.getTime() - start.getTime()) / DAY_MS) : 0;
  const totalDays = Math.max(1, Number(rec.incubation_days) || fromDates || 21);

  const daysLeft = hatch ? Math.round((hatch.getTime() - today.getTime()) / DAY_MS) : 0;
  const elapsed = start ? Math.max(0, Math.round((today.getTime() - start.getTime()) / DAY_MS)) : 0;

  let phase: HatchPhase;
  if (rec.status === 'Failed') phase = 'failed';
  else if (rec.status === 'Hatched' || rec.status === 'Completed') phase = 'done';
  else if (daysLeft < 0) phase = 'overdue';
  else if (daysLeft === 0) phase = 'today';
  else phase = 'upcoming';

  const percent =
    phase === 'done' ? 100 : Math.max(0, Math.min(100, Math.round((Math.min(elapsed, totalDays) / totalDays) * 100)));

  return { phase, daysLeft, dayNumber: Math.min(elapsed, totalDays), totalDays, percent, hatchDate: hatch };
};

/** Batches that are still in the incubator, soonest hatch first */
export const upcomingHatches = (records: BroodingRecord[], now: Date = new Date()) =>
  records
    .map((rec) => ({ rec, c: hatchCountdown(rec, now) }))
    .filter((x) => x.c.phase === 'upcoming' || x.c.phase === 'today' || x.c.phase === 'overdue')
    .sort((a, b) => a.c.daysLeft - b.c.daysLeft);

export type MilestoneCode = 'candle1' | 'candle2' | 'lockdown' | 'hatching';

/**
 * Standard care steps for a 21-day chicken batch. Other birds have different timings,
 * so no steps are suggested for them.
 */
export const nextMilestone = (
  rec: BroodingRecord,
  c: HatchCountdown
): { code: MilestoneCode; inDays: number } | null => {
  if (c.totalDays !== 21 || (c.phase !== 'upcoming' && c.phase !== 'today')) return null;
  const steps: { code: MilestoneCode; day: number }[] = [
    { code: 'candle1', day: 7 },
    { code: 'candle2', day: 14 },
    { code: 'lockdown', day: 18 },
    { code: 'hatching', day: 21 },
  ];
  const next = steps.find((s) => s.day >= c.dayNumber);
  return next ? { code: next.code, inDays: next.day - c.dayNumber } : null;
};

export const milestoneText = (code: MilestoneCode, inDays: number, isSw: boolean): string => {
  const when = inDays === 0 ? (isSw ? 'leo' : 'today') : isSw ? `baada ya siku ${inDays}` : `in ${inDays} day${inDays === 1 ? '' : 's'}`;
  const label =
    code === 'candle1' ? (isSw ? 'Kagua mayai kwa mwanga (mara ya 1)' : 'First egg candling')
    : code === 'candle2' ? (isSw ? 'Kagua mayai kwa mwanga (mara ya 2)' : 'Second egg candling')
    : code === 'lockdown' ? (isSw ? 'Acha kugeuza mayai, ongeza unyevu' : 'Stop turning eggs, raise humidity')
    : isSw ? 'Siku ya kutotoa' : 'Hatch day';
  return `${label} ${when}`;
};

/** One short sentence for the countdown, e.g. "5 days left" */
export const countdownLabel = (c: HatchCountdown, isSw: boolean): string => {
  switch (c.phase) {
    case 'today':
      return isSw ? 'Kutotoa leo!' : 'Hatching today!';
    case 'overdue': {
      const n = Math.abs(c.daysLeft);
      return isSw ? `Imechelewa siku ${n}` : `${n} day${n === 1 ? '' : 's'} overdue`;
    }
    case 'done':
      return isSw ? 'Imetotolewa' : 'Hatched';
    case 'failed':
      return isSw ? 'Haikufanikiwa' : 'Failed';
    default:
      return isSw
        ? `Siku ${c.daysLeft} zimebaki`
        : `${c.daysLeft} day${c.daysLeft === 1 ? '' : 's'} left`;
  }
};
