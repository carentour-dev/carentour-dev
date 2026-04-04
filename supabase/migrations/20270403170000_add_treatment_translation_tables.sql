BEGIN;

CREATE TABLE IF NOT EXISTS public.treatment_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id uuid NOT NULL REFERENCES public.treatments (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    is_stale boolean NOT NULL DEFAULT false,
    source_updated_at timestamptz,
    name text, -- noqa: RF04
    category_label text,
    summary text, -- noqa: RF04
    description text,
    overview text,
    ideal_candidates text [] NOT NULL DEFAULT '{}'::text [],
    seo jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT treatment_translations_treatment_locale_key UNIQUE (treatment_id, locale)
);

CREATE TABLE IF NOT EXISTS public.treatment_procedure_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_procedure_id uuid NOT NULL REFERENCES public.treatment_procedures (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    name text, -- noqa: RF04
    description text,
    duration text,
    recovery text,
    price text,
    success_rate text,
    candidate_requirements text [] NOT NULL DEFAULT '{}'::text [],
    recovery_stages jsonb NOT NULL DEFAULT '[]'::jsonb, -- noqa: RF04
    additional_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT treatment_procedure_translations_procedure_locale_key UNIQUE (treatment_procedure_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_treatment_translations_lookup
ON public.treatment_translations (treatment_id, locale, status);

CREATE INDEX IF NOT EXISTS idx_treatment_procedure_translations_lookup
ON public.treatment_procedure_translations (treatment_procedure_id, locale);

CREATE OR REPLACE FUNCTION public.treatment_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.treatment_procedure_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_treatment_translations_updated_at
ON public.treatment_translations;
CREATE TRIGGER trg_treatment_translations_updated_at
BEFORE UPDATE ON public.treatment_translations
FOR EACH ROW
EXECUTE FUNCTION public.treatment_translations_set_updated_at();

DROP TRIGGER IF EXISTS trg_treatment_procedure_translations_updated_at
ON public.treatment_procedure_translations;
CREATE TRIGGER trg_treatment_procedure_translations_updated_at
BEFORE UPDATE ON public.treatment_procedure_translations
FOR EACH ROW
EXECUTE FUNCTION public.treatment_procedure_translations_set_updated_at();

ALTER TABLE public.treatment_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_procedure_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_treatment_translations ON public.treatment_translations;
CREATE POLICY read_treatment_translations
ON public.treatment_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_treatment_translations ON public.treatment_translations;
CREATE POLICY write_treatment_translations
ON public.treatment_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS read_treatment_procedure_translations ON public.treatment_procedure_translations;
CREATE POLICY read_treatment_procedure_translations
ON public.treatment_procedure_translations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.treatment_procedures AS procedure_rows
        INNER JOIN public.treatment_translations AS translation_rows
            ON procedure_rows.treatment_id = translation_rows.treatment_id
        WHERE
            procedure_rows.id
            = treatment_procedure_translations.treatment_procedure_id
            AND translation_rows.locale = treatment_procedure_translations.locale
            AND (
                translation_rows.status = 'published'
                OR public.is_admin_or_editor()
            )
    )
);

DROP POLICY IF EXISTS write_treatment_procedure_translations ON public.treatment_procedure_translations;
CREATE POLICY write_treatment_procedure_translations
ON public.treatment_procedure_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

COMMIT;
