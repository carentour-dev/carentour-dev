-- Forward Migration: Add Public Locale Translation Tables
-- Adds Arabic translation storage for public CMS pages, navigation, FAQs,
-- and FAQ categories.
-- SAFETY: This migration runs inside an explicit transaction so schema
-- changes are applied atomically when executed manually.

BEGIN;

CREATE TABLE IF NOT EXISTS public.cms_page_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cms_page_id uuid NOT NULL REFERENCES public.cms_pages (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    title text,
    seo jsonb NOT NULL DEFAULT '{}'::jsonb,
    content jsonb NOT NULL DEFAULT '[]'::jsonb, -- noqa: RF04
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cms_page_translations_page_locale_key UNIQUE (cms_page_id, locale)
);

CREATE TABLE IF NOT EXISTS public.navigation_link_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    navigation_link_id uuid NOT NULL REFERENCES public.navigation_links (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    label text, -- noqa: RF04
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT navigation_link_translations_link_locale_key UNIQUE (navigation_link_id, locale)
);

CREATE TABLE IF NOT EXISTS public.faq_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id uuid NOT NULL REFERENCES public.faqs (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    question text,
    answer text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT faq_translations_faq_locale_key UNIQUE (faq_id, locale)
);

CREATE TABLE IF NOT EXISTS public.faq_category_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_category_slug text NOT NULL REFERENCES public.faq_categories (slug) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    title text,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT faq_category_translations_slug_locale_key UNIQUE (faq_category_slug, locale)
);

CREATE INDEX IF NOT EXISTS idx_cms_page_translations_lookup
ON public.cms_page_translations (cms_page_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_navigation_link_translations_lookup
ON public.navigation_link_translations (navigation_link_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_faq_translations_lookup
ON public.faq_translations (faq_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_faq_category_translations_lookup
ON public.faq_category_translations (faq_category_slug, locale, status);

CREATE OR REPLACE FUNCTION public.cms_page_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.navigation_link_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.faq_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.faq_category_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cms_page_translations_updated_at
ON public.cms_page_translations;
CREATE TRIGGER trg_cms_page_translations_updated_at
BEFORE UPDATE ON public.cms_page_translations
FOR EACH ROW
EXECUTE FUNCTION public.cms_page_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_navigation_link_translations_updated_at
ON public.navigation_link_translations;
CREATE TRIGGER trg_navigation_link_translations_updated_at
BEFORE UPDATE ON public.navigation_link_translations
FOR EACH ROW
EXECUTE FUNCTION public.navigation_link_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_faq_translations_updated_at
ON public.faq_translations;
CREATE TRIGGER trg_faq_translations_updated_at
BEFORE UPDATE ON public.faq_translations
FOR EACH ROW
EXECUTE FUNCTION public.faq_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_faq_category_translations_updated_at
ON public.faq_category_translations;
CREATE TRIGGER trg_faq_category_translations_updated_at
BEFORE UPDATE ON public.faq_category_translations
FOR EACH ROW
EXECUTE FUNCTION public.faq_category_translations_set_updated_at();

ALTER TABLE public.cms_page_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_link_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_category_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_cms_page_translations ON public.cms_page_translations;
CREATE POLICY read_cms_page_translations
ON public.cms_page_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_cms_page_translations ON public.cms_page_translations;
CREATE POLICY write_cms_page_translations
ON public.cms_page_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_navigation_link_translations ON public.navigation_link_translations;
CREATE POLICY read_navigation_link_translations
ON public.navigation_link_translations
FOR SELECT
USING (status IN ('published', 'hidden') OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_navigation_link_translations ON public.navigation_link_translations;
CREATE POLICY write_navigation_link_translations
ON public.navigation_link_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_faq_translations ON public.faq_translations;
CREATE POLICY read_faq_translations
ON public.faq_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_faq_translations ON public.faq_translations;
CREATE POLICY write_faq_translations
ON public.faq_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_faq_category_translations ON public.faq_category_translations;
CREATE POLICY read_faq_category_translations
ON public.faq_category_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_faq_category_translations ON public.faq_category_translations;
CREATE POLICY write_faq_category_translations
ON public.faq_category_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

COMMIT;

-- ========================================================================
-- ROLLBACK
-- ========================================================================
-- If this migration needs to be reversed after it has been applied, run:
--   supabase/migrations/20260331143000_rollback_add_public_locale_translation_tables.sql
--
-- That rollback script drops the translation tables, related policies,
-- triggers, and helper functions introduced here.
