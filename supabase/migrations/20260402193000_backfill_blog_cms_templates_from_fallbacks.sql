BEGIN;

UPDATE public.cms_pages
SET
    seo = '{
    "title": "Health Insights & Travel Guides | Care N Tour Blog",
    "description": "Read Care N Tour guidance on medical travel planning, treatment preparation, recovery, and patient decision-making."
  }'::jsonb,
    content = '[
    {
      "type": "aboutHero",
      "eyebrow": "Care N Tour Journal",
      "heading": "Medical travel insights written for patients, families, and referring partners.",
      "description": "Explore clear guidance on treatment planning, travel logistics, provider evaluation, recovery expectations, and practical decisions that shape a confident medical journey to Egypt.",
      "backgroundImageUrl": "/blog-medical-tourism.jpg",
      "highlights": [
        {
          "kicker": "Perspective",
          "label": "Editorial guidance written in Care N Tour''s voice for international patients"
        },
        {
          "kicker": "Topics",
          "label": "Treatments, facilities, travel preparation, recovery, and planning clarity"
        },
        {
          "kicker": "Use",
          "label": "A living knowledge base that supports better conversations before treatment begins"
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
      "eyebrow": "Featured articles",
      "heading": "Latest guidance from Care N Tour",
      "description": "Start with the articles most useful for patients evaluating treatment, travel timing, and next steps.",
      "source": "latest",
      "layout": "heroFeatured",
      "limit": 7
    },
    {
      "type": "blogTaxonomyGrid",
      "eyebrow": "Explore by topic",
      "heading": "Navigate the blog by category",
      "description": "Move directly into the archive that matches the question you are trying to answer.",
      "taxonomy": "categories",
      "limit": 9,
      "cardStyle": "editorial",
      "ctaLabel": "Explore archive"
    },
    {
      "type": "callToAction",
      "eyebrow": "Need direction",
      "heading": "Turn what you read into a personalized treatment plan.",
      "description": "Our coordinators can translate editorial guidance into provider options, timelines, logistics, and a plan built around your case.",
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
  ]'::jsonb
WHERE slug = 'blog';

UPDATE public.cms_pages
SET
    content = '[
    {
      "type": "blogPostFeed",
      "eyebrow": "Category archive",
      "source": "category",
      "layout": "grid",
      "limit": 12
    },
    {
      "type": "callToAction",
      "eyebrow": "Plan with confidence",
      "heading": "Need help turning research into a treatment decision?",
      "description": "Speak with Care N Tour to compare providers, timelines, logistics, and the right next step for your case.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "default"
        },
        {
          "label": "Contact Care N Tour",
          "href": "/contact",
          "variant": "outline"
        }
      ]
    }
  ]'::jsonb
WHERE slug = 'blog-category-template';

UPDATE public.cms_pages
SET
    content = '[
    {
      "type": "blogPostFeed",
      "eyebrow": "Tagged archive",
      "source": "tag",
      "layout": "grid",
      "limit": 12
    }
  ]'::jsonb
WHERE slug = 'blog-tag-template';

UPDATE public.cms_pages
SET
    content = '[
    {
      "type": "blogAuthorSummary",
      "heading": "About the author",
      "showArchiveLink": false
    },
    {
      "type": "blogPostFeed",
      "eyebrow": "Author archive",
      "source": "author",
      "layout": "grid",
      "limit": 12
    }
  ]'::jsonb
WHERE slug = 'blog-author-template';

UPDATE public.cms_pages
SET
    content = '[
    {
      "type": "blogArticleHero"
    },
    {
      "type": "blogArticleBody",
      "showTableOfContents": true,
      "tocHeading": "On this page"
    },
    {
      "type": "blogAuthorSummary",
      "heading": "About the author",
      "showArchiveLink": true
    },
    {
      "type": "blogPostFeed",
      "eyebrow": "Continue reading",
      "source": "related",
      "layout": "grid",
      "limit": 3,
      "relatedHeading": "Related articles"
    },
    {
      "type": "callToAction",
      "eyebrow": "Talk to Care N Tour",
      "heading": "Need a treatment plan built around your case?",
      "description": "Move from editorial guidance into a coordinated next step with provider matching, travel planning, and operational clarity.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Request Consultation",
          "href": "/consultation",
          "variant": "default"
        },
        {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "outline"
        }
      ]
    }
  ]'::jsonb
WHERE slug = 'blog-post-template';

