BEGIN;

CREATE TABLE IF NOT EXISTS public.operations_pricing_catalog_delete_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('treatment', 'procedure')),
    entity_id UUID NOT NULL,
    treatment_id UUID,
    entity_name TEXT,
    treatment_name TEXT,
    treatment_slug TEXT,
    procedure_created_by_provider_id UUID,
    had_price_lists BOOLEAN NOT NULL DEFAULT false,
    price_list_count INTEGER NOT NULL DEFAULT 0 CHECK (price_list_count >= 0),
    price_list_provider_ids UUID [] NOT NULL DEFAULT '{}'::UUID [],
    deleted_by_user_id UUID,
    deleted_by_actor_id TEXT,
    delete_source TEXT,
    delete_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_pricing_delete_audit_deleted_at
ON public.operations_pricing_catalog_delete_audit (deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_pricing_delete_audit_entity
ON public.operations_pricing_catalog_delete_audit (
    entity_type,
    entity_id,
    deleted_at DESC
);

ALTER TABLE public.operations_pricing_catalog_delete_audit
ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT
ON public.operations_pricing_catalog_delete_audit TO service_role;

DROP POLICY IF EXISTS service_role_reads_ops_pricing_delete_audit
ON public.operations_pricing_catalog_delete_audit;
CREATE POLICY service_role_reads_ops_pricing_delete_audit
ON public.operations_pricing_catalog_delete_audit
FOR SELECT
TO service_role
USING (true);

DROP POLICY IF EXISTS service_role_inserts_ops_pricing_delete_audit
ON public.operations_pricing_catalog_delete_audit;
CREATE POLICY service_role_inserts_ops_pricing_delete_audit
ON public.operations_pricing_catalog_delete_audit
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.is_truthy_setting(p_setting_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_raw TEXT;
BEGIN
    v_raw := lower(trim(COALESCE(current_setting(p_setting_key, true), '')));
    RETURN v_raw IN ('1', 'true', 'on', 'yes', 'y');
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_and_audit_treatment_procedure_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_price_list_count INTEGER := 0;
    v_price_list_provider_ids UUID[] := '{}'::UUID[];
    v_allow_priced_delete BOOLEAN := false;
    v_delete_source TEXT;
    v_delete_reason TEXT;
    v_deleted_by_actor_id TEXT;
    v_deleted_by_user_id UUID;
    v_actor_user_id_setting TEXT;
    v_treatment_name TEXT;
    v_treatment_slug TEXT;
BEGIN
    SELECT
        COUNT(*)::INTEGER,
        COALESCE(array_agg(DISTINCT ppl.service_provider_id), '{}'::UUID[])
    INTO v_price_list_count, v_price_list_provider_ids
    FROM public.service_provider_procedure_price_lists AS ppl
    WHERE ppl.procedure_id = OLD.id;

    v_allow_priced_delete := public.is_truthy_setting(
        'app.allow_priced_procedure_delete'
    );

    IF v_price_list_count > 0 AND NOT v_allow_priced_delete THEN
        RAISE EXCEPTION
            'Cannot delete procedure "%" (%). It still has % provider price list(s).',
            OLD.name,
            OLD.id,
            v_price_list_count
            USING HINT = 'Delete related records from service_provider_procedure_price_lists first, or run the delete in a controlled transaction with app.allow_priced_procedure_delete=on.';
    END IF;

    SELECT t.name, t.slug
    INTO v_treatment_name, v_treatment_slug
    FROM public.treatments AS t
    WHERE t.id = OLD.treatment_id;

    v_delete_source := NULLIF(current_setting('app.delete_source', true), '');
    v_delete_reason := NULLIF(current_setting('app.delete_reason', true), '');
    v_deleted_by_actor_id := NULLIF(
        current_setting('app.delete_actor_id', true),
        ''
    );
    v_actor_user_id_setting := NULLIF(
        current_setting('app.delete_actor_user_id', true),
        ''
    );

    BEGIN
        v_deleted_by_user_id := COALESCE(v_actor_user_id_setting::UUID, auth.uid());
    EXCEPTION
        WHEN OTHERS THEN
            v_deleted_by_user_id := auth.uid();
    END;

    INSERT INTO public.operations_pricing_catalog_delete_audit (
        entity_type,
        entity_id,
        treatment_id,
        entity_name,
        treatment_name,
        treatment_slug,
        procedure_created_by_provider_id,
        had_price_lists,
        price_list_count,
        price_list_provider_ids,
        deleted_by_user_id,
        deleted_by_actor_id,
        delete_source,
        delete_reason,
        metadata
    )
    VALUES (
        'procedure',
        OLD.id,
        OLD.treatment_id,
        OLD.name,
        v_treatment_name,
        v_treatment_slug,
        OLD.created_by_provider_id,
        v_price_list_count > 0,
        v_price_list_count,
        v_price_list_provider_ids,
        v_deleted_by_user_id,
        v_deleted_by_actor_id,
        v_delete_source,
        v_delete_reason,
        jsonb_build_object(
            'allowPricedDeleteOverride', v_allow_priced_delete,
            'isPublic', OLD.is_public,
            'displayOrder', OLD.display_order
        )
    );

    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_and_audit_treatment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_procedure_count INTEGER := 0;
    v_price_list_count INTEGER := 0;
    v_price_list_provider_ids UUID[] := '{}'::UUID[];
    v_allow_priced_delete BOOLEAN := false;
    v_delete_source TEXT;
    v_delete_reason TEXT;
    v_deleted_by_actor_id TEXT;
    v_deleted_by_user_id UUID;
    v_actor_user_id_setting TEXT;
BEGIN
    SELECT
        COUNT(DISTINCT p.id)::INTEGER,
        COUNT(ppl.id)::INTEGER,
        COALESCE(
            array_agg(DISTINCT ppl.service_provider_id)
                FILTER (WHERE ppl.service_provider_id IS NOT NULL),
            '{}'::UUID[]
        )
    INTO
        v_procedure_count,
        v_price_list_count,
        v_price_list_provider_ids
    FROM public.treatment_procedures AS p
    LEFT JOIN public.service_provider_procedure_price_lists AS ppl
        ON ppl.procedure_id = p.id
    WHERE p.treatment_id = OLD.id;

    v_allow_priced_delete := public.is_truthy_setting(
        'app.allow_priced_procedure_delete'
    );

    IF v_price_list_count > 0 AND NOT v_allow_priced_delete THEN
        RAISE EXCEPTION
            'Cannot delete treatment "%" (%). % provider price list(s) would be removed by cascading procedure deletes.',
            OLD.name,
            OLD.id,
            v_price_list_count
            USING HINT = 'Delete or migrate related provider price lists first, or run the delete in a controlled transaction with app.allow_priced_procedure_delete=on.';
    END IF;

    v_delete_source := NULLIF(current_setting('app.delete_source', true), '');
    v_delete_reason := NULLIF(current_setting('app.delete_reason', true), '');
    v_deleted_by_actor_id := NULLIF(
        current_setting('app.delete_actor_id', true),
        ''
    );
    v_actor_user_id_setting := NULLIF(
        current_setting('app.delete_actor_user_id', true),
        ''
    );

    BEGIN
        v_deleted_by_user_id := COALESCE(v_actor_user_id_setting::UUID, auth.uid());
    EXCEPTION
        WHEN OTHERS THEN
            v_deleted_by_user_id := auth.uid();
    END;

    INSERT INTO public.operations_pricing_catalog_delete_audit (
        entity_type,
        entity_id,
        treatment_id,
        entity_name,
        treatment_name,
        treatment_slug,
        procedure_created_by_provider_id,
        had_price_lists,
        price_list_count,
        price_list_provider_ids,
        deleted_by_user_id,
        deleted_by_actor_id,
        delete_source,
        delete_reason,
        metadata
    )
    VALUES (
        'treatment',
        OLD.id,
        OLD.id,
        OLD.name,
        OLD.name,
        OLD.slug,
        NULL,
        v_price_list_count > 0,
        v_price_list_count,
        v_price_list_provider_ids,
        v_deleted_by_user_id,
        v_deleted_by_actor_id,
        v_delete_source,
        v_delete_reason,
        jsonb_build_object(
            'allowPricedDeleteOverride', v_allow_priced_delete,
            'category', OLD.category,
            'procedureCount', v_procedure_count
        )
    );

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_audit_treatment_procedures_delete
ON public.treatment_procedures;
CREATE TRIGGER trg_guard_audit_treatment_procedures_delete
BEFORE DELETE ON public.treatment_procedures
FOR EACH ROW
EXECUTE FUNCTION public.guard_and_audit_treatment_procedure_delete();

DROP TRIGGER IF EXISTS trg_guard_audit_treatments_delete
ON public.treatments;
CREATE TRIGGER trg_guard_audit_treatments_delete
BEFORE DELETE ON public.treatments
FOR EACH ROW
EXECUTE FUNCTION public.guard_and_audit_treatment_delete();

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
    v_actor_id TEXT;
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

    v_actor_id := NULLIF(COALESCE(NEW.payload ->> 'actorId', ''), '');
    PERFORM set_config('app.allow_priced_procedure_delete', 'on', true);
    PERFORM set_config('app.delete_source', 'operations_pricing_import_failed_cleanup', true);
    PERFORM set_config(
        'app.delete_reason',
        'Automatic cleanup for failed operations pricing import run ' || NEW.run_id::TEXT,
        true
    );
    IF v_actor_id IS NOT NULL THEN
        PERFORM set_config('app.delete_actor_id', v_actor_id, true);
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

COMMIT;
