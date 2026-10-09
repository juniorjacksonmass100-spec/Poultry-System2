import { DirectMessage, UserProfile } from '../types';

/** Is this message addressed to me (as opposed to written by me / by someone else on my side)? */
export const isIncoming = (m: DirectMessage, me: string, isAdmin: boolean): boolean => {
  if (m.sender_id === me) return false;
  // An admin only "receives" what the farmer wrote, not what another admin wrote
  return isAdmin ? m.sender_id === m.thread_user_id : true;
};

export const unreadTotal = (messages: DirectMessage[], me: string, isAdmin: boolean): number =>
  messages.filter((m) => !m.pending && !m.read_at && isIncoming(m, me, isAdmin)).length;

export interface ChatThreadSummary {
  userId: string;
  user: UserProfile | null;
  last: DirectMessage | null;
  unread: number;
}

/**
 * Admin inbox: every farmer, with their last message and unread count.
 * Conversations with activity come first (newest first), then everyone else A-Z.
 */
export const buildThreads = (
  messages: DirectMessage[],
  users: UserProfile[],
  me: string,
  isAdmin: boolean
): ChatThreadSummary[] => {
  const byThread = new Map<string, DirectMessage[]>();
  for (const m of messages) {
    const arr = byThread.get(m.thread_user_id);
    if (arr) arr.push(m);
    else byThread.set(m.thread_user_id, [m]);
  }

  const result: ChatThreadSummary[] = [];
  const seen = new Set<string>();

  for (const u of users) {
    if (u.id === me) continue;
    seen.add(u.id);
    const msgs = byThread.get(u.id) || [];
    result.push({
      userId: u.id,
      user: u,
      last: msgs.length ? msgs[msgs.length - 1] : null,
      unread: msgs.filter((m) => !m.pending && !m.read_at && isIncoming(m, me, isAdmin)).length,
    });
  }
  // Threads for people missing from the user list (e.g. list not loaded yet)
  for (const [userId, msgs] of byThread) {
    if (seen.has(userId) || userId === me) continue;
    result.push({
      userId,
      user: null,
      last: msgs[msgs.length - 1],
      unread: msgs.filter((m) => !m.pending && !m.read_at && isIncoming(m, me, isAdmin)).length,
    });
  }

  return result.sort((a, b) => {
    if (a.last && b.last) return a.last.created_at < b.last.created_at ? 1 : -1;
    if (a.last) return -1;
    if (b.last) return 1;
    const an = (a.user?.full_name || a.user?.email || '').toLowerCase();
    const bn = (b.user?.full_name || b.user?.email || '').toLowerCase();
    return an.localeCompare(bn);
  });
};

/** Adds or replaces a message by id and keeps time order. */
export const upsertMessage = (list: DirectMessage[], msg: DirectMessage): DirectMessage[] => {
  const without = list.filter((m) => m.id !== msg.id);
  without.push(msg);
  return without.sort((a, b) => (a.created_at === b.created_at ? 0 : a.created_at < b.created_at ? -1 : 1));
};

export const dayLabel = (iso: string, isSw: boolean, now: Date = new Date()): string => {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return isSw ? 'Leo' : 'Today';
  if (diff === 1) return isSw ? 'Jana' : 'Yesterday';
  return d.toLocaleDateString(isSw ? 'sw-TZ' : undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
