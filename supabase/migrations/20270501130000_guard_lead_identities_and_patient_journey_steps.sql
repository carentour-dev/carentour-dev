-- Follow-up for already-applied Leads and Patient Journeys migrations.
-- Adds immutable external identity ownership plus guarded patient journey step RPCs.
BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_external_identity_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.entity_type IS DISTINCT FROM NEW.entity_type
       OR OLD.entity_id IS DISTINCT FROM NEW.entity_id THEN
        RAISE EXCEPTION 'External identity owner cannot be changed'
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'external_identities_prevent_owner_change'
          AND tgrelid = 'public.external_identities'::regclass
    ) THEN
        CREATE TRIGGER external_identities_prevent_owner_change
        BEFORE UPDATE ON public.external_identities
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_external_identity_owner_change();
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_patient_journey_step_guarded(
    p_journey_id uuid,
    p_step_id uuid,
    p_actor_profile_id uuid,
    p_is_manager boolean,
    p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    journey_record public.patient_journeys%ROWTYPE;
    disallowed_key text;
    next_status text;
BEGIN
    SELECT *
    INTO journey_record
    FROM public.patient_journeys
    WHERE id = p_journey_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient journey not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF NOT p_is_manager THEN
        IF p_actor_profile_id IS NULL
           OR journey_record.assigned_coordinator_profile_id IS DISTINCT FROM p_actor_profile_id THEN
            RAISE EXCEPTION 'Patient journey access denied'
                USING ERRCODE = '42501';
        END IF;

        SELECT key
        INTO disallowed_key
        FROM jsonb_object_keys(COALESCE(p_patch, '{}'::jsonb)) AS key
        WHERE key NOT IN (
            'status',
            'coordinator_notes',
            'updated_by_profile_id'
        )
        LIMIT 1;

        IF disallowed_key IS NOT NULL THEN
            RAISE EXCEPTION 'Coordinators can update only step status and coordinator notes'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.patient_journey_steps
        WHERE id = p_step_id
          AND journey_id = p_journey_id
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Patient journey step not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF p_patch ? 'status' THEN
        next_status := p_patch ->> 'status';
        IF next_status NOT IN (
            'not_started',
            'in_progress',
            'blocked',
            'completed',
            'cancelled'
        ) THEN
            RAISE EXCEPTION 'Invalid patient journey step status: %', next_status
                USING ERRCODE = '22023';
        END IF;
    END IF;

    UPDATE public.patient_journey_steps
    SET
        title = CASE
            WHEN p_is_manager AND p_patch ? 'title'
                THEN btrim(p_patch ->> 'title')
            ELSE title
        END,
        description = CASE
            WHEN p_is_manager AND p_patch ? 'description'
                THEN NULLIF(btrim(p_patch ->> 'description'), '')
            ELSE description
        END,
        position = CASE
            WHEN p_is_manager AND p_patch ? 'position'
                THEN (p_patch ->> 'position')::integer
            ELSE position
        END,
        status = CASE
            WHEN p_patch ? 'status'
                THEN next_status
            ELSE status
        END,
        completed_at = CASE
            WHEN p_patch ? 'status' AND next_status = 'completed'
                THEN now()
            WHEN p_patch ? 'status'
                THEN NULL
            ELSE completed_at
        END,
        coordinator_notes = CASE
            WHEN p_patch ? 'coordinator_notes'
                THEN NULLIF(btrim(p_patch ->> 'coordinator_notes'), '')
            ELSE coordinator_notes
        END,
        updated_by_profile_id = p_actor_profile_id
    WHERE id = p_step_id
      AND journey_id = p_journey_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_patient_journey_step_guarded(uuid, uuid, uuid, boolean, jsonb)
FROM public;
GRANT EXECUTE ON FUNCTION public.update_patient_journey_step_guarded(uuid, uuid, uuid, boolean, jsonb)
TO service_role;

CREATE OR REPLACE FUNCTION public.reorder_patient_journey_steps_guarded(
    p_journey_id uuid,
    p_ordered_step_ids uuid [],
    p_actor_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    step_count integer;
    ordered_count integer;
    distinct_ordered_count integer;
    max_position integer;
    temporary_base integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.patient_journeys
        WHERE id = p_journey_id
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Patient journey not found'
            USING ERRCODE = 'P0002';
    END IF;

    PERFORM 1
    FROM public.patient_journey_steps
    WHERE journey_id = p_journey_id
    FOR UPDATE;

    SELECT
        COUNT(*),
        COALESCE(MAX(position), 0)
    INTO step_count, max_position
    FROM public.patient_journey_steps
    WHERE journey_id = p_journey_id;

    SELECT
        COUNT(*),
        COUNT(DISTINCT step_id)
    INTO ordered_count, distinct_ordered_count
    FROM unnest(COALESCE(p_ordered_step_ids, ARRAY[]::uuid [])) AS ordered(step_id);

    IF ordered_count <> step_count OR distinct_ordered_count <> ordered_count THEN
        RAISE EXCEPTION 'Step order must include each current journey step exactly once'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p_ordered_step_ids, ARRAY[]::uuid [])) AS ordered(step_id)
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.patient_journey_steps AS pjs
            WHERE pjs.id = step_id
              AND pjs.journey_id = p_journey_id
        )
    ) THEN
        RAISE EXCEPTION 'Step order contains a step from another journey'
            USING ERRCODE = '22023';
    END IF;

    temporary_base := max_position + step_count + 1;

    WITH ordered_steps AS (
        SELECT step_id, ordinal_position
        FROM unnest(p_ordered_step_ids) WITH ORDINALITY AS ordered(step_id, ordinal_position)
    )
    UPDATE public.patient_journey_steps AS pjs
    SET
        position = temporary_base + ordered_steps.ordinal_position::integer,
        updated_by_profile_id = p_actor_profile_id
    FROM ordered_steps
    WHERE pjs.id = ordered_steps.step_id
      AND pjs.journey_id = p_journey_id;

    WITH ordered_steps AS (
        SELECT step_id, ordinal_position
        FROM unnest(p_ordered_step_ids) WITH ORDINALITY AS ordered(step_id, ordinal_position)
    )
    UPDATE public.patient_journey_steps AS pjs
    SET
        position = ordered_steps.ordinal_position::integer,
        updated_by_profile_id = p_actor_profile_id
    FROM ordered_steps
    WHERE pjs.id = ordered_steps.step_id
      AND pjs.journey_id = p_journey_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reorder_patient_journey_steps_guarded(uuid, uuid [], uuid)
FROM public;
GRANT EXECUTE ON FUNCTION public.reorder_patient_journey_steps_guarded(uuid, uuid [], uuid)
TO service_role;

COMMIT;
