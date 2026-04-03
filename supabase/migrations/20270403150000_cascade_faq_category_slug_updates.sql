BEGIN;

ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS fk_faqs_category;

ALTER TABLE public.faqs
ADD CONSTRAINT fk_faqs_category FOREIGN KEY (category)
REFERENCES public.faq_categories (slug)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE public.faq_category_translations
DROP CONSTRAINT IF EXISTS faq_category_translations_faq_category_slug_fkey;

ALTER TABLE public.faq_category_translations
ADD CONSTRAINT faq_category_translations_faq_category_slug_fkey
FOREIGN KEY (faq_category_slug)
REFERENCES public.faq_categories (slug)
ON UPDATE CASCADE
ON DELETE CASCADE;

COMMIT;