INSERT INTO public.cms_page_translations (cms_page_id, locale, title, seo, content, status)
SELECT
    page.id AS cms_page_id,
    'ar' AS translation_locale,
    CASE page.slug
        WHEN 'blog' THEN 'المدونة'
        WHEN 'blog-category-template' THEN 'قالب تصنيف المدونة'
        WHEN 'blog-tag-template' THEN 'قالب وسم المدونة'
        WHEN 'blog-author-template' THEN 'قالب كاتب المدونة'
        WHEN 'blog-post-template' THEN 'قالب مقال المدونة'
    END AS translation_title,
    CASE page.slug
        WHEN 'blog'
            THEN '{
        "title": "مدونة Care N Tour | رؤى صحية وأدلة السفر العلاجي",
        "description": "اقرأ إرشادات Care N Tour حول التخطيط للسفر العلاجي والاستعداد للعلاج والتعافي واتخاذ القرار بثقة."
      }'::jsonb
        ELSE '{}'::jsonb
    END AS translation_seo,
    CASE page.slug
        WHEN 'blog'
            THEN '[
        {
          "type": "aboutHero",
          "eyebrow": "يوميات Care N Tour",
          "heading": "رؤى السفر العلاجي مكتوبة للمرضى والعائلات والشركاء المحيلين.",
          "description": "اكتشف إرشادات واضحة حول التخطيط للعلاج ولوجستيات السفر وتقييم مقدمي الرعاية وتوقعات التعافي والقرارات العملية التي تصنع رحلة علاجية واثقة إلى مصر.",
          "backgroundImageUrl": "/blog-medical-tourism.jpg",
          "highlights": [
            {
              "kicker": "الرؤية",
              "label": "محتوى تحريري مكتوب بصوت Care N Tour للمرضى الدوليين"
            },
            {
              "kicker": "الموضوعات",
              "label": "العلاجات والمنشآت والاستعداد للسفر والتعافي ووضوح التخطيط"
            },
            {
              "kicker": "الاستخدام",
              "label": "قاعدة معرفة حية تدعم قرارات أفضل قبل بدء العلاج"
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
          "eyebrow": "مقالات مميزة",
          "heading": "أحدث الإرشادات من Care N Tour",
          "description": "ابدأ بالمقالات الأكثر فائدة للمرضى الذين يقيمون العلاج وتوقيت السفر والخطوات التالية.",
          "source": "latest",
          "layout": "heroFeatured",
          "limit": 7
        },
        {
          "type": "blogTaxonomyGrid",
          "eyebrow": "استكشف حسب الموضوع",
          "heading": "تصفح المدونة حسب التصنيف",
          "description": "انتقل مباشرة إلى الأرشيف الذي يطابق السؤال الذي تحاول الإجابة عنه.",
          "taxonomy": "categories",
          "limit": 9,
          "cardStyle": "editorial",
          "ctaLabel": "استكشف الأرشيف"
        },
        {
          "type": "callToAction",
          "eyebrow": "تحتاج إلى توجيه",
          "heading": "حوّل ما تقرأه إلى خطة علاج شخصية.",
          "description": "يمكن لمنسقينا تحويل الإرشادات التحريرية إلى خيارات مقدمي رعاية وجداول زمنية ولوجستيات وخطة مبنية حول حالتك.",
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
      ]'::jsonb
        WHEN 'blog-category-template'
            THEN '[
        {
          "type": "blogPostFeed",
          "eyebrow": "أرشيف التصنيف",
          "source": "category",
          "layout": "grid",
          "limit": 12
        },
        {
          "type": "callToAction",
          "eyebrow": "خطط بثقة",
          "heading": "هل تحتاج إلى مساعدة لتحويل بحثك إلى قرار علاجي؟",
          "description": "تحدث مع Care N Tour لمقارنة مقدمي الرعاية والجداول الزمنية واللوجستيات وتحديد الخطوة التالية المناسبة لحالتك.",
          "layout": "split",
          "background": "dark",
          "actions": [
            {
              "label": "ابدأ رحلتك",
              "href": "/start-journey",
              "variant": "default"
            },
            {
              "label": "تواصل مع Care N Tour",
              "href": "/contact",
              "variant": "outline"
            }
          ]
        }
      ]'::jsonb
        WHEN 'blog-tag-template'
            THEN '[
        {
          "type": "blogPostFeed",
          "eyebrow": "أرشيف الوسم",
          "source": "tag",
          "layout": "grid",
          "limit": 12
        }
      ]'::jsonb
        WHEN 'blog-author-template'
            THEN '[
        {
          "type": "blogAuthorSummary",
          "heading": "نبذة عن الكاتب",
          "showArchiveLink": false
        },
        {
          "type": "blogPostFeed",
          "eyebrow": "أرشيف الكاتب",
          "source": "author",
          "layout": "grid",
          "limit": 12
        }
      ]'::jsonb
        WHEN 'blog-post-template'
            THEN '[
        {
          "type": "blogArticleHero"
        },
        {
          "type": "blogArticleBody",
          "showTableOfContents": true,
          "tocHeading": "في هذه الصفحة"
        },
        {
          "type": "blogAuthorSummary",
          "heading": "نبذة عن الكاتب",
          "showArchiveLink": true
        },
        {
          "type": "blogPostFeed",
          "eyebrow": "أكمل القراءة",
          "source": "related",
          "layout": "grid",
          "limit": 3,
          "relatedHeading": "مقالات ذات صلة"
        },
        {
          "type": "callToAction",
          "eyebrow": "تحدث مع Care N Tour",
          "heading": "هل تحتاج إلى خطة علاج مبنية حول حالتك؟",
          "description": "انتقل من الإرشاد التحريري إلى خطوة منسقة تالية تشمل مطابقة مقدمي الرعاية وتخطيط السفر والوضوح التشغيلي.",
          "layout": "split",
          "background": "dark",
          "actions": [
            {
              "label": "اطلب استشارة",
              "href": "/consultation",
              "variant": "default"
            },
            {
              "label": "ابدأ رحلتك",
              "href": "/start-journey",
              "variant": "outline"
            }
          ]
        }
      ]'::jsonb
    END AS translation_content,
    'published' AS translation_status
FROM public.cms_pages AS page
WHERE
    page.slug IN (
        'blog',
        'blog-category-template',
        'blog-tag-template',
        'blog-author-template',
        'blog-post-template'
    )
ON CONFLICT (cms_page_id, locale) DO UPDATE
    SET
        title = excluded.title,
        seo = excluded.seo,
        content = excluded.content,
        status = excluded.status,
        updated_at = now();

COMMIT;
