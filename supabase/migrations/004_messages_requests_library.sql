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
