CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories staff write" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  kicker text NOT NULL DEFAULT '',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category_label text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT 'desh',
  place text NOT NULL DEFAULT '',
  time_label text NOT NULL DEFAULT '',
  image_url text,
  tone text NOT NULL DEFAULT 'plain',
  section text NOT NULL DEFAULT 'feed',
  sort_order int NOT NULL DEFAULT 0,
  is_breaking boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles public read" ON public.articles FOR SELECT USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "articles staff write" ON public.articles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER articles_touch BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX articles_section_idx ON public.articles (section, sort_order);
CREATE INDEX articles_category_idx ON public.articles (category_slug);

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id text NOT NULL,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  time_label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos public read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos staff write" ON public.videos FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER videos_touch BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.live_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  youtube_id text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_live boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_channels TO authenticated;
GRANT ALL ON public.live_channels TO service_role;
ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live public read" ON public.live_channels FOR SELECT USING (true);
CREATE POLICY "live staff write" ON public.live_channels FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER live_touch BEFORE UPDATE ON public.live_channels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.trending_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trending_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trending_tags TO authenticated;
GRANT ALL ON public.trending_tags TO service_role;
ALTER TABLE public.trending_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags public read" ON public.trending_tags FOR SELECT USING (true);
CREATE POLICY "tags staff write" ON public.trending_tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.epaper_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  date_label text NOT NULL,
  pdf_url text,
  is_current boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.epaper_editions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epaper_editions TO authenticated;
GRANT ALL ON public.epaper_editions TO service_role;
ALTER TABLE public.epaper_editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "editions public read" ON public.epaper_editions FOR SELECT USING (true);
CREATE POLICY "editions staff write" ON public.epaper_editions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER editions_touch BEFORE UPDATE ON public.epaper_editions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.epaper_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.epaper_editions(id) ON DELETE CASCADE,
  page_no int NOT NULL,
  image_url text NOT NULL,
  thumb_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.epaper_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epaper_pages TO authenticated;
GRANT ALL ON public.epaper_pages TO service_role;
ALTER TABLE public.epaper_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages public read" ON public.epaper_pages FOR SELECT USING (true);
CREATE POLICY "pages staff write" ON public.epaper_pages FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX epaper_pages_edition_idx ON public.epaper_pages (edition_id, page_no);

CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'main',
  site_name text NOT NULL DEFAULT 'जय हिन्द भारत',
  logo_url text,
  lead_kicker text NOT NULL DEFAULT '',
  lead_title text NOT NULL DEFAULT '',
  breaking_label text NOT NULL DEFAULT 'ब्रेकिंग',
  ticker_seconds int NOT NULL DEFAULT 40,
  footer_text text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings staff write" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.articles (slug, kicker, title, summary, category_label, category_slug, place, time_label, image_url, tone, section, sort_order, is_breaking) VALUES
