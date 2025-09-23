-- Ensure all existing patient names are properly anonymized
UPDATE public.doctor_reviews 
SET patient_name = public.generate_anonymized_patient_name(id)
WHERE patient_name !~ '^(Patient #[0-9]+|Anonymous Patient|Patient [A-Z])$';

-- Create or replace the anonymization trigger to ensure it always runs
DROP TRIGGER IF EXISTS anonymize_patient_name_trigger ON public.doctor_reviews;

CREATE OR REPLACE FUNCTION public.anonymize_patient_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Always anonymize patient names on insert or update
  NEW.patient_name := public.generate_anonymized_patient_name(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically anonymize patient names
CREATE TRIGGER anonymize_patient_name_trigger
  BEFORE INSERT OR UPDATE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_patient_name();

-- Add a comment to document the security measure
COMMENT ON TRIGGER anonymize_patient_name_trigger ON public.doctor_reviews IS 
'Security measure: Automatically anonymizes patient names to protect privacy and prevent data exploitation by competitors or bad actors';