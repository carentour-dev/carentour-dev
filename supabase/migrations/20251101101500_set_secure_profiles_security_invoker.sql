-- Ensure secure_profiles view executes with caller privileges
BEGIN;

ALTER VIEW public.secure_profiles
SET (security_invoker = true);

COMMIT;
