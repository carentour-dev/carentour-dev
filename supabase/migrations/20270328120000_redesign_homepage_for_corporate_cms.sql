-- Redesign the homepage with reusable editorial CMS blocks
-- aligned with the About page.
-- This makes the CMS-driven homepage the primary experience and preserves any
-- existing legacy hero image setting while disabling the legacy layout toggle.

-- noqa: disable=LT05

INSERT INTO public.cms_pages (
    slug,
    title,
    status,
    seo,
    settings,
    content
)
VALUES (
    'home',
    'Home',
    'published',
    '{"title":"Care N Tour | Premium Medical Travel in Egypt","description":"Care N Tour connects international patients with accredited hospitals, verified specialists, and fully coordinated medical travel in Egypt."}'::jsonb,
    '{"homeHero":{"useLegacyLayout":false}}'::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Global Medical Travel, Coordinated Properly",
      "heading": "Premium medical care in Egypt with trusted doctors, accredited hospitals, and complete travel coordination.",
      "description": "Access trusted doctors and accredited hospitals with complete travel coordination and personal guidance at every step. We make your medical journey safe, clear, and comfortable from inquiry to recovery.",
      "backgroundImageUrl": "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
      "highlights": [
        {
          "kicker": "Providers",
          "label": "JCI-accredited hospitals and board-certified specialists"
        },
        {
          "kicker": "Support",
          "label": "Transparent packages, multilingual coordination, and concierge-level guidance"
        },
        {
          "kicker": "Access",
          "label": "Fast-track treatment planning with end-to-end travel support"
        }
      ],
      "primaryAction": {
        "label": "Start Your Journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "View Treatments",
        "href": "/treatments",
        "variant": "secondary"
      }
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "A care model built for international patients and global expectations",
      "description": "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality through one coordinated service model.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Partner hospitals",
          "value": "100% Accredited",
          "helper": "JCI-accredited facilities",
          "icon": "Award"
        },
        {
          "label": "Board-certified surgeons",
          "value": "200+ Specialists",
          "helper": "Internationally trained experts",
          "icon": "Shield"
        },
        {
          "label": "Coordinator support",
          "value": "15+ Languages",
          "helper": "Seamless communication throughout the journey",
          "icon": "Globe"
        },
        {
          "label": "Potential savings",
          "value": "Up to 70%",
          "helper": "Transparent packages with no hidden costs",
          "icon": "DollarSign"
        }
      ]
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Why Care N Tour",
      "heading": "A clearer way to plan treatment abroad without managing every detail alone.",
      "lead": "Patients should not have to verify providers, compare options, coordinate logistics, and arrange follow-up alone when they are already making an important healthcare decision.",
      "paragraphs": [
        "Care N Tour combines treatment planning, provider access, travel coordination, and patient support into one managed experience for international patients seeking care in Egypt.",
        "Instead of navigating hospitals, specialists, accommodation, transfers, and scheduling across separate contacts, patients receive a more structured path with personal guidance from first inquiry to recovery.",
        "The result is a medical journey designed to feel more transparent, more organized, and more supportive at every stage."
      ],
      "strengthsTitle": "What patients gain from a managed journey",
      "strengths": [
        {
          "title": "Verified specialists and accredited hospitals",
          "description": "Patients are matched with trusted providers aligned with their medical needs and expectations."
        },
        {
          "title": "Transparent planning before any commitment",
          "description": "Treatment options, logistics, expected timelines, and package details are clarified early to reduce uncertainty."
        },
        {
          "title": "Concierge-style coordination from arrival to follow-up",
          "description": "Travel, accommodation, transfers, and aftercare communication are supported as one connected journey."
        }
      ],
      "closing": "For patients and families evaluating treatment abroad, that combination of medical access and operational clarity creates a more dependable experience."
    },
    {
      "type": "featuredTreatmentsHome",
      "eyebrow": "Treatments",
      "title": "Featured Treatments",
      "description": "Discover our most popular medical procedures, performed by internationally certified specialists",
      "cardAppearance": "original",
      "limit": 12,
      "featuredOnly": true
    },
    {
      "type": "featureGrid",
      "eyebrow": "Patient Journey",
      "heading": "Your journey to better health",
      "description": "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
      "columns": 3,
      "variant": "cards",
      "items": [
        {
          "tag": "01",
          "icon": "MessageCircle",
          "title": "Explore Your Options",
          "description": "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences."
        },
        {
          "tag": "02",
          "icon": "Calendar",
          "title": "Receive a Personalized Treatment Plan",
          "description": "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision."
        },
        {
          "tag": "03",
          "icon": "Plane",
          "title": "Prepare for Your Trip",
          "description": "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival."
        },
        {
          "tag": "04",
          "icon": "Heart",
          "title": "Arrive with Confidence",
          "description": "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin."
        },
        {
          "tag": "05",
          "icon": "Home",
          "title": "Undergo Treatment with Full Support",
          "description": "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics."
        },
        {
          "tag": "06",
          "icon": "CheckCircle",
          "title": "Recover Safely and Comfortably",
          "description": "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support."
        }
      ]
    },
    {
      "type": "trustSignals",
      "eyebrow": "What Makes Us Different",
      "heading": "The standards behind every treatment journey",
      "description": "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
      "items": [
        {
          "eyebrow": "100% Accredited",
          "icon": "Award",
          "title": "JCI Accredited Hospitals",
          "description": "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards."
        },
        {
          "eyebrow": "200+ Specialists",
          "icon": "Shield",
          "title": "Board-Certified Surgeons",
          "description": "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions."
        },
        {
          "eyebrow": "Up to 70% Savings",
          "icon": "DollarSign",
          "title": "All-Inclusive Packages",
          "description": "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support."
        },
        {
          "eyebrow": "2-3 Weeks",
          "icon": "Clock",
          "title": "Fast-Track Treatment",
          "description": "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking."
        },
        {
          "eyebrow": "15+ Languages",
          "icon": "Globe",
          "title": "Multilingual Support",
          "description": "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey."
        },
        {
          "eyebrow": "End-to-End Care",
          "icon": "Plane",
          "title": "Complete Travel Support",
          "description": "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay."
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Common questions from international patients and families",
      "description": "Clear answers help patients compare options, understand timelines, and plan treatment in Egypt with more confidence.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What does Care N Tour coordinate for international patients?",
          "answer": "Care N Tour helps patients access trusted doctors and accredited hospitals in Egypt while coordinating treatment planning, travel logistics, accommodation, transfers, and follow-up support."
        },
        {
          "question": "How are hospitals and specialists selected?",
          "answer": "Patients are introduced to verified providers based on their medical needs, with a focus on reputable hospitals, accredited facilities, and experienced specialists."
        },
        {
          "question": "How quickly can treatment be arranged?",
          "answer": "Fast-track planning is available, and many treatment journeys can be scheduled within 2-3 weeks of confirmation depending on the procedure and provider availability."
        },
        {
          "question": "Do you support patients from different countries and languages?",
          "answer": "Yes. The service model is designed for international patients, with multilingual coordination available across more than 15 languages."
        },
        {
          "question": "What happens after treatment is completed?",
          "answer": "Patients receive aftercare guidance, follow-up coordination, and continued support so they can stay connected with their doctor even after returning home."
        },
        {
          "question": "Are package costs transparent?",
          "answer": "Care N Tour emphasizes transparent packages so patients can understand treatment, logistics, and support costs before committing."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Start Planning",
      "heading": "Ready to start your health journey with clarity and confidence?",
      "description": "Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Get Free Consultation",
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
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE
    SET
        title = excluded.title,
        status = 'published',
        seo = excluded.seo,
        content = excluded.content,
        settings = jsonb_set(
            coalesce(public.cms_pages.settings, '{}'::jsonb),
            '{homeHero,useLegacyLayout}',
            'false'::jsonb,
            true
        );

-- noqa: enable=LT05
