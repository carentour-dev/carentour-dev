-- Harden SECURITY DEFINER functions reported by Supabase database lints.
--
-- Public RPC names that the application already calls are kept in place, but
-- the privileged bodies live in the non-exposed internal schema. Remaining
-- public SECURITY DEFINER functions are explicitly limited to trusted roles.
BEGIN;

CREATE SCHEMA IF NOT EXISTS internal;

REVOKE ALL ON SCHEMA internal FROM public;
GRANT USAGE ON SCHEMA internal TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Role and permission helpers

CREATE OR REPLACE FUNCTION internal.user_roles(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT [];
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  SELECT COALESCE(array_agg(DISTINCT r.slug ORDER BY r.slug), ARRAY[]::TEXT [])
  INTO result
  FROM public.profiles AS p
  JOIN public.profile_roles AS pr ON pr.profile_id = p.id
  JOIN public.roles AS r ON r.id = pr.role_id
  WHERE p.user_id = p_user_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION internal.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_user_id IS NULL OR p_role IS NULL OR length(p_role) = 0 THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
      AND r.slug = p_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION internal.has_any_role(
    p_user_id UUID,
    p_roles TEXT []
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_user_id IS NULL OR p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
      AND r.slug = ANY (p_roles)
  );
END;
$$;

CREATE OR REPLACE FUNCTION internal.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT [];
  is_superuser BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  WITH role_memberships AS (
    SELECT r.id, r.is_superuser
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    WHERE p.user_id = p_user_id
  ),
  assigned_perms AS (
    SELECT DISTINCT perm.slug
    FROM role_memberships AS rm
    JOIN public.role_permissions AS rp ON rp.role_id = rm.id
    JOIN public.permissions AS perm ON perm.id = rp.permission_id
  )
  SELECT
    COALESCE(bool_or(is_superuser), FALSE),
    CASE
      WHEN bool_or(is_superuser) THEN (
        SELECT COALESCE(array_agg(perm.slug ORDER BY perm.slug), ARRAY[]::TEXT [])
        FROM public.permissions AS perm
      )
      ELSE COALESCE(array_agg(assigned_perms.slug ORDER BY assigned_perms.slug), ARRAY[]::TEXT [])
    END
  INTO is_superuser, result
  FROM role_memberships
  LEFT JOIN assigned_perms ON TRUE;

  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT [];
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION internal.has_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  has_super BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_permission IS NULL OR length(p_permission) = 0 THEN
    RETURN FALSE;
  END IF;

  SELECT bool_or(r.is_superuser)
  INTO has_super
  FROM public.profiles AS p
  JOIN public.profile_roles AS pr ON pr.profile_id = p.id
  JOIN public.roles AS r ON r.id = pr.role_id
  WHERE p.user_id = p_user_id;

  IF COALESCE(has_super, FALSE) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.profile_roles AS pr ON pr.profile_id = p.id
    JOIN public.roles AS r ON r.id = pr.role_id
    JOIN public.role_permissions AS rp ON rp.role_id = r.id
    JOIN public.permissions AS perm ON perm.id = rp.permission_id
    WHERE p.user_id = p_user_id
      AND perm.slug = p_permission
  );
END;
$$;

CREATE OR REPLACE FUNCTION internal.is_staff_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  account_type_value TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT raw_user_meta_data->>'account_type'
  INTO account_type_value
  FROM auth.users
  WHERE id = p_user_id;

  RETURN account_type_value = 'staff';
END;
$$;

