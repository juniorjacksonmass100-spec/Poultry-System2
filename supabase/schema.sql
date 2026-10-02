-- ==============================================================================
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
        'indigenous_chicken', -- Kuku wa Kienyeji
        'crossbred_chicken',  -- Kuku Chotara
        'broiler',            -- Kuku wa Nyama
        'layer',              -- Kuku wa Mayai
        'duck',               -- Bata
        'turkey',             -- Bata Mzinga
        'other'               -- Nyingine
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
    -- If this is a live bird sale and associated with a poultry_stock record
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
-- Requires confirmation phrase "DELETE EVERYTHING"
-- Preserves auth users and profiles so the admin remains logged in!
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

    -- Log before wiping
    INSERT INTO public.activity_logs (user_id, user_email, action, record_type, details)
    VALUES (caller_id, caller_email, 'Database Reset Requested', 'system', 'Full business database wipe executed by admin');

    -- Truncate business operational tables
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

-- Helper function to check if current caller is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Any authenticated user can read profiles; user can update own profile; only admin can update roles or deactivate
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

-- Business tables: Authenticated active staff and admins can read/insert/update and delete data
-- POULTRY STOCK
CREATE POLICY "Read poultry stock" ON public.poultry_stock
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert poultry stock" ON public.poultry_stock
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update poultry stock" ON public.poultry_stock
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete poultry stock" ON public.poultry_stock
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- POULTRY MOVEMENTS
CREATE POLICY "Read poultry movements" ON public.poultry_movements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert poultry movements" ON public.poultry_movements
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Delete poultry movements" ON public.poultry_movements
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- EGG PRODUCTION
CREATE POLICY "Read egg production" ON public.egg_production
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert egg production" ON public.egg_production
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update egg production" ON public.egg_production
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete egg production" ON public.egg_production
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- BROODING RECORDS
CREATE POLICY "Read brooding records" ON public.brooding_records
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert brooding records" ON public.brooding_records
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update brooding records" ON public.brooding_records
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete brooding records" ON public.brooding_records
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- EXPENSES
CREATE POLICY "Read expenses" ON public.expenses
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert expenses" ON public.expenses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update expenses" ON public.expenses
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete expenses" ON public.expenses
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- EXPENSE CATEGORIES
CREATE POLICY "Read categories" ON public.expense_categories
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert categories" ON public.expense_categories
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Delete categories (Admin only)" ON public.expense_categories
    FOR DELETE TO authenticated USING (public.is_admin() AND is_system = false);

-- CUSTOMERS
CREATE POLICY "Read customers" ON public.customers
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update customers" ON public.customers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete customers" ON public.customers
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- SALES
CREATE POLICY "Read sales" ON public.sales
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert sales" ON public.sales
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update sales" ON public.sales
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete sales" ON public.sales
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ACTIVITY LOGS
CREATE POLICY "Read activity logs" ON public.activity_logs
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Insert activity logs" ON public.activity_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- BUSINESS SETTINGS
CREATE POLICY "Read business settings" ON public.business_settings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage business settings (Admin only)" ON public.business_settings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

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
-- Enable realtime publication for all business operational tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.egg_production;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brooding_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry_news;
