import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveOwnerId } from '../lib/scope';
import { PoultryValuation } from '../types';

/**
 * Every time the worth of a flock is entered or changed, the database saves a history
 * point automatically (trigger in migration 003). This reads that history for the
 * account on screen. Quietly empty if the migration has not been run yet.
 */
export const fetchValuations = async (): Promise<PoultryValuation[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('poultry_valuations')
      .select('id, stock_id, unit_value, quantity, recorded_at')
      .eq('owner_id', ownerId)
      .order('recorded_at', { ascending: true });
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({ ...r, unit_value: Number(r.unit_value), quantity: Number(r.quantity) }));
  } catch {
    return [];
  }
};
