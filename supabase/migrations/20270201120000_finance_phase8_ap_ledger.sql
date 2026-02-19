BEGIN;

-- ---------------------------------------------------------------------------
-- Payable numbering
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_payable_sequences (
    payable_year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION public.next_finance_payable_number(
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
    INSERT INTO public.finance_payable_sequences (payable_year, last_number)
    VALUES (p_year, 1)
    ON CONFLICT (payable_year) DO UPDATE
    SET
        last_number = public.finance_payable_sequences.last_number + 1,
        updated_at = timezone('utc', now())
    RETURNING public.finance_payable_sequences.last_number INTO next_number;

    RETURN format(
        'PAY-%s-%s',
        p_year,
        lpad(next_number::text, 5, '0')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.next_finance_payable_number(INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.next_finance_payable_number(
    INTEGER
) TO service_role;

ALTER TABLE public.finance_payables
ALTER COLUMN payable_number SET DEFAULT public.next_finance_payable_number();

-- ---------------------------------------------------------------------------
-- Finance settings extensions
-- ---------------------------------------------------------------------------
ALTER TABLE public.finance_settings
ADD COLUMN IF NOT EXISTS approval_thresholds JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS posting_accounts JSONB NOT NULL DEFAULT '{}'::JSONB;

UPDATE public.finance_settings
SET
    base_currency = 'EGP',
    approval_thresholds = jsonb_strip_nulls(
        coalesce(approval_thresholds, '{}'::JSONB)
        || jsonb_build_object(
            'payable_submit',
            jsonb_build_object(
                'EGP', 100000,
                'USD', 2000,
                'EUR', 1800,
                'GBP', 1600,
                'SAR', 7500,
                'AED', 7300
            ),
            'payable_payment',
            jsonb_build_object(
                'EGP', 100000,
                'USD', 2000,
                'EUR', 1800,
                'GBP', 1600,
                'SAR', 7500,
                'AED', 7300
            )
        )
    ),
    posting_accounts = jsonb_strip_nulls(
        coalesce(posting_accounts, '{}'::JSONB)
        || jsonb_build_object(
            'accounts_receivable', '1100',
            'cash_bank', '1000',
            'accounts_payable', '2100',
            'revenue', '4000',
            'contra_revenue', '4050',
            'expense', '5000',
            'cogs', '5100',
            'writeoff_expense', '6200',
            'fx_gain_loss', '7000'
        )
    );

-- ---------------------------------------------------------------------------
-- AP posting traceability + controls
-- ---------------------------------------------------------------------------
ALTER TABLE public.finance_payable_lines
ADD COLUMN IF NOT EXISTS finance_chart_account_id UUID
REFERENCES public.finance_chart_accounts (id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_payable_lines_chart_account
ON public.finance_payable_lines (finance_chart_account_id);

ALTER TABLE public.finance_payable_payments
ADD COLUMN IF NOT EXISTS status public.FINANCE_PAYMENT_STATUS
NOT NULL DEFAULT 'recorded',
ADD COLUMN IF NOT EXISTS payment_method public.FINANCE_PAYMENT_METHOD
NOT NULL DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(18, 8),
ADD COLUMN IF NOT EXISTS payment_group_id UUID,
ADD COLUMN IF NOT EXISTS posted_journal_entry_id UUID
REFERENCES public.finance_journal_entries (id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_payable_payments_group
ON public.finance_payable_payments (payment_group_id);

CREATE INDEX IF NOT EXISTS idx_finance_payable_payments_status
ON public.finance_payable_payments (status);

ALTER TABLE public.finance_invoices
ADD COLUMN IF NOT EXISTS posted_journal_entry_id UUID
REFERENCES public.finance_journal_entries (id)
ON DELETE SET NULL;

ALTER TABLE public.finance_payments
ADD COLUMN IF NOT EXISTS posted_journal_entry_id UUID
REFERENCES public.finance_journal_entries (id)
ON DELETE SET NULL;

ALTER TABLE public.finance_credit_adjustments
ADD COLUMN IF NOT EXISTS posted_journal_entry_id UUID
REFERENCES public.finance_journal_entries (id)
ON DELETE SET NULL;

ALTER TABLE public.finance_payables
ADD COLUMN IF NOT EXISTS posted_journal_entry_id UUID
REFERENCES public.finance_journal_entries (id)
ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_journal_entries_source_unique
ON public.finance_journal_entries (source_type, source_id)
WHERE source_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Seed chart of accounts defaults
-- ---------------------------------------------------------------------------
INSERT INTO public.finance_chart_accounts (
    account_code,
    name,
    account_type,
    is_active,
    metadata
)
VALUES
('1000', 'Cash and Bank', 'asset', TRUE, '{"category":"current_asset"}'::JSONB),
(
    '1100',
    'Accounts Receivable',
    'asset',
    TRUE,
    '{"category":"current_asset"}'::JSONB
),
(
    '2100',
    'Accounts Payable',
    'liability',
    TRUE,
    '{"category":"current_liability"}'::JSONB
),
('3000', 'Owner Equity', 'equity', TRUE, '{"category":"equity"}'::JSONB),
(
    '4000',
    'Service Revenue',
    'revenue',
    TRUE,
    '{"category":"operating_revenue"}'::JSONB
),
(
    '4050',
    'Refunds and Discounts',
    'contra_revenue',
    TRUE,
    '{"category":"contra_revenue"}'::JSONB
),
(
    '5000',
    'Operating Expense',
    'expense',
    TRUE,
    '{"category":"operating_expense"}'::JSONB
),
(
    '5100',
    'Cost of Services',
    'cogs',
    TRUE,
    '{"category":"cost_of_sales"}'::JSONB
),
(
    '6200',
    'Write-off Expense',
    'expense',
    TRUE,
    '{"category":"non_operating_expense"}'::JSONB
),
(
    '7000',
    'FX Gain/Loss',
    'other_income_expense',
    TRUE,
    '{"category":"fx_result"}'::JSONB
)
ON CONFLICT (account_code) DO UPDATE
    SET
        name = excluded.name,
        account_type = excluded.account_type,
        is_active = excluded.is_active,
        metadata = excluded.metadata;

-- ---------------------------------------------------------------------------
-- Service role policies for new table
-- ---------------------------------------------------------------------------
ALTER TABLE public.finance_payable_sequences ENABLE ROW LEVEL SECURITY;
GRANT SELECT,
INSERT,
UPDATE,
DELETE ON TABLE public.finance_payable_sequences TO service_role;
DROP POLICY IF EXISTS service_role_manages_finance_payable_sequences
ON public.finance_payable_sequences;
CREATE POLICY service_role_manages_finance_payable_sequences
ON public.finance_payable_sequences
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

DROP TRIGGER IF EXISTS finance_payable_sequences_set_updated_at
ON public.finance_payable_sequences;
CREATE TRIGGER finance_payable_sequences_set_updated_at
BEFORE UPDATE ON public.finance_payable_sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
