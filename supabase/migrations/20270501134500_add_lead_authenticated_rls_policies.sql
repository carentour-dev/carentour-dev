-- Align lead management RLS with the seeded operations.leads permission.
-- SQL Editor friendly: uses create-or-update policy blocks.
BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'lead_inquiries'
          AND policyname = 'staff_manage_lead_inquiries'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_inquiries
            ON public.lead_inquiries
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_inquiries
            ON public.lead_inquiries
            FOR ALL
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'lead_events'
          AND policyname = 'staff_manage_lead_events'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_events
            ON public.lead_events
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_events
            ON public.lead_events
            FOR ALL
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'lead_attribution'
          AND policyname = 'staff_manage_lead_attribution'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_attribution
            ON public.lead_attribution
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_attribution
            ON public.lead_attribution
            FOR ALL
            TO authenticated
            USING (public.has_permission((SELECT auth.uid()), 'operations.leads'))
            WITH CHECK (public.has_permission((SELECT auth.uid()), 'operations.leads'))
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'external_identities'
          AND policyname = 'staff_manage_lead_external_identities'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_external_identities
            ON public.external_identities
            TO authenticated
            USING (
                entity_type = 'lead'
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                entity_type = 'lead'
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_external_identities
            ON public.external_identities
            FOR ALL
            TO authenticated
            USING (
                entity_type = 'lead'
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                entity_type = 'lead'
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'communication_events'
          AND policyname = 'staff_manage_lead_communication_events'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_communication_events
            ON public.communication_events
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_communication_events
            ON public.communication_events
            FOR ALL
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'marketing_consents'
          AND policyname = 'staff_manage_lead_marketing_consents'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_marketing_consents
            ON public.marketing_consents
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_marketing_consents
            ON public.marketing_consents
            FOR ALL
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'automation_runs'
          AND policyname = 'staff_manage_lead_automation_runs'
    ) THEN
        EXECUTE $policy$
            ALTER POLICY staff_manage_lead_automation_runs
            ON public.automation_runs
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY staff_manage_lead_automation_runs
            ON public.automation_runs
            FOR ALL
            TO authenticated
            USING (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
            WITH CHECK (
                lead_id IS NOT NULL
                AND public.has_permission((SELECT auth.uid()), 'operations.leads')
            )
        $policy$;
    END IF;
END;
$$;

COMMIT;
