// Dedicated quick-fix SQL for "Database error saving new user"
export const AUTH_TRIGGER_FIX_SQL = `-- ==============================================================================
-- FIX FOR: "Database error saving new user" in Supabase
-- Run this in your Supabase Project -> SQL Editor -> Click RUN
-- ==============================================================================

-- 1. Create or replace the auth trigger function safely with public search_path
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    assigned_role public.user_role;
BEGIN
    -- Primary Administrator is junior.jacksonmass100@gmail.com
    -- All other new registrations default to 'staff' (normal user, no admin privileges)
    IF lower(trim(COALESCE(NEW.email, ''))) = 'junior.jacksonmass100@gmail.com' THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'staff';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
        assigned_role,
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ensure user creation in auth.users is NEVER blocked by trigger exceptions
    RETURN NEW;
END;
$$;

-- 2. Ensure permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO postgres, service_role, authenticated, anon;

-- 3. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
`;

// Complete production Supabase PostgreSQL Schema for KukuTrack
export const POULTRY_SCHEMA_SQL = `-- ==============================================================================
-- KUKUTRACK POULTRY BUSINESS MANAGEMENT PLATFORM
-- PRODUCTION SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE poultry_category AS ENUM (
        'indigenous_chicken',
        'crossbred_chicken',
        'broiler',
        'layer',
        'duck',
        'turkey',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE brooding_status AS ENUM ('Active', 'Due soon', 'Hatched', 'Failed', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('Cash', 'Mobile Money', 'Bank Transfer', 'Credit', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('Live birds', 'Eggs', 'Chicks', 'Ducklings', 'Manure', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- PROFILES (Maps to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POULTRY STOCK
CREATE TABLE IF NOT EXISTS public.poultry_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poultry_type TEXT NOT NULL,
    breed TEXT NOT NULL,
    initial_quantity INTEGER NOT NULL CHECK (initial_quantity >= 0),
    male_quantity INTEGER NOT NULL DEFAULT 0 CHECK (male_quantity >= 0),
    female_quantity INTEGER NOT NULL DEFAULT 0 CHECK (female_quantity >= 0),
    young_birds INTEGER NOT NULL DEFAULT 0 CHECK (young_birds >= 0),
    adult_birds INTEGER NOT NULL DEFAULT 0 CHECK (adult_birds >= 0),
    date_acquired DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT,
    purchase_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (purchase_cost >= 0),
    mortality INTEGER NOT NULL DEFAULT 0 CHECK (mortality >= 0),
    sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
    current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POULTRY MOVEMENTS / LOGS
CREATE TABLE IF NOT EXISTS public.poultry_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES public.poultry_stock(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('addition', 'mortality', 'sale', 'adjustment')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EGG PRODUCTION
CREATE TABLE IF NOT EXISTS public.egg_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_date DATE NOT NULL,
    hen_count INTEGER NOT NULL DEFAULT 0 CHECK (hen_count >= 0),
    eggs_collected INTEGER NOT NULL DEFAULT 0 CHECK (eggs_collected >= 0),
    broken_eggs INTEGER NOT NULL DEFAULT 0 CHECK (broken_eggs >= 0),
    spoiled_eggs INTEGER NOT NULL DEFAULT 0 CHECK (spoiled_eggs >= 0),
    eggs_sold INTEGER NOT NULL DEFAULT 0 CHECK (eggs_sold >= 0),
    eggs_used_internally INTEGER NOT NULL DEFAULT 0 CHECK (eggs_used_internally >= 0),
    remaining_eggs INTEGER NOT NULL DEFAULT 0 CHECK (remaining_eggs >= 0),
    selling_price_per_egg NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (selling_price_per_egg >= 0),
    total_egg_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_egg_revenue >= 0),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_production_date UNIQUE (production_date)
);

-- BROODING AND HATCHING
CREATE TABLE IF NOT EXISTS public.brooding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_bird_tag TEXT,
    poultry_type TEXT NOT NULL,
    number_of_eggs INTEGER NOT NULL CHECK (number_of_eggs > 0),
    incubation_days INTEGER NOT NULL DEFAULT 21 CHECK (incubation_days > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_hatch_date DATE NOT NULL,
    actual_hatch_date DATE,
    eggs_hatched INTEGER NOT NULL DEFAULT 0 CHECK (eggs_hatched >= 0),
    eggs_failed INTEGER NOT NULL DEFAULT 0 CHECK (eggs_failed >= 0),
    chicks_produced INTEGER NOT NULL DEFAULT 0 CHECK (chicks_produced >= 0),
    status brooding_status NOT NULL DEFAULT 'Active',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    person_responsible TEXT,
    receipt_reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SALES
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    product TEXT NOT NULL,
    poultry_type TEXT,
    stock_id UUID REFERENCES public.poultry_stock(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    record_type TEXT NOT NULL,
    record_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'KukuTrack Poultry Farm',
    phone TEXT,
    email TEXT,
    currency TEXT NOT NULL DEFAULT 'TZS',
    address TEXT,
    default_chicken_incubation_days INTEGER NOT NULL DEFAULT 21,
    default_duck_incubation_days INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEFAULT EXPENSE CATEGORIES SEED (IDEMPOTENT)
INSERT INTO public.expense_categories (name, is_system)
VALUES 
    ('Feed', true),
    ('Vaccines', true),
    ('Medication', true),
    ('Labour', true),
    ('Transport', true),
    ('Housing', true),
    ('Equipment', true),
    ('Electricity', true),
    ('Water', true),
    ('Packaging', true),
    ('Poultry purchase', true),
    ('Repairs', true),
    ('Other', true)
ON CONFLICT (name) DO NOTHING;

-- 5. AUTOMATIC STOCK CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.sync_poultry_stock_quantities()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_quantity := GREATEST(0, NEW.initial_quantity - NEW.mortality - NEW.sold_quantity);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_poultry_stock ON public.poultry_stock;
CREATE TRIGGER trigger_sync_poultry_stock
BEFORE INSERT OR UPDATE ON public.poultry_stock
FOR EACH ROW
EXECUTE FUNCTION public.sync_poultry_stock_quantities();

-- 6. AUTOMATIC EGG REMAINING CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.sync_egg_production_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_eggs := GREATEST(0, NEW.eggs_collected - NEW.broken_eggs - NEW.spoiled_eggs - NEW.eggs_sold - NEW.eggs_used_internally);
    NEW.total_egg_revenue := NEW.eggs_sold * NEW.selling_price_per_egg;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_egg_production ON public.egg_production;
CREATE TRIGGER trigger_sync_egg_production
BEFORE INSERT OR UPDATE ON public.egg_production
FOR EACH ROW
EXECUTE FUNCTION public.sync_egg_production_totals();

-- 7. AUTOMATIC SALE TOTAL & BALANCE CALCULATION
CREATE OR REPLACE FUNCTION public.sync_sale_calculations()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := NEW.quantity * NEW.unit_price;
    NEW.balance := GREATEST(0, NEW.total_amount - NEW.amount_paid);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_sale_calculations ON public.sales;
CREATE TRIGGER trigger_sync_sale_calculations
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.sync_sale_calculations();

-- 8. SALE DEDUCTION FROM POULTRY STOCK (DATA CONSISTENCY)
CREATE OR REPLACE FUNCTION public.handle_sale_stock_deduction()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.stock_id IS NOT NULL AND NEW.product = 'Live birds') THEN
        UPDATE public.poultry_stock
        SET sold_quantity = sold_quantity + NEW.quantity
        WHERE id = NEW.stock_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_sale_stock_deduction ON public.sales;
CREATE TRIGGER trigger_handle_sale_stock_deduction
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_stock_deduction();

-- 9. AUTH USER CREATION & FIRST ADMIN TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    assigned_role public.user_role;
BEGIN
    -- Primary Administrator is junior.jacksonmass100@gmail.com
    -- All other new registrations default to 'staff' (normal user, no admin privileges)
    IF lower(trim(COALESCE(NEW.email, ''))) = 'junior.jacksonmass100@gmail.com' THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'staff';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
        assigned_role,
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ensure user creation in auth.users is NEVER blocked by trigger exceptions
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 10. PROTECTED SERVER-SIDE DATABASE RESET RPC (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.reset_business_database(confirmation_phrase TEXT)
RETURNS JSON AS $$
DECLARE
    caller_role user_role;
    caller_id UUID;
    caller_email TEXT;
BEGIN
    caller_id := auth.uid();
    
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Sign in required';
    END IF;

    SELECT role, email INTO caller_role, caller_email FROM public.profiles WHERE id = caller_id;

    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can execute a database reset';
    END IF;

    IF confirmation_phrase != 'DELETE EVERYTHING' THEN
        RAISE EXCEPTION 'Invalid confirmation phrase. Exactly "DELETE EVERYTHING" is required.';
    END IF;

    INSERT INTO public.activity_logs (user_id, user_email, action, record_type, details)
    VALUES (caller_id, caller_email, 'Database Reset Requested', 'system', 'Full business database wipe executed by admin');

    DELETE FROM public.sales;
    DELETE FROM public.expenses WHERE is_system = false OR is_system IS NULL;
    DELETE FROM public.egg_production;
    DELETE FROM public.brooding_records;
    DELETE FROM public.poultry_movements;
    DELETE FROM public.poultry_stock;
    DELETE FROM public.customers;

    RETURN json_build_object(
        'success', true,
        'message', 'Business operational records successfully cleared. Admin user and configuration preserved.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brooding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can read profiles; user can update own profile; only admin can update roles
CREATE POLICY "Profiles read by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin full manage profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Business tables: Authenticated users can read, insert, update, and delete erroneous data
CREATE POLICY "Read poultry stock" ON public.poultry_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert poultry stock" ON public.poultry_stock FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update poultry stock" ON public.poultry_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete poultry stock" ON public.poultry_stock FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read poultry movements" ON public.poultry_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert poultry movements" ON public.poultry_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Delete poultry movements" ON public.poultry_movements FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read egg production" ON public.egg_production FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert egg production" ON public.egg_production FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update egg production" ON public.egg_production FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete egg production" ON public.egg_production FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read brooding records" ON public.brooding_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert brooding records" ON public.brooding_records FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update brooding records" ON public.brooding_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete brooding records" ON public.brooding_records FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Delete categories" ON public.expense_categories FOR DELETE TO authenticated USING (public.is_admin() AND is_system = false);

CREATE POLICY "Read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update customers" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete customers" ON public.customers FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update sales" ON public.sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete sales" ON public.sales FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Read activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Read business settings" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage business settings (Admin only)" ON public.business_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 11. POULTRY NEWS & INTELLIGENT ADVISORIES
CREATE TABLE IF NOT EXISTS public.poultry_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_email TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Farm Administration',
  suggestion_context TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.poultry_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read poultry news" ON public.poultry_news
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and author manage poultry news" ON public.poultry_news
  FOR ALL TO authenticated
  USING (public.is_admin() OR author_id = auth.uid() OR auth.uid() IS NOT NULL)
  WITH CHECK (public.is_admin() OR author_id = auth.uid() OR auth.uid() IS NOT NULL);

-- 12. SUPABASE REALTIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.egg_production;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brooding_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry_news;


-- ==============================================================================
-- KUKUTRACK MIGRATION 002
--   * Every user's data is private to that user (Row Level Security)
--   * Admin can see / open every user's account
--   * Only the admin can post, edit and delete news
--   * Admin can permanently delete a user
--   * Deleting a sale puts the birds back into stock
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this
-- file -> RUN. It is safe to run more than once.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = false
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. PROFILES: make sure every login has a profile row, and the primary admin
--    really is an admin
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'user'), '@', 1)),
  CASE WHEN lower(trim(COALESCE(u.email, ''))) = 'junior.jacksonmass100@gmail.com'
       THEN 'admin'::public.user_role ELSE 'staff'::public.user_role END,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE lower(trim(email)) = 'junior.jacksonmass100@gmail.com';

-- ------------------------------------------------------------------------------
-- 3. OWNER COLUMN ON EVERY BUSINESS TABLE (+ move existing rows to their owner)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  fallback_owner uuid;
  null_count bigint;
BEGIN
  -- Old shared data goes to the admin (or, if there is no admin yet, the first user)
  SELECT id INTO fallback_owner FROM public.profiles
  WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF fallback_owner IS NULL THEN
    SELECT id INTO fallback_owner FROM public.profiles ORDER BY created_at LIMIT 1;
  END IF;

  FOREACH t IN ARRAY ARRAY[
    'poultry_stock','poultry_movements','egg_production','brooding_records',
    'expenses','customers','sales','expense_categories'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id SET DEFAULT auth.uid()', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (owner_id)', t || '_owner_id_idx', t);
  END LOOP;

  UPDATE public.poultry_stock     SET owner_id = COALESCE(created_by, fallback_owner)  WHERE owner_id IS NULL;
  UPDATE public.egg_production    SET owner_id = COALESCE(recorded_by, fallback_owner) WHERE owner_id IS NULL;
  UPDATE public.brooding_records  SET owner_id = COALESCE(recorded_by, fallback_owner) WHERE owner_id IS NULL;
  UPDATE public.expenses          SET owner_id = COALESCE(recorded_by, fallback_owner) WHERE owner_id IS NULL;
  UPDATE public.sales             SET owner_id = COALESCE(recorded_by, fallback_owner) WHERE owner_id IS NULL;
  UPDATE public.customers         SET owner_id = fallback_owner                        WHERE owner_id IS NULL;
  UPDATE public.poultry_movements m
     SET owner_id = COALESCE(
           (SELECT s.owner_id FROM public.poultry_stock s WHERE s.id = m.stock_id),
           m.recorded_by, fallback_owner)
   WHERE m.owner_id IS NULL;
  -- Old custom expense categories go to the admin; built-in ones stay shared
  UPDATE public.expense_categories SET owner_id = fallback_owner
   WHERE is_system = false AND owner_id IS NULL;

  -- Lock the column down when nothing is left unassigned
  FOREACH t IN ARRAY ARRAY[
    'poultry_stock','poultry_movements','egg_production','brooding_records',
    'expenses','customers','sales'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE owner_id IS NULL', t) INTO null_count;
    IF null_count = 0 THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id SET NOT NULL', t);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. UNIQUE RULES THAT USED TO BE GLOBAL ARE NOW PER USER
-- ------------------------------------------------------------------------------
ALTER TABLE public.egg_production DROP CONSTRAINT IF EXISTS unique_production_date;
CREATE UNIQUE INDEX IF NOT EXISTS egg_production_owner_date_key
  ON public.egg_production (owner_id, production_date);

ALTER TABLE public.expense_categories DROP CONSTRAINT IF EXISTS expense_categories_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS expense_categories_owner_name_key
  ON public.expense_categories (COALESCE(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- ------------------------------------------------------------------------------
-- 5. NEWS TABLE (admin writes, each user reads only their own + broadcasts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poultry_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_email TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Farm Administration',
  suggestion_context TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS poultry_news_target_idx ON public.poultry_news (target_user_id);

-- ------------------------------------------------------------------------------
-- 6. TRIGGERS
-- ------------------------------------------------------------------------------
-- 6a. A normal user can never promote themselves or re-activate themselves
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.profiles;
CREATE TRIGGER trigger_protect_profile_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 6b. Selling birds takes them out of stock; editing or deleting the sale
--     puts them back, so wrongly-entered sales can be removed cleanly
CREATE OR REPLACE FUNCTION public.handle_sale_stock_deduction()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.stock_id IS NOT NULL AND NEW.product = 'Live birds') THEN
    UPDATE public.poultry_stock
       SET sold_quantity = sold_quantity + NEW.quantity
     WHERE id = NEW.stock_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_sale_stock_restore()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.stock_id IS NOT NULL AND OLD.product = 'Live birds') THEN
    UPDATE public.poultry_stock
       SET sold_quantity = GREATEST(0, sold_quantity - OLD.quantity)
     WHERE id = OLD.stock_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_sale_stock_adjust()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.stock_id IS DISTINCT FROM NEW.stock_id
      OR OLD.product IS DISTINCT FROM NEW.product
      OR OLD.quantity IS DISTINCT FROM NEW.quantity) THEN
    IF (OLD.stock_id IS NOT NULL AND OLD.product = 'Live birds') THEN
      UPDATE public.poultry_stock
         SET sold_quantity = GREATEST(0, sold_quantity - OLD.quantity)
       WHERE id = OLD.stock_id;
    END IF;
    IF (NEW.stock_id IS NOT NULL AND NEW.product = 'Live birds') THEN
      UPDATE public.poultry_stock
         SET sold_quantity = sold_quantity + NEW.quantity
       WHERE id = NEW.stock_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_sale_stock_deduction ON public.sales;
CREATE TRIGGER trigger_handle_sale_stock_deduction
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_deduction();

DROP TRIGGER IF EXISTS trigger_handle_sale_stock_restore ON public.sales;
CREATE TRIGGER trigger_handle_sale_stock_restore
AFTER DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_restore();

DROP TRIGGER IF EXISTS trigger_handle_sale_stock_adjust ON public.sales;
CREATE TRIGGER trigger_handle_sale_stock_adjust
AFTER UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_adjust();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles','poultry_stock','poultry_movements','egg_production',
        'brooding_records','expense_categories','expenses','customers',
        'sales','activity_logs','poultry_news'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry_stock      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_production     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brooding_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry_news       ENABLE ROW LEVEL SECURITY;

-- 7a. Business tables: you see and change only your own rows; admin sees all
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'poultry_stock','poultry_movements','egg_production','brooding_records',
    'expenses','customers','sales'
  ] LOOP
    EXECUTE format($f$
      CREATE POLICY "own or admin: select" ON public.%I FOR SELECT TO authenticated
      USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))$f$, t);
    EXECUTE format($f$
      CREATE POLICY "own or admin: insert" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))$f$, t);
    EXECUTE format($f$
      CREATE POLICY "own or admin: update" ON public.%I FOR UPDATE TO authenticated
      USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))
      WITH CHECK (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))$f$, t);
    EXECUTE format($f$
      CREATE POLICY "own or admin: delete" ON public.%I FOR DELETE TO authenticated
      USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))$f$, t);
  END LOOP;
END $$;

-- 7b. Expense categories: built-in ones are shared, custom ones are private
CREATE POLICY "categories: select" ON public.expense_categories FOR SELECT TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "categories: insert" ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (is_system = false AND (owner_id = auth.uid() OR public.is_admin()));
CREATE POLICY "categories: delete" ON public.expense_categories FOR DELETE TO authenticated
  USING (is_system = false AND (owner_id = auth.uid() OR public.is_admin()));

-- 7c. Profiles: you see yourself; admin sees everyone
CREATE POLICY "profiles: select own or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles: create own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'staff');
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: admin manage" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7d. Activity log: anyone signed in can write, only admin can read
CREATE POLICY "activity: admin read" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "activity: insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7e. News: users read broadcasts + messages addressed to them; ONLY admin writes
CREATE POLICY "news: read own or broadcast" ON public.poultry_news FOR SELECT TO authenticated
  USING (public.is_admin() OR target_user_id IS NULL OR target_user_id = auth.uid());
CREATE POLICY "news: admin insert" ON public.poultry_news FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "news: admin update" ON public.poultry_news FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "news: admin delete" ON public.poultry_news FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. ADMIN FUNCTIONS
-- ------------------------------------------------------------------------------
-- 8a. Permanently delete a user (login + all their data). Admin only.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE target_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: only administrators can delete users';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;
  SELECT email INTO target_email FROM public.profiles WHERE id = target_user_id;
  IF lower(trim(COALESCE(target_email, ''))) = 'junior.jacksonmass100@gmail.com' THEN
    RAISE EXCEPTION 'The primary administrator account cannot be deleted';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;

  INSERT INTO public.activity_logs (user_id, user_email, action, record_type, record_id, details)
  VALUES (auth.uid(), (SELECT email FROM public.profiles WHERE id = auth.uid()),
          'User Deleted', 'profiles', target_user_id::text,
          'Account and all data removed: ' || COALESCE(target_email, 'unknown'));

  RETURN json_build_object('success', true);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- 8b. Per-user record counts for the admin user list
CREATE OR REPLACE FUNCTION public.admin_user_summaries()
RETURNS TABLE (
  user_id uuid,
  flock_count bigint,
  egg_record_count bigint,
  brooding_count bigint,
  expense_count bigint,
  sale_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: administrators only';
  END IF;
  RETURN QUERY
  SELECT p.id,
    (SELECT count(*) FROM public.poultry_stock    x WHERE x.owner_id = p.id),
    (SELECT count(*) FROM public.egg_production   x WHERE x.owner_id = p.id),
    (SELECT count(*) FROM public.brooding_records x WHERE x.owner_id = p.id),
    (SELECT count(*) FROM public.expenses         x WHERE x.owner_id = p.id),
    (SELECT count(*) FROM public.sales            x WHERE x.owner_id = p.id)
  FROM public.profiles p;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_user_summaries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_summaries() TO authenticated;

-- 8c. Danger zone: wipe ONE account's records (your own, or - as admin - the
--     account you are currently viewing). Never touches anyone else's data.
DROP FUNCTION IF EXISTS public.reset_business_database(text);
CREATE OR REPLACE FUNCTION public.reset_business_database(
  confirmation_phrase text,
  target_owner uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  victim uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Sign in required';
  END IF;
  IF confirmation_phrase IS DISTINCT FROM 'DELETE EVERYTHING' THEN
    RAISE EXCEPTION 'Invalid confirmation phrase. Exactly "DELETE EVERYTHING" is required.';
  END IF;

  victim := COALESCE(target_owner, caller_id);
  IF victim <> caller_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: you can only clear your own data';
  END IF;

  DELETE FROM public.sales             WHERE owner_id = victim;
  DELETE FROM public.expenses          WHERE owner_id = victim;
  DELETE FROM public.egg_production    WHERE owner_id = victim;
  DELETE FROM public.brooding_records  WHERE owner_id = victim;
  DELETE FROM public.poultry_movements WHERE owner_id = victim;
  DELETE FROM public.poultry_stock     WHERE owner_id = victim;
  DELETE FROM public.customers         WHERE owner_id = victim;
  DELETE FROM public.expense_categories WHERE owner_id = victim AND is_system = false;

  INSERT INTO public.activity_logs (user_id, user_email, action, record_type, record_id, details)
  VALUES (caller_id, (SELECT email FROM public.profiles WHERE id = caller_id),
          'Account Data Cleared', 'system', victim::text,
          'All business records removed for this account');

  RETURN json_build_object('success', true,
    'message', 'All business records for this account were cleared.');
END;
$$;
REVOKE ALL ON FUNCTION public.reset_business_database(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_business_database(text, uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9. REALTIME (ignore "already member" errors)
-- ------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'poultry_stock','poultry_movements','egg_production','brooding_records',
    'expenses','sales','profiles','activity_logs','poultry_news'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Done. Check: SELECT email, role FROM public.profiles;


-- ==============================================================================
-- KUKUTRACK MIGRATION 003  (run AFTER 002)
--   * Each flock gets a "current worth per bird" (unit_value)
--   * Every time the worth is entered or changed, a history row is saved, so the
--     system can learn from the valuation over the whole time birds were on the farm
--   * History is private per user (admin can see all), like everything else
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this
-- file -> RUN. Safe to run more than once.
-- ==============================================================================

ALTER TABLE public.poultry_stock
  ADD COLUMN IF NOT EXISTS unit_value NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (unit_value >= 0),
  ADD COLUMN IF NOT EXISTS valuation_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.poultry_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.poultry_stock(id) ON DELETE CASCADE,
  unit_value NUMERIC(15, 2) NOT NULL CHECK (unit_value >= 0),
  quantity INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS poultry_valuations_stock_idx ON public.poultry_valuations (stock_id, recorded_at);
CREATE INDEX IF NOT EXISTS poultry_valuations_owner_idx ON public.poultry_valuations (owner_id);

-- BEFORE trigger so valuation_updated_at is stored; the history row references the
-- stock row, so it is inserted by a separate AFTER trigger
CREATE OR REPLACE FUNCTION public.stamp_poultry_valuation_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.unit_value > 0 AND (TG_OP = 'INSERT' OR NEW.unit_value IS DISTINCT FROM OLD.unit_value) THEN
    NEW.valuation_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_poultry_valuation_row()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.unit_value > 0 AND (TG_OP = 'INSERT' OR NEW.unit_value IS DISTINCT FROM OLD.unit_value) THEN
    INSERT INTO public.poultry_valuations (owner_id, stock_id, unit_value, quantity)
    VALUES (NEW.owner_id, NEW.id, NEW.unit_value, NEW.current_quantity);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_stamp_valuation_time ON public.poultry_stock;
CREATE TRIGGER trigger_stamp_valuation_time
BEFORE INSERT OR UPDATE ON public.poultry_stock
FOR EACH ROW EXECUTE FUNCTION public.stamp_poultry_valuation_time();

DROP TRIGGER IF EXISTS trigger_insert_valuation_row ON public.poultry_stock;
CREATE TRIGGER trigger_insert_valuation_row
AFTER INSERT OR UPDATE ON public.poultry_stock
FOR EACH ROW EXECUTE FUNCTION public.insert_poultry_valuation_row();

-- Row Level Security: same rule as the other business tables
ALTER TABLE public.poultry_valuations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own or admin: select" ON public.poultry_valuations;
DROP POLICY IF EXISTS "own or admin: insert" ON public.poultry_valuations;
DROP POLICY IF EXISTS "own or admin: update" ON public.poultry_valuations;
DROP POLICY IF EXISTS "own or admin: delete" ON public.poultry_valuations;

CREATE POLICY "own or admin: select" ON public.poultry_valuations FOR SELECT TO authenticated
  USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()));
CREATE POLICY "own or admin: insert" ON public.poultry_valuations FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()));
CREATE POLICY "own or admin: update" ON public.poultry_valuations FOR UPDATE TO authenticated
  USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()))
  WITH CHECK (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()));
CREATE POLICY "own or admin: delete" ON public.poultry_valuations FOR DELETE TO authenticated
  USING (public.is_admin() OR (owner_id = auth.uid() AND public.is_active_user()));

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry_valuations;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Done. Check: SELECT * FROM public.poultry_valuations;


-- ==============================================================================
-- KUKUTRACK MIGRATION 004  (run AFTER 002 and 003)
--   1. Direct messages between each farmer and the admin (private per farmer)
--   2. Profile change requests (email / phone / name) that wait for admin approval
--   3. Book library: admin uploads PDFs, farmers can only read them inside the app
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this
-- file -> RUN. Safe to run more than once.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DIRECT MESSAGES
--    One conversation ("thread") per farmer. thread_user_id = the farmer.
--    The farmer sees only their own thread; admins see every thread.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS direct_messages_thread_idx ON public.direct_messages (thread_user_id, created_at);
CREATE INDEX IF NOT EXISTS direct_messages_unread_idx ON public.direct_messages (thread_user_id) WHERE read_at IS NULL;

-- Nobody can back-date a message or mark their own message as already read
CREATE OR REPLACE FUNCTION public.direct_messages_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.created_at := now();
  NEW.read_at := NULL;
  NEW.body := btrim(NEW.body);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_direct_messages_before_insert ON public.direct_messages;
CREATE TRIGGER trigger_direct_messages_before_insert
BEFORE INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.direct_messages_before_insert();

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm: read own thread or admin" ON public.direct_messages;
DROP POLICY IF EXISTS "dm: send" ON public.direct_messages;
DROP POLICY IF EXISTS "dm: delete own or admin" ON public.direct_messages;

CREATE POLICY "dm: read own thread or admin" ON public.direct_messages FOR SELECT TO authenticated
  USING (public.is_admin() OR (thread_user_id = auth.uid() AND public.is_active_user()));

-- A farmer can write only in their own thread; an admin can write in any thread.
-- Always as themselves (sender_id must be you).
CREATE POLICY "dm: send" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_active_user()
    AND (thread_user_id = auth.uid() OR public.is_admin())
  );

CREATE POLICY "dm: delete own or admin" ON public.direct_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.is_admin());

-- Marks the messages you RECEIVED in a thread as read (there is no direct UPDATE access)
CREATE OR REPLACE FUNCTION public.mark_thread_read(p_thread uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT (p_thread = auth.uid() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.direct_messages
     SET read_at = now()
   WHERE thread_user_id = p_thread
     AND read_at IS NULL
     AND (
       (p_thread = auth.uid() AND sender_id <> auth.uid())                      -- farmer reads admin replies
       OR (public.is_admin() AND p_thread <> auth.uid() AND sender_id = p_thread) -- admin reads the farmer
     );
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_thread_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_thread_read(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. PROFILE CHANGE REQUESTS
--    The farmer asks; nothing changes until an admin approves.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('email', 'phone', 'full_name')),
  old_value TEXT,
  new_value TEXT NOT NULL CHECK (char_length(btrim(new_value)) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Only one waiting request per field per person
CREATE UNIQUE INDEX IF NOT EXISTS profile_change_one_pending_idx
  ON public.profile_change_requests (user_id, field) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS profile_change_user_idx ON public.profile_change_requests (user_id, created_at DESC);

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pcr: read own or admin" ON public.profile_change_requests;
DROP POLICY IF EXISTS "pcr: cancel own pending" ON public.profile_change_requests;

CREATE POLICY "pcr: read own or admin" ON public.profile_change_requests FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
-- No direct INSERT/UPDATE: requests are made and decided through the functions below.
CREATE POLICY "pcr: cancel own pending" ON public.profile_change_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- The farmer submits a request. It also drops a note in their thread so the admin is notified.
CREATE OR REPLACE FUNCTION public.request_profile_change(p_field text, p_new_value text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  me uuid := auth.uid();
  cur text;
  clean text := btrim(COALESCE(p_new_value, ''));
  req_id uuid;
  label text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Your account is not active'; END IF;
  IF p_field NOT IN ('email', 'phone', 'full_name') THEN RAISE EXCEPTION 'You can only change email, phone or name'; END IF;
  IF clean = '' THEN RAISE EXCEPTION 'Please enter the new value'; END IF;

  IF p_field = 'email' THEN
    clean := lower(clean);
    IF clean !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'That does not look like a valid email address';
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = clean AND u.id <> me) THEN
      RAISE EXCEPTION 'That email address is already used by another account';
    END IF;
  END IF;

  SELECT CASE p_field WHEN 'email' THEN email WHEN 'phone' THEN phone ELSE full_name END
    INTO cur FROM public.profiles WHERE id = me;
  IF cur IS NOT DISTINCT FROM clean THEN RAISE EXCEPTION 'That is already your current value'; END IF;

  IF EXISTS (SELECT 1 FROM public.profile_change_requests WHERE user_id = me AND field = p_field AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending request for this. Cancel it first to send a new one.';
  END IF;

  INSERT INTO public.profile_change_requests (user_id, field, old_value, new_value)
  VALUES (me, p_field, cur, clean)
  RETURNING id INTO req_id;

  label := CASE p_field WHEN 'email' THEN 'email address' WHEN 'phone' THEN 'phone number' ELSE 'name' END;
  INSERT INTO public.direct_messages (thread_user_id, sender_id, body)
  VALUES (me, me, 'Change request: I would like to change my ' || label || ' from "' || COALESCE(cur, '(none)') || '" to "' || clean || '". Please review.');

  RETURN json_build_object('id', req_id);
END;
$$;
REVOKE ALL ON FUNCTION public.request_profile_change(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_profile_change(text, text) TO authenticated;

-- An admin approves or rejects. Approving applies the change; either way the farmer is told.
CREATE OR REPLACE FUNCTION public.review_profile_change(p_request uuid, p_approve boolean, p_note text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  r public.profile_change_requests%ROWTYPE;
  label text;
  note text := NULLIF(btrim(COALESCE(p_note, '')), '');
  msg text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied: administrators only'; END IF;

  SELECT * INTO r FROM public.profile_change_requests WHERE id = p_request FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'This request was already %', r.status; END IF;

  label := CASE r.field WHEN 'email' THEN 'email address' WHEN 'phone' THEN 'phone number' ELSE 'name' END;

  IF p_approve THEN
    IF r.field = 'email' THEN
      IF lower(trim(COALESCE((SELECT email FROM public.profiles WHERE id = r.user_id), ''))) = 'junior.jacksonmass100@gmail.com' THEN
        RAISE EXCEPTION 'The primary administrator email cannot be changed here';
      END IF;
      IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(r.new_value) AND u.id <> r.user_id) THEN
        RAISE EXCEPTION 'That email address is now used by another account';
      END IF;
      UPDATE auth.users SET email = lower(r.new_value), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = r.user_id;
      UPDATE public.profiles SET email = lower(r.new_value), updated_at = now() WHERE id = r.user_id;
    ELSIF r.field = 'phone' THEN
      UPDATE public.profiles SET phone = r.new_value, updated_at = now() WHERE id = r.user_id;
    ELSE
      UPDATE public.profiles SET full_name = r.new_value, updated_at = now() WHERE id = r.user_id;
    END IF;
  END IF;

  UPDATE public.profile_change_requests
     SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
         admin_note = note,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = r.id;

  msg := CASE WHEN p_approve
         THEN 'Approved: your ' || label || ' was changed to "' || r.new_value || '".'
         ELSE 'Not approved: your request to change your ' || label || ' was declined.' END
         || CASE WHEN note IS NOT NULL THEN ' Note: ' || note ELSE '' END;
  INSERT INTO public.direct_messages (thread_user_id, sender_id, body) VALUES (r.user_id, auth.uid(), msg);

  INSERT INTO public.activity_logs (user_id, user_email, action, record_type, record_id, details)
  VALUES (auth.uid(), (SELECT email FROM public.profiles WHERE id = auth.uid()),
          CASE WHEN p_approve THEN 'Change Approved' ELSE 'Change Rejected' END,
          'profile_change_requests', r.id::text, r.field || ' -> ' || r.new_value);

  RETURN json_build_object('status', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END);
END;
$$;
REVOKE ALL ON FUNCTION public.review_profile_change(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_profile_change(uuid, boolean, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. BOOK LIBRARY
--    The PDF files live in a PRIVATE storage bucket (no public links). Only signed-in
--    users can read them; only admins can upload, hide or delete.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description TEXT,
  storage_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books: read" ON public.books;
DROP POLICY IF EXISTS "books: admin insert" ON public.books;
DROP POLICY IF EXISTS "books: admin update" ON public.books;
DROP POLICY IF EXISTS "books: admin delete" ON public.books;

CREATE POLICY "books: read" ON public.books FOR SELECT TO authenticated
  USING (public.is_admin() OR (is_published AND public.is_active_user()));
CREATE POLICY "books: admin insert" ON public.books FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "books: admin update" ON public.books FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "books: admin delete" ON public.books FOR DELETE TO authenticated
  USING (public.is_admin());

-- The private bucket and its access rules (skipped quietly if Storage is not available)
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('books', 'books', false, 52428800, ARRAY['application/pdf'])
    ON CONFLICT (id) DO UPDATE
      SET public = false,
          file_size_limit = 52428800,
          allowed_mime_types = ARRAY['application/pdf'];

    DROP POLICY IF EXISTS "books files: read" ON storage.objects;
    DROP POLICY IF EXISTS "books files: admin insert" ON storage.objects;
    DROP POLICY IF EXISTS "books files: admin update" ON storage.objects;
    DROP POLICY IF EXISTS "books files: admin delete" ON storage.objects;

    CREATE POLICY "books files: read" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'books' AND (public.is_admin() OR (
        public.is_active_user() AND EXISTS (
          SELECT 1 FROM public.books b WHERE b.storage_path = storage.objects.name AND b.is_published))));
    CREATE POLICY "books files: admin insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'books' AND public.is_admin());
    CREATE POLICY "books files: admin update" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'books' AND public.is_admin()) WITH CHECK (bucket_id = 'books' AND public.is_admin());
    CREATE POLICY "books files: admin delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'books' AND public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. REALTIME (ignore "already member" errors)
-- ------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['direct_messages', 'profile_change_requests', 'books'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Done. Check: SELECT * FROM public.direct_messages; SELECT * FROM storage.buckets WHERE id = 'books';
`;
