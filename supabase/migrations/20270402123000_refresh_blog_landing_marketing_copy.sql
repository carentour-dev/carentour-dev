BEGIN;

UPDATE public.cms_pages
SET
    seo = $blog_en_seo$
    {
      "title": "Medical Travel to Egypt: Treatment Guides, Recovery Advice & Planning | Care N Tour",
      "description": "Explore Care N Tour guidance for international patients comparing treatment options in Egypt, planning medical travel, understanding recovery, and preparing for consultations with confidence."
    }
    $blog_en_seo$::jsonb,
    content = $blog_en_content$
    [
      {
        "type": "aboutHero",
        "eyebrow": "Care N Tour Editorial",
        "heading": "Clear medical travel guidance for international patients considering treatment in Egypt.",
        "description": "At Care N Tour, we publish practical guidance on provider evaluation, treatment planning, travel coordination, recovery, and next-step decisions so patients, families, and referring partners can assess care in Egypt with confidence.",
        "backgroundImageUrl": "/blog-medical-tourism.jpg",
        "highlights": [
          {
            "kicker": "Perspective",
            "label": "Written from Care N Tour's international patient coordination perspective for patients, families, and referring partners"
          },
          {
            "kicker": "Topics",
            "label": "Medical travel to Egypt, treatment options, hospital and doctor evaluation, recovery, logistics, and case planning"
          },
          {
            "kicker": "Use",
            "label": "A searchable knowledge base that helps visitors compare options, prepare smarter questions, and move from research to action"
          }
        ],
        "primaryAction": {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "default"
        },
        "secondaryAction": {
          "label": "Contact Care N Tour",
          "href": "/contact",
          "variant": "secondary"
        },
        "overlay": {
          "base": 0.45,
          "md": 0.5
        }
      },
      {
        "type": "blogPostFeed",
        "eyebrow": "Featured guidance",
        "heading": "Start with the articles that answer the biggest treatment and travel questions",
        "description": "Read the latest Care N Tour articles on medical travel to Egypt, treatment timelines, expected recovery, companion planning, and how to prepare for consultations with confidence.",
        "source": "latest",
        "layout": "heroFeatured",
        "limit": 7
      },
      {
        "type": "blogTaxonomyGrid",
        "eyebrow": "Browse by topic",
        "heading": "Explore the blog by treatment area or planning need",
        "description": "Use the category archive to find focused guidance on cardiac care, dental treatment, eye surgery, insurance, wellness, and broader medical travel planning.",
        "taxonomy": "categories",
        "limit": 9,
        "cardStyle": "editorial",
        "ctaLabel": "Explore archive"
      },
      {
        "type": "callToAction",
        "eyebrow": "Need a case review?",
        "heading": "Turn research into a treatment plan built around your case.",
        "description": "When you are ready, Care N Tour can translate what you have learned into provider shortlists, timeline guidance, travel coordination, and a personalized next-step plan for treatment in Egypt.",
        "layout": "split",
        "background": "dark",
        "actions": [
          {
            "label": "Request Consultation",
            "href": "/consultation",
            "variant": "default"
          },
          {
            "label": "Contact Care N Tour",
            "href": "/contact",
            "variant": "outline"
          }
        ]
      }
    ]
    $blog_en_content$::jsonb
WHERE slug = 'blog';

