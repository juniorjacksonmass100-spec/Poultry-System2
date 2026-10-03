import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { BroodingRecord, BroodingStatus } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { deleteRowOrThrow } from '../lib/db';

export const calculateExpectedHatchDate = (startDate: string, incubationDays: number): string => {
  const start = new Date(startDate);
  start.setDate(start.getDate() + incubationDays);
  return start.toISOString().split('T')[0];
};

export const fetchBroodingRecords = async (): Promise<BroodingRecord[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('brooding_records')
      .select('*')
      .eq('owner_id', ownerId)
      .order('start_date', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const createBroodingRecord = async (
  record: Omit<BroodingRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<BroodingRecord> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = await requireOwnerId();
  const expectedDate = calculateExpectedHatchDate(record.start_date, record.incubation_days);

  const { data, error } = await supabase
    .from('brooding_records')
    .insert([
      {
        ...record,
        owner_id: ownerId,
        expected_hatch_date: expectedDate,
        recorded_by: user?.id || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      throw new Error('Database tables not yet created in Supabase. Please copy and execute the SQL schema from the setup banner.');
    }
    throw error;
  }

  await logActivity(
    'Brooding Batch Started',
    'brooding_records',
    data.id,
    `${data.poultry_type} - Eggs: ${data.number_of_eggs}, Expected: ${data.expected_hatch_date}`
  );

  return data;
};

export const updateBroodingRecord = async (
  id: string,
  updates: Partial<BroodingRecord>
): Promise<BroodingRecord> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const payload: Partial<BroodingRecord> = { ...updates };
  if (updates.start_date && updates.incubation_days) {
    payload.expected_hatch_date = calculateExpectedHatchDate(updates.start_date, updates.incubation_days);
  }

  const { data, error } = await supabase
    .from('brooding_records')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('Brooding Batch Updated', 'brooding_records', id, JSON.stringify(updates));
  return data;
};

export const deleteBroodingRecord = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  await deleteRowOrThrow('brooding_records', id);

  await logActivity('Brooding Record Deleted', 'brooding_records', id);
};
