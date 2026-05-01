BEGIN;

-- Consolidate duplicate permissive SELECT policies flagged by Supabase's
-- Performance Advisor. Keep the canonical policy and preserve its access.
ALTER TABLE public.role_permissions
ENABLE ROW LEVEL SECURITY;

-- noqa: disable=RF05
DROP POLICY IF EXISTS "Role permissions are readable"
ON public.role_permissions;
-- noqa: enable=RF05

DROP POLICY IF EXISTS role_permissions_are_readable
ON public.role_permissions;

CREATE POLICY role_permissions_are_readable
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

COMMIT;
