-- Consolidate navigation link SELECT policies.
-- Keeps rules single-source while letting admins/editors read drafts.
BEGIN;

DROP POLICY IF EXISTS admin_editor_read_navigation_links
ON public.navigation_links;

DROP POLICY IF EXISTS read_published_navigation_links
ON public.navigation_links;

CREATE POLICY read_navigation_links
ON public.navigation_links
FOR SELECT
USING (
    status = 'published'
    OR public.is_admin_or_editor()
);

COMMIT;
