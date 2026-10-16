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
