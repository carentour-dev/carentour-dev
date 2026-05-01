-- Manual rollback for:
-- supabase/migrations/20270501140000_harden_security_definer_function_execution.sql
--
-- Use only if the hardening migration causes a production permission
-- regression. This intentionally restores the broader RPC execution surface
-- that Supabase flagged, so rerun the linter after the incident is resolved.
BEGIN;

-- Restore public helper functions to SECURITY DEFINER wrappers. The privileged
-- bodies created by the hardening migration remain in the internal schema.
CREATE OR REPLACE FUNCTION public.user_roles(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_roles(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_roles(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_role(p_user_id, p_role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id UUID, p_roles TEXT [])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_any_role(p_user_id, p_roles);
$$;

CREATE OR REPLACE FUNCTION public.user_permissions(p_user_id UUID)
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.user_permissions(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.current_user_permissions()
RETURNS TEXT []
LANGUAGE sql
SECURITY DEFINER
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
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_permission(p_user_id, p_permission);
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.has_permission(auth.uid(), p_permission);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT internal.is_staff_account(p_user_id);
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
SECURITY DEFINER
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
SECURITY DEFINER
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
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT internal.record_login_attempt(p_ip_address, p_email, p_success);
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT internal.check_email_exists(p_email);
$$;

CREATE OR REPLACE FUNCTION public.get_patient_testimonial(p_patient_id UUID)
RETURNS public.PATIENT_TESTIMONIAL_PUBLIC
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT internal.get_patient_testimonial(p_patient_id);
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_post_view_count(post_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT internal.increment_blog_post_view_count(post_id);
$$;

-- Restore broad execution grants for the functions reported by Supabase.
GRANT EXECUTE ON FUNCTION public.anonymize_patient_name() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_operations_pricing_import(UUID, UUID, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_patient_email_verified() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_patient_coordinator(UUID, UUID, UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(INET, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_failed_operations_pricing_import_event() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_login_attempts() TO anon, authenticated, service_role;
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
) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_patient_journey_step_guarded(UUID, TEXT, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_permissions() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_anonymized_patient_name(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_testimonial(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_and_audit_treatment_delete() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_and_audit_treatment_procedure_delete() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT []) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view_count(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_account(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, UUID, INET, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_invoice_number(INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_order_number(INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_finance_payable_number(INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_operations_quote_number(INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_external_identity_owner_change() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_patient_journey_source_relink() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(INET, TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reorder_patient_journey_steps_guarded(UUID, UUID [], UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_patient_journey_from_source(TEXT, UUID, UUID, UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_patient_email_verified() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_patient_journey_step_guarded(UUID, UUID, UUID, BOOLEAN, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_permissions(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_roles(UUID) TO authenticated, service_role;

COMMIT;
