BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_arabic_company_name_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN input IS NULL THEN NULL
        ELSE regexp_replace(
            input,
            '(كير|كار)\s*(?:إن|اند|آند|&)\s*تور',
            'كير آند تور',
            'g'
        )
    END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_arabic_company_name_jsonb(input jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    scalar_text text;
BEGIN
    IF input IS NULL THEN
        RETURN NULL;
    END IF;

    CASE jsonb_typeof(input)
        WHEN 'string' THEN
            SELECT value
            INTO scalar_text
            FROM jsonb_array_elements_text(jsonb_build_array(input)) AS element(value);

            RETURN to_jsonb(public.normalize_arabic_company_name_text(scalar_text));
        WHEN 'array' THEN
            RETURN coalesce(
                (
                    SELECT jsonb_agg(
                        public.normalize_arabic_company_name_jsonb(value)
                        ORDER BY ordinality
                    )
                    FROM jsonb_array_elements(input) WITH ORDINALITY AS array_items(value, ordinality)
                ),
                '[]'::jsonb
            );
        WHEN 'object' THEN
            RETURN coalesce(
                (
                    SELECT jsonb_object_agg(
                        key,
                        public.normalize_arabic_company_name_jsonb(value)
                    )
                    FROM jsonb_each(input) AS object_items(key, value)
                ),
                '{}'::jsonb
            );
        ELSE
            RETURN input;
    END CASE;
END;
$$;

WITH normalized AS (
    SELECT
        id,
        public.normalize_arabic_company_name_text(title) AS new_title,
        public.normalize_arabic_company_name_jsonb(seo) AS new_seo,
        public.normalize_arabic_company_name_jsonb(content) AS new_content
    FROM public.cms_page_translations
    WHERE locale = 'ar'
)

UPDATE public.cms_page_translations AS translation
SET
    title = normalized.new_title,
    seo = normalized.new_seo,
    content = normalized.new_content
FROM normalized
WHERE
    translation.id = normalized.id
    AND (
        translation.title IS DISTINCT FROM normalized.new_title
        OR translation.seo IS DISTINCT FROM normalized.new_seo
        OR translation.content IS DISTINCT FROM normalized.new_content
    );

WITH normalized AS (
    SELECT
        id,
        public.normalize_arabic_company_name_text(label) AS new_label
    FROM public.navigation_link_translations
    WHERE locale = 'ar'
)

UPDATE public.navigation_link_translations AS translation
SET label = normalized.new_label
FROM normalized
WHERE
    translation.id = normalized.id
    AND translation.label IS DISTINCT FROM normalized.new_label;

WITH normalized AS (
    SELECT
        id,
        public.normalize_arabic_company_name_text(question) AS new_question,
        public.normalize_arabic_company_name_text(answer) AS new_answer
    FROM public.faq_translations
    WHERE locale = 'ar'
)

UPDATE public.faq_translations AS translation
SET
    question = normalized.new_question,
    answer = normalized.new_answer
FROM normalized
WHERE
    translation.id = normalized.id
    AND (
        translation.question IS DISTINCT FROM normalized.new_question
        OR translation.answer IS DISTINCT FROM normalized.new_answer
    );

WITH normalized AS (
    SELECT
        id,
        public.normalize_arabic_company_name_text(title) AS new_title,
        public.normalize_arabic_company_name_text(description) AS new_description
    FROM public.faq_category_translations
    WHERE locale = 'ar'
)

UPDATE public.faq_category_translations AS translation
SET
    title = normalized.new_title,
    description = normalized.new_description
FROM normalized
WHERE
    translation.id = normalized.id
    AND (
        translation.title IS DISTINCT FROM normalized.new_title
        OR translation.description IS DISTINCT FROM normalized.new_description
    );

DROP FUNCTION public.normalize_arabic_company_name_jsonb(jsonb);
DROP FUNCTION public.normalize_arabic_company_name_text(text);

COMMIT;
