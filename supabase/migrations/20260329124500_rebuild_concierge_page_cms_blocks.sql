INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
  'concierge',
  'Concierge',
  'published',
  $${
    "title": "International Patient Concierge Services | Care N Tour",
    "description": "Explore Care N Tour concierge services for international patients, including medical coordination, travel planning, accommodation, airport transfers, multilingual support, and recovery logistics in Egypt."
  }$$::jsonb,
  $$[
    {
      "type": "aboutHero",
      "eyebrow": "International Patient Concierge",
      "heading": "International patient services coordinated with the structure, clarity, and responsiveness global families expect.",
      "description": "At Care N Tour, we coordinate the non-clinical side of treatment with the same discipline patients expect from a multinational healthcare partner. We align medical scheduling, travel preparation, accommodation, airport transfers, communication support, and recovery logistics through one connected service model.",
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
          "label": "Medical coordination, travel planning, accommodation, transfers, companion support, and recovery logistics"
        },
        {
          "kicker": "Model",
          "label": "One operational team aligning treatment milestones with every practical step around them"
        },
        {
          "kicker": "Audience",
          "label": "Designed for international patients, families, and decision-makers comparing treatment abroad"
        }
      ],
      "primaryAction": {
        "label": "Start your journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Plan your trip",
        "href": "/plan",
        "variant": "hero"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "How We Work",
      "heading": "We do not treat concierge support as an add-on. We treat it as the operating layer that makes international care feel manageable.",
      "lead": "For patients traveling abroad, the treatment decision is only one part of the journey. Timing, records, flights, airport pickup, accommodation, companions, and follow-up planning all affect whether the experience feels clear or chaotic.",
      "paragraphs": [
        "Care N Tour brings those moving parts into one coordinated path. We help patients prepare before travel, move with more confidence on arrival, and stay supported through treatment and recovery.",
        "That matters because international patients are not evaluating logistics separately from healthcare quality. They are evaluating the entire journey, including communication, responsiveness, continuity, and trust.",
        "Our concierge page should therefore feel less like a tourism upsell and more like the operational services layer of an international patient platform."
      ],
      "strengthsTitle": "What this page should communicate immediately",
      "strengths": [
        {
          "title": "We coordinate the practical journey around treatment",
          "description": "Patients should quickly understand that travel, accommodation, scheduling, and support are managed together rather than through separate vendors."
        },
        {
          "title": "We operate with global patient expectations in mind",
          "description": "The page should communicate structure, discretion, multilingual communication, and responsiveness suitable for multinational audiences."
        },
        {
          "title": "We provide a clearer next step",
          "description": "Every section should help the visitor move naturally toward planning, consultation, or intake."
        }
      ],
      "closing": "That is the standard Care N Tour should represent when speaking directly to patients and families evaluating treatment in Egypt."
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "Built to support the full international patient journey",
      "description": "Our concierge model exists to reduce friction, increase confidence, and keep treatment logistics aligned from first contact to follow-up.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Support window",
          "value": "24/7",
          "helper": "Responsive coordination for time-sensitive travel and care planning",
          "icon": "Clock3"
        },
        {
          "label": "Languages supported",
          "value": "15+",
          "helper": "Multilingual communication for patients, families, and companions",
          "icon": "Languages"
        },
        {
          "label": "Journey coverage",
          "value": "End-to-End",
          "helper": "From records and scheduling to recovery logistics and continuity",
          "icon": "Route"
        },
        {
          "label": "Coordination style",
          "value": "One Team",
          "helper": "A single operating layer across medical, travel, and support needs",
          "icon": "Handshake"
        }
      ]
    },
    {
      "type": "serviceCatalog",
      "eyebrow": "Service Scope",
      "heading": "The concierge services we coordinate for international patients and companions",
      "description": "Each service line is designed to remove a specific layer of uncertainty from the patient journey while keeping every step editable and transparent through our CMS-led operating model.",
      "items": [
        {
          "title": "Medical case coordination",
          "description": "We organize the practical work around medical review so patients can move from inquiry to a clearer treatment path with less back-and-forth.",
          "icon": "HeartHandshake",
          "availability": "Pre-arrival through follow-up",
          "bullets": [
            "Collection and organization of medical reports, scans, and supporting documents",
            "Specialist matching and appointment coordination aligned with the case",
            "Scheduling support across consultation, diagnostics, treatment, and review milestones",
            "Post-treatment follow-up planning so continuity is considered from the start"
          ],
          "languages": ["English", "Arabic", "French", "German"],
          "note": "This service helps patients move faster with more clarity before travel is confirmed.",
          "action": {
            "label": "Explore treatments",
            "href": "/treatments",
            "variant": "outline"
          }
        },
        {
          "title": "Travel and arrival management",
          "description": "We align treatment schedules with the travel details that usually create friction for international patients and families.",
          "icon": "Plane",
          "availability": "Before departure and on arrival",
          "bullets": [
            "Travel preparation guidance aligned with treatment dates and expected stay",
            "Airport pickup planning and in-city transfer coordination",
            "Arrival timing support around consultations, diagnostics, admission, and discharge",
            "Companion and family travel logistics coordinated alongside the patient plan"
          ],
          "languages": ["English", "Arabic", "Spanish", "Italian"],
          "note": "Patients should not need to manage medical timing and travel timing separately.",
          "action": {
            "label": "Plan your trip",
            "href": "/plan",
            "variant": "outline"
          }
        },
        {
          "title": "Accommodation and recovery support",
          "description": "We help arrange stays that suit the procedure, expected recovery timeline, mobility needs, and proximity to care.",
          "icon": "Hotel",
          "availability": "During treatment and recovery",
          "bullets": [
            "Recovery-friendly accommodation planning based on medical schedule and comfort",
            "Coordination for extended stays, companion rooms, and post-procedure practical needs",
            "Support around follow-up visits, discharge timing, and return-travel readiness",
            "Local logistics planning that keeps recovery conditions and convenience in view"
          ],
          "languages": ["English", "Arabic", "French"],
          "note": "Recovery logistics are treated as part of the care journey, not an afterthought.",
          "action": {
            "label": "View travel information",
            "href": "/travel-info",
            "variant": "outline"
          }
        },
        {
          "title": "Communication and continuity",
          "description": "We help patients and families stay informed before arrival, during treatment, and after returning home.",
          "icon": "MessagesSquare",
          "availability": "Throughout the journey",
          "bullets": [
            "Multilingual communication support for patient-facing coordination",
            "Clear updates around scheduling, documentation, and next operational steps",
            "Family and companion coordination when additional support is required",
            "Continuity support after treatment so follow-up communication stays organized"
          ],
          "languages": ["English", "Arabic", "German", "Portuguese"],
          "note": "This is the layer that keeps the journey coherent when several stakeholders are involved.",
          "action": {
            "label": "Start your journey",
            "href": "/start-journey",
            "variant": "default"
          }
        }
      ]
    },
    {
      "type": "featureGrid",
      "eyebrow": "Who We Support",
      "heading": "A concierge model designed for the realities of international treatment decisions",
      "description": "Patients do not arrive with the same priorities. This page should show how Care N Tour supports different decision contexts without diluting the brand.",
      "columns": 3,
      "variant": "cards",
      "items": [
        {
          "tag": "Patients",
          "icon": "UserRound",
          "title": "Individuals comparing providers abroad",
          "description": "We help patients evaluate practical readiness, not just clinical availability, before they commit to travel."
        },
        {
          "tag": "Families",
          "icon": "Users",
          "title": "Companions and family members",
          "description": "We coordinate the stay around shared travel, updates, recovery planning, and support requirements."
        },
        {
          "tag": "Complex cases",
          "icon": "BriefcaseMedical",
          "title": "Multi-step treatment journeys",
          "description": "When the itinerary includes diagnostics, consultations, procedures, and review visits, we keep the operational plan connected."
        }
      ]
    },
    {
      "type": "trustSignals",
      "eyebrow": "Operating Standard",
      "heading": "The concierge page should reinforce discipline, responsiveness, and international readiness.",
      "description": "This is where Care N Tour signals that support is structured, not improvised, and that the company understands how multinational audiences evaluate service quality.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Integrated with treatment planning",
          "description": "Concierge coordination is aligned with medical milestones rather than managed as a separate track.",
          "icon": "Workflow"
        },
        {
          "eyebrow": "02",
          "title": "Multilingual and internationally oriented",
          "description": "Communication is designed for patients and families arriving from different markets, languages, and care expectations.",
          "icon": "Languages"
        },
        {
          "eyebrow": "03",
          "title": "Recovery and companion needs considered early",
          "description": "Accommodation, timing, and practical support are shaped around the procedure and expected recovery window.",
          "icon": "BedSingle"
        },
        {
          "eyebrow": "04",
          "title": "Continuity beyond arrival",
          "description": "Support continues through treatment logistics, follow-up planning, and the transition back home.",
          "icon": "RefreshCcw"
        }
      ]
    },
    {
      "type": "tabbedGuide",
      "eyebrow": "How Coordination Works",
      "badge": "Concierge Journey",
      "heading": "The Concierge page should explain the support model in a way patients, families, and AI systems can parse clearly.",
      "description": "We break the operational journey into the stages international patients care about most so the service scope is easy to scan, understand, and compare.",
      "tabs": [
        {
          "id": "before-arrival",
          "label": "Before Arrival",
          "icon": "CalendarClock",
          "heading": "Before you travel, we help align records, timing, and travel preparation.",
          "description": "The first stage is about reducing uncertainty before flights or accommodation are confirmed.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 2,
              "cards": [
                {
                  "title": "Case preparation",
                  "icon": "FolderCheck",
                  "bullets": [
                    "Medical reports and scans organized for review",
                    "Missing information identified early",
                    "Suitable specialists and schedules shortlisted around the case"
                  ]
                },
                {
                  "title": "Travel readiness",
                  "icon": "PlaneTakeoff",
                  "bullets": [
                    "Expected stay length aligned with treatment timeline",
                    "Arrival planning around consultation and admission dates",
                    "Companion requirements considered before booking"
                  ]
                }
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Need help planning?",
              "title": "Share your case and timing with our team",
              "description": "A guided intake gives us the information we need to coordinate the next practical steps properly.",
              "actions": [
                {
                  "label": "Start your journey",
                  "href": "/start-journey"
                }
              ]
            }
          ]
        },
        {
          "id": "during-stay",
          "label": "During Your Stay",
          "icon": "MapPinned",
          "heading": "Once you arrive, we help keep accommodation, transfers, and treatment logistics moving together.",
          "description": "The goal is to reduce friction on the ground so patients can focus on treatment and recovery.",
          "sections": [
            {
              "type": "infoPanels",
              "panels": [
                {
                  "title": "Arrival and movement",
                  "items": [
                    "Airport pickup and transfer planning around your confirmed itinerary",
                    "Transport coordination across consultations, diagnostics, treatment, and follow-up visits",
                    "Practical support for companions and family members traveling with you"
                  ]
                },
                {
                  "title": "Stay and recovery setup",
                  "items": [
                    "Accommodation aligned with hospital access and recovery comfort",
                    "Operational planning around discharge dates, follow-up visits, and return travel",
                    "A clearer on-ground structure when the itinerary changes or extends"
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "after-treatment",
          "label": "After Treatment",
          "icon": "ShieldCheck",
          "heading": "After treatment, we help keep continuity and practical follow-up organized.",
          "description": "Patients should leave Egypt with a clearer path forward, not with unresolved coordination questions.",
          "sections": [
            {
              "type": "compactList",
              "title": "What continuity support can include",
              "rows": [
                {
                  "title": "Follow-up coordination",
                  "description": "Helping keep communication and next operational steps clear after procedures are completed."
                },
                {
                  "title": "Return-travel alignment",
                  "description": "Reviewing timing around recovery, follow-up visits, and readiness for departure."
                },
                {
                  "title": "Companion and family closure",
                  "description": "Ensuring practical details for companions are not left unresolved at the final stage."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Questions international patients often ask before requesting concierge support",
      "description": "These answers help visitors, search engines, and AI systems understand what Care N Tour actually coordinates around treatment.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What does Care N Tour concierge support include for international patients?",
          "answer": "Care N Tour concierge support can include medical scheduling coordination, travel planning, airport transfers, accommodation guidance, companion logistics, multilingual communication support, and recovery-related practical planning around the treatment journey in Egypt."
        },
        {
          "question": "Is concierge support separate from treatment coordination?",
          "answer": "No. Care N Tour treats concierge support as part of the broader patient journey, which means practical logistics are aligned with consultations, diagnostics, procedures, discharge, and follow-up planning."
        },
        {
          "question": "Can Care N Tour help family members or companions traveling with the patient?",
          "answer": "Yes. Companion and family needs can be factored into accommodation planning, airport transfers, on-ground logistics, and communication support throughout the stay."
        },
        {
          "question": "Do you help patients before they arrive in Egypt?",
          "answer": "Yes. Care N Tour can support patients before arrival by helping organize medical records, clarify next steps, align expected travel timing, and prepare the operational side of the journey before bookings are finalized."
        },
        {
          "question": "Is concierge support available after treatment is completed?",
          "answer": "Yes. Support can continue through discharge planning, follow-up coordination, and practical continuity after the patient returns home."
        },
        {
          "question": "What is the best next step if I want Care N Tour to coordinate my trip?",
          "answer": "The best next step is to start your journey through the guided intake so our team can review your medical goals, expected timeline, travel preferences, and support requirements before preparing the next recommendation."
        }
      ]
    },
    {
      "type": "startJourneyEmbed",
      "eyebrow": "Start Coordination",
      "heading": "Share your treatment goals and travel needs so we can coordinate the next practical steps properly.",
      "description": "Our guided intake helps us understand your case, expected timing, companion requirements, accommodation preferences, and the operational support needed around treatment in Egypt.",
      "supportCardTitle": "What happens after you submit?",
      "supportCardDescription": "Our international patient team reviews your case and prepares a coordinated recommendation that connects treatment, travel, and recovery logistics.",
      "supportBullets": [
        "We review your medical goals, timeline, and practical travel constraints",
        "We identify what records or clarifications are still needed",
        "We align likely providers, scheduling windows, and support requirements",
        "We prepare clearer next steps for treatment planning and travel coordination"
      ],
      "responseTimeLabel": "Initial follow-up: typically within hours",
      "reassuranceLabel": "Submitting your intake is free and does not commit you to a booking"
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  seo = EXCLUDED.seo,
  content = EXCLUDED.content,
  updated_at = now();
