INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'plan',
    'Plan Your Trip',
    'published',
    $${
    "title": "Plan Your Medical Trip to Egypt | Care N Tour International Patient Services",
    "description": "Plan medical travel to Egypt with Care N Tour. Explore treatment coordination, visa guidance, recovery accommodation, airport transfers, multilingual support, and a guided patient intake."
    }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Plan Your Trip",
      "heading": "Plan your medical trip to Egypt with one coordinated team for treatment, travel, and recovery.",
      "description": "Care N Tour helps international patients align medical review, travel preparation, accommodation, airport transfers, and recovery planning through one guided pathway.",
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
          "label": "Treatment coordination, travel preparation, and recovery logistics managed together"
        },
        {
          "kicker": "Audience",
          "label": "Built for international patients, companions, and referring families"
        },
        {
          "kicker": "Access",
          "label": "Start with a guided intake and receive a tailored treatment and travel plan"
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
      "eyebrow": "International Patient Planning",
      "heading": "Care N Tour turns medical travel to Egypt into one clear, supported journey from consultation to recovery.",
      "lead": "We help patients from around the world access premium healthcare in Egypt with confidence, comfort, and operational clarity.",
      "paragraphs": [
        "Our team connects international patients with trusted doctors, accredited hospitals, and a structured care pathway designed around their medical goals, travel timeline, and recovery needs.",
        "From medical review and specialist matching to visa guidance, accommodation, airport transfers, and local coordination, every stage is planned as part of one connected experience.",
        "The result is a medical tourism journey that feels safer, more transparent, and more comfortable for patients and their families."
      ],
      "strengthsTitle": "Why patients choose Care N Tour",
      "strengths": [
        {
          "title": "Trusted medical access",
          "description": "We work with carefully selected providers so patients can move forward with greater confidence in quality, safety, and clinical standards."
        },
        {
          "title": "End-to-end coordination",
          "description": "Treatment planning, travel logistics, accommodation, and recovery support are managed together instead of across disconnected vendors."
        },
        {
          "title": "Personalized support",
          "description": "Every case is handled around the patient, with multilingual communication, tailored planning, and follow-up support before and after travel."
        }
      ],
      "closing": "This is how Care N Tour represents Egypt as a trusted destination for world-class treatment and concierge-level patient care."
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "A medical tourism company built for international patient expectations",
      "description": "Care N Tour combines healthcare access, global patient support, and premium travel coordination in one managed service model.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Successful procedures",
          "value": "5000+",
          "helper": "Patients supported across treatment planning, travel, and recovery",
          "icon": "Globe2"
        },
        {
          "label": "Countries served",
          "value": "50+",
          "helper": "International reach across North America, Europe, the Gulf, and beyond",
          "icon": "Shield"
        },
        {
          "label": "Patient satisfaction",
          "value": "98%",
          "helper": "A service standard built around clarity, comfort, and continuity",
          "icon": "Clock"
        },
        {
          "label": "Languages supported",
          "value": "15+",
          "helper": "Multilingual communication for patients, companions, and families",
          "icon": "Plane"
        }
      ]
    },
    {
      "type": "featureGrid",
      "eyebrow": "How Planning Works",
      "heading": "Your Care N Tour journey, step by step",
      "description": "A seamless process designed to make medical tourism in Egypt feel organized, transparent, and fully supported.",
      "columns": 3,
      "variant": "cards",
      "items": [
        {
          "tag": "01",
          "icon": "FileSearch",
          "title": "Initial consultation",
          "description": "Share your medical goals, treatment interests, and preferred timeline so our coordinators can understand your case and advise on the next step."
        },
        {
          "tag": "02",
          "icon": "ClipboardList",
          "title": "Medical evaluation",
          "description": "Your records are reviewed with the relevant specialists so we can help shape a treatment plan, expected timeline, and preliminary guidance."
        },
        {
          "tag": "03",
          "icon": "CalendarCheck",
          "title": "Travel planning",
          "description": "We coordinate visa guidance, accommodation, airport transfers, and travel logistics around your medical schedule and recovery needs."
        },
        {
          "tag": "04",
          "icon": "BadgeCheck",
          "title": "Arrival and treatment",
          "description": "You arrive to dedicated on-ground support, settle into your stay, and move through consultations and treatment with one coordination team beside you."
        },
        {
          "tag": "05",
          "icon": "Hotel",
          "title": "Recovery support",
          "description": "Recovery arrangements are planned around your procedure, comfort, follow-up visits, and any companion or family requirements."
        },
        {
          "tag": "06",
          "icon": "HeartHandshake",
          "title": "Follow-up continuity",
          "description": "Even after you return home, Care N Tour helps maintain communication, follow-up coordination, and continuity with your treating team."
        }
      ]
    },
    {
      "type": "startJourneyEmbed",
      "eyebrow": "Start Your Journey",
      "heading": "Share your treatment goals, medical history, and travel preferences in one guided intake.",
      "description": "This guided form helps our team assess treatment suitability, timing, accommodation needs, companion travel, and the practical steps required for your medical trip to Egypt.",
      "supportCardTitle": "What happens after you submit?",
      "supportCardDescription": "Our international patient team reviews your case, confirms any missing records, and prepares a coordinated treatment and travel recommendation.",
      "supportBullets": [
        "Medical coordinators review diagnosis, treatment goals, and preferred timing",
        "The team shortlists suitable providers and clarifies any missing documents",
        "Travel planners align accommodation, airport transfers, and companion needs",
        "You receive clear next steps for consultation, scheduling, and arrival planning"
      ],
      "responseTimeLabel": "Initial follow-up: typically within hours",
      "reassuranceLabel": "Submitting your intake is free and carries no booking obligation",
      "advanced": {
        "anchorId": "start-journey-intake"
      }
    },
    {
      "type": "tabbedGuide",
      "eyebrow": "Planning Essentials",
      "badge": "Before You Travel",
      "heading": "Before you travel with Care N Tour, we help you prepare every essential step.",
      "description": "Our team supports patients and families with the travel preparation, recovery planning, and local coordination needed for a smoother medical journey to Egypt.",
      "tabs": [
        {
          "id": "entry-visa",
          "label": "Entry & Visa",
          "icon": "FileText",
          "heading": "Care N Tour helps you prepare the travel documents needed before departure.",
          "description": "We guide patients on passport readiness, common visa routes, and the medical records typically needed before treatment dates are confirmed.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 2,
              "cards": [
                {
                  "title": "Visa and entry guidance",
                  "description": "Our coordinators help patients understand the usual entry pathway for their nationality and treatment schedule.",
                  "icon": "Globe",
                  "bullets": [
                    "Visa requirements can vary by passport and expected length of stay",
                    "Many patients travel on tourist or e-visa routes where eligible",
                    "Passports should usually remain valid for at least six months",
                    "Longer treatment journeys may need extra travel planning"
                  ]
                },
                {
                  "title": "What our team may ask you to prepare",
                  "description": "Preparing these items early helps Care N Tour move faster with hospitals, doctors, and scheduling.",
                  "icon": "FolderCheck",
                  "bullets": [
                    "Passport copy",
                    "Medical reports, scans, and lab results",
                    "Current medications, allergies, and medical history",
                    "Preferred travel dates and companion details"
                  ]
                }
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Need help with documents?",
              "title": "Speak with the Care N Tour team",
              "description": "We can explain what documents to prepare before you confirm treatment dates, flights, and accommodation.",
              "actions": [
                {
                  "label": "Contact our team",
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
          "heading": "We help you plan a stay that fits your treatment schedule and recovery needs.",
          "description": "Care N Tour coordinates accommodation and recovery planning around the procedure, follow-up visits, mobility requirements, and companion travel.",
          "sections": [
            {
              "type": "infoPanels",
              "panels": [
                {
                  "title": "How we approach recovery stays",
                  "items": [
                    "We help identify hotels or apartments based on hospital proximity, comfort, and the type of recovery support required.",
                    "For procedures with follow-up visits or mobility considerations, we may recommend a longer and more recovery-friendly stay.",
                    "Companion rooms, dietary preferences, and quieter environments can be planned in advance."
                  ]
                },
                {
                  "title": "What Care N Tour aligns before arrival",
                  "items": [
                    "Arrival timing around consultation, testing, and admission",
                    "Procedure and discharge timing in relation to hotel arrangements",
                    "Recovery days in relation to follow-up care and return travel"
                  ]
                }
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Recovery logistics",
              "title": "Explore the full travel guide",
              "description": "Explore more destination, accommodation, and visitor guidance for patients traveling with Care N Tour.",
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
          "heading": "From the moment you arrive, Care N Tour stays involved on the ground.",
          "description": "Our local coordination helps patients and companions move through arrival, appointments, treatment, and recovery with more confidence and less friction.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 2,
              "cards": [
                {
                  "title": "Transfers and transportation",
                  "icon": "Car",
                  "bullets": [
                    "Airport pickup and return transfer planning",
                    "Hospital, clinic, hotel, and pharmacy transfers coordinated in advance",
                    "Daily movement aligned with consultation, treatment, and discharge timing"
                  ]
                },
                {
                  "title": "Patient and family support",
                  "icon": "Languages",
                  "bullets": [
                    "One Care N Tour coordination team for patients and companions",
                    "Multilingual communication before treatment, during the stay, and after discharge",
                    "Ongoing support through recovery and after the patient returns home"
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
      "eyebrow": "Why Patients Trust The Process",
      "heading": "The Care N Tour difference goes beyond booking appointments.",
      "description": "Our service model combines medical credibility, concierge support, and international patient care in one experience.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Accredited provider coordination",
          "description": "We connect patients with trusted doctors, accredited hospitals, and carefully selected treatment partners in Egypt.",
          "icon": "Route"
        },
        {
          "eyebrow": "02",
          "title": "Medical concierge support",
          "description": "Patients receive clear guidance across consultation, treatment planning, travel preparation, and on-ground coordination.",
          "icon": "MessagesSquare"
        },
        {
          "eyebrow": "03",
          "title": "Premium travel coordination",
          "description": "Accommodation, airport transfers, local transport, and recovery-friendly arrangements are handled with comfort and convenience in mind.",
          "icon": "HeartHandshake"
        },
        {
          "eyebrow": "04",
          "title": "Continuity before and after treatment",
          "description": "Support continues before departure, during the stay in Egypt, and through the follow-up stage after the patient returns home.",
          "icon": "Shield"
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Planning Questions",
      "heading": "Questions international patients commonly ask before submitting their case",
      "description": "These answers are written for high-intent patient queries around medical travel to Egypt, treatment planning, and recovery logistics.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What do I need to plan medical travel to Egypt with Care N Tour?",
          "answer": "Before you start, it helps to have a passport copy, relevant medical reports, scans or lab results, your treatment goal, and preferred travel dates. If some records are missing, the Care N Tour team can still advise on the next best step."
        },
        {
          "question": "Can I start planning if I am still comparing treatments or doctors?",
          "answer": "Yes. Many international patients begin with a broad treatment goal rather than a final doctor selection. Care N Tour can review your case, explain suitable treatment pathways, and help narrow the right provider options in Egypt."
        },
        {
          "question": "Does Care N Tour arrange accommodation, airport transfers, and companion travel?",
          "answer": "Yes. Planning support can include recovery-friendly accommodation, airport pickup, local transfers, and arrangements for family members or companions traveling with the patient."
        },
        {
          "question": "How does visa guidance work for medical travel to Egypt?",
          "answer": "Visa requirements depend on nationality and trip length. Care N Tour helps patients understand the common visa route for their case, the documents usually needed before departure, and any extra planning required for longer medical stays."
        },
        {
          "question": "How fast will I receive a response after submitting the intake?",
          "answer": "The team aims to follow up within hours for most complete submissions. Response time can vary by case complexity, specialty, and whether additional medical records are needed for review."
        },
        {
          "question": "What happens after I submit my treatment and travel request?",
          "answer": "After submission, the team reviews your medical and travel information, requests any missing documents, shortlists suitable providers when appropriate, and sends clear next steps for consultation, scheduling, and trip planning."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Prefer To Speak First?",
      "heading": "Talk to our international patient team before you complete the intake.",
      "description": "If you want a quick conversation first, our coordinators can explain the process, required records, likely timelines, and how treatment planning in Egypt works.",
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
