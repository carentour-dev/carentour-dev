-- Create relational table for treatment procedures and migrate existing data.
-- This migration converts legacy JSONB `procedures` column into a normalized
-- structure.
-- Stored procedure data includes nested arrays for candidate requirements,
-- recovery stages, and international prices.
-- We preserve ordering so the UI renders procedures as previously displayed.

BEGIN;

-- 1. Create new table
CREATE TABLE public.treatment_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL
    REFERENCES public.treatments (id)
    ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    recovery TEXT,
    price TEXT,
    egypt_price NUMERIC(12, 2),
    success_rate TEXT,
    candidate_requirements TEXT [] DEFAULT '{}'::TEXT [],
    recovery_stages JSONB DEFAULT '[]'::JSONB,
    international_prices JSONB DEFAULT '[]'::JSONB,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_procedures_treatment_id
ON public.treatment_procedures (treatment_id, display_order);

ALTER TABLE public.treatment_procedures ENABLE ROW LEVEL SECURITY;

-- Ensure required privileges
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.treatment_procedures TO service_role;

-- Public should only read active treatments via joins.
-- Expose procedures to everyone for now.
DROP POLICY IF EXISTS public_can_read_treatment_procedures
ON public.treatment_procedures;
CREATE POLICY public_can_read_treatment_procedures
ON public.treatment_procedures
FOR SELECT
USING (true);

DROP POLICY IF EXISTS service_role_manages_treatment_procedures
ON public.treatment_procedures;
CREATE POLICY service_role_manages_treatment_procedures
ON public.treatment_procedures
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger to keep updated_at column fresh
CREATE OR REPLACE FUNCTION public.touch_treatment_procedures()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_treatment_procedures
ON public.treatment_procedures;
CREATE TRIGGER trg_touch_treatment_procedures
BEFORE UPDATE ON public.treatment_procedures
FOR EACH ROW
EXECUTE FUNCTION public.touch_treatment_procedures();

-- 2. Backfill data from treatments.procedures JSONB
WITH expanded AS (
    SELECT
        t.id AS treatment_id,
        procedure_row.elem ->> 'name' AS procedure_name,
        procedure_row.elem ->> 'description' AS description,
        procedure_row.elem ->> 'duration' AS duration,
        procedure_row.elem ->> 'recovery' AS recovery,
        procedure_row.elem ->> 'price' AS price,
        nullif(
            trim(procedure_row.elem ->> 'success_rate'),
            ''
        ) AS success_rate,
        CASE
            WHEN
                procedure_row.elem ? 'egyptPrice'
                THEN (procedure_row.elem ->> 'egyptPrice')::NUMERIC
        END AS egypt_price,
        coalesce(
            (
                SELECT array_agg(trim(candidate_requirement.requirement_text))
                FROM
                    jsonb_array_elements_text(
                        procedure_row.elem -> 'candidateRequirements'
                    ) AS candidate_requirement (requirement_text)
                WHERE trim(candidate_requirement.requirement_text) <> ''
            ),
            '{}'::TEXT []
        ) AS candidate_requirements,
        coalesce(
            procedure_row.elem -> 'recoveryStages',
            '[]'::JSONB
        )
            AS recovery_stages,
        coalesce(
            procedure_row.elem -> 'internationalPrices',
            '[]'::JSONB
        )
            AS international_prices,
        row_number() OVER (
            PARTITION BY t.id
            ORDER BY procedure_row.procedure_position
        ) - 1 AS display_order
    FROM public.treatments AS t
    CROSS JOIN
        LATERAL jsonb_array_elements(t.procedures) WITH ORDINALITY
            AS procedure_row (elem, procedure_position)
)

INSERT INTO public.treatment_procedures (
    treatment_id,
    name,
    description,
    duration,
    recovery,
    price,
    egypt_price,
    success_rate,
    candidate_requirements,
    recovery_stages,
    international_prices,
    display_order
)
SELECT
    treatment_id,
    procedure_name,
    nullif(description, '') AS description,
    nullif(duration, '') AS duration,
    nullif(recovery, '') AS recovery,
    nullif(price, '') AS price,
    egypt_price,
    success_rate,
    candidate_requirements,
    recovery_stages,
    international_prices,
    display_order
FROM expanded;

-- 3. No placeholder rows; UI handles treatments without procedures.
-- 4. Remove legacy column
ALTER TABLE public.treatments DROP COLUMN IF EXISTS procedures;

COMMIT;