('a1', 'संसद सत्र', 'नए श्रम कानून पर घमासान: सरकार ने गिनाए फायदे, विपक्ष ने बताया जल्दबाजी', 'लोकसभा में छह घंटे चली बहस के बाद विधेयक पारित; राज्यसभा में कल पेश होगा।', 'देश', 'desh', 'नई दिल्ली', '12 मिनट पहले', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'saffron', 'big', 0, true),
('a2', 'दिल्ली एनसीआर', 'मेट्रो फेज-5 को मंजूरी: 42 किलोमीटर नई लाइन, 31 स्टेशन और तीन इंटरचेंज', '2029 तक पूरा होने का लक्ष्य, रोजाना नौ लाख यात्रियों को मिलेगी राहत।', 'शहर और राज्य', 'rajya', 'नोएडा', '28 मिनट पहले', '/__l5e/assets-v1/1508387f-d329-46d9-954d-f594087181fd/news-metro.jpg', 'green', 'big', 1, true),
('a3', 'मौसम', 'पहाड़ों पर भारी बारिश का अलर्ट: चार जिलों में स्कूल बंद, यात्रा से पहले जांच लें रास्ता', 'मौसम विभाग ने अगले 48 घंटे के लिए ऑरेंज अलर्ट जारी किया है।', 'देश', 'desh', 'देहरादून', '45 मिनट पहले', '/__l5e/assets-v1/62df8e10-c3a3-4e5a-be3c-23d49ef388bc/news-monsoon.jpg', 'plain', 'big', 2, true),
('b1', 'कानपुर', 'किसानों को सीधा फायदा: मंडी शुल्क घटा, ई-नीलामी से मिलेगा बेहतर दाम', 'प्रदेश की 118 मंडियों में नया सिस्टम इस महीने से लागू।', 'देश', 'desh', 'कानपुर', '1 घंटा पहले', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'saffron', 'desh', 0, false),
('b2', 'कारोबार', 'सेंसेक्स 640 अंक चढ़ा: आईटी और बैंकिंग शेयरों में जोरदार खरीदारी', 'रुपया 12 पैसे मजबूत, विदेशी निवेशकों की वापसी से बाजार में जोश।', 'कारोबार', 'karobar', 'मुंबई', '1 घंटा पहले', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'green', 'desh', 1, false),
('b3', 'क्रिकेट', 'एशिया कप 2026: भारत का पूरा शेड्यूल जारी, पहला मुकाबला 12 सितंबर को', 'टीम इंडिया के तीन बड़े मुकाबले, टिकट बिक्री कल से शुरू।', 'खेल', 'khel', 'कोलंबो', '2 घंटे पहले', '/__l5e/assets-v1/1508387f-d329-46d9-954d-f594087181fd/news-metro.jpg', 'plain', 'desh', 2, false),
('c1', 'पूर्णिमा 2026', 'श्रावण पूर्णिमा व्रत: जानें स्नान और दान का सही समय', '', 'धर्म', 'desh', 'धर्म', '19 सेकंड पहले', '/__l5e/assets-v1/62df8e10-c3a3-4e5a-be3c-23d49ef388bc/news-monsoon.jpg', 'plain', 'latest', 0, true),
('c2', '', '35 साल बाद विश्वविद्यालय में नया कुलपति, जानिए कौन दौड़ में सबसे आगे', '', 'शिक्षा', 'rajya', 'पटना', '1 मिनट पहले', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'plain', 'latest', 1, true),
('c3', 'पश्चिम बंगाल', 'छात्र संगठनों में झड़प, कैंपस में तनाव; पुलिस तैनात', '', 'शहर और राज्य', 'rajya', 'कोलकाता', '4 मिनट पहले', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'plain', 'latest', 2, true),
('c4', 'हेल्थ अलर्ट', 'बीपी की दवाएं किडनी के लिए न बढ़ा दें मुश्किल? ये बातें जरूर जान लें', '', 'सेहत', 'desh', 'हेल्थ', '5 मिनट पहले', '/__l5e/assets-v1/1508387f-d329-46d9-954d-f594087181fd/news-metro.jpg', 'plain', 'latest', 3, true),
('c5', 'लाइव ब्रेकिंग', 'पढ़ें 20 अगस्त के मुख्य और ताजा समाचार — लाइव अपडेट', '', 'देश', 'desh', 'नई दिल्ली', '14 मिनट पहले', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'plain', 'latest', 4, true),
('d1', 'चीनी के दाम', 'चाय की चुस्की हुई महंगी: 19 मिलों ने बढ़ाए दाम, 61 रुपये किलो पहुंची चीनी', 'कुछ व्यापारियों का मानना है कि आने वाले दिनों में चीनी की कीमत 80 रुपये प्रति किलो तक पहुंच सकती है। रोजाना बढ़ रहे दाम से बाजारों में दुकानदार-ग्राहक के बीच बहस भी शुरू हो गई है।', 'कारोबार', 'karobar', 'अलीगढ़', '20 अगस्त 2026', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'plain', 'feed', 0, false),
('d2', 'अंतरराष्ट्रीय', 'सीमा वार्ता का नया दौर: दोनों देशों ने तनाव घटाने पर जताई सहमति', 'साझा बयान में कहा गया कि अगली बैठक अक्तूबर में होगी।', 'दुनिया', 'duniya', 'जिनेवा', '20 अगस्त 2026', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'plain', 'feed', 1, false),
('d3', 'स्कूल सुरक्षा', 'स्कूल परिसर सुरक्षा पर सख्ती: सीसीटीवी और वेरिफिकेशन अनिवार्य', 'आदेश न मानने वाले संस्थानों की मान्यता पर होगा फैसला।', 'देश', 'desh', 'लखनऊ', '20 अगस्त 2026', '/__l5e/assets-v1/62df8e10-c3a3-4e5a-be3c-23d49ef388bc/news-monsoon.jpg', 'plain', 'feed', 2, false),
('d4', 'बैडमिंटन', 'वर्ल्ड चैंपियनशिप: भारतीय जोड़ी क्वार्टर फाइनल में, कल कड़ी चुनौती', 'सीधे गेमों में जीत के साथ अंतिम आठ में जगह पक्की।', 'खेल', 'khel', 'पेरिस', '20 अगस्त 2026', '/__l5e/assets-v1/1508387f-d329-46d9-954d-f594087181fd/news-metro.jpg', 'plain', 'feed', 3, false),
('d5', 'मनोरंजन', 'बॉक्स ऑफिस पर नई फिल्म का दमदार आगाज, पहले दिन 34 करोड़', 'समीक्षकों ने कहानी और संगीत की तारीफ की।', 'मनोरंजन', 'manoranjan', 'मुंबई', '20 अगस्त 2026', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'plain', 'feed', 4, false),
('d6', 'तकनीक', 'देश में बनेगी सेमीकंडक्टर यूनिट, 12 हजार नौकरियों का दावा', 'पहला उत्पादन 2028 की पहली तिमाही से शुरू होगा।', 'कारोबार', 'karobar', 'अहमदाबाद', '20 अगस्त 2026', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'plain', 'feed', 5, false),
('e1', 'आज का राशिफल', '20 अगस्त: मेष और सिंह राशि वालों की बढ़ेगी तरक्की, मिलेंगे नए अवसर', '', 'भविष्यफल', 'desh', 'ज्योतिष', '20 अगस्त 2026', '/__l5e/assets-v1/62df8e10-c3a3-4e5a-be3c-23d49ef388bc/news-monsoon.jpg', 'plain', 'trending', 0, false),
('e2', 'एक्सप्लेनर', 'कौन तय करता है पेट्रोल की कीमत? समझें पूरा गणित आसान भाषा में', '', 'एक्सप्लेनर', 'karobar', 'नई दिल्ली', '20 अगस्त 2026', '/__l5e/assets-v1/f883d3be-31f9-4506-814a-ac9838ef5375/news-parliament.jpg', 'plain', 'trending', 1, false),
('e3', 'जांच', 'सरकारी धन के दुरुपयोग पर शिकंजा, तीन ट्रस्टों के दस्तावेज खंगाले', '', 'देश', 'desh', 'लखनऊ', '20 अगस्त 2026', '/__l5e/assets-v1/4eda206b-122a-4cf0-8e15-10d643b4f11f/news-market.jpg', 'plain', 'trending', 2, false),
('e4', 'वर्ल्ड', 'प्रवासी नियमों में बदलाव की मांग, संसदीय समिति ने सौंपी रिपोर्ट', '', 'दुनिया', 'duniya', 'वाशिंगटन', '20 अगस्त 2026', '/__l5e/assets-v1/1508387f-d329-46d9-954d-f594087181fd/news-metro.jpg', 'plain', 'trending', 3, false),
('e5', 'सितंबर राशिफल', 'इन राशियों के लिए सितंबर लाएगा खुशखबरी, शुरू होंगे अच्छे दिन', '', 'भविष्यफल', 'desh', 'ज्योतिष', '20 अगस्त 2026', '/__l5e/assets-v1/62df8e10-c3a3-4e5a-be3c-23d49ef388bc/news-monsoon.jpg', 'plain', 'trending', 4, false);

