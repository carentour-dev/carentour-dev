UPDATE public.cms_pages
SET
    content = replace(
        content::text,
        '"label": "Payments, Language & Everyday Egypt"',
        '"label": "Money, Language & Daily Life"'
    )::jsonb,
    updated_at = now()
WHERE
    slug = 'travel-info'
    AND content::text LIKE '%"label": "Payments, Language & Everyday Egypt"%';
