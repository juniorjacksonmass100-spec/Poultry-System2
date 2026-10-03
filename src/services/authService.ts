import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { logActivity } from './activityService';

export const checkIsFirstRun = async (): Promise<{ isFirstRun: boolean; isSchemaMissing: boolean }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { isFirstRun: false, isSchemaMissing: false };
  }
  try {
    // Check if profiles table exists
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (isTableMissingError(error)) {
        return { isFirstRun: true, isSchemaMissing: true };
      }
      return { isFirstRun: false, isSchemaMissing: false };
    }

    // Also verify if poultry_stock table exists
    const { error: pErr } = await supabase
      .from('poultry_stock')
      .select('id', { head: true, count: 'exact' });

    if (pErr && isTableMissingError(pErr)) {
      return { isFirstRun: count === 0, isSchemaMissing: true };
    }

    return { isFirstRun: count === 0, isSchemaMissing: false };
  } catch (err: any) {
    if (isTableMissingError(err)) {
      return { isFirstRun: true, isSchemaMissing: true };
    }
    return { isFirstRun: false, isSchemaMissing: false };
  }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not connected' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logActivity('Profile Updated', 'profiles', userId, JSON.stringify(updates));
  return { success: true };
};

/**
 * Creates the profile row for a signed-in user if it does not exist yet.
 * The database only lets you create a profile for yourself, always as "staff";
 * admin rights come from the database trigger / admin screen, never from here.
 */
export const ensureUserProfile = async (user: User): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('profiles').insert([
      {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Farm User'),
        phone: user.user_metadata?.phone || null,
      },
    ]);
  } catch {
    // Already exists or blocked - the caller falls back gracefully
  }
};
