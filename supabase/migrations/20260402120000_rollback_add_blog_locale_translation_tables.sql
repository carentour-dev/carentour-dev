-- Rollback Migration: Remove Blog Locale Translation Tables
-- Reverses 20260402120000_add_blog_locale_translation_tables.sql
-- USAGE: Run this manually in the Supabase SQL Editor if you need to
-- rollback the forward migration after it has been applied.

BEGIN;

DROP POLICY IF EXISTS read_blog_category_translations
ON public.blog_category_translations;

DROP POLICY IF EXISTS write_blog_category_translations
ON public.blog_category_translations;

DROP POLICY IF EXISTS read_blog_tag_translations
ON public.blog_tag_translations;

DROP POLICY IF EXISTS write_blog_tag_translations
ON public.blog_tag_translations;

DROP POLICY IF EXISTS read_blog_author_translations
ON public.blog_author_translations;

DROP POLICY IF EXISTS write_blog_author_translations
ON public.blog_author_translations;

DROP POLICY IF EXISTS read_blog_post_translations
ON public.blog_post_translations;

DROP POLICY IF EXISTS write_blog_post_translations
ON public.blog_post_translations;

DROP TRIGGER IF EXISTS trg_blog_category_translations_updated_at
ON public.blog_category_translations;

DROP TRIGGER IF EXISTS trg_blog_tag_translations_updated_at
ON public.blog_tag_translations;

DROP TRIGGER IF EXISTS trg_blog_author_translations_updated_at
ON public.blog_author_translations;

DROP TRIGGER IF EXISTS trg_blog_post_translations_updated_at
ON public.blog_post_translations;

DROP TABLE IF EXISTS public.blog_post_translations;
DROP TABLE IF EXISTS public.blog_author_translations;
DROP TABLE IF EXISTS public.blog_tag_translations;
DROP TABLE IF EXISTS public.blog_category_translations;

DROP FUNCTION IF EXISTS public.blog_post_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.blog_author_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.blog_tag_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.blog_category_translations_set_updated_at();

-- Remove the CMS rows seeded by the forward migration.
-- This is intentionally destructive because these slugs did not exist before
-- the CMS-native blog cutover.
DELETE FROM public.cms_pages
WHERE slug IN (
    'blog',
    'blog-category-template',
    'blog-tag-template',
    'blog-author-template',
    'blog-post-template'
);

COMMIT;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 1. This rollback removes all blog translation tables, policies, triggers,
--    helper functions, and the seeded CMS rows introduced by
--    20260402120000_add_blog_locale_translation_tables.sql.
--
-- 2. Base English blog records remain intact in:
--    - public.blog_categories
--    - public.blog_tags
--    - public.blog_authors
--    - public.blog_posts
--
-- 3. This rollback is destructive for any translation data and CMS template
--    content created after the forward migration. Export that data first if
--    you may need it later.
--
-- 4. After running this rollback you should also revert the application code
--    that expects:
--    - public.blog_*_translations tables
--    - CMS-rendered /blog public routes
--    - locale-aware blog editing in the CMS
--
-- 5. If the forward migration was marked as applied in Supabase migration
--    history, update the history separately after running this script, e.g.:
--    supabase migration repair 20260402120000 --status reverted
