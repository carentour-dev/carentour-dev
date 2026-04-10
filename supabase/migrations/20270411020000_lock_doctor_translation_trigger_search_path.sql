-- Ensure doctor translation updated_at trigger runs with a predictable search_path
ALTER FUNCTION public.doctor_translations_set_updated_at()
SET search_path = public;
