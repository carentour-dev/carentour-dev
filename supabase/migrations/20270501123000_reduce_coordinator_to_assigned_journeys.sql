-- Reduce the plain coordinator role to assigned-only patient journey execution.
-- Existing broad-access staff should already have account_manager from the
-- prior migration before this file is applied.
BEGIN;

WITH coordinator_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'coordinator'
),

restricted_permissions AS (
    SELECT id
    FROM public.permissions
    WHERE slug IN (
        'operations.requests',
        'operations.start_journey',
        'operations.consultations',
        'operations.appointments',
        'operations.patients',
        'operations.testimonials',
        'operations.leads',
        'operations.quotation_calculator',
        'operations.patients.assign',
        'operations.patients.confirm',
        'operations.patient_journeys.manage'
    )
)

DELETE FROM public.role_permissions AS rp
USING coordinator_role, restricted_permissions
WHERE
    rp.role_id = coordinator_role.id
    AND rp.permission_id = restricted_permissions.id;

WITH coordinator_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'coordinator'
),

assigned_only_permissions AS (
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
    assigned_only_permissions.id AS permission_id
FROM coordinator_role
CROSS JOIN assigned_only_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