CREATE OR REPLACE FUNCTION public.user_roles(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_roles(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS TEXT []
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_roles(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_role(p_user_id, p_role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles TEXT [])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_any_role(p_user_id, p_roles);
$$;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_permissions(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.current_user_permissions()
RETURNS TEXT []
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_permissions(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_permission(p_user_id, p_permission);
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_permission(auth.uid(), p_permission);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT internal.is_staff_account(p_user_id);
$$;

GRANT EXECUTE ON FUNCTION internal.user_roles(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.has_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.has_any_role(UUID, TEXT []) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.user_permissions(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.has_permission(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.is_staff_account(UUID) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.user_roles(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT []) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_permissions(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_permissions() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_account(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Client-facing security helpers

CREATE OR REPLACE FUNCTION internal.log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type, user_id, ip_address, user_agent, event_data, risk_level
  ) VALUES (
    p_event_type, p_user_id, p_ip_address, p_user_agent, p_event_data, p_risk_level
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION internal.check_login_rate_limit(
    p_ip_address INET,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ip_attempts INTEGER;
  email_attempts INTEGER;
  result JSONB;
BEGIN
  SELECT COUNT(*) INTO ip_attempts
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';

  SELECT COUNT(*) INTO email_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';

  IF ip_attempts >= 5 OR email_attempts >= 3 THEN
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'ip_attempts', ip_attempts,
      'email_attempts', email_attempts
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'ip_attempts', ip_attempts,
      'email_attempts', email_attempts
    );
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION internal.record_login_attempt(
    p_ip_address INET,
    p_email TEXT,
    p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (ip_address, email, success)
  VALUES (p_ip_address, p_email, p_success);

  PERFORM internal.log_security_event(
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failure' END,
    NULL,
    p_ip_address,
    NULL,
    jsonb_build_object('email', p_email),
    CASE WHEN p_success THEN 'low' ELSE 'medium' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION internal.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM auth.users
    WHERE email = p_email
  ) INTO email_exists;

  RETURN email_exists;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.log_security_event(
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_event_data,
    p_risk_level
  );
$$;

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
    p_ip_address INET,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.check_login_rate_limit(p_ip_address, p_email);
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_ip_address INET,
    p_email TEXT,
    p_success BOOLEAN
)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.record_login_attempt(p_ip_address, p_email, p_success);
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.check_email_exists(p_email);
$$;

GRANT EXECUTE ON FUNCTION internal.log_security_event(TEXT, UUID, INET, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.check_login_rate_limit(INET, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.record_login_attempt(INET, TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.check_email_exists(TEXT) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, INET, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(INET, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(INET, TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Public content helpers

CREATE OR REPLACE FUNCTION internal.get_patient_testimonial(p_patient_id UUID)
RETURNS public.PATIENT_TESTIMONIAL_PUBLIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.patient_testimonial_public%ROWTYPE;
BEGIN
  SELECT *
    INTO result
  FROM public.patient_testimonial_public
  WHERE patient_id = p_patient_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_patient_testimonial(p_patient_id UUID)
RETURNS public.PATIENT_TESTIMONIAL_PUBLIC
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.get_patient_testimonial(p_patient_id);
$$;

CREATE OR REPLACE FUNCTION internal.increment_blog_post_view_count(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_post_view_count(post_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT internal.increment_blog_post_view_count(post_id);
$$;

GRANT EXECUTE ON FUNCTION internal.get_patient_testimonial(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.increment_blog_post_view_count(UUID) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_patient_testimonial(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view_count(UUID) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Remove direct anon/authenticated execution from public SECURITY DEFINER
-- functions that are triggers, server-only RPCs, or internal maintenance.

REVOKE EXECUTE ON FUNCTION public.anonymize_patient_name() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_operations_pricing_import(UUID, UUID, BOOLEAN) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_patient_email_verified() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_patient_coordinator(UUID, UUID, UUID, TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_failed_operations_pricing_import_event() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_operations_pricing_import_preview(
    UUID,
    BOOLEAN,
    BOOLEAN,
    INTEGER,
    JSONB,
    JSONB,
    JSONB,
    UUID,
    UUID,
    JSONB
) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_patient_journey_step_guarded(UUID, TEXT, TEXT, UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_anonymized_patient_name(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_display_name(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_and_audit_treatment_delete() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_and_audit_treatment_procedure_delete() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_finance_invoice_number(INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_finance_order_number(INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_finance_payable_number(INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_operations_quote_number(INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_external_identity_owner_change() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_patient_journey_source_relink() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reorder_patient_journey_steps_guarded(UUID, UUID [], UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_patient_journey_from_source(TEXT, UUID, UUID, UUID, UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_patient_email_verified() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_patient_journey_step_guarded(UUID, UUID, UUID, BOOLEAN, JSONB) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_operations_pricing_import(UUID, UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_patient_coordinator(UUID, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_failed_operations_pricing_import_event() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_login_attempts() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_operations_pricing_import_preview(
    UUID,
    BOOLEAN,
    BOOLEAN,
    INTEGER,
    JSONB,
    JSONB,
    JSONB,
    UUID,
    UUID,
    JSONB
) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_patient_journey_step_guarded(UUID, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_invoice_number(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_order_number(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_payable_number(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_operations_quote_number(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.reorder_patient_journey_steps_guarded(UUID, UUID [], UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_patient_journey_from_source(TEXT, UUID, UUID, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_patient_journey_step_guarded(UUID, UUID, UUID, BOOLEAN, JSONB) TO service_role;

COMMIT;
