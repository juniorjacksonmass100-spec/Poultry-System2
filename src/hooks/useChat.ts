import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DirectMessage } from '../types';
import { deleteMessage, fetchMessages, markThreadRead, sendMessage } from '../services/chatService';
import { isIncoming, unreadTotal, upsertMessage } from '../lib/chat';
import { useBanner } from '../context/BannerContext';
import { showSystemNotification } from '../lib/notifications';

interface Options {
  userId: string | null;
  isAdmin: boolean;
  enabled: boolean;
  isSw: boolean;
  /** Name shown on the banner for a conversation (the farmer's name; "Admin" on the farmer side) */
  nameOf: (threadUserId: string) => string;
  /** The conversation currently open on screen (null when the Messages screen is closed) */
  openThread: string | null;
  /** Tapping a banner */
  onOpen: (threadUserId: string) => void;
}

/**
 * Keeps the conversation(s) in sync with the database:
 *  - loads on start, on coming back to the app and after every reconnect
 *  - applies live inserts / deletes / read receipts from other devices at once
 *  - shows a WhatsApp-style banner for new incoming messages (and a phone alert when the app is hidden)
 */
export const useChat = ({ userId, isAdmin, enabled, isSw, nameOf, openThread, onOpen }: Options) => {
  const { pushBanner } = useBanner();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const first = useRef(true);
  const seenIds = useRef<Set<string>>(new Set());
  const openThreadRef = useRef(openThread);
  openThreadRef.current = openThread;
  const nameOfRef = useRef(nameOf);
  nameOfRef.current = nameOf;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const seq = useRef(0);

  const announce = useCallback(
    (m: DirectMessage) => {
      if (!userId) return;
      const viewing = openThreadRef.current === m.thread_user_id && document.visibilityState === 'visible';
      if (viewing) {
        void markThreadRead(m.thread_user_id);
        return;
      }
      const title = nameOfRef.current(m.thread_user_id);
      pushBanner({ title, body: m.body, kind: 'message', onOpen: () => onOpenRef.current(m.thread_user_id) });
      if (document.visibilityState === 'hidden') {
        void showSystemNotification({ id: `dm:${m.id}`, title, body: m.body });
      }
    },
    [userId, pushBanner]
  );

  const load = useCallback(async () => {
    if (!userId || !enabled) return;
    const mine = ++seq.current;
    const data = await fetchMessages(userId, isAdmin);
    if (mine !== seq.current) return;

    // Keep any message still being sent from this device
    setMessages((prev) => {
      const pending = prev.filter((m) => m.pending && !data.some((d) => d.id === m.id));
      return [...data, ...pending];
    });
    setLoading(false);

    const incomingUnread = data.filter((m) => !m.read_at && isIncoming(m, userId, isAdmin));
    if (first.current) {
      first.current = false;
      data.forEach((m) => seenIds.current.add(m.id));
      // One summary banner at start instead of one per old message
      const toShow = incomingUnread.filter((m) => openThreadRef.current !== m.thread_user_id);
      if (toShow.length > 0) {
        pushBanner({
          title: 'KukuTrack',
          body: isSw
            ? `Una ujumbe ${toShow.length} mpya`
            : `You have ${toShow.length} unread message${toShow.length === 1 ? '' : 's'}`,
          kind: 'message',
          onOpen: () => onOpenRef.current(toShow[toShow.length - 1].thread_user_id),
        });
      }
    } else {
      // Messages that arrived while the app was closed / offline
      const fresh = incomingUnread.filter((m) => !seenIds.current.has(m.id));
      data.forEach((m) => seenIds.current.add(m.id));
      fresh.slice(-3).forEach(announce);
    }
  }, [userId, enabled, isAdmin, isSw, pushBanner, announce]);

  // New account on screen: start clean
  useEffect(() => {
    first.current = true;
    seenIds.current = new Set();
    seq.current++;
    setMessages([]);
    setLoading(true);
  }, [userId, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates
  useEffect(() => {
    if (!userId || !enabled || !isSupabaseConfigured || !supabase) return;
    const db = supabase;

    const channel = db
      .channel(`chat:${userId}:${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old?.id;
          if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
          return;
        }
        const row = payload.new as DirectMessage | undefined;
        if (!row?.id) return;
        // A farmer only receives their own thread (database rules), admins receive all
        setMessages((prev) => upsertMessage(prev, { ...row, pending: false }));
        if (payload.eventType === 'INSERT' && !seenIds.current.has(row.id)) {
          seenIds.current.add(row.id);
          if (isIncoming(row, userId, isAdmin)) announce(row);
        }
      })
      .subscribe((status: string) => {
        // After a (re)connect, fetch anything missed while offline
        if (status === 'SUBSCRIBED') void load();
      });

    return () => {
      db.removeChannel(channel);
    };
  }, [userId, enabled, isAdmin, announce, load]);

  // Coming back to the app
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const send = useCallback(
    async (threadUserId: string, body: string) => {
      if (!userId) throw new Error('Please sign in first.');
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const temp: DirectMessage = {
        id: tempId,
        thread_user_id: threadUserId,
        sender_id: userId,
        body: body.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => upsertMessage(prev, temp));
      try {
        const saved = await sendMessage(threadUserId, body);
        seenIds.current.add(saved.id);
        setMessages((prev) => upsertMessage(prev.filter((m) => m.id !== tempId), saved));
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [userId]
  );

  const remove = useCallback(async (id: string) => {
    await deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const markRead = useCallback(
    async (threadUserId: string) => {
      if (!userId) return;
      // Update the screen at once, then tell the database
      setMessages((prev) =>
        prev.map((m) =>
          m.thread_user_id === threadUserId && !m.read_at && isIncoming(m, userId, isAdmin)
            ? { ...m, read_at: new Date().toISOString() }
            : m
        )
      );
      await markThreadRead(threadUserId);
    },
    [userId, isAdmin]
  );

  const unread = useMemo(() => (userId ? unreadTotal(messages, userId, isAdmin) : 0), [messages, userId, isAdmin]);

  return { messages, loading, unread, send, remove, markRead, refresh: load };
};
