import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { PoultryStock } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { deleteRowOrThrow } from '../lib/db';

export const fetchPoultryStocks = async (): Promise<PoultryStock[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('poultry_stock')
      .select('*')
      .eq('owner_id', ownerId)
      .order('date_acquired', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const createPoultryStock = async (
  stock: Omit<PoultryStock, 'id' | 'created_at' | 'updated_at' | 'current_quantity'>
): Promise<PoultryStock> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = await requireOwnerId();
  const currentQuantity = Math.max(0, stock.initial_quantity - stock.mortality - stock.sold_quantity);

  const { data, error } = await supabase
    .from('poultry_stock')
    .insert([
      {
        ...stock,
        owner_id: ownerId,
        current_quantity: currentQuantity,
        created_by: user?.id || null,
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
    'Poultry Batch Added',
    'poultry_stock',
    data.id,
    `${data.poultry_type} (${data.breed}) - Initial Qty: ${data.initial_quantity}`
  );

  return data;
};

export const updatePoultryStock = async (
  id: string,
  updates: Partial<PoultryStock>
): Promise<PoultryStock> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  let payload: Partial<PoultryStock> = { ...updates };
  if (
    updates.initial_quantity !== undefined ||
    updates.mortality !== undefined ||
    updates.sold_quantity !== undefined
  ) {
    const { data: existing } = await supabase
      .from('poultry_stock')
      .select('*')
      .eq('id', id)
      .single();

    if (existing) {
      const initial = updates.initial_quantity ?? existing.initial_quantity;
      const mort = updates.mortality ?? existing.mortality;
      const sold = updates.sold_quantity ?? existing.sold_quantity;
      payload.current_quantity = Math.max(0, initial - mort - sold);
    }
  }

  const { data, error } = await supabase
    .from('poultry_stock')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('Poultry Batch Updated', 'poultry_stock', id, JSON.stringify(updates));
  return data;
};

export const recordMortality = async (
  stockId: string,
  deadCount: number,
  reason: string,
  date: string
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
  if (deadCount <= 0) throw new Error('Mortality count must be greater than zero');

  const { data: stock, error: fetchErr } = await supabase
    .from('poultry_stock')
    .select('*')
    .eq('id', stockId)
    .single();

  if (fetchErr || !stock) throw new Error('Poultry record not found');

  const newMortality = stock.mortality + deadCount;
  const newCurrent = Math.max(0, stock.initial_quantity - newMortality - stock.sold_quantity);

  const { error: updateErr } = await supabase
    .from('poultry_stock')
    .update({
      mortality: newMortality,
      current_quantity: newCurrent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stockId);

  if (updateErr) throw updateErr;

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('poultry_movements').insert([
    {
      owner_id: stock.owner_id || (await requireOwnerId()),
      stock_id: stockId,
      movement_type: 'mortality',
      quantity: deadCount,
      movement_date: date,
      reason,
      recorded_by: user?.id || null,
    },
  ]);

  await logActivity(
    'Mortality Recorded',
    'poultry_stock',
    stockId,
    `Recorded ${deadCount} deaths. Reason: ${reason}`
  );
};

export const deletePoultryStock = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  await deleteRowOrThrow('poultry_stock', id);

  await logActivity('Poultry Batch Deleted', 'poultry_stock', id);
};
