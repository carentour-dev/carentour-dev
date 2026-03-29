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
                                'eyebrow',
                                'How Care N Tour Supports The Journey',
                                'heading',
                                'The travel support we coordinate around treatment in Egypt',
                                'description',
                                'At Care N Tour, our role is not limited to connecting patients with doctors and hospitals. We also coordinate the travel, accommodation, arrival, companion, and continuity details that make medical travel to Egypt feel structured, credible, and easier to manage.',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'title',
                                        'Entry, visa, and documentation support',
                                        'description',
                                        'We help international patients understand the likely Egypt entry route for their case and prepare the documents that usually need to be in place before treatment dates and flights are confirmed.',
                                        'icon', 'FileText',
                                        'availability', 'Before departure',
                                        'bullets', jsonb_build_array(
                                            'Guidance on common e-visa, visa-on-arrival, or consular planning pathways',
                                            'Passport, medical-record, and travel-readiness checks before booking milestones',
                                            'Case-specific preparation aligned with treatment timing, stay length, and companion travel'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English',
                                            'Arabic',
                                            'French',
                                            'German'
                                        ),
                                        'note',
                                        'We frame entry planning around the patient''s actual passport, medical timeline, and recovery needs rather than generic assumptions.',
                                        'action', jsonb_build_object(
                                            'label', 'Contact our team',
                                            'href', '/contact',
                                            'variant', 'outline'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Accommodation and recovery planning',
                                        'description',
                                        'We shape accommodation and stay planning around the procedure, expected recovery timeline, mobility needs, and the practical requirements of the patient and any companion.',
                                        'icon', 'Hotel',
                                        'availability',
                                        'Before arrival through recovery',
                                        'bullets', jsonb_build_array(
                                            'Recovery-friendly hotel and serviced-apartment planning',
                                            'Accommodation matched to hospital access, privacy, comfort, and expected recovery intensity',
                                            'Support for companion rooms, extended stays, and return-travel timing after treatment'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English', 'Arabic', 'Spanish'
                                        ),
                                        'note',
                                        'We treat recovery logistics as part of the medical journey, not as a separate booking exercise.',
                                        'action', jsonb_build_object(
                                            'label', 'Plan your trip',
                                            'href', '/plan',
                                            'variant', 'outline'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Airport, local transport, and appointment mobility',
                                        'description',
                                        'We coordinate practical movement through arrival, consultations, treatment, diagnostics, and follow-up so the medical journey stays synchronized on the ground in Egypt.',
                                        'icon', 'Car',
                                        'availability', 'Arrival to departure',
                                        'bullets', jsonb_build_array(
                                            'Airport pickup, return transfer, and arrival-day coordination',
                                            'Transport aligned with appointment times, admission milestones, and recovery requirements',
                                            'On-ground coordination between hotel, hospital, clinic, imaging, pharmacy, and follow-up visits'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English', 'Arabic', 'Italian'
                                        ),
                                        'note',
                                        'The goal is to remove operational friction so patients can focus on treatment and recovery rather than transport logistics.',
                                        'action', jsonb_build_object(
                                            'label', 'Start your journey',
                                            'href', '/start-journey',
                                            'variant', 'default'
                                        )
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Companion and continuity support',
                                        'description',
                                        'We help patients, companions, and families stay informed before arrival, during treatment in Egypt, and as discharge, follow-up, and return-home planning approach.',
                                        'icon', 'MessagesSquare',
                                        'availability',
                                        'Throughout the journey',
                                        'bullets', jsonb_build_array(
                                            'Companion planning and practical support around the patient stay',
                                            'Clear updates on travel, scheduling, treatment logistics, and next operational steps',
                                            'Continuity planning for discharge, follow-up, documentation, and return travel'
                                        ),
                                        'languages',
                                        jsonb_build_array(
                                            'English',
                                            'Arabic',
                                            'German',
                                            'Portuguese'
                                        ),
                                        'note',
                                        'This helps keep the wider journey coherent when several family members, coordinators, or decision-makers are involved.',
                                        'action', jsonb_build_object(
                                            'label', 'View concierge services',
                                            'href', '/concierge',
                                            'variant', 'outline'
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
WHERE slug = 'travel-info';
