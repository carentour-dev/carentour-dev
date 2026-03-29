UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'trustSignals'
                        THEN
                            jsonb_build_object(
                                'type', 'trustSignals',
                                'eyebrow', 'Operating Standard',
                                'heading',
                                'Why international patients trust Care N Tour for travel preparation as well as treatment coordination in Egypt',
                                'description',
                                'At Care N Tour, we coordinate the operational side of medical travel to Egypt with the same discipline we bring to provider access, so patients and families can move from research to arrival with more clarity, continuity, and confidence.',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'eyebrow', '01',
                                        'title',
                                        'Case-specific planning before you book',
                                        'description',
                                        'We review the likely entry route, recovery stay format, companion needs, and realistic travel timing before you commit to flights, accommodation, or treatment dates.',
                                        'icon', 'FileCheck'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '02',
                                        'title',
                                        'Travel logistics aligned with the treatment pathway',
                                        'description',
                                        'Visa planning, accommodation, airport transfers, local mobility, and return timing are coordinated around consultations, procedures, follow-up, and recovery.',
                                        'icon', 'Route'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '03',
                                        'title',
                                        'Support for patients, companions, and families',
                                        'description',
                                        'We keep the wider journey organized with practical support around arrival, stay logistics, discharge planning, and continuity after treatment in Egypt.',
                                        'icon', 'Users'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '04',
                                        'title',
                                        'Multilingual communication built for international expectations',
                                        'description',
                                        'Our coordination model is built for multinational patients and families who need clear updates, responsive planning, and confident communication across markets and languages.',
                                        'icon', 'Languages'
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
WHERE slug = 'travel-info';
