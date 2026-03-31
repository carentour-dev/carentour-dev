INSERT INTO public.cms_pages (slug, title, status, seo, settings, content)
VALUES (
    'medical-facilities',
    'Medical Facilities',
    'published',
    $${
    "title": "Accredited Hospitals and Medical Facilities in Egypt | Care N Tour",
    "description": "Browse accredited hospitals and medical facilities in Egypt through Care N Tour, with live specialties, procedures, international patient coordination, multilingual support, and recovery-focused planning."
  }$$::jsonb,
    '{}'::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Care N Tour Medical Facilities",
      "heading": "Explore accredited hospitals and medical facilities in Egypt with clearer coordination from the start.",
      "description": "Care N Tour helps international patients evaluate hospitals, specialty centers, and medical facilities in Egypt through a more structured planning experience that brings provider access, multilingual support, and travel coordination together.",
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
          "kicker": "Providers",
          "label": "Accredited hospitals, specialty centers, and trusted medical institutions"
        },
        {
          "kicker": "Planning",
          "label": "International patient coordination, multilingual communication, and clearer next-step guidance"
        },
        {
          "kicker": "Recovery",
          "label": "Travel logistics and post-treatment planning aligned around the medical journey"
        }
      ],
      "primaryAction": {
        "label": "Start Your Journey",
        "href": "/start-journey",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Contact Care N Tour",
        "href": "/contact",
        "variant": "hero"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Why This Directory Matters",
      "heading": "A facilities directory should help patients evaluate fit, credibility, and operational readiness, not just scroll through names.",
      "lead": "Care N Tour brings editorial context around the live provider data so international patients can move from search to serious planning with more clarity.",
      "paragraphs": [
        "We organize live facility profiles around the questions international patients actually ask: where the facility is located, which specialties and procedures it supports, what the operational infrastructure looks like, and how Care N Tour can coordinate the wider treatment journey.",
        "That means patients can review medical facilities in Egypt with a clearer understanding of accreditation context, multilingual support, institutional capabilities, and the planning pathway that follows once they are ready to move forward."
      ],
      "strengthsTitle": "What this page is designed to clarify early",
      "strengths": [
        {
          "title": "Accredited and institutionally credible options",
          "description": "Review hospitals and medical facilities with live specialties, procedures, and operational detail."
        },
        {
          "title": "Searchable clinical fit",
          "description": "Filter by city, specialty, and procedure to narrow the directory to the facilities most relevant to the case."
        },
        {
          "title": "Better planning continuity",
          "description": "Move from facility discovery to coordinated next steps without losing the broader travel and recovery context."
        }
      ]
    },
    {
      "type": "medicalFacilitiesDirectory",
      "eyebrow": "Live Directory",
      "heading": "Search accredited hospitals and medical facilities across Egypt",
      "description": "Use the live directory below to compare institutions, specialties, procedures, and location context while keeping the wider Care N Tour planning experience in view."
    },
    {
      "type": "faq",
      "eyebrow": "Medical Facilities FAQ",
      "heading": "Questions international patients ask before choosing a facility in Egypt",
      "description": "These answers explain how Care N Tour helps evaluate hospitals and medical facilities before treatment planning moves forward.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "How does Care N Tour help me choose between hospitals and medical facilities in Egypt?",
          "answer": "We help patients compare accredited hospitals, specialty centers, and medical facilities based on clinical fit, procedure availability, logistics, and the level of international patient coordination required for the case."
        },
        {
          "question": "Can I search for facilities by specialty or procedure before speaking with a coordinator?",
          "answer": "Yes. The live directory lets you search by location, specialty, and procedure so you can review the most relevant institutions before discussing the case with Care N Tour."
        },
        {
          "question": "Does Care N Tour also support travel and recovery planning after I shortlist a facility?",
          "answer": "Yes. Once the right medical facility is identified, we can coordinate treatment planning, travel logistics, multilingual communication, accommodation, and recovery-focused support around the live provider relationship."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Need Help Evaluating Options?",
      "heading": "Let Care N Tour help you compare facilities, procedures, and the planning path around your case.",
      "description": "Share your treatment goal and timeline, and we will help structure the next step with the right hospital or medical facility in Egypt.",
      "layout": "split",
      "background": "dark",
      "style": {
        "layout": {
          "padding": {
            "top": {
              "base": "lg"
            },
            "bottom": {
              "base": "lg"
            }
          }
        },
        "background": {
          "variant": "solid",
          "color": {
            "base": "hsl(var(--editorial-ink))"
          },
          "overlayOpacity": {
            "base": 0
          }
        }
      },
      "actions": [
        {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "default"
        },
        {
          "label": "Contact Care N Tour",
          "href": "/contact",
          "variant": "outline"
        }
      ]
    }
  ]$$::jsonb
),
(
    'medical-facilities-detail-template',
    'Medical Facility Detail Shell',
    'published',
    $${
    "title": "Medical Facility Profile | Care N Tour",
    "description": "Facility profile shell used by Care N Tour to present live provider details with international patient support context."
  }$$::jsonb,
    '{}'::jsonb,
    $$[
    {
      "type": "medicalFacilityProfile",
      "eyebrow": "Care N Tour Medical Facility Profile",
      "trustStatement": "Care N Tour coordinates provider review, multilingual communication, travel planning, and recovery support around the live medical facility profile shown below.",
      "sectionDescriptions": {
        "overview": "Review the provider profile, planning context, and facility capabilities before speaking with Care N Tour about next steps.",
        "procedures": "Procedures listed here come directly from the live provider record currently available through Care N Tour.",
        "contact": "Use the live contact and location details below as a reference point, then speak with Care N Tour for coordinated next-step planning."
      }
    },
    {
      "type": "callToAction",
      "eyebrow": "Need Case-Specific Guidance?",
      "heading": "Care N Tour can help you evaluate this facility in the context of your treatment, travel, and recovery requirements.",
      "description": "Share your case and our team will help you understand the most practical next step, whether that means provider review, procedure matching, or broader treatment planning.",
      "layout": "split",
      "background": "dark",
      "style": {
        "layout": {
          "padding": {
            "top": {
              "base": "lg"
            },
            "bottom": {
              "base": "lg"
            }
          }
        },
        "background": {
          "variant": "solid",
          "color": {
            "base": "hsl(var(--editorial-ink))"
          },
          "overlayOpacity": {
            "base": 0
          }
        }
      },
      "actions": [
        {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "default"
        },
        {
          "label": "Contact Care N Tour",
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
        settings = excluded.settings,
        content = excluded.content,
        updated_at = now();
