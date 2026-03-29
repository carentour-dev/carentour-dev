INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
  'travel-info',
  'Travel Information',
  'published',
  $${
    "title": "Travel Information for Medical Travel to Egypt | Care N Tour",
    "description": "Explore visa guidance, recovery accommodation, local travel planning, and practical Egypt information for international patients traveling with Care N Tour."
  }$$::jsonb,
  $$[
    {
      "type": "aboutHero",
      "eyebrow": "Travel Information",
      "heading": "Plan medical travel to Egypt with the practical clarity international patients and families expect.",
      "description": "At Care N Tour, we help patients and families understand entry planning, recovery accommodation, local mobility, payments, and everyday preparation before they travel for treatment in Egypt.",
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
          "label": "Clear guidance on common visa pathways, passports, and travel preparation"
        },
        {
          "kicker": "Stay",
          "label": "Recovery-ready accommodation planning shaped around comfort, timing, and proximity to care"
        },
        {
          "kicker": "Support",
          "label": "One coordination team for patient, companion, and on-ground logistics"
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
      "eyebrow": "How We Prepare Patients",
      "heading": "We do not treat travel information as generic tourism copy. We treat it as part of preparing a patient journey properly.",
      "lead": "International patients need more than destination highlights. They need practical clarity on entry, accommodation, mobility, payments, and local expectations before treatment dates are confirmed.",
      "paragraphs": [
        "At Care N Tour, we use the Travel Information page to help patients and families prepare for the realities of treatment abroad with greater confidence and less uncertainty.",
        "That means explaining the practical side of the journey in the same structured way a multinational healthcare company would: what to prepare, what to expect, and where our team supports the patient directly.",
        "When this page is written and maintained well, it strengthens user trust, improves search performance, and makes Care N Tour easier for AI systems to understand as a credible international patient platform."
      ],
      "strengthsTitle": "What this page should communicate immediately",
      "strengths": [
        {
          "title": "What patients typically need before departure",
          "description": "Entry planning, common documentation needs, accommodation considerations, and practical local preparation should be easy to scan."
        },
        {
          "title": "How Care N Tour supports the journey beyond treatment booking",
          "description": "We should make it clear that accommodation, transfers, companion needs, and local coordination are handled as part of one managed service experience."
        },
        {
          "title": "What the next step is if a patient is still planning",
          "description": "The page should move naturally from information to action, whether the visitor wants to contact us, start their journey, or continue planning."
        }
      ],
      "closing": "That is the standard we should represent when we speak directly to international patients and their families."
    },
    {
      "type": "statGrid",
      "eyebrow": "At A Glance",
      "heading": "Travel planning should feel structured, responsive, and internationally oriented",
      "description": "We position this page to answer common preparation questions before they become blockers in a treatment decision.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Languages supported",
          "value": "15+",
          "helper": "Multilingual communication across planning, arrival, and follow-up",
          "icon": "Languages"
        },
        {
          "label": "Coordination style",
          "value": "One Team",
          "helper": "Medical planning, travel logistics, and patient support handled together",
          "icon": "Route"
        },
        {
          "label": "Support window",
          "value": "24/7",
          "helper": "Fast responses around arrivals, scheduling changes, and urgent questions",
          "icon": "Clock3"
        },
        {
          "label": "Journey coverage",
          "value": "End-to-End",
          "helper": "From pre-travel preparation to local coordination and recovery support",
          "icon": "Plane"
        }
      ]
    },
    {
      "type": "dataGrid",
      "eyebrow": "Entry Planning",
      "heading": "Common travel pathways patients ask us about before they confirm dates",
      "description": "Requirements vary by nationality, trip length, and treatment plan, so this matrix is designed to orient patients early and help them know what to prepare next.",
      "layout": "stacked",
      "pillColumnKey": "entryRoute",
      "columns": [
        {
          "key": "entryRoute",
          "label": "Typical entry route"
        },
        {
          "key": "standardStay",
          "label": "Typical stay"
        },
        {
          "key": "planningNote",
          "label": "Planning note"
        },
        {
          "key": "careNTourGuidance",
          "label": "How we help"
        }
      ],
      "rows": [
        {
          "title": "Patients eligible for e-visa pathways",
          "values": {
            "entryRoute": "E-visa",
            "standardStay": "Short treatment journeys",
            "planningNote": "Usually the smoothest route when available for the passport and trip purpose.",
            "careNTourGuidance": "We explain the common document set, expected preparation steps, and how this affects travel timing."
          }
        },
        {
          "title": "Patients using airport-arrival visa routes",
          "values": {
            "entryRoute": "Visa on arrival",
            "standardStay": "Short stays with clear return timing",
            "planningNote": "Useful in some cases, but patients should still confirm eligibility and carry the right supporting documents.",
            "careNTourGuidance": "We help patients understand whether this route is usually practical for their case before flights are finalized."
          }
        },
        {
          "title": "Patients planning longer or multi-step medical stays",
          "values": {
            "entryRoute": "Case-dependent",
            "standardStay": "Extended recovery or follow-up periods",
            "planningNote": "Longer treatment journeys often need earlier planning around entry, recovery length, and return travel.",
            "careNTourGuidance": "We align the treatment timeline with accommodation, follow-up needs, and the most realistic travel window."
          }
        },
        {
          "title": "Patients traveling with companions or family members",
          "values": {
            "entryRoute": "Parallel planning",
            "standardStay": "Patient + companion travel",
            "planningNote": "Companion documentation, arrival timing, and room setup should be considered before booking.",
            "careNTourGuidance": "We coordinate patient and companion planning together so the wider journey stays synchronized."
          }
        }
      ]
    },
    {
      "type": "serviceCatalog",
      "eyebrow": "Travel Support Scope",
      "heading": "The travel and local support services we coordinate around the medical journey",
      "description": "This page should make clear that Care N Tour is not simply pointing patients to Egypt. We are helping them plan, arrive, and recover with a coordinated service model.",
      "items": [
        {
          "title": "Entry and document preparation",
          "description": "We help patients understand the common travel pathway for their case and what documentation is usually needed before dates are confirmed.",
          "icon": "FileText",
          "availability": "Before departure",
          "bullets": [
            "Guidance on common visa and entry planning routes",
            "Passport and travel-readiness checks before scheduling milestones",
            "Preparation of medical records and supporting travel information"
          ],
          "languages": ["English", "Arabic", "French", "German"],
          "note": "Requirements can vary, so we frame guidance around the patient’s actual case rather than generic assumptions.",
          "action": {
            "label": "Contact our team",
            "href": "/contact",
            "variant": "outline"
          }
        },
        {
          "title": "Accommodation and recovery planning",
          "description": "We help shape the stay around the procedure, expected recovery timeline, mobility needs, and companion requirements.",
          "icon": "Hotel",
          "availability": "Before arrival through recovery",
          "bullets": [
            "Recovery-friendly hotel and apartment planning",
            "Accommodation choices aligned with hospital proximity and comfort",
            "Support for companion rooms, longer stays, and practical recovery needs"
          ],
          "languages": ["English", "Arabic", "Spanish"],
          "note": "Recovery logistics are treated as part of the medical journey, not as a separate afterthought.",
          "action": {
            "label": "Plan your trip",
            "href": "/plan",
            "variant": "outline"
          }
        },
        {
          "title": "Airport, local transport, and appointment mobility",
          "description": "We coordinate the patient’s practical movement through arrival, consultation, treatment, and follow-up.",
          "icon": "Car",
          "availability": "Arrival to departure",
          "bullets": [
            "Airport pickup and return-transfer planning",
            "Movement between hotel, hospital, clinic, and pharmacy as needed",
            "Scheduling support that keeps transport aligned with medical timing"
          ],
          "languages": ["English", "Arabic", "Italian"],
          "note": "The goal is to remove friction on the ground so the patient can focus on treatment and recovery.",
          "action": {
            "label": "Start your journey",
            "href": "/start-journey",
            "variant": "default"
          }
        }
      ]
    },
    {
      "type": "hotelShowcase",
      "eyebrow": "Accommodation",
      "heading": "Representative stay types we can coordinate around treatment and recovery",
      "description": "We present accommodation options in the same clear, structured way a multinational patient-services company would: by suitability, comfort, and operational fit, not only by price.",
      "layout": "grid",
      "items": [
        {
          "title": "Premium recovery hotels",
          "description": "Higher-service stays suited to patients who want concierge support, comfort, and easy coordination around appointments.",
          "amenities": [
            "Concierge coordination",
            "Recovery-friendly room types",
            "Daily housekeeping",
            "Flexible meal support"
          ],
          "medicalServices": [
            "Wheelchair-friendly arrangements",
            "Transport coordination"
          ],
          "priceLabel": "Premium range",
          "locationLabel": "Central Cairo and New Cairo",
          "icon": "Hotel"
        },
        {
          "title": "Serviced apartments for extended stays",
          "description": "Ideal for longer recovery timelines, companion travel, and patients who need more privacy or residential comfort.",
          "amenities": [
            "Kitchen facilities",
            "Laundry access",
            "Living space for companions",
            "Flexible stay duration"
          ],
          "priceLabel": "Mid to premium range",
          "locationLabel": "Maadi, Zamalek, New Cairo",
          "icon": "Building"
        },
        {
          "title": "Concierge-selected family stays",
          "description": "Suitable when a patient is traveling with family members and needs practical comfort, proximity, and smoother daily coordination.",
          "amenities": [
            "Family room options",
            "Quiet residential environments",
            "Recovery-conscious logistics"
          ],
          "medicalServices": [
            "Companion planning",
            "Airport transfer support"
          ],
          "priceLabel": "Case-dependent",
          "locationLabel": "Selected to match provider and recovery needs",
          "icon": "Users"
        }
      ]
    },
    {
      "type": "infoPanels",
      "eyebrow": "Egypt Basics",
      "heading": "Practical information patients and companions commonly ask us about",
      "description": "These panels are designed to surface high-intent travel information in a format that is easy to scan, easy to maintain in the CMS, and useful for search and AI systems.",
      "panels": [
        {
          "title": "Climate and seasons",
          "items": [
            "Winter and spring are often the most comfortable seasons for recovery-focused travel.",
            "Summer is hotter, but medical facilities, hotels, and transport typically operate with strong air conditioning.",
            "Patients should always pack around their treatment plan, mobility needs, and expected recovery environment."
          ]
        },
        {
          "title": "Payments and currency",
          "items": [
            "Egyptian Pound (EGP) is the local currency.",
            "Card payments are common in major urban areas, hospitals, and many hotels.",
            "Patients should still plan for some cash access during local travel and day-to-day needs."
          ]
        },
        {
          "title": "Connectivity and communication",
          "items": [
            "English is widely used in international patient settings and private healthcare environments.",
            "Tourist SIM cards and mobile connectivity are easy to arrange after arrival.",
            "Our multilingual coordination model helps reduce communication friction before and during the stay."
          ]
        },
        {
          "title": "Daily comfort and local planning",
          "items": [
            "Patients should plan clothing, mobility support, and activity level around the procedure and recovery stage.",
            "Travel time within Cairo can vary, so appointments and transfers should be coordinated carefully.",
            "Companion planning matters early when the recovery journey is expected to be longer or more intensive."
          ]
        }
      ]
    },
    {
      "type": "trustSignals",
      "eyebrow": "Why This Page Matters",
      "heading": "We use Travel Information to reduce uncertainty, not to decorate the site with generic destination content.",
      "description": "The page should reinforce how Care N Tour thinks and operates as a serious international patient brand.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Practical preparation, not vague tourism language",
          "description": "We focus on the information patients actually need before treatment dates, flights, and accommodation are confirmed.",
          "icon": "ClipboardList"
        },
        {
          "eyebrow": "02",
          "title": "Travel planning integrated with the care journey",
          "description": "Entry, accommodation, transfers, and companion logistics are framed around the medical plan rather than presented as separate topics.",
          "icon": "Route"
        },
        {
          "eyebrow": "03",
          "title": "Content structured for global trust",
          "description": "The page is written to feel useful for patients, families, search engines, and AI systems evaluating credibility.",
          "icon": "Globe"
        },
        {
          "eyebrow": "04",
          "title": "Editable through the CMS as travel conditions evolve",
          "description": "Operational teams should be able to update guidance quickly without returning to hardcoded page logic.",
          "icon": "RefreshCcw"
        }
      ]
    },
    {
      "type": "faq",
      "eyebrow": "Travel Questions",
      "heading": "Questions international patients commonly ask before they travel to Egypt",
      "description": "These answers are written to support high-intent search behavior and help AI systems understand the practical scope of the Care N Tour service model.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What travel information should I review before planning treatment in Egypt?",
          "answer": "Patients should review common entry pathways, passport readiness, likely accommodation needs, local transport planning, payment expectations, and how recovery timing affects the overall trip. Care N Tour helps connect those practical points to the treatment timeline rather than leaving patients to plan them separately."
        },
        {
          "question": "Does Care N Tour help with visa and travel preparation?",
          "answer": "Yes. We help patients understand the common planning route for their case, the documents they are usually expected to prepare, and how travel timing should align with consultation, treatment, and recovery needs."
        },
        {
          "question": "Can Care N Tour arrange accommodation for recovery after treatment?",
          "answer": "Yes. We help coordinate recovery-friendly hotels, serviced apartments, and other stay options based on the procedure, expected recovery period, mobility needs, and whether a companion is traveling with the patient."
        },
        {
          "question": "What kind of local transport support can Care N Tour coordinate?",
          "answer": "Support can include airport pickup, return-transfer planning, and local movement between hotel, hospital, clinic, and other relevant stops. The goal is to keep transport aligned with the medical schedule and reduce unnecessary friction during the stay."
        },
        {
          "question": "Is this page only for patients who have already booked treatment?",
          "answer": "No. This page is designed for patients and families who are still evaluating treatment abroad and want a clearer understanding of the practical journey before they make a commitment."
        },
        {
          "question": "What should I do next if I am still comparing options?",
          "answer": "The best next step is to contact the Care N Tour team or start your journey through the guided intake. We can review your case, explain the likely travel pathway, and help you understand what a well-coordinated medical trip to Egypt should look like."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Plan With Care N Tour",
      "heading": "Talk to our team before you finalize flights, accommodation, or treatment timing.",
      "description": "If you are still planning, we can help you connect the medical pathway to the travel pathway so the journey feels clear before you commit.",
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
