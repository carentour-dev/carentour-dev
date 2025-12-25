-- Store patient-uploaded documents outside of intake forms
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.contact_requests (id) ON DELETE SET NULL,
    created_by_profile_id UUID REFERENCES public.profiles (id)
    ON DELETE SET NULL,
    label TEXT NOT NULL, -- noqa: RF04
    type TEXT NOT NULL DEFAULT 'other', -- noqa: RF04
    bucket TEXT NOT NULL DEFAULT 'patient-documents',
    path TEXT NOT NULL, -- noqa: RF04
    size BIGINT,
    metadata JSONB,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Policies keep access scoped to the owning portal user while allowing
-- service role full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'patient_documents'
          AND policyname = 'Allow patient to manage own documents'
    ) THEN
        CREATE POLICY "Allow patient to manage own documents"
            ON public.patient_documents
            FOR ALL
            TO authenticated
            USING (
                user_id = auth.uid()
                OR (
                    patient_id IN (
                        SELECT id FROM public.patients WHERE user_id = auth.uid()
                    )
                )
            )
            WITH CHECK (
                user_id = auth.uid()
                OR (
                    patient_id IN (
                        SELECT id FROM public.patients WHERE user_id = auth.uid()
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'patient_documents'
          AND policyname = 'Service role manages patient documents'
    ) THEN
        CREATE POLICY "Service role manages patient documents"
            ON public.patient_documents
            FOR ALL
            TO service_role
            USING (TRUE)
            WITH CHECK (TRUE);
    END IF;
END;
$$;

-- Keep updated_at in sync
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_patient_documents_updated_at'
          AND tgrelid = 'public.patient_documents'::regclass
    ) THEN
        CREATE TRIGGER update_patient_documents_updated_at
            BEFORE UPDATE ON public.patient_documents
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id
ON public.patient_documents (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_user_id
ON public.patient_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploaded_at
ON public.patient_documents (uploaded_at DESC);
