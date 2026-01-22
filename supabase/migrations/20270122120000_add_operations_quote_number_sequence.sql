-- Add yearly quote number generator for operations quotes
BEGIN;

CREATE TABLE IF NOT EXISTS public.operations_quote_sequences (
    quote_year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'operations_quote_sequences'
            AND column_name = 'year'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'operations_quote_sequences'
                AND column_name = 'quote_year'
        ) THEN
            ALTER TABLE public.operations_quote_sequences
            RENAME COLUMN "year" TO quote_year;
        END IF;
    END IF;
END;
$$;

ALTER TABLE public.operations_quote_sequences
ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
REVOKE ALL ON TABLE public.operations_quote_sequences
FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.operations_quote_sequences TO service_role;

DROP POLICY IF EXISTS service_role_manages_operations_quote_sequences
ON public.operations_quote_sequences;
CREATE POLICY service_role_manages_operations_quote_sequences
ON public.operations_quote_sequences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.next_operations_quote_number(
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
    INSERT INTO public.operations_quote_sequences (quote_year, last_number)
    VALUES (p_year, 1)
    ON CONFLICT (quote_year) DO UPDATE
    SET last_number = public.operations_quote_sequences.last_number + 1,
        updated_at = timezone('utc', now())
    RETURNING public.operations_quote_sequences.last_number INTO next_number;

    RETURN format(
        'QT-%s-%s',
        p_year,
        lpad(next_number::text, 5, '0')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.next_operations_quote_number(INTEGER)
FROM public;
GRANT EXECUTE ON FUNCTION public.next_operations_quote_number(INTEGER)
TO service_role;

-- Seed sequence table from existing quote numbers.
WITH parsed AS (
    SELECT
        regexp_match(
            quote_number,
            '^QT-(\d{4})-(\d+)$'
        ) AS matches
    FROM public.operations_quotes
),

numbers AS (
    SELECT
        (matches)[1]::INTEGER AS quote_year,
        (matches)[2]::INTEGER AS seq
    FROM parsed
    WHERE matches IS NOT null
)

INSERT INTO public.operations_quote_sequences (quote_year, last_number)
SELECT
    quote_year,
    max(seq) AS last_number
FROM numbers
GROUP BY quote_year
ON CONFLICT (quote_year) DO UPDATE
    SET
        last_number = greatest(
            public.operations_quote_sequences.last_number,
            excluded.last_number
        );

-- De-duplicate existing quote numbers before adding constraint.
WITH duplicates AS (
    SELECT
        id,
        quote_date,
        row_number() OVER (
            PARTITION BY quote_number
            ORDER BY created_at, id
        ) AS rn
    FROM public.operations_quotes
)

UPDATE public.operations_quotes AS quotes
SET
    quote_number = public.next_operations_quote_number(
        extract(YEAR FROM duplicates.quote_date)::INTEGER
    )
FROM
    duplicates
WHERE
    quotes.id = duplicates.id
    AND duplicates.rn > 1;

ALTER TABLE public.operations_quotes
ALTER COLUMN quote_number
SET DEFAULT public.next_operations_quote_number();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'operations_quotes_quote_number_unique'
        AND conrelid = 'public.operations_quotes'::regclass
    ) THEN
        ALTER TABLE public.operations_quotes
        ADD CONSTRAINT operations_quotes_quote_number_unique
        UNIQUE (quote_number);
    END IF;
END;
$$;

COMMIT;
