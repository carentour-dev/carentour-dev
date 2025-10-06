BEGIN;

-- Ensure the metadata table lives in the public schema for PostgREST access
CREATE TABLE IF NOT EXISTS public.treatment_metadata (
  treatment_id UUID PRIMARY KEY REFERENCES public.treatments(id) ON DELETE CASCADE,
  grade public.treatment_grade NOT NULL DEFAULT 'grade_c',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Timestamp maintenance trigger
CREATE OR REPLACE FUNCTION public.touch_treatment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_treatment_metadata ON public.treatment_metadata;
CREATE TRIGGER trg_touch_treatment_metadata
  BEFORE UPDATE ON public.treatment_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_treatment_metadata();

-- Migrate data from the old internal schema if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'internal'
      AND table_name = 'treatment_metadata'
  ) THEN
    INSERT INTO public.treatment_metadata (treatment_id, grade, updated_at)
    SELECT treatment_id, grade, updated_at
    FROM internal.treatment_metadata
    ON CONFLICT (treatment_id) DO UPDATE
      SET grade = EXCLUDED.grade,
          updated_at = EXCLUDED.updated_at;

    DROP TABLE internal.treatment_metadata;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'touch_treatment_metadata'
      AND n.nspname = 'internal'
  ) THEN
    DROP FUNCTION internal.touch_treatment_metadata();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'internal'
  ) THEN
    DROP SCHEMA internal;
  END IF;
END;
$$;

-- Lock down access so only privileged roles can read/update
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_metadata TO service_role;

ALTER TABLE public.treatment_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage treatment metadata" ON public.treatment_metadata;
CREATE POLICY "Service role can manage treatment metadata"
  ON public.treatment_metadata
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
