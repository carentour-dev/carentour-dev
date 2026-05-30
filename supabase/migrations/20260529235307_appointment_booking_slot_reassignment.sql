BEGIN;

CREATE OR REPLACE FUNCTION public.reassign_appointment_booking_slot(
    p_booking_id uuid,
    p_slot_id uuid,
    p_notes text DEFAULT NULL
)
RETURNS public.appointment_bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking public.appointment_bookings%ROWTYPE;
  v_consultation public.patient_consultations%ROWTYPE;
  v_new_slot public.consultation_slots%ROWTYPE;
  v_previous_slot_id uuid;
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

  IF v_booking.patient_consultation_id IS NULL THEN
    RAISE EXCEPTION 'Appointment booking has no confirmed consultation to reassign'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_consultation
  FROM public.patient_consultations
  WHERE id = v_booking.patient_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Linked patient consultation not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_consultation.status IN ('completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Completed or closed consultations cannot be reassigned'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_new_slot
  FROM public.consultation_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation slot not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_new_slot.status <> 'available' OR v_new_slot.starts_at < now() THEN
    RAISE EXCEPTION 'Consultation slot is no longer available'
      USING ERRCODE = '23505';
  END IF;

  v_previous_slot_id := COALESCE(
    v_consultation.consultation_slot_id,
    v_booking.consultation_slot_id
  );

  IF v_previous_slot_id IS NOT NULL
     AND v_previous_slot_id IS DISTINCT FROM v_new_slot.id THEN
    UPDATE public.consultation_slots
    SET status = 'available',
        patient_consultation_id = NULL,
        hold_expires_at = NULL
    WHERE id = v_previous_slot_id
      AND patient_consultation_id = v_consultation.id
      AND status = 'booked';
  END IF;

  UPDATE public.patient_consultations
  SET doctor_id = v_new_slot.doctor_id,
      status = 'rescheduled',
      scheduled_at = v_new_slot.starts_at,
      duration_minutes = CEIL(EXTRACT(EPOCH FROM (v_new_slot.ends_at - v_new_slot.starts_at)) / 60)::integer,
      timezone = v_new_slot.timezone,
      location = v_new_slot.location,
      meeting_url = v_new_slot.meeting_url,
      notes = COALESCE(p_notes, notes),
      booking_type = v_new_slot.booking_type,
      consultation_slot_id = v_new_slot.id
  WHERE id = v_consultation.id;

  UPDATE public.consultation_slots
  SET status = 'booked',
      patient_consultation_id = v_consultation.id,
      hold_expires_at = NULL
  WHERE id = v_new_slot.id;

  UPDATE public.appointment_bookings
  SET consultation_slot_id = v_new_slot.id,
      doctor_id = v_new_slot.doctor_id,
      booking_type = v_new_slot.booking_type,
      status = 'confirmed',
      confirmed_starts_at = v_new_slot.starts_at,
      confirmed_ends_at = v_new_slot.ends_at,
      timezone = v_new_slot.timezone,
      location = v_new_slot.location,
      meeting_url = v_new_slot.meeting_url,
      hold_expires_at = NULL,
      notes = COALESCE(p_notes, notes),
      metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'rescheduledAt', now(),
          'previousSlotId', v_previous_slot_id,
          'newSlotId', v_new_slot.id
        )
  WHERE id = v_booking.id
  RETURNING *
  INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.reassign_appointment_booking_slot(uuid, uuid, text)
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reassign_appointment_booking_slot(uuid, uuid, text)
TO service_role;

COMMIT;
