-- Refresh RLS policy to avoid per-row auth.role() evaluation
DROP POLICY IF EXISTS "Accommodations are viewable by authenticated users"
  ON public.trip_plan_accommodations;

CREATE POLICY "Accommodations are viewable by authenticated users"
  ON public.trip_plan_accommodations
  FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');
