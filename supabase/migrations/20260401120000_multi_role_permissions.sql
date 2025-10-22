-- Multi-role & permission infrastructure
BEGIN;

-- Core role catalog
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_superuser BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core permission catalog
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Join table mapping roles to permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions (
        id
    ) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, permission_id)
);

-- Join table mapping profiles to roles
CREATE TABLE IF NOT EXISTS public.profile_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users (id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (profile_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_roles_profile_id
ON public.profile_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_role_id
ON public.profile_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
ON public.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
ON public.role_permissions (permission_id);

-- Enforce RLS on new tables (service-role policies not required)
ALTER TABLE public.roles
ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions
ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions
ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles
ENABLE ROW LEVEL SECURITY;

-- Update timestamp triggers for catalog tables
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON public.permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Role helper: aggregate roles for the supplied user id
CREATE OR REPLACE FUNCTION public.user_roles(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result TEXT[];
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  SELECT COALESCE(array_agg(DISTINCT r.slug ORDER BY r.slug), ARRAY[]::TEXT[])
  INTO result
  FROM public.profiles AS p
  JOIN public.profile_roles AS pr ON pr.profile_id = p.id
  JOIN public.roles AS r ON r.id = pr.role_id
  WHERE p.user_id = p_user_id;

  RETURN result;
END;
$$;

-- Convenience alias for current auth uid
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.user_roles(auth.uid());
$$;

-- Has-role check for RLS
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Has-any-role helper
CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles TEXT [])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Permissions aggregation
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
    COALESCE(bool_or(is_superuser), FALSE),
    CASE
      WHEN bool_or(is_superuser) THEN (
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

CREATE OR REPLACE FUNCTION public.current_user_permissions()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.user_permissions(auth.uid());
$$;

-- Has-permission helper
CREATE OR REPLACE FUNCTION public.has_permission(
    p_user_id UUID, p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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
AS $$
  SELECT public.has_permission(auth.uid(), p_permission);
$$;

-- Grant helper execution to authenticated/service roles
GRANT EXECUTE ON FUNCTION public.user_roles(UUID) TO authenticated,
service_role;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated,
service_role,
anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated,
service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT []) TO authenticated,
service_role;
GRANT EXECUTE ON FUNCTION public.user_permissions(UUID) TO authenticated,
service_role;
GRANT EXECUTE ON FUNCTION public.current_user_permissions() TO authenticated,
service_role,
anon;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated,
service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(
    TEXT
) TO authenticated,
service_role,
anon;

-- Seed base roles
INSERT INTO public.roles (slug, name, description, is_superuser)
VALUES
('admin', 'Administrator', 'Full administrative access to all systems.', true),
('editor', 'Editor', 'Manages CMS content and media.', false),
('user', 'User', 'Standard authenticated user.', false),
('management', 'Management', 'Non-technical leadership role.', false),
('doctor', 'Doctor', 'Medical professional access role.', false),
('employee', 'Employee', 'Operational staff role.', false),
(
    'coordinator',
    'Coordinator',
    'Logistics and patient coordination role.',
    false
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description,
        is_superuser = excluded.is_superuser;

-- Seed base permissions
INSERT INTO public.permissions (slug, name, description)
VALUES
(
    'admin.access',
    'Admin Console Access',
    'Allows access to the administrative console.'
),
('cms.read', 'CMS Read', 'Allows reading CMS drafts and overview.'),
(
    'cms.write',
    'CMS Write',
    'Allows creating, editing, and deleting CMS content.'
),
('cms.media', 'CMS Media', 'Allows managing CMS media assets.'),
('nav.manage', 'Navigation Management', 'Allows editing navigation links.'),
(
    'newsletter.manage',
    'Newsletter Management',
    'Allows administrative access to newsletter subscriptions.'
),
(
    'security.audit.read',
    'Security Audit Read',
    'Allows viewing security event logs.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

-- Role to permission mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    r.id AS role_id,
    p.id AS permission_id
FROM public.roles AS r
INNER JOIN public.permissions AS p
    ON (
        (r.slug = 'admin')
        OR (
            r.slug = 'editor'
            AND p.slug IN (
                'cms.read',
                'cms.write',
                'cms.media',
                'nav.manage'
            )
        )
    )
WHERE r.slug IN ('admin', 'editor')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Backfill profile_roles from legacy column (defaulting to user)
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT
    p.id AS profile_id,
    r.id AS role_id,
    coalesce(p.updated_at, now()) AS assigned_at
FROM public.profiles AS p
INNER JOIN public.roles AS r ON r.slug = coalesce(nullif(p.role, ''), 'user')
ON CONFLICT (profile_id, role_id) DO NOTHING;

-- Ensure every profile has at least the user role
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT
    p.id AS profile_id,
    r.id AS role_id,
    now() AS assigned_at
FROM public.profiles AS p
INNER JOIN public.roles AS r ON r.slug = 'user'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.profile_roles AS pr
        WHERE pr.profile_id = p.id
    )
ON CONFLICT (profile_id, role_id) DO NOTHING;

-- Refresh secure_profiles view with legacy role column
CREATE OR REPLACE VIEW public.secure_profiles (
    id,
    user_id,
    username,
    role,
    avatar_url,
    created_at,
    updated_at,
    email
) AS
WITH preferred_roles AS (
    SELECT DISTINCT ON (pr.profile_id)
        pr.profile_id,
        r.slug AS preferred_slug
    FROM public.profile_roles AS pr
    INNER JOIN public.roles AS r
        ON pr.role_id = r.id
    ORDER BY
        pr.profile_id,
        CASE
            WHEN r.slug = 'admin' THEN 0
            WHEN r.slug = 'editor' THEN 1
            ELSE 2
        END,
        r.slug
),

profile_data AS (
    SELECT
        p.id,
        p.user_id,
        p.username,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        null::TEXT AS email,
        -- Maintain legacy role column (admin preferred).
        coalesce(preferred_roles.preferred_slug, 'user') AS preferred_role
    FROM public.profiles AS p
    LEFT JOIN preferred_roles
        ON p.id = preferred_roles.profile_id
)

SELECT
    id,
    user_id,
    username,
    preferred_role,
    avatar_url,
    created_at,
    updated_at,
    email
FROM profile_data;

GRANT SELECT ON public.secure_profiles TO authenticated;

-- Refresh handle_new_user trigger to assign default role membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
  default_role_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      email = EXCLUDED.email,
      username = COALESCE(
        EXCLUDED.username,
        public.profiles.username
      )
  RETURNING id INTO new_profile_id;

  IF new_profile_id IS NULL THEN
    SELECT id INTO new_profile_id
    FROM public.profiles
    WHERE user_id = NEW.id;
  END IF;

  SELECT id INTO default_role_id
  FROM public.roles
  WHERE slug = 'user'
  LIMIT 1;

  IF default_role_id IS NOT NULL AND new_profile_id IS NOT NULL THEN
    INSERT INTO public.profile_roles (profile_id, role_id)
    VALUES (new_profile_id, default_role_id)
    ON CONFLICT (profile_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop legacy policies that referenced profiles.role before removing the column
DO $drop_policies$
DECLARE
    policy_name TEXT;
    qualified_table TEXT;
BEGIN
    FOR policy_name, qualified_table IN
        SELECT policy_name, qualified_table
        FROM (
            VALUES
                ('Admins can view all subscriptions', 'public.newsletter_subscriptions'),
                ('Admins can view security events', 'public.security_events'),
                ('Admin/Editor write cms-assets', 'storage.objects'),
                ('Admin/Editor modify cms-assets', 'storage.objects'),
                ('Admin/Editor delete cms-assets', 'storage.objects')
        ) AS policies(policy_name, qualified_table)
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %s',
            policy_name,
            qualified_table
        );
    END LOOP;
END;
$drop_policies$;

-- Remove deprecated role column now that assignments use profile_roles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Refresh helper for admin/editor access
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.has_any_role(auth.uid(), ARRAY['admin','editor']);
$$;

-- Update newsletter subscription policy to use new helper
CREATE POLICY admin_can_view_all_subscriptions
ON public.newsletter_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update security events policy
CREATE POLICY admin_can_view_security_events
ON public.security_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Refresh storage policies related to CMS assets
CREATE POLICY admin_editor_write_cms_assets
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'cms-assets'
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'editor'])
);

CREATE POLICY admin_editor_modify_cms_assets
ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'cms-assets'
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'editor'])
)
WITH CHECK (
    bucket_id = 'cms-assets'
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'editor'])
);

CREATE POLICY admin_editor_delete_cms_assets
ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'cms-assets'
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'editor'])
);

COMMIT;
