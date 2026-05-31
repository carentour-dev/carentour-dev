BEGIN;

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
    RETURNING id, consultation_slot_id
  ),
  released_expired_slots AS (
    UPDATE public.consultation_slots AS slot
    SET status = 'available',
        hold_expires_at = NULL
    FROM expired_bookings AS booking
    WHERE slot.id = booking.consultation_slot_id
      AND slot.status = 'held'
      AND slot.patient_consultation_id IS NULL
    RETURNING slot.id
  ),
  released_closed_slots AS (
    UPDATE public.consultation_slots AS slot
    SET status = 'available',
        hold_expires_at = NULL
    FROM public.appointment_bookings AS booking
    WHERE slot.id = booking.consultation_slot_id
      AND booking.status IN ('cancelled', 'expired')
      AND slot.status = 'held'
      AND slot.patient_consultation_id IS NULL
    RETURNING slot.id
  )
  SELECT expired_count
  INTO v_expired_count
  FROM (
    SELECT
      (SELECT count(*) FROM expired_bookings) AS expired_count,
      (SELECT count(*) FROM released_expired_slots) AS released_expired_count,
      (SELECT count(*) FROM released_closed_slots) AS released_closed_count
  ) AS cleanup_counts;

  RETURN COALESCE(v_expired_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_appointment_booking_holds()
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_appointment_booking_holds()
TO service_role;

COMMIT;
