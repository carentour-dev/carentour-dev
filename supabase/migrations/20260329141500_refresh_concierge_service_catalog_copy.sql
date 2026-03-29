UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'serviceCatalog'
                        THEN
                            jsonb_build_object(
                                'type', 'serviceCatalog',
                                'eyebrow', 'Service Scope',
                                'heading',
                                'The concierge services we coordinate for international patients, companions, and family decision-makers',
                                'description',
                                'At Care N Tour, each concierge service is designed to remove friction from medical travel in Egypt by connecting treatment planning, travel logistics, accommodation, communication, and follow-up through one coordinated international patient service model.',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'title', 'Medical case coordination',
                                        'description',
                                        'We coordinate the practical work around medical review so international patients can move from inquiry to a clearer treatment plan with less delay and less back-and-forth.',
                                        'icon', 'HeartHandshake',
                                        'availability',
                                        'Pre-arrival through follow-up',
                                        'bullets', jsonb_build_array(
                                            'Collection and organization of medical reports, scans, and supporting documents for review',
                                            'Specialist matching and appointment coordination aligned with the patient case',
                                            'Scheduling support across consultation, diagnostics, treatment, and review milestones',
                                            'Follow-up planning built in early so continuity is considered from the start'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English',
                                            'Arabic',
                                            'French',
                                            'German'
                                        ),
                                        'note',
                                        'This service helps patients move faster with clearer treatment direction before travel is confirmed.',
                                        'action', jsonb_build_object(
                                            'label', 'Explore treatments',
                                            'href', '/treatments',
                                            'variant', 'outline'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Travel and arrival management',
                                        'description',
                                        'We align treatment schedules with the travel and arrival details that often create stress for international patients and families.',
                                        'icon', 'Plane',
                                        'availability',
                                        'Before departure and on arrival',
                                        'bullets', jsonb_build_array(
                                            'Travel preparation guidance aligned with treatment dates, admission timing, and expected stay',
                                            'Airport reception planning and in-city transfer coordination',
                                            'Arrival timing support around consultations, diagnostics, admission, discharge, and review visits',
                                            'Companion and family travel logistics coordinated alongside the patient journey'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English',
                                            'Arabic',
                                            'Spanish',
                                            'Italian'
                                        ),
                                        'note',
                                        'Patients should not have to manage medical timing and travel timing through separate channels.',
                                        'action', jsonb_build_object(
                                            'label', 'Plan your trip',
                                            'href', '/plan',
                                            'variant', 'outline'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Accommodation and recovery support',
                                        'description',
                                        'We help coordinate accommodation that matches the procedure, expected recovery timeline, mobility needs, and distance to care.',
                                        'icon', 'Hotel',
                                        'availability',
                                        'During treatment and recovery',
                                        'bullets', jsonb_build_array(
                                            'Recovery-friendly accommodation planning based on the medical schedule, comfort, and practical needs',
                                            'Coordination for extended stays, companion rooms, and post-procedure support requirements',
                                            'Support around follow-up visits, discharge timing, and return-travel readiness',
                                            'Local logistics planning that keeps recovery conditions, convenience, and continuity in view'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English', 'Arabic', 'French'
                                        ),
                                        'note',
                                        'Recovery logistics are treated as part of the treatment journey, not as an afterthought.',
                                        'action', jsonb_build_object(
                                            'label', 'View travel information',
                                            'href', '/travel-info',
                                            'variant', 'outline'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title', 'Communication and continuity',
                                        'description',
                                        'We help patients, companions, and families stay informed before arrival, during treatment, and after returning home.',
                                        'icon', 'MessagesSquare',
                                        'availability',
                                        'Throughout the journey',
                                        'bullets', jsonb_build_array(
                                            'Multilingual communication support for international patient coordination',
                                            'Clear updates around scheduling, documentation, treatment logistics, and next operational steps',
                                            'Family and companion coordination when additional support is required',
                                            'Continuity support after treatment so follow-up communication stays organized'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English',
                                            'Arabic',
                                            'German',
                                            'Portuguese'
                                        ),
                                        'note',
                                        'This is the service layer that keeps the journey coherent when multiple stakeholders are involved.',
                                        'action', jsonb_build_object(
                                            'label', 'Start your journey',
                                            'href', '/start-journey',
                                            'variant', 'default'
                                        )
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
