-- Create enum for internal treatment grading
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'treatment_grade'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.treatment_grade AS ENUM ('grade_a', 'grade_b', 'grade_c');
  END IF;
END;
$$;

-- Internal schema to isolate operational tables
CREATE SCHEMA IF NOT EXISTS internal;

-- Store per-treatment internal grade metadata
CREATE TABLE IF NOT EXISTS internal.treatment_metadata (
  treatment_id UUID PRIMARY KEY REFERENCES public.treatments(id) ON DELETE CASCADE,
  grade public.treatment_grade NOT NULL DEFAULT 'grade_c',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Automatically keep timestamps current
CREATE OR REPLACE FUNCTION internal.touch_treatment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_treatment_metadata ON internal.treatment_metadata;
CREATE TRIGGER trg_touch_treatment_metadata
  BEFORE UPDATE ON internal.treatment_metadata
  FOR EACH ROW
  EXECUTE FUNCTION internal.touch_treatment_metadata();

-- Seed defaults for existing treatments
INSERT INTO internal.treatment_metadata (treatment_id)
SELECT id FROM public.treatments
ON CONFLICT (treatment_id) DO NOTHING;

-- Ensure correct privileges and RLS policies
GRANT USAGE ON SCHEMA internal TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON internal.treatment_metadata TO service_role;

ALTER TABLE internal.treatment_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage treatment metadata" ON internal.treatment_metadata;
CREATE POLICY "Service role can manage treatment metadata"
  ON internal.treatment_metadata
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
