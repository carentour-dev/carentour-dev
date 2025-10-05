-- Replace per-row auth.* evaluation in newsletter subscriptions policy
BEGIN;

ALTER POLICY "Admins can view all subscriptions"
ON public.newsletter_subscriptions
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

COMMIT;
