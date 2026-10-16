import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { ActivityLog } from '../types';

export const logActivity = async (
  action: string,
  recordType: string,
  recordId?: string,
  details?: string
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert([
      {
        user_id: user?.id || null,
        user_email: user?.email || null,
        action,
        record_type: recordType,
        record_id: recordId || null,
        details: details || null,
      },
    ]);
  } catch {
    // Silent fail if activity_logs table not yet created
  }
};

export const fetchActivityLogs = async (limit = 100): Promise<ActivityLog[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isTableMissingError(error)) return [];
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};
