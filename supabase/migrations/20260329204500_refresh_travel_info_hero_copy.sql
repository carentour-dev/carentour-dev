UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'aboutHero'
                        THEN
                            jsonb_build_object(
                                'type', 'aboutHero',
                                'eyebrow', 'Travel Information',
                                'heading',
                                'Medical travel information for international patients planning treatment in Egypt.',
                                'description',
                                'At Care N Tour, we help international patients and families prepare for medical travel to Egypt with clearer guidance on entry planning, accommodation, recovery, local mobility, and companion support.',
                                'backgroundImageUrl',
                                'https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png',
                                'overlay', jsonb_build_object(
                                    'fromColor', '#000000',
                                    'fromOpacity', 0.7,
                                    'viaColor', '#000000',
                                    'viaOpacity', 0.45,
                                    'toColor', '#000000',
                                    'toOpacity', 0
                                ),
                                'highlights', jsonb_build_array(
                                    jsonb_build_object(
                                        'kicker', 'Entry',
                                        'label',
                                        'Egypt entry pathways, document planning, and case-specific travel timing explained clearly'
                                    ),
                                    jsonb_build_object(
                                        'kicker', 'Stay',
                                        'label',
                                        'Recovery-focused accommodation and companion planning aligned with consultations, procedures, and follow-up'
                                    ),
                                    jsonb_build_object(
                                        'kicker', 'Coordination',
                                        'label',
                                        'One Care N Tour coordination team connecting treatment planning, travel preparation, and on-ground support'
                                    )
                                ),
                                'primaryAction', jsonb_build_object(
                                    'label', 'Start your journey',
                                    'href', '/start-journey',
                                    'variant', 'default'
                                ),
                                'secondaryAction', jsonb_build_object(
                                    'label', 'Plan your trip',
                                    'href', '/plan',
                                    'variant', 'hero'
                                )
                            )
                    ELSE block
                END
                ORDER BY ord
            )
        FROM jsonb_array_elements(content) WITH ORDINALITY
    ),
    updated_at = now()
WHERE slug = 'travel-info';
