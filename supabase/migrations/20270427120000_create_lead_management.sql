-- Lead staging, integration audit, and automation shadow-mode tables
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type typ
        JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
        WHERE nsp.nspname = 'public'
            AND typ.typname = 'lead_inquiry_status'
    ) THEN
        CREATE TYPE public.lead_inquiry_status AS ENUM (
            'new',
            'reviewing',
            'qualified',
            'converted',
            'duplicate',
            'disqualified',
            'archived'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type typ
        JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
        WHERE nsp.nspname = 'public'
            AND typ.typname = 'lead_urgency_tier'
    ) THEN
        CREATE TYPE public.lead_urgency_tier AS ENUM (
            'low',
            'medium',
            'high',
            'urgent'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type typ
        JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
        WHERE nsp.nspname = 'public'
            AND typ.typname = 'webhook_delivery_status'
    ) THEN
        CREATE TYPE public.webhook_delivery_status AS ENUM (
            'accepted',
            'rejected',
            'processed',
            'failed'
        );
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.lead_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status public.LEAD_INQUIRY_STATUS NOT NULL DEFAULT 'new',
    source TEXT NOT NULL DEFAULT 'unknown',
    channel TEXT,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    normalized_email TEXT,
    phone TEXT,
    normalized_phone TEXT,
    country TEXT,
    language TEXT, -- noqa: RF04
    procedure_interest TEXT,
    message TEXT,
    quality_score INTEGER CHECK (
        quality_score IS NULL
        OR quality_score BETWEEN 0 AND 100
    ),
    urgency_tier public.LEAD_URGENCY_TIER NOT NULL DEFAULT 'medium',
    has_medical_documents BOOLEAN NOT NULL DEFAULT FALSE,
    ready_for_consultation BOOLEAN NOT NULL DEFAULT FALSE,
    disqualification_reason TEXT,
    assigned_to UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    contact_request_id UUID REFERENCES public.contact_requests (id) ON DELETE SET NULL,
    start_journey_submission_id UUID REFERENCES public.start_journey_submissions (id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients (id) ON DELETE SET NULL,
    duplicate_of_lead_id UUID REFERENCES public.lead_inquiries (id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_inquiries (id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    actor_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.lead_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_inquiries (id) ON DELETE CASCADE,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    content TEXT, -- noqa: RF04
    term TEXT,
    click_id TEXT,
    landing_page TEXT,
    referrer TEXT,
    raw_attribution JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.external_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (
        entity_type IN (
            'lead',
            'patient',
            'contact_request',
            'start_journey_submission'
        )
    ),
    entity_id UUID NOT NULL,
    provider TEXT NOT NULL, -- noqa: RF04
    external_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (provider, external_id)
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    provider TEXT, -- noqa: RF04
    payload_hash TEXT NOT NULL,
    signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
    status public.WEBHOOK_DELIVERY_STATUS NOT NULL DEFAULT 'accepted',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    request_headers JSONB NOT NULL DEFAULT '{}'::JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.communication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.lead_inquiries (id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients (id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    provider TEXT, -- noqa: RF04
    provider_message_id TEXT,
    status TEXT,
    subject TEXT,
    body TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.marketing_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.lead_inquiries (id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients (id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    opted_in BOOLEAN NOT NULL,
    consent_source TEXT,
    preferred_channel TEXT,
    preferred_language TEXT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    revoked_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CHECK (lead_id IS NOT NULL OR patient_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.lead_inquiries (id) ON DELETE CASCADE,
    run_type TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'shadow' CHECK (mode IN ('shadow', 'active')), -- noqa: RF04
    input JSONB NOT NULL DEFAULT '{}'::JSONB, -- noqa: RF04
    output JSONB NOT NULL DEFAULT '{}'::JSONB, -- noqa: RF04
    suggested_next_action TEXT,
    confidence NUMERIC(5, 4),
    review_state TEXT NOT NULL DEFAULT 'pending' CHECK (
        review_state IN ('pending', 'approved', 'rejected', 'ignored')
    ),
    reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS lead_inquiries_status_created_idx
ON public.lead_inquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_inquiries_source_created_idx
ON public.lead_inquiries (source, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_inquiries_assigned_status_idx
ON public.lead_inquiries (assigned_to, status);

CREATE INDEX IF NOT EXISTS lead_inquiries_normalized_email_idx
ON public.lead_inquiries (normalized_email)
WHERE normalized_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_inquiries_normalized_phone_idx
ON public.lead_inquiries (normalized_phone)
WHERE normalized_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_events_lead_created_idx
ON public.lead_events (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_attribution_lead_idx
ON public.lead_attribution (lead_id);

CREATE INDEX IF NOT EXISTS external_identities_entity_idx
ON public.external_identities (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS webhook_deliveries_received_idx
ON public.webhook_deliveries (received_at DESC);

CREATE INDEX IF NOT EXISTS communication_events_lead_idx
ON public.communication_events (lead_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS marketing_consents_lead_channel_idx
ON public.marketing_consents (lead_id, channel);

CREATE INDEX IF NOT EXISTS automation_runs_lead_created_idx
ON public.automation_runs (lead_id, created_at DESC);

ALTER TABLE public.lead_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.lead_inquiries TO service_role;
GRANT ALL ON public.lead_events TO service_role;
GRANT ALL ON public.lead_attribution TO service_role;
GRANT ALL ON public.external_identities TO service_role;
GRANT ALL ON public.webhook_deliveries TO service_role;
GRANT ALL ON public.communication_events TO service_role;
GRANT ALL ON public.marketing_consents TO service_role;
GRANT ALL ON public.automation_runs TO service_role;

DROP TRIGGER IF EXISTS lead_inquiries_set_updated_at
ON public.lead_inquiries;
CREATE TRIGGER lead_inquiries_set_updated_at
BEFORE UPDATE ON public.lead_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS external_identities_set_updated_at
ON public.external_identities;
CREATE TRIGGER external_identities_set_updated_at
BEFORE UPDATE ON public.external_identities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS marketing_consents_set_updated_at
ON public.marketing_consents;
CREATE TRIGGER marketing_consents_set_updated_at
BEFORE UPDATE ON public.marketing_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- The lead permission seed writes to the existing permission join table.
-- Keep this idempotent so SQL Editor safety checks see RLS is intentional.
ALTER TABLE public.role_permissions
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_permissions_are_readable ON public.role_permissions;
CREATE POLICY role_permissions_are_readable
ON public.role_permissions
FOR SELECT
TO authenticated
USING (TRUE);

INSERT INTO public.permissions (slug, name, description)
VALUES (
    'operations.leads',
    'Operations Lead Inbox',
    'Allows reviewing, deduplicating, assigning, and converting lead inquiries.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH target_permission AS (
    SELECT permissions.id AS permission_id
    FROM public.permissions AS permissions
    WHERE permissions.slug = 'operations.leads'
),

target_roles AS (
    SELECT public_roles.id AS role_id
    FROM public.roles AS public_roles
    WHERE public_roles.slug IN (
        'admin',
        'coordinator',
        'management',
        'employee'
    )
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    target_roles.role_id,
    target_permission.permission_id
FROM target_roles
CROSS JOIN target_permission
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
