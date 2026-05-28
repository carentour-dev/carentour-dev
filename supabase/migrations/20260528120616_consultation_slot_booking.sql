BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'consultation_booking_type'
  ) THEN
    CREATE TYPE public.consultation_booking_type AS ENUM (
      'onsite',
      'phone',
      'video'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'consultation_slot_status'
  ) THEN
    CREATE TYPE public.consultation_slot_status AS ENUM (
      'available',
      'held',
      'booked',
      'blocked',
      'cancelled'
    );
  END IF;
END;
$$;

ALTER TABLE public.patient_consultations
ADD COLUMN IF NOT EXISTS booking_type public.consultation_booking_type NOT NULL DEFAULT 'video',
ADD COLUMN IF NOT EXISTS consultation_slot_id uuid;

CREATE TABLE IF NOT EXISTS public.consultation_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
    patient_consultation_id uuid REFERENCES public.patient_consultations (id) ON DELETE SET NULL,
    booking_type public.consultation_booking_type NOT NULL DEFAULT 'video',
    status public.consultation_slot_status NOT NULL DEFAULT 'available',
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    timezone text NOT NULL DEFAULT 'UTC',
    location text, -- noqa: RF04
    meeting_url text,
    notes text,
    hold_expires_at timestamptz,
    created_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT consultation_slots_time_check CHECK (ends_at > starts_at),
    CONSTRAINT consultation_slots_hold_check CHECK (
        (status = 'held' AND hold_expires_at IS NOT NULL)
        OR (status <> 'held')
    )
);

ALTER TABLE public.patient_consultations
DROP CONSTRAINT IF EXISTS patient_consultations_slot_fkey;

ALTER TABLE public.patient_consultations
ADD CONSTRAINT patient_consultations_slot_fkey
FOREIGN KEY (consultation_slot_id)
REFERENCES public.consultation_slots (id)
ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_consultations_slot_unique
ON public.patient_consultations (consultation_slot_id)
WHERE consultation_slot_id IS NOT NULL
AND status IN ('scheduled', 'rescheduled', 'completed');

CREATE INDEX IF NOT EXISTS idx_patient_consultations_booking_type
ON public.patient_consultations (booking_type);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_doctor_time
ON public.consultation_slots (doctor_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_status_time
ON public.consultation_slots (status, starts_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_consultation_slots_consultation_unique
ON public.consultation_slots (patient_consultation_id)
WHERE patient_consultation_id IS NOT NULL;

ALTER TABLE public.consultation_slots
DROP CONSTRAINT IF EXISTS consultation_slots_no_active_overlap;

ALTER TABLE public.consultation_slots
ADD CONSTRAINT consultation_slots_no_active_overlap
EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('available', 'held', 'booked'));

ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultation_slots'
      AND policyname = 'Available consultation slots are public'
  ) THEN
    CREATE POLICY "Available consultation slots are public"
      ON public.consultation_slots
      FOR SELECT
      TO anon, authenticated
      USING (
        status = 'available'
        AND starts_at >= now()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultation_slots'
      AND policyname = 'Service role manages consultation slots'
  ) THEN
    CREATE POLICY "Service role manages consultation slots"
      ON public.consultation_slots
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
    WHERE tgname = 'update_consultation_slots_updated_at'
      AND tgrelid = 'public.consultation_slots'::regclass
  ) THEN
    CREATE TRIGGER update_consultation_slots_updated_at
      BEFORE UPDATE ON public.consultation_slots
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_consultation_slot(
    p_slot_id uuid,
    p_patient_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_contact_request_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS public.patient_consultations
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slot public.consultation_slots%ROWTYPE;
  v_patient_user_id uuid;
  v_consultation public.patient_consultations%ROWTYPE;
BEGIN
  SELECT *
  INTO v_slot
  FROM public.consultation_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation slot not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_slot.status <> 'available' OR v_slot.starts_at < now() THEN
    RAISE EXCEPTION 'Consultation slot is no longer available'
      USING ERRCODE = '23505';
  END IF;

  SELECT user_id
  INTO v_patient_user_id
  FROM public.patients
  WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient not found'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.patient_consultations (
    patient_id,
    user_id,
    contact_request_id,
    doctor_id,
    status,
    scheduled_at,
    duration_minutes,
    timezone,
    location,
    meeting_url,
    notes,
    booking_type,
    consultation_slot_id
  )
  VALUES (
    p_patient_id,
    COALESCE(p_user_id, v_patient_user_id),
    p_contact_request_id,
    v_slot.doctor_id,
    'scheduled',
    v_slot.starts_at,
    CEIL(EXTRACT(EPOCH FROM (v_slot.ends_at - v_slot.starts_at)) / 60)::integer,
    v_slot.timezone,
    v_slot.location,
    v_slot.meeting_url,
    p_notes,
    v_slot.booking_type,
    v_slot.id
  )
  RETURNING *
  INTO v_consultation;

  UPDATE public.consultation_slots
  SET status = 'booked',
      patient_consultation_id = v_consultation.id,
      hold_expires_at = NULL
  WHERE id = v_slot.id;

  RETURN v_consultation;
END;
$$;

REVOKE ALL ON FUNCTION public.book_consultation_slot(uuid, uuid, uuid, uuid, text)
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_consultation_slot(uuid, uuid, uuid, uuid, text)
TO service_role;

COMMIT;
