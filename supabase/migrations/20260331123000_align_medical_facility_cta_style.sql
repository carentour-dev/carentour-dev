WITH target_pages AS (
    SELECT
        id,
        slug,
        content
    FROM public.cms_pages
    WHERE slug IN ('medical-facilities', 'medical-facilities-detail-template')
),

rebuilt_content AS (
    SELECT
        target_page.id,
        jsonb_agg(
            CASE
                WHEN page_block.block_value ->> 'type' = 'callToAction'
                    THEN
                        page_block.block_value
                        || jsonb_build_object(
                            'layout',
                            'split',
                            'background',
                            'dark',
                            'style',
                            jsonb_build_object(
                                'layout',
                                jsonb_build_object(
                                    'padding',
                                    jsonb_build_object(
                                        'top',
                                        jsonb_build_object('base', 'lg'),
                                        'bottom',
                                        jsonb_build_object('base', 'lg')
                                    )
                                ),
                                'background',
                                jsonb_build_object(
                                    'variant',
                                    'solid',
                                    'color',
                                    jsonb_build_object(
                                        'base',
                                        'hsl(var(--editorial-ink))'
                                    ),
                                    'overlayOpacity',
                                    jsonb_build_object('base', 0)
                                )
                            )
                        )
                        || jsonb_build_object(
                            'actions',
                            coalesce(
                                (
                                    SELECT
                                        jsonb_agg(
                                            CASE
                                                WHEN cta_action.ordinality = 1
                                                    THEN
                                                        cta_action.action_value
                                                        || jsonb_build_object(
                                                            'variant',
                                                            'default'
                                                        )
                                                WHEN cta_action.ordinality = 2
                                                    THEN
                                                        cta_action.action_value
                                                        || jsonb_build_object(
                                                            'variant',
                                                            'outline'
                                                        )
                                                ELSE cta_action.action_value
                                            END
                                            ORDER BY cta_action.ordinality
                                        )
                                    FROM jsonb_array_elements(
                                        coalesce(
                                            page_block.block_value -> 'actions',
                                            '[]'::jsonb
                                        )
                                    ) WITH ORDINALITY AS cta_action (
                                        action_value,
                                        ordinality
                                    )
                                ),
                                '[]'::jsonb
                            )
                        )
                ELSE page_block.block_value
            END
            ORDER BY page_block.ordinality
        ) AS rebuilt_page_content
    FROM target_pages AS target_page
    CROSS JOIN
        LATERAL jsonb_array_elements(target_page.content)
        WITH ORDINALITY AS page_block (block_value, ordinality)
    GROUP BY target_page.id
)

UPDATE public.cms_pages AS cms_page
SET
    content = rebuilt_content.rebuilt_page_content,
    updated_at = now()
FROM rebuilt_content
WHERE cms_page.id = rebuilt_content.id;
