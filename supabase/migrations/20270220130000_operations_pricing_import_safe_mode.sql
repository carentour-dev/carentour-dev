BEGIN;

CREATE TABLE IF NOT EXISTS public.operations_pricing_import_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.service_providers (id)
    ON DELETE CASCADE,
    create_missing BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'preview' CHECK (
        status IN ('preview', 'applied', 'failed')
    ),
    blocking_count INTEGER NOT NULL DEFAULT 0,
    can_apply BOOLEAN NOT NULL DEFAULT false,
    preview_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    summary JSONB NOT NULL DEFAULT '{}'::JSONB, -- noqa: RF04
    result JSONB,
    created_by_user_id UUID,
    created_by_profile_id UUID REFERENCES public.profiles (id)
    ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operations_pricing_import_runs
ADD COLUMN IF NOT EXISTS can_apply BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_operations_pricing_import_runs_provider_created
ON public.operations_pricing_import_runs (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operations_pricing_import_runs_status
ON public.operations_pricing_import_runs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.operations_pricing_import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.operations_pricing_import_runs (id)
    ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    row_numbers INTEGER [] NOT NULL DEFAULT '{}'::INTEGER [],
    status TEXT NOT NULL CHECK (
        status IN ('ready', 'blocked', 'applied')
    ),
    reason TEXT,
    procedure_id UUID,
    procedure_name TEXT,
    treatment_id UUID,
    treatment_name TEXT,
    specialty TEXT,
    will_create_treatment BOOLEAN NOT NULL DEFAULT false,
    will_create_procedure BOOLEAN NOT NULL DEFAULT false,
    component_count INTEGER NOT NULL DEFAULT 0,
    total_cost_egp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_operations_pricing_import_items_run_key
ON public.operations_pricing_import_items (run_id, item_key);

CREATE INDEX IF NOT EXISTS idx_operations_pricing_import_items_run_status
ON public.operations_pricing_import_items (run_id, status, created_at ASC);

CREATE TABLE IF NOT EXISTS public.operations_pricing_import_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.operations_pricing_import_runs (id)
    ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operations_pricing_import_events_run
ON public.operations_pricing_import_events (run_id, created_at DESC);

ALTER TABLE public.operations_pricing_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_pricing_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_pricing_import_events ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_pricing_import_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_pricing_import_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_pricing_import_events TO service_role;

DROP POLICY IF EXISTS service_role_manages_operations_pricing_import_runs
ON public.operations_pricing_import_runs;
CREATE POLICY service_role_manages_operations_pricing_import_runs
ON public.operations_pricing_import_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manages_operations_pricing_import_items
ON public.operations_pricing_import_items;
CREATE POLICY service_role_manages_operations_pricing_import_items
ON public.operations_pricing_import_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manages_operations_pricing_import_events
ON public.operations_pricing_import_events;
CREATE POLICY service_role_manages_operations_pricing_import_events
ON public.operations_pricing_import_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS operations_pricing_import_runs_set_updated_at
ON public.operations_pricing_import_runs;
CREATE TRIGGER operations_pricing_import_runs_set_updated_at
BEFORE UPDATE ON public.operations_pricing_import_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_operations_pricing_import(
    p_run_id UUID,
    p_actor_id UUID DEFAULT null,
    p_create_missing BOOLEAN DEFAULT null
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_run public.operations_pricing_import_runs%ROWTYPE;
    v_item public.operations_pricing_import_items%ROWTYPE;
    v_provider_exists UUID;
    v_group JSONB;
    v_components JSONB;
    v_component JSONB;
    v_total NUMERIC(12, 2);
    v_is_active BOOLEAN;
    v_treatment_id UUID;
    v_procedure_id UUID;
    v_created_treatments INTEGER := 0;
    v_created_procedures INTEGER := 0;
    v_upserted_price_lists INTEGER := 0;
    v_result_row_results JSONB := '[]'::JSONB;
    v_result JSONB;
    v_normalized_treatment_name TEXT;
    v_normalized_specialty TEXT;
    v_normalized_procedure_name TEXT;
    v_treatment_match_count INTEGER;
    v_procedure_match_count INTEGER;
    v_display_order INTEGER;
    v_treatment_name TEXT;
    v_specialty TEXT;
    v_procedure_name TEXT;
    v_base_slug TEXT;
    v_slug TEXT;
    v_slug_attempt INTEGER;
    v_amount NUMERIC(12, 2);
    v_item_row_numbers INTEGER [];
    v_effective_create_missing BOOLEAN;
    v_has_ready_items BOOLEAN;
    v_existing_procedure_treatment_id UUID;
BEGIN
    SELECT *
    INTO v_run
    FROM public.operations_pricing_import_runs
    WHERE id = p_run_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Import run % was not found', p_run_id;
    END IF;

    IF v_run.status = 'applied' THEN
        RETURN COALESCE(v_run.result, '{}'::JSONB);
    END IF;

    v_effective_create_missing := COALESCE(p_create_missing, v_run.create_missing);
    IF v_effective_create_missing <> v_run.create_missing THEN
        RAISE EXCEPTION
            'create_missing mismatch for run % (run=% request=%)',
            p_run_id,
            v_run.create_missing,
            v_effective_create_missing;
    END IF;

    IF v_run.blocking_count > 0 OR NOT v_run.can_apply THEN
        RAISE EXCEPTION 'Import run % has blocking rows or is not apply-ready', p_run_id;
    END IF;

    SELECT id
    INTO v_provider_exists
    FROM public.service_providers
    WHERE id = v_run.provider_id;

    IF v_provider_exists IS NULL THEN
        RAISE EXCEPTION 'Service provider % no longer exists', v_run.provider_id;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtext('operations_pricing_import:' || v_run.provider_id::TEXT)
    );

    SELECT EXISTS (
        SELECT 1
        FROM public.operations_pricing_import_items
        WHERE run_id = p_run_id AND status = 'ready'
    )
    INTO v_has_ready_items;

    IF NOT v_has_ready_items THEN
        RAISE EXCEPTION 'Import run % has no ready rows to apply', p_run_id;
    END IF;

    FOR v_item IN
        SELECT *
        FROM public.operations_pricing_import_items
        WHERE run_id = p_run_id AND status = 'ready'
        ORDER BY created_at ASC, id ASC
    LOOP
        v_treatment_id := NULL;
        v_procedure_id := NULL;
        v_total := 0;
        v_item_row_numbers := COALESCE(v_item.row_numbers, '{}'::INTEGER []);
        v_group := COALESCE(v_item.payload, '{}'::JSONB);

        IF jsonb_typeof(v_group) <> 'object' THEN
            RAISE EXCEPTION 'Import run % row % contains malformed payload', p_run_id, v_item.item_key;
        END IF;

        v_components := COALESCE(v_group -> 'components', '[]'::JSONB);
        IF jsonb_typeof(v_components) <> 'array' THEN
            RAISE EXCEPTION 'Import run % row % contains malformed components payload', p_run_id, v_item.item_key;
        END IF;

        v_treatment_name := NULLIF(TRIM(
            COALESCE(v_item.treatment_name, v_group ->> 'treatmentName', '')
        ), '');
        v_specialty := NULLIF(TRIM(
            COALESCE(v_item.specialty, v_group ->> 'specialty', '')
        ), '');
        v_procedure_name := NULLIF(TRIM(
            COALESCE(v_item.procedure_name, v_group ->> 'procedureName', '')
        ), '');
        v_is_active := COALESCE((v_group ->> 'isActive')::BOOLEAN, true);

        IF v_item.treatment_id IS NOT NULL THEN
            v_treatment_id := v_item.treatment_id;
        ELSIF NULLIF(v_group ->> 'resolvedTreatmentId', '') IS NOT NULL THEN
            v_treatment_id := (v_group ->> 'resolvedTreatmentId')::UUID;
        END IF;

        IF v_item.procedure_id IS NOT NULL THEN
            v_procedure_id := v_item.procedure_id;
        ELSIF NULLIF(v_group ->> 'resolvedProcedureId', '') IS NOT NULL THEN
            v_procedure_id := (v_group ->> 'resolvedProcedureId')::UUID;
        END IF;

        FOR v_component IN SELECT value FROM jsonb_array_elements(v_components)
        LOOP
            IF jsonb_typeof(v_component) <> 'object' THEN
                RAISE EXCEPTION 'Import run % row % has invalid component entry', p_run_id, v_item.item_key;
            END IF;

            IF NULLIF(TRIM(COALESCE(v_component ->> 'label', '')), '') IS NULL THEN
                RAISE EXCEPTION 'Import run % row % has an empty component label', p_run_id, v_item.item_key;
            END IF;

            v_amount := COALESCE((v_component ->> 'amountEgp')::NUMERIC, 0);
            IF v_amount < 0 THEN
                RAISE EXCEPTION 'Import run % row % has a negative component amount', p_run_id, v_item.item_key;
            END IF;
            v_total := v_total + v_amount;
        END LOOP;

        IF v_treatment_id IS NOT NULL THEN
            SELECT t.id
            INTO v_treatment_id
            FROM public.treatments AS t
            WHERE t.id = v_treatment_id;

            IF v_treatment_id IS NULL THEN
                RAISE EXCEPTION 'Import run % row % references a treatment that no longer exists',
                    p_run_id, v_item.item_key;
            END IF;
        END IF;

        IF v_procedure_id IS NOT NULL THEN
            SELECT p.treatment_id
            INTO v_existing_procedure_treatment_id
            FROM public.treatment_procedures AS p
            WHERE p.id = v_procedure_id;

            IF v_existing_procedure_treatment_id IS NULL THEN
                RAISE EXCEPTION 'Import run % row % references a procedure that no longer exists',
                    p_run_id, v_item.item_key;
            END IF;

            IF v_treatment_id IS NULL THEN
                v_treatment_id := v_existing_procedure_treatment_id;
            ELSIF v_existing_procedure_treatment_id <> v_treatment_id THEN
                RAISE EXCEPTION 'Import run % row % has procedure/treatment mismatch',
                    p_run_id, v_item.item_key;
            END IF;
        END IF;

        IF v_treatment_id IS NULL THEN
            IF NOT v_effective_create_missing THEN
                RAISE EXCEPTION 'Run % row % requires treatment creation but create_missing is disabled',
                    p_run_id, v_item.item_key;
            END IF;

            IF v_treatment_name IS NULL THEN
                RAISE EXCEPTION 'Run % row % is missing treatment_name for treatment creation',
                    p_run_id, v_item.item_key;
            END IF;

            v_normalized_treatment_name := lower(
                regexp_replace(v_treatment_name, '\s+', ' ', 'g')
            );
            v_normalized_specialty := lower(
                regexp_replace(COALESCE(v_specialty, ''), '\s+', ' ', 'g')
            );

            SELECT COUNT(*), MIN(t.id)
            INTO v_treatment_match_count, v_treatment_id
            FROM public.treatments AS t
            WHERE lower(regexp_replace(trim(t.name), '\s+', ' ', 'g')) =
                v_normalized_treatment_name
                AND lower(
                    regexp_replace(trim(COALESCE(t.category, '')), '\s+', ' ', 'g')
                ) = v_normalized_specialty;

            IF v_treatment_match_count > 1 THEN
                RAISE EXCEPTION 'Ambiguous treatment match for "%" / "%"',
                    COALESCE(v_treatment_name, ''), COALESCE(v_specialty, '');
            END IF;

            IF v_treatment_id IS NULL THEN
                v_base_slug := lower(
                    regexp_replace(COALESCE(v_treatment_name, 'imported-treatment'), '[^a-z0-9]+', '-', 'g')
                );
                v_base_slug := trim(BOTH '-' FROM v_base_slug);

                IF v_base_slug = '' THEN
                    v_base_slug := 'imported-treatment';
                END IF;

                v_slug := v_base_slug;
                v_slug_attempt := 0;

                LOOP
                    INSERT INTO public.treatments (
                        name,
                        slug,
                        category,
                        is_active,
                        is_listed_public
                    )
                    VALUES (
                        v_treatment_name,
                        v_slug,
                        v_specialty,
                        false,
                        false
                    )
                    ON CONFLICT (slug) DO NOTHING
                    RETURNING id INTO v_treatment_id;

                    EXIT WHEN v_treatment_id IS NOT NULL;

                    v_slug_attempt := v_slug_attempt + 1;
                    IF v_slug_attempt > 100 THEN
                        RAISE EXCEPTION 'Failed to generate unique treatment slug for "%"',
                            v_treatment_name;
                    END IF;

                    v_slug := v_base_slug || '-' || v_slug_attempt::TEXT;
                END LOOP;

                v_created_treatments := v_created_treatments + 1;
            END IF;
        END IF;

        IF v_procedure_id IS NULL THEN
            IF NOT v_effective_create_missing THEN
                RAISE EXCEPTION 'Run % row % requires procedure creation but create_missing is disabled',
                    p_run_id, v_item.item_key;
            END IF;

            IF v_procedure_name IS NULL THEN
                RAISE EXCEPTION 'Run % row % is missing procedure_name for procedure creation',
                    p_run_id, v_item.item_key;
            END IF;

            v_normalized_procedure_name := lower(
                regexp_replace(v_procedure_name, '\s+', ' ', 'g')
            );

            SELECT COUNT(*), MIN(p.id)
            INTO v_procedure_match_count, v_procedure_id
            FROM public.treatment_procedures AS p
            WHERE p.treatment_id = v_treatment_id
                AND p.created_by_provider_id = v_run.provider_id
                AND lower(regexp_replace(trim(p.name), '\s+', ' ', 'g')) =
                    v_normalized_procedure_name;

            IF v_procedure_match_count > 1 THEN
                RAISE EXCEPTION 'Ambiguous provider procedure match for "%"',
                    v_procedure_name;
            END IF;

            IF v_procedure_id IS NULL THEN
                SELECT COALESCE(MAX(p.display_order), -1) + 1
                INTO v_display_order
                FROM public.treatment_procedures AS p
                WHERE p.treatment_id = v_treatment_id;

                INSERT INTO public.treatment_procedures (
                    treatment_id,
                    name,
                    display_order,
                    created_by_provider_id,
                    is_public
                )
                VALUES (
                    v_treatment_id,
                    v_procedure_name,
                    v_display_order,
                    v_run.provider_id,
                    false
                )
                RETURNING id INTO v_procedure_id;

                v_created_procedures := v_created_procedures + 1;
            END IF;
        END IF;

        INSERT INTO public.service_provider_procedure_price_lists (
            service_provider_id,
            procedure_id,
            components,
            total_cost_egp,
            is_active
        )
        VALUES (
            v_run.provider_id,
            v_procedure_id,
            v_components,
            v_total,
            v_is_active
        )
        ON CONFLICT (service_provider_id, procedure_id)
        DO UPDATE SET
            components = EXCLUDED.components,
            total_cost_egp = EXCLUDED.total_cost_egp,
            is_active = EXCLUDED.is_active,
            updated_at = now();

        v_upserted_price_lists := v_upserted_price_lists + 1;

        UPDATE public.service_providers
        SET procedure_ids = (
            SELECT ARRAY_AGG(DISTINCT proc_id)
            FROM unnest(
                COALESCE(procedure_ids, '{}'::UUID[])
                || ARRAY[v_procedure_id]
            ) AS proc_id
        )
        WHERE id = v_run.provider_id;

        UPDATE public.operations_pricing_import_items
        SET
            status = 'applied',
            reason = NULL,
            treatment_id = v_treatment_id,
            procedure_id = v_procedure_id,
            component_count = jsonb_array_length(v_components),
            total_cost_egp = v_total
        WHERE id = v_item.id;

        v_result_row_results := v_result_row_results || jsonb_build_array(
            jsonb_build_object(
                'rowNumbers', v_item_row_numbers,
                'treatmentId', v_treatment_id,
                'procedureId', v_procedure_id,
                'procedureName', COALESCE(v_procedure_name, ''),
                'componentCount', jsonb_array_length(v_components),
                'totalCostEgp', v_total
            )
        );
    END LOOP;

    v_result := jsonb_build_object(
        'summary', jsonb_build_object(
            'appliedGroups', v_upserted_price_lists,
            'createdTreatments', v_created_treatments,
            'createdProcedures', v_created_procedures,
            'upsertedPriceLists', v_upserted_price_lists
        ),
        'rowResults', v_result_row_results
    );

    UPDATE public.operations_pricing_import_runs
    SET
        status = 'applied',
        result = v_result,
        updated_at = now()
    WHERE id = v_run.id;

    INSERT INTO public.operations_pricing_import_events (
        run_id,
        event_type,
        payload
    )
    VALUES (
        v_run.id,
        'apply',
        jsonb_build_object(
            'summary', v_result -> 'summary',
            'actorId', p_actor_id
        )
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        UPDATE public.operations_pricing_import_runs
        SET
            status = 'failed',
            result = jsonb_build_object('error', SQLERRM),
            updated_at = now()
        WHERE id = p_run_id;

        INSERT INTO public.operations_pricing_import_events (
            run_id,
            event_type,
            payload
        )
        VALUES (
            p_run_id,
            'failed',
            jsonb_build_object(
                'error', SQLERRM,
                'actorId', p_actor_id
            )
        );

        RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_operations_pricing_import(
    UUID,
    UUID,
    BOOLEAN
) FROM public;
GRANT EXECUTE ON FUNCTION public.apply_operations_pricing_import(
    UUID,
    UUID,
    BOOLEAN
) TO service_role;

COMMIT;
