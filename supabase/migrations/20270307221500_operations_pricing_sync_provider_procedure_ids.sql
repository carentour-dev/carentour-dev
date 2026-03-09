BEGIN;

-- Keep provider.procedure_ids aligned with real, existing procedures by:
-- 1) dropping stale UUIDs that no longer exist in treatment_procedures,
-- 2) ensuring provider-owned procedures are always linked,
-- 3) ensuring procedures with provider price lists are always linked.
UPDATE public.service_providers AS sp
SET procedure_ids = (
    SELECT COALESCE(ARRAY_AGG(DISTINCT src.procedure_id), '{}'::UUID [])
    FROM (
        SELECT existing_ids.proc_id AS procedure_id
        FROM
            UNNEST(
                COALESCE(sp.procedure_ids, '{}'::UUID [])
            ) AS existing_ids (proc_id)
        WHERE
            EXISTS (
                SELECT 1
                FROM public.treatment_procedures AS tp
                WHERE tp.id = existing_ids.proc_id
            )

        UNION

        SELECT tp.id AS procedure_id
        FROM public.treatment_procedures AS tp
        WHERE tp.created_by_provider_id = sp.id

        UNION

        SELECT ppl.procedure_id
        FROM public.service_provider_procedure_price_lists AS ppl
        WHERE ppl.service_provider_id = sp.id
    ) AS src
);

COMMIT;
