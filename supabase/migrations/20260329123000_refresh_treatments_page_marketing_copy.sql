UPDATE public.cms_pages
SET
    seo = $${
    "title": "Treatments in Egypt for International Patients | Care N Tour",
    "description": "Explore treatments in Egypt through Care N Tour, including fertility, dental, cardiac, ophthalmology, cosmetic, bariatric, and other specialist care supported by accredited hospitals, expert doctors, and end-to-end medical travel coordination."
  }$$::jsonb,
    content = $$[
    {
      "type": "aboutHero",
      "eyebrow": "Treatments in Egypt",
      "heading": "Explore treatments in Egypt with us and move forward with medical clarity, travel confidence, and accredited support.",
      "description": "At Care N Tour, we help international patients compare high-demand treatments in Egypt across fertility, dental care, cardiology, ophthalmology, cosmetic surgery, bariatric surgery, and more. We support every treatment pathway with vetted doctors, accredited hospitals, transparent planning, and multilingual coordination from first inquiry to follow-up.",
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
          "label": "Fertility, dental, cosmetic, bariatric, cardiac, eye, and other specialist treatment pathways"
        },
        {
          "kicker": "Standards",
          "label": "Accredited hospitals, verified doctors, and treatment planning built for international patients"
        },
        {
          "kicker": "Coordination",
          "label": "Medical review, travel logistics, accommodation support, and aftercare communication in one journey"
        }
      ],
      "primaryAction": {
        "label": "Request Your Treatment Plan",
        "href": "/consultation",
        "variant": "default"
      },
      "secondaryAction": {
        "label": "Talk to Our Team",
        "href": "/contact",
        "variant": "hero"
      }
    },
    {
      "type": "storyNarrative",
      "eyebrow": "How We Guide Patients",
      "heading": "We make treatment decisions abroad easier for patients who need more than a procedure list.",
      "lead": "When you compare treatment in Egypt, you are not only assessing a medical procedure. You are also judging doctor quality, hospital credibility, pricing clarity, travel logistics, and what happens after treatment.",
      "paragraphs": [
        "We bring those decisions together in one managed experience. Through Care N Tour, we help you explore treatments in Egypt with a clearer view of the doctors, hospitals, timelines, and coordination behind each option.",
        "We work with international patients and multinational expectations in mind, which means we deliver structured communication, faster planning, and better visibility on what is included before travel begins.",
        "That allows you and your family to move from initial research to a confident shortlist and a personalized treatment plan without navigating the process alone."
      ],
      "strengthsTitle": "What we help patients evaluate",
      "strengths": [
        {
          "title": "Clinical fit and specialist access",
          "description": "We help patients understand which specialty, procedure, and doctor profile best match their condition, goals, and travel window."
        },
        {
          "title": "Provider quality and treatment readiness",
          "description": "We present pathways built around accredited hospitals, experienced specialists, and facilities equipped to support international care."
        },
        {
          "title": "Planning, pricing, and next steps",
          "description": "We help patients understand estimated costs, records needed, expected timelines, and how to move forward with consultation or booking."
        }
      ],
      "closing": "The result is a treatment journey we make more transparent, better coordinated, and more dependable from first contact to recovery."
    },
    {
      "type": "statGrid",
      "eyebrow": "Care N Tour At A Glance",
      "heading": "Why international patients trust us when comparing treatment abroad",
      "description": "We present the proof points that matter most when you compare medical tourism providers, treatment destinations, and care coordination partners.",
      "columns": 4,
      "emphasizeValue": true,
      "items": [
        {
          "label": "Successful procedures",
          "value": "5000+",
          "helper": "Across high-demand treatments coordinated through our network",
          "icon": "Award"
        },
        {
          "label": "Countries served",
          "value": "50+",
          "helper": "Patients and families supported across global markets",
          "icon": "Globe"
        },
        {
          "label": "Patient satisfaction",
          "value": "98%",
          "helper": "A reflection of the experience we aim to deliver before, during, and after treatment",
          "icon": "Shield"
        },
        {
          "label": "Potential savings",
          "value": "Up to 70%",
          "helper": "Compared with many Western markets, depending on procedure and treatment plan",
          "icon": "DollarSign"
        }
      ]
    },
    {
      "type": "treatmentSpecialties",
      "heading": "Our Medical Specialties",
      "description": "Browse the treatments our international patients most often compare in Egypt, then open the specialty that best matches your medical needs, timing, and recovery goals.",
      "showSearch": true,
      "searchPlaceholder": "Search treatments, procedures, or specialties...",
      "emptyStateHeading": "No treatments match that search",
      "emptyStateDescription": "Try another treatment name, procedure, or specialty to continue exploring your options.",
      "priceLabel": "Starting from",
      "primaryActionLabel": "Explore Treatment",
      "secondaryActionLabel": "Get My Plan",
      "limit": 12,
      "featuredOnly": false
    },
    {
      "type": "trustSignals",
      "eyebrow": "Why Choose Care N Tour",
      "heading": "We coordinate treatment in Egypt the way global patients expect healthcare journeys to be managed.",
      "description": "Patients choose us when they want more than access to a doctor. They choose us because we structure decisions clearly, reduce uncertainty, and keep treatment and travel aligned.",
      "items": [
        {
          "eyebrow": "01",
          "title": "Accredited hospitals and verified doctors",
          "description": "We build treatment pathways around trusted providers selected for quality, reputation, and international patient readiness.",
          "icon": "Shield"
        },
        {
          "eyebrow": "02",
          "title": "Transparent treatment planning before travel",
          "description": "We help patients understand records, recommended next steps, expected costs, and travel timing before they commit.",
          "icon": "FileCheck"
        },
        {
          "eyebrow": "03",
          "title": "Multilingual coordination across the journey",
          "description": "Our team supports communication between patients, families, doctors, and providers so nothing critical is lost in translation.",
          "icon": "Languages"
        },
        {
          "eyebrow": "04",
          "title": "Travel, recovery, and follow-up support",
          "description": "From arrival planning to accommodation, recovery guidance, and post-treatment communication, we keep the journey connected.",
          "icon": "Route"
        }
      ]
    },
    {
      "type": "doctors",
      "title": "Meet doctors and specialists we present with confidence",
      "description": "Our featured doctors show you the medical expertise behind our treatment pathways and help you shortlist care in Egypt with greater confidence.",
      "layout": "grid",
      "limit": 3,
      "featuredOnly": true
    },
    {
      "type": "faq",
      "eyebrow": "Frequently Asked Questions",
      "heading": "Questions we answer most often about treatment in Egypt",
      "description": "Below, we answer the questions you are most likely to ask us when planning treatment in Egypt, from doctors and costs to timelines and medical travel support.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "What treatments can I explore through Care N Tour in Egypt?",
          "answer": "Through Care N Tour, you can explore a wide range of treatments in Egypt, including fertility treatment, dental care, cosmetic surgery, bariatric surgery, cardiac care, ophthalmology, and other specialist pathways offered through our provider network."
        },
        {
          "question": "How does Care N Tour help me choose the right doctor and hospital?",
          "answer": "We review your medical case, treatment goals, travel preferences, and timeline, then help you compare suitable doctors and hospitals based on specialty fit, provider quality, and international patient readiness."
        },
        {
          "question": "Can I receive a treatment plan and price estimate before I travel?",
          "answer": "Yes. We prepare a personalized treatment pathway before travel that can include recommended next steps, required records, expected timelines, and starting price guidance. Final pricing depends on the medical case, diagnostics, doctor selection, and the confirmed treatment plan."
        },
        {
          "question": "What is included in Care N Tour's medical travel coordination?",
          "answer": "Depending on your case, we can support provider matching, appointment scheduling, medical record review, travel guidance, accommodation planning, airport transfers, interpretation support, and coordination during recovery and follow-up."
        },
        {
          "question": "How quickly can treatment in Egypt be arranged?",
          "answer": "Timelines vary by treatment and doctor availability, but our coordination model is designed to shorten delays and help international patients move from inquiry to treatment planning quickly once records are received."
        },
        {
          "question": "Do you support follow-up after treatment and after I return home?",
          "answer": "Yes. We stay involved after treatment by helping coordinate follow-up communication, post-treatment instructions, and next steps so patients remain connected to their provider after returning home."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Start Planning",
      "heading": "Tell us the treatment you are considering, and we will turn it into a clear next-step plan.",
      "description": "Share your medical goals, history, and preferred travel timing. Care N Tour will review your case, match you with the right specialists, and prepare a personalized treatment and travel pathway.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Request Free Consultation",
          "href": "/consultation",
          "variant": "default"
        },
        {
          "label": "Start Your Journey",
          "href": "/start-journey",
          "variant": "outline"
        }
      ]
    }
  ]$$::jsonb,
    updated_at = now()
WHERE slug = 'treatments';
