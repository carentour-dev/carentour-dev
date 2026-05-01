-- Enforce the final assigned-only permission allowlist for plain coordinators.
-- Broad-access staff keep their access through account_manager, not coordinator.
BEGIN;

WITH coordinator_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'coordinator'
),

allowed_permissions AS (
    SELECT id
    FROM public.permissions
    WHERE slug IN (
        'operations.access',
        'operations.shared',
        'operations.patient_journeys.read',
        'operations.patient_journey_steps.update_assigned'
    )
)

DELETE FROM public.role_permissions AS rp
USING coordinator_role
WHERE
    rp.role_id = coordinator_role.id
    AND NOT EXISTS (
        SELECT 1
        FROM allowed_permissions
        WHERE allowed_permissions.id = rp.permission_id
    );

WITH coordinator_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'coordinator'
),

allowed_permissions AS (
    SELECT id
    FROM public.permissions
    WHERE slug IN (
        'operations.access',
        'operations.shared',
        'operations.patient_journeys.read',
        'operations.patient_journey_steps.update_assigned'
    )
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    coordinator_role.id AS role_id,
    allowed_permissions.id AS permission_id
FROM coordinator_role
CROSS JOIN allowed_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
