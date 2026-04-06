-- Add covering indexes for foreign keys flagged by Supabase Performance Advisor.
-- Guard each index creation so the migration can be applied safely even if the
-- target table or column does not exist in the current database state.

DO $$
DECLARE
    target RECORD;
BEGIN
    FOR target IN
        SELECT *
        FROM (
            VALUES
                ('idx_blog_posts_author_user_id', 'blog_posts', 'author_user_id'),
                ('idx_blog_comments_author_user_id', 'blog_comments', 'author_user_id'),
                ('idx_cms_pages_updated_by', 'cms_pages', 'updated_by'),
                ('idx_navigation_links_cms_page_id', 'navigation_links', 'cms_page_id'),
                ('idx_seo_overrides_updated_by', 'seo_overrides', 'updated_by'),
                ('idx_route_redirects_created_by', 'route_redirects', 'created_by'),
                ('idx_doctor_reviews_doctor_id', 'doctor_reviews', 'doctor_id'),
                ('idx_doctor_reviews_patient_id', 'doctor_reviews', 'patient_id'),
                ('idx_doctor_treatments_doctor_id', 'doctor_treatments', 'doctor_id'),
                ('idx_patient_stories_patient_id', 'patient_stories', 'patient_id'),
                ('idx_patient_stories_doctor_id', 'patient_stories', 'doctor_id'),
                ('idx_trip_plans_user_id', 'trip_plans', 'user_id'),
                ('idx_trip_plan_bookings_trip_plan_id', 'trip_plan_bookings', 'trip_plan_id'),
                ('idx_trip_plan_bookings_accommodation_id', 'trip_plan_bookings', 'accommodation_id'),
                ('idx_patients_confirmed_by', 'patients', 'confirmed_by'),
                ('idx_profile_roles_assigned_by', 'profile_roles', 'assigned_by'),
                ('idx_patient_consultations_contact_request_id', 'patient_consultations', 'contact_request_id'),
                ('idx_patient_consultations_doctor_id', 'patient_consultations', 'doctor_id'),
                ('idx_patient_consultations_coordinator_id', 'patient_consultations', 'coordinator_id'),
                ('idx_patient_appointments_consultation_id', 'patient_appointments', 'consultation_id'),
                ('idx_patient_appointments_doctor_id', 'patient_appointments', 'doctor_id'),
                ('idx_patient_appointments_facility_id', 'patient_appointments', 'facility_id'),
                ('idx_patient_documents_request_id', 'patient_documents', 'request_id'),
                ('idx_patient_documents_created_by_profile_id', 'patient_documents', 'created_by_profile_id'),
                ('idx_start_journey_submissions_procedure_id', 'start_journey_submissions', 'procedure_id'),
                ('idx_start_journey_submissions_consultation_id', 'start_journey_submissions', 'consultation_id'),
                ('idx_operations_quotes_owner_profile_id', 'operations_quotes', 'owner_profile_id'),
                ('idx_operations_tasks_owner_profile_id', 'operations_tasks', 'owner_profile_id'),
                ('idx_operations_pricing_import_runs_created_by_profile_id', 'operations_pricing_import_runs', 'created_by_profile_id'),
                ('idx_treatment_procedures_created_by_provider_id', 'treatment_procedures', 'created_by_provider_id'),
                ('idx_finance_cases_contact_request_id', 'finance_cases', 'contact_request_id'),
                ('idx_finance_cases_start_journey_submission_id', 'finance_cases', 'start_journey_submission_id'),
                ('idx_finance_cases_assigned_to_profile_id', 'finance_cases', 'assigned_to_profile_id'),
                ('idx_finance_cases_created_by_profile_id', 'finance_cases', 'created_by_profile_id'),
                ('idx_finance_orders_created_by_profile_id', 'finance_orders', 'created_by_profile_id'),
                ('idx_finance_orders_approved_by_profile_id', 'finance_orders', 'approved_by_profile_id'),
                ('idx_finance_invoices_finance_case_id', 'finance_invoices', 'finance_case_id'),
                ('idx_finance_invoices_created_by_profile_id', 'finance_invoices', 'created_by_profile_id'),
                ('idx_finance_invoices_approved_by_profile_id', 'finance_invoices', 'approved_by_profile_id'),
                ('idx_finance_invoice_lines_finance_order_line_id', 'finance_invoice_lines', 'finance_order_line_id'),
                ('idx_finance_payments_created_by_profile_id', 'finance_payments', 'created_by_profile_id'),
                ('idx_finance_payment_allocations_finance_payment_id', 'finance_payment_allocations', 'finance_payment_id'),
                ('idx_finance_credit_adjustments_finance_payment_id', 'finance_credit_adjustments', 'finance_payment_id'),
                ('idx_finance_credit_adjustments_requested_by_profile_id', 'finance_credit_adjustments', 'requested_by_profile_id'),
                ('idx_finance_credit_adjustments_approved_by_profile_id', 'finance_credit_adjustments', 'approved_by_profile_id'),
                ('idx_finance_payables_counterparty_id', 'finance_payables', 'counterparty_id'),
                ('idx_finance_payables_finance_case_id', 'finance_payables', 'finance_case_id'),
                ('idx_finance_payables_finance_order_id', 'finance_payables', 'finance_order_id'),
                ('idx_finance_payables_created_by_profile_id', 'finance_payables', 'created_by_profile_id'),
                ('idx_finance_payables_approved_by_profile_id', 'finance_payables', 'approved_by_profile_id'),
                ('idx_finance_payable_payments_finance_payment_id', 'finance_payable_payments', 'finance_payment_id'),
                ('idx_finance_payable_payments_created_by_profile_id', 'finance_payable_payments', 'created_by_profile_id'),
                ('idx_finance_approval_requests_requested_by_profile_id', 'finance_approval_requests', 'requested_by_profile_id'),
                ('idx_finance_approval_requests_primary_approver_profile_id', 'finance_approval_requests', 'primary_approver_profile_id'),
                ('idx_finance_approval_requests_secondary_approver_profile_id', 'finance_approval_requests', 'secondary_approver_profile_id'),
                ('idx_finance_approval_requests_approved_by_profile_id', 'finance_approval_requests', 'approved_by_profile_id'),
                ('idx_finance_approval_requests_rejected_by_profile_id', 'finance_approval_requests', 'rejected_by_profile_id'),
                ('idx_finance_chart_accounts_parent_account_id', 'finance_chart_accounts', 'parent_account_id'),
                ('idx_finance_journal_entries_created_by_profile_id', 'finance_journal_entries', 'created_by_profile_id'),
                ('idx_finance_journal_lines_finance_chart_account_id', 'finance_journal_lines', 'finance_chart_account_id'),
                ('idx_finance_journal_lines_cost_tag_case_id', 'finance_journal_lines', 'cost_tag_case_id'),
                ('idx_finance_documents_uploaded_by_profile_id', 'finance_documents', 'uploaded_by_profile_id'),
                ('idx_finance_audit_events_actor_user_id', 'finance_audit_events', 'actor_user_id'),
                ('idx_finance_audit_events_actor_profile_id', 'finance_audit_events', 'actor_profile_id'),
                ('idx_finance_hr_compensation_events_cost_tag_case_id', 'finance_hr_compensation_events', 'cost_tag_case_id')
        ) AS targets(index_name, table_name, column_name)
    LOOP
        IF to_regclass(format('public.%I', target.table_name)) IS NULL THEN
            RAISE NOTICE 'Skipping index %: table public.% does not exist', target.index_name, target.table_name;
            CONTINUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = target.table_name
              AND column_name = target.column_name
        ) THEN
            RAISE NOTICE 'Skipping index %: column public.%.% does not exist', target.index_name, target.table_name, target.column_name;
            CONTINUE;
        END IF;

        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
            target.index_name,
            target.table_name,
            target.column_name
        );
    END LOOP;
END;
$$;
