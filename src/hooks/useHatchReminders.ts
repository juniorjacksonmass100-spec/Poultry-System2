import { useEffect, useMemo, useRef, useState } from 'react';
import { BroodingRecord } from '../types';
import { useBanner } from '../context/BannerContext';
import { hatchCountdown, localDateISO, parseLocalDate } from '../lib/brooding';
import { useHatchPrefs } from '../lib/hatchPrefs';
import { poultryTypeLabel } from '../lib/labels';
import {
  ScheduledReminder,
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
  syncScheduledReminders,
} from '../lib/notifications';

export interface HatchAlert {
  id: string;
  title: string;
  body: string;
  /** 0 = urgent (today / overdue), 1 = tomorrow or soon */
  level: 0 | 1;
}

const ALERTED_PREFIX = 'kukutrack_hatch_alerted:';
const ASKED_KEY = 'kukutrack_hatch_asked_permission';

const label = (rec: BroodingRecord) =>
  `${poultryTypeLabel(rec.poultry_type)}${rec.mother_bird_tag ? ` (${rec.mother_bird_tag})` : ''} · ${rec.number_of_eggs.toLocaleString()}`;

/** The wording for a reminder that is `daysLeft` days before hatching. */
const wording = (rec: BroodingRecord, daysLeft: number, isSw: boolean): { title: string; body: string } => {
  const who = label(rec);
  if (daysLeft <= 0)
    return {
      title: isSw ? 'Kutotolewa leo!' : 'Hatching today!',
      body: isSw ? `${who} yanatarajiwa kutotolewa leo. Kagua mashine.` : `${who} is due to hatch today. Check the incubator.`,
    };
  if (daysLeft === 1)
    return {
      title: isSw ? 'Kutotolewa kesho' : 'Hatching tomorrow',
      body: isSw ? `${who} yanatotolewa kesho. Andaa chumba cha malezi.` : `${who} hatches tomorrow. Get the brooder ready.`,
    };
  return {
    title: isSw ? `Kutotolewa baada ya siku ${daysLeft}` : `Hatching in ${daysLeft} days`,
    body: isSw ? `${who} yanatotolewa baada ya siku ${daysLeft}. Anza maandalizi.` : `${who} hatches in ${daysLeft} days. Start getting ready.`,
  };
};

/**
 * Hatch alerts for batches still in the incubator:
 *  - the bell and a once-a-day banner for: overdue, hatching today, tomorrow, and any extra "days before" the person chose
 *  - Android: reminders on the phone's alarm clock at the chosen time, even when the app is closed
 *  - asks permission for alerts once, with a banner, when there is a batch to remind about
 */
export const useHatchReminders = (
  brooding: BroodingRecord[],
  enabled: boolean,
  isSw: boolean,
  onOpen: () => void
) => {
  const { pushBanner } = useBanner();
  const prefs = useHatchPrefs();
  const on = enabled && prefs.enabled;
  const [permissionRevision, setPermissionRevision] = useState(0);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const refreshPermission = () => setPermissionRevision((revision) => revision + 1);
    window.addEventListener('kukutrack:notification-permission-changed', refreshPermission);
    return () => window.removeEventListener('kukutrack:notification-permission-changed', refreshPermission);
  }, []);

  const alerts = useMemo<HatchAlert[]>(() => {
    if (!on) return [];
    const out: HatchAlert[] = [];
    for (const rec of brooding) {
      const c = hatchCountdown(rec);
      if (c.phase === 'overdue') {
        const n = Math.abs(c.daysLeft);
        out.push({
          id: `hatch-overdue:${rec.id}`,
          level: 0,
          title: isSw ? 'Kutotolewa kumechelewa' : 'Hatch overdue',
          body: isSw ? `${label(rec)}: imechelewa siku ${n}. Kagua mashine.` : `${label(rec)}: ${n} day${n === 1 ? '' : 's'} past the expected date. Check the incubator.`,
        });
      } else if (c.phase === 'today') {
        out.push({ id: `hatch-today:${rec.id}`, level: 0, ...wording(rec, 0, isSw) });
      } else if (c.phase === 'upcoming' && (c.daysLeft === 1 || prefs.daysBefore.includes(c.daysLeft))) {
        out.push({ id: `hatch-in-${c.daysLeft}:${rec.id}`, level: c.daysLeft === 1 ? 0 : 1, ...wording(rec, c.daysLeft, isSw) });
      }
    }
    return out.sort((a, b) => a.level - b.level);
  }, [brooding, on, isSw, prefs.daysBefore]);

  // One banner per alert per day
  useEffect(() => {
    if (!on || alerts.length === 0) return;
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
      title: fresh.length > 1 ? (isSw ? 'Kutotolewa kunakukaribia' : 'Hatches coming up') : first.title,
      body: fresh.length > 1 ? fresh.map((a) => a.title).join(' · ') : first.body,
      kind: 'hatch',
      onOpen: () => onOpenRef.current(),
    });
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      void showSystemNotification({ id: first.id, title: first.title, body: first.body, channel: 'hatch', isSw });
    }
  }, [alerts, on, isSw, pushBanner]);

  // Phone reminders at the chosen days and time
  const active = useMemo(() => brooding.filter((r) => r.status === 'Active' || r.status === 'Due soon'), [brooding]);
  const scheduleKey = useMemo(
    () =>
      on
        ? active.map((r) => `${r.id}:${r.expected_hatch_date}:${r.poultry_type}:${r.number_of_eggs}`).join('|') +
          `|${isSw}|${prefs.daysBefore.join(',')}|${prefs.hour}`
        : 'off',
    [active, on, isSw, prefs.daysBefore, prefs.hour]
  );
  useEffect(() => {
    const reminders: ScheduledReminder[] = [];
    if (on) {
      for (const rec of active) {
        const hatch = parseLocalDate(rec.expected_hatch_date);
        if (!hatch) continue;
        for (const d of prefs.daysBefore) {
          const at = new Date(hatch.getFullYear(), hatch.getMonth(), hatch.getDate() - d, prefs.hour, 0, 0);
          const w = wording(rec, d, isSw);
          reminders.push({ key: `hatch:${rec.id}:${rec.expected_hatch_date}:${d}`, at, title: w.title, body: w.body });
        }
      }
    }
    void syncScheduledReminders(reminders, isSw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey, permissionRevision, isSw]);

  // Alerts need the person's permission: ask once, with a banner, when there is something to remind about
  useEffect(() => {
    if (!on || active.length === 0) return;
    let cancelled = false;
    (async () => {
      const state = await getNotificationPermission();
      if (cancelled || state !== 'default') return;
      try {
        if (localStorage.getItem(ASKED_KEY)) return;
        localStorage.setItem(ASKED_KEY, '1');
      } catch {
        // storage unavailable: may ask again next time
      }
      window.setTimeout(() => {
        pushBanner({
          title: isSw ? 'Washa vikumbusho' : 'Turn on reminders',
          body: isSw ? 'Gusa hapa ili upate kikumbusho siku ya kutotolewa kwa mayai yako.' : 'Tap here to get a reminder on the day your eggs hatch.',
          kind: 'hatch',
          onOpen: async () => {
            await requestNotificationPermission();
            // re-run scheduling now that permission may be granted
            window.dispatchEvent(new Event('kukutrack-hatch-prefs'));
          },
        });
      }, 4000);
    })();
    return () => {
      cancelled = true;
    };
  }, [on, active.length, isSw, pushBanner]);

  return { alerts };
};
