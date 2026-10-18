-- Apply to the shared user-owned database before deploying the reporter editor.
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reporter text;
COMMENT ON COLUMN public.articles.reporter IS 'Optional editor-entered reporter name; missing values display blank.';
NOTIFY pgrst, 'reload schema';