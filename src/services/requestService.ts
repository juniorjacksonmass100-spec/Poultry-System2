import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ChangeField, ProfileChangeRequest } from '../types';

const need = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
  return supabase;
};

const friendly = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('could not find the function') || m.includes('schema cache'))
    return 'Change requests are not set up yet. Run the latest SQL migration (004) in Supabase.';
  return message;
};

const COLUMNS = 'id, user_id, field, old_value, new_value, status, admin_note, reviewed_at, created_at';

/** userId given: that person's requests. No userId (admin): everyone's. */
export const fetchChangeRequests = async (userId?: string): Promise<ProfileChangeRequest[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    let q = supabase.from('profile_change_requests').select(COLUMNS).order('created_at', { ascending: false }).limit(200);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error || !Array.isArray(data)) return [];
    return data as ProfileChangeRequest[];
  } catch {
    return [];
  }
};

export const submitChangeRequest = async (field: ChangeField, newValue: string): Promise<void> => {
  const { error } = await need().rpc('request_profile_change', { p_field: field, p_new_value: newValue });
  if (error) throw new Error(friendly(error.message));
};

export const cancelChangeRequest = async (id: string): Promise<void> => {
  const { data, error } = await need().from('profile_change_requests').delete().eq('id', id).select('id');
  if (error) throw new Error(friendly(error.message));
  if (!data || data.length === 0) throw new Error('This request can no longer be cancelled.');
};

export const reviewChangeRequest = async (id: string, approve: boolean, note: string): Promise<void> => {
  const { error } = await need().rpc('review_profile_change', {
    p_request: id,
    p_approve: approve,
    p_note: note.trim() || null,
  });
  if (error) throw new Error(friendly(error.message));
};
