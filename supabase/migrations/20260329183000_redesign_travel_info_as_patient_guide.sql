INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
  'travel-info',
  'Travel Information',
  'published',
  $${
    "title": "Travel Information for International Patients Visiting Egypt | Care N Tour",
    "description": "Review entry planning, accommodation, local mobility, payments, language support, and recovery-focused travel guidance for medical trips to Egypt with Care N Tour."
  }$$::jsonb,
  $$[
    {
      "type": "aboutHero",
      "eyebrow": "Travel Information",
      "heading": "Travel information for international patients planning treatment in Egypt.",
      "description": "At Care N Tour, we help patients and families prepare for entry, stay, recovery, and local mobility with the clarity expected from a multinational patient-services company.",
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
          "kicker": "Entry",
          "label": "Common entry routes, travel documents, and planning checkpoints explained clearly"
        },
        {
          "kicker": "Stay",
          "label": "Recovery-focused accommodation and companion planning aligned with the treatment timeline"
        },
        {
          "kicker": "Support",
          "label": "One coordination team helping patients prepare before arrival and move with confidence on the ground"
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
      "type": "advisoryNotice",
      "eyebrow": "Before You Book",
      "heading": "Use this guide for practical preparation, then confirm case-specific travel details with our team.",
      "description": "Entry pathways, length of stay, accommodation choice, and return-travel timing depend on your passport, treatment schedule, and recovery plan. We keep this guide current so patients can research with more confidence.",
      "tone": "info",
      "lastReviewed": "Reviewed March 2026 by the Care N Tour coordination team",
      "appliesTo": "Patients and companions planning medical travel to Egypt for consultations, procedures, and recovery stays",
      "planningScope": "General preparation guidance only. Final visa eligibility, supporting documents, and travel timing are confirmed case by case.",
      "disclaimer": "Do not finalize flights or recovery accommodation until your treatment timeline and entry route have been reviewed.",
      "items": [
        "Share your passport nationality, expected travel window, and companion details early so we can guide preparation accurately.",
        "Longer recovery journeys often require different accommodation, follow-up, and return-travel planning from short procedural trips.",
        "If official entry rules change, we update this guide and advise affected patients directly."
      ]
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "A travel planning model built for international patients",
      "description": "We combine medical coordination with practical travel preparation so patients can move from research to confirmed plans with less uncertainty.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Languages supported",
          "value": "15+",
          "helper": "Multilingual communication across preparation, arrival, and follow-up",
          "icon": "Languages"
        },
        {
          "label": "Coordination window",
          "value": "24/7",
          "helper": "Responsive communication across preparation, arrival, and follow-up",
          "icon": "Clock3"
        },
        {
          "label": "Journey coverage",
          "value": "End-to-End",
          "helper": "Treatment planning, local logistics, companion support, and recovery coordination",
          "icon": "Route"
        },
        {
          "label": "Stay planning",
          "value": "Short To Extended",
          "helper": "Accommodation and return-travel guidance shaped around the treatment pathway",
          "icon": "Plane"
        }
      ]
    },
    {
      "type": "tabbedGuide",
      "eyebrow": "Travel Guide",
      "badge": "Patient Preparation",
      "heading": "The information international patients usually need before traveling to Egypt",
      "description": "Each section answers a distinct planning question so the page stays easy to scan, easy to maintain in the CMS, and useful for search and AI discovery.",
      "tabs": [
        {
          "id": "entry-visa",
          "label": "Entry & Visa",
          "icon": "FileText",
          "heading": "Understand the likely entry route before you book flights.",
          "description": "Visa pathways differ by nationality and stay length, so patients should confirm the most practical route early.",
          "sections": [
            {
              "type": "dataGrid",
              "title": "Common planning routes",
              "description": "These routes help patients understand the usual preparation path before dates are finalized.",
              "layout": "stacked",
              "pillColumnKey": "route",
              "columns": [
                { "key": "route", "label": "Typical route" },
                { "key": "bestFor", "label": "Often used for" },
                { "key": "prepare", "label": "What to prepare" },
                { "key": "support", "label": "How we help" }
              ],
              "rows": [
                {
                  "title": "Patients eligible for e-visa pathways",
                  "values": {
                    "route": "E-visa",
                    "bestFor": "Short treatment journeys with clear travel timing",
                    "prepare": "Passport validity, digital copies, and expected stay details",
                    "support": "We help you understand the document set and when to prepare it."
                  }
                },
                {
                  "title": "Patients using airport-arrival visa routes",
                  "values": {
                    "route": "Visa on arrival",
                    "bestFor": "Short stays where nationality and itinerary allow it",
                    "prepare": "Passport, return travel details, and supporting documentation",
                    "support": "We confirm whether this route is realistic before tickets are issued."
                  }
                },
                {
                  "title": "Patients planning longer or multi-step stays",
                  "values": {
                    "route": "Case-dependent",
                    "bestFor": "Extended recovery, repeat visits, or multi-stage care",
                    "prepare": "Earlier planning around stay length, accommodation, and follow-up",
                    "support": "We align entry planning with recovery timing and return travel."
                  }
                }
              ]
            },
            {
              "type": "callout",
              "tone": "info",
              "title": "Confirm eligibility before you finalize travel.",
              "body": "Entry rules and supporting documents can change. We recommend confirming the route for your specific passport and treatment schedule before flights are booked.",
              "bullets": [
                "Keep a passport with sufficient validity.",
                "Have your treatment timeline and expected stay length ready.",
                "Share companion details early if someone is traveling with you."
              ]
            },
            {
              "type": "cta",
              "eyebrow": "Need case-specific guidance?",
              "title": "Send your passport country and expected travel window.",
              "description": "Our team can help you understand the most practical preparation route before you commit to flights.",
              "actions": [
                {
                  "label": "Start your journey",
                  "href": "/start-journey"
                },
                {
                  "label": "Contact our team",
                  "href": "/contact",
                  "variant": "outline"
                }
              ]
            }
          ]
        },
        {
          "id": "before-you-travel",
          "label": "Before You Travel",
          "icon": "ClipboardList",
          "heading": "Prepare documents, records, and practical trip details before departure.",
          "description": "Good preparation reduces last-minute changes and helps treatment planning stay aligned with travel.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 3,
              "cards": [
                {
                  "title": "Documents and records",
                  "icon": "FolderCheck",
                  "bullets": [
                    "Passport copy and travel identity documents",
                    "Medical reports, scans, prescriptions, and allergy notes",
                    "Contact details for the patient and any companion"
                  ]
                },
                {
                  "title": "Timing and scheduling",
                  "icon": "CalendarCheck",
                  "bullets": [
                    "Expected consultation and treatment dates",
                    "Likely recovery window before return travel",
                    "Any work, school, or companion timing constraints"
                  ]
                },
                {
                  "title": "Companion planning",
                  "icon": "Users",
                  "bullets": [
                    "Who is traveling with the patient",
                    "Preferred room arrangement or apartment setup",
                    "Support needed after treatment or on transfer days"
                  ]
                }
              ]
            },
            {
              "type": "compactList",
              "title": "Recommended preparation sequence",
              "description": "A simple order helps patients avoid booking issues later in the process.",
              "icon": "ListChecks",
              "rows": [
                {
                  "title": "Share your case and travel window",
                  "description": "Start with medical records, passport nationality, and the broad timing you are considering.",
                  "pill": "Step 1"
                },
                {
                  "title": "Confirm treatment timing",
                  "description": "Make sure the likely medical schedule is realistic before booking flights or recovery stays.",
                  "pill": "Step 2"
                },
                {
                  "title": "Prepare documents and accommodation preferences",
                  "description": "Clarify what the patient and companion need on the ground before travel is finalized.",
                  "pill": "Step 3"
                },
                {
                  "title": "Finalize arrival logistics",
                  "description": "Airport pickup, accommodation, and first appointment timing should be aligned together.",
                  "pill": "Step 4"
                }
              ]
            }
          ]
        },
        {
          "id": "stay-recovery",
          "label": "Stay & Recovery",
          "icon": "Hotel",
          "heading": "Choose accommodation and recovery timing around the medical plan.",
          "description": "The right stay format depends on the procedure, expected mobility, follow-up schedule, and whether a companion is traveling.",
          "sections": [
            {
              "type": "infoPanels",
              "title": "Recovery stay formats",
              "panels": [
                {
                  "title": "Recovery-oriented hotels",
                  "description": "Well suited to shorter stays and patients who want higher service levels.",
                  "items": [
                    "Easy coordination around transfers and appointment times",
                    "Daily housekeeping and concierge support",
                    "Useful when comfort and convenience matter more than extra space"
                  ]
                },
                {
                  "title": "Serviced apartments",
                  "description": "Often preferred for longer recovery journeys or companion travel.",
                  "items": [
                    "More living space and privacy",
                    "Suitable when meal preparation or laundry access matters",
                    "Helpful when the patient is expected to stay beyond a short post-procedure period"
                  ]
                },
                {
                  "title": "Companion and family stays",
                  "description": "Best when a patient needs a more shared or supportive setup.",
                  "items": [
                    "Room configuration can be planned around companion needs",
                    "Location should support both recovery and hospital access",
                    "Quiet environments matter more when recovery will be intensive"
                  ]
                }
              ]
            },
            {
              "type": "callout",
              "tone": "muted",
              "title": "Return-travel timing should follow medical readiness, not only ticket availability.",
              "body": "Patients often need a clearer view of discharge timing, follow-up visits, and mobility expectations before return travel is finalized."
            }
          ]
        },
        {
          "id": "arrival-local-mobility",
          "label": "Arrival & Local Mobility",
          "icon": "MapPinned",
          "heading": "Plan how you will move through arrival, treatment, and follow-up in Egypt.",
          "description": "Local movement should be aligned with the care schedule so patients can focus on treatment and recovery rather than logistics.",
          "sections": [
            {
              "type": "cardGrid",
              "columns": 3,
              "cards": [
                {
                  "title": "Airport arrival",
                  "icon": "PlaneLanding",
                  "bullets": [
                    "Pickup timing should match the confirmed arrival itinerary",
                    "Companion and luggage requirements should be known in advance",
                    "Late-night arrivals may affect first-day scheduling"
                  ]
                },
                {
                  "title": "In-city transfers",
                  "icon": "CarFront",
                  "bullets": [
                    "Travel time within Cairo can vary by district and time of day",
                    "Hotel, hospital, clinic, and pharmacy visits should be planned together",
                    "Mobility after treatment may change the transport setup required"
                  ]
                },
                {
                  "title": "Appointment-day coordination",
                  "icon": "Clock3",
                  "bullets": [
                    "Transfer timing should account for registration and waiting periods",
                    "Follow-up visits may require shorter but repeated journeys",
                    "Discharge and recovery-day movement should be organized conservatively"
                  ]
                }
              ]
            },
            {
              "type": "compactList",
              "title": "What our team aligns",
              "rows": [
                {
                  "title": "Arrival timing",
                  "description": "We coordinate arrival details with the first consultation or admission milestone."
                },
                {
                  "title": "Daily movement",
                  "description": "Hotel, clinic, hospital, and follow-up visits are planned around the confirmed schedule."
                },
                {
                  "title": "Departure readiness",
                  "description": "Return transfer planning should reflect discharge timing and the patient’s condition."
                }
              ]
            }
          ]
        },
        {
          "id": "payments-language",
          "label": "Payments, Language & Everyday Egypt",
          "icon": "Languages",
          "heading": "Know the practical basics for payments, communication, and day-to-day comfort.",
          "description": "Patients usually want the simple operational details that make the trip feel predictable.",
          "sections": [
            {
              "type": "infoPanels",
              "title": "Practical local information",
              "panels": [
                {
                  "title": "Payments and currency",
                  "items": [
                    "Egyptian Pound (EGP) is the local currency.",
                    "Card payments are common in many hospitals, hotels, and urban locations.",
                    "Some cash access is still useful for smaller day-to-day needs."
                  ]
                },
                {
                  "title": "Language and connectivity",
                  "items": [
                    "English is widely used in international patient environments.",
                    "Tourist SIM cards and mobile connectivity are usually easy to arrange after arrival.",
                    "Care N Tour supports multilingual coordination for patients and families from different markets."
                  ]
                },
                {
                  "title": "Climate and clothing",
                  "items": [
                    "Winter and spring are often the most comfortable seasons for recovery-focused travel.",
                    "Patients should pack around the treatment plan, mobility needs, and expected recovery stage.",
                    "Clinics, hospitals, and major hotels typically operate with strong indoor climate control."
                  ]
                },
                {
                  "title": "Daily comfort in Cairo",
                  "items": [
                    "Travel time can vary, so appointment days should stay lightly planned outside medical activity.",
                    "Companion support matters more when recovery is expected to be longer or more intensive.",
                    "A calm stay close to care is usually better than optimizing only for sightseeing or nightlife."
                  ]
                }
              ]
            },
            {
              "type": "callout",
              "tone": "info",
              "title": "Practical comfort improves medical readiness.",
              "body": "Clear communication, realistic daily schedules, and recovery-appropriate accommodation often make the trip feel safer and easier for both patients and companions."
            }
          ]
        }
      ]
    },
    {
      "type": "serviceCatalog",
      "eyebrow": "How Care N Tour Supports The Journey",
      "heading": "The travel support we coordinate around treatment",
      "description": "Our role is not limited to treatment access. We also help patients prepare documentation, structure the stay, and align local logistics around the medical schedule.",
      "items": [
        {
          "title": "Entry and documentation support",
          "description": "We help patients understand the likely entry route for their case and what supporting details should be prepared before dates are confirmed.",
          "icon": "FileText",
          "availability": "Before departure",
          "bullets": [
            "Guidance on common entry pathways and expected preparation steps",
            "Passport, medical-record, and travel-readiness checks",
            "Case-specific planning before flights are booked"
          ],
          "languages": ["English", "Arabic", "French", "German"],
          "note": "We frame guidance around the patient’s actual case, not generic assumptions.",
          "action": {
            "label": "Contact our team",
            "href": "/contact",
            "variant": "outline"
          }
        },
        {
          "title": "Accommodation and recovery planning",
          "description": "We shape the stay around the procedure, expected recovery timeline, mobility needs, and companion requirements.",
          "icon": "Hotel",
          "availability": "Before arrival through recovery",
          "bullets": [
            "Recovery-friendly hotel and apartment planning",
            "Accommodation matched to hospital access, comfort, and privacy",
            "Support for companion rooms, extended stays, and return-travel timing"
          ],
          "languages": ["English", "Arabic", "Spanish"],
          "note": "Recovery logistics are treated as part of the medical journey.",
          "action": {
            "label": "Plan your trip",
            "href": "/plan",
            "variant": "outline"
          }
        },
        {
          "title": "Airport, local transport, and appointment mobility",
          "description": "We coordinate practical movement through arrival, consultation, treatment, and follow-up so the patient journey stays synchronized.",
          "icon": "Car",
          "availability": "Arrival to departure",
          "bullets": [
            "Airport pickup and return-transfer planning",
            "Transport aligned with appointment times and recovery requirements",
            "On-ground coordination between hotel, hospital, clinic, and follow-up visits"
          ],
          "languages": ["English", "Arabic", "Italian"],
          "note": "The goal is to remove friction so the patient can focus on recovery.",
          "action": {
            "label": "Start your journey",
            "href": "/start-journey",
            "variant": "default"
          }
        },
        {
          "title": "Companion and continuity support",
          "description": "We help patients and families stay informed before arrival, during treatment, and as the return-home stage approaches.",
          "icon": "MessagesSquare",
          "availability": "Throughout the journey",
          "bullets": [
            "Companion planning and practical support around the patient stay",
            "Clear updates on travel, scheduling, and next operational steps",
            "Continuity planning for discharge, follow-up, and return travel"
          ],
          "languages": ["English", "Arabic", "German", "Portuguese"],
          "note": "This keeps the wider journey coherent when several stakeholders are involved.",
          "action": {
            "label": "View concierge services",
            "href": "/concierge",
            "variant": "outline"
          }
        }
      ]
    },
    {
      "type": "trustSignals",
      "eyebrow": "Operating Standard",
      "heading": "Why international patients use Care N Tour for travel preparation as well as treatment coordination",
      "description": "Patients and families need more than destination facts. They need a travel-planning model that is current, structured, and aligned with care delivery.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Case-specific guidance before booking",
          "description": "We help patients review the likely entry route, accommodation format, and travel timing before they commit to flights or recovery stays.",
          "icon": "FileCheck"
        },
        {
          "eyebrow": "02",
          "title": "Travel planning integrated with the care journey",
          "description": "Entry, accommodation, transfers, and return timing are shaped around the medical schedule rather than treated as separate topics.",
          "icon": "Route"
        },
        {
          "eyebrow": "03",
          "title": "Support for patients and companions",
          "description": "We coordinate practical details for the wider journey, including companion needs, comfort, and continuity through recovery.",
          "icon": "Users"
        },
        {
          "eyebrow": "04",
          "title": "Multilingual, internationally oriented communication",
          "description": "Our planning model is built for patients and families arriving from different markets, languages, and expectations.",
          "icon": "Languages"
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Travel Questions",
      "heading": "Questions international patients commonly ask before they travel to Egypt",
      "description": "Clear answers help patients compare options, understand preparation requirements, and plan treatment travel with greater confidence.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What travel information should I review before planning treatment in Egypt?",
          "answer": "Patients should review the likely entry route for their passport, expected length of stay, accommodation needs, local transport planning, companion requirements, and how recovery timing affects the return journey. Care N Tour helps connect those points to the treatment timeline."
        },
        {
          "question": "Does Care N Tour help with visa and travel preparation?",
          "answer": "Yes. We help patients understand the likely route for their case, the common documents to prepare, and how travel timing should align with consultations, procedures, and recovery."
        },
        {
          "question": "How long should I plan to stay in Egypt for treatment?",
          "answer": "Length of stay depends on the treatment pathway, follow-up requirements, mobility after treatment, and whether recovery should continue in Egypt before return travel. We help patients estimate a realistic stay before travel is finalized."
        },
        {
          "question": "Can Care N Tour arrange accommodation for recovery after treatment?",
          "answer": "Yes. We help coordinate recovery-friendly hotels, serviced apartments, and other stay options based on the procedure, recovery period, comfort expectations, and whether a companion is traveling."
        },
        {
          "question": "What kind of local transport support can Care N Tour coordinate?",
          "answer": "Support can include airport pickup, return-transfer planning, and local movement between hotel, hospital, clinic, and follow-up visits. The goal is to keep transport aligned with the medical schedule and the patient’s recovery needs."
        },
        {
          "question": "Can a family member or companion travel with me?",
          "answer": "Yes. Many patients travel with a companion or family member. We recommend planning companion documents, room setup, and local support early, especially if the recovery period is expected to be longer or more intensive."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Plan With Care N Tour",
      "heading": "Speak with our team before you confirm flights, accommodation, or treatment timing.",
      "description": "We help connect the medical pathway to the travel pathway so patients and families can commit with better clarity.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Start your journey",
          "href": "/start-journey",
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
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  seo = EXCLUDED.seo,
  content = EXCLUDED.content,
  updated_at = now();
