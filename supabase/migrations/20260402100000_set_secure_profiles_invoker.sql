-- Ensure secure_profiles view runs with invoker privileges
ALTER VIEW public.secure_profiles SET (security_invoker = true);
