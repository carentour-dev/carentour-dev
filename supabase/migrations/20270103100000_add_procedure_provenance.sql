-- Track procedure provenance and visibility.
BEGIN;

ALTER TABLE public.treatment_procedures
ADD COLUMN IF NOT EXISTS created_by_provider_id UUID
REFERENCES public.service_providers (id),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_treatment_procedures_visibility
ON public.treatment_procedures (
    treatment_id,
    is_public,
    created_by_provider_id
);

COMMIT;
