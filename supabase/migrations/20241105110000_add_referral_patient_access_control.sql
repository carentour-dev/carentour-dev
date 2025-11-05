-- Add Referral Patient Access Control
-- Implements RLS policies to restrict Referral users to only see/manage
-- patients they created
BEGIN;

-- ========================================================================
-- RLS POLICY: Referral Users - View Own Patients Only
-- ========================================================================
CREATE POLICY referral_users_view_own_patients
ON public.patients
FOR SELECT
USING (
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
    AND created_by_profile_id IN (
        SELECT id
        FROM public.profiles
        WHERE user_id = auth.uid()
    )
);

-- ========================================================================
-- RLS POLICY: Referral Users - Create Patients
-- ========================================================================
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
    AND created_by_profile_id IN (
        SELECT id
        FROM public.profiles
        WHERE user_id = auth.uid()
    )
);

-- ========================================================================
-- RLS POLICY: Referral Users - Update Own Patients Only
-- ========================================================================
CREATE POLICY referral_users_update_own_patients
ON public.patients
FOR UPDATE
USING (
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
    AND created_by_profile_id IN (
        SELECT id
        FROM public.profiles
        WHERE user_id = auth.uid()
    )
);

-- ========================================================================
-- RLS POLICY: Staff Users - Full Patient Access
-- ========================================================================
CREATE POLICY staff_users_full_patient_access
ON public.patients
FOR ALL
USING (
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
