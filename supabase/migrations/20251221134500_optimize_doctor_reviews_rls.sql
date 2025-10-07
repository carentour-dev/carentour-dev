-- Optimize contact_requests and doctor_reviews RLS policies by avoiding per-row auth.uid() recalculation.

ALTER POLICY "Anyone can submit a contact request"
  ON public.contact_requests
  WITH CHECK (
    (user_id IS NULL AND patient_id IS NULL)
    OR EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE auth_ctx.uid IS NOT NULL
        AND user_id = auth_ctx.uid
        AND (
          patient_id IS NULL
          OR patient_id IN (
            SELECT id
            FROM public.patients
            WHERE user_id = auth_ctx.uid
          )
        )
    )
  );

ALTER POLICY "Patients can view their contact requests"
  ON public.contact_requests
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE auth_ctx.uid IS NOT NULL
        AND (
          user_id = auth_ctx.uid
          OR (
            patient_id IS NOT NULL
            AND patient_id IN (
              SELECT id
              FROM public.patients
              WHERE user_id = auth_ctx.uid
            )
          )
        )
    )
  );

ALTER POLICY "Patients can write doctor reviews"
  ON public.doctor_reviews
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth_ctx.uid
        )
    )
  );

ALTER POLICY "Patients can update their doctor reviews"
  ON public.doctor_reviews
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth_ctx.uid
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth_ctx.uid
        )
    )
  );

ALTER POLICY "Patients can delete their doctor reviews"
  ON public.doctor_reviews
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE patient_id IS NOT NULL
        AND patient_id IN (
          SELECT id
          FROM public.patients
          WHERE user_id = auth_ctx.uid
        )
    )
  );
