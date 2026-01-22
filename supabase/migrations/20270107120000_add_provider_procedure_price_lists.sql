-- Create provider-specific procedure price lists for quotation calculator
BEGIN;

CREATE TABLE IF NOT EXISTS public.service_provider_procedure_price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_provider_id UUID NOT NULL
    REFERENCES public.service_providers (id)
    ON DELETE CASCADE,
    procedure_id UUID NOT NULL
    REFERENCES public.treatment_procedures (id)
    ON DELETE CASCADE,
    components JSONB NOT NULL DEFAULT '[]'::JSONB,
    total_cost_egp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_procedure_price_lists_unique
ON public.service_provider_procedure_price_lists (
    service_provider_id,
    procedure_id
);

CREATE INDEX IF NOT EXISTS idx_provider_procedure_price_lists_provider
ON public.service_provider_procedure_price_lists (service_provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_procedure_price_lists_procedure
ON public.service_provider_procedure_price_lists (procedure_id);

ALTER TABLE public.service_provider_procedure_price_lists
ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.service_provider_procedure_price_lists TO service_role;

DROP POLICY IF EXISTS service_role_manages_provider_procedure_price_lists
ON public.service_provider_procedure_price_lists;
CREATE POLICY service_role_manages_provider_procedure_price_lists
ON public.service_provider_procedure_price_lists
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS service_provider_procedure_price_lists_set_updated_at
ON public.service_provider_procedure_price_lists;
CREATE TRIGGER service_provider_procedure_price_lists_set_updated_at
BEFORE UPDATE ON public.service_provider_procedure_price_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
