UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'storyNarrative'
                        THEN
                            jsonb_build_object(
                                'type', 'storyNarrative',
                                'eyebrow', 'How We Work',
                                'heading',
                                'We coordinate international patient concierge services as one connected operating model, so treatment in Egypt feels clear, supported, and manageable from first inquiry to follow-up.',
                                'lead',
                                'Choosing care abroad is not only a medical decision. Records review, specialist scheduling, medical travel planning, airport reception, accommodation, companion support, and follow-up all shape whether the journey feels organized and trustworthy.',
                                'paragraphs', jsonb_build_array(
                                    'At Care N Tour, we connect those moving parts through one accountable service model. Our team aligns medical case coordination, travel preparation, arrival logistics, recovery-friendly accommodation planning, and patient communication so every practical step supports the treatment plan.',
                                    'This matters because international patients and families evaluate the entire experience, not isolated services. They expect responsive communication, multilingual support, clear next steps, and continuity before arrival, during treatment in Egypt, and after returning home.',
                                    'Our concierge model is built to meet that expectation with structure, discretion, and operational clarity. Instead of leaving patients to manage separate vendors for treatment logistics, transportation, accommodation, and companion needs, we coordinate the journey around care.'
                                ),
                                'strengthsTitle',
                                'What international patients can expect from Care N Tour',
                                'strengths', jsonb_build_array(
                                    jsonb_build_object(
                                        'title',
                                        'One point of coordination across treatment and travel',
                                        'description',
                                        'We align scheduling, airport transfers, accommodation, companion logistics, and recovery timing so patients do not have to piece the journey together on their own.'
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Multilingual communication with international-service discipline',
                                        'description',
                                        'We support patients, families, and decision-makers with clearer updates, understandable documentation requirements, and communication designed for global audiences.'
                                    ),
                                    jsonb_build_object(
                                        'title',
                                        'Continuity before arrival, during treatment, and after return',
                                        'description',
                                        'We help organize pre-arrival preparation, on-ground support in Egypt, and follow-up planning so the experience remains connected beyond the procedure itself.'
                                    )
                                ),
                                'closing',
                                'This is how we deliver international patient services in Egypt: as a structured concierge layer around treatment, not an afterthought.'
                            )
                    ELSE block
                END
                ORDER BY ord
            )
        FROM jsonb_array_elements(content) WITH ORDINALITY
    ),
    updated_at = now()
WHERE slug = 'concierge';
