-- Consolidate patient update RLS policies to reduce per-query evaluation cost
-- by combining patient, referral, and staff logic into a single permissive
-- policy per action.
BEGIN;

-- Ensure the helper function exists so patient self-insert checks work
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

    SELECT raw_user_meta_data->>'account_type'
    INTO account_type_value
    FROM auth.users
    WHERE id = p_user_id;

    RETURN account_type_value = 'staff';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_staff_account(UUID)
TO authenticated, service_role;

-- Drop legacy policies with spaces in the name via dynamic SQL
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Patients can update their own record" ON public.patients';
    EXECUTE 'DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients';
    EXECUTE 'DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients';
END;
$$;

DROP POLICY IF EXISTS referral_users_update_own_patients ON public.patients;
DROP POLICY IF EXISTS referral_users_view_own_patients ON public.patients;
DROP POLICY IF EXISTS staff_users_full_patient_access ON public.patients;
DROP POLICY IF EXISTS staff_users_select_patients ON public.patients;
DROP POLICY IF EXISTS referral_users_create_patients ON public.patients;
DROP POLICY IF EXISTS patients_can_insert_own_record ON public.patients;
DROP POLICY IF EXISTS staff_users_insert_patients ON public.patients;

DROP POLICY IF EXISTS manage_patient_updates ON public.patients;
-- Combined UPDATE policy covering patients, referral users, and staff members
CREATE POLICY manage_patient_updates
ON public.patients
FOR UPDATE
USING (
    -- Patients can always update their own record
    ((SELECT auth.uid()) = user_id)
    OR (
        public.has_permission((SELECT auth.uid()), 'operations.patients')
        AND (
            -- Referral users may update patients they created
            (
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
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
                        p.user_id = (SELECT auth.uid())
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
                    WHERE user_id = (SELECT auth.uid())
                )
            )
            OR (
                -- Staff roles retain full update access
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
                        AND r.slug IN (
                            'admin',
                            'coordinator',
                            'employee',
                            'doctor',
                            'management'
                        )
                )
            )
        )
    )
);

DROP POLICY IF EXISTS manage_patient_selects ON public.patients;
-- Combined SELECT policy covering patients, referral users, and staff members
CREATE POLICY manage_patient_selects
ON public.patients
FOR SELECT
USING (
    ((SELECT auth.uid()) = user_id)
    OR (
        public.has_permission((SELECT auth.uid()), 'operations.patients')
        AND (
            (
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
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
                        p.user_id = (SELECT auth.uid())
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
                    WHERE user_id = (SELECT auth.uid())
                )
            )
            OR (
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
                        AND r.slug IN (
                            'admin',
                            'coordinator',
                            'employee',
                            'doctor',
                            'management'
                        )
                )
            )
        )
    )
);

DROP POLICY IF EXISTS manage_patient_inserts ON public.patients;
-- Combined INSERT policy covering patients, referral users, and staff members
CREATE POLICY manage_patient_inserts
ON public.patients
FOR INSERT
WITH CHECK (
    -- Patients can insert their own record, excluding staff accounts
    (
        ((SELECT auth.uid()) = user_id)
        AND NOT public.is_staff_account((SELECT auth.uid()))
    )
    OR (
        public.has_permission((SELECT auth.uid()), 'operations.patients')
        AND (
            -- Referral users may insert patients when they are referral-only
            (
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
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
                        p.user_id = (SELECT auth.uid())
                        AND r.slug IN (
                            'admin',
                            'coordinator',
                            'employee',
                            'doctor',
                            'management'
                        )
                )
            )
            OR (
                -- Staff roles retain full insert access
                EXISTS (
                    SELECT 1
                    FROM public.profile_roles AS pr
                    INNER JOIN public.roles AS r
                        ON pr.role_id = r.id
                    INNER JOIN public.profiles AS p
                        ON pr.profile_id = p.id
                    WHERE
                        p.user_id = (SELECT auth.uid())
                        AND r.slug IN (
                            'admin',
                            'coordinator',
                            'employee',
                            'doctor',
                            'management'
                        )
                )
            )
        )
    )
);

DROP POLICY IF EXISTS staff_users_delete_patients ON public.patients;
CREATE POLICY staff_users_delete_patients
ON public.patients
FOR DELETE
USING (
    public.has_permission((SELECT auth.uid()), 'operations.patients')
    AND EXISTS (
        SELECT 1
        FROM public.profile_roles AS pr
        INNER JOIN public.roles AS r
            ON pr.role_id = r.id
        INNER JOIN public.profiles AS p
            ON pr.profile_id = p.id
        WHERE
            p.user_id = (SELECT auth.uid())
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
