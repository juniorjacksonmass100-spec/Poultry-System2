import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId } from '../lib/scope';

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  await logActivity('User Role Changed', 'profiles', userId, `Changed role to: ${newRole}`);
};

export const toggleUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  await logActivity(
    isActive ? 'User Activated' : 'User Deactivated',
    'profiles',
    userId,
    `Account status changed to: ${isActive ? 'Active' : 'Inactive'}`
  );
};

/**
 * Permanently deletes a user: their login, profile and ALL of their data.
 * Runs as a protected database function (admins only).
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
  if (error) {
    if (String(error.message).toLowerCase().includes('could not find the function')) {
      throw new Error('Please run the latest SQL migration (002_user_isolation_and_news.sql) in Supabase first.');
    }
    throw new Error(error.message);
  }
};

export interface UserSummary {
  user_id: string;
  flock_count: number;
  egg_record_count: number;
  brooding_count: number;
  expense_count: number;
  sale_count: number;
}

/** Record counts per user for the admin user list. Quietly empty if the SQL migration has not been run. */
export const fetchUserSummaries = async (): Promise<Record<string, UserSummary>> => {
  if (!isSupabaseConfigured || !supabase) return {};
  try {
    const { data, error } = await supabase.rpc('admin_user_summaries');
    if (error || !Array.isArray(data)) return {};
    const map: Record<string, UserSummary> = {};
    for (const row of data) {
      map[row.user_id] = {
        user_id: row.user_id,
        flock_count: Number(row.flock_count),
        egg_record_count: Number(row.egg_record_count),
        brooding_count: Number(row.brooding_count),
        expense_count: Number(row.expense_count),
        sale_count: Number(row.sale_count),
      };
    }
    return map;
  } catch {
    return {};
  }
};

export const executeDatabaseReset = async (
  confirmationPhrase: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database not connected');
  }

  if (confirmationPhrase !== 'DELETE EVERYTHING') {
    throw new Error('Confirmation phrase does not match. Exact phrase "DELETE EVERYTHING" is required.');
  }

  const { data, error } = await supabase.rpc('reset_business_database', {
    confirmation_phrase: confirmationPhrase,
    target_owner: getActiveOwnerId(),
  });

  if (error) {
    throw new Error(error.message || 'Failed to execute database reset operation');
  }

  return data;
};