INSERT INTO public.cms_page_translations (
    cms_page_id,
    locale,
    title,
    seo,
    content,
    status
)
SELECT
    page.id AS page_id,
    'ar' AS translation_locale,
    'المدونة' AS translation_title,
    $blog_ar_seo$
    {
      "title": "مدونة Care N Tour | إرشادات العلاج والسفر العلاجي إلى مصر",
      "description": "استكشف إرشادات Care N Tour للمرضى الدوليين حول مقارنة خيارات العلاج في مصر، وتخطيط السفر العلاجي، وفهم التعافي، والاستعداد للاستشارات بثقة."
    }
    $blog_ar_seo$::jsonb AS translation_seo,
    $blog_ar_content$
    [
      {
        "type": "aboutHero",
        "eyebrow": "رؤى Care N Tour",
        "heading": "إرشاد واضح للمرضى الدوليين الذين يدرسون العلاج في مصر.",
        "description": "في Care N Tour ننشر محتوى عمليًا حول تقييم مقدمي الرعاية، وتخطيط العلاج، وتنسيق السفر، والتعافي، واتخاذ الخطوة التالية، حتى يتمكن المرضى والعائلات والشركاء المُحيلون من تقييم العلاج في مصر بثقة.",
        "backgroundImageUrl": "/blog-medical-tourism.jpg",
        "highlights": [
          {
            "kicker": "المنظور",
            "label": "مكتوب من منظور Care N Tour في تنسيق رحلة المريض الدولي للمرضى والعائلات والشركاء المُحيلين"
          },
          {
            "kicker": "الموضوعات",
            "label": "السفر العلاجي إلى مصر، خيارات العلاج، تقييم المستشفيات والأطباء، التعافي، اللوجستيات، وتخطيط الحالة"
          },
          {
            "kicker": "الفائدة",
            "label": "قاعدة معرفة قابلة للبحث تساعد الزوار على مقارنة الخيارات، وتجهيز أسئلة أدق، والانتقال من البحث إلى التنفيذ"
          }
        ],
        "primaryAction": {
          "label": "ابدأ رحلتك",
          "href": "/start-journey",
          "variant": "default"
        },
        "secondaryAction": {
          "label": "تواصل مع Care N Tour",
          "href": "/contact",
          "variant": "secondary"
        },
        "overlay": {
          "base": 0.45,
          "md": 0.5
        }
      },
      {
        "type": "blogPostFeed",
        "eyebrow": "إرشادات مختارة",
        "heading": "ابدأ بالمقالات التي تجيب عن أهم أسئلة العلاج والسفر",
        "description": "اطلع على أحدث مقالات Care N Tour حول السفر العلاجي إلى مصر، والجداول الزمنية للعلاج، وتوقعات التعافي، وتخطيط المرافقين، وكيفية الاستعداد للاستشارة بثقة.",
        "source": "latest",
        "layout": "heroFeatured",
        "limit": 7
      },
      {
        "type": "blogTaxonomyGrid",
        "eyebrow": "تصفح حسب الموضوع",
        "heading": "استكشف المدونة حسب التخصص أو احتياج التخطيط",
        "description": "انتقل إلى الأرشيف الأنسب لسؤالك، سواء كنت تبحث عن جراحة القلب أو علاج الأسنان أو جراحة العيون أو التأمين أو التعافي أو التخطيط الأوسع للسفر العلاجي.",
        "taxonomy": "categories",
        "limit": 9,
        "cardStyle": "editorial",
        "ctaLabel": "استكشف الأرشيف"
      },
      {
        "type": "callToAction",
        "eyebrow": "هل تحتاج إلى مراجعة لحالتك؟",
        "heading": "حوّل البحث إلى خطة علاج مبنية على حالتك.",
        "description": "عندما تكون مستعدًا، يمكن لفريق Care N Tour تحويل ما قرأته إلى ترشيحات لمقدمي الرعاية، وتصور أوضح للجدول الزمني، وتنسيق للسفر، وخطة عملية للخطوة التالية في رحلة العلاج إلى مصر.",
        "layout": "split",
        "background": "dark",
        "actions": [
          {
            "label": "اطلب استشارة",
            "href": "/consultation",
            "variant": "default"
          },
          {
            "label": "تواصل مع Care N Tour",
            "href": "/contact",
            "variant": "outline"
          }
        ]
      }
    ]
    $blog_ar_content$::jsonb AS translation_content,
    'published' AS translation_status
FROM public.cms_pages AS page
WHERE page.slug = 'blog'
ON CONFLICT (cms_page_id, locale) DO UPDATE SET
    title = excluded.title,
    seo = excluded.seo,
    content = excluded.content,
    status = excluded.status,
    updated_at = now();

