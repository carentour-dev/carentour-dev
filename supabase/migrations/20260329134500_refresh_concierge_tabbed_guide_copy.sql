UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'tabbedGuide'
                        THEN
                            jsonb_build_object(
                                'type', 'tabbedGuide',
                                'eyebrow', 'How Coordination Works',
                                'badge', 'Concierge Journey',
                                'heading',
                                'We guide international patients through each stage of the concierge journey, from pre-arrival planning to on-ground support and post-treatment follow-up.',
                                'description',
                                'At Care N Tour, we break medical travel coordination into clear stages so patients, families, and decision-makers can understand exactly how we support treatment planning in Egypt.',
                                'tabs', jsonb_build_array(
                                    jsonb_build_object(
                                        'id', 'before-arrival',
                                        'label', 'Before Arrival',
                                        'icon', 'CalendarClock',
                                        'heading',
                                        'Before you travel, we organize medical records, scheduling, and travel planning so your treatment journey starts with clarity.',
                                        'description',
                                        'This stage reduces uncertainty before flights, accommodation, and admission dates are finalized.',
                                        'sections', jsonb_build_array(
                                            jsonb_build_object(
                                                'type', 'cardGrid',
                                                'columns', 2,
                                                'cards', jsonb_build_array(
                                                    jsonb_build_object(
                                                        'title',
                                                        'Case preparation',
                                                        'icon', 'FolderCheck',
                                                        'bullets',
                                                        jsonb_build_array(
                                                            'Medical reports, imaging, and case details organized for specialist review',
                                                            'Missing records, clarifications, and next-step requirements identified early',
                                                            'Consultations, diagnostic needs, and likely treatment timelines mapped around the case'
                                                        )
                                                    ),
                                                    jsonb_build_object(
                                                        'title',
                                                        'Travel readiness',
                                                        'icon', 'PlaneTakeoff',
                                                        'bullets',
                                                        jsonb_build_array(
                                                            'Expected stay length aligned with consultation, procedure, and recovery milestones',
                                                            'Airport arrival, accommodation timing, and local transport planned around the schedule',
                                                            'Companion needs, language support, and practical travel requirements considered before booking'
                                                        )
                                                    )
                                                )
                                            ),
                                            jsonb_build_object(
                                                'type', 'cta',
                                                'eyebrow', 'Ready to plan?',
                                                'title',
                                                'Share your case, timeline, and travel needs with Care N Tour',
                                                'description',
                                                'Our guided intake helps us review your medical goals and coordinate the next practical steps for treatment in Egypt.',
                                                'actions', jsonb_build_array(
                                                    jsonb_build_object(
                                                        'label',
                                                        'Start your journey',
                                                        'href', '/start-journey'
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    jsonb_build_object(
                                        'id', 'during-stay',
                                        'label', 'During Your Stay',
                                        'icon', 'MapPinned',
                                        'heading',
                                        'Once you arrive in Egypt, we coordinate accommodation, transfers, and treatment logistics so each appointment and recovery step stays connected.',
                                        'description',
                                        'Our role on the ground is to reduce friction and keep the itinerary moving with clearer communication.',
                                        'sections', jsonb_build_array(
                                            jsonb_build_object(
                                                'type', 'infoPanels',
                                                'panels', jsonb_build_array(
                                                    jsonb_build_object(
                                                        'title',
                                                        'Arrival and movement',
                                                        'items',
                                                        jsonb_build_array(
                                                            'Airport reception and transfer coordination aligned with your confirmed itinerary',
                                                            'Transport scheduling across consultations, diagnostics, treatment, and review visits',
                                                            'Practical support for companions and family members traveling with the patient'
                                                        )
                                                    ),
                                                    jsonb_build_object(
                                                        'title',
                                                        'Stay and recovery setup',
                                                        'items',
                                                        jsonb_build_array(
                                                            'Accommodation coordinated around hospital access, comfort, and expected recovery needs',
                                                            'Scheduling around discharge dates, follow-up visits, and return-travel readiness',
                                                            'Responsive operational support if the treatment plan changes, extends, or needs adjustment'
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    jsonb_build_object(
                                        'id', 'after-treatment',
                                        'label', 'After Treatment',
                                        'icon', 'ShieldCheck',
                                        'heading',
                                        'After treatment, we help keep follow-up, discharge, and return-travel planning organized.',
                                        'description',
                                        'Patients should leave with clearer continuity, not unanswered logistical questions.',
                                        'sections', jsonb_build_array(
                                            jsonb_build_object(
                                                'type', 'compactList',
                                                'title',
                                                'What continuity support can include',
                                                'rows', jsonb_build_array(
                                                    jsonb_build_object(
                                                        'title',
                                                        'Follow-up coordination',
                                                        'description',
                                                        'We help keep communication, records requests, and next operational steps clear after procedures are completed.'
                                                    ),
                                                    jsonb_build_object(
                                                        'title',
                                                        'Return-travel alignment',
                                                        'description',
                                                        'We review recovery timing, follow-up visits, and departure readiness before travel home is finalized.'
                                                    ),
                                                    jsonb_build_object(
                                                        'title',
                                                        'Companion and family closure',
                                                        'description',
                                                        'We help ensure companion logistics, accommodation timing, and final practical details are resolved before departure.'
                                                    )
                                                )
                                            )
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
