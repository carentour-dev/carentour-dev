-- Fix patient name exposure vulnerability in doctor_reviews table

-- First, create a function to generate anonymized patient identifiers
CREATE OR REPLACE FUNCTION public.generate_anonymized_patient_name(review_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  hash_value TEXT;
  patient_number INTEGER;
BEGIN
  -- Create a deterministic hash from the review ID
  hash_value := encode(digest(review_id::text, 'sha256'), 'hex');
  
  -- Convert first 8 characters of hash to a number and mod it to get patient number
  patient_number := (('x' || substring(hash_value, 1, 8))::bit(32)::bigint % 9999) + 1;
  
  -- Return anonymized patient name
  RETURN 'Patient #' || patient_number;
END;
$$;

-- Update existing records to use anonymized patient names
UPDATE public.doctor_reviews 
SET patient_name = public.generate_anonymized_patient_name(id);

-- Add a constraint to ensure patient names follow the anonymized format
ALTER TABLE public.doctor_reviews 
ADD CONSTRAINT check_anonymized_patient_name 
CHECK (patient_name ~ '^(Patient #[0-9]+|Anonymous Patient|Patient [A-Z])$');

-- Create a trigger to automatically anonymize patient names on insert/update
CREATE OR REPLACE FUNCTION public.anonymize_patient_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If patient_name doesn't match the anonymized format, anonymize it
  IF NEW.patient_name !~ '^(Patient #[0-9]+|Anonymous Patient|Patient [A-Z])$' THEN
    NEW.patient_name := public.generate_anonymized_patient_name(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for insert and update
CREATE TRIGGER anonymize_patient_name_on_insert
  BEFORE INSERT ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_patient_name();

CREATE TRIGGER anonymize_patient_name_on_update
  BEFORE UPDATE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_patient_name();

-- Add comment documenting the security measure
COMMENT ON COLUMN public.doctor_reviews.patient_name IS 'Anonymized patient identifier for privacy protection. Must follow format: Patient #XXXX, Anonymous Patient, or Patient X';

-- Create an audit log entry for this security improvement
INSERT INTO public.security_audit_log (event_type, table_name, details, user_id)
VALUES (
  'privacy_enhancement',
  'doctor_reviews',
  'Implemented patient name anonymization to prevent exposure of real patient identities',
  NULL
);