UPDATE public.blog_categories
SET
    description = CASE slug
        WHEN 'medical-tourism' THEN 'Medical travel to Egypt, provider evaluation, pricing clarity, logistics, and next-step planning for international patients.'
        WHEN 'eye-surgery' THEN 'LASIK, cataract, retina, and vision-correction guidance for patients considering eye treatment in Egypt.'
        WHEN 'cardiac-surgery' THEN 'Heart surgery, interventional cardiology, hospital selection, and recovery planning for international cardiac patients.'
        WHEN 'dental-care' THEN 'Dental implants, restorative care, cosmetic dentistry, and treatment-trip planning in Egypt.'
        WHEN 'wellness' THEN 'Recovery guidance, post-treatment routines, companion support, and wellness planning around care.'
        WHEN 'insurance' THEN 'Insurance questions, coverage documents, pre-authorization, and payment planning for cross-border treatment.'
        WHEN 'tourism' THEN 'Travel ideas, companion activities, and recovery-friendly experiences around a treatment stay in Egypt.'
        ELSE description
    END
WHERE slug IN (
    'medical-tourism',
    'eye-surgery',
    'cardiac-surgery',
    'dental-care',
    'wellness',
    'insurance',
    'tourism'
);

INSERT INTO public.blog_category_translations (
    blog_category_id,
    locale,
    name,
    slug,
    description,
    status
)
SELECT
    category.id AS category_id,
    'ar' AS translation_locale,
    CASE category.slug
        WHEN 'medical-tourism' THEN 'السياحة العلاجية'
        WHEN 'eye-surgery' THEN 'جراحة العيون'
        WHEN 'cardiac-surgery' THEN 'جراحة القلب'
        WHEN 'dental-care' THEN 'علاج الأسنان'
        WHEN 'wellness' THEN 'التعافي والعافية'
        WHEN 'insurance' THEN 'التأمين'
        WHEN 'tourism' THEN 'السياحة'
    END AS translation_name,
    CASE category.slug
        WHEN 'medical-tourism' THEN 'السياحة-العلاجية'
        WHEN 'eye-surgery' THEN 'جراحة-العيون'
        WHEN 'cardiac-surgery' THEN 'جراحة-القلب'
        WHEN 'dental-care' THEN 'علاج-الأسنان'
        WHEN 'wellness' THEN 'التعافي-والعافية'
        WHEN 'insurance' THEN 'التأمين'
        WHEN 'tourism' THEN 'السياحة'
    END AS translation_slug,
    CASE category.slug
        WHEN 'medical-tourism' THEN 'كيف تعمل رحلة العلاج إلى مصر، من تقييم مقدمي الرعاية ووضوح التكاليف إلى اللوجستيات وتخطيط الخطوة التالية.'
        WHEN 'eye-surgery' THEN 'إرشادات حول الليزك والمياه البيضاء والشبكية وتصحيح الإبصار للمرضى الذين يدرسون علاج العيون في مصر.'
        WHEN 'cardiac-surgery' THEN 'محتوى حول جراحات القلب والقسطرة القلبية واختيار المستشفى وتخطيط التعافي للمرضى الدوليين.'
        WHEN 'dental-care' THEN 'زراعة الأسنان والعلاجات الترميمية وطب الأسنان التجميلي وتخطيط رحلة العلاج في مصر.'
        WHEN 'wellness' THEN 'إرشادات التعافي وروتين ما بعد العلاج ودعم المرافقين وتخطيط العافية حول رحلة الرعاية.'
        WHEN 'insurance' THEN 'أسئلة التأمين ووثائق التغطية والموافقات المسبقة وتخطيط المدفوعات للعلاج عبر الحدود.'
        WHEN 'tourism' THEN 'أفكار السفر وأنشطة المرافقين وتجارب مناسبة لفترة التعافي أثناء الإقامة العلاجية في مصر.'
    END AS translation_description,
    'published' AS translation_status
FROM public.blog_categories AS category
WHERE
    category.slug IN (
        'medical-tourism',
        'eye-surgery',
        'cardiac-surgery',
        'dental-care',
        'wellness',
        'insurance',
        'tourism'
    )
ON CONFLICT (blog_category_id, locale) DO UPDATE SET
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    status = excluded.status,
    updated_at = now();

COMMIT;
