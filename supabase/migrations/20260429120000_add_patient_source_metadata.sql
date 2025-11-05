-- Track how patient records are created and by whom.
-- migrate:up
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'patient_source'
          AND pg_type.typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.patient_source AS ENUM (
            'organic',
            'staff',
            'imported'
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'patient_creation_channel'
          AND pg_type.typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.patient_creation_channel AS ENUM (
            'portal_signup',
            'admin_console',
            'operations_dashboard',
            'api',
            'import',
            'unknown'
        );
    END IF;
END;
$$;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS source public.patient_source,
ADD COLUMN IF NOT EXISTS created_by_profile_id uuid,
ADD COLUMN IF NOT EXISTS created_channel public.patient_creation_channel;

ALTER TABLE public.patients
ADD CONSTRAINT patients_created_by_profile_id_fkey
FOREIGN KEY (created_by_profile_id)
REFERENCES public.profiles (id)
ON DELETE SET NULL;

UPDATE public.patients
SET source = COALESCE(source, 'organic');

ALTER TABLE public.patients
ALTER COLUMN source
SET DEFAULT 'organic';

ALTER TABLE public.patients
ALTER COLUMN source
SET NOT NULL;

UPDATE public.patients
SET created_channel = COALESCE(created_channel, 'unknown');

ALTER TABLE public.patients
ALTER COLUMN created_channel
SET DEFAULT 'unknown';

ALTER TABLE public.patients
ALTER COLUMN created_channel
SET NOT NULL;

COMMENT ON TYPE public.patient_source IS
'Indicates whether the patient record originated organically or via staff.';

COMMENT ON COLUMN public.patients.source IS
'Patient acquisition source. Organic denotes portal signup.';

COMMENT ON COLUMN public.patients.created_by_profile_id IS
'Profile that created the patient record in the backoffice.';

COMMENT ON TYPE public.patient_creation_channel IS
'Channel used to create the patient record.';

COMMENT ON COLUMN public.patients.created_channel IS
'Channel that created the patient record (admin, operations, portal, etc).';

CREATE INDEX IF NOT EXISTS idx_patients_created_by_profile_id
ON public.patients (created_by_profile_id);

COMMIT;

-- migrate:down
BEGIN;

DROP INDEX IF EXISTS idx_patients_created_by_profile_id;

ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_created_by_profile_id_fkey,
DROP COLUMN IF EXISTS created_by_profile_id,
DROP COLUMN IF EXISTS created_channel,
DROP COLUMN IF EXISTS source;

DROP TYPE IF EXISTS public.patient_creation_channel;
DROP TYPE IF EXISTS public.patient_source;

COMMIT;
