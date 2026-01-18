-- Operations Quotation Calculator permission
BEGIN;

INSERT INTO public.permissions (slug, name, description)
VALUES (
    'operations.quotation_calculator',
    'Operations Quotation Calculator',
    'Allows building and saving quotations in the Operations dashboard.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH target_roles AS (
    SELECT id
    FROM public.roles
    WHERE slug IN ('admin', 'coordinator')
),

target_permission AS (
    SELECT id
    FROM public.permissions
    WHERE slug = 'operations.quotation_calculator'
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    r.id AS role_id,
    p.id AS permission_id
FROM target_roles AS r
CROSS JOIN target_permission AS p
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
