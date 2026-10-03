import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Whose data is the app showing right now?
 *  - normally: the signed-in user
 *  - admin "view account" mode: the user the admin opened
 * Set by AuthProvider on every render so services always read the latest value.
 */
let activeOwnerId: string | null = null;

export const setActiveOwnerId = (id: string | null) => {
  activeOwnerId = id;
};

export const getActiveOwnerId = (): string | null => activeOwnerId;

/** Owner id for writes. Falls back to the signed-in user. Throws if signed out. */
export const requireOwnerId = async (): Promise<string> => {
  if (activeOwnerId) return activeOwnerId;
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
  }
  throw new Error('Please sign in first.');
};
