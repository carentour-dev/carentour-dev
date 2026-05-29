BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_patient_appointment_conflicts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_starts_at timestamptz;
  v_new_ends_at timestamptz;
  v_conflict_id uuid;
BEGIN
  IF NEW.status NOT IN ('scheduled', 'confirmed', 'rescheduled') THEN
    RETURN NEW;
  END IF;

  v_new_starts_at := NEW.starts_at;
  v_new_ends_at := COALESCE(NEW.ends_at, NEW.starts_at + interval '30 minutes');

  SELECT existing.id
  INTO v_conflict_id
  FROM public.patient_appointments AS existing
  WHERE existing.id IS DISTINCT FROM NEW.id
    AND existing.status IN ('scheduled', 'confirmed', 'rescheduled')
    AND tstzrange(
      existing.starts_at,
      COALESCE(existing.ends_at, existing.starts_at + interval '30 minutes'),
      '[)'
    ) && tstzrange(v_new_starts_at, v_new_ends_at, '[)')
    AND (
      existing.patient_id = NEW.patient_id
      OR (
        NEW.doctor_id IS NOT NULL
        AND existing.doctor_id = NEW.doctor_id
      )
      OR (
        NEW.facility_id IS NOT NULL
        AND existing.facility_id = NEW.facility_id
      )
    )
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RAISE EXCEPTION 'Appointment conflicts with an existing active appointment'
      USING ERRCODE = '23P01',
            DETAIL = format('Conflicting appointment id: %s', v_conflict_id);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'prevent_patient_appointment_conflicts'
      AND tgrelid = 'public.patient_appointments'::regclass
  ) THEN
    CREATE TRIGGER prevent_patient_appointment_conflicts
      BEFORE INSERT OR UPDATE OF
        patient_id,
        doctor_id,
        facility_id,
        status,
        starts_at,
        ends_at
      ON public.patient_appointments
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_patient_appointment_conflicts();
  END IF;
END;
$$;

COMMIT;
