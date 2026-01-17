BEGIN;

DO $drop_newsletter_policies$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'newsletter_subscriptions'
          AND policyname = 'Anyone can subscribe to newsletter'
    ) THEN
        EXECUTE 'DROP POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'newsletter_subscriptions'
          AND policyname = 'Users can unsubscribe with token'
    ) THEN
        EXECUTE 'DROP POLICY "Users can unsubscribe with token" ON public.newsletter_subscriptions';
    END IF;
END;
$drop_newsletter_policies$;

-- Restrict newsletter writes to admins (service-role bypasses RLS)
DROP POLICY IF EXISTS admin_manage_newsletter_subscriptions_inserts
ON public.newsletter_subscriptions;
CREATE POLICY admin_manage_newsletter_subscriptions_inserts
ON public.newsletter_subscriptions
FOR INSERT TO authenticated
WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin')
);

DROP POLICY IF EXISTS admin_manage_newsletter_subscriptions_updates
ON public.newsletter_subscriptions;
CREATE POLICY admin_manage_newsletter_subscriptions_updates
ON public.newsletter_subscriptions
FOR UPDATE TO authenticated
USING (
    public.has_role((SELECT auth.uid()), 'admin')
)
WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin')
);

DROP POLICY IF EXISTS admin_manage_newsletter_subscriptions_deletes
ON public.newsletter_subscriptions;
CREATE POLICY admin_manage_newsletter_subscriptions_deletes
ON public.newsletter_subscriptions
FOR DELETE TO authenticated
USING (
    public.has_role((SELECT auth.uid()), 'admin')
);

COMMIT;
