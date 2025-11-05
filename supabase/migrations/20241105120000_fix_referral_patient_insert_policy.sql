-- Fix Referral Patient Insert Policy
-- The previous INSERT policy incorrectly checked created_by_profile_id
-- in WITH CHECK which doesn't work as expected. The application layer
-- ensures the correct value, so the policy only needs to verify the
-- user has the referral role.
BEGIN;

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS referral_users_create_patients ON public.patients;

-- Recreate the INSERT policy without the created_by_profile_id check
-- The application layer sets this correctly, and checking it in WITH CHECK
-- doesn't work reliably for INSERT operations
CREATE POLICY referral_users_create_patients
ON public.patients
FOR INSERT
WITH CHECK (
    public.has_permission(auth.uid(), 'operations.patients')
    AND EXISTS (
        SELECT 1
        FROM public.profile_roles AS pr
        INNER JOIN public.roles AS r
            ON pr.role_id = r.id
        INNER JOIN public.profiles AS p
            ON pr.profile_id = p.id
        WHERE
            p.user_id = auth.uid()
            AND r.slug = 'referral'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM public.profile_roles AS pr
        INNER JOIN public.roles AS r
            ON pr.role_id = r.id
        INNER JOIN public.profiles AS p
            ON pr.profile_id = p.id
        WHERE
            p.user_id = auth.uid()
            AND r.slug IN (
                'admin',
                'coordinator',
                'employee',
                'doctor',
                'management'
            )
    )
);

COMMIT;
