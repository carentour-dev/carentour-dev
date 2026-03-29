UPDATE public.cms_pages
SET
    content = replace(
        replace(
            content::text,
            '"label": "Payments, Language & Everyday Egypt"',
            '"label": "Money & Daily Life"'
        ),
        '"label": "Money, Language & Daily Life"',
        '"label": "Money & Daily Life"'
    )::jsonb,
    updated_at = now()
WHERE
    slug = 'travel-info'
    AND (
        content::text LIKE '%"label": "Payments, Language & Everyday Egypt"%'
        OR content::text LIKE '%"label": "Money, Language & Daily Life"%'
    );
