import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Deletes one row and PROVES it was deleted.
 * Supabase silently deletes 0 rows when the row is missing or you lack permission;
 * that must never look like success.
 */
export const deleteRowOrThrow = async (table: string, id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('Nothing was deleted. The record may already be gone, or you do not have permission.');
  }
};

/** Turns any thrown value into a readable message. */
export const errorMessage = (err: unknown, fallback = 'Something went wrong.'): string => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const anyErr = err as { message?: string; error_description?: string };
  return anyErr.message || anyErr.error_description || fallback;
};
