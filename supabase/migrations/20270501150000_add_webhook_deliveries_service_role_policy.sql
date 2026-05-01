-- Add an explicit RLS policy for server-side webhook delivery access.
-- Browser/client roles intentionally receive no policy for this table.
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'webhook_deliveries'
          AND policyname = 'service_role_manages_webhook_deliveries'
    ) THEN
        CREATE POLICY service_role_manages_webhook_deliveries
        ON public.webhook_deliveries
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END;
$$;

COMMIT;
