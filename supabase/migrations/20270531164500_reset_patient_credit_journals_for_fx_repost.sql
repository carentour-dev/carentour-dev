-- Reset patient-credit journals that were posted without FX conversion.
-- The app ledger backfill will repost them through the normal FX-aware path.
WITH reset_entries AS (
    SELECT
        entry.id AS journal_entry_id,
        payment.id AS payment_id
    FROM public.finance_journal_entries AS entry
    INNER JOIN public.finance_payments AS payment
        ON entry.source_id = payment.id
    INNER JOIN public.finance_patient_credits AS credit
        ON payment.id = credit.finance_payment_id
    WHERE
        entry.source_type = 'finance_payment_posted'
        AND entry.entry_number LIKE 'JRN-CREDIT-%'
        AND payment.payment_reference LIKE 'payment-link:%'
),

deleted_lines AS (
    DELETE FROM public.finance_journal_lines AS journal_line
    USING reset_entries
    WHERE journal_line.finance_journal_entry_id = reset_entries.journal_entry_id
),

deleted_entries AS (
    DELETE FROM public.finance_journal_entries AS entry
    USING reset_entries
    WHERE entry.id = reset_entries.journal_entry_id
)

UPDATE public.finance_payments AS payment
SET
    status = 'recorded',
    posted_journal_entry_id = NULL,
    fx_rate = NULL
FROM reset_entries
WHERE payment.id = reset_entries.payment_id;
