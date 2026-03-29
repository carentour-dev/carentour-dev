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
                                'eyebrow', 'Travel Questions',
                                'heading',
                                'Questions international patients commonly ask before medical travel to Egypt',
                                'description',
                                'These answers explain how Care N Tour helps patients and families prepare for visas, accommodation, recovery planning, local transport, and companion travel before treatment in Egypt.',
                                'layout', 'twoColumn',
                                'items', jsonb_build_array(
                                    jsonb_build_object(
                                        'question',
                                        'What travel information should I review before planning treatment in Egypt?',
                                        'answer',
                                        'Before planning treatment in Egypt, review the likely '
                                        || 'entry route for your passport, expected stay length, '
                                        || 'accommodation needs, local transport planning, '
                                        || 'companion travel, and how recovery timing could affect '
                                        || 'your return journey. At Care N Tour, we help connect '
                                        || 'all of those travel decisions to your consultation, '
                                        || 'procedure, and follow-up schedule so the journey is '
                                        || 'planned as one coordinated pathway.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Does Care N Tour help with visa and travel preparation?',
                                        'answer',
                                        'Yes. Care N Tour helps international patients understand the most realistic Egypt entry pathway for their case, the common documents to prepare, and when travel planning should move forward in relation to the treatment timeline. Final visa eligibility still depends on passport nationality and current official Egypt requirements.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'How long should I plan to stay in Egypt for treatment?',
                                        'answer',
                                        'Length of stay depends on the procedure, medical review, follow-up needs, recovery progress, and whether you should remain in Egypt before flying home. We help patients estimate a realistic travel window before flights, accommodation, and companion arrangements are finalized.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Can Care N Tour arrange accommodation for recovery after treatment?',
                                        'answer',
                                        'Yes. We can help coordinate recovery-friendly hotels, serviced apartments, and companion-ready stays based on the procedure, expected recovery period, comfort preferences, privacy needs, and proximity to the treating hospital or clinic.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'What kind of local transport support can Care N Tour coordinate?',
                                        'answer',
                                        'Care N Tour can coordinate airport pickup, return transfers, and local movement between your hotel, hospital, clinic, imaging appointments, pharmacy stops, and follow-up visits. The goal is to keep transport aligned with your medical schedule and recovery needs, not left to last-minute arrangements.'
                                    ),
                                    jsonb_build_object(
                                        'question',
                                        'Can a family member or companion travel with me?',
                                        'answer',
                                        'Yes. Many international patients travel with a family member or companion. We recommend planning the companion''s documents, room setup, arrival timing, and on-ground support early, especially when the treatment pathway or recovery period is more complex.'
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
