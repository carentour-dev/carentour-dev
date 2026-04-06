-- Ensure translation-table updated_at triggers run with a predictable search_path
ALTER FUNCTION public.cms_page_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.navigation_link_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.faq_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.faq_category_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.blog_category_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.blog_tag_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.blog_author_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.blog_post_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.treatment_translations_set_updated_at()
SET search_path = public;

ALTER FUNCTION public.treatment_procedure_translations_set_updated_at()
SET search_path = public;
