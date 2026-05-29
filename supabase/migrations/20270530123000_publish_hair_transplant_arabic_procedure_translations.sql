BEGIN;

WITH procedure_translation_source (
    treatment_slug,
    display_order,
    name,
    description,
    duration,
    recovery,
    price,
    success_rate,
    candidate_requirements,
    recovery_stages,
    additional_notes
) AS (
    VALUES
    (
        'hair-transplant',
        0,
        'تقنية FUE لاستخراج وحدات البصيلات',
        'تقنية FUE هي من أكثر طرق زراعة الشعر استخدامًا، إذ تُستخرج وحدات البصيلات بشكل فردي من المنطقة المانحة ثم تُزرع في مناطق الصلع أو انخفاض الكثافة. تساعد هذه التقنية على تحقيق مظهر طبيعي مع ندبات دقيقة جدًا وفترة تعافٍ قصيرة نسبيًا.',
        '2–6 ساعات',
        '5–7 أيام',
        '$600 - $1,200',
        '95%',
        ARRAY[
            'منطقة مانحة مناسبة وكثافة شعر كافية',
            'تساقط شعر مستقر أو خطة علاجية واضحة',
            'عدم وجود التهابات نشطة في فروة الرأس'
        ]::text [],
        JSONB_BUILD_ARRAY(
            JSONB_BUILD_OBJECT('stage', 'اليوم 0-1', 'description', 'تنظيف فروة الرأس واتباع تعليمات النوم والعناية الأولية.'),
            JSONB_BUILD_OBJECT('stage', 'الأيام 2-7', 'description', 'انخفاض الاحمرار تدريجيًا مع غسل لطيف حسب تعليمات الطبيب.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 3-4', 'description', 'بدء ظهور نمو جديد بشكل تدريجي.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 9-12', 'description', 'تقييم كثافة الشعر والنتيجة النهائية تقريبًا.')
        ),
        NULL::text
    ),
    (
        'hair-transplant',
        1,
        'تقنية Sapphire FUE للاستخراج والزراعة الدقيقة',
        'تعتمد Sapphire FUE على شفرات دقيقة من الياقوت لفتح القنوات بقدر أعلى من الدقة، ما يساعد على تقليل تهيج الأنسجة وتحسين زاوية الزراعة وكثافة التوزيع. تناسب هذه التقنية المرضى الباحثين عن نتيجة أكثر نعومة وكثافة، خاصة في مقدمة الرأس.',
        '6–8 ساعات',
        '7–10 أيام',
        '$900 - $2,500',
        '95%',
        ARRAY[
            'الرغبة في كثافة أعلى أو تصميم دقيق لخط الشعر',
            'توفر عدد كافٍ من البصيلات في المنطقة المانحة',
            'القدرة على الالتزام بتعليمات التعافي وحماية فروة الرأس'
        ]::text [],
        JSONB_BUILD_ARRAY(
            JSONB_BUILD_OBJECT('stage', 'اليوم 0-2', 'description', 'راحة ومتابعة التورم الخفيف مع عناية دقيقة بالمناطق المزروعة.'),
            JSONB_BUILD_OBJECT('stage', 'الأسبوع الأول', 'description', 'غسل موجه وحماية البصيلات المزروعة من الاحتكاك.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 3-4', 'description', 'ظهور النمو المبكر بعد مرحلة التساقط المؤقت.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 12', 'description', 'اكتمال معظم النتيجة من حيث الكثافة والشكل.')
        ),
        NULL::text
    ),
    (
        'hair-transplant',
        2,
        'تقنية Stem Cell FUE لتحفيز نمو البصيلات',
        'تجمع Stem Cell FUE بين زراعة الشعر وتقنيات داعمة مثل البلازما الغنية بالصفائح أو مركزات الخلايا الجذعية للمساعدة في تحسين بيئة فروة الرأس ودعم حيوية البصيلات المزروعة. قد تكون مناسبة للمرضى الذين يحتاجون إلى دعم إضافي للكثافة أو جودة الشعر.',
        '6–8 ساعات',
        '5–7 أيام',
        '$1,300 - $2,600',
        '95%',
        ARRAY[
            'تقييم طبي يؤكد ملاءمة العلاجات الداعمة',
            'منطقة مانحة مناسبة وخطة كثافة واقعية',
            'عدم وجود موانع لاستخدام البلازما أو العلاجات التحفيزية'
        ]::text [],
        JSONB_BUILD_ARRAY(
            JSONB_BUILD_OBJECT('stage', 'اليوم 0-1', 'description', 'إجراء الزراعة مع العلاج الداعم حسب الخطة الطبية.'),
            JSONB_BUILD_OBJECT('stage', 'الأسبوع الأول', 'description', 'متابعة التعافي وحماية فروة الرأس من الشمس والاحتكاك.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 3-6', 'description', 'بدء تحسن تدريجي في النمو والكثافة.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 12', 'description', 'تقييم النتيجة النهائية وخطة المتابعة عند الحاجة.')
        ),
        NULL::text
    ),
    (
        'hair-transplant',
        3,
        'تقنية DHI للزراعة المباشرة بأقلام تشوي',
        'تعتمد DHI على أقلام تشوي لفتح القناة وزراعة البصيلة في خطوة واحدة، ما يمنح تحكمًا دقيقًا في العمق والزاوية والاتجاه. وهي خيار مناسب لإعادة بناء خط الشعر أو تكثيف مناطق محددة، كما قد تقلل مدة بقاء البصيلات خارج الجسم.',
        '6–8 ساعات',
        '2–4 أسابيع',
        '$900 - $2,500',
        '95%',
        ARRAY[
            'الحاجة إلى دقة عالية في خط الشعر أو مناطق محددة',
            'عدد بصيلات مناسب للخطة المقترحة',
            'الالتزام بتجنب الاحتكاك والضغط على المنطقة المزروعة'
        ]::text [],
        JSONB_BUILD_ARRAY(
            JSONB_BUILD_OBJECT('stage', 'اليوم 0-2', 'description', 'حماية المنطقة المزروعة ومتابعة أي تورم خفيف.'),
            JSONB_BUILD_OBJECT('stage', 'الأسبوع الأول', 'description', 'غسل لطيف وإزالة القشور تدريجيًا حسب تعليمات الطبيب.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 3-4', 'description', 'بدء ظهور نمو جديد بعد التساقط المؤقت.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 9-12', 'description', 'اكتمال معظم الكثافة وتحسن مظهر خط الشعر.')
        ),
        NULL::text
    ),
    (
        'hair-transplant',
        4,
        'زراعة اللحية (نحو 2,500-3,000 بصيلة)',
        'تعالج زراعة اللحية الفراغات أو انخفاض الكثافة أو غياب شعر الوجه عبر نقل بصيلات من المنطقة المانحة إلى اللحية بزوايا دقيقة. تساعد الخطة على تحسين تحديد اللحية وكثافتها مع الحفاظ على مظهر طبيعي ومتناسق.',
        '4–8 ساعات',
        '3–6 أيام',
        '$1,500 - $3,500',
        '95%',
        ARRAY[
            'وجود منطقة مانحة مناسبة لاستخراج البصيلات',
            'رغبة واضحة في تحديد شكل اللحية أو زيادة كثافتها',
            'عدم وجود تهيج أو التهابات نشطة في منطقة الزراعة'
        ]::text [],
        JSONB_BUILD_ARRAY(
            JSONB_BUILD_OBJECT('stage', 'اليوم 0-2', 'description', 'حماية منطقة اللحية وتجنب لمس البصيلات المزروعة.'),
            JSONB_BUILD_OBJECT('stage', 'الأسبوع الأول', 'description', 'انخفاض الاحمرار واتباع تعليمات التنظيف بدقة.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 3-4', 'description', 'بدء نمو شعر جديد تدريجيًا في منطقة اللحية.'),
            JSONB_BUILD_OBJECT('stage', 'الشهر 9-12', 'description', 'ظهور معظم النتيجة النهائية من حيث الشكل والكثافة.')
        ),
        NULL::text
    )
)

