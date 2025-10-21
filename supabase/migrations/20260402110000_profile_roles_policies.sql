BEGIN;

-- Allow authenticated users to read canonical role catalog
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Roles are readable" ON public.roles';
END;
$$;
DROP POLICY IF EXISTS roles_are_readable ON public.roles;
CREATE POLICY roles_are_readable
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read permission catalog (non-sensitive metadata)
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Permissions are readable" ON public.permissions';
END;
$$;
DROP POLICY IF EXISTS permissions_are_readable ON public.permissions;
CREATE POLICY permissions_are_readable
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read role-permission links
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Role permissions are readable" ON public.role_permissions';
END;
$$;
DROP POLICY IF EXISTS role_permissions_are_readable ON public.role_permissions;
CREATE POLICY role_permissions_are_readable
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can fetch their own role assignments
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their role memberships" ON public.profile_roles';
END;
$$;
DROP POLICY IF EXISTS profile_roles_select_self ON public.profile_roles;
CREATE POLICY profile_roles_select_self
ON public.profile_roles
FOR SELECT
TO authenticated
USING (
    profile_id IN (
        SELECT p.id
        FROM public.profiles AS p
        WHERE p.user_id = auth.uid()
    )
);

-- Service role (admin API) can manage profile role assignments
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Service role manages profile roles" ON public.profile_roles';
END;
$$;
DROP POLICY IF EXISTS profile_roles_manage_by_service_role
ON public.profile_roles;
CREATE POLICY profile_roles_manage_by_service_role
ON public.profile_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
