-- Replace per-row auth.* evaluation in security events policy
BEGIN;

ALTER POLICY "Admins can view security events"
ON public.security_events
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);

COMMIT;
