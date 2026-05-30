BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'appointment_booking_status'
  ) THEN
    CREATE TYPE public.appointment_booking_status AS ENUM (
      'requested',
      'held',
      'confirmed',
      'reschedule_requested',
      'cancelled',
      'expired',
      'completed',
      'no_show'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.appointment_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.patients (id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    contact_request_id uuid REFERENCES public.contact_requests (id) ON DELETE SET NULL,
    consultation_slot_id uuid REFERENCES public.consultation_slots (id) ON DELETE SET NULL,
    patient_consultation_id uuid REFERENCES public.patient_consultations (id) ON DELETE SET NULL,
    doctor_id uuid REFERENCES public.doctors (id) ON DELETE SET NULL,
    booking_type public.consultation_booking_type NOT NULL DEFAULT 'video',
    status public.appointment_booking_status NOT NULL DEFAULT 'requested',
    requested_starts_at timestamptz,
    requested_ends_at timestamptz,
    confirmed_starts_at timestamptz,
    confirmed_ends_at timestamptz,
    timezone text NOT NULL DEFAULT 'UTC',
    location text, -- noqa: RF04
    meeting_url text,
    hold_expires_at timestamptz,
    source text NOT NULL DEFAULT 'consultation_form',
    notes text,
    cancellation_reason text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT appointment_bookings_requested_time_check CHECK (
        requested_ends_at IS NULL
        OR requested_starts_at IS NULL
        OR requested_ends_at > requested_starts_at
    ),
    CONSTRAINT appointment_bookings_confirmed_time_check CHECK (
        confirmed_ends_at IS NULL
        OR confirmed_starts_at IS NULL
        OR confirmed_ends_at > confirmed_starts_at
    ),
    CONSTRAINT appointment_bookings_hold_check CHECK (
        (status = 'held' AND hold_expires_at IS NOT NULL)
        OR status <> 'held'
    ),
    CONSTRAINT appointment_bookings_confirmed_consultation_check CHECK (
        (status = 'confirmed' AND patient_consultation_id IS NOT NULL)
        OR status <> 'confirmed'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_bookings_contact_request_unique
ON public.appointment_bookings (contact_request_id)
WHERE contact_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_bookings_consultation_unique
ON public.appointment_bookings (patient_consultation_id)
WHERE patient_consultation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointment_bookings_patient_status
ON public.appointment_bookings (patient_id, status, requested_starts_at);

CREATE INDEX IF NOT EXISTS idx_appointment_bookings_user_status
ON public.appointment_bookings (user_id, status, requested_starts_at);

CREATE INDEX IF NOT EXISTS idx_appointment_bookings_slot_status
ON public.appointment_bookings (consultation_slot_id, status);

CREATE INDEX IF NOT EXISTS idx_appointment_bookings_hold_expiry
ON public.appointment_bookings (hold_expires_at)
WHERE status = 'held';

ALTER TABLE public.appointment_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointment_bookings'
      AND policyname = 'Patients can view their appointment bookings'
  ) THEN
    CREATE POLICY "Patients can view their appointment bookings"
      ON public.appointment_bookings
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

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointment_bookings'
      AND policyname = 'Service role manages appointment bookings'
  ) THEN
    CREATE POLICY "Service role manages appointment bookings"
      ON public.appointment_bookings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

GRANT SELECT ON public.appointment_bookings TO authenticated;
GRANT ALL ON public.appointment_bookings TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_appointment_bookings_updated_at'
      AND tgrelid = 'public.appointment_bookings'::regclass
  ) THEN
    CREATE TRIGGER update_appointment_bookings_updated_at
      BEFORE UPDATE ON public.appointment_bookings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.hold_appointment_booking_slot(
    p_booking_id uuid,
    p_slot_id uuid,
    p_patient_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_contact_request_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_hold_minutes integer DEFAULT 120
)
RETURNS public.appointment_bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slot public.consultation_slots%ROWTYPE;
  v_booking public.appointment_bookings%ROWTYPE;
  v_hold_expires_at timestamptz;
