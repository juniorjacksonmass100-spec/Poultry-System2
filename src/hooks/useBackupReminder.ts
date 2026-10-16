import { useEffect, useRef } from 'react';
import { useBanner } from '../context/BannerContext';
import { lastBackupAt } from '../services/backupService';

/**
 * Once a day, if the account has records and no backup was saved in the last 7 days,
 * a banner asks the person to save one. Tapping it opens Settings.
 */
export const useBackupReminder = (opts: {
  ownerId: string | null;
  enabled: boolean;
  hasData: boolean;
  isSw: boolean;
  onOpen: () => void;
}) => {
  const { pushBanner } = useBanner();
  const onOpenRef = useRef(opts.onOpen);
  onOpenRef.current = opts.onOpen;

  useEffect(() => {
    const { ownerId, enabled, hasData, isSw } = opts;
    if (!ownerId || !enabled || !hasData) return;

    const last = lastBackupAt(ownerId);
    const days = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
    if (days < 7) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `kukutrack_backup_reminded:${ownerId}`;
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      // storage unavailable: the banner may appear on every start
    }

    // a short pause so it does not collide with the start-up banners
    const id = window.setTimeout(() => {
      pushBanner({
        title: isSw ? 'Hifadhi nakala ya akiba' : 'Save a backup',
        body: last
          ? isSw ? `Nakala ya mwisho ilikuwa siku ${Math.floor(days)} zilizopita. Gusa kuhifadhi mpya.` : `Your last backup was ${Math.floor(days)} days ago. Tap to save a new one.`
          : isSw ? 'Hujahifadhi nakala ya akiba ya data yako bado. Gusa kuhifadhi.' : 'You have not saved a backup of your data yet. Tap to save one.',
        kind: 'info',
        onOpen: () => onOpenRef.current(),
      });
    }, 2500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.ownerId, opts.enabled, opts.hasData, opts.isSw]);
};
