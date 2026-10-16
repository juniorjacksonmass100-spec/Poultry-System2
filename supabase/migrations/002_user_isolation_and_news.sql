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
