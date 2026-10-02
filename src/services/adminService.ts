import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { logActivity } from './activityService';

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

export const deleteUserProfile = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;

  await logActivity('User Profile Deleted', 'profiles', userId);
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
  });

  if (error) {
    throw new Error(error.message || 'Failed to execute database reset operation');
  }

  return data;
};
