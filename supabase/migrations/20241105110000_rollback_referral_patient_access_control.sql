-- Rollback Migration: Remove Referral Patient Access Control
-- Removes RLS policies added for Referral user patient access control
-- USAGE: Copy and paste this into Supabase SQL Editor if you need
-- to rollback the referral patient access control changes

BEGIN;

-- Drop Referral-Specific RLS Policies
DROP POLICY IF EXISTS referral_users_view_own_patients
ON public.patients;

DROP POLICY IF EXISTS referral_users_create_patients
ON public.patients;

DROP POLICY IF EXISTS referral_users_update_own_patients
ON public.patients;

-- Drop Staff Full-Access RLS Policy
DROP POLICY IF EXISTS staff_users_full_patient_access
ON public.patients;

COMMIT;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 1. This rollback script removes all RLS policies added in the forward
--    migration 20241105110000_add_referral_patient_access_control.sql
--
-- 2. Original patient self-service RLS policies remain intact:
--    - "Patients can view their own record"
--    - "Patients can insert their own record"
--    - "Patients can update their own record"
--
-- 3. After running this rollback:
--    - Referral users will no longer have any patient access via RLS
--    - Staff users (Admin, Coordinator, etc.) will continue to access
--      patients via the service role (getSupabaseAdmin) which bypasses
--      RLS
--    - You should also revert the backend code changes in:
--      * src/server/modules/patients/module.ts
--      * src/app/api/admin/patients/route.ts
--
-- 4. System will return to original state where:
--    - All staff access patients via service role (no RLS filtering)
--    - Patients access their own records via existing RLS policies
--
-- 5. This rollback is safe to run at any time and will not affect data
--    integrity
