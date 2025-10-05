-- Split facilities service-role policy to avoid duplicate anon SELECT evaluations
BEGIN;

DROP POLICY IF EXISTS "Service role manages facilities"
ON public.facilities;

CREATE POLICY "Service role inserts facilities"
ON public.facilities
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role updates facilities"
ON public.facilities
FOR UPDATE
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role deletes facilities"
ON public.facilities
FOR DELETE
USING ((SELECT auth.role()) = 'service_role');

COMMIT;
