BEGIN;

DROP POLICY IF EXISTS write_doctor_translations ON public.doctor_translations;
DROP POLICY IF EXISTS insert_doctor_translations ON public.doctor_translations;
DROP POLICY IF EXISTS update_doctor_translations ON public.doctor_translations;
DROP POLICY IF EXISTS delete_doctor_translations ON public.doctor_translations;

CREATE POLICY insert_doctor_translations
ON public.doctor_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_doctor_translations
ON public.doctor_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_doctor_translations
ON public.doctor_translations
FOR DELETE
USING (public.is_admin_or_editor());

COMMIT;
