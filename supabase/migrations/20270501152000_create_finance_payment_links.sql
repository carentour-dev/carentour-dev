-- Manual patient-facing Stripe payment links for externally generated links.
CREATE TABLE IF NOT EXISTS public.finance_payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    finance_invoice_id UUID REFERENCES public.finance_invoices (id) ON DELETE SET NULL,
    finance_invoice_installment_id UUID REFERENCES public.finance_invoice_installments (id) ON DELETE SET NULL,
    link_label TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'paid', 'expired')),
    expires_at TIMESTAMPTZ,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'finance_payment_links'
            AND column_name = 'label'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'finance_payment_links'
            AND column_name = 'link_label'
    ) THEN
        ALTER TABLE public.finance_payment_links RENAME COLUMN label TO link_label;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'finance_payment_links'
            AND column_name = 'url'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'finance_payment_links'
            AND column_name = 'payment_url'
    ) THEN
        ALTER TABLE public.finance_payment_links RENAME COLUMN url TO payment_url;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_finance_payment_links_patient_status
ON public.finance_payment_links (patient_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_finance_payment_links_invoice
ON public.finance_payment_links (finance_invoice_id, status);

CREATE INDEX IF NOT EXISTS idx_finance_payment_links_installment
ON public.finance_payment_links (finance_invoice_installment_id);

ALTER TABLE public.finance_payment_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_payment_links TO service_role;

DROP POLICY IF EXISTS service_role_manages_finance_payment_links
ON public.finance_payment_links;

CREATE POLICY service_role_manages_finance_payment_links
ON public.finance_payment_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS finance_payment_links_set_updated_at
ON public.finance_payment_links;

CREATE TRIGGER finance_payment_links_set_updated_at
BEFORE UPDATE ON public.finance_payment_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
