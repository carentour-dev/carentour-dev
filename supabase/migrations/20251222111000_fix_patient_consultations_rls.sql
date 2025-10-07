-- Align patient_consultations RLS policies with Supabase guidance by avoiding
-- per-row evaluation of auth.uid().

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_consultations'
      AND policyname = 'Patients can view their consultations'
  ) THEN
    EXECUTE '
      ALTER POLICY "Patients can view their consultations"
        ON public.patient_consultations
        USING (
          user_id = (SELECT auth.uid())
          OR patient_id IN (
            SELECT id
            FROM public.patients
            WHERE user_id = (SELECT auth.uid())
          )
        );
    ';
  END IF;
END;
$$;
