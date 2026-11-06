-- Reporter logins, article videos, desktop hover-ad sizes and registration control.
-- Apply after 20261106-a-reporter-role.sql. All changes are additive.

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS youtube_id text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS author_id uuid DEFAULT auth.uid();
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS author_id uuid DEFAULT auth.uid();
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS desktop_width integer;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS desktop_height integer;

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  add_articles boolean NOT NULL DEFAULT true,
  edit_own_articles boolean NOT NULL DEFAULT true,
  delete_own_articles boolean NOT NULL DEFAULT false,
  publish_articles boolean NOT NULL DEFAULT false,
  add_videos boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_permissions TO authenticated;
GRANT ALL ON public.staff_permissions TO service_role;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions self read" ON public.staff_permissions;
CREATE POLICY "permissions self read" ON public.staff_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "permissions admin write" ON public.staff_permissions;
CREATE POLICY "permissions admin write" ON public.staff_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.reporter_can(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'reporter')
    AND COALESCE((
      SELECT CASE _perm
        WHEN 'add_articles' THEN p.add_articles
        WHEN 'edit_own_articles' THEN p.edit_own_articles
        WHEN 'delete_own_articles' THEN p.delete_own_articles
        WHEN 'publish_articles' THEN p.publish_articles
        WHEN 'add_videos' THEN p.add_videos
        ELSE false END
      FROM public.staff_permissions p WHERE p.user_id = _user_id), false)
$$;
REVOKE ALL ON FUNCTION public.reporter_can(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reporter_can(uuid, text) TO anon, authenticated, service_role;

-- Reporters: own articles only, never the homepage main headline, publish only if allowed.
DROP POLICY IF EXISTS "articles reporter read own" ON public.articles;
CREATE POLICY "articles reporter read own" ON public.articles FOR SELECT TO authenticated
  USING (author_id = auth.uid() AND public.has_role(auth.uid(), 'reporter'));
DROP POLICY IF EXISTS "articles reporter insert" ON public.articles;
CREATE POLICY "articles reporter insert" ON public.articles FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.reporter_can(auth.uid(), 'add_articles')
    AND NOT is_homepage_main AND (NOT published OR public.reporter_can(auth.uid(), 'publish_articles')));
DROP POLICY IF EXISTS "articles reporter update own" ON public.articles;
CREATE POLICY "articles reporter update own" ON public.articles FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.reporter_can(auth.uid(), 'edit_own_articles'))
  WITH CHECK (author_id = auth.uid() AND NOT is_homepage_main
    AND (NOT published OR public.reporter_can(auth.uid(), 'publish_articles')));
DROP POLICY IF EXISTS "articles reporter delete own" ON public.articles;
CREATE POLICY "articles reporter delete own" ON public.articles FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND public.reporter_can(auth.uid(), 'delete_own_articles'));

DROP POLICY IF EXISTS "videos reporter insert" ON public.videos;
CREATE POLICY "videos reporter insert" ON public.videos FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.reporter_can(auth.uid(), 'add_videos'));
DROP POLICY IF EXISTS "videos reporter update own" ON public.videos;
CREATE POLICY "videos reporter update own" ON public.videos FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.reporter_can(auth.uid(), 'add_videos'))
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "media reporter insert" ON storage.objects;
CREATE POLICY "media reporter insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.reporter_can(auth.uid(), 'add_articles'));
DROP POLICY IF EXISTS "media reporter read" ON storage.objects;
CREATE POLICY "media reporter read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'reporter'));

-- Registration switch: site_settings row 'registration' (footer_text 'open' | 'closed').
-- Missing row means open. The very first account (no admin yet) is always allowed.
CREATE OR REPLACE FUNCTION public.enforce_registration_open()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN NEW;
  END IF;
  IF COALESCE((SELECT footer_text FROM public.site_settings WHERE id = 'registration'), 'open') <> 'open' THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;
  IF COALESCE(NEW.raw_app_meta_data->>'provider', 'email') <> 'email' THEN
    RAISE EXCEPTION 'Registration is only available with email and password';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_registration_open() FROM PUBLIC;
DROP TRIGGER IF EXISTS enforce_registration_open ON auth.users;
CREATE TRIGGER enforce_registration_open BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_open();

NOTIFY pgrst, 'reload schema';
