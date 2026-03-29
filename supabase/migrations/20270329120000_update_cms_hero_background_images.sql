WITH rewritten_pages AS (
    SELECT
        page.id,
        jsonb_agg(
            CASE
                WHEN
                    page_block.page_content_block ->> 'type'
                    IN ('aboutHero', 'homeHero')
                    AND page_block.page_content_block ->> 'backgroundImageUrl'
                    = '/hero-medical-facility.webp'
                    THEN jsonb_set(
                        page_block.page_content_block,
                        '{backgroundImageUrl}',
                        to_jsonb(
                            (
                                'https://cmnwwchipysvwvijqjcu.supabase.co/'
                                || 'storage/v1/'
                                || 'object/public/media/cms/home-hero/'
                                || '90bc8c9d-bab8-45e6-9975-c7308001f4dd'
                                || '/'
                                || 'cnt_hero.png'
                            )::text
                        )
                    )
                ELSE page_block.page_content_block
            END
            ORDER BY page_block.ordinality
        ) AS updated_content
    FROM public.cms_pages AS page
    CROSS JOIN
        LATERAL jsonb_array_elements(
            CASE
                WHEN jsonb_typeof(page.content) = 'array' THEN page.content
                ELSE '[]'::jsonb
            END
        ) WITH ORDINALITY AS page_block (page_content_block, ordinality)
    GROUP BY page.id
)

UPDATE public.cms_pages AS page
SET content = rewritten_pages.updated_content
FROM rewritten_pages
WHERE
    page.id = rewritten_pages.id
    AND page.content IS DISTINCT FROM rewritten_pages.updated_content;
