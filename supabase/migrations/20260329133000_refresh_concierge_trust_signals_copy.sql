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
                                'Our international patient concierge services reflect the discipline, responsiveness, and global readiness patients expect when planning treatment in Egypt.',
                                'description',
                                'At Care N Tour, we deliver concierge support through a structured international patient service model built for clear communication, dependable coordination, and continuity across medical travel, treatment, and recovery.',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'eyebrow', '01',
                                        'title',
                                        'Medical travel coordination connected to the treatment plan',
                                        'description',
                                        'We align records review, specialist scheduling, consultations, procedures, transfers, and follow-up timing so non-clinical logistics support the care plan instead of competing with it.',
                                        'icon', 'Workflow'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '02',
                                        'title',
                                        'Multilingual communication for international patients and families',
                                        'description',
                                        'Our coordination model is designed for multinational audiences who need understandable updates, clearer documentation requirements, and responsive communication across languages and time zones.',
                                        'icon', 'Languages'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '03',
                                        'title',
                                        'Accommodation, transfers, and recovery support planned early',
                                        'description',
                                        'We plan airport reception, accommodation, companion arrangements, and recovery-related logistics around the procedure, expected stay, mobility needs, and discharge timeline.',
                                        'icon', 'BedSingle'
                                    ),
                                    jsonb_build_object(
                                        'eyebrow', '04',
                                        'title',
                                        'International patient support that continues after arrival',
                                        'description',
                                        'Our concierge support continues through treatment logistics, discharge preparation, return-travel planning, and follow-up coordination after the patient returns home.',
                                        'icon', 'RefreshCcw'
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
