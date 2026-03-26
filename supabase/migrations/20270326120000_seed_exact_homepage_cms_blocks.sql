-- Seed the exact homepage CMS composition
-- for blank or placeholder Home pages.
-- This does not force the homepage
-- to switch away from the legacy layout toggle.

-- noqa: disable=LT05

INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'home',
    'Home',
    'draft',
    '{"title":"Care N Tour | World-Class Medical Care in Egypt","description":"Experience premium medical treatments in Egypt with significant cost savings."}'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.cms_pages
SET
    title = 'Home',
    seo
    = COALESCE(seo, '{}'::jsonb)
    || '{"title":"Care N Tour | World-Class Medical Care in Egypt","description":"Experience premium medical treatments in Egypt with significant cost savings."}'::jsonb,
    content = $$[
    {
      "type": "homeHero",
      "eyebrow": "Experience a New Standard in Medical Travel",
      "headingPrefix": "Premium",
      "headingHighlight": "Medical Care",
      "headingSuffix": "in Egypt",
      "description": "Access trusted doctors and accredited hospitals with complete travel coordination and personal guidance at every step. We make your medical journey safe, clear, and comfortable from inquiry to recovery.\n\nVerified specialists. Transparent packages. Concierge-level support.",
      "backgroundImageUrl": "/hero-medical-facility.webp",
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
      "type": "featuredTreatmentsHome",
      "title": "Featured Treatments",
      "description": "Discover our most popular medical procedures, performed by internationally certified specialists",
      "limit": 4,
      "featuredOnly": true
    },
    {
      "type": "journeySteps",
      "title": "Your Journey to",
      "highlight": "Better Health",
      "description": "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
      "steps": [
        {
          "icon": "MessageCircle",
          "title": "Explore Your Options",
          "description": "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences."
        },
        {
          "icon": "Calendar",
          "title": "Receive a Personalized Treatment Plan",
          "description": "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision."
        },
        {
          "icon": "Plane",
          "title": "Prepare for Your Trip",
          "description": "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival."
        },
        {
          "icon": "Heart",
          "title": "Arrive with Confidence",
          "description": "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin."
        },
        {
          "icon": "Home",
          "title": "Undergo Treatment with Full Support",
          "description": "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics."
        },
        {
          "icon": "CheckCircle",
          "title": "Recover Safely and Comfortably",
          "description": "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support."
        }
      ]
    },
    {
      "type": "differentiators",
      "eyebrow": "Why Choose Care N Tour",
      "title": "What Makes Us",
      "highlight": "Different",
      "description": "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
      "items": [
        {
          "icon": "Award",
          "title": "JCI Accredited Hospitals",
          "description": "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards.",
          "highlight": "100% Accredited"
        },
        {
          "icon": "Shield",
          "title": "Board-Certified Surgeons",
          "description": "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions.",
          "highlight": "200+ Specialists"
        },
        {
          "icon": "DollarSign",
          "title": "All-Inclusive Packages",
          "description": "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support.",
          "highlight": "Up to 70% Savings"
        },
        {
          "icon": "Clock",
          "title": "Fast-Track Treatment",
          "description": "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking.",
          "highlight": "2-3 Weeks"
        },
        {
          "icon": "Globe",
          "title": "Multilingual Support",
          "description": "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey.",
          "highlight": "15+ Languages"
        },
        {
          "icon": "Plane",
          "title": "Complete Travel Support",
          "description": "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay.",
          "highlight": "End-to-End Care"
        }
      ]
    },
    {
      "type": "homeCta",
      "headingPrefix": "Ready to Start Your",
      "headingHighlight": "Health Journey?",
      "description": "Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.",
      "primaryAction": {
        "label": "Get Free Consultation",
        "href": "/consultation",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Start Your Journey",
        "href": "/start-journey",
        "variant": "secondary"
      }
    }
  ]$$::jsonb
WHERE
    slug = 'home'
    AND (
        content IS NULL
        OR JSONB_TYPEOF(content) <> 'array'
        OR JSONB_ARRAY_LENGTH(content) = 0
        OR (
            JSONB_ARRAY_LENGTH(content) = 1
            AND content -> 0 ->> 'type' = 'hero'
            AND content -> 0 ->> 'heading' = 'Care N Tour'
        )
    );

-- noqa: enable=LT05
