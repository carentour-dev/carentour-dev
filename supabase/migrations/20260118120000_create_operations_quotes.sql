-- Create saved quotations for Operations calculator
BEGIN;

CREATE TABLE IF NOT EXISTS public.operations_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    owner_profile_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    quote_date DATE NOT NULL,
    client_type TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    country TEXT NOT NULL,
    age INTEGER,
    input_data JSONB NOT NULL,
    computed_data JSONB NOT NULL,
    subtotal_usd NUMERIC,
    profit_margin NUMERIC,
    profit_amount_usd NUMERIC,
    final_price_usd NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS operations_quotes_owner_created_idx
ON public.operations_quotes (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operations_quotes_owner_quote_number_idx
ON public.operations_quotes (owner_user_id, quote_number);

ALTER TABLE public.operations_quotes
ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_quotes
TO authenticated;

DROP POLICY IF EXISTS operations_quotes_owner_policy
ON public.operations_quotes;
CREATE POLICY operations_quotes_owner_policy
ON public.operations_quotes
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP TRIGGER IF EXISTS operations_quotes_set_updated_at
ON public.operations_quotes;
CREATE TRIGGER operations_quotes_set_updated_at
BEFORE UPDATE ON public.operations_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
