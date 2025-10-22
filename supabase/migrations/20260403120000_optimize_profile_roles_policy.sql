BEGIN;

-- Cache auth.uid() in a subquery to avoid per-row evaluation.
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
        WHERE p.user_id = (SELECT auth.uid())
    )
);

COMMIT;
