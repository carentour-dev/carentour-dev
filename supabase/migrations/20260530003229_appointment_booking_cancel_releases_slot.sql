BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_appointment_booking(
    p_booking_id uuid,
    p_notes text DEFAULT NULL,
    p_cancellation_reason text DEFAULT NULL
)
RETURNS public.appointment_bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking public.appointment_bookings%ROWTYPE;
  v_consultation public.patient_consultations%ROWTYPE;
  v_slot_id uuid;
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

  IF v_booking.status IN ('completed', 'no_show') THEN
    RAISE EXCEPTION 'Completed or no-show bookings cannot be cancelled'
      USING ERRCODE = '23514';
  END IF;

  IF v_booking.patient_consultation_id IS NOT NULL THEN
    SELECT *
    INTO v_consultation
    FROM public.patient_consultations
    WHERE id = v_booking.patient_consultation_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Linked patient consultation not found'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_consultation.status IN ('completed', 'no_show') THEN
      RAISE EXCEPTION 'Completed or no-show consultations cannot be cancelled'
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.patient_consultations
    SET status = 'cancelled',
        notes = COALESCE(p_notes, notes),
        consultation_slot_id = NULL
    WHERE id = v_consultation.id;
  END IF;

  v_slot_id := COALESCE(
    v_booking.consultation_slot_id,
    v_consultation.consultation_slot_id
  );

  IF v_slot_id IS NOT NULL THEN
    UPDATE public.consultation_slots
    SET status = 'available',
        patient_consultation_id = NULL,
        hold_expires_at = NULL
    WHERE id = v_slot_id
      AND status IN ('held', 'booked')
      AND (
        patient_consultation_id IS NULL
        OR patient_consultation_id = v_booking.patient_consultation_id
      );
  END IF;

  UPDATE public.appointment_bookings
  SET status = 'cancelled',
      hold_expires_at = NULL,
      notes = COALESCE(p_notes, notes),
      cancellation_reason = p_cancellation_reason,
      metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object('cancelledAt', now())
  WHERE id = v_booking.id
  RETURNING *
  INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_appointment_booking(uuid, text, text)
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_booking(uuid, text, text)
TO service_role;

COMMIT;
