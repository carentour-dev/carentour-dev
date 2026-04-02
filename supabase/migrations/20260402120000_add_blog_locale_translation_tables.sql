BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_category_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_category_id uuid NOT NULL REFERENCES public.blog_categories (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    name text, -- noqa: RF04
    slug text,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_category_translations_locale_key UNIQUE (blog_category_id, locale)
);

CREATE TABLE IF NOT EXISTS public.blog_tag_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_tag_id uuid NOT NULL REFERENCES public.blog_tags (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    name text, -- noqa: RF04
    slug text,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_tag_translations_locale_key UNIQUE (blog_tag_id, locale)
);

CREATE TABLE IF NOT EXISTS public.blog_author_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_author_id uuid NOT NULL REFERENCES public.blog_authors (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    name text, -- noqa: RF04
    slug text,
    bio text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_author_translations_locale_key UNIQUE (blog_author_id, locale)
);

CREATE TABLE IF NOT EXISTS public.blog_post_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id uuid NOT NULL REFERENCES public.blog_posts (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('en', 'ar')), -- noqa: RF04
    slug text,
    title text,
    excerpt text,
    content jsonb NOT NULL DEFAULT '{"type":"richtext","data":""}'::jsonb, -- noqa: RF04
    seo_title text,
    seo_description text,
    seo_keywords text,
    og_image text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_post_translations_locale_key UNIQUE (blog_post_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_category_translations_locale_slug
ON public.blog_category_translations (locale, slug)
WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_tag_translations_locale_slug
ON public.blog_tag_translations (locale, slug)
WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_author_translations_locale_slug
ON public.blog_author_translations (locale, slug)
WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_post_translations_locale_slug
ON public.blog_post_translations (locale, slug)
WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_category_translations_lookup
ON public.blog_category_translations (blog_category_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_blog_tag_translations_lookup
ON public.blog_tag_translations (blog_tag_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_blog_author_translations_lookup
ON public.blog_author_translations (blog_author_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_blog_post_translations_lookup
ON public.blog_post_translations (blog_post_id, locale, status);

CREATE OR REPLACE FUNCTION public.blog_category_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.blog_tag_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.blog_author_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.blog_post_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_category_translations_updated_at
ON public.blog_category_translations;
CREATE TRIGGER trg_blog_category_translations_updated_at
BEFORE UPDATE ON public.blog_category_translations
FOR EACH ROW
EXECUTE FUNCTION public.blog_category_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_tag_translations_updated_at
ON public.blog_tag_translations;
CREATE TRIGGER trg_blog_tag_translations_updated_at
BEFORE UPDATE ON public.blog_tag_translations
FOR EACH ROW
EXECUTE FUNCTION public.blog_tag_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_author_translations_updated_at
ON public.blog_author_translations;
CREATE TRIGGER trg_blog_author_translations_updated_at
BEFORE UPDATE ON public.blog_author_translations
FOR EACH ROW
EXECUTE FUNCTION public.blog_author_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_post_translations_updated_at
ON public.blog_post_translations;
CREATE TRIGGER trg_blog_post_translations_updated_at
BEFORE UPDATE ON public.blog_post_translations
FOR EACH ROW
EXECUTE FUNCTION public.blog_post_translations_set_updated_at();

ALTER TABLE public.blog_category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_author_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_blog_category_translations ON public.blog_category_translations;
CREATE POLICY read_blog_category_translations
ON public.blog_category_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_category_translations ON public.blog_category_translations;
CREATE POLICY write_blog_category_translations
ON public.blog_category_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_blog_tag_translations ON public.blog_tag_translations;
CREATE POLICY read_blog_tag_translations
ON public.blog_tag_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_tag_translations ON public.blog_tag_translations;
CREATE POLICY write_blog_tag_translations
ON public.blog_tag_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_blog_author_translations ON public.blog_author_translations;
CREATE POLICY read_blog_author_translations
ON public.blog_author_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_author_translations ON public.blog_author_translations;
CREATE POLICY write_blog_author_translations
ON public.blog_author_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_blog_post_translations ON public.blog_post_translations;
CREATE POLICY read_blog_post_translations
ON public.blog_post_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_post_translations ON public.blog_post_translations;
CREATE POLICY write_blog_post_translations
ON public.blog_post_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

INSERT INTO public.cms_pages (slug, title, content, seo, settings, status)
VALUES
('blog', 'Blog', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'published'),
('blog-category-template', 'Blog Category Template', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'published'),
('blog-tag-template', 'Blog Tag Template', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'published'),
('blog-author-template', 'Blog Author Template', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'published'),
('blog-post-template', 'Blog Post Template', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'published')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
