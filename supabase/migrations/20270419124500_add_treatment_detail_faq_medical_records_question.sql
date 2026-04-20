UPDATE public.cms_pages AS page
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN
                        faq_blocks.block_value ->> 'type' = 'faq'
                        AND NOT EXISTS (
                            SELECT 1
                            FROM
                                jsonb_array_elements(
                                    coalesce(
                                        faq_blocks.block_value -> 'items',
                                        '[]'::jsonb
                                    )
                                ) AS existing_questions (existing_item)
                            WHERE
                                existing_questions.existing_item ->> 'question'
                                = 'What medical records should I share before treatment planning or travel?'
                        )
                        THEN jsonb_set(
                            faq_blocks.block_value,
                            '{items}',
                            coalesce(
                                faq_blocks.block_value -> 'items',
                                '[]'::jsonb
                            ) || $${
                          "question": "What medical records should I share before treatment planning or travel?",
                          "answer": "Patients should usually share recent medical reports, imaging, laboratory results, diagnoses, and any previous procedure summaries that help the provider review the case properly. Care N Tour can confirm which records are most useful before the next planning step."
                        }$$::jsonb
                        )
                    ELSE faq_blocks.block_value
                END
                ORDER BY faq_blocks.block_ordinality
            )
        FROM jsonb_array_elements(page.content) WITH ORDINALITY AS faq_blocks (
            block_value,
            block_ordinality
        )
    ),
    updated_at = now()
WHERE page.slug = 'treatment-detail-template';


UPDATE public.cms_page_translations AS translation
SET
    content = (
        SELECT
            jsonb_agg(
                CASE
                    WHEN
                        faq_blocks.block_value ->> 'type' = 'faq'
                        AND NOT EXISTS (
                            SELECT 1
                            FROM
                                jsonb_array_elements(
                                    coalesce(
                                        faq_blocks.block_value -> 'items',
                                        '[]'::jsonb
                                    )
                                ) AS existing_questions (existing_item)
                            WHERE
                                existing_questions.existing_item ->> 'question'
                                = 'ما السجلات الطبية التي ينبغي أن أشاركها قبل تخطيط العلاج أو السفر؟'
                        )
                        THEN jsonb_set(
                            faq_blocks.block_value,
                            '{items}',
                            coalesce(
                                faq_blocks.block_value -> 'items',
                                '[]'::jsonb
                            ) || $${
                          "question": "ما السجلات الطبية التي ينبغي أن أشاركها قبل تخطيط العلاج أو السفر؟",
                          "answer": "ينبغي للمريض عادةً مشاركة التقارير الطبية الحديثة ونتائج الأشعة والتحاليل والتشخيصات وملخصات الإجراءات السابقة التي تساعد مقدم الرعاية على مراجعة الحالة بشكل صحيح. ويمكن لكير آند تور توضيح السجلات الأكثر فائدة قبل الانتقال إلى الخطوة التالية من التخطيط."
                        }$$::jsonb
                        )
                    ELSE faq_blocks.block_value
                END
                ORDER BY faq_blocks.block_ordinality
            )
        FROM jsonb_array_elements(translation.content) WITH ORDINALITY AS faq_blocks (
            block_value,
            block_ordinality
        )
    ),
    updated_at = now()
WHERE
    translation.locale = 'ar'
    AND translation.cms_page_id = (
        SELECT page.id
        FROM public.cms_pages AS page
        WHERE page.slug = 'treatment-detail-template'
    );
