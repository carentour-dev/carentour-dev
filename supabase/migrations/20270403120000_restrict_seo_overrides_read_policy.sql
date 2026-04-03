BEGIN;

DROP POLICY IF EXISTS seo_overrides_read_all ON public.seo_overrides;
DROP POLICY IF EXISTS seo_overrides_read_managed ON public.seo_overrides;

CREATE POLICY seo_overrides_read_managed
ON public.seo_overrides
FOR SELECT
USING (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.read')
);

COMMIT;
