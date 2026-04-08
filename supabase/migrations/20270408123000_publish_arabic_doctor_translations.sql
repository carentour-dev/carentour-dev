BEGIN;

WITH current_public_doctors AS (
    SELECT
        d.id,
        d.name,
        d.title,
        d.specialization,
        d.bio,
        d.education,
        d.languages,
        d.achievements,
        d.certifications,
        d.updated_at AS source_updated_at
    FROM public.doctors AS d
    WHERE
        d.is_active = TRUE
),

doctor_translation_overrides (
    english_name,
    translated_name,
    title,
    specialization,
    bio,
    education,
    languages,
    achievements,
    certifications
) AS (
    VALUES
    (
        'Dr. Ahmed Mansour',
        'د. أحمد منصور',
        'كبير جرّاحي القلب',
        'جراحات القلب طفيفة التوغل',
        'جرّاح قلب بارز يتمتع بخبرة واسعة في الإجراءات القلبية المعقدة والجراحات طفيفة التوغل. تلقّى تدريبًا دوليًا ويكرّس خبرته لتقديم رعاية قلبية عالمية المستوى للمرضى الدوليين والمحليين.',
        'جامعة القاهرة، زمالة طبية من هارفارد',
        ARRAY['الإنجليزية', 'العربية', 'الفرنسية']::text [],
        ARRAY[
            'أكثر من 1,500 عملية جراحية ناجحة',
            'نشر أكثر من 40 بحثًا علميًا',
            'تدريب دولي في ألمانيا'
        ]::text [],
        ARRAY[
            'جرّاح قلب معتمد من البورد',
            'زميل الكلية الأمريكية للجراحين',
            'عضو الجمعية الأوروبية لأمراض القلب'
        ]::text []
    ),
    (
        'Dr. Layla Khalil',
        'د. ليلى خليل',
        'كبيرة أطباء العيون',
        'جراحات تصحيح الإبصار والمياه البيضاء',
        'طبيبة عيون خبيرة متخصصة في الليزك وجراحات المياه البيضاء وعلاجات العيون المتقدمة. تُعد من الرواد في مصر في تقنيات العدسات داخل العين المتقدمة.',
        'جامعة الإسكندرية، زمالة من جونز هوبكنز',
        ARRAY['الإنجليزية', 'العربية', 'الإيطالية']::text [],
        ARRAY[
            'أكثر من 5,000 عملية ليزك',
            'من الرواد في مصر في العدسات داخل العين المتقدمة',
            'متحدثة دولية في مؤتمرات طب العيون'
        ]::text [],
        ARRAY[
            'البورد الأمريكي لطب العيون',
            'الجمعية الأوروبية لجراحة المياه البيضاء وتصحيح الإبصار',
            'المجلس الدولي لطب العيون'
        ]::text []
    ),
    (
        'Dr. Omar Farouk',
        'د. عمر فاروق',
        'كبير جرّاحي التجميل',
        'جراحات التجميل والترميم',
        'جرّاح تجميل مرموق يجمع بين الحس الفني والدقة الجراحية. تلقّى تدريبًا على تقنيات بيفرلي هيلز لتحقيق نتائج تجميلية طبيعية ومتوازنة.',
        'جامعة القاهرة، زمالة بيفرلي هيلز',
        ARRAY['الإنجليزية', 'العربية', 'الإسبانية']::text [],
        ARRAY[
            'أكثر من 2,000 إجراء تجميلي',
            'جرّاح تجميل لعدد من الشخصيات المعروفة',
            'مدرّب دولي في جراحات التجميل'
        ]::text [],
        ARRAY[
            'البورد الأمريكي لجراحة التجميل',
            'الجمعية الدولية لجراحة التجميل',
            'الرابطة الأوروبية لجرّاحي التجميل'
        ]::text []
    ),
    (
        'Dr. Nadia Salim',
        'د. نادية سليم',
        'كبيرة أطباء الأسنان',
        'تجميل الأسنان وزراعة الأسنان',
        'خبيرة في زراعة الأسنان وطب الأسنان التجميلي مع تدريب متقدم في زراعة الأسنان من جامعة كاليفورنيا في لوس أنجلوس. متخصصة في إعادة تأهيل الفم بالكامل وابتسامات التجميل.',
        'جامعة القاهرة، تدريب متقدم في زراعة الأسنان من جامعة كاليفورنيا في لوس أنجلوس',
        ARRAY['الإنجليزية', 'العربية', 'البرتغالية']::text [],
        ARRAY[
            'أكثر من 3,000 زرعة أسنان',
            'خبيرة في تقنية آل-أون-4',
            'اعتماد دولي في طب الأسنان التجميلي'
        ]::text [],
        ARRAY[
            'المؤتمر الدولي لزراعة الفم',
            'الأكاديمية الأمريكية لطب الأسنان التجميلي',
            'الجمعية الأوروبية للالتحام العظمي'
        ]::text []
    ),
    (
        'Dr. Khaled Rashed',
        'د. خالد راشد',
        'كبير الجرّاحين العامين',
        'الجراحات بالمنظار والجراحات الروبوتية',
        'جرّاح عام رائد متخصص في الإجراءات طفيفة التوغل. يتمتع بخبرة في جراحات المنظار والجراحة الروبوتية مع نتائج ممتازة للمرضى.',
        'جامعة عين شمس، زمالة من مايو كلينك',
        ARRAY['الإنجليزية', 'العربية', 'الألمانية']::text [],
        ARRAY[
            'أكثر من 1,200 إجراء بالمنظار',
            'اعتماد في الجراحة الروبوتية',
            'معدل مضاعفات منخفض للغاية'
        ]::text [],
        ARRAY[
            'الكلية الأمريكية للجراحين',
            'الجمعية الأوروبية للجراحة بالمنظار',
            'جمعية الجرّاحين الأمريكيين لأمراض الجهاز الهضمي والمناظير'
        ]::text []
    ),
    (
        'Dr. Youssef Elshamy',
        'د. يوسف الشامي',
        'كبير جرّاحي العظام',
        'استبدال المفاصل وطب الإصابات الرياضية',
        'جرّاح عظام متخصص في استبدال المفاصل وطب الإصابات الرياضية، ويعتمد أحدث التقنيات لتسريع التعافي وتحسين النتائج الوظيفية للمرضى.',
        'جامعة القاهرة، زمالة من مستشفى الجراحة الخاصة',
        ARRAY['الإنجليزية', 'العربية', 'الروسية']::text [],
        ARRAY[
            'أكثر من 800 عملية استبدال مفصل',
            'خبير في طب الإصابات الرياضية',
            'تقنيات متقدمة في تنظير المفاصل'
        ]::text [],
        ARRAY[
            'الأكاديمية الأمريكية لجراحي العظام',
            'الجمعية الدولية لجراحة العظام',
            'جمعية تنظير المفاصل'
        ]::text []
    )
),

