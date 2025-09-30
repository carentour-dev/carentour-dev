-- Fix function search path security warning

-- Update the anonymization function to have a proper search path
CREATE OR REPLACE FUNCTION public.generate_anonymized_patient_name(review_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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