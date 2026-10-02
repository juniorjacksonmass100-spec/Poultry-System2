import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'https://your-project-id.supabase.co'
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export const supabase = client as SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }
  return client;
}

/**
 * Checks if a Supabase error is due to missing tables in the database (PGRST205, 42P01, etc.).
 */
export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const code = String(error?.code || '');
  const msg = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();
  const hint = String(error?.hint || '').toLowerCase();

  return (
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === 'PGRST116' ||
    code === '42P01' || // PostgreSQL undefined_table
    code === '42703' || // undefined_column
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    details.includes('schema cache') ||
    details.includes('does not exist') ||
    hint.includes('does not exist')
  );
}
