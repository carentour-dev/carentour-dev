-- Make standalone paid payment links visible in finance accounting as customer credits.
UPDATE public.finance_settings
SET posting_accounts = jsonb_strip_nulls(
    coalesce(posting_accounts, '{}'::JSONB)
    || jsonb_build_object('customer_credits', '2200')
);

INSERT INTO public.finance_chart_accounts (
    account_code,
    name,
    account_type,
    is_active,
    metadata
)
VALUES (
    '2200',
    'Customer Credits',
    'liability',
    TRUE,
    '{"category":"current_liability"}'::JSONB
)
ON CONFLICT (account_code) DO UPDATE
    SET
        name = excluded.name,
        account_type = excluded.account_type,
        is_active = excluded.is_active,
        metadata = excluded.metadata;

-- Patient-credit payment posting is handled by the application ledger backfill
-- so the normal FX conversion path is used.
