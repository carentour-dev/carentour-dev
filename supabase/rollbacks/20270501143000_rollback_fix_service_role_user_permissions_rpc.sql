-- Roll back the service-role-only public.user_permissions wrapper.
-- The internal.user_permissions ambiguity fix is intentionally preserved so
-- admin authorization does not break again.
BEGIN;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_permissions(p_user_id);
$$;

REVOKE ALL ON FUNCTION public.user_permissions(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.user_permissions(UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
