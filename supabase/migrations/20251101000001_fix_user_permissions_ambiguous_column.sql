-- Fix ambiguous column reference in user_permissions function
-- This fixes the "column reference 'is_superuser' is ambiguous" error

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result TEXT[];
  is_superuser BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
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
    COALESCE(bool_or(role_memberships.is_superuser), FALSE),
    CASE
      WHEN bool_or(role_memberships.is_superuser) THEN (
        SELECT COALESCE(array_agg(perm.slug ORDER BY perm.slug), ARRAY[]::TEXT[])
        FROM public.permissions AS perm
      )
      ELSE COALESCE(array_agg(assigned_perms.slug ORDER BY assigned_perms.slug), ARRAY[]::TEXT[])
    END
  INTO is_superuser, result
  FROM role_memberships
  LEFT JOIN assigned_perms ON TRUE;

  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  RETURN result;
END;
$$;
