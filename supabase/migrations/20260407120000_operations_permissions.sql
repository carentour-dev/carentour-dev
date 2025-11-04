-- Operations dashboard permission set
BEGIN;

-- Seed operations permission catalog entries
INSERT INTO public.permissions (slug, name, description)
VALUES
(
    'operations.access',
    'Operations Dashboard Access',
    'Allows access to the staff-facing Operations dashboard.'
),
(
    'operations.shared',
    'Operations Shared Data',
    'Allows access to shared datasets, including patients and doctors.'
),
(
    'operations.requests',
    'Operations Requests Module',
    'Allows reviewing and updating inbound patient requests.'
),
(
    'operations.start_journey',
    'Operations Start Journey Module',
    'Allows managing Start Journey submissions.'
),
(
    'operations.consultations',
    'Operations Consultations Module',
    'Allows scheduling and updating patient consultations.'
),
(
    'operations.appointments',
    'Operations Appointments Module',
    'Allows managing patient appointment timelines.'
),
(
    'operations.patients',
    'Operations Patients Module',
    'Allows managing patient records and portal access.'
),
(
    'operations.testimonials',
    'Operations Testimonials Module',
    'Allows managing patient testimonials and success stories.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

-- Map operations permissions to default roles
WITH operations_permissions AS (
    SELECT
        id,
        slug
    FROM public.permissions
    WHERE slug IN (
        'operations.access',
        'operations.shared',
        'operations.requests',
        'operations.start_journey',
        'operations.consultations',
        'operations.appointments',
        'operations.patients',
        'operations.testimonials'
    )
),

target_roles AS (
    SELECT
        id,
        slug
    FROM public.roles
    WHERE slug IN ('admin', 'coordinator')
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    r.id AS role_id,
    p.id AS permission_id
FROM target_roles AS r
INNER JOIN operations_permissions AS p ON TRUE
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
