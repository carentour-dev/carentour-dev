-- Ensure patient_documents policy caches auth.uid() via subquery
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
                user_id = (SELECT auth.uid())
                OR (
                    patient_id IN (
                        SELECT id FROM public.patients WHERE user_id = (SELECT auth.uid())
                    )
                )
            )
            WITH CHECK (
                user_id = (SELECT auth.uid())
                OR (
                    patient_id IN (
                        SELECT id FROM public.patients WHERE user_id = (SELECT auth.uid())
                    )
                )
            );
    END IF;
END;
$$;