upserted_translations AS (
    INSERT INTO public.doctor_translations (
        doctor_id,
        locale,
        status,
        is_stale,
        source_updated_at,
        name,
        title,
        specialization,
        bio,
        education,
        languages,
        achievements,
        certifications
    )
    SELECT
        d.id,
        'ar' AS translation_locale,
        'published' AS translation_status,
        FALSE AS translation_is_stale,
        d.source_updated_at,
        COALESCE(src.translated_name, d.name) AS name, -- noqa: RF04
        COALESCE(src.title, d.title) AS title,
        COALESCE(src.specialization, d.specialization) AS specialization,
        COALESCE(src.bio, d.bio) AS bio,
        COALESCE(src.education, d.education) AS education,
        COALESCE(src.languages, COALESCE(d.languages, ARRAY[]::text [])) AS languages,
        COALESCE(
            src.achievements,
            COALESCE(d.achievements, ARRAY[]::text [])
        ) AS achievements,
        COALESCE(
            src.certifications,
            COALESCE(d.certifications, ARRAY[]::text [])
        ) AS certifications
    FROM current_public_doctors AS d
    LEFT JOIN doctor_translation_overrides AS src
        ON d.name = src.english_name
    ON CONFLICT (doctor_id, locale) DO UPDATE
        SET
            status = excluded.status,
            is_stale = FALSE,
            source_updated_at = excluded.source_updated_at,
            name = excluded.name,
            title = excluded.title,
            specialization = excluded.specialization,
            bio = excluded.bio,
            education = excluded.education,
            languages = excluded.languages,
            achievements = excluded.achievements,
            certifications = excluded.certifications
    RETURNING doctor_id
)

SELECT COUNT(*) FROM upserted_translations;

COMMIT;
