INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'contact',
    'Contact Us',
    'published',
    $${
    "title": "Contact Care N Tour | International Patient, Partner & Corporate Enquiries",
    "description": "Contact Care N Tour for treatment planning, international patient support, referral coordination, and corporate or partner enquiries related to medical travel in Egypt."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "Contact Care N Tour",
      "heading": "One point of contact for international patients, families, referral partners, and corporate enquiries.",
      "description": "We coordinate medical travel planning, patient communication, referral support, and partner conversations through one Egypt-based team built for cross-border care journeys.",
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
          "kicker": "Patients",
          "label": "We respond to treatment planning, travel coordination, and case guidance enquiries."
        },
        {
          "kicker": "Partners",
          "label": "We handle referral, corporate, and institutional conversations through the same coordinated team."
        },
        {
          "kicker": "Coverage",
          "label": "We support international communication with a direct, multilingual, Egypt-based operating model."
        }
      ],
      "primaryAction": {
        "label": "Send An Enquiry",
        "href": "#contact-form",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Start Your Journey",
        "href": "/start-journey",
        "variant": "hero"
      }
    },
    {
      "type": "statGrid",
      "eyebrow": "Global Contact Model",
      "heading": "A communications layer built for international coordination",
      "description": "Care N Tour manages contact across treatment planning, travel logistics, and institutional conversations through one connected response model.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Support window",
          "value": "24/7",
          "helper": "Urgent coordination and patient support coverage",
          "icon": "Clock"
        },
        {
          "label": "Communication style",
          "value": "Multilingual",
          "helper": "Built for international patients and cross-border enquiries",
          "icon": "Globe"
        },
        {
          "label": "Request types",
          "value": "Patient & Partner",
          "helper": "Clinical, travel, referral, and corporate coordination",
          "icon": "BriefcaseBusiness"
        },
        {
          "label": "Operating base",
          "value": "Egypt-Based",
          "helper": "Direct coordination close to providers and recovery logistics",
          "icon": "Building2"
        }
      ]
    },
    {
      "type": "serviceCatalog",
      "eyebrow": "Who This Page Supports",
      "heading": "We route each enquiry to the right Care N Tour team from the first message.",
      "description": "The Contact Us page is designed for more than general marketing enquiries. We use it as the front door for patient planning, referral coordination, and institutional communication.",
      "items": [
        {
          "title": "Patients & Families",
          "description": "Use this page when you need treatment planning guidance, travel coordination support, or clarity on the next step for a medical journey to Egypt.",
          "icon": "HeartHandshake",
          "availability": "Treatment & travel enquiries",
          "bullets": [
            "Treatment planning and case guidance",
            "Travel timing, accommodation, and arrival questions",
            "Follow-up communication and support requests"
          ],
          "languages": [
            "English",
            "Arabic"
          ]
        },
        {
          "title": "Referring Physicians",
          "description": "We work with physicians and medical coordinators who need a direct route for patient referrals, records exchange, and treatment pathway alignment.",
          "icon": "Stethoscope",
          "availability": "Referral coordination",
          "bullets": [
            "Case discussion and referral handoff",
            "Medical record coordination",
            "Cross-border communication support"
          ],
          "languages": [
            "English",
            "Arabic"
          ]
        },
        {
          "title": "Corporate & Insurance Stakeholders",
          "description": "We respond to institutional conversations related to care coordination, patient access models, and multinational support requirements.",
          "icon": "Building2",
          "availability": "Institutional enquiries",
          "bullets": [
            "Corporate healthcare enquiries",
            "Insurance and case coordination discussions",
            "Cross-border patient support workflows"
          ],
          "languages": [
            "English",
            "Arabic"
          ]
        },
        {
          "title": "Service & Destination Partners",
          "description": "We also support operational conversations with accommodation, transport, and destination partners involved in the wider patient journey.",
          "icon": "Plane",
          "availability": "Operational partnerships",
          "bullets": [
            "Accommodation and transfer coordination",
            "Destination operations alignment",
            "Partner communication and service planning"
          ],
          "languages": [
            "English",
            "Arabic"
          ]
        }
      ]
    },
    {
      "type": "contactFormEmbed",
      "advanced": {
        "anchorId": "contact-form"
      },
      "eyebrow": "Send A Direct Enquiry",
      "heading": "Tell us what you need and we will route your message to the right Care N Tour team.",
      "description": "We review every message in the context of treatment planning, travel coordination, referral support, or institutional communication so visitors do not need to navigate multiple departments alone.",
      "channelsHeading": "Contact Channels",
      "channelsDescription": "Use the form for detailed enquiries, or reach us directly through the channels below when you already know the team you need.",
      "channels": [
        {
          "icon": "Phone",
          "title": "International Patient Desk",
          "content": "+20 122 9503333",
          "description": "Treatment planning, urgent coordination, and direct support for patients and families.",
          "href": "tel:+201229503333",
          "schemaContactType": "customer support"
        },
        {
          "icon": "Mail",
          "title": "General Enquiries",
          "content": "info@carentour.com",
          "description": "Patient, referral, and institutional enquiries handled by the Care N Tour coordination team.",
          "href": "mailto:info@carentour.com",
          "schemaContactType": "customer support"
        },
        {
          "icon": "Building2",
          "title": "Head Office",
          "content": "Office 23, Building D, Agora Mall, New Cairo, Egypt",
          "description": "Scheduled meetings and in-person visits can be coordinated through the main office."
        }
      ],
      "supportHeading": "How We Handle Incoming Enquiries",
      "supportDescription": "Our contact experience is designed to feel structured, accountable, and internationally legible from the first interaction.",
      "supportItems": [
        "We review each enquiry against its real context, from patient care planning to partner coordination.",
        "We keep communication centralized so the next step is clear even when multiple teams are involved.",
        "We respond with practical guidance, not generic acknowledgements, so visitors know what happens next."
      ],
      "formTitle": "Send A Message",
      "formDescription": "Share your treatment question, travel concern, referral request, or corporate enquiry and we will respond with the appropriate next step.",
      "labels": {
        "firstName": "First Name",
        "lastName": "Last Name",
        "email": "Email Address",
        "phone": "Phone Number",
        "country": "Country",
        "treatment": "Treatment Or Enquiry Type",
        "message": "Message"
      },
      "placeholders": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1 555 123 4567",
        "country": "United States",
        "treatment": "Cardiac surgery, referral partnership, corporate enquiry…",
        "message": "Tell us about your enquiry, timeline, and the support you need…"
      },
      "submitLabel": "Send Message",
      "submittingLabel": "Sending…",
      "responseTimeLabel": "Typical response window: within 2 hours",
      "privacyNote": "By submitting this form, you allow Care N Tour to review your enquiry and contact you with the next practical step.",
      "successTitle": "Message Sent",
      "successDescription": "We have received your enquiry and our team will respond shortly.",
      "errorTitle": "Unable To Send Message",
      "errorDescription": "Please try again or use one of the listed contact channels."
    },
    {
      "type": "faq",
      "eyebrow": "Contact FAQ",
      "heading": "Questions we answer before or after the first message",
      "description": "We explain how communication, response timing, referral handling, and patient support work so visitors know what to expect when they contact Care N Tour.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "Who should use the Contact Us page?",
          "answer": "Patients, families, referral physicians, corporate stakeholders, and operational partners can all use this page. We review the enquiry and route it to the right Care N Tour team without asking you to start over."
        },
        {
          "question": "How quickly does Care N Tour respond?",
          "answer": "We aim to respond within a short coordination window for most enquiries, and urgent patient-related issues are prioritized immediately when the situation requires it."
        },
        {
          "question": "Can I contact Care N Tour before I have full medical records?",
          "answer": "Yes. You can contact us early for guidance on what information is needed, what the likely planning path looks like, and what the next practical step should be."
        },
        {
          "question": "Can referral partners and institutions use the same form?",
          "answer": "Yes. We use the same entry point for patient, referral, and institutional communication so conversations stay connected and accountable from the beginning."
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
