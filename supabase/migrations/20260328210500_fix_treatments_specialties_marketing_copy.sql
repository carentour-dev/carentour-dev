UPDATE public.cms_pages
SET content = updated_blocks.updated_content
FROM (
    SELECT
        page.id,
        jsonb_agg(
            CASE
                WHEN
                    page_block.page_content_block ->> 'type'
                    = 'treatmentSpecialties'
                    THEN
                        jsonb_set(
                            jsonb_set(
                                page_block.page_content_block - 'eyebrow',
                                '{heading}',
                                to_jsonb('Our Medical Specialties'::text),
                                TRUE
                            ),
                            '{description}',
                            to_jsonb(
                                (
                                    'World-class medical care across multiple '
                                    || 'specialties with significant cost '
                                    || 'savings.'
                                )::text
                            ),
                            TRUE
                        )
                ELSE page_block.page_content_block
            END
            ORDER BY page_block.ord
        ) AS updated_content
    FROM public.cms_pages AS page
    CROSS JOIN
        LATERAL jsonb_array_elements(coalesce(page.content, '[]'::jsonb))
        WITH ORDINALITY AS page_block (page_content_block, ord)
    WHERE page.slug = 'treatments'
    GROUP BY page.id
) AS updated_blocks
WHERE public.cms_pages.id = updated_blocks.id;
