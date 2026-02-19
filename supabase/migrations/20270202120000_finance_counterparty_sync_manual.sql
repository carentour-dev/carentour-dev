BEGIN;

-- ---------------------------------------------------------------------------
-- Counterparty sync metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.finance_counterparties
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

UPDATE public.finance_counterparties
SET
    source_type = CASE
        WHEN service_provider_id IS NOT NULL THEN 'service_provider'
        WHEN hotel_id IS NOT NULL THEN 'hotel'
        ELSE 'manual'
    END
WHERE
    source_type IS NULL
    OR source_type NOT IN ('manual', 'service_provider', 'hotel');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'finance_counterparties_source_type_check'
    ) THEN
        ALTER TABLE public.finance_counterparties
            ADD CONSTRAINT finance_counterparties_source_type_check
            CHECK (source_type IN ('manual', 'service_provider', 'hotel'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_finance_counterparties_source_type
ON public.finance_counterparties (source_type, is_active);

CREATE INDEX IF NOT EXISTS idx_finance_counterparties_last_synced
ON public.finance_counterparties (last_synced_at DESC NULLS LAST);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_finance_counterparties_service_provider_unique
ON public.finance_counterparties (service_provider_id)
WHERE service_provider_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_counterparties_hotel_unique
ON public.finance_counterparties (hotel_id)
WHERE hotel_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (slug, name, description)
VALUES
(
    'finance.counterparties',
    'Finance Counterparties',
    'Allows managing finance counterparties and running sync previews.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH role_map AS (
    SELECT
        id AS role_id,
        slug
    FROM public.roles
    WHERE slug IN ('admin', 'management', 'finance_manager', 'finance_operator')
),

perm_map AS (
    SELECT id AS permission_id
    FROM public.permissions
    WHERE slug = 'finance.counterparties'
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    role_map.role_id,
    perm_map.permission_id
FROM role_map
CROSS JOIN perm_map
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
