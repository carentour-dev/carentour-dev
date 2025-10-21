-- Allow authenticated patients to create and manage their own long-form stories
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_stories'
      AND policyname = 'Patients can write patient stories'
  ) THEN
    CREATE POLICY "Patients can write patient stories"
      ON public.patient_stories
      FOR INSERT
      TO authenticated
      WITH CHECK (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_stories'
      AND policyname = 'Patients can update their patient stories'
  ) THEN
    CREATE POLICY "Patients can update their patient stories"
      ON public.patient_stories
      FOR UPDATE
      TO authenticated
      USING (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_stories'
      AND policyname = 'Patients can delete their patient stories'
  ) THEN
    CREATE POLICY "Patients can delete their patient stories"
      ON public.patient_stories
      FOR DELETE
      TO authenticated
      USING (
        patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END;
$$;

COMMIT;
