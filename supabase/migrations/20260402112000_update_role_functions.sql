BEGIN;

-- Ensure helper functions bypass RLS where appropriate
CREATE OR REPLACE FUNCTION public.user_roles(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT [];
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  SELECT COALESCE(array_agg(DISTINCT r.slug ORDER BY r.slug), ARRAY[]::TEXT [])
  INTO result
  FROM public.profiles AS p
  JOIN public.profile_roles AS pr ON pr.profile_id = p.id
  JOIN public.roles AS r ON r.id = pr.role_id
  WHERE p.user_id = p_user_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT public.user_roles(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_user_id IS NULL OR p_role IS NULL OR length(p_role) = 0 THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
      AND r.slug = p_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles TEXT [])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_user_id IS NULL OR p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
      AND r.slug = ANY (p_roles)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT [];
  is_superuser BOOLEAN := FALSE;
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
    COALESCE(bool_or(is_superuser), FALSE),
    CASE
      WHEN bool_or(is_superuser) THEN (
        SELECT COALESCE(array_agg(perm.slug ORDER BY perm.slug), ARRAY[]::TEXT [])
        FROM public.permissions AS perm
      )
      ELSE COALESCE(array_agg(assigned_perms.slug ORDER BY assigned_perms.slug), ARRAY[]::TEXT [])
    END
  INTO is_superuser, result
  FROM role_memberships
  LEFT JOIN assigned_perms ON TRUE;

  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_permissions()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT public.user_permissions(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  has_super BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_permission IS NULL OR length(p_permission) = 0 THEN
    RETURN FALSE;
  END IF;

  SELECT bool_or(r.is_superuser)
  INTO has_super
  FROM public.profiles AS p
  JOIN public.profile_roles AS pr ON pr.profile_id = p.id
  JOIN public.roles AS r ON r.id = pr.role_id
  WHERE p.user_id = p_user_id;

  IF COALESCE(has_super, FALSE) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    JOIN public.role_permissions AS rp ON rp.role_id = r.id
    JOIN public.permissions AS perm ON perm.id = rp.permission_id
    WHERE p.user_id = p_user_id
      AND perm.slug = p_permission
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT public.has_permission(auth.uid(), p_permission);
$$;

COMMIT;
