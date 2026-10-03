import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { Sale } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { deleteRowOrThrow } from '../lib/db';

export const fetchSales = async (): Promise<Sale[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('owner_id', ownerId)
      .order('sale_date', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const createSale = async (
  sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'total_amount' | 'balance'>
): Promise<Sale> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = await requireOwnerId();
  const totalAmount = sale.quantity * sale.unit_price;
  const balance = Math.max(0, totalAmount - sale.amount_paid);

  // If live birds and linked to stock_id, check stock availability first
  if (sale.product === 'Live birds' && sale.stock_id) {
    const { data: stock, error: stockErr } = await supabase
      .from('poultry_stock')
      .select('*')
      .eq('id', sale.stock_id)
      .single();

    if (!stockErr && stock) {
      if (stock.current_quantity < sale.quantity) {
        throw new Error(
          `Insufficient stock! Requested ${sale.quantity}, but only ${stock.current_quantity} birds available.`
        );
      }
    }
  }

  const { data, error } = await supabase
    .from('sales')
    .insert([
      {
        ...sale,
        owner_id: ownerId,
        total_amount: totalAmount,
        balance,
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

  if (sale.product === 'Live birds' && sale.stock_id) {
    try {
      await supabase.from('poultry_movements').insert([
        {
          owner_id: ownerId,
          stock_id: sale.stock_id,
          movement_type: 'sale',
          quantity: sale.quantity,
          movement_date: sale.sale_date,
          reason: `Sold to ${sale.customer_name} (Sale ID: ${data.id})`,
          recorded_by: user?.id || null,
        },
      ]);
    } catch {
      // Ignore if movements table not ready
    }
  }

  await logActivity(
    'Sale Recorded',
    'sales',
    data.id,
    `${data.product} (${data.quantity}) - Total: TZS ${Number(data.total_amount).toLocaleString()} to ${data.customer_name}`
  );

  return data;
};

export const updateSale = async (
  id: string,
  updates: Partial<Sale>
): Promise<Sale> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  let payload = { ...updates };
  if (updates.quantity !== undefined || updates.unit_price !== undefined || updates.amount_paid !== undefined) {
    const { data: existing } = await supabase.from('sales').select('*').eq('id', id).single();
    if (existing) {
      const qty = updates.quantity ?? existing.quantity;
      const unit = updates.unit_price ?? existing.unit_price;
      const paid = updates.amount_paid ?? existing.amount_paid;
      payload.total_amount = qty * unit;
      payload.balance = Math.max(0, payload.total_amount - paid);
    }
  }

  const { data, error } = await supabase
    .from('sales')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('Sale Updated', 'sales', id, JSON.stringify(updates));
  return data;
};

export const deleteSale = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  await deleteRowOrThrow('sales', id);

  await logActivity('Sale Deleted', 'sales', id);
};
