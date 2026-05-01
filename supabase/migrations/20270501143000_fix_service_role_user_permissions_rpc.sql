-- Fix the hardened permission helper used by server-side authorization.
BEGIN;

CREATE OR REPLACE FUNCTION internal.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT [];
  v_is_superuser BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  WITH role_memberships AS (
    SELECT r.id, r.is_superuser
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
  ),
  assigned_perms AS (
    SELECT DISTINCT perm.slug
    FROM role_memberships AS rm
    JOIN public.role_permissions AS rp ON rp.role_id = rm.id
    JOIN public.permissions AS perm ON perm.id = rp.permission_id
  )
  SELECT
    COALESCE(bool_or(rm.is_superuser), FALSE),
    CASE
      WHEN COALESCE(bool_or(rm.is_superuser), FALSE) THEN (
        SELECT COALESCE(array_agg(perm.slug ORDER BY perm.slug), ARRAY[]::TEXT [])
        FROM public.permissions AS perm
      )
      ELSE COALESCE(
        array_agg(DISTINCT assigned_perms.slug ORDER BY assigned_perms.slug)
          FILTER (WHERE assigned_perms.slug IS NOT NULL),
        ARRAY[]::TEXT []
      )
    END
  INTO v_is_superuser, result
  FROM role_memberships AS rm
  LEFT JOIN assigned_perms ON TRUE;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_permissions(p_user_id);
$$;

REVOKE ALL ON FUNCTION public.user_permissions(UUID) FROM public;
REVOKE ALL ON FUNCTION public.user_permissions(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.user_permissions(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.user_permissions(UUID) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
