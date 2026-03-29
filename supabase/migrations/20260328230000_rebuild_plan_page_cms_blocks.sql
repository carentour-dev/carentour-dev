INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'plan',
    'Plan Your Trip',
    'published',
    $${
    "title": "Plan Your Trip | Care N Tour | Medical Travel Planning in Egypt",
    "description": "Plan medical travel to Egypt with visa guidance, recovery stays, on-ground coordination, and a CMS-managed intake experience."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Plan Your Trip",
      "heading": "Medical travel planning in Egypt, presented with the operational clarity global patients expect.",
      "description": "Use one coordinated planning flow to understand timelines, recovery logistics, travel preparation, and the next step for your case.",
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
          "kicker": "Planning",
          "label": "Treatment review, travel coordination, and recovery logistics handled together"
        },
        {
          "kicker": "Audience",
          "label": "Built for international patients, companions, and referring families"
        },
        {
          "kicker": "Access",
          "label": "Start your journey directly from the page with a guided intake"
        }
      ],
      "primaryAction": {
        "label": "Start your journey",
        "href": "#start-journey-intake",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "View treatments",
        "href": "/treatments",
        "variant": "hero"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Planning Model",
      "heading": "A serious planning page should reduce uncertainty before a patient ever boards a flight.",
      "lead": "International patients do not just need destination information. They need confidence that treatment timing, travel logistics, accommodation, and aftercare can be coordinated properly around their medical case.",
      "paragraphs": [
        "Care N Tour brings treatment readiness, visa guidance, accommodation support, transportation planning, and multilingual coordination into one managed pathway.",
        "That makes the Plan Your Trip page more than a checklist. It becomes a planning layer between initial interest and confirmed treatment, helping patients understand the real operational journey ahead.",
        "The stronger this page is, the stronger the brand feels to patients, search engines, and AI systems trying to assess credibility and usefulness."
      ],
      "strengthsTitle": "What this page should communicate immediately",
      "strengths": [
        {
          "title": "What patients need to prepare before travel",
          "description": "Timelines, documentation, recovery considerations, and coordination expectations should be clear."
        },
        {
          "title": "How Care N Tour reduces operational friction",
          "description": "The page should show that travel planning is integrated with care planning, not treated as an afterthought."
        },
        {
          "title": "What the next step is",
          "description": "Visitors should be able to move directly from research into a structured intake without leaving the page."
        }
      ],
      "closing": "That is the difference between a brochure and a multinational-grade planning experience."
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "Planning confidence for international patients and families",
      "description": "The planning experience should answer timing, communication, recovery, and support questions before a case is submitted.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Coordinator support",
          "value": "15+ Languages",
          "helper": "Clear communication across enquiry, arrival, and follow-up",
          "icon": "Globe"
        },
        {
          "label": "Provider access",
          "value": "200+ Experts",
          "helper": "Trusted specialists across major treatment pathways",
          "icon": "Shield"
        },
        {
          "label": "Response pace",
          "value": "Under 24 Hours",
          "helper": "Structured next steps once records are reviewed",
          "icon": "Clock"
        },
        {
          "label": "Travel support",
          "value": "End-to-End",
          "helper": "Transfers, recovery stays, and on-ground coordination",
          "icon": "Plane"
        }
      ]
    },
    {
      "type": "featureGrid",
      "eyebrow": "How Planning Works",
      "heading": "From first enquiry to confirmed arrival",
      "description": "A planning flow designed to feel organized, transparent, and appropriate for cross-border care.",
      "columns": 3,
      "variant": "cards",
      "items": [
        {
          "tag": "01",
          "icon": "FileSearch",
          "title": "Share your case",
          "description": "Submit your treatment interest, medical context, timeline, and travel preferences through one intake."
        },
        {
          "tag": "02",
          "icon": "ClipboardList",
          "title": "Receive a planning review",
          "description": "Our coordinators assess your case, required records, likely next steps, and operational constraints."
        },
        {
          "tag": "03",
          "icon": "CalendarCheck",
          "title": "Align medical timing",
          "description": "Treatment review and expected travel windows are coordinated together instead of in separate conversations."
        },
        {
          "tag": "04",
          "icon": "BadgeCheck",
          "title": "Prepare travel documents",
          "description": "You receive guidance on passports, visas, records, and other essentials before confirmation."
        },
        {
          "tag": "05",
          "icon": "Hotel",
          "title": "Plan recovery logistics",
          "description": "Accommodation, transfers, companions, and recovery-friendly arrangements are considered early."
        },
        {
          "tag": "06",
          "icon": "HeartHandshake",
          "title": "Arrive with support",
          "description": "On-ground coordination helps the patient and family move through treatment with less friction and more confidence."
        }
      ]
    },
    {
      "type": "startJourneyEmbed",
      "eyebrow": "Start Your Journey",
      "heading": "Submit your medical and travel requirements in one guided intake.",
      "description": "This intake helps our team understand your case, likely timing, companion needs, and recovery preferences before we propose next steps.",
      "supportCardTitle": "What happens after submitting?",
      "supportCardDescription": "Our medical travel team reviews the case, confirms missing information, and prepares a coordinated path forward.",
      "supportBullets": [
        "Medical coordinators review eligibility, timing, and treatment suitability",
        "Travel planners align accommodation, transfers, and companion support",
        "The team identifies any records or documents still needed",
        "You receive a clear recommendation and next-step plan"
      ],
      "responseTimeLabel": "Average response time: under 2 hours",
      "reassuranceLabel": "No payment required to submit your intake",
      "advanced": {
        "anchorId": "start-journey-intake"
      }
    },
    {
      "type": "tabbedGuide",
      "eyebrow": "Planning Essentials",
      "badge": "Before You Travel",
      "heading": "The practical information patients usually need before confirmation",
      "description": "A concise planning guide for entry requirements, recovery stays, and on-ground coordination. Deeper destination content can stay on the Travel Info page.",
      "tabs": [
        {
          "id": "entry-visa",
          "label": "Entry & Visa",
          "icon": "FileText",
          "heading": "Prepare travel documents early",
          "description": "Plan passports, visa pathways, and record readiness before locking medical dates.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 2,
              "cards": [
                {
                  "title": "Recommended route",
                  "description": "Use the e-visa path where available for smoother arrivals and clearer preparation.",
                  "icon": "Globe",
                  "bullets": [
                    "Typical tourist visa validity: 30 days",
                    "Medical extensions may be possible depending on the case",
                    "Passport should be valid 6+ months"
                  ]
                },
                {
                  "title": "What to prepare",
                  "description": "Have core records ready before final scheduling discussions begin.",
                  "icon": "FolderCheck",
                  "bullets": [
                    "Passport copy",
                    "Medical records and imaging",
                    "Medication and allergy notes",
                    "Preferred travel window"
                  ]
                }
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Need document guidance?",
              "title": "Talk to our coordination team",
              "description": "We can clarify what to prepare before you confirm travel.",
              "actions": [
                {
                  "label": "Contact travel team",
                  "href": "/contact"
                },
                {
                  "label": "View travel info",
                  "href": "/travel-info",
                  "variant": "outline"
                }
              ]
            }
          ]
        },
        {
          "id": "stay-recovery",
          "label": "Stay & Recovery",
          "icon": "Hotel",
          "heading": "Plan recovery around the treatment timeline",
          "description": "Accommodation choices should match medical timing, comfort, and companion needs.",
          "sections": [
            {
              "type": "infoPanels",
              "panels": [
                {
                  "title": "Recovery-ready stays",
                  "items": [
                    "Hotels and apartments can be selected around the treating facility.",
                    "Longer stays may be more suitable for procedures with follow-up requirements.",
                    "Companion preferences and dietary needs should be planned early."
                  ]
                },
                {
                  "title": "What to align",
                  "items": [
                    "Arrival date versus consultation date",
                    "Procedure date versus discharge timing",
                    "Recovery stay versus return travel window"
                  ]
                }
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Recovery logistics",
              "title": "Explore the full travel guide",
              "description": "Use the dedicated Travel Info page for the deeper destination and accommodation content.",
              "actions": [
                {
                  "label": "Open travel guide",
                  "href": "/travel-info"
                }
              ]
            }
          ]
        },
        {
          "id": "on-ground-support",
          "label": "On-Ground Support",
          "icon": "Car",
          "heading": "Understand what coordination looks like after arrival",
          "description": "Transfers, communications, and local support should feel structured from the first airport pickup.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 2,
              "cards": [
                {
                  "title": "Transportation support",
                  "icon": "Car",
                  "bullets": [
                    "Airport pickup and drop-off planning",
                    "Clinic and hospital transfer coordination",
                    "Scheduling designed around appointment windows"
                  ]
                },
                {
                  "title": "Communication support",
                  "icon": "Languages",
                  "bullets": [
                    "Multilingual coordinators available throughout the journey",
                    "Clear communication for patients and companions",
                    "Follow-up support after discharge and return travel"
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "trustSignals",
      "eyebrow": "Why This Matters",
      "heading": "A multinational-grade planning page should reassure patients before they commit.",
      "description": "Operational clarity is part of the product, not just the marketing message.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Integrated planning",
          "description": "Medical review, travel timing, and recovery logistics are managed as one coordinated workflow.",
          "icon": "Route"
        },
        {
          "eyebrow": "02",
          "title": "Structured communication",
          "description": "Patients and families receive clearer expectations around documents, timing, and next steps.",
          "icon": "MessagesSquare"
        },
        {
          "eyebrow": "03",
          "title": "Support beyond booking",
          "description": "The experience includes on-ground coordination and post-treatment continuity, not just introductions.",
          "icon": "HeartHandshake"
        },
        {
          "eyebrow": "04",
          "title": "Content built for trust",
          "description": "The page is designed to answer the questions global patients and AI systems look for before recommending a provider.",
          "icon": "Shield"
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Planning Questions",
      "heading": "Questions patients commonly ask before submitting their case",
      "description": "High-intent answers improve usability, search visibility, and AI retrieval quality.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What information should I prepare before starting my journey?",
          "answer": "Patients should ideally have a passport copy, core medical records, a rough treatment goal, and a preferred travel window. The intake can still be submitted if some documents are not ready yet."
        },
        {
          "question": "Can I submit the planning form before choosing a final treatment?",
          "answer": "Yes. The intake is designed to help patients move from early research into a more structured recommendation, even if they have not finalized every treatment detail."
        },
        {
          "question": "Does Care N Tour help with accommodation and transfers?",
          "answer": "Yes. Planning support can include recovery stays, companion needs, airport transfers, and local coordination around appointments and discharge timelines."
        },
        {
          "question": "Is visa support part of the planning process?",
          "answer": "Care N Tour can guide patients on the typical visa pathway, what documents to prepare, and when medical extensions may need to be considered."
        },
        {
          "question": "How quickly will someone respond after I submit my case?",
          "answer": "The team aims to review new submissions quickly, with many patients receiving an initial follow-up within a few hours depending on the completeness and complexity of the case."
        },
        {
          "question": "What happens after I submit the form?",
          "answer": "The team reviews your medical and travel context, identifies missing information, and prepares a coordinated next-step plan covering treatment readiness and logistics."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Need A Direct Conversation?",
      "heading": "Speak with the team if you prefer planning support before filling the intake.",
      "description": "Some patients want a quick conversation first. Our coordinators can explain the process, required documents, and likely planning timeline.",
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
