-- Populate secure_profiles.email from profiles data
BEGIN;

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
        p.email,
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

ALTER VIEW public.secure_profiles SET (security_invoker = true);

COMMIT;
