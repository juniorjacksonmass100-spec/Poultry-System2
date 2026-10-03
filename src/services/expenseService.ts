import { supabase, isSupabaseConfigured, isTableMissingError } from '../lib/supabase';
import { Expense, ExpenseCategory } from '../types';
import { logActivity } from './activityService';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { deleteRowOrThrow } from '../lib/db';

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'Feed', is_system: true, created_at: '' },
  { id: '2', name: 'Vaccines', is_system: true, created_at: '' },
  { id: '3', name: 'Medication', is_system: true, created_at: '' },
  { id: '4', name: 'Labour', is_system: true, created_at: '' },
  { id: '5', name: 'Transport', is_system: true, created_at: '' },
  { id: '6', name: 'Housing', is_system: true, created_at: '' },
  { id: '7', name: 'Equipment', is_system: true, created_at: '' },
  { id: '8', name: 'Electricity', is_system: true, created_at: '' },
  { id: '9', name: 'Water', is_system: true, created_at: '' },
  { id: '10', name: 'Packaging', is_system: true, created_at: '' },
  { id: '11', name: 'Poultry purchase', is_system: true, created_at: '' },
  { id: '12', name: 'Repairs', is_system: true, created_at: '' },
  { id: '13', name: 'Other', is_system: true, created_at: '' },
];

export const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_CATEGORIES;
  const ownerId = getActiveOwnerId();
  try {
    // Built-in categories are shared (owner_id is null); custom ones belong to one user
    let query = supabase.from('expense_categories').select('*');
    query = ownerId ? query.or(`owner_id.is.null,owner_id.eq.${ownerId}`) : query.is('owner_id', null);
    const { data, error } = await query
      .order('name', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) return DEFAULT_CATEGORIES;
      return DEFAULT_CATEGORIES;
    }
    return data && data.length > 0 ? data : DEFAULT_CATEGORIES;
  } catch (err: any) {
    return DEFAULT_CATEGORIES;
  }
};

export const createExpenseCategory = async (name: string): Promise<ExpenseCategory> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const ownerId = await requireOwnerId();
  const { data, error } = await supabase
    .from('expense_categories')
    .insert([{ name: name.trim(), is_system: false, owner_id: ownerId }])
    .select()
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      throw new Error('Database tables not yet created in Supabase. Please copy and execute the SQL schema from the setup banner.');
    }
    throw error;
  }
  await logActivity('Expense Category Created', 'expense_categories', data.id, name);
  return data;
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const ownerId = getActiveOwnerId();
  if (!ownerId) return [];
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', ownerId)
      .order('expense_date', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

export const createExpense = async (
  expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
): Promise<Expense> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = await requireOwnerId();

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        ...expense,
        owner_id: ownerId,
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
    'Expense Logged',
    'expenses',
    data.id,
    `${data.category}: TZS ${Number(data.amount).toLocaleString()} - ${data.description}`
  );

  return data;
};

export const updateExpense = async (
  id: string,
  updates: Partial<Expense>
): Promise<Expense> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('Expense Updated', 'expenses', id, JSON.stringify(updates));
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');

  await deleteRowOrThrow('expenses', id);

  await logActivity('Expense Deleted', 'expenses', id);
};
