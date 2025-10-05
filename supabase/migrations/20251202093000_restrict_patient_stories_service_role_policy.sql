-- Restrict service role policy for patient_stories to avoid redundant evaluation for anon role
BEGIN;

DROP POLICY IF EXISTS "Service role can manage patient stories"
  ON public.patient_stories;

CREATE POLICY "Service role can manage patient stories"
  ON public.patient_stories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
