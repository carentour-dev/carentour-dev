-- Replace per-row auth.role() evaluation in facilities service role policy
BEGIN;

ALTER POLICY "Service role manages facilities"
ON public.facilities
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

COMMIT;
