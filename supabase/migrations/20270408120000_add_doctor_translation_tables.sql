BEGIN;

CREATE TABLE IF NOT EXISTS public.doctor_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
    locale text NOT NULL CHECK (locale IN ('ar')), -- noqa: RF04
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- noqa: RF04
    is_stale boolean NOT NULL DEFAULT false,
    source_updated_at timestamptz,
    name text, -- noqa: RF04
    title text,
    specialization text,
    bio text,
    education text,
    languages text [] NOT NULL DEFAULT '{}'::text [],
    achievements text [] NOT NULL DEFAULT '{}'::text [],
    certifications text [] NOT NULL DEFAULT '{}'::text [],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT doctor_translations_doctor_locale_key UNIQUE (doctor_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_doctor_translations_lookup
ON public.doctor_translations (doctor_id, locale, status);

CREATE OR REPLACE FUNCTION public.doctor_translations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_translations_updated_at
ON public.doctor_translations;
CREATE TRIGGER trg_doctor_translations_updated_at
BEFORE UPDATE ON public.doctor_translations
FOR EACH ROW
EXECUTE FUNCTION public.doctor_translations_set_updated_at();

ALTER TABLE public.doctor_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_doctor_translations ON public.doctor_translations;
CREATE POLICY read_doctor_translations
ON public.doctor_translations
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS write_doctor_translations ON public.doctor_translations;
CREATE POLICY write_doctor_translations
ON public.doctor_translations
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

COMMIT;
