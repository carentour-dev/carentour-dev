UPDATE public.cms_pages
SET
    seo = $${
    "title": "FAQ for International Patients Seeking Treatment in Egypt | Care N Tour",
    "description": "Read Care N Tour's FAQ for international patients seeking treatment in Egypt, with answers on doctors, accredited hospitals, medical travel planning, pricing, accommodation, safety, recovery, and follow-up."
  }$$::jsonb,
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'aboutHero'
                        THEN
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            block,
                                            '{eyebrow}',
                                            to_jsonb('Care N Tour FAQ'::text),
                                            false
                                        ),
                                        '{heading}',
                                        to_jsonb(
                                            'We answer the questions international patients ask before planning treatment in Egypt.'::text
                                        ),
                                        false
                                    ),
                                    '{description}',
                                    to_jsonb(
                                        'At Care N Tour, we explain how we coordinate specialist review, accredited hospital access, treatment planning, travel, accommodation, pricing guidance, safety, and follow-up so you can evaluate treatment in Egypt with clarity and confidence.'::text
                                    ),
                                    false
                                ),
                                '{highlights}',
                                jsonb_build_array(
                                    jsonb_build_object(
                                        'kicker', 'Planning',
                                        'label',
                                        'We explain how records review, specialist matching, timelines, and next-step planning work before you travel.'
                                    ),
                                    jsonb_build_object(
                                        'kicker', 'Travel',
                                        'label',
                                        'We answer practical questions about arrival, accommodation, companions, and local coordination in Egypt.'
                                    ),
                                    jsonb_build_object(
                                        'kicker', 'Continuity',
                                        'label',
                                        'We clarify pricing guidance, recovery expectations, discharge planning, and follow-up after you return home.'
                                    )
                                ),
                                false
                            )
                    ELSE block
                END
                ORDER BY ord
            )
        FROM jsonb_array_elements(content) WITH ORDINALITY
    ),
    updated_at = now()
WHERE slug = 'faq';
