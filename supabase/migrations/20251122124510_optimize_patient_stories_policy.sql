-- Optimize patient stories service role policy to avoid repeated auth context lookups
BEGIN;

ALTER POLICY "Service role can manage patient stories"
ON public.patient_stories
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

COMMIT;
