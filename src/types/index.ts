/**
 * KukuTrack - Unified TypeScript Data Models & Types
 * Designed for web & future Android Supabase integration
 */

export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  preferred_language: 'en' | 'sw';
  created_at: string;
  updated_at: string;
}

export type PoultryType = 
  | 'indigenous_chicken'
  | 'crossbred_chicken'
  | 'broiler'
  | 'layer'
  | 'duck'
  | 'turkey'
  | 'other'
  | string;

export interface PoultryStock {
  id: string;
  poultry_type: string;
  breed: string;
  initial_quantity: number;
  male_quantity: number;
  female_quantity: number;
  young_birds: number;
  adult_birds: number;
  date_acquired: string;
  source: string | null;
  purchase_cost: number;
  mortality: number;
  sold_quantity: number;
  current_quantity: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoultryMovement {
  id: string;
  stock_id: string;
  movement_type: 'addition' | 'mortality' | 'sale' | 'adjustment';
  quantity: number;
  movement_date: string;
  reason: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface EggProduction {
  id: string;
  production_date: string;
  hen_count: number;
  eggs_collected: number;
  broken_eggs: number;
  spoiled_eggs: number;
  eggs_sold: number;
  eggs_used_internally: number;
  remaining_eggs: number;
  selling_price_per_egg: number;
  total_egg_revenue: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BroodingStatus = 'Active' | 'Due soon' | 'Hatched' | 'Failed' | 'Completed';

export interface BroodingRecord {
  id: string;
  mother_bird_tag: string | null;
  poultry_type: string;
  number_of_eggs: number;
  incubation_days: number;
  start_date: string;
  expected_hatch_date: string;
  actual_hatch_date: string | null;
  eggs_hatched: number;
  eggs_failed: number;
  chicks_produced: number;
  status: BroodingStatus;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_system: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  person_responsible: string | null;
  receipt_reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductType = 'Live birds' | 'Eggs' | 'Chicks' | 'Ducklings' | 'Manure' | 'Other';

export interface Sale {
  id: string;
  sale_date: string;
  product: string;
  poultry_type: string | null;
  stock_id: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  payment_method: string;
  amount_paid: number;
  balance: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  record_type: string;
  record_id: string | null;
  details: string | null;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  currency: string;
  address: string | null;
  default_chicken_incubation_days: number;
  default_duck_incubation_days: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  poultryPurchaseCost: number;
  feedExpenses: number;
  medicationExpenses: number;
  otherExpenses: number;
  totalOutstandingBalance: number;
  cashReceived: number;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export interface DashboardMetrics {
  totalPoultry: number;
  femalePoultry: number;
  malePoultry: number;
  youngBirds: number;
  adultBirds: number;
  eggsCollected: number;
  eggsSold: number;
  remainingEggs: number;
  upcomingHatchings: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  outstandingBalances: number;
}

export type DateFilterRange = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export type NewsCategory = 
  | 'disease_alert' 
  | 'feeding_nutrition' 
  | 'brooding_hatching' 
  | 'market_prices' 
  | 'management_tips'
  | 'general';

export type NewsPriority = 'urgent' | 'high' | 'normal';

export interface PoultryNews {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  priority: NewsPriority;
  target_user_id: string | null; // null = Broadcast to all users, string = specific user
  target_user_email?: string | null;
  author_id: string | null;
  author_name: string;
  suggestion_context?: string | null;
  created_at: string;
  is_read?: boolean;
}
