-- Ensure trigger functions run with a predictable search_path for security
ALTER FUNCTION public.update_doctor_ratings()
SET search_path = pg_catalog, public;

ALTER FUNCTION public.update_patient_testimonial_flag()
SET search_path = pg_catalog, public;
