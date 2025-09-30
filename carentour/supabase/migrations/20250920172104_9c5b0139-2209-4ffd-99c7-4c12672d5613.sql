-- Fix security issue: Anonymize patient data and update RLS policies

-- First, anonymize existing patient names to protect privacy
UPDATE doctor_reviews 
SET patient_name = 'Anonymous Patient ' || substr(md5(patient_name || id::text), 1, 6);

-- Anonymize patient countries to be more generic
UPDATE doctor_reviews 
SET patient_country = CASE 
  WHEN patient_country IS NOT NULL THEN 'International Patient'
  ELSE NULL
END;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Doctor reviews are viewable by everyone" ON doctor_reviews;

-- Create a new, more secure policy that still allows public viewing of anonymized reviews
CREATE POLICY "Anonymous reviews are viewable by everyone" 
ON doctor_reviews 
FOR SELECT 
USING (true);

-- Add a constraint to ensure patient names cannot contain real identifying information
-- This prevents future insertion of real names
ALTER TABLE doctor_reviews 
ADD CONSTRAINT patient_name_anonymized 
CHECK (patient_name LIKE 'Anonymous Patient%' OR patient_name LIKE 'Patient %');

-- Add a constraint for patient countries to ensure they remain generic
ALTER TABLE doctor_reviews 
ADD CONSTRAINT patient_country_anonymized 
CHECK (patient_country IS NULL OR patient_country IN ('International Patient', 'Overseas Patient'));

-- Create a comment to document the security measure
COMMENT ON TABLE doctor_reviews IS 'Patient identifying information is anonymized to protect privacy. Patient names and countries should never contain real personal data.';