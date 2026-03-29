UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'faq'
                        THEN
                            jsonb_build_object(
                                'type', 'faq',
                                'eyebrow', 'Frequently Asked Questions',
                                'heading',
                                'Frequently asked questions about Care N Tour concierge services for international patients',
                                'description',
                                'These answers explain how Care N Tour coordinates medical travel, treatment logistics, accommodation, transfers, companion support, and follow-up for international patients coming to Egypt.',
                                'layout', 'twoColumn',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'question',
                                        'What does Care N Tour concierge support include for international patients?',
                                        'answer',
                                        'Care N Tour concierge services for international '
                                        || 'patients can include medical scheduling coordination, '
                                        || 'medical records review support, travel planning, '
                                        || 'airport transfers, accommodation arrangements, '
                                        || 'companion logistics, multilingual communication, and '
                                        || 'practical recovery planning around treatment in Egypt. '
                                        || 'Our role is to keep the full patient journey organized '
                                        || 'from pre-arrival preparation to post-treatment follow-up.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Is concierge support separate from treatment coordination?',
                                        'answer',
                                        'No. At Care N Tour, concierge support is integrated with treatment coordination. We align consultations, diagnostics, procedures, admission timing, discharge, travel logistics, and follow-up so patients are not managing medical planning and practical planning through separate channels.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Can Care N Tour help family members or companions traveling with the patient?',
                                        'answer',
                                        'Yes. We can coordinate accommodation, airport reception, local transportation, and practical planning for family members or companions traveling with the patient. This helps international families stay informed, supported, and logistically prepared throughout the treatment journey in Egypt.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Do you help patients before they arrive in Egypt?',
                                        'answer',
                                        'Yes. Before arrival, Care N Tour helps patients organize medical records, clarify treatment steps, align the expected travel window, and prepare accommodation and airport transfer planning before bookings are finalized. Early coordination helps reduce uncertainty and makes treatment travel to Egypt easier to plan with confidence.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Is concierge support available after treatment is completed?',
                                        'answer',
                                        'Yes. Our concierge support can continue after treatment through discharge planning, follow-up coordination, return-travel preparation, and practical continuity once the patient returns home. We want patients to leave Egypt with a clear next step, not unresolved coordination questions.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'What is the best next step if I want Care N Tour to coordinate my trip?',
                                        'answer',
                                        'The best next step is to submit your request through our guided intake. Once we review your medical goals, timeline, travel preferences, and support needs, our team can recommend the next steps for treatment planning, medical travel coordination, and concierge support in Egypt.'
                                    )
                                )
                            )
                    ELSE block
                END
                ORDER BY ord
            )
        FROM jsonb_array_elements(content) WITH ORDINALITY
    ),
    updated_at = now()
WHERE slug = 'concierge';
