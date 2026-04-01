-- Rollback Migration: Remove Public Locale Translation Tables
-- Reverses the Arabic public-site translation tables introduced by
-- 20260331143000_add_public_locale_translation_tables.sql
-- USAGE: Run this in the Supabase SQL Editor if you need to revert
-- the forward migration after it has been applied.

BEGIN;

DROP POLICY IF EXISTS read_cms_page_translations
ON public.cms_page_translations;

DROP POLICY IF EXISTS write_cms_page_translations
ON public.cms_page_translations;

DROP POLICY IF EXISTS read_navigation_link_translations
ON public.navigation_link_translations;

DROP POLICY IF EXISTS write_navigation_link_translations
ON public.navigation_link_translations;

DROP POLICY IF EXISTS read_faq_translations
ON public.faq_translations;

DROP POLICY IF EXISTS write_faq_translations
ON public.faq_translations;

DROP POLICY IF EXISTS read_faq_category_translations
ON public.faq_category_translations;

DROP POLICY IF EXISTS write_faq_category_translations
ON public.faq_category_translations;

DROP TRIGGER IF EXISTS trg_cms_page_translations_updated_at
ON public.cms_page_translations;

DROP TRIGGER IF EXISTS trg_navigation_link_translations_updated_at
ON public.navigation_link_translations;

DROP TRIGGER IF EXISTS trg_faq_translations_updated_at
ON public.faq_translations;

DROP TRIGGER IF EXISTS trg_faq_category_translations_updated_at
ON public.faq_category_translations;

DROP TABLE IF EXISTS public.faq_category_translations;
DROP TABLE IF EXISTS public.faq_translations;
DROP TABLE IF EXISTS public.navigation_link_translations;
DROP TABLE IF EXISTS public.cms_page_translations;

DROP FUNCTION IF EXISTS public.faq_category_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.faq_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.navigation_link_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.cms_page_translations_set_updated_at();

COMMIT;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 1. This rollback removes all Arabic translation rows and schema introduced
--    by 20260331143000_add_public_locale_translation_tables.sql.
--
-- 2. The forward migration now runs in an explicit transaction. This rollback
--    is also transactional, so the reversal is all-or-nothing when run
--    manually.
--
-- 3. Base English records remain intact in:
--    - public.cms_pages
--    - public.navigation_links
--    - public.faqs
--    - public.faq_categories
--
-- 4. After running this rollback:
--    - /ar public content backed by these tables will no longer resolve
--    - the app code added for Arabic localization should also be reverted
--      or kept behind disabled rollout flags until a replacement migration
--      is applied
--
-- 5. This rollback is destructive for Arabic translation data created after
--    the forward migration. Export that data first if you may need it later.
