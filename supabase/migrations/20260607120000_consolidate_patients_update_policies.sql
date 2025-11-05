-- Consolidate patient update RLS policies to reduce per-query evaluation cost
-- by combining patient, referral, and staff logic into a single permissive
-- policy per action.
BEGIN;

-- Drop the legacy policy with spaces in the name via dynamic SQL
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Patients can update their own record" ON public.patients';
END;
$$;

DROP POLICY IF EXISTS referral_users_update_own_patients ON public.patients;
DROP POLICY IF EXISTS staff_users_full_patient_access ON public.patients;

-- Combined UPDATE policy covering patients, referral users, and staff members
CREATE POLICY manage_patient_updates
ON public.patients
FOR UPDATE
USING (
    -- Patients can always update their own record
    (auth.uid() = user_id)
    OR (
        public.has_permission(auth.uid(), 'operations.patients')
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
                        p.user_id = auth.uid()
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

-- Recreate staff access for the remaining actions (select, insert, delete)
CREATE POLICY staff_users_select_patients
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
            AND r.slug IN (
                'admin',
                'coordinator',
                'employee',
                'doctor',
                'management'
            )
    )
);

CREATE POLICY staff_users_insert_patients
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
            AND r.slug IN (
                'admin',
                'coordinator',
                'employee',
                'doctor',
                'management'
            )
    )
);

CREATE POLICY staff_users_delete_patients
ON public.patients
FOR DELETE
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
