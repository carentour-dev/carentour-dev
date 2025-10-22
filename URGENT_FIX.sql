-- URGENT FIX: Add service role policy to allow patient dashboard to work
-- This fixes the "new row violates row-level security policy" error
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to: https://supabase.com/dashboard/project/cmnwwchipysvwvijqjcu/sql/new
-- 3. Paste and click "Run"

BEGIN;

-- Service role policy for admin operations on patients table
-- This allows the dashboard to create patient records via the service role
DROP POLICY IF EXISTS "Service role can manage patients" ON public.patients;

CREATE POLICY "Service role can manage patients"
  ON public.patients
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

COMMIT;

-- VERIFICATION:
-- After running this, test by:
-- 1. Refreshing the patient dashboard
-- 2. The error should be gone
-- 3. Patient data should load correctly
