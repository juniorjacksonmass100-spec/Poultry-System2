import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProfileChangeRequest } from '../types';
import { fetchChangeRequests } from '../services/requestService';
import { useBanner } from '../context/BannerContext';
import { showSystemNotification } from '../lib/notifications';

interface Options {
  userId: string | null;
  isAdmin: boolean;
  enabled: boolean;
  isSw: boolean;
  nameOf: (userId: string) => string;
  /** Called after one of MY requests was approved (so the screen picks up the new email / phone / name) */
  onMyRequestApproved: () => void;
  onOpenAdmin: () => void;
}

/**
 * Admin: all change requests, with a banner when a new one arrives.
 * Farmer: their own requests, with a banner when the admin decides.
 */
export const useChangeRequests = ({ userId, isAdmin, enabled, isSw, nameOf, onMyRequestApproved, onOpenAdmin }: Options) => {
  const { pushBanner } = useBanner();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const known = useRef<Map<string, string> | null>(null); // id -> status, null until first load
  const nameOfRef = useRef(nameOf);
  nameOfRef.current = nameOf;
  const approvedRef = useRef(onMyRequestApproved);
  approvedRef.current = onMyRequestApproved;
  const adminRef = useRef(onOpenAdmin);
  adminRef.current = onOpenAdmin;
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!userId || !enabled) return;
    const mine = ++seq.current;
    const data = await fetchChangeRequests(isAdmin ? undefined : userId);
    if (mine !== seq.current) return;
    setRequests(data);

    const previous = known.current;
    known.current = new Map(data.map((r) => [r.id, r.status]));
    if (previous === null) return; // first load: no banners for old items

    for (const r of data) {
      const before = previous.get(r.id);
      const hidden = document.visibilityState === 'hidden';

      if (isAdmin && r.user_id !== userId && before === undefined && r.status === 'pending') {
        const title = isSw ? 'Ombi la mabadiliko' : 'New change request';
        const label = r.field === 'email' ? (isSw ? 'barua pepe' : 'email') : r.field === 'phone' ? (isSw ? 'namba ya simu' : 'phone number') : isSw ? 'jina' : 'name';
        const body = `${nameOfRef.current(r.user_id)}: ${label} → ${r.new_value}`;
        pushBanner({ title, body, kind: 'info', onOpen: () => adminRef.current() });
        if (hidden) void showSystemNotification({ id: `req:${r.id}`, title, body, isSw });
      }

      if (r.user_id === userId && before === 'pending' && r.status !== 'pending') {
        const title = r.status === 'approved' ? (isSw ? 'Mabadiliko yamekubaliwa' : 'Change approved') : isSw ? 'Mabadiliko hayakukubaliwa' : 'Change not approved';
        const body = r.status === 'approved' ? r.new_value : r.admin_note || (isSw ? 'Wasiliana na msimamizi.' : 'Ask the admin for details.');
        pushBanner({ title, body, kind: 'info' });
        if (hidden) void showSystemNotification({ id: `req:${r.id}`, title, body, isSw });
        if (r.status === 'approved') approvedRef.current();
      }
    }
  }, [userId, enabled, isAdmin, isSw, pushBanner]);

  useEffect(() => {
    known.current = null;
    seq.current++;
    setRequests([]);
  }, [userId, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId || !enabled || !isSupabaseConfigured || !supabase) return;
    const db = supabase;
    const channel = db
      .channel(`pcr:${userId}:${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_change_requests' }, () => void load())
      .subscribe();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      db.removeChannel(channel);
    };
  }, [userId, enabled, load]);

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending' && r.user_id !== userId), [requests, userId]);

  return { requests, pending, refresh: load };
};
