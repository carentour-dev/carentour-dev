INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES (
    'about',
    'About Us',
    'published',
    $${
    "title": "About Care N Tour | Medical Tourism Experts in Egypt",
    "description": "Learn how Care N Tour guides international patients to trusted treatment providers in Egypt with verified partners, coordinated planning, and personal support."
  }$$::jsonb,
    $$[
    {
      "type": "aboutHero",
      "eyebrow": "About Care N Tour",
      "heading": "A trusted medical travel partner built to make treatment in Egypt feel clear, coordinated, and personal.",
      "description": "Care N Tour helps patients from around the world access premium medical care in Egypt through verified providers, transparent guidance, and concierge-style coordination from first contact to post-treatment follow-up.",
      "backgroundImageUrl": "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
      "highlights": [
        {
          "kicker": "Established",
          "label": "Formally established in 2025 after years of groundwork and partnerships"
        },
        {
          "kicker": "Based In",
          "label": "Egypt with a service model built for international patients"
        },
        {
          "kicker": "Approach",
          "label": "Verified partners, end-to-end coordination, and dedicated case management"
        }
      ],
      "primaryAction": {
        "label": "Contact our team",
        "href": "/contact",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Start your journey",
        "href": "/start-journey",
        "variant": "secondary"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "Our Story",
      "heading": "Created to remove the uncertainty patients face when arranging treatment abroad on their own.",
      "lead": "Care N Tour brings medical access, travel planning, and ongoing guidance into one coordinated experience for patients who want confidence before they commit.",
      "paragraphs": [
        "Care N Tour is a leading medical tourism provider based in Egypt, dedicated to helping patients access premium healthcare with confidence, comfort, and ease. Formally established in 2025, the company grew from years of groundwork, partnerships, and practical experience in the medical, digital transformation, and service-delivery fields. We connect trusted Egyptian medical experts with patients seeking world-class treatment abroad and guide them through a seamless journey from consultation to recovery.",
        "Care N Tour is led by a founding team with diverse backgrounds in healthcare, medical tourism, digital platforms, customer experience, and international travel services. The team has worked with accredited hospitals, reputable medical institutions, and major transformation programs, creating a strong foundation in governance, quality, and operational excellence.",
        "We collaborate with top hospitals, accredited specialists, and experienced medical professionals across Egypt to provide care that is tailored to each patient's needs. Our role includes helping patients choose the right doctors, supporting travel and accommodation arrangements, and coordinating follow-up support with precision and compassion.",
        "The idea for Care N Tour emerged from a clear need in the market. Many medical travelers previously had to manage everything on their own, from verifying hospitals and comparing costs to arranging travel and coordinating appointments. That often led to unclear pricing, fragmented services, and a stressful experience. Care N Tour brings everything together in one trusted place."
      ],
      "strengthsTitle": "Our approach is built on three main strengths",
      "strengths": [
        {
          "title": "Carefully selected and verified medical partners",
          "description": "Patients are introduced to reputable hospitals, specialists, and medical professionals aligned with their needs."
        },
        {
          "title": "Complete end-to-end coordination supported by technology",
          "description": "Medical review, planning, travel logistics, and communication are handled as one connected experience."
        },
        {
          "title": "A personalized, concierge-style experience",
          "description": "Every patient journey is guided with individual attention before, during, and after treatment."
        }
      ],
      "closing": "We believe medical care should feel accessible, transparent, and worry-free. By combining medical expertise with personal guidance, we help patients and their families feel supported at every stage of the journey."
    },
    {
      "type": "trustSignals",
      "eyebrow": "How The Model Works",
      "heading": "More than a referral service, less fragmented than arranging treatment alone.",
      "description": "The company's role is to reduce risk, simplify decision-making, and create a more dependable patient experience from planning through recovery.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Trusted provider selection",
          "description": "Patients are matched with accredited hospitals, reputable specialists, and experienced medical professionals across Egypt.",
          "icon": "Shield"
        },
        {
          "eyebrow": "02",
          "title": "Integrated travel and treatment coordination",
          "description": "Travel, accommodation, scheduling, and treatment planning are coordinated together instead of across disconnected vendors.",
          "icon": "Route"
        },
        {
          "eyebrow": "03",
          "title": "Clearer planning and less friction",
          "description": "The process is designed to reduce confusion around pricing, provider verification, appointments, and logistics.",
          "icon": "MessagesSquare"
        },
        {
          "eyebrow": "04",
          "title": "Support before, during, and after treatment",
          "description": "Patients receive guidance from first enquiry through post-treatment follow-up, with dedicated case management throughout.",
          "icon": "HeartHandshake"
        }
      ]
    },
    {
      "type": "missionVisionValues",
      "eyebrow": "Mission, Vision & Values",
      "heading": "The standards behind every patient experience",
      "description": "Care N Tour's mission and vision are rooted in trust, operational clarity, and a long-term commitment to positioning Egypt as a world-class destination for care.",
      "missionTitle": "Mission",
      "missionBody": "Care N Tour is committed to guiding patients from around the world to premium and accessible medical care in Egypt. We connect them with trusted doctors and accredited hospitals while coordinating travel, accommodation, and follow-up in a simple and supportive way. Our mission is to create a medical journey that feels safe, personal, well-organized, and reassuring.",
      "missionAccentPreset": "neutral",
      "visionTitle": "Vision",
      "visionBody": "Our vision is to lead the medical tourism industry in a way that helps position Egypt as a trusted first-choice global destination for high-quality healthcare. We aim to offer exceptional patient experiences through verified medical partners, clear and honest information, and thoughtful concierge-style support backed by reliable coordination and digital innovation.",
      "visionAccentPreset": "warm",
      "valuesTitle": "Our Core Values",
      "valuesDescription": "The principles that guide everything we do in delivering exceptional medical tourism experiences.",
      "values": [
        {
          "title": "Safety First",
          "description": "We maintain high standards in provider selection, coordination quality, and patient support throughout the journey.",
          "icon": "Shield"
        },
        {
          "title": "Patient-Centered Care",
          "description": "Every treatment journey is planned around the patient's needs, goals, comfort, and peace of mind.",
          "icon": "Heart"
        },
        {
          "title": "24/7 Support",
          "description": "Our team stays available across the journey so patients and families never feel unsupported during treatment planning or recovery.",
          "icon": "Clock"
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Speak With Care N Tour",
      "heading": "Start your treatment planning with a team built around clarity and support.",
      "description": "If you are exploring medical treatment in Egypt, our coordinators can help you understand options, next steps, and what a well-managed journey should look like.",
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