INSERT INTO public.categories (slug, label, sort_order) VALUES
('desh', 'देश', 0),
('rajya', 'शहर और राज्य', 1),
('duniya', 'दुनिया', 2),
('karobar', 'कारोबार', 3),
('khel', 'खेल', 4),
('manoranjan', 'मनोरंजन', 5);

INSERT INTO public.trending_tags (label, sort_order) VALUES
('सावन 2026', 0),
('विधानसभा सत्र', 1),
('मौसम अपडेट', 2),
('सक्षम भारत', 3),
('छात्रवृत्ति', 4);

INSERT INTO public.videos (youtube_id, title, duration, category, time_label, sort_order) VALUES
('0e3GPea1Tyg', 'संसद में नया श्रम कानून: क्या बदलेगा आपकी नौकरी में? पूरी बहस', '8:42', 'देश', '20 अगस्त 2026', 0),
('hHW1oY26kxQ', 'मेट्रो फेज-5 का रूट मैप: आपके इलाके से कहां गुजरेगी नई लाइन', '5:12', 'शहर और राज्य', '20 अगस्त 2026', 1),
('9bZkp7q19f0', 'चीनी 61 रुपये किलो: बाजार से ग्राउंड रिपोर्ट', '4:03', 'कारोबार', '19 अगस्त 2026', 2),
('ScMzIvxBSi4', 'एशिया कप शेड्यूल जारी: भारत के बड़े मुकाबले कब-कब', '6:27', 'खेल', '19 अगस्त 2026', 3),
('kJQP7kiw5Fk', 'पहाड़ों में भारी बारिश: यात्रा पर निकलने से पहले देखें ये रिपोर्ट', '3:48', 'मौसम', '19 अगस्त 2026', 4),
('JGwWNGJdvx8', 'एक्सप्लेनर: सेमीकंडक्टर यूनिट से देश को क्या मिलेगा', '7:15', 'कारोबार', '18 अगस्त 2026', 5);

