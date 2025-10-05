BEGIN;

-- Ensure doctor review records reuse the patient-level alias for consistency across the app.
UPDATE public.doctor_reviews
SET patient_name = public.generate_anonymized_patient_name(COALESCE(patient_id, id));

-- Keep future inserts/updates aligned with the patient-level alias.
CREATE OR REPLACE FUNCTION public.anonymize_patient_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_name !~ '^(Patient #[0-9]+|Anonymous Patient|Patient [A-Z])$' THEN
    NEW.patient_name := public.generate_anonymized_patient_name(COALESCE(NEW.patient_id, NEW.id));
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
