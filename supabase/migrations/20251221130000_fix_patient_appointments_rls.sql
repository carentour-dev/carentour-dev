-- Update patient appointments RLS policy to avoid per-row auth.uid() overhead
ALTER POLICY "Patients can view their appointments"
  ON public.patient_appointments
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) AS auth_ctx
      WHERE patient_appointments.user_id = auth_ctx.uid
        OR EXISTS (
          SELECT 1
          FROM public.patients AS p
          WHERE p.id = patient_appointments.patient_id
            AND p.user_id = auth_ctx.uid
        )
    )
  );
