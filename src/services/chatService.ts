import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DirectMessage } from '../types';

import { tr } from '../lib/locale';
const need = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error(tr('Database not configured', 'Hifadhidata haijawekwa.'));
  return supabase;
};

const friendly = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('row-level security')) return tr('You are not allowed to send this message.', 'Huruhusiwi kutuma ujumbe huu.');
  if (m.includes('direct_messages') && m.includes('schema cache')) return tr('Messaging is not set up yet. Run the latest SQL migration (004) in Supabase.', 'Ujumbe haujawekwa bado. Endesha SQL ya hivi karibuni (004) kwenye Supabase.');
  if (m.includes('body_check')) return tr('A message must be between 1 and 2000 characters.', 'Ujumbe lazima uwe na herufi 1 hadi 2000.');
  return message;
};

/** Farmer: their own thread. Admin: every thread (newest 1000). */
export const fetchMessages = async (userId: string, isAdmin: boolean): Promise<DirectMessage[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    let query = supabase
      .from('direct_messages')
      .select('id, thread_user_id, sender_id, body, read_at, created_at');
    query = isAdmin
      ? query.order('created_at', { ascending: false }).limit(1000)
      : query.eq('thread_user_id', userId).order('created_at', { ascending: false }).limit(500);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];
    return (data as DirectMessage[]).reverse();
  } catch {
    return [];
  }
};

export const sendMessage = async (threadUserId: string, body: string): Promise<DirectMessage> => {
  const db = need();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error(tr('Please sign in first.', 'Tafadhali ingia kwanza.'));
  const text = body.trim();
  if (!text) throw new Error(tr('Type a message first.', 'Andika ujumbe kwanza.'));
  if (text.length > 2000) throw new Error(tr('A message can be at most 2000 characters.', 'Ujumbe unaweza kuwa na herufi 2000 tu.'));

  const { data, error } = await db
    .from('direct_messages')
    .insert([{ thread_user_id: threadUserId, sender_id: auth.user.id, body: text }])
    .select('id, thread_user_id, sender_id, body, read_at, created_at')
    .single();
  if (error) throw new Error(friendly(error.message));
  return data as DirectMessage;
};

export const deleteMessage = async (id: string): Promise<void> => {
  const db = need();
  const { data, error } = await db.from('direct_messages').delete().eq('id', id).select('id');
  if (error) throw new Error(friendly(error.message));
  if (!data || data.length === 0) throw new Error(tr('The message could not be deleted.', 'Ujumbe haukuweza kufutwa.'));
};

/** Marks what you received in a thread as read. Returns how many changed. */
export const markThreadRead = async (threadUserId: string): Promise<number> => {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const { data, error } = await supabase.rpc('mark_thread_read', { p_thread: threadUserId });
    if (error) return 0;
    return Number(data) || 0;
  } catch {
    return 0;
  }
};
