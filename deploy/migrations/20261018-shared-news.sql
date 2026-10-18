-- Apply to the user-owned database before deploying this release.
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS kicker_color text NOT NULL DEFAULT 'red';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_homepage_main boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.articles'::regclass AND conname = 'articles_kicker_color_check') THEN
    ALTER TABLE public.articles ADD CONSTRAINT articles_kicker_color_check CHECK (kicker_color IN ('saffron', 'green', 'red', 'black'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.select_homepage_article()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NEW.is_homepage_main THEN
    UPDATE public.articles SET is_homepage_main = false WHERE is_homepage_main AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.select_homepage_article() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_homepage_article() TO authenticated, service_role;
CREATE OR REPLACE TRIGGER select_homepage_article
BEFORE INSERT OR UPDATE OF is_homepage_main ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.select_homepage_article();
CREATE UNIQUE INDEX IF NOT EXISTS articles_one_homepage_main ON public.articles (is_homepage_main) WHERE is_homepage_main;