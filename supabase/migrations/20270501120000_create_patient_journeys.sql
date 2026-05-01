-- Account Manager role and staff-only patient journey plans.
BEGIN;

INSERT INTO public.roles (slug, name, description, is_superuser)
VALUES (
    'account_manager',
    'Account Manager',
    'Owns intake review, patient journey planning, and coordinator assignment.',
    false
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description,
        is_superuser = excluded.is_superuser;

INSERT INTO public.permissions (slug, name, description)
VALUES
(
    'operations.patient_journeys.read',
    'Read Patient Journeys',
    'Allows staff to read patient journey plans they are allowed to access.'
),
(
    'operations.patient_journeys.manage',
    'Manage Patient Journeys',
    'Allows account managers to start, assign, edit, and close patient journey plans.'
),
(
    'operations.patient_journey_steps.update_assigned',
    'Update Assigned Journey Steps',
    'Allows assigned coordinators to update execution status and notes on assigned journey steps.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH coordinator_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'coordinator'
),

account_manager_role AS (
    SELECT id
    FROM public.roles
    WHERE slug = 'account_manager'
),

coordinator_permissions AS (
    SELECT rp.permission_id
    FROM public.role_permissions AS rp
    INNER JOIN coordinator_role AS cr ON rp.role_id = cr.id
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    account_manager_role.id,
    coordinator_permissions.permission_id
FROM account_manager_role
CROSS JOIN coordinator_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

WITH coordinator_profiles AS (
    SELECT
        pr.profile_id,
        pr.assigned_by
    FROM public.profile_roles AS pr
    INNER JOIN public.roles AS r ON pr.role_id = r.id
    WHERE r.slug = 'coordinator'
),

account_manager_role AS (
    SELECT id AS role_id
    FROM public.roles
    WHERE slug = 'account_manager'
)

INSERT INTO public.profile_roles (profile_id, role_id, assigned_by)
SELECT
    coordinator_profiles.profile_id,
    account_manager_role.role_id,
    coordinator_profiles.assigned_by
FROM coordinator_profiles
CROSS JOIN account_manager_role
ON CONFLICT (profile_id, role_id) DO NOTHING;

WITH target_roles AS (
    SELECT
        id,
        slug
    FROM public.roles
    WHERE slug IN ('admin', 'account_manager', 'coordinator')
),

target_permissions AS (
    SELECT
        id,
        slug
    FROM public.permissions
    WHERE slug IN (
        'operations.access',
        'operations.shared',
        'operations.patient_journeys.read',
        'operations.patient_journeys.manage',
        'operations.patient_journey_steps.update_assigned'
    )
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    target_roles.id AS role_id,
    target_permissions.id AS permission_id
FROM target_roles
CROSS JOIN target_permissions
WHERE
    target_roles.slug IN ('admin', 'account_manager')
    OR (
        target_roles.slug = 'coordinator'
        AND target_permissions.slug IN (
            'operations.access',
            'operations.shared',
            'operations.patient_journeys.read',
            'operations.patient_journey_steps.update_assigned'
        )
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Keep the existing coordinator permission set intact in this migration.
-- The coordinator role can be reduced to assigned-only access in a separate,
-- explicit migration after account_manager access has been verified.

CREATE TABLE IF NOT EXISTS public.patient_journeys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    account_manager_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    assigned_coordinator_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active',
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    cancelled_at timestamptz,
    created_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    updated_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT patient_journeys_status_check CHECK (
        status IN ('active', 'completed', 'cancelled')
    ),
    CONSTRAINT patient_journeys_terminal_timestamp_check CHECK (
        (status = 'completed' AND completed_at IS NOT null)
        OR (status = 'cancelled' AND cancelled_at IS NOT null)
        OR (status = 'active' AND completed_at IS null AND cancelled_at IS null)
    )
);

CREATE TABLE IF NOT EXISTS public.patient_journey_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id uuid NOT NULL REFERENCES public.patient_journeys (id) ON DELETE CASCADE,
    position integer NOT NULL, -- noqa: RF04
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'not_started',
    coordinator_notes text,
    completed_at timestamptz,
    created_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    updated_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT patient_journey_steps_status_check CHECK (
        status IN ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled')
    ),
    CONSTRAINT patient_journey_steps_position_positive CHECK (position > 0),
    UNIQUE (journey_id, position)
);

CREATE TABLE IF NOT EXISTS public.patient_journey_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id uuid NOT NULL REFERENCES public.patient_journeys (id) ON DELETE CASCADE,
    source_type text NOT NULL,
    source_id uuid NOT NULL,
    created_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT patient_journey_sources_type_check CHECK (
        source_type IN ('contact_request', 'consultation_request', 'start_journey_submission')
    ),
    UNIQUE (source_type, source_id)
);

ALTER TABLE public.patient_journeys
ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_journey_steps
ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_journey_sources
ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_journeys_one_active
ON public.patient_journeys (patient_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_patient_journeys_assigned_status
ON public.patient_journeys (assigned_coordinator_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_journey_steps_journey_position
ON public.patient_journey_steps (journey_id, position);

CREATE INDEX IF NOT EXISTS idx_patient_journey_sources_journey
ON public.patient_journey_sources (journey_id, created_at DESC);

DROP TRIGGER IF EXISTS update_patient_journeys_updated_at
ON public.patient_journeys;
CREATE TRIGGER update_patient_journeys_updated_at
BEFORE UPDATE ON public.patient_journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_journey_steps_updated_at
ON public.patient_journey_steps;
CREATE TRIGGER update_patient_journey_steps_updated_at
BEFORE UPDATE ON public.patient_journey_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS service_role_manages_patient_journeys
ON public.patient_journeys;
CREATE POLICY service_role_manages_patient_journeys
ON public.patient_journeys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manages_patient_journey_steps
ON public.patient_journey_steps;
CREATE POLICY service_role_manages_patient_journey_steps
ON public.patient_journey_steps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manages_patient_journey_sources
ON public.patient_journey_sources;
CREATE POLICY service_role_manages_patient_journey_sources
ON public.patient_journey_sources
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS staff_view_patient_journeys
ON public.patient_journeys;
CREATE POLICY staff_view_patient_journeys
ON public.patient_journeys
FOR SELECT
TO authenticated
USING (
    public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.manage')
    OR (
        public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.read')
        AND assigned_coordinator_profile_id = (
            SELECT p.id
            FROM public.profiles AS p
            WHERE p.user_id = (SELECT auth.uid())
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS staff_view_patient_journey_steps
ON public.patient_journey_steps;
CREATE POLICY staff_view_patient_journey_steps
ON public.patient_journey_steps
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patient_journeys AS pj
        WHERE
            pj.id = patient_journey_steps.journey_id
            AND (
                public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.manage')
                OR (
                    public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.read')
                    AND pj.assigned_coordinator_profile_id = (
                        SELECT p.id
                        FROM public.profiles AS p
                        WHERE p.user_id = (SELECT auth.uid())
                        ORDER BY p.created_at DESC, p.id DESC
                        LIMIT 1
                    )
                )
            )
    )
);

DROP POLICY IF EXISTS staff_view_patient_journey_sources
ON public.patient_journey_sources;
CREATE POLICY staff_view_patient_journey_sources
ON public.patient_journey_sources
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patient_journeys AS pj
        WHERE
            pj.id = patient_journey_sources.journey_id
            AND (
                public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.manage')
                OR (
                    public.has_permission((SELECT auth.uid()), 'operations.patient_journeys.read')
                    AND pj.assigned_coordinator_profile_id = (
                        SELECT p.id
                        FROM public.profiles AS p
                        WHERE p.user_id = (SELECT auth.uid())
                        ORDER BY p.created_at DESC, p.id DESC
                        LIMIT 1
                    )
                )
            )
    )
);

CREATE OR REPLACE FUNCTION public.start_patient_journey_from_source(
    p_source_type text,
    p_source_id uuid,
    p_patient_id uuid DEFAULT null,
    p_coordinator_profile_id uuid DEFAULT null,
    p_actor_profile_id uuid DEFAULT null
)
RETURNS public.patient_journeys
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    source_record record;
    journey_record public.patient_journeys%ROWTYPE;
    v_patient_id uuid;
    v_coordinator_id uuid;
    v_created_journey boolean := false;
    v_now timestamptz := now();
    v_full_name text;
    v_notes text;
BEGIN
    IF p_source_type NOT IN ('contact_request', 'consultation_request', 'start_journey_submission') THEN
        RAISE EXCEPTION 'Unsupported journey source type: %', p_source_type
            USING ERRCODE = '22023';
    END IF;

    IF p_source_type IN ('contact_request', 'consultation_request') THEN
        SELECT
            id,
            patient_id,
            assigned_to,
            first_name,
            last_name,
            email,
            phone,
            country,
            treatment,
            health_background,
            message,
            request_type
        INTO source_record
        FROM public.contact_requests
        WHERE id = p_source_id
        FOR UPDATE;
    ELSE
        SELECT
            id,
            patient_id,
            assigned_to,
            first_name,
            last_name,
            email,
            phone,
            country,
            treatment_name AS treatment,
            medical_condition AS health_background,
            NULL::text AS message,
            'start_journey'::text AS request_type
        INTO source_record
        FROM public.start_journey_submissions
        WHERE id = p_source_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journey source not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF p_source_type = 'consultation_request'
       AND COALESCE(source_record.request_type, '') <> 'consultation' THEN
        RAISE EXCEPTION 'Source is not a consultation request'
            USING ERRCODE = '22023';
    END IF;

    v_patient_id := COALESCE(p_patient_id, source_record.patient_id);
    v_coordinator_id := COALESCE(p_coordinator_profile_id, source_record.assigned_to);

    IF v_patient_id IS NULL AND NULLIF(btrim(source_record.email), '') IS NOT NULL THEN
        SELECT id
        INTO v_patient_id
        FROM public.patients
        WHERE lower(contact_email) = lower(btrim(source_record.email))
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF v_patient_id IS NULL THEN
        v_full_name := NULLIF(
            btrim(CONCAT_WS(' ', source_record.first_name, source_record.last_name)),
            ''
        );
        v_notes := NULLIF(
            btrim(CONCAT_WS(E'\n\n', source_record.treatment, source_record.health_background, source_record.message)),
            ''
        );

        INSERT INTO public.patients (
            full_name,
            contact_email,
            contact_phone,
            nationality,
            notes,
            status,
            source,
            created_channel,
            created_by_profile_id,
            coordinator_id,
            coordinator_assigned_at,
            coordinator_assigned_by
        )
        VALUES (
            COALESCE(v_full_name, 'Unnamed patient'),
            NULLIF(btrim(source_record.email), ''),
            NULLIF(btrim(source_record.phone), ''),
            NULLIF(btrim(source_record.country), ''),
            v_notes,
            'potential',
            'staff',
            'operations_dashboard',
            p_actor_profile_id,
            v_coordinator_id,
            CASE WHEN v_coordinator_id IS NULL THEN NULL ELSE v_now END,
            CASE WHEN v_coordinator_id IS NULL THEN NULL ELSE p_actor_profile_id END
        )
        RETURNING id INTO v_patient_id;

        IF v_coordinator_id IS NOT NULL THEN
            INSERT INTO public.patient_coordinator_assignments (
                patient_id,
                coordinator_profile_id,
                assigned_by_profile_id,
                assigned_at,
                reason
            )
            VALUES (
                v_patient_id,
                v_coordinator_id,
                p_actor_profile_id,
                v_now,
                'Journey started from intake'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    ELSIF v_coordinator_id IS NOT NULL THEN
        PERFORM public.assign_patient_coordinator(
            v_patient_id,
            v_coordinator_id,
            p_actor_profile_id,
            'Journey started from intake'
        );
    END IF;

    SELECT *
    INTO journey_record
    FROM public.patient_journeys
    WHERE patient_id = v_patient_id
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.patient_journeys (
            patient_id,
            account_manager_profile_id,
            assigned_coordinator_profile_id,
            status,
            started_at,
            created_by_profile_id,
            updated_by_profile_id
        )
        VALUES (
            v_patient_id,
            p_actor_profile_id,
            v_coordinator_id,
            'active',
            v_now,
            p_actor_profile_id,
            p_actor_profile_id
        )
        RETURNING *
        INTO journey_record;

        v_created_journey := true;

        INSERT INTO public.patient_journey_steps (
            journey_id,
            position,
            title,
            description,
            created_by_profile_id,
            updated_by_profile_id
        )
        VALUES
        (
            journey_record.id,
            1,
            'Intake review and case validation',
            'Confirm patient details, treatment goals, medical history, uploaded documents, and urgency.',
            p_actor_profile_id,
            p_actor_profile_id
        ),
        (
            journey_record.id,
            2,
            'Medical records and doctor matching',
            'Collect missing records, prepare the case summary, and match the patient with suitable doctors or facilities.',
            p_actor_profile_id,
            p_actor_profile_id
        ),
        (
            journey_record.id,
            3,
            'Consultation and treatment plan',
            'Coordinate consultation scheduling, capture doctor recommendations, and assemble the proposed treatment plan.',
            p_actor_profile_id,
            p_actor_profile_id
        ),
        (
            journey_record.id,
            4,
            'Quotation, travel, and accommodation',
            'Prepare pricing, travel windows, accommodation preferences, companion needs, and payment next steps.',
            p_actor_profile_id,
            p_actor_profile_id
        ),
        (
            journey_record.id,
            5,
            'Arrival, treatment, and follow-up',
            'Track arrival logistics, appointments, post-treatment follow-up, and patient satisfaction handoff.',
            p_actor_profile_id,
            p_actor_profile_id
        );
    ELSE
        UPDATE public.patient_journeys
        SET
            account_manager_profile_id = COALESCE(account_manager_profile_id, p_actor_profile_id),
            assigned_coordinator_profile_id = COALESCE(v_coordinator_id, assigned_coordinator_profile_id),
            updated_by_profile_id = p_actor_profile_id
        WHERE id = journey_record.id
        RETURNING *
        INTO journey_record;
    END IF;

    INSERT INTO public.patient_journey_sources (
        journey_id,
        source_type,
        source_id,
        created_by_profile_id
    )
    VALUES (
        journey_record.id,
        p_source_type,
        p_source_id,
        p_actor_profile_id
    )
    ON CONFLICT (source_type, source_id) DO UPDATE
        SET journey_id = excluded.journey_id;

    IF p_source_type IN ('contact_request', 'consultation_request') THEN
        UPDATE public.contact_requests
        SET
            patient_id = v_patient_id,
            assigned_to = COALESCE(v_coordinator_id, assigned_to),
            status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END
        WHERE id = p_source_id;
    ELSE
        UPDATE public.start_journey_submissions
        SET
            patient_id = v_patient_id,
            assigned_to = COALESCE(v_coordinator_id, assigned_to),
            status = CASE WHEN status = 'new' THEN 'reviewing' ELSE status END
        WHERE id = p_source_id;
    END IF;

    RETURN journey_record;
END;
$$;

REVOKE ALL ON FUNCTION public.start_patient_journey_from_source(text, uuid, uuid, uuid, uuid)
FROM public;
GRANT EXECUTE ON FUNCTION public.start_patient_journey_from_source(text, uuid, uuid, uuid, uuid)
TO service_role;

COMMENT ON TABLE public.patient_journeys IS
'Staff-only patient journey plans owned by account managers and executed by assigned coordinators.';

COMMENT ON TABLE public.patient_journey_steps IS
'Ordered execution steps for a generated patient journey plan.';

COMMENT ON TABLE public.patient_journey_sources IS
'Intake source links for patient journeys. A journey can have multiple source records.';

COMMIT;
