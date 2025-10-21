-- Optimize patient_stories RLS policies to cache auth context per statement.
DO $$
BEGIN
  EXECUTE '
    ALTER POLICY "Patients can write patient stories"
      ON public.patient_stories
      WITH CHECK (
        patient_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM (SELECT auth.uid() AS uid) AS auth_ctx
          WHERE auth_ctx.uid IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = auth_ctx.uid
            )
        )
      );
  ';

  EXECUTE '
    ALTER POLICY "Patients can update their patient stories"
      ON public.patient_stories
      USING (
        patient_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM (SELECT auth.uid() AS uid) AS auth_ctx
          WHERE auth_ctx.uid IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = auth_ctx.uid
            )
        )
      )
      WITH CHECK (
        patient_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM (SELECT auth.uid() AS uid) AS auth_ctx
          WHERE auth_ctx.uid IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = auth_ctx.uid
            )
        )
      );
  ';

  EXECUTE '
    ALTER POLICY "Patients can delete their patient stories"
      ON public.patient_stories
      USING (
        patient_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM (SELECT auth.uid() AS uid) AS auth_ctx
          WHERE auth_ctx.uid IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = auth_ctx.uid
            )
        )
      );
  ';
END;
$$;
