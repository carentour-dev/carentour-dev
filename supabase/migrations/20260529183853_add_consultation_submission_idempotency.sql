BEGIN;

ALTER TABLE public.contact_requests
ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_requests_idempotency_key_unique
ON public.contact_requests (idempotency_key)
WHERE idempotency_key IS NOT NULL;

COMMIT;
