BEGIN;

CREATE OR REPLACE FUNCTION public.create_operations_pricing_import_preview(
    p_provider_id UUID,
    p_create_missing BOOLEAN,
    p_can_apply BOOLEAN,
    p_blocking_count INTEGER,
    p_preview_payload JSONB,
    p_summary JSONB,
    p_items JSONB DEFAULT '[]'::JSONB,
    p_created_by_user_id UUID DEFAULT NULL,
    p_created_by_profile_id UUID DEFAULT NULL,
    p_event_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_run_id UUID;
    v_items JSONB := COALESCE(p_items, '[]'::JSONB);
BEGIN
    IF jsonb_typeof(v_items) <> 'array' THEN
        RAISE EXCEPTION 'p_items must be a JSON array';
    END IF;

    IF NOT COALESCE(p_can_apply, false) THEN
        RETURN gen_random_uuid();
    END IF;

    DELETE FROM public.operations_pricing_import_runs
    WHERE provider_id = p_provider_id
        AND status IN ('preview', 'failed');

    INSERT INTO public.operations_pricing_import_runs (
        provider_id,
        create_missing,
        status,
        blocking_count,
        can_apply,
        preview_payload,
        summary,
        created_by_user_id,
        created_by_profile_id
    )
    VALUES (
        p_provider_id,
        COALESCE(p_create_missing, false),
        'preview',
        GREATEST(0, COALESCE(p_blocking_count, 0)),
        true,
        COALESCE(p_preview_payload, '{}'::JSONB),
        COALESCE(p_summary, '{}'::JSONB),
        p_created_by_user_id,
        p_created_by_profile_id
    )
    RETURNING id INTO v_run_id;

    IF jsonb_array_length(v_items) > 0 THEN
        INSERT INTO public.operations_pricing_import_items (
            run_id,
            item_key,
            row_numbers,
            status,
            reason,
            procedure_id,
            procedure_name,
            treatment_id,
            treatment_name,
            specialty,
            will_create_treatment,
            will_create_procedure,
            component_count,
            total_cost_egp,
            payload
        )
        SELECT
            v_run_id,
            item.item_key,
            COALESCE(item.row_numbers, '{}'::INTEGER[]),
            item.status,
            item.reason,
            item.procedure_id,
            item.procedure_name,
            item.treatment_id,
            item.treatment_name,
            item.specialty,
            COALESCE(item.will_create_treatment, false),
            COALESCE(item.will_create_procedure, false),
            GREATEST(0, COALESCE(item.component_count, 0)),
            GREATEST(0::NUMERIC, COALESCE(item.total_cost_egp, 0::NUMERIC)),
            item.payload
        FROM jsonb_to_recordset(v_items) AS item(
            item_key TEXT,
            row_numbers INTEGER[],
            status TEXT,
            reason TEXT,
            procedure_id UUID,
            procedure_name TEXT,
            treatment_id UUID,
            treatment_name TEXT,
            specialty TEXT,
            will_create_treatment BOOLEAN,
            will_create_procedure BOOLEAN,
            component_count INTEGER,
            total_cost_egp NUMERIC(12, 2),
            payload JSONB
        );
    END IF;

    INSERT INTO public.operations_pricing_import_events (
        run_id,
        event_type,
        payload
    )
    VALUES (
        v_run_id,
        'preview',
        COALESCE(p_event_payload, '{}'::JSONB)
    );

    RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_operations_pricing_import_preview(
    UUID,
    BOOLEAN,
    BOOLEAN,
    INTEGER,
    JSONB,
    JSONB,
    JSONB,
    UUID,
    UUID,
    JSONB
) FROM public;

GRANT EXECUTE ON FUNCTION public.create_operations_pricing_import_preview(
    UUID,
    BOOLEAN,
    BOOLEAN,
    INTEGER,
    JSONB,
    JSONB,
    JSONB,
    UUID,
    UUID,
    JSONB
) TO service_role;

CREATE OR REPLACE FUNCTION
public.cleanup_failed_operations_pricing_import_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_provider_id UUID;
    v_created_procedure_ids UUID[] := '{}'::UUID[];
    v_created_treatment_ids UUID[] := '{}'::UUID[];
BEGIN
    IF NEW.event_type <> 'failed' THEN
        RETURN NEW;
    END IF;

    SELECT provider_id
    INTO v_provider_id
    FROM public.operations_pricing_import_runs
    WHERE id = NEW.run_id;

    IF v_provider_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(array_agg(DISTINCT i.procedure_id), '{}'::UUID[])
    INTO v_created_procedure_ids
    FROM public.operations_pricing_import_items AS i
    WHERE i.run_id = NEW.run_id
        AND i.status = 'applied'
        AND i.will_create_procedure = true
        AND i.procedure_id IS NOT NULL;

    IF array_length(v_created_procedure_ids, 1) IS NOT NULL THEN
        SELECT COALESCE(array_agg(DISTINCT p.treatment_id), '{}'::UUID[])
        INTO v_created_treatment_ids
        FROM public.treatment_procedures AS p
        WHERE p.id = ANY(v_created_procedure_ids)
            AND p.created_by_provider_id = v_provider_id;

        DELETE FROM public.treatment_procedures AS p
        WHERE p.id = ANY(v_created_procedure_ids)
            AND p.created_by_provider_id = v_provider_id;

        UPDATE public.service_providers
        SET procedure_ids = (
            SELECT COALESCE(array_agg(proc_id), '{}'::UUID[])
            FROM unnest(COALESCE(procedure_ids, '{}'::UUID[])) AS proc_id
            WHERE proc_id <> ALL(v_created_procedure_ids)
        )
        WHERE id = v_provider_id;

        IF array_length(v_created_treatment_ids, 1) IS NOT NULL THEN
            DELETE FROM public.treatments AS t
            WHERE t.id = ANY(v_created_treatment_ids)
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.treatment_procedures AS p
                    WHERE p.treatment_id = t.id
                );
        END IF;
    END IF;

    DELETE FROM public.operations_pricing_import_runs
    WHERE id = NEW.run_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS operations_pricing_import_cleanup_failed_run
ON public.operations_pricing_import_events;

CREATE TRIGGER operations_pricing_import_cleanup_failed_run
AFTER INSERT ON public.operations_pricing_import_events
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_failed_operations_pricing_import_event();

COMMIT;
