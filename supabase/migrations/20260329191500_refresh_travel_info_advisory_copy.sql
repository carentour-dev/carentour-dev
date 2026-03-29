UPDATE public.cms_pages
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN block ->> 'type' = 'advisoryNotice'
                        THEN
                            jsonb_build_object(
                                'type', 'advisoryNotice',
                                'eyebrow', 'Before You Book',
                                'heading',
                                'Use this Care N Tour guide to prepare for medical travel to Egypt, then let us confirm the travel details for your case.',
                                'description',
                                'We publish this travel information for international patients, companions, and family decision-makers planning treatment in Egypt through Care N Tour. Entry route, expected stay, recovery accommodation, and return timing all depend on passport nationality, procedure type, and medical clearance.',
                                'tone', 'info',
                                'lastReviewed',
                                'Reviewed March 2026 by Care N Tour international patient coordinators',
                                'appliesTo',
                                'International patients, companions, and family decision-makers planning consultations, procedures, surgery, or recovery stays in Egypt',
                                'planningScope',
                                'Practical planning guidance for medical travel to Egypt. Final visa pathway, supporting documents, treatment timing, and fit-to-fly considerations are confirmed individually by Care N Tour and the relevant providers.',
                                'disclaimer',
                                'Do not issue flights, pay non-refundable accommodation, or lock return dates until we confirm your treatment timeline, likely entry route, and expected recovery window.',
                                'items', jsonb_build_array(
                                    'Send us your passport nationality, preferred travel window, treatment goal, and companion details early so we can guide the most realistic preparation path.',
                                    'Patients traveling for surgery, fertility treatment, dental rehabilitation, cardiology, or longer recovery usually need different stay planning than patients coming for short consultations or minimally invasive procedures.',
                                    'We monitor official Egypt entry information, including e-visa and visa-on-arrival pathways, and we update this guide when rules affecting international patients change.'
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
