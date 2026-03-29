UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'trustSignals'
                        THEN
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        block,
                                        '{heading}',
                                        to_jsonb(
                                            'We organize answers around the decisions international patients need to make'::text
                                        ),
                                        false
                                    ),
                                    '{description}',
                                    to_jsonb(
                                        'At Care N Tour, we use this FAQ to answer the medical, operational, and travel questions patients ask before choosing treatment in Egypt.'::text
                                    ),
                                    false
                                ),
                                '{items}',
                                jsonb_build_array(
                                    jsonb_build_object(
                                        'eyebrow', '01',
                                        'icon', 'Stethoscope',
                                        'title',
                                        'Treatment planning and doctor selection',
                                        'description',
                                        'We explain how we review records, coordinate specialist opinions, outline timelines, and help you evaluate the right treatment pathway.'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '02',
                                        'icon', 'Plane',
                                        'title',
                                        'Travel, arrival, and accommodation',
                                        'description',
                                        'We answer practical questions about airport reception, stay planning, companion support, and on-ground coordination in Egypt.'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '03',
                                        'icon', 'BadgeDollarSign',
                                        'title',
                                        'Pricing, packages, and payment clarity',
                                        'description',
                                        'We clarify what patients usually want to understand about estimated costs, package scope, payment timing, and what can affect final pricing.'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '04',
                                        'icon', 'ShieldCheck',
                                        'title',
                                        'Recovery, discharge, and follow-up',
                                        'description',
                                        'We explain how aftercare, discharge planning, return travel, and post-treatment communication are coordinated after you leave Egypt.'
                                    )
                                ),
                                false
                            )
                    WHEN block ->> 'type' = 'faqDirectory'
                        THEN
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            block,
                                            '{heading}',
                                            to_jsonb(
                                                'Browse our international patient FAQ by topic or search for a specific question'::text
                                            ),
                                            false
                                        ),
                                        '{description}',
                                        to_jsonb(
                                            'Every answer below is managed in our CMS and written to help patients, families, and referral partners find clear information about treatment in Egypt, medical travel planning, pricing, accommodation, safety, and recovery.'::text
                                        ),
                                        false
                                    ),
                                    '{navigationHeading}',
                                    to_jsonb('Browse FAQ topics'::text),
                                    false
                                ),
                                '{searchPlaceholder}',
                                to_jsonb(
                                    'Search the FAQ for treatment in Egypt, doctors, travel planning, pricing, accommodation, safety, or recovery'::text
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
