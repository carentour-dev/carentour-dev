-- Prevent staff accounts from being registered as patients
-- Staff accounts are created via admin invite with account_type='staff'
-- metadata. Patient accounts are created via public signup with NO
-- account_type metadata

BEGIN;

-- Helper function: Check if a user is a staff account
-- Returns TRUE if user has account_type='staff' in metadata
-- Returns FALSE for patients (who have NULL account_type)
CREATE OR REPLACE FUNCTION public.is_staff_account(p_user_id UUID)
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

  -- Check raw_user_meta_data for account_type field
  SELECT raw_user_meta_data->>'account_type'
  INTO account_type_value
  FROM auth.users
  WHERE id = p_user_id;

  -- Staff accounts have account_type = 'staff'
  -- Patient accounts have account_type = NULL (not set during signup)
  RETURN account_type_value = 'staff';
END;
$$;

-- Grant execution to authenticated and service roles
GRANT EXECUTE ON FUNCTION public.is_staff_account(UUID)
TO authenticated, service_role;

-- Update the INSERT policy on patients table to block staff accounts
-- This ensures staff members cannot create patient records for themselves
DROP POLICY IF EXISTS patients_insert_own_record
ON public.patients;

CREATE POLICY patients_insert_own_record
ON public.patients
FOR INSERT
WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT public.is_staff_account((SELECT auth.uid()))
);

-- Add explanatory comment
COMMENT ON POLICY patients_insert_own_record
ON public.patients IS
'Allows authenticated users to create patient records for themselves '
'ONLY if they do not have account_type=staff in their user metadata. '
'Patient signups via /auth have NULL account_type, while staff invites '
'via admin console have account_type=staff. This separation prevents '
'staff accounts from populating the public.patients table.';

COMMENT ON FUNCTION public.is_staff_account(UUID) IS
'Returns TRUE if the user has account_type=staff in '
'raw_user_meta_data (staff invite flow), FALSE otherwise '
'(patient signup flow or no metadata).';

COMMIT;