BEGIN
  IF p_hold_minutes IS NULL OR p_hold_minutes < 5 OR p_hold_minutes > 1440 THEN
    RAISE EXCEPTION 'Hold duration must be between 5 and 1440 minutes'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_booking
  FROM public.appointment_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment booking not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status NOT IN ('requested', 'held') THEN
    RAISE EXCEPTION 'Appointment booking cannot be held from its current status'
      USING ERRCODE = '23514';
  END IF;

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

  v_hold_expires_at := now() + make_interval(mins => p_hold_minutes);

  UPDATE public.consultation_slots
  SET status = 'held',
      hold_expires_at = v_hold_expires_at
  WHERE id = v_slot.id;

  UPDATE public.appointment_bookings
  SET patient_id = COALESCE(p_patient_id, patient_id),
      user_id = COALESCE(p_user_id, user_id),
      contact_request_id = COALESCE(p_contact_request_id, contact_request_id),
      consultation_slot_id = v_slot.id,
      doctor_id = v_slot.doctor_id,
      booking_type = v_slot.booking_type,
      status = 'held',
      requested_starts_at = v_slot.starts_at,
      requested_ends_at = v_slot.ends_at,
      timezone = v_slot.timezone,
      location = v_slot.location,
      meeting_url = v_slot.meeting_url,
      hold_expires_at = v_hold_expires_at,
      notes = COALESCE(p_notes, notes),
      metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object('heldAt', now(), 'holdMinutes', p_hold_minutes)
  WHERE id = v_booking.id
  RETURNING *
  INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_appointment_booking(
    p_booking_id uuid,
    p_slot_id uuid,
    p_patient_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_contact_request_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS public.appointment_bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slot public.consultation_slots%ROWTYPE;
  v_patient_user_id uuid;
  v_consultation public.patient_consultations%ROWTYPE;
  v_booking public.appointment_bookings%ROWTYPE;
BEGIN
  SELECT *
  INTO v_booking
  FROM public.appointment_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment booking not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status NOT IN ('requested', 'held') THEN
    RAISE EXCEPTION 'Appointment booking cannot be confirmed from its current status'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_slot
  FROM public.consultation_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation slot not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_slot.status = 'held' AND v_slot.hold_expires_at < now() THEN
    UPDATE public.consultation_slots
    SET status = 'available',
        hold_expires_at = NULL
    WHERE id = v_slot.id;

    RAISE EXCEPTION 'Consultation slot hold has expired'
      USING ERRCODE = '23505';
  END IF;

  IF v_slot.status NOT IN ('available', 'held') OR v_slot.starts_at < now() THEN
    RAISE EXCEPTION 'Consultation slot is no longer available'
      USING ERRCODE = '23505';
  END IF;

  IF v_slot.status = 'held' AND v_booking.consultation_slot_id IS DISTINCT FROM v_slot.id THEN
    RAISE EXCEPTION 'Consultation slot is held by another booking'
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

  UPDATE public.appointment_bookings
  SET patient_id = p_patient_id,
      user_id = COALESCE(p_user_id, v_patient_user_id),
      contact_request_id = COALESCE(p_contact_request_id, contact_request_id),
      consultation_slot_id = v_slot.id,
      patient_consultation_id = v_consultation.id,
      doctor_id = v_slot.doctor_id,
      booking_type = v_slot.booking_type,
      status = 'confirmed',
      requested_starts_at = COALESCE(requested_starts_at, v_slot.starts_at),
      requested_ends_at = COALESCE(requested_ends_at, v_slot.ends_at),
      confirmed_starts_at = v_slot.starts_at,
      confirmed_ends_at = v_slot.ends_at,
      timezone = v_slot.timezone,
      location = v_slot.location,
      meeting_url = v_slot.meeting_url,
      hold_expires_at = NULL,
      notes = COALESCE(p_notes, notes),
      metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object('confirmedAt', now())
  WHERE id = v_booking.id
  RETURNING *
  INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_appointment_booking_holds()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  WITH expired_bookings AS (
    UPDATE public.appointment_bookings
    SET status = 'expired',
        hold_expires_at = NULL,
        metadata = COALESCE(metadata, '{}'::jsonb)
          || jsonb_build_object('expiredAt', now())
    WHERE status = 'held'
      AND hold_expires_at < now()
    RETURNING consultation_slot_id
  ),
  released_slots AS (
    UPDATE public.consultation_slots AS slot
    SET status = 'available',
        hold_expires_at = NULL
    FROM expired_bookings AS booking
    WHERE slot.id = booking.consultation_slot_id
      AND slot.status = 'held'
      AND slot.patient_consultation_id IS NULL
    RETURNING slot.id
  )
  SELECT count(*) INTO v_expired_count FROM expired_bookings;

  RETURN COALESCE(v_expired_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.hold_appointment_booking_slot(uuid, uuid, uuid, uuid, uuid, text, integer)
FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_appointment_booking(uuid, uuid, uuid, uuid, uuid, text)
FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_stale_appointment_booking_holds()
FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.hold_appointment_booking_slot(uuid, uuid, uuid, uuid, uuid, text, integer)
TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_appointment_booking(uuid, uuid, uuid, uuid, uuid, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_appointment_booking_holds()
TO service_role;

COMMIT;
