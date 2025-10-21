BEGIN;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  role_has_super BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  WITH role_memberships AS (
    SELECT r.id, r.is_superuser
    FROM public.profiles p
    JOIN public.profile_roles pr ON pr.profile_id = p.id
    JOIN public.roles r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
  )
  SELECT COALESCE(bool_or(rm.is_superuser), FALSE)
  INTO role_has_super
  FROM role_memberships rm;

  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  IF role_has_super THEN
    RETURN ARRAY(
      SELECT perm.slug
      FROM public.permissions perm
      ORDER BY perm.slug
    );
  END IF;

  RETURN ARRAY(
    SELECT DISTINCT perm.slug
    FROM (
      SELECT r.id, r.is_superuser
      FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.user_id = p_user_id
    ) rm
    JOIN public.role_permissions rp ON rp.role_id = rm.id
    JOIN public.permissions perm ON perm.id = rp.permission_id
    ORDER BY perm.slug
  );
END;
$$;

COMMIT;
