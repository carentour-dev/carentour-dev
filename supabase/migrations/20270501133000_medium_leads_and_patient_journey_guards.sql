-- Follow-up medium-severity hardening for Leads and Patient Journeys.
-- Safe to run after the already-applied base migrations.
BEGIN;

ALTER TABLE public.webhook_deliveries
ADD COLUMN IF NOT EXISTS delivery_key text;

CREATE UNIQUE INDEX IF NOT EXISTS webhook_deliveries_delivery_key_idx
ON public.webhook_deliveries (delivery_key)
WHERE delivery_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_contact_request_id_idx
ON public.lead_inquiries (contact_request_id)
WHERE contact_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_start_journey_submission_id_idx
ON public.lead_inquiries (start_journey_submission_id)
WHERE start_journey_submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_patient_id_idx
ON public.lead_inquiries (patient_id)
WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_duplicate_of_lead_id_idx
ON public.lead_inquiries (duplicate_of_lead_id)
WHERE duplicate_of_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_created_at_idx
ON public.lead_inquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS lead_inquiries_urgency_status_created_idx
ON public.lead_inquiries (urgency_tier, status, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_inquiries_assigned_created_idx
ON public.lead_inquiries (assigned_to, created_at DESC)
WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS communication_events_patient_occurred_idx
ON public.communication_events (patient_id, occurred_at DESC)
WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketing_consents_patient_channel_idx
ON public.marketing_consents (patient_id, channel)
WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketing_consents_lead_captured_idx
ON public.marketing_consents (lead_id, captured_at DESC)
WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS automation_runs_pending_review_idx
ON public.automation_runs (created_at DESC)
WHERE review_state = 'pending';

CREATE OR REPLACE FUNCTION public.prevent_patient_journey_source_relink()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.journey_id IS DISTINCT FROM NEW.journey_id THEN
        RAISE EXCEPTION 'Patient journey source cannot be relinked'
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
        WHERE tgname = 'patient_journey_sources_prevent_relink'
          AND tgrelid = 'public.patient_journey_sources'::regclass
    ) THEN
        CREATE TRIGGER patient_journey_sources_prevent_relink
        BEFORE UPDATE ON public.patient_journey_sources
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_patient_journey_source_relink();
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_patient_journey_step_guarded(
    p_journey_id uuid,
    p_title text,
    p_description text,
    p_actor_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    journey_record public.patient_journeys%ROWTYPE;
    next_position integer;
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

    IF journey_record.status <> 'active' THEN
        RAISE EXCEPTION 'Cannot add steps to a terminal patient journey'
            USING ERRCODE = '25006';
    END IF;

    PERFORM 1
    FROM public.patient_journey_steps
    WHERE journey_id = p_journey_id
    FOR UPDATE;

    SELECT COALESCE(MAX(position), 0) + 1
    INTO next_position
    FROM public.patient_journey_steps
    WHERE journey_id = p_journey_id;

    INSERT INTO public.patient_journey_steps (
        journey_id,
        position,
        title,
        description,
        created_by_profile_id,
        updated_by_profile_id
    )
    VALUES (
        p_journey_id,
        next_position,
        btrim(p_title),
        NULLIF(btrim(COALESCE(p_description, '')), ''),
        p_actor_profile_id,
        p_actor_profile_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_patient_journey_step_guarded(uuid, text, text, uuid)
FROM public;
GRANT EXECUTE ON FUNCTION public.create_patient_journey_step_guarded(uuid, text, text, uuid)
TO service_role;

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

    IF journey_record.status <> 'active' THEN
        RAISE EXCEPTION 'Cannot update steps on a terminal patient journey'
            USING ERRCODE = '25006';
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
    journey_record public.patient_journeys%ROWTYPE;
    step_count integer;
    ordered_count integer;
    distinct_ordered_count integer;
    max_position integer;
    temporary_base integer;
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

    IF journey_record.status <> 'active' THEN
        RAISE EXCEPTION 'Cannot reorder steps on a terminal patient journey'
            USING ERRCODE = '25006';
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
