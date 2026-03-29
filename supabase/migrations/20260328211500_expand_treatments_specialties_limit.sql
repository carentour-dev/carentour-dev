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
                            page_block.page_content_block,
                            '{limit}',
                            '12'::jsonb,
                            true
                        )
                ELSE page_block.page_content_block
            END
            ORDER BY page_block.ordinality
        ) AS updated_content
    FROM public.cms_pages AS page
    CROSS JOIN
        LATERAL jsonb_array_elements(
            coalesce(page.content, '[]'::jsonb)
        ) WITH ORDINALITY AS page_block (page_content_block, ordinality)
    WHERE page.slug = 'treatments'
    GROUP BY page.id
) AS updated_blocks
WHERE public.cms_pages.id = updated_blocks.id;
