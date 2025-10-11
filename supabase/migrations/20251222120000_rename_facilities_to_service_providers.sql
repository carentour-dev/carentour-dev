-- Rename facilities table to service_providers and refresh dependent objects
BEGIN;

DO $$
BEGIN
  -- Only rename if the old table still exists
  IF to_regclass('public.service_providers') IS NULL
     AND to_regclass('public.facilities') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.facilities RENAME TO service_providers';
  END IF;
END $$;

ALTER INDEX IF EXISTS idx_facilities_slug RENAME TO idx_service_providers_slug;
ALTER INDEX IF EXISTS idx_facilities_partner RENAME TO idx_service_providers_partner;
ALTER INDEX IF EXISTS idx_facilities_type RENAME TO idx_service_providers_type;

DROP TRIGGER IF EXISTS update_facilities_updated_at ON public.service_providers;
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON public.service_providers;

DO $$
BEGIN
  IF to_regclass('public.service_providers') IS NOT NULL THEN
    EXECUTE $cr$CREATE TRIGGER update_service_providers_updated_at
      BEFORE UPDATE ON public.service_providers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()$cr$;
  END IF;
END $$;

DROP POLICY IF EXISTS "Facilities are public" ON public.service_providers;
DROP POLICY IF EXISTS "Service providers are public" ON public.service_providers;
CREATE POLICY "Service providers are public"
ON public.service_providers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manages facilities" ON public.service_providers;
DROP POLICY IF EXISTS "Service role inserts facilities" ON public.service_providers;
DROP POLICY IF EXISTS "Service role updates facilities" ON public.service_providers;
DROP POLICY IF EXISTS "Service role deletes facilities" ON public.service_providers;
DROP POLICY IF EXISTS "Service role inserts service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Service role updates service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Service role deletes service providers" ON public.service_providers;

CREATE POLICY "Service role inserts service providers"
ON public.service_providers
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role updates service providers"
ON public.service_providers
FOR UPDATE
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role deletes service providers"
ON public.service_providers
FOR DELETE
USING ((SELECT auth.role()) = 'service_role');

COMMIT;
