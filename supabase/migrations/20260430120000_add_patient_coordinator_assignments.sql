-- Add patient-level coordinator assignment with current-state fields and history.
BEGIN;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS coordinator_id uuid,
ADD COLUMN IF NOT EXISTS coordinator_assigned_at timestamptz,
ADD COLUMN IF NOT EXISTS coordinator_assigned_by uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patients_coordinator_id_fkey'
          AND conrelid = 'public.patients'::regclass
    ) THEN
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_coordinator_id_fkey
        FOREIGN KEY (coordinator_id)
        REFERENCES public.profiles (id)
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patients_coordinator_assigned_by_fkey'
          AND conrelid = 'public.patients'::regclass
    ) THEN
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_coordinator_assigned_by_fkey
        FOREIGN KEY (coordinator_assigned_by)
        REFERENCES public.profiles (id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_patients_coordinator_status_created_at
ON public.patients (
    coordinator_id,
    status,
    created_at DESC
);

CREATE TABLE IF NOT EXISTS public.patient_coordinator_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    coordinator_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    assigned_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    ended_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT patient_coordinator_assignments_time_check CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

ALTER TABLE public.patient_coordinator_assignments
ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_coordinator_assignments_one_active
ON public.patient_coordinator_assignments (patient_id)
WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_patient_coordinator_assignments_patient_time
ON public.patient_coordinator_assignments (patient_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_coordinator_assignments_coordinator_active
ON public.patient_coordinator_assignments (coordinator_profile_id, ended_at);

DROP POLICY IF EXISTS service_role_manages_patient_coordinator_assignments
ON public.patient_coordinator_assignments;
CREATE POLICY service_role_manages_patient_coordinator_assignments
ON public.patient_coordinator_assignments
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

DROP POLICY IF EXISTS staff_users_view_patient_coordinator_assignments
ON public.patient_coordinator_assignments;
CREATE POLICY staff_users_view_patient_coordinator_assignments
ON public.patient_coordinator_assignments
FOR SELECT
TO authenticated
USING (
    public.has_permission((SELECT auth.uid()), 'operations.patients')
);

CREATE OR REPLACE FUNCTION public.assign_patient_coordinator(
    p_patient_id uuid,
    p_coordinator_profile_id uuid,
    p_actor_profile_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS public.patients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_patient public.patients%ROWTYPE;
    updated_patient public.patients%ROWTYPE;
    assigned_timestamp timestamptz := now();
BEGIN
    SELECT *
    INTO current_patient
    FROM public.patients
    WHERE id = p_patient_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF current_patient.coordinator_id IS NOT DISTINCT FROM p_coordinator_profile_id THEN
        RETURN current_patient;
    END IF;

    UPDATE public.patient_coordinator_assignments
    SET
        ended_at = assigned_timestamp,
        ended_by_profile_id = p_actor_profile_id
    WHERE patient_id = p_patient_id
      AND ended_at IS NULL;

    IF p_coordinator_profile_id IS NOT NULL THEN
        INSERT INTO public.patient_coordinator_assignments (
            patient_id,
            coordinator_profile_id,
            assigned_by_profile_id,
            assigned_at,
            reason
        )
        VALUES (
            p_patient_id,
            p_coordinator_profile_id,
            p_actor_profile_id,
            assigned_timestamp,
            NULLIF(btrim(p_reason), '')
        );
    END IF;

    UPDATE public.patients
    SET
        coordinator_id = p_coordinator_profile_id,
        coordinator_assigned_at = CASE
            WHEN p_coordinator_profile_id IS NULL THEN NULL
            ELSE assigned_timestamp
        END,
        coordinator_assigned_by = CASE
            WHEN p_coordinator_profile_id IS NULL THEN NULL
            ELSE p_actor_profile_id
        END
    WHERE id = p_patient_id
    RETURNING *
    INTO updated_patient;

    RETURN updated_patient;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_patient_coordinator(uuid, uuid, uuid, text)
FROM public;
GRANT EXECUTE ON FUNCTION public.assign_patient_coordinator(uuid, uuid, uuid, text)
TO service_role;

COMMENT ON COLUMN public.patients.coordinator_id IS
'Current coordinator responsible for the patient lifecycle.';

COMMENT ON COLUMN public.patients.coordinator_assigned_at IS
'Timestamp when the current patient coordinator was assigned.';

COMMENT ON COLUMN public.patients.coordinator_assigned_by IS
'Profile that assigned the current patient coordinator.';

COMMENT ON TABLE public.patient_coordinator_assignments IS
'History of patient coordinator assignments. At most one row per patient may be active.';

INSERT INTO public.permissions (slug, name, description)
VALUES (
    'operations.patients.assign',
    'Assign Patient Coordinators',
    'Allows team members to assign or clear patient coordinators.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH target_permission AS (
    SELECT id AS permission_id
    FROM public.permissions
    WHERE slug = 'operations.patients.assign'
),

target_roles AS (
    SELECT id AS role_id
    FROM public.roles
    WHERE slug IN ('admin', 'coordinator', 'management', 'employee')
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    target_roles.role_id,
    target_permission.permission_id
FROM target_roles
CROSS JOIN target_permission
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
