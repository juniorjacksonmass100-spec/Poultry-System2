import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { EggProduction } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { deleteRowOrThrow } from '../lib/db';

export const fetchEggProductions = async (): Promise<EggProduction[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('egg_production')
      .select('*')
      .eq('owner_id', ownerId)
      .order('production_date', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const createOrUpdateEggProduction = async (
  record: Omit<EggProduction, 'id' | 'created_at' | 'updated_at' | 'remaining_eggs' | 'total_egg_revenue'>
): Promise<EggProduction> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = await requireOwnerId();
  const remaining = Math.max(
    0,
    record.eggs_collected -
      record.broken_eggs -
      record.spoiled_eggs -
      record.eggs_sold -
      record.eggs_used_internally
  );
  const revenue = record.eggs_sold * record.selling_price_per_egg;

  const { data, error } = await supabase
    .from('egg_production')
    .upsert(
      {
        ...record,
        owner_id: ownerId,
        remaining_eggs: remaining,
        total_egg_revenue: revenue,
        recorded_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,production_date' }
    )
    .select()
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      throw new Error('Database tables not yet created in Supabase. Please copy and execute the SQL schema from the setup banner.');
    }
    throw error;
  }

  await logActivity(
    'Egg Collection Logged',
    'egg_production',
    data.id,
    `Date: ${data.production_date}, Collected: ${data.eggs_collected}, Remaining: ${data.remaining_eggs}`
  );

  return data;
};

export const deleteEggProduction = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  await deleteRowOrThrow('egg_production', id);

  await logActivity('Egg Production Record Deleted', 'egg_production', id);
};
