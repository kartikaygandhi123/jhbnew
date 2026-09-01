CREATE TABLE public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placement text NOT NULL DEFAULT 'header',
  title text NOT NULL DEFAULT '',
  image_url text,
  link_url text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  width integer NOT NULL DEFAULT 728,
  height integer NOT NULL DEFAULT 90,
  dismissible boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads public read" ON public.ads FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "ads staff write" ON public.ads FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ads_touch_updated_at BEFORE UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();