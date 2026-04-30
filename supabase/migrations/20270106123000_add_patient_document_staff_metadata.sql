BEGIN;

ALTER TABLE public.patient_documents
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'patient_portal',
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'patient_visible';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patient_documents_source_check'
          AND conrelid = 'public.patient_documents'::regclass
    ) THEN
        ALTER TABLE public.patient_documents
        ADD CONSTRAINT patient_documents_source_check
        CHECK (
            source IN (
                'patient_portal',
                'staff',
                'contact_request',
                'start_journey',
                'storage'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patient_documents_visibility_check'
          AND conrelid = 'public.patient_documents'::regclass
    ) THEN
        ALTER TABLE public.patient_documents
        ADD CONSTRAINT patient_documents_visibility_check
        CHECK (visibility IN ('patient_visible', 'internal'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_patient_documents_source
ON public.patient_documents (source);

CREATE INDEX IF NOT EXISTS idx_patient_documents_visibility
ON public.patient_documents (visibility);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'patient_documents'
          AND policyname = 'Allow patient to manage own documents'
    ) THEN
        ALTER POLICY "Allow patient to manage own documents"
            ON public.patient_documents
            USING (
                visibility = 'patient_visible'
                AND (
                    user_id = (SELECT auth.uid())
                    OR (
                        patient_id IN (
                            SELECT id
                            FROM public.patients
                            WHERE user_id = (SELECT auth.uid())
                        )
                    )
                )
            )
            WITH CHECK (
                visibility = 'patient_visible'
                AND (
                    user_id = (SELECT auth.uid())
                    OR (
                        patient_id IN (
                            SELECT id
                            FROM public.patients
                            WHERE user_id = (SELECT auth.uid())
                        )
                    )
                )
            );
    END IF;
END
$$;

INSERT INTO public.permissions (slug, name, description)
VALUES (
    'operations.patient_documents.manage',
    'Manage Patient Documents',
    'Allows staff to upload and manage patient-related documents.'
)
ON CONFLICT (slug) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description;

WITH target_permission AS (
    SELECT id AS permission_id
    FROM public.permissions
    WHERE slug = 'operations.patient_documents.manage'
),

target_roles AS (
    SELECT id AS role_id
    FROM public.roles
    WHERE slug IN ('admin', 'coordinator')
)

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    target_roles.role_id,
    target_permission.permission_id
FROM target_roles
CROSS JOIN target_permission
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
