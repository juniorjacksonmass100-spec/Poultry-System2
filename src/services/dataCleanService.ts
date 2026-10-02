import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './activityService';

/**
 * Service allowing users to clean up erroneous records in their accounts
 */

export const clearPoultryStocks = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('poultry_stock').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await logActivity('Data Reset', 'poultry_stock', undefined, 'User cleared flock records');
};

export const clearEggProductions = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('egg_production').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await logActivity('Data Reset', 'egg_production', undefined, 'User cleared egg production records');
};

export const clearBroodingRecords = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('brooding_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await logActivity('Data Reset', 'brooding_records', undefined, 'User cleared brooding records');
};

export const clearExpenses = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await logActivity('Data Reset', 'expenses', undefined, 'User cleared expense records');
};

export const clearSales = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await logActivity('Data Reset', 'sales', undefined, 'User cleared sales records');
};

export const clearAllUserData = async (): Promise<void> => {
  await Promise.allSettled([
    clearPoultryStocks(),
    clearEggProductions(),
    clearBroodingRecords(),
    clearExpenses(),
    clearSales(),
  ]);
};
