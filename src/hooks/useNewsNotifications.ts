import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PoultryNews } from '../types';
import { useBanner } from '../context/BannerContext';
import { showSystemNotification } from '../lib/notifications';

const SEEN_PREFIX = 'kukutrack_seen_news:';
const BASELINE_DAYS = 7;

interface Options {
  news: PoultryNews[];
  userId: string | null;
  /** false while an admin is looking inside someone else's account */
  enabled: boolean;
  isSw: boolean;
  /** Called when a banner is tapped */
  onOpen: () => void;
  /** The News screen counts as "reading" */
  isNewsScreenOpen: boolean;
}

const readSeen = (userId: string): { ids: Set<string>; existed: boolean } => {
  try {
    const raw = localStorage.getItem(SEEN_PREFIX + userId);
    if (raw === null) return { ids: new Set(), existed: false };
    const parsed = JSON.parse(raw);
    return { ids: new Set(Array.isArray(parsed) ? parsed : []), existed: true };
  } catch {
    return { ids: new Set(), existed: false };
  }
};

const writeSeen = (userId: string, ids: Set<string>) => {
  try {
    // keep the list from growing forever
    localStorage.setItem(SEEN_PREFIX + userId, JSON.stringify(Array.from(ids).slice(-300)));
  } catch {
    // storage unavailable: unread state resets next visit
  }
};

/**
 * Turns incoming news into notifications, WhatsApp style:
 *  - an unread counter for the bell
 *  - a banner at the top of the screen for each new message
 *  - a phone / browser notification when the app is not on screen
 */
export const useNewsNotifications = ({ news, userId, enabled, isSw, onOpen, isNewsScreenOpen }: Options) => {
  const { pushBanner } = useBanner();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const announced = useRef<Set<string>>(new Set());
  const firstBatch = useRef(true);
  const seenExisted = useRef(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // Messages meant for this person (broadcasts + addressed to them), not ones they wrote
  const items = useMemo(() => {
    if (!enabled || !userId) return [];
    return news
      .filter((n) => (!n.target_user_id || n.target_user_id === userId) && n.author_id !== userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [news, userId, enabled]);

  // New account on screen: reload what it has already read
  useEffect(() => {
    announced.current = new Set();
    firstBatch.current = true;
    if (!userId) {
      setSeen(new Set());
      return;
    }
    const { ids, existed } = readSeen(userId);
    seenExisted.current = existed;
    setSeen(ids);
  }, [userId]);

  const unread = useMemo(() => items.filter((n) => !seen.has(n.id)), [items, seen]);

  // Announce messages
  useEffect(() => {
    if (!userId || !enabled || items.length === 0) return;

    // First time this device sees this account: do not flood with old history
    if (firstBatch.current && !seenExisted.current) {
      const cutoff = Date.now() - BASELINE_DAYS * 86400000;
      const old = items.filter((n) => new Date(n.created_at).getTime() < cutoff).map((n) => n.id);
      if (old.length > 0) {
        const next = new Set(seen);
        old.forEach((id) => next.add(id));
        seenExisted.current = true;
        writeSeen(userId, next);
        setSeen(next);
        return;
      }
      seenExisted.current = true;
    }

    const fresh = unread.filter((n) => !announced.current.has(n.id));
    if (fresh.length === 0) {
      firstBatch.current = false;
      return;
    }
    fresh.forEach((n) => announced.current.add(n.id));

    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const summary = firstBatch.current || fresh.length > 2;
    firstBatch.current = false;

    if (summary) {
      const title = isSw ? 'KukuTrack' : 'KukuTrack';
      const body = isSw
        ? `Una ujumbe ${fresh.length} ambao haujasomwa`
        : `You have ${fresh.length} unread message${fresh.length === 1 ? '' : 's'}`;
      pushBanner({ title, body, kind: 'message', onOpen: () => onOpenRef.current() });
      if (hidden) void showSystemNotification({ id: `summary:${fresh[0].id}`, title, body, isSw });
      return;
    }

    for (const n of fresh) {
      pushBanner({
        title: n.title,
        body: n.content,
        kind: 'message',
        onOpen: () => onOpenRef.current(),
      });
      if (hidden) void showSystemNotification({ id: `news:${n.id}`, title: n.title, body: n.content, isSw });
    }
  }, [items, unread, userId, enabled, isSw, pushBanner, seen]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    setSeen((prev) => {
      const next = new Set(prev);
      items.forEach((n) => next.add(n.id));
      writeSeen(userId, next);
      return next;
    });
  }, [items, userId]);

  // Opening the News screen counts as reading
  useEffect(() => {
    if (!isNewsScreenOpen || unread.length === 0) return;
    const id = window.setTimeout(markAllRead, 1200);
    return () => window.clearTimeout(id);
  }, [isNewsScreenOpen, unread.length, markAllRead]);

  return { items, unreadIds: new Set(unread.map((n) => n.id)), unreadCount: unread.length, markAllRead };
};
