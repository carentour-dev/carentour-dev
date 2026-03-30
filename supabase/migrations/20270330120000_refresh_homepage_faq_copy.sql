UPDATE public.cms_pages AS cms_page
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN blocks.block ->> 'type' = 'faq'
                        THEN
                            jsonb_build_object(
                                'type', 'faq',
                                'eyebrow', 'Frequently Asked Questions',
                                'heading',
                                'Questions we answer before international patients choose treatment in Egypt',
                                'description',
                                'At Care N Tour, we explain how specialist review, accredited hospitals in Egypt, treatment timelines, travel planning, accommodation, companion support, pricing guidance, and follow-up work so patients and families can move forward with confidence.',
                                'layout', 'twoColumn',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'question',
                                        'How does Care N Tour help international patients plan treatment in Egypt?',
                                        'answer',
                                        'We review each patient''s goals and medical records, coordinate specialist matching, and build a personalized treatment and medical travel plan that can include hospital access, timing, accommodation, transfers, and follow-up support.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'How do you choose doctors and hospitals in Egypt?',
                                        'answer',
                                        'We introduce patients to trusted doctors and accredited hospitals in Egypt based on medical needs, treatment goals, and practical travel considerations, so provider evaluation is clearer before any decision is made.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Will I understand the expected cost before I decide to travel?',
                                        'answer',
                                        'We prepare pricing guidance based on the recommended treatment, hospital, expected length of stay, accommodation, and support scope, so patients can understand the package structure and expected costs before committing.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'What do you need from me before you can build a treatment and travel plan?',
                                        'answer',
                                        'We usually need medical records, recent test results or imaging, passport details, and the preferred travel window. With that information, we can coordinate specialist review and outline a realistic treatment and travel timeline.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Can Care N Tour arrange accommodation, airport transfers, and support for family members?',
                                        'answer',
                                        'Yes. We coordinate accommodation, airport reception, local transportation, and companion planning so patients and families have one point of contact before arrival, during treatment, and throughout recovery in Egypt.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'What happens after treatment in Egypt is completed?',
                                        'answer',
                                        'We continue coordinating discharge guidance, recovery planning, return-travel logistics, and follow-up communication so the patient leaves Egypt with clear documentation, defined next steps, and continuity after returning home.'
                                    )
                                )
                            )
                    ELSE blocks.block
                END
                ORDER BY blocks.ord
            )
        FROM jsonb_array_elements(cms_page.content) WITH ORDINALITY AS blocks (block, ord)
    ),
    updated_at = now()
WHERE slug = 'home';