INSERT INTO public.site_settings (id, site_name, logo_url, lead_kicker, lead_title, footer_text, contact_email, contact_phone)
VALUES ('main', 'जय हिन्द भारत', '/__l5e/assets-v1/ff7b3b13-4c01-4734-99a5-eb83aff61ecd/jhb-logo.png', 'आज के अहम घटनाक्रम',
  '''अब विकास की राजनीति चलेगी'', संसद में गूंजा नया कानून; विपक्ष का वॉकआउट',
  'जय हिन्द भारत — हिंदी दैनिक समाचार पत्र', 'news@jaihindbharat.in', '+91 00000 00000');

INSERT INTO public.live_channels (name, youtube_id, description, is_live, sort_order) VALUES
  ('जय हिन्द भारत लाइव', 'jfKfPfyJRdk', '24x7 हिंदी समाचार लाइव स्ट्रीम', true, 0);

WITH ed AS (
  INSERT INTO public.epaper_editions (city, date_label, pdf_url, is_current, sort_order)
  VALUES ('मुख्य संस्करण', '18 अगस्त 2026', '/__l5e/assets-v1/f0768f28-e70c-4495-9d9b-6307e459220d/jai-hind-bharat-18-aug.pdf', true, 0)
  RETURNING id
)
INSERT INTO public.epaper_pages (edition_id, page_no, image_url, thumb_url)
SELECT ed.id, v.page_no, v.image_url, v.thumb_url FROM ed, (VALUES
    (1, '/__l5e/assets-v1/b99ec14e-27b0-43c0-ba99-d9e461990bb6/epaper-18aug-hi-1.jpg', '/__l5e/assets-v1/32868e0e-4375-483a-8031-fb2783284e2a/epaper-18aug-th-1.jpg'),
    (2, '/__l5e/assets-v1/5b8c09e9-dcab-48fd-b5f0-7fd25ba210c3/epaper-18aug-hi-2.jpg', '/__l5e/assets-v1/878bdc15-e6d4-41f9-9eab-a7d1329b57bd/epaper-18aug-th-2.jpg'),
    (3, '/__l5e/assets-v1/0ce91c82-04c0-41bd-9e67-4ef300ea1f43/epaper-18aug-hi-3.jpg', '/__l5e/assets-v1/ad9fdb18-51ce-4586-9826-46911a06c0b5/epaper-18aug-th-3.jpg'),
    (4, '/__l5e/assets-v1/ffa61cdd-32d6-4e0b-a5f6-2f0540aac8c6/epaper-18aug-hi-4.jpg', '/__l5e/assets-v1/720aafa1-27c2-4fb9-8e6f-5288997e09f4/epaper-18aug-th-4.jpg'),
    (5, '/__l5e/assets-v1/8b5f400f-beec-4305-91ad-36d09110cf29/epaper-18aug-hi-5.jpg', '/__l5e/assets-v1/0112b9be-f563-4a72-838c-f1888b13f2a7/epaper-18aug-th-5.jpg'),
    (6, '/__l5e/assets-v1/2d854ad1-0ba5-4126-baa0-363e8193f4e7/epaper-18aug-hi-6.jpg', '/__l5e/assets-v1/4bf76eb7-54dc-432a-9173-01c8977706a9/epaper-18aug-th-6.jpg'),
    (7, '/__l5e/assets-v1/1b31c20b-cd39-4165-a6aa-77117f4e7613/epaper-18aug-hi-7.jpg', '/__l5e/assets-v1/964ea484-8354-496a-bb79-1de126a571df/epaper-18aug-th-7.jpg'),
    (8, '/__l5e/assets-v1/596dc28c-409a-4e7c-a83d-06fde4532ee4/epaper-18aug-hi-8.jpg', '/__l5e/assets-v1/496102de-c51b-4851-86b1-54f83bb9e245/epaper-18aug-th-8.jpg')
) AS v(page_no, image_url, thumb_url);