-- Optimize patients policies to avoid per-row auth function evaluation
BEGIN;

-- Recreate select policy with cached auth context
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients;
CREATE POLICY "Patients can view their own record"
  ON public.patients
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Recreate insert policy with cached auth context
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;
CREATE POLICY "Patients can insert their own record"
  ON public.patients
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Recreate update policy with cached auth context
DROP POLICY IF EXISTS "Patients can update their own record" ON public.patients;
CREATE POLICY "Patients can update their own record"
  ON public.patients
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

COMMIT;
