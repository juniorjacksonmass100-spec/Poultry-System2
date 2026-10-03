import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requireOwnerId } from '../lib/scope';
import { logActivity } from './activityService';

/**
 * Lets a user remove wrongly-entered records from THEIR OWN account
 * (or, for an admin viewing a user, from that user's account).
 * Every delete is scoped to the active owner, so nobody else's data is touched.
 */
const clearTable = async (table: string, label: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
  const ownerId = await requireOwnerId();
  const { error } = await supabase.from(table).delete().eq('owner_id', ownerId);
  if (error) throw new Error(error.message);
  await logActivity('Data Reset', table, ownerId, `Cleared ${label} records`);
};

export const clearPoultryStocks = () => clearTable('poultry_stock', 'flock');
export const clearEggProductions = () => clearTable('egg_production', 'egg production');
export const clearBroodingRecords = () => clearTable('brooding_records', 'brooding');
export const clearExpenses = () => clearTable('expenses', 'expense');
export const clearSales = () => clearTable('sales', 'sales');

export const clearAllUserData = async (): Promise<void> => {
  // Sales first (they point at flocks), flocks last
  const steps = [clearSales, clearExpenses, clearEggProductions, clearBroodingRecords, clearPoultryStocks];
  const failures: string[] = [];
  for (const step of steps) {
    try {
      await step();
    } catch (err: any) {
      failures.push(err?.message || 'unknown error');
    }
  }
  if (failures.length > 0) {
    throw new Error(`Some records could not be cleared: ${failures[0]}`);
  }
};
