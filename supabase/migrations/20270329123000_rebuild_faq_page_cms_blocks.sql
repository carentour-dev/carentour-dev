INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'faq',
    'FAQ',
    'published',
    $${
    "title": "FAQ | Care N Tour | International Patient Questions Answered",
    "description": "Read direct answers from Care N Tour about treatment planning, travel, pricing, accommodation, safety, and recovery for medical journeys to Egypt."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Care N Tour FAQ",
      "heading": "We answer the questions international patients ask before choosing treatment in Egypt.",
      "description": "We explain how we coordinate treatment planning, travel, pricing, accommodation, safety, and recovery so patients and families can move forward with clarity.",
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
          "kicker": "Treatment",
          "label": "We clarify planning steps, provider pathways, and timing before patients commit."
        },
        {
          "kicker": "Travel",
          "label": "We answer practical questions about visas, arrivals, accommodation, and local coordination."
        },
        {
          "kicker": "Recovery",
          "label": "We outline what patients should expect before discharge, follow-up, and return travel."
        }
      ],
      "primaryAction": {
        "label": "Start Your Journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Speak with a Coordinator",
        "href": "/contact",
        "variant": "hero"
      }
    },
    {
      "type": "trustSignals",
      "eyebrow": "What This Page Covers",
      "heading": "Answers organized around the decisions patients need to make",
      "description": "Care N Tour uses this FAQ page to answer operational, medical, and travel questions with the same clarity we bring to every patient journey.",
      "items": [
        {
          "eyebrow": "01",
          "icon": "Stethoscope",
          "title": "Treatment planning questions",
          "description": "Patients can review how we coordinate specialist access, records review, timelines, and next-step planning."
        },
        {
          "eyebrow": "02",
          "icon": "Plane",
          "title": "Travel and arrival questions",
          "description": "We explain how entry planning, airport coordination, accommodation, and local mobility typically work."
        },
        {
          "eyebrow": "03",
          "icon": "BadgeDollarSign",
          "title": "Pricing and payment questions",
          "description": "We clarify the cost topics patients ask about most often before comparing treatment options abroad."
        },
        {
          "eyebrow": "04",
          "icon": "ShieldCheck",
          "title": "Recovery and follow-up questions",
          "description": "We help patients understand discharge planning, aftercare coordination, and what happens once they return home."
        }
      ]
    },
    {
      "type": "faqDirectory",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Browse questions by topic or search for a specific concern",
      "description": "Every answer below is part of the FAQ content managed in our CMS. We keep the structure searchable so patients, companions, and referral partners can find the right answer quickly.",
      "layout": "sidebar",
      "navigationHeading": "Browse by topic",
      "showSearch": true,
      "showCategoryDescriptions": true,
      "showSourceBadge": true,
      "searchPlaceholder": "Search questions about treatment, travel, pricing, accommodation, safety, or recovery",
      "emptyStateHeading": "No questions match your search",
      "emptyStateDescription": "Try a broader keyword or clear the search to return to the full FAQ directory.",
      "clearSearchLabel": "Clear search"
    },
    {
      "type": "callToAction",
      "eyebrow": "Need A Direct Answer?",
      "heading": "Speak with Care N Tour if your case requires guidance beyond the FAQ.",
      "description": "We can review your treatment goals, travel window, and coordination needs directly and tell you what the next practical step should be.",
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
          "variant": "secondary"
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
        updated_at = timezone('utc', now());
