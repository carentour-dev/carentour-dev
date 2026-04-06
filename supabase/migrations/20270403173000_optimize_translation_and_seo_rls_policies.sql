BEGIN;

-- Avoid overlapping permissive policies on translation tables by replacing
-- broad FOR ALL write policies with explicit INSERT/UPDATE/DELETE policies.

DROP POLICY IF EXISTS write_cms_page_translations ON public.cms_page_translations;
DROP POLICY IF EXISTS insert_cms_page_translations ON public.cms_page_translations;
DROP POLICY IF EXISTS update_cms_page_translations ON public.cms_page_translations;
DROP POLICY IF EXISTS delete_cms_page_translations ON public.cms_page_translations;

CREATE POLICY insert_cms_page_translations
ON public.cms_page_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_cms_page_translations
ON public.cms_page_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_cms_page_translations
ON public.cms_page_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_navigation_link_translations ON public.navigation_link_translations;
DROP POLICY IF EXISTS insert_navigation_link_translations ON public.navigation_link_translations;
DROP POLICY IF EXISTS update_navigation_link_translations ON public.navigation_link_translations;
DROP POLICY IF EXISTS delete_navigation_link_translations ON public.navigation_link_translations;

CREATE POLICY insert_navigation_link_translations
ON public.navigation_link_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_navigation_link_translations
ON public.navigation_link_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_navigation_link_translations
ON public.navigation_link_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_faq_translations ON public.faq_translations;
DROP POLICY IF EXISTS insert_faq_translations ON public.faq_translations;
DROP POLICY IF EXISTS update_faq_translations ON public.faq_translations;
DROP POLICY IF EXISTS delete_faq_translations ON public.faq_translations;

CREATE POLICY insert_faq_translations
ON public.faq_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_faq_translations
ON public.faq_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_faq_translations
ON public.faq_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_faq_category_translations ON public.faq_category_translations;
DROP POLICY IF EXISTS insert_faq_category_translations ON public.faq_category_translations;
DROP POLICY IF EXISTS update_faq_category_translations ON public.faq_category_translations;
DROP POLICY IF EXISTS delete_faq_category_translations ON public.faq_category_translations;

CREATE POLICY insert_faq_category_translations
ON public.faq_category_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_faq_category_translations
ON public.faq_category_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_faq_category_translations
ON public.faq_category_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_category_translations ON public.blog_category_translations;
DROP POLICY IF EXISTS insert_blog_category_translations ON public.blog_category_translations;
DROP POLICY IF EXISTS update_blog_category_translations ON public.blog_category_translations;
DROP POLICY IF EXISTS delete_blog_category_translations ON public.blog_category_translations;

CREATE POLICY insert_blog_category_translations
ON public.blog_category_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_blog_category_translations
ON public.blog_category_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_blog_category_translations
ON public.blog_category_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_tag_translations ON public.blog_tag_translations;
DROP POLICY IF EXISTS insert_blog_tag_translations ON public.blog_tag_translations;
DROP POLICY IF EXISTS update_blog_tag_translations ON public.blog_tag_translations;
DROP POLICY IF EXISTS delete_blog_tag_translations ON public.blog_tag_translations;

CREATE POLICY insert_blog_tag_translations
ON public.blog_tag_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_blog_tag_translations
ON public.blog_tag_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_blog_tag_translations
ON public.blog_tag_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_author_translations ON public.blog_author_translations;
DROP POLICY IF EXISTS insert_blog_author_translations ON public.blog_author_translations;
DROP POLICY IF EXISTS update_blog_author_translations ON public.blog_author_translations;
DROP POLICY IF EXISTS delete_blog_author_translations ON public.blog_author_translations;

CREATE POLICY insert_blog_author_translations
ON public.blog_author_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_blog_author_translations
ON public.blog_author_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_blog_author_translations
ON public.blog_author_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_blog_post_translations ON public.blog_post_translations;
DROP POLICY IF EXISTS insert_blog_post_translations ON public.blog_post_translations;
DROP POLICY IF EXISTS update_blog_post_translations ON public.blog_post_translations;
DROP POLICY IF EXISTS delete_blog_post_translations ON public.blog_post_translations;

CREATE POLICY insert_blog_post_translations
ON public.blog_post_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_blog_post_translations
ON public.blog_post_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_blog_post_translations
ON public.blog_post_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_treatment_translations ON public.treatment_translations;
DROP POLICY IF EXISTS insert_treatment_translations ON public.treatment_translations;
DROP POLICY IF EXISTS update_treatment_translations ON public.treatment_translations;
DROP POLICY IF EXISTS delete_treatment_translations ON public.treatment_translations;

CREATE POLICY insert_treatment_translations
ON public.treatment_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_treatment_translations
ON public.treatment_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_treatment_translations
ON public.treatment_translations
FOR DELETE
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS write_treatment_procedure_translations ON public.treatment_procedure_translations;
DROP POLICY IF EXISTS insert_treatment_procedure_translations ON public.treatment_procedure_translations;
DROP POLICY IF EXISTS update_treatment_procedure_translations ON public.treatment_procedure_translations;
DROP POLICY IF EXISTS delete_treatment_procedure_translations ON public.treatment_procedure_translations;

CREATE POLICY insert_treatment_procedure_translations
ON public.treatment_procedure_translations
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY update_treatment_procedure_translations
ON public.treatment_procedure_translations
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY delete_treatment_procedure_translations
ON public.treatment_procedure_translations
FOR DELETE
USING (public.is_admin_or_editor());

-- Cache auth context in policy expressions to avoid per-row auth.role()
-- evaluation in the advisor checks.

DROP POLICY IF EXISTS seo_overrides_read_all ON public.seo_overrides;
DROP POLICY IF EXISTS seo_overrides_read_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_read_managed
ON public.seo_overrides
FOR SELECT
USING (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.read')
);

DROP POLICY IF EXISTS seo_overrides_insert_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_insert_managed
ON public.seo_overrides
FOR INSERT
WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

DROP POLICY IF EXISTS seo_overrides_update_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_update_managed
ON public.seo_overrides
FOR UPDATE
USING (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
)
WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

DROP POLICY IF EXISTS seo_overrides_delete_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_delete_managed
ON public.seo_overrides
FOR DELETE
USING (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

DROP POLICY IF EXISTS route_redirects_read_active ON public.route_redirects;
CREATE POLICY route_redirects_read_active
ON public.route_redirects
FOR SELECT
USING (
    is_active = true
    OR (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.read')
);

DROP POLICY IF EXISTS route_redirects_insert_managed ON public.route_redirects;
CREATE POLICY route_redirects_insert_managed
ON public.route_redirects
FOR INSERT
WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

DROP POLICY IF EXISTS route_redirects_update_managed ON public.route_redirects;
CREATE POLICY route_redirects_update_managed
ON public.route_redirects
FOR UPDATE
USING (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
)
WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

DROP POLICY IF EXISTS route_redirects_delete_managed ON public.route_redirects;
CREATE POLICY route_redirects_delete_managed
ON public.route_redirects
FOR DELETE
USING (
    (SELECT auth.role()) = 'service_role'
    OR public.has_permission((SELECT auth.uid()), 'cms.write')
);

COMMIT;
