-- Align patient portal data model with admin console requirements.
BEGIN;

-- Extend contact requests with authenticated user linkage and metadata.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contact_requests'
      AND table_schema = 'public'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contact_requests'
      AND table_schema = 'public'
      AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contact_requests'
      AND table_schema = 'public'
      AND column_name = 'origin'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN origin TEXT NOT NULL DEFAULT 'web';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contact_requests'
      AND table_schema = 'public'
      AND column_name = 'portal_metadata'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN portal_metadata JSONB;
  END IF;
END;
$$;

-- Refresh indexes to support lookups by authenticated user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND indexname = 'idx_contact_requests_user_id'
  ) THEN
    CREATE INDEX idx_contact_requests_user_id ON public.contact_requests(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND indexname = 'idx_contact_requests_patient_id'
  ) THEN
    CREATE INDEX idx_contact_requests_patient_id ON public.contact_requests(patient_id);
  END IF;
END;
$$;

-- Tie existing contact requests to known users and patients where possible.
UPDATE public.contact_requests AS cr
SET user_id = p.user_id
FROM public.profiles AS p
WHERE cr.user_id IS NULL
  AND p.email IS NOT NULL
  AND lower(p.email) = lower(cr.email);

UPDATE public.contact_requests AS cr
SET patient_id = pt.id
FROM public.patients AS pt
WHERE cr.patient_id IS NULL
  AND pt.contact_email IS NOT NULL
  AND lower(pt.contact_email) = lower(cr.email);

UPDATE public.contact_requests
SET origin = 'portal'
WHERE origin = 'web'
  AND user_id IS NOT NULL;

-- Refresh RLS policies so authenticated patients can read their own submissions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Anyone can submit a contact request'
  ) THEN
    DROP POLICY "Anyone can submit a contact request" ON public.contact_requests;
  END IF;

  CREATE POLICY "Anyone can submit a contact request"
    ON public.contact_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      (user_id IS NULL AND patient_id IS NULL)
      OR (
        (SELECT auth.uid()) IS NOT NULL
        AND user_id = (SELECT auth.uid())
        AND (
          patient_id IS NULL
          OR patient_id IN (
            SELECT id FROM public.patients WHERE user_id = (SELECT auth.uid())
          )
        )
      )
    );

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Patients can view their contact requests'
  ) THEN
    CREATE POLICY "Patients can view their contact requests"
      ON public.contact_requests
      FOR SELECT
      TO authenticated
      USING (
        user_id = (SELECT auth.uid())
        OR (
          patient_id IS NOT NULL
          AND patient_id IN (
            SELECT id FROM public.patients WHERE user_id = (SELECT auth.uid())
          )
        )
      );
  END IF;

  -- Maintain the existing service role management policy if it was dropped earlier.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Service role manages contact requests'
  ) THEN
    CREATE POLICY "Service role manages contact requests"
      ON public.contact_requests
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Allow patients to manage their own doctor reviews while keeping admin oversight.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'doctor_reviews'
      AND policyname = 'Patients can write doctor reviews'
  ) THEN
    CREATE POLICY "Patients can write doctor reviews"
      ON public.doctor_reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'doctor_reviews'
      AND policyname = 'Patients can update their doctor reviews'
  ) THEN
    CREATE POLICY "Patients can update their doctor reviews"
      ON public.doctor_reviews
      FOR UPDATE
      TO authenticated
      USING (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'doctor_reviews'
      AND policyname = 'Patients can delete their doctor reviews'
  ) THEN
    CREATE POLICY "Patients can delete their doctor reviews"
      ON public.doctor_reviews
      FOR DELETE
      TO authenticated
      USING (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'doctor_reviews'
      AND policyname = 'Service role manages doctor reviews'
  ) THEN
    CREATE POLICY "Service role manages doctor reviews"
      ON public.doctor_reviews
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Ensure patient records remain unique per authenticated user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND indexname = 'idx_patients_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_patients_user_id_unique
      ON public.patients(user_id)
      WHERE user_id IS NOT NULL;
  END IF;
END;
$$;

-- Consultation scheduling domain ------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_status') THEN
    CREATE TYPE public.consultation_status AS ENUM ('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.patient_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_request_id UUID REFERENCES public.contact_requests(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.consultation_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  timezone TEXT,
  location TEXT,
  meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_consultations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND policyname = 'Patients can view their consultations'
  ) THEN
    CREATE POLICY "Patients can view their consultations"
      ON public.patient_consultations
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        OR patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND policyname = 'Service role manages patient consultations'
  ) THEN
    CREATE POLICY "Service role manages patient consultations"
      ON public.patient_consultations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_patient_consultations_updated_at'
      AND tgrelid = 'public.patient_consultations'::regclass
  ) THEN
    CREATE TRIGGER update_patient_consultations_updated_at
      BEFORE UPDATE ON public.patient_consultations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND indexname = 'idx_patient_consultations_patient_id'
  ) THEN
    CREATE INDEX idx_patient_consultations_patient_id
      ON public.patient_consultations(patient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND indexname = 'idx_patient_consultations_user_id'
  ) THEN
    CREATE INDEX idx_patient_consultations_user_id
      ON public.patient_consultations(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND indexname = 'idx_patient_consultations_scheduled_at'
  ) THEN
    CREATE INDEX idx_patient_consultations_scheduled_at
      ON public.patient_consultations(scheduled_at DESC);
  END IF;
END;
$$;

-- Appointment scheduling domain -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.patient_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.patient_consultations(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT,
  location TEXT,
  pre_visit_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT patient_appointments_time_check CHECK (
    ends_at IS NULL OR ends_at >= starts_at
  )
);

ALTER TABLE public.patient_appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_appointments'
      AND policyname = 'Patients can view their appointments'
  ) THEN
    CREATE POLICY "Patients can view their appointments"
      ON public.patient_appointments
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        OR patient_id IN (
          SELECT id FROM public.patients WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_appointments'
      AND policyname = 'Service role manages patient appointments'
  ) THEN
    CREATE POLICY "Service role manages patient appointments"
      ON public.patient_appointments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_patient_appointments_updated_at'
      AND tgrelid = 'public.patient_appointments'::regclass
  ) THEN
    CREATE TRIGGER update_patient_appointments_updated_at
      BEFORE UPDATE ON public.patient_appointments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_appointments'
      AND indexname = 'idx_patient_appointments_patient_id'
  ) THEN
    CREATE INDEX idx_patient_appointments_patient_id
      ON public.patient_appointments(patient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_appointments'
      AND indexname = 'idx_patient_appointments_user_id'
  ) THEN
    CREATE INDEX idx_patient_appointments_user_id
      ON public.patient_appointments(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'patient_appointments'
      AND indexname = 'idx_patient_appointments_starts_at'
  ) THEN
    CREATE INDEX idx_patient_appointments_starts_at
      ON public.patient_appointments(starts_at DESC);
  END IF;
END;
$$;

COMMIT;
