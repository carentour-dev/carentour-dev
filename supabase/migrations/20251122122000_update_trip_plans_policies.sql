-- Replace per-row auth.* evaluation in trip plan policies
BEGIN;

ALTER POLICY "Users can view their own trip plans"
  ON public.trip_plans
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can create their own trip plans"
  ON public.trip_plans
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own trip plans"
  ON public.trip_plans
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete their own trip plans"
  ON public.trip_plans
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own bookings"
  ON public.trip_plan_bookings
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_plans
      WHERE trip_plans.id = trip_plan_bookings.trip_plan_id
        AND trip_plans.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can create bookings for their trip plans"
  ON public.trip_plan_bookings
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_plans
      WHERE trip_plans.id = trip_plan_bookings.trip_plan_id
        AND trip_plans.user_id = (SELECT auth.uid())
    )
  );

COMMIT;
