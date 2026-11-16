-- Apply to the shared user-owned database before deploying article attachments.
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS attachment_name text;
COMMENT ON COLUMN public.articles.attachment_url IS 'Optional PDF or other file attached to the article.';
NOTIFY pgrst, 'reload schema';
