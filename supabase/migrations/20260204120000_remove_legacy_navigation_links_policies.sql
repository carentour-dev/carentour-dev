-- Remove legacy navigation link policies with UI-generated names to avoid
-- duplicate permissive rules for the same roles/actions.
BEGIN;

-- Drop any remaining permissive SELECT policies for dashboard_user that do not
-- use the canonical read_navigation_links name.
DO $$
DECLARE
    policy record;
BEGIN
    FOR policy IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'navigation_links'
          AND cmd = 'SELECT'
          AND permissive::text IN ('t', 'true', 'permissive')
          AND policyname <> 'read_navigation_links'
          AND 'dashboard_user'::name = ANY(roles)
    LOOP
        EXECUTE format(
            'DROP POLICY %I ON public.navigation_links',
            policy.policyname
        );
    END LOOP;
END;
$$;

DO $$
DECLARE
    policy_name text;
    legacy_policy_names text[] := ARRAY[
        'Admin/Editor read navigation links',
        'Read published navigation links',
        'Admin/Editor insert navigation links',
        'Admin/Editor update navigation links',
        'Admin/Editor delete navigation links'
    ];
BEGIN
    FOREACH policy_name IN ARRAY legacy_policy_names LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.navigation_links',
            policy_name
        );
    END LOOP;
END;
$$;

COMMIT;
