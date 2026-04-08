INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'doctors',
    'Our Doctors',
    'published',
    $${
    "title": "Specialist Doctors in Egypt for International Patients | Care N Tour",
    "description": "Explore Care N Tour's specialist doctors in Egypt. Compare specialties, languages, experience, and next steps for medical tourism and treatment planning."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Our Doctors",
      "heading": "Meet specialist doctors in Egypt trusted by Care N Tour for international patient journeys.",
      "description": "At Care N Tour, we connect international patients with experienced doctors across leading specialties in Egypt. We help you identify the right specialist, understand your options, and move forward with clarity before you commit to treatment or travel.",
      "backgroundImageUrl": "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
      "overlay": {
        "fromColor": "#000000",
        "fromOpacity": 0.7,
        "viaColor": "#000000",
        "viaOpacity": 0.45,
        "toColor": "#000000",
        "toOpacity": 0
      },
      "highlights": [
        {
          "kicker": "Expertise",
          "label": "Experienced doctors across high-demand medical, surgical, dental, and restorative specialties"
        },
        {
          "kicker": "Guidance",
          "label": "Care N Tour helps you compare specialists with your medical goals and travel plans in mind"
        },
        {
          "kicker": "Support",
          "label": "From doctor selection to case review and travel coordination, we stay with you at every step"
        }
      ],
      "primaryAction": {
        "label": "Start your journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Explore treatments",
        "href": "/treatments",
        "variant": "hero"
      }
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "The medical expertise behind your Care N Tour journey",
      "description": "We help patients choose doctors with more confidence by combining specialist access with coordination, clarity, and international patient support.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Specialist access",
          "value": "Multi-specialty",
          "helper": "Doctors across major treatment areas for international patients seeking care in Egypt",
          "icon": "Stethoscope"
        },
        {
          "label": "Communication",
          "value": "Multilingual",
          "helper": "Language visibility helps patients and families feel more comfortable before consultation",
          "icon": "Languages"
        },
        {
          "label": "Clinical profile",
          "value": "Experience-led",
          "helper": "Review experience, education, procedures, and profile details in one place",
          "icon": "FileCheck"
        },
        {
          "label": "Patient support",
          "value": "Coordinated",
          "helper": "Care N Tour connects doctor selection with treatment planning, travel, and follow-up support",
          "icon": "Route"
        }
      ]
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Why Patients Choose Us",
      "heading": "We help you find the right doctor in Egypt, not just the next available name.",
      "lead": "Choosing a doctor abroad is a major decision. You need confidence in the specialist, confidence in the process, and confidence in the team guiding you from first enquiry to treatment and recovery.",
      "paragraphs": [
        "At Care N Tour, we work to match international patients with specialist doctors in Egypt whose expertise, communication style, and treatment focus align with the patient's case.",
        "We do not stop at introductions. Our team helps organize medical review, coordinate next steps, support travel planning, and keep the patient journey clear from consultation through recovery.",
        "That is why patients come to Care N Tour when they want more than a doctor list. They want trusted guidance, coordinated treatment planning, and a medical tourism experience that feels personal and well managed."
      ],
      "strengthsTitle": "What you can expect from Care N Tour",
      "strengths": [
        {
          "title": "Relevant specialist matching",
          "description": "We help you focus on doctors whose specialty and experience fit the treatment you are exploring."
        },
        {
          "title": "Clearer communication",
          "description": "We make it easier to compare doctors by language and profile details before you move to consultation."
        },
        {
          "title": "Coordinated next steps",
          "description": "Once you shortlist a doctor, we help with case review, planning, scheduling, and travel coordination."
        }
      ],
      "closing": "From the first shortlist to the final travel plan, Care N Tour helps make treatment in Egypt feel clearer, safer, and more personal."
    },
    {
      "type": "doctorDirectory",
      "eyebrow": "Our Doctors",
      "heading": "Explore our specialist doctors in Egypt",
      "description": "Browse doctors by specialty and language, review their profiles, and contact Care N Tour when you are ready to discuss your case, treatment options, and next steps.",
      "trustCallout": {
        "eyebrow": "International patient support",
        "title": "We help you choose with more confidence",
        "description": "When a doctor looks right for your case, Care N Tour helps you move from shortlisting to case review, treatment planning, and medical travel coordination in Egypt."
      },
      "searchPlaceholder": "Search by doctor name or specialty...",
      "filterLabels": {
        "search": "Search",
        "specialty": "Specialty",
        "language": "Language"
      },
      "filterPlaceholders": {
        "specialty": "All specialties",
        "language": "All languages"
      },
      "filterSearchPlaceholders": {
        "specialty": "Search specialties...",
        "language": "Search languages..."
      },
      "filterEmptyCopy": {
        "specialty": "No specialties found.",
        "language": "No languages found."
      },
      "clearButtonLabel": "Clear filters",
      "states": {
        "resultsIntro": "Browse our doctors to find the specialists most relevant to your treatment needs and preferred language.",
        "resultsCountLabel": "doctors available",
        "loading": "Loading doctors...",
        "updating": "Refreshing directory...",
        "emptyHeading": "No doctors found",
        "emptyDescription": "Adjust your search or filters to explore more specialists.",
        "errorTitle": "Unable to load doctors",
        "errorDescription": "Please try again later."
      },
      "cardLabels": {
        "featuredBadge": "Featured specialist",
        "experience": "Experience",
        "experienceSuffix": "years",
        "languages": "Languages",
        "education": "Education",
        "procedures": "Procedures",
        "publications": "Publications",
        "ratingLabel": "rating",
        "reviewsSuffix": "reviews",
        "viewProfile": "View profile",
        "primaryCta": "Start your journey"
      }
    },
    {
      "type": "faq",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Questions patients ask when choosing a doctor in Egypt",
      "description": "We answer the questions international patients ask most often before choosing a doctor and planning treatment in Egypt.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "How does Care N Tour help me choose the right doctor in Egypt?",
          "answer": "We help you review the specialists most relevant to your treatment goals, compare their profiles, and understand the next step before you commit to treatment or travel. Our role is to make doctor selection clearer and more reassuring for international patients."
        },
        {
          "question": "Can Care N Tour help me choose a doctor?",
          "answer": "Yes. If you are still exploring treatment options, Care N Tour can review your case, understand your goals, and help direct you toward the most relevant specialty or doctor in Egypt."
        },
        {
          "question": "What happens after I shortlist a doctor with Care N Tour?",
          "answer": "After you shortlist a doctor, we can help collect medical records, coordinate case review, explain the likely treatment path, and connect that decision to consultation, travel planning, and on-ground support."
        },
        {
          "question": "Do I need to confirm treatment immediately after choosing a doctor?",
          "answer": "No. Choosing a doctor is part of the evaluation process. Care N Tour helps you understand your options, timing, and likely next steps before any treatment schedule or travel commitment is finalized."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Start With The Right Doctor",
      "heading": "Choose a doctor with confidence, then let Care N Tour guide everything that follows.",
      "description": "Our team helps international patients move from doctor selection to case review, consultation planning, travel coordination, and treatment support in Egypt.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Start your journey",
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
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE
    SET
        title = excluded.title,
        status = excluded.status,
        seo = excluded.seo,
        content = excluded.content,
        updated_at = now();
