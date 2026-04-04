-- Rollback Migration: Remove Treatment Translation Tables
-- Reverses 20270403170000_add_treatment_translation_tables.sql
-- USAGE: Run this manually in the Supabase SQL Editor if you need to
-- rollback the forward migration after it has been applied.

BEGIN;

DROP POLICY IF EXISTS read_treatment_procedure_translations
ON public.treatment_procedure_translations;

DROP POLICY IF EXISTS write_treatment_procedure_translations
ON public.treatment_procedure_translations;

DROP POLICY IF EXISTS read_treatment_translations
ON public.treatment_translations;

DROP POLICY IF EXISTS write_treatment_translations
ON public.treatment_translations;

DROP TRIGGER IF EXISTS trg_treatment_procedure_translations_updated_at
ON public.treatment_procedure_translations;

DROP TRIGGER IF EXISTS trg_treatment_translations_updated_at
ON public.treatment_translations;

DROP TABLE IF EXISTS public.treatment_procedure_translations;
DROP TABLE IF EXISTS public.treatment_translations;

DROP FUNCTION IF EXISTS public.treatment_procedure_translations_set_updated_at();
DROP FUNCTION IF EXISTS public.treatment_translations_set_updated_at();

COMMIT;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 1. This rollback removes the treatment translation schema introduced by
--    20270403170000_add_treatment_translation_tables.sql.
--
-- 2. Base English treatment records remain intact in:
--    - public.treatments
--    - public.treatment_procedures
--
-- 3. This rollback is destructive for any Arabic translation data created
--    after the forward migration. Export that data first if you may need it
--    later.
--
-- 4. After running this rollback you should also revert the application code
--    that expects:
--    - public.treatment_translations
--    - public.treatment_procedure_translations
--    - locale-aware treatment editing in the admin UI
--    - Arabic-only published treatment routing and SEO behavior
--
-- 5. If the forward migration was marked as applied in Supabase migration
--    history, update the history separately after running this script, e.g.:
--    supabase migration repair 20270403170000 --status reverted
