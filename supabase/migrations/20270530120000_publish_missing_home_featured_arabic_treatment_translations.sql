BEGIN;

WITH current_public_treatments AS (
    SELECT
        t.id,
        t.slug,
        GREATEST(
            t.updated_at,
            COALESCE(public_procedures.max_updated_at, t.updated_at)
        ) AS source_updated_at
    FROM public.treatments AS t
    LEFT JOIN LATERAL (
        SELECT MAX(p.updated_at) AS max_updated_at
        FROM public.treatment_procedures AS p
        WHERE
            p.treatment_id = t.id
            AND p.created_by_provider_id IS NULL
            AND p.is_public IS DISTINCT FROM FALSE
    ) AS public_procedures ON TRUE
    WHERE
        t.is_active = TRUE
        AND t.is_listed_public = TRUE
        AND t.slug IN (
            'hair-transplant',
            'rhinoplasty'
        )
),

treatment_translation_source (
    slug,
    name,
    category_label,
    summary,
    description,
    overview,
    ideal_candidates,
    seo_title,
    seo_description
) AS (
    VALUES
    (
        'hair-transplant',
        'زراعة الشعر',
        'زراعة الشعر',
        'استعادة شعر متقدمة في مصر بنتائج طبيعية ودائمة، مع جراحين خبراء وتقنيات حديثة وباقات Care N Tour شاملة وبتكلفة مناسبة.',
        $$تتيح زراعة الشعر عبر Care N Tour للمرضى الدوليين الوصول إلى أطباء متخصصين وتقنيات حديثة لاستعادة الشعر داخل مصر. تبدأ الرحلة بتقييم دقيق لفروة الرأس، وكثافة المنطقة المانحة، ونمط تساقط الشعر، والتوقعات الجمالية للمريض.

وبناءً على التقييم، يضع الأخصائيون خطة مخصصة قد تشمل تقنيات مثل FUE أو DHI، مع تصميم خط شعر طبيعي ومراعاة اتجاه نمو الشعر وكثافته. وتُجرى الإجراءات في عيادات مجهزة وفق معايير طبية صارمة، مع متابعة واضحة خلال مرحلة التعافي ونمو الشعر التدريجي.

تدعم Care N Tour المرضى في تنسيق الاستشارة، واختيار الفريق الطبي المناسب، وترتيبات السفر والإقامة، والمتابعة بعد الإجراء، لتكون تجربة زراعة الشعر في مصر أكثر وضوحًا وراحة من البداية حتى النتائج النهائية.$$,
        $$استعادة شعر متقدمة في مصر بنتائج طبيعية ودائمة، مع جراحين خبراء وتقنيات حديثة وباقات شاملة للمرضى الدوليين.

تبدأ زراعة الشعر عبر Care N Tour بتقييم دقيق لفروة الرأس والمنطقة المانحة، ثم يضع الفريق الطبي خطة مناسبة لتقنيات مثل FUE أو DHI. وتركز الخطة على تصميم خط شعر طبيعي، وزراعة دقيقة، وتعليمات تعافٍ واضحة مع تنسيق كامل للسفر والمتابعة.$$,
        ARRAY[
            'الرجال أو النساء الذين يعانون من تساقط شعر مستقر',
            'المرضى الذين لديهم منطقة مانحة مناسبة وكثافة كافية',
            'الأشخاص الباحثون عن نتيجة طبيعية مع الالتزام بتعليمات ما بعد الإجراء'
        ]::text [],
        'زراعة الشعر | العلاجات | Care N Tour',
        'استعادة شعر متقدمة في مصر بنتائج طبيعية ودائمة، مع جراحين خبراء وتقنيات حديثة وباقات Care N Tour شاملة وبتكلفة مناسبة.'
    ),
    (
        'rhinoplasty',
        'تجميل الأنف',
        'التجميل',
        'إعادة تشكيل الأنف لتحسين المظهر والوظيفة، مع رعاية متخصصة في مصر عبر Care N Tour.',
        $$يوفر تجميل الأنف عبر Care N Tour للمرضى فرصة تحسين شكل الأنف أو وظيفته من خلال جراحين ذوي خبرة ومنشآت طبية حديثة في مصر. تبدأ الخطة باستشارة تفصيلية لفهم الأهداف الجمالية، وتقييم التنفس وبنية الأنف، ومراجعة التاريخ الطبي والتوقعات الواقعية.

قد تشمل الخطة تعديل عظمة الأنف أو الغضاريف، تحسين طرف الأنف، تصحيح الانحراف، أو الجمع بين التحسين الجمالي والوظيفي عند الحاجة. ويحرص الفريق الطبي على تحقيق نتيجة متوازنة وطبيعية تتناسب مع ملامح الوجه، مع شرح واضح لفترة التعافي والمتابعة.

تنسق Care N Tour تفاصيل الرحلة العلاجية للمرضى الدوليين، بما يشمل الاستشارة، اختيار الطبيب، ترتيبات السفر والإقامة، والمواعيد اللاحقة للعملية لضمان تجربة منظمة ومريحة في مصر.$$,
        $$تجميل الأنف يعيد تشكيل الأنف لتحقيق فوائد جمالية ووظيفية، مع رعاية متخصصة في مصر عبر Care N Tour.

تبدأ الرحلة باستشارة تفصيلية لتقييم بنية الأنف، التنفس، والأهداف الجمالية. ثم يضع الجراح خطة مخصصة قد تشمل تعديل العظم أو الغضاريف أو تصحيح الانحراف، مع متابعة واضحة خلال التعافي للوصول إلى نتيجة طبيعية ومتوازنة.$$,
        ARRAY[
            'المرضى الراغبون في تحسين شكل الأنف أو تناسقه مع الوجه',
            'الأشخاص الذين يحتاجون إلى تصحيح وظيفي للتنفس عند الاقتضاء',
            'المرضى ذوو التوقعات الواقعية والقادرون على الالتزام بفترة التعافي'
        ]::text [],
        'تجميل الأنف | العلاجات | Care N Tour',
        'إعادة تشكيل الأنف لتحسين المظهر والوظيفة، مع رعاية متخصصة في مصر عبر Care N Tour.'
    )
)

INSERT INTO public.treatment_translations (
    treatment_id,
    locale,
    status,
    is_stale,
    source_updated_at,
    name,
    category_label,
    summary,
    description,
    overview,
    ideal_candidates,
    seo
)
SELECT
    t.id,
    'ar' AS translation_locale,
    'published' AS status,
    FALSE AS is_stale,
    t.source_updated_at,
    src.name,
    src.category_label,
    src.summary,
    src.description,
    src.overview,
    src.ideal_candidates,
    JSONB_BUILD_OBJECT(
        'title',
        src.seo_title,
        'description',
        src.seo_description
    ) AS seo
FROM treatment_translation_source AS src
INNER JOIN current_public_treatments AS t
    ON src.slug = t.slug
ON CONFLICT (treatment_id, locale) DO UPDATE
    SET
        status = excluded.status,
        is_stale = FALSE,
        source_updated_at = excluded.source_updated_at,
        name = excluded.name,
        category_label = excluded.category_label,
        summary = excluded.summary,
        description = excluded.description,
        overview = excluded.overview,
        ideal_candidates = excluded.ideal_candidates,
        seo = excluded.seo;

COMMIT;
