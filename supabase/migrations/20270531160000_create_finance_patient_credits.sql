-- Patient-level unapplied credits for paid payment links that are not tied to invoices.
CREATE TABLE IF NOT EXISTS public.finance_patient_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    finance_payment_id UUID REFERENCES public.finance_payments (id) ON DELETE SET NULL,
    finance_payment_link_id UUID REFERENCES public.finance_payment_links (id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    applied_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (applied_amount >= 0),
    balance_amount NUMERIC(14, 2) NOT NULL CHECK (balance_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'unapplied' CHECK (status IN ('unapplied', 'partially_applied', 'applied', 'void')),
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT finance_patient_credits_amount_balance_check
    CHECK (applied_amount + balance_amount <= amount)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_patient_credits_payment
ON public.finance_patient_credits (finance_payment_id)
WHERE finance_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_patient_credits_payment_link
ON public.finance_patient_credits (finance_payment_link_id)
WHERE finance_payment_link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_patient_credits_patient_status
ON public.finance_patient_credits (patient_id, status, currency);

ALTER TABLE public.finance_patient_credits ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_patient_credits TO service_role;

DROP POLICY IF EXISTS service_role_manages_finance_patient_credits
ON public.finance_patient_credits;

CREATE POLICY service_role_manages_finance_patient_credits
ON public.finance_patient_credits
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

DROP TRIGGER IF EXISTS finance_patient_credits_set_updated_at
ON public.finance_patient_credits;

CREATE TRIGGER finance_patient_credits_set_updated_at
BEFORE UPDATE ON public.finance_patient_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill already-paid standalone links so existing patient-level payments reduce the net balance.
INSERT INTO public.finance_payments (
    payment_reference,
    status,
    payment_method,
    payment_date,
    currency,
    amount,
    source,
    notes,
    created_by_profile_id,
    created_at,
    updated_at
)
SELECT
    'payment-link:' || link.id::TEXT AS payment_reference,
    'recorded' AS status,
    'gateway' AS payment_method,
    coalesce(link.updated_at, link.created_at, now()) AS payment_date,
    link.currency,
    link.amount,
    'payment_link' AS source,
    (
        'Backfilled unapplied patient credit from paid payment link '
        || link.link_label
    ) AS notes,
    link.created_by_profile_id,
    coalesce(link.created_at, now()) AS created_at,
    now() AS updated_at
FROM public.finance_payment_links AS link
WHERE
    link.status = 'paid'
    AND link.finance_invoice_id IS NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.finance_payments AS payment
        WHERE payment.payment_reference = 'payment-link:' || link.id::TEXT
    );

INSERT INTO public.finance_patient_credits (
    patient_id,
    finance_payment_id,
    finance_payment_link_id,
    amount,
    applied_amount,
    balance_amount,
    currency,
    status,
    notes,
    created_by_profile_id,
    created_at,
    updated_at
)
SELECT
    link.patient_id,
    payment.id AS finance_payment_id,
    link.id AS finance_payment_link_id,
    link.amount,
    0 AS applied_amount,
    link.amount AS balance_amount,
    link.currency,
    'unapplied' AS status,
    (
        'Backfilled from paid standalone payment link '
        || link.link_label
    ) AS notes,
    link.created_by_profile_id,
    coalesce(link.created_at, now()) AS created_at,
    now() AS updated_at
FROM public.finance_payment_links AS link
INNER JOIN public.finance_payments AS payment
    ON payment.payment_reference = 'payment-link:' || link.id::TEXT
WHERE
    link.status = 'paid'
    AND link.finance_invoice_id IS NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.finance_patient_credits AS credit
        WHERE credit.finance_payment_link_id = link.id
    );
