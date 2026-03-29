UPDATE public.cms_pages
SET
    content = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                content,
                                '{3}',
                                $${
                "type": "dataGrid",
                "eyebrow": "Entry Planning",
                "heading": "Common travel pathways before patients confirm dates",
                "description": "Requirements vary by passport and treatment plan, but these routes help patients understand the usual preparation paths early.",
                "layout": "stacked",
                "pillColumnKey": "entryRoute",
                "columns": [
                  { "key": "entryRoute", "label": "Typical entry route" },
                  { "key": "standardStay", "label": "Typical stay" },
                  { "key": "careNTourGuidance", "label": "How we help" }
                ],
                "rows": [
                  {
                    "title": "Patients eligible for e-visa pathways",
                    "values": {
                      "entryRoute": "E-visa",
                      "standardStay": "Short treatment journeys",
                      "careNTourGuidance": "We explain the usual documents and the best time to prepare them."
                    }
                  },
                  {
                    "title": "Patients using airport-arrival visa routes",
                    "values": {
                      "entryRoute": "Visa on arrival",
                      "standardStay": "Short stays with clear return timing",
                      "careNTourGuidance": "We help confirm whether this route is realistic before flights are booked."
                    }
                  },
                  {
                    "title": "Patients planning longer or multi-step medical stays",
                    "values": {
                      "entryRoute": "Case-dependent",
                      "standardStay": "Extended recovery or follow-up periods",
                      "careNTourGuidance": "We align travel timing with recovery, follow-up, and return planning."
                    }
                  },
                  {
                    "title": "Patients traveling with companions or family members",
                    "values": {
                      "entryRoute": "Parallel planning",
                      "standardStay": "Patient + companion travel",
                      "careNTourGuidance": "We coordinate patient and companion planning together from the start."
                    }
                  }
                ]
              }$$::jsonb,
                                false
                            ),
                            '{4}',
                            $${
              "type": "serviceCatalog",
              "eyebrow": "Travel Support Scope",
              "heading": "The travel support Care N Tour coordinates around treatment",
              "description": "We help patients prepare, arrive, and recover through one coordinated service model.",
              "items": [
                {
                  "title": "Entry and document preparation",
                  "description": "We help patients understand the likely travel route for their case before dates are confirmed.",
                  "icon": "FileText",
                  "availability": "Before departure",
                  "bullets": [
                    "Guidance on common visa and entry routes",
                    "Passport, records, and travel-readiness checks"
                  ],
                  "note": "We frame guidance around the patient’s actual case, not generic assumptions.",
                  "action": {
                    "label": "Contact our team",
                    "href": "/contact",
                    "variant": "outline"
                  }
                },
                {
                  "title": "Accommodation and recovery planning",
                  "description": "We shape the stay around the procedure, recovery timeline, and companion needs.",
                  "icon": "Hotel",
                  "availability": "Before arrival through recovery",
                  "bullets": [
                    "Recovery-friendly hotel and apartment planning",
                    "Accommodation matched to hospital access and comfort"
                  ],
                  "note": "Recovery logistics are treated as part of the medical journey.",
                  "action": {
                    "label": "Plan your trip",
                    "href": "/plan",
                    "variant": "outline"
                  }
                },
                {
                  "title": "Airport, local transport, and appointment mobility",
                  "description": "We coordinate practical movement through arrival, treatment, and follow-up.",
                  "icon": "Car",
                  "availability": "Arrival to departure",
                  "bullets": [
                    "Airport pickup and return-transfer planning",
                    "Transport aligned with appointments and recovery timing"
                  ],
                  "note": "The goal is to remove friction so the patient can focus on recovery.",
                  "action": {
                    "label": "Start your journey",
                    "href": "/start-journey",
                    "variant": "default"
                  }
                }
              ]
            }$$::jsonb,
                            false
                        ),
                        '{5}',
                        $${
            "type": "hotelShowcase",
            "eyebrow": "Accommodation",
            "heading": "Representative stay types we coordinate around treatment and recovery",
            "description": "We present stay options by suitability, comfort, and operational fit.",
            "layout": "grid",
            "items": [
              {
                "title": "Premium recovery hotels",
                "description": "Higher-service stays for patients who want comfort and easier appointment coordination.",
                "amenities": [
                  "Concierge coordination",
                  "Recovery-friendly room types",
                  "Daily housekeeping"
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
                "description": "Ideal for longer recovery timelines and patients who need more privacy.",
                "amenities": [
                  "Kitchen facilities",
                  "Laundry access",
                  "Living space for companions"
                ],
                "priceLabel": "Mid to premium range",
                "locationLabel": "Maadi, Zamalek, New Cairo",
                "icon": "Building"
              },
              {
                "title": "Concierge-selected family stays",
                "description": "Suitable when a patient is traveling with family members and needs smoother daily coordination.",
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
          }$$::jsonb,
                        false
                    ),
                    '{6}',
                    $${
          "type": "infoPanels",
          "eyebrow": "Egypt Basics",
          "heading": "Practical information patients and companions commonly ask us about",
          "description": "High-intent travel basics presented in a clear, easy-to-scan format.",
          "panels": [
            {
              "title": "Climate and seasons",
              "items": [
                "Winter and spring are often the most comfortable seasons for recovery-focused travel.",
                "Patients should pack around their treatment plan, mobility needs, and recovery stage."
              ]
            },
            {
              "title": "Payments and currency",
              "items": [
                "Egyptian Pound (EGP) is the local currency.",
                "Card payments are common, but some cash access is still useful."
              ]
            },
            {
              "title": "Connectivity and communication",
              "items": [
                "English is widely used in international patient settings.",
                "Tourist SIM cards are easy to arrange after arrival."
              ]
            },
            {
              "title": "Daily comfort and local planning",
              "items": [
                "Travel time within Cairo can vary, so appointments and transfers should be coordinated carefully.",
                "Companion planning matters early for longer recovery journeys."
              ]
            }
          ]
        }$$::jsonb,
                    false
                ),
                '{7}',
                $${
        "type": "trustSignals",
        "eyebrow": "Why This Page Matters",
        "heading": "We use Travel Information to reduce uncertainty, not to add generic destination copy.",
        "description": "This page should reinforce how Care N Tour operates as an international patient brand.",
        "items": [
          {
            "eyebrow": "01",
            "title": "Practical preparation, not vague tourism language",
            "description": "We focus on the information patients need before treatment dates and flights are confirmed.",
            "icon": "ClipboardList"
          },
          {
            "eyebrow": "02",
            "title": "Travel planning integrated with the care journey",
            "description": "Entry, accommodation, and transfers are framed around the medical plan.",
            "icon": "Route"
          },
          {
            "eyebrow": "03",
            "title": "Content structured for global trust",
            "description": "The page is written to feel useful for patients, search engines, and AI systems.",
            "icon": "Globe"
          }
        ]
      }$$::jsonb,
                false
            ),
            '{8}',
            $${
      "type": "faq",
      "eyebrow": "Travel Questions",
      "heading": "Questions international patients commonly ask before they travel to Egypt",
      "description": "Short answers to the planning questions patients usually ask first.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What travel information should I review before planning treatment in Egypt?",
          "answer": "Patients should review entry pathways, passport readiness, accommodation needs, local transport planning, and how recovery timing affects the trip. Care N Tour helps connect those points to the treatment timeline."
        },
        {
          "question": "Does Care N Tour help with visa and travel preparation?",
          "answer": "Yes. We help patients understand the likely route for their case, the usual documents to prepare, and how travel timing should align with treatment and recovery."
        },
        {
          "question": "Can Care N Tour arrange accommodation for recovery after treatment?",
          "answer": "Yes. We help coordinate recovery-friendly hotels, serviced apartments, and other stay options based on the procedure, recovery period, and whether a companion is traveling."
        },
        {
          "question": "What kind of local transport support can Care N Tour coordinate?",
          "answer": "Support can include airport pickup, return transfers, and local movement between hotel, hospital, and clinic. The goal is to keep transport aligned with the medical schedule."
        }
      ]
    }$$::jsonb,
            false
        ),
        '{9}',
        $${
    "type": "callToAction",
    "eyebrow": "Plan With Care N Tour",
    "heading": "Talk to our team before you finalize flights or accommodation.",
    "description": "We help connect the medical pathway to the travel pathway before you commit.",
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
  }$$::jsonb,
        false
    )
WHERE slug = 'travel-info';
