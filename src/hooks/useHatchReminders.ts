import { useEffect, useMemo, useRef, useState } from 'react';
import { BroodingRecord } from '../types';
import { useBanner } from '../context/BannerContext';
import { hatchCountdown, localDateISO, parseLocalDate } from '../lib/brooding';
import { ScheduledReminder, syncScheduledReminders, showSystemNotification } from '../lib/notifications';
import { poultryTypeLabel } from '../lib/poultryLabels';

export interface HatchAlert {
  id: string;
  title: string;
  body: string;
  /** 0 = urgent (today / overdue), 1 = tomorrow */
  level: 0 | 1;
}

const ALERTED_PREFIX = 'kukutrack_hatch_alerted:';
const REMINDER_HOUR = 8; // 08:00 local time

const label = (rec: BroodingRecord, isSw: boolean) =>
  `${poultryTypeLabel(rec.poultry_type, isSw)}${rec.mother_bird_tag ? ` (${rec.mother_bird_tag})` : ''} · ${rec.number_of_eggs.toLocaleString()}`;

/**
 * Hatch alerts for batches still in the incubator:
 *  - alerts for today / tomorrow / overdue (shown in the bell and once a day as a banner)
 *  - Android app: reminders scheduled on the phone for 08:00 the day before and on hatch day
 */
export const useHatchReminders = (
  brooding: BroodingRecord[],
  enabled: boolean,
  isSw: boolean,
  onOpen: () => void
) => {
  const { pushBanner } = useBanner();
  const [permissionRevision, setPermissionRevision] = useState(0);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const refreshPermission = () => setPermissionRevision((revision) => revision + 1);
    window.addEventListener('kukutrack:notification-permission-changed', refreshPermission);
    return () => window.removeEventListener('kukutrack:notification-permission-changed', refreshPermission);
  }, []);

  const alerts = useMemo<HatchAlert[]>(() => {
    if (!enabled) return [];
    const out: HatchAlert[] = [];
    for (const rec of brooding) {
      const c = hatchCountdown(rec);
      if (c.phase === 'overdue') {
        const n = Math.abs(c.daysLeft);
        out.push({
          id: `hatch-overdue:${rec.id}`,
          level: 0,
          title: isSw ? 'Kutotoa kumechelewa' : 'Hatch overdue',
          body: isSw ? `${label(rec, isSw)}: imechelewa siku ${n}. Kagua mashine.` : `${label(rec, isSw)}: ${n} day${n === 1 ? '' : 's'} past the expected date. Check the incubator.`,
        });
      } else if (c.phase === 'today') {
        out.push({
          id: `hatch-today:${rec.id}`,
          level: 0,
          title: isSw ? 'Kutotoa leo!' : 'Hatching today!',
          body: isSw ? `${label(rec, isSw)} yanatarajiwa kutotoa leo.` : `${label(rec, isSw)} is due to hatch today.`,
        });
      } else if (c.phase === 'upcoming' && c.daysLeft === 1) {
        out.push({
          id: `hatch-tomorrow:${rec.id}`,
          level: 1,
          title: isSw ? 'Kutotoa kesho' : 'Hatching tomorrow',
          body: isSw ? `${label(rec, isSw)} yanatarajiwa kutotoa kesho. Andaa sehemu ya kulelea vifaranga.` : `${label(rec, isSw)} hatches tomorrow. Get the brooder ready.`,
        });
      }
    }
    return out.sort((a, b) => a.level - b.level);
  }, [brooding, enabled, isSw]);

  // One banner per alert per day
  useEffect(() => {
    if (!enabled || alerts.length === 0) return;
    const today = localDateISO();
    const fresh = alerts.filter((a) => {
      try {
        return localStorage.getItem(`${ALERTED_PREFIX}${today}:${a.id}`) === null;
      } catch {
        return true;
      }
    });
    if (fresh.length === 0) return;
    fresh.forEach((a) => {
      try {
        localStorage.setItem(`${ALERTED_PREFIX}${today}:${a.id}`, '1');
      } catch {
        // storage unavailable: may repeat the banner on reload
      }
    });
    const first = fresh[0];
    pushBanner({
      title: fresh.length > 1 ? (isSw ? 'Kutotoa kunakukaribia' : 'Hatches coming up') : first.title,
      body: fresh.length > 1 ? fresh.map((a) => a.title).join(' · ') : first.body,
      kind: 'hatch',
      onOpen: () => onOpenRef.current(),
    });
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      void showSystemNotification({ id: first.id, title: first.title, body: first.body, channel: 'hatch', isSw });
    }
  }, [alerts, enabled, isSw, pushBanner]);

  // Android app: schedule reminders on the phone
  const scheduleKey = useMemo(
    () =>
      enabled
        ? brooding
            .filter((r) => r.status === 'Active' || r.status === 'Due soon')
            .map((r) => `${r.id}:${r.expected_hatch_date}:${r.poultry_type}:${r.number_of_eggs}`)
            .join('|') + `|${isSw}`
        : 'off',
    [brooding, enabled, isSw]
  );
  useEffect(() => {
    const reminders: ScheduledReminder[] = [];
    if (enabled) {
      for (const rec of brooding) {
        if (rec.status !== 'Active' && rec.status !== 'Due soon') continue;
        const hatch = parseLocalDate(rec.expected_hatch_date);
        if (!hatch) continue;
        const dayBefore = new Date(hatch.getFullYear(), hatch.getMonth(), hatch.getDate() - 1, REMINDER_HOUR, 0, 0);
        const hatchDay = new Date(hatch.getFullYear(), hatch.getMonth(), hatch.getDate(), REMINDER_HOUR, 0, 0);
        reminders.push(
          {
            key: `hatch-before:${rec.id}:${rec.expected_hatch_date}`,
            at: dayBefore,
            title: isSw ? 'Kutotoa kesho' : 'Hatching tomorrow',
            body: isSw ? `${label(rec, isSw)} yanatarajiwa kutotoa kesho. Andaa sehemu ya kulelea vifaranga.` : `${label(rec, isSw)} hatches tomorrow. Get the brooder ready.`,
          },
          {
            key: `hatch-day:${rec.id}:${rec.expected_hatch_date}`,
            at: hatchDay,
            title: isSw ? 'Kutotoa leo!' : 'Hatching today!',
            body: isSw ? `${label(rec, isSw)} yanatarajiwa kutotoa leo.` : `${label(rec, isSw)} is due to hatch today.`,
          }
        );
      }
    }
    void syncScheduledReminders(reminders, isSw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey, permissionRevision, isSw]);

  return { alerts };
};
