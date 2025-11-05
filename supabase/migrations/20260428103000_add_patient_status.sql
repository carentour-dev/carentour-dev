-- Separate potential vs confirmed patients with audit metadata
-- migrate:up
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'patient_status'
          AND pg_type.typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.patient_status AS ENUM (
            'potential',
            'confirmed'
        );
    END IF;
END;
$$;

COMMENT ON TYPE public.patient_status IS
'Lifecycle status for patient records. Extend as new states arise.';

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS status public.patient_status;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS confirmed_by uuid;

UPDATE public.patients
SET status = 'potential'
WHERE status IS NULL;

ALTER TABLE public.patients
ALTER COLUMN status SET DEFAULT 'potential';

ALTER TABLE public.patients
ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.patients
ADD CONSTRAINT patients_confirmed_by_fkey
FOREIGN KEY (confirmed_by)
REFERENCES public.profiles (id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.patients.status IS
'Current lifecycle status; defaults to potential.';

COMMENT ON COLUMN public.patients.confirmed_at IS
'Timestamp when a patient record was last marked as confirmed.';

COMMENT ON COLUMN public.patients.confirmed_by IS
'Profile id that last confirmed the patient record.';

CREATE INDEX IF NOT EXISTS idx_patients_status_created_at
ON public.patients (
    status,
    created_at DESC
);

INSERT INTO public.permissions (slug, name, description)
VALUES (
    'operations.patients.confirm',
    'Confirm Patient Records',
    'Allows team members to confirm or revert patient records.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH target_permission AS (
    SELECT permissions.id AS permission_id
    FROM public.permissions AS permissions
    WHERE permissions.slug = 'operations.patients.confirm'
),

target_roles AS (
    SELECT public_roles.id AS role_id
    FROM public.roles AS public_roles
    WHERE public_roles.slug IN (
        'admin',
        'coordinator',
        'management',
        'employee'
    )
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    target_roles.role_id,
    target_permission.permission_id
FROM target_roles
CROSS JOIN target_permission
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

-- migrate:down
BEGIN;

WITH target_permission AS (
    SELECT permissions.id AS permission_id
    FROM public.permissions AS permissions
    WHERE permissions.slug = 'operations.patients.confirm'
),

target_roles AS (
    SELECT public_roles.id AS role_id
    FROM public.roles AS public_roles
    WHERE public_roles.slug IN (
        'admin',
        'coordinator',
        'management',
        'employee'
    )
)

DELETE FROM public.role_permissions AS rp
USING target_permission, target_roles
WHERE
    rp.permission_id = target_permission.permission_id
    AND rp.role_id = target_roles.role_id;

DELETE FROM public.permissions
WHERE slug = 'operations.patients.confirm';

DROP INDEX IF EXISTS idx_patients_status_created_at;

ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_confirmed_by_fkey,
DROP COLUMN IF EXISTS confirmed_by,
DROP COLUMN IF EXISTS confirmed_at,
DROP COLUMN IF EXISTS status;

DROP TYPE IF EXISTS public.patient_status;

COMMIT;