INSERT INTO public.treatment_procedure_translations (
    treatment_procedure_id,
    locale,
    name,
    description,
    duration,
    recovery,
    price,
    success_rate,
    candidate_requirements,
    recovery_stages,
    additional_notes
)
SELECT
    p.id,
    'ar' AS translation_locale,
    src.name,
    src.description,
    src.duration,
    src.recovery,
    src.price,
    src.success_rate,
    src.candidate_requirements,
    src.recovery_stages,
    src.additional_notes
FROM procedure_translation_source AS src
INNER JOIN public.treatments AS t
    ON src.treatment_slug = t.slug
INNER JOIN public.treatment_procedures AS p
    ON
        t.id = p.treatment_id
        AND p.created_by_provider_id IS NULL
        AND p.is_public IS DISTINCT FROM FALSE
INNER JOIN public.treatment_translations AS translated
    ON
        t.id = translated.treatment_id
        AND translated.locale = 'ar'
        AND translated.status = 'published'
WHERE src.display_order = p.display_order
ON CONFLICT (treatment_procedure_id, locale) DO UPDATE
    SET
        name = excluded.name,
        description = excluded.description,
        duration = excluded.duration,
        recovery = excluded.recovery,
        price = excluded.price,
        success_rate = excluded.success_rate,
        candidate_requirements = excluded.candidate_requirements,
        recovery_stages = excluded.recovery_stages,
        additional_notes = excluded.additional_notes;

COMMIT;
