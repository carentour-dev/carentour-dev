-- Track manual email verification for patients captured via the admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patients'
      AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.patients
      ADD COLUMN email_verified BOOLEAN;
  END IF;
END;
$$;

UPDATE public.patients
SET email_verified = COALESCE(email_verified, false);

ALTER TABLE public.patients
  ALTER COLUMN email_verified SET DEFAULT false;

ALTER TABLE public.patients
  ALTER COLUMN email_verified SET NOT NULL;

COMMENT ON COLUMN public.patients.email_verified IS
  'Indicates whether an administrator has marked the patient''s email as verified.';
