-- Align contact_requests RLS policies with Supabase guidance by avoiding
-- per-row evaluation of auth.uid().

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Anyone can submit a contact request'
  ) THEN
    EXECUTE '
      ALTER POLICY "Anyone can submit a contact request"
        ON public.contact_requests
        WITH CHECK (
          (user_id IS NULL AND patient_id IS NULL)
          OR (
            (SELECT auth.uid()) IS NOT NULL
            AND user_id = (SELECT auth.uid())
            AND (
              patient_id IS NULL
              OR patient_id IN (
                SELECT id
                FROM public.patients
                WHERE user_id = (SELECT auth.uid())
              )
            )
          )
        );
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Patients can view their contact requests'
  ) THEN
    EXECUTE '
      ALTER POLICY "Patients can view their contact requests"
        ON public.contact_requests
        USING (
          user_id = (SELECT auth.uid())
          OR (
            patient_id IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = (SELECT auth.uid())
            )
          )
        );
    ';
  END IF;
END;
$$;
