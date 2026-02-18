-- Finance module foundation with installment support
BEGIN;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_case_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_case_status AS ENUM (
            'draft',
            'active',
            'closed',
            'cancelled'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_order_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_order_status AS ENUM (
            'draft',
            'confirmed',
            'cancelled',
            'completed'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_invoice_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_invoice_status AS ENUM (
            'draft',
            'issued',
            'partially_paid',
            'paid',
            'overdue',
            'void',
            'cancelled'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_installment_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_installment_status AS ENUM (
            'pending',
            'partially_paid',
            'paid',
            'overdue',
            'cancelled'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_payment_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_payment_status AS ENUM (
            'recorded',
            'posted',
            'reversed'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_payment_method'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_payment_method AS ENUM (
            'bank_transfer',
            'cash',
            'card',
            'gateway'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_payable_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_payable_status AS ENUM (
            'draft',
            'approved',
            'scheduled',
            'partially_paid',
            'paid',
            'cancelled'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_approval_status'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_approval_status AS ENUM (
            'pending',
            'approved',
            'rejected',
            'cancelled'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'finance_credit_adjustment_type'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.finance_credit_adjustment_type AS ENUM (
            'refund',
            'writeoff',
            'credit_note'
        );
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Numbering sequences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_order_sequences (
    order_year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.finance_invoice_sequences (
    invoice_year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION public.next_finance_order_number(
    p_year INTEGER DEFAULT extract(YEAR FROM now())
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    INSERT INTO public.finance_order_sequences (order_year, last_number)
    VALUES (p_year, 1)
    ON CONFLICT (order_year) DO UPDATE
    SET
        last_number = public.finance_order_sequences.last_number + 1,
        updated_at = timezone('utc', now())
    RETURNING public.finance_order_sequences.last_number INTO next_number;

    RETURN format(
        'ORD-%s-%s',
        p_year,
        lpad(next_number::text, 5, '0')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.next_finance_invoice_number(
    p_year INTEGER DEFAULT extract(YEAR FROM now())
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    INSERT INTO public.finance_invoice_sequences (invoice_year, last_number)
    VALUES (p_year, 1)
    ON CONFLICT (invoice_year) DO UPDATE
    SET
        last_number = public.finance_invoice_sequences.last_number + 1,
        updated_at = timezone('utc', now())
    RETURNING public.finance_invoice_sequences.last_number INTO next_number;

    RETURN format(
        'INV-%s-%s',
        p_year,
        lpad(next_number::text, 5, '0')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.next_finance_order_number(INTEGER) FROM public;
REVOKE ALL ON FUNCTION public.next_finance_invoice_number(INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.next_finance_order_number(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_invoice_number(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_entity_name TEXT NOT NULL DEFAULT 'Care N Tour',
    base_currency TEXT NOT NULL DEFAULT 'EGP',
    order_prefix TEXT NOT NULL DEFAULT 'ORD',
    invoice_prefix TEXT NOT NULL DEFAULT 'INV',
    approval_threshold_amount NUMERIC(14, 2) NOT NULL DEFAULT 5000,
    approval_threshold_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.finance_settings (legal_entity_name)
SELECT 'Care N Tour'
WHERE NOT EXISTS (SELECT 1 FROM public.finance_settings);

CREATE TABLE IF NOT EXISTS public.finance_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE,
    title TEXT NOT NULL,
    patient_id UUID REFERENCES public.patients (id) ON DELETE SET NULL,
    contact_request_id UUID
        REFERENCES public.contact_requests (id)
        ON DELETE SET NULL,
    start_journey_submission_id UUID
        REFERENCES public.start_journey_submissions (id)
        ON DELETE SET NULL,
    operations_quote_id UUID
        REFERENCES public.operations_quotes (id)
        ON DELETE SET NULL,
    status public.finance_case_status NOT NULL DEFAULT 'draft',
    source TEXT,
    assigned_to_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_cases_patient_status
ON public.finance_cases (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_finance_cases_quote
ON public.finance_cases (operations_quote_id);

CREATE TABLE IF NOT EXISTS public.finance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE DEFAULT public.next_finance_order_number(),
    finance_case_id UUID NOT NULL REFERENCES public.finance_cases (id) ON DELETE CASCADE,
    operations_quote_id UUID
        REFERENCES public.operations_quotes (id)
        ON DELETE SET NULL,
    status public.finance_order_status NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT current_date,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quote_snapshot JSONB,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    approved_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_orders_case_status
ON public.finance_orders (finance_case_id, status);

CREATE INDEX IF NOT EXISTS idx_finance_orders_quote
ON public.finance_orders (operations_quote_id);

CREATE TABLE IF NOT EXISTS public.finance_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_order_id UUID NOT NULL
        REFERENCES public.finance_orders (id)
        ON DELETE CASCADE,
    line_type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL DEFAULT 1,
    unit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_key TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_order_lines_order
ON public.finance_order_lines (finance_order_id);

CREATE TABLE IF NOT EXISTS public.finance_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE DEFAULT public.next_finance_invoice_number(),
    finance_case_id UUID NOT NULL
        REFERENCES public.finance_cases (id)
        ON DELETE CASCADE,
    finance_order_id UUID
        REFERENCES public.finance_orders (id)
        ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients (id) ON DELETE SET NULL,
    status public.finance_invoice_status NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT current_date,
    due_date DATE,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quote_payment_terms TEXT,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    approved_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_patient_status_due
ON public.finance_invoices (patient_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_order
ON public.finance_invoices (finance_order_id);

CREATE TABLE IF NOT EXISTS public.finance_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_invoice_id UUID NOT NULL
        REFERENCES public.finance_invoices (id)
        ON DELETE CASCADE,
    finance_order_line_id UUID
        REFERENCES public.finance_order_lines (id)
        ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL DEFAULT 1,
    unit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_invoice_lines_invoice
ON public.finance_invoice_lines (finance_invoice_id);

CREATE TABLE IF NOT EXISTS public.finance_invoice_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_invoice_id UUID NOT NULL
        REFERENCES public.finance_invoices (id)
        ON DELETE CASCADE,
    label TEXT NOT NULL,
    percent NUMERIC(9, 4) NOT NULL CHECK (percent >= 0 AND percent <= 100),
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status public.finance_installment_status NOT NULL DEFAULT 'pending',
    display_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (finance_invoice_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_finance_installments_invoice_due
ON public.finance_invoice_installments (finance_invoice_id, due_date);

CREATE INDEX IF NOT EXISTS idx_finance_installments_status_due
ON public.finance_invoice_installments (status, due_date);

CREATE TABLE IF NOT EXISTS public.finance_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference TEXT UNIQUE,
    status public.finance_payment_status NOT NULL DEFAULT 'recorded',
    payment_method public.finance_payment_method NOT NULL DEFAULT 'bank_transfer',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    currency TEXT NOT NULL DEFAULT 'USD',
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    fx_rate NUMERIC(18, 8),
    source TEXT,
    received_from TEXT,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payments_date_status
ON public.finance_payments (payment_date DESC, status);

CREATE TABLE IF NOT EXISTS public.finance_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_payment_id UUID NOT NULL
        REFERENCES public.finance_payments (id)
        ON DELETE CASCADE,
    finance_invoice_id UUID NOT NULL
        REFERENCES public.finance_invoices (id)
        ON DELETE CASCADE,
    finance_invoice_installment_id UUID
        REFERENCES public.finance_invoice_installments (id)
        ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payment_allocations_invoice
ON public.finance_payment_allocations (finance_invoice_id);

CREATE INDEX IF NOT EXISTS idx_finance_payment_allocations_installment
ON public.finance_payment_allocations (finance_invoice_installment_id);

CREATE TABLE IF NOT EXISTS public.finance_credit_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_invoice_id UUID REFERENCES public.finance_invoices (id) ON DELETE SET NULL,
    finance_payment_id UUID REFERENCES public.finance_payments (id) ON DELETE SET NULL,
    adjustment_type public.finance_credit_adjustment_type NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    reason_code TEXT NOT NULL,
    notes TEXT,
    status public.finance_approval_status NOT NULL DEFAULT 'pending',
    requested_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    approved_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_credit_adjustments_invoice
ON public.finance_credit_adjustments (finance_invoice_id);

CREATE TABLE IF NOT EXISTS public.finance_counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    service_provider_id UUID REFERENCES public.service_providers (id) ON DELETE SET NULL,
    hotel_id UUID REFERENCES public.hotels (id) ON DELETE SET NULL,
    external_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    contact_email TEXT,
    contact_phone TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_counterparties_kind_active
ON public.finance_counterparties (kind, is_active);

CREATE TABLE IF NOT EXISTS public.finance_payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payable_number TEXT NOT NULL UNIQUE,
    counterparty_id UUID NOT NULL
        REFERENCES public.finance_counterparties (id)
        ON DELETE RESTRICT,
    finance_case_id UUID REFERENCES public.finance_cases (id) ON DELETE SET NULL,
    finance_order_id UUID REFERENCES public.finance_orders (id) ON DELETE SET NULL,
    status public.finance_payable_status NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT current_date,
    due_date DATE,
    currency TEXT NOT NULL DEFAULT 'USD',
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    approved_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payables_status_due
ON public.finance_payables (status, due_date);

CREATE TABLE IF NOT EXISTS public.finance_payable_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_payable_id UUID NOT NULL
        REFERENCES public.finance_payables (id)
        ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payable_lines_payable
ON public.finance_payable_lines (finance_payable_id);

CREATE TABLE IF NOT EXISTS public.finance_payable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_payable_id UUID NOT NULL
        REFERENCES public.finance_payables (id)
        ON DELETE CASCADE,
    finance_payment_id UUID REFERENCES public.finance_payments (id) ON DELETE SET NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    reference TEXT,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payable_payments_payable
ON public.finance_payable_payments (finance_payable_id);

CREATE TABLE IF NOT EXISTS public.finance_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    status public.finance_approval_status NOT NULL DEFAULT 'pending',
    requested_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    primary_approver_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    secondary_approver_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    approved_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    rejected_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    threshold_amount NUMERIC(14, 2),
    currency TEXT,
    reason TEXT,
    decision_notes TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_approval_entity_status
ON public.finance_approval_requests (entity_type, entity_id, status);

CREATE TABLE IF NOT EXISTS public.finance_chart_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_account_id UUID
        REFERENCES public.finance_chart_accounts (id)
        ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT current_date,
    source_type TEXT,
    source_id UUID,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'EGP',
    status TEXT NOT NULL DEFAULT 'posted',
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finance_journal_entry_id UUID NOT NULL
        REFERENCES public.finance_journal_entries (id)
        ON DELETE CASCADE,
    finance_chart_account_id UUID NOT NULL
        REFERENCES public.finance_chart_accounts (id)
        ON DELETE RESTRICT,
    description TEXT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EGP',
    fx_rate NUMERIC(18, 8),
    cost_tag_case_id UUID REFERENCES public.finance_cases (id) ON DELETE SET NULL,
    cost_tag_department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT finance_journal_line_amounts_check CHECK (
        debit >= 0
        AND credit >= 0
        AND NOT (debit > 0 AND credit > 0)
        AND (debit > 0 OR credit > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_finance_journal_lines_entry
ON public.finance_journal_lines (finance_journal_entry_id);

CREATE TABLE IF NOT EXISTS public.finance_exchange_rate_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    rate NUMERIC(18, 8) NOT NULL,
    source TEXT NOT NULL,
    as_of TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (base_currency, quote_currency, as_of)
);

CREATE TABLE IF NOT EXISTS public.finance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'finance-documents',
    path TEXT NOT NULL,
    label TEXT NOT NULL,
    content_type TEXT,
    size BIGINT,
    uploaded_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_documents_entity
ON public.finance_documents (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.finance_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    actor_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    actor_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_events_entity_created
ON public.finance_audit_events (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.finance_hr_compensation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_event_id TEXT UNIQUE,
    profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    effective_date DATE NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EGP',
    department TEXT,
    cost_tag_case_id UUID REFERENCES public.finance_cases (id) ON DELETE SET NULL,
    approval_reference TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_hr_events_profile_effective
ON public.finance_hr_compensation_events (profile_id, effective_date DESC);

-- ---------------------------------------------------------------------------
-- RLS + Grants
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    table_name TEXT;
    finance_tables TEXT[] := ARRAY[
        'finance_settings',
        'finance_order_sequences',
        'finance_invoice_sequences',
        'finance_cases',
        'finance_orders',
        'finance_order_lines',
        'finance_invoices',
        'finance_invoice_lines',
        'finance_invoice_installments',
        'finance_payments',
        'finance_payment_allocations',
        'finance_credit_adjustments',
        'finance_counterparties',
        'finance_payables',
        'finance_payable_lines',
        'finance_payable_payments',
        'finance_approval_requests',
        'finance_chart_accounts',
        'finance_journal_entries',
        'finance_journal_lines',
        'finance_exchange_rate_snapshots',
        'finance_documents',
        'finance_audit_events',
        'finance_hr_compensation_events'
    ];
BEGIN
    FOREACH table_name IN ARRAY finance_tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',
            table_name
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            'service_role_manages_' || table_name,
            table_name
        );
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            'service_role_manages_' || table_name,
            table_name
        );
    END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO service_role;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    table_name TEXT;
    trigger_name TEXT;
    trigger_tables TEXT[] := ARRAY[
        'finance_settings',
        'finance_cases',
        'finance_orders',
        'finance_invoices',
        'finance_invoice_installments',
        'finance_payments',
        'finance_credit_adjustments',
        'finance_counterparties',
        'finance_payables',
        'finance_approval_requests',
        'finance_chart_accounts',
        'finance_journal_entries',
        'finance_documents',
        'finance_hr_compensation_events',
        'finance_order_sequences',
        'finance_invoice_sequences'
    ];
BEGIN
    FOREACH table_name IN ARRAY trigger_tables LOOP
        trigger_name := table_name || '_set_updated_at';
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, table_name);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
            trigger_name,
            table_name
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Storage bucket for finance documents
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Service role manages finance-documents bucket'
    ) THEN
        CREATE POLICY "Service role manages finance-documents bucket"
        ON storage.objects
        FOR ALL
        TO service_role
        USING (bucket_id = 'finance-documents')
        WITH CHECK (bucket_id = 'finance-documents');
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Permissions + role mapping
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (slug, name, description)
VALUES
(
    'finance.access',
    'Finance Workspace Access',
    'Allows opening the staff Finance workspace.'
),
(
    'finance.shared',
    'Finance Shared Data',
    'Allows access to shared finance records and lookups.'
),
(
    'finance.orders',
    'Finance Orders',
    'Allows creating and updating finance cases and orders.'
),
(
    'finance.invoices',
    'Finance Invoices',
    'Allows creating invoices and installment schedules.'
),
(
    'finance.payments',
    'Finance Payments',
    'Allows recording customer payments and allocations.'
),
(
    'finance.payables',
    'Finance Payables',
    'Allows managing supplier payables and settlements.'
),
(
    'finance.approvals',
    'Finance Approvals',
    'Allows reviewing and deciding finance approval requests.'
),
(
    'finance.reports',
    'Finance Reports',
    'Allows viewing finance dashboards and aging reports.'
),
(
    'finance.settings',
    'Finance Settings',
    'Allows managing finance configuration and policies.'
),
(
    'finance.hr_comp_events',
    'Finance HR Compensation Events',
    'Allows ingesting and reviewing HR compensation events.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = excluded.name,
    description = excluded.description;

INSERT INTO public.roles (slug, name, description, is_superuser)
VALUES
(
    'finance_manager',
    'Finance Manager',
    'Oversees finance operations, approvals, and settings.',
    false
),
(
    'finance_operator',
    'Finance Operator',
    'Handles day-to-day invoicing, allocations, and payables.',
    false
),
(
    'finance_analyst',
    'Finance Analyst',
    'Read-focused role for finance reporting and analysis.',
    false
),
(
    'finance_approver',
    'Finance Approver',
    'Approves high-risk finance actions over thresholds.',
    false
)
ON CONFLICT (slug) DO UPDATE
SET
    name = excluded.name,
    description = excluded.description,
    is_superuser = excluded.is_superuser;

WITH permissions_map AS (
    SELECT id, slug
    FROM public.permissions
    WHERE slug LIKE 'finance.%'
),
role_map AS (
    SELECT id, slug
    FROM public.roles
    WHERE slug IN (
        'admin',
        'management',
        'coordinator',
        'finance_manager',
        'finance_operator',
        'finance_analyst',
        'finance_approver'
    )
),
role_permission_seed AS (
    SELECT
        role_map.id AS role_id,
        permissions_map.id AS permission_id
    FROM role_map
    JOIN permissions_map
        ON (
            role_map.slug IN ('admin', 'management', 'finance_manager')
            OR (
                role_map.slug IN ('coordinator', 'finance_operator')
                AND permissions_map.slug IN (
                    'finance.access',
                    'finance.shared',
                    'finance.orders',
                    'finance.invoices',
                    'finance.payments',
                    'finance.payables',
                    'finance.reports'
                )
            )
            OR (
                role_map.slug = 'finance_analyst'
                AND permissions_map.slug IN (
                    'finance.access',
                    'finance.shared',
                    'finance.reports'
                )
            )
            OR (
                role_map.slug = 'finance_approver'
                AND permissions_map.slug IN (
                    'finance.access',
                    'finance.shared',
                    'finance.approvals',
                    'finance.reports'
                )
            )
        )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM role_permission_seed
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
