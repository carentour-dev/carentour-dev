INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'treatments',
    'Treatments',
    'published',
    $${
    "title": "Treatments | Care N Tour | Medical Treatments in Egypt",
    "description": "Explore medical treatments in Egypt through Care N Tour, with accredited specialists, transparent planning, and coordinated support for international patients."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Treatments",
      "heading": "Medical treatments in Egypt, presented with the clarity international patients expect.",
      "description": "Explore high-demand treatments coordinated through Care N Tour, where accredited specialists, transparent planning, and end-to-end patient support come together in one managed experience.",
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
          "kicker": "Coverage",
          "label": "Cardiac, fertility, dental, ophthalmology, cosmetic, and other specialist pathways"
        },
        {
          "kicker": "Standard",
          "label": "Accredited providers, structured planning, and multilingual patient coordination"
        },
        {
          "kicker": "Approach",
          "label": "Designed for international patients comparing quality, speed, and total journey clarity"
        }
      ],
      "primaryAction": {
        "label": "Start your journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Speak with our team",
        "href": "/contact",
        "variant": "hero"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Treatment Planning",
      "heading": "A better treatments page should help patients understand options, not just scan a card grid.",
      "lead": "International patients need more than a list of procedures. They need context around quality, suitability, next steps, and what a coordinated treatment journey actually looks like.",
      "paragraphs": [
        "Care N Tour curates treatment pathways around accredited providers, specialist access, and operational support so patients can evaluate Egypt with greater confidence.",
        "That means the Treatments page should do two jobs well: clearly present the available specialties, and reinforce the standards, planning support, and patient journey behind them.",
        "The result is a page that feels more like a multinational healthcare platform and less like a brochure of disconnected offers."
      ],
      "strengthsTitle": "What patients should understand quickly",
      "strengths": [
        {
          "title": "Which treatments are available and who they are designed for",
          "description": "Visitors should be able to scan specialties, compare relevance, and move deeper into a treatment page with confidence."
        },
        {
          "title": "What makes the service model credible",
          "description": "The page needs to communicate provider quality, coordination standards, and international patient readiness."
        },
        {
          "title": "What to do next",
          "description": "Every major section should naturally guide the visitor toward consultation, shortlisting, or starting the journey."
        }
      ],
      "closing": "This makes the page stronger for users, search engines, and AI systems looking for structured, trustworthy healthcare content."
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "Built to answer global patient concerns early",
      "description": "The Treatments page should reassure visitors on quality, access, communication, and value before they reach out.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Partner hospitals",
          "value": "100% Accredited",
          "helper": "Leading facilities selected for international standards",
          "icon": "Award"
        },
        {
          "label": "Specialist network",
          "value": "200+ Experts",
          "helper": "Board-certified doctors across major specialties",
          "icon": "Shield"
        },
        {
          "label": "Coordinator support",
          "value": "15+ Languages",
          "helper": "Clear communication throughout the patient journey",
          "icon": "Globe"
        },
        {
          "label": "Potential savings",
          "value": "Up to 70%",
          "helper": "Transparent planning compared with many Western markets",
          "icon": "DollarSign"
        }
      ]
    },
    {
      "type": "treatmentSpecialties",
      "heading": "Our Medical Specialties",
      "description": "World-class medical care across multiple specialties with significant cost savings.",
      "showSearch": true,
      "searchPlaceholder": "Search treatments by name or specialty...",
      "emptyStateHeading": "No specialties match your search",
      "emptyStateDescription": "Try another keyword or clear the search to browse all specialties.",
      "priceLabel": "Starting at",
      "primaryActionLabel": "Learn More",
      "secondaryActionLabel": "Start Your Journey",
      "limit": 4,
      "featuredOnly": false
    },
    {
      "type": "trustSignals",
      "eyebrow": "Why Patients Compare Egypt",
      "heading": "The combination of medical quality and operational support matters as much as price.",
      "description": "Care N Tour positions Egypt as a serious treatment destination by reducing the friction that usually makes cross-border care feel risky.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Accredited provider access",
          "description": "Treatment pathways are aligned with vetted hospitals and specialists, not generic referral lists.",
          "icon": "Shield"
        },
        {
          "eyebrow": "02",
          "title": "Transparent planning before travel",
          "description": "Visitors can understand treatments, expected costs, and next steps before committing to a trip.",
          "icon": "FileCheck"
        },
        {
          "eyebrow": "03",
          "title": "Multilingual coordination",
          "description": "Communication, scheduling, and logistics are easier for international patients and families.",
          "icon": "Languages"
        },
        {
          "eyebrow": "04",
          "title": "One managed journey",
          "description": "Medical planning, travel support, and follow-up communication are handled as one connected experience.",
          "icon": "Route"
        }
      ]
    },
    {
      "type": "doctors",
      "title": "Meet specialists patients can shortlist with confidence",
      "description": "Featured doctors reinforce that the page represents real expertise, not just a marketing list of treatments.",
      "layout": "grid",
      "limit": 3,
      "featuredOnly": true
    },
    {
      "type": "faq",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Questions international patients commonly ask before choosing a treatment",
      "description": "These answers make the page more useful for visitors and improve search and AI visibility with structured, high-intent content.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What medical specialties can I explore through Care N Tour?",
          "answer": "The Treatments page covers major specialties such as cardiac care, fertility treatment, dental care, ophthalmology, cosmetic surgery, and other procedures coordinated through Care N Tour's provider network in Egypt."
        },
        {
          "question": "Are the treatments on this page managed through accredited providers?",
          "answer": "Care N Tour works with vetted hospitals, clinics, and specialists selected for quality, credibility, and readiness to support international patients."
        },
        {
          "question": "Can I request a consultation before deciding on a treatment?",
          "answer": "Yes. Patients can speak with the team, share medical information, and receive guidance on suitable treatment pathways before confirming travel."
        },
        {
          "question": "Are treatment prices fixed on the website?",
          "answer": "Displayed prices are directional starting points. Final pricing depends on the medical case, provider selection, diagnostics, and the treatment plan recommended after review."
        },
        {
          "question": "How does Care N Tour support patients traveling from abroad?",
          "answer": "Support can include treatment coordination, provider matching, scheduling, communication assistance, travel guidance, accommodation planning, and post-treatment follow-up support."
        },
        {
          "question": "What should I do after choosing a treatment?",
          "answer": "The next step is to start your journey or contact the Care N Tour team so your case can be reviewed and a personalized treatment pathway can be prepared."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Start Planning",
      "heading": "Shortlist your treatment with a team built to support international patients properly.",
      "description": "If you already know the treatment you are exploring, we can help you move from browsing to a clear, personalized treatment plan.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Book a consultation",
          "href": "/consultation",
          "variant": "default"
        },
        {
          "label": "Contact our team",
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
