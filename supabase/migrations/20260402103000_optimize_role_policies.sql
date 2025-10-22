BEGIN;

-- Newsletter subscriptions: avoid repeated auth.uid() calls
DROP POLICY IF EXISTS admin_view_all_subscriptions
ON public.newsletter_subscriptions;
CREATE POLICY admin_view_all_subscriptions
ON public.newsletter_subscriptions
FOR SELECT
USING (
    public.has_role((SELECT auth.uid()), 'admin')
);

-- Security events
DROP POLICY IF EXISTS admin_view_security_events
ON public.security_events;
CREATE POLICY admin_view_security_events
ON public.security_events
FOR SELECT
USING (
    public.has_role((SELECT auth.uid()), 'admin')
);

-- CMS storage bucket policies
DROP POLICY IF EXISTS admin_editor_write_cms_assets
ON storage.objects;
CREATE POLICY admin_editor_write_cms_assets
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'cms-assets'
    AND public.has_any_role(
        (SELECT auth.uid()),
        ARRAY['admin', 'editor']
    )
);

DROP POLICY IF EXISTS admin_editor_modify_cms_assets
ON storage.objects;
CREATE POLICY admin_editor_modify_cms_assets
ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'cms-assets'
    AND public.has_any_role(
        (SELECT auth.uid()),
        ARRAY['admin', 'editor']
    )
)
WITH CHECK (
    bucket_id = 'cms-assets'
    AND public.has_any_role(
        (SELECT auth.uid()),
        ARRAY['admin', 'editor']
    )
);

DROP POLICY IF EXISTS admin_editor_delete_cms_assets
ON storage.objects;
CREATE POLICY admin_editor_delete_cms_assets
ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'cms-assets'
    AND public.has_any_role(
        (SELECT auth.uid()),
        ARRAY['admin', 'editor']
    )
);

COMMIT;
