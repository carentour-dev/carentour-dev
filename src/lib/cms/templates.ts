import type { BlockValue } from "./blocks";
import { buildCallToActionBaseStyle } from "./callToActionStyle";
import { DEFAULT_HERO_OVERLAY } from "../heroOverlay";

export type CmsTemplate = {
  slug: string;
  name: string;
  description: string;
  defaultSlug: string;
  defaultTitle: string;
  blocks: BlockValue[];
  seo?: {
    title?: string;
    description?: string;
  };
};

export const cmsTemplates: CmsTemplate[] = [
  {
    slug: "home-exact",
    name: "Home Page",
    description:
      "Editorial corporate homepage aligned with the newer About page block system.",
    defaultSlug: "home",
    defaultTitle: "Home",
    seo: {
      title: "Care N Tour | Premium Medical Travel in Egypt",
      description:
        "Care N Tour connects international patients with accredited hospitals, verified specialists, and fully coordinated medical travel in Egypt.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Global Medical Travel, Coordinated Properly",
        heading:
          "Premium medical care in Egypt with trusted doctors, accredited hospitals, and complete travel coordination.",
        description:
          "Access trusted doctors and accredited hospitals with complete travel coordination and personal guidance at every step. We make your medical journey safe, clear, and comfortable from inquiry to recovery.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        highlights: [
          {
            kicker: "Providers",
            label: "JCI-accredited hospitals and board-certified specialists",
          },
          {
            kicker: "Support",
            label:
              "Transparent packages, multilingual coordination, and concierge-level guidance",
          },
          {
            kicker: "Access",
            label:
              "Fast-track treatment planning with end-to-end travel support",
          },
        ],
        primaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "View Treatments",
          href: "/treatments",
          variant: "secondary",
        },
        overlay: DEFAULT_HERO_OVERLAY,
      },
      {
        type: "statGrid",
        eyebrow: "At A Glance",
        heading:
          "A care model built for international patients and global expectations",
        description:
          "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality through one coordinated service model.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Partner hospitals",
            value: "100% Accredited",
            helper: "JCI-accredited facilities",
            icon: "Award",
          },
          {
            label: "Board-certified surgeons",
            value: "200+ Specialists",
            helper: "Internationally trained experts",
            icon: "Shield",
          },
          {
            label: "Coordinator support",
            value: "15+ Languages",
            helper: "Seamless communication throughout the journey",
            icon: "Globe",
          },
          {
            label: "Potential savings",
            value: "Up to 70%",
            helper: "Transparent packages with no hidden costs",
            icon: "DollarSign",
          },
        ],
      },
      {
        type: "storyNarrative",
        eyebrow: "Why Care N Tour",
        heading:
          "A clearer way to plan treatment abroad without managing every detail alone.",
        lead: "Patients should not have to verify providers, compare options, coordinate logistics, and arrange follow-up alone when they are already making an important healthcare decision.",
        paragraphs: [
          "Care N Tour combines treatment planning, provider access, travel coordination, and patient support into one managed experience for international patients seeking care in Egypt.",
          "Instead of navigating hospitals, specialists, accommodation, transfers, and scheduling across separate contacts, patients receive a more structured path with personal guidance from first inquiry to recovery.",
          "The result is a medical journey designed to feel more transparent, more organized, and more supportive at every stage.",
        ],
        strengthsTitle: "What patients gain from a managed journey",
        strengths: [
          {
            title: "Verified specialists and accredited hospitals",
            description:
              "Patients are matched with trusted providers aligned with their medical needs and expectations.",
          },
          {
            title: "Transparent planning before any commitment",
            description:
              "Treatment options, logistics, expected timelines, and package details are clarified early to reduce uncertainty.",
          },
          {
            title: "Concierge-style coordination from arrival to follow-up",
            description:
              "Travel, accommodation, transfers, and aftercare communication are supported as one connected journey.",
          },
        ],
        closing:
          "For patients and families evaluating treatment abroad, that combination of medical access and operational clarity creates a more dependable experience.",
      },
      {
        type: "featuredTreatmentsHome",
        eyebrow: "Treatments",
        title: "Featured Treatments",
        description:
          "Discover our most popular medical procedures, performed by internationally certified specialists",
        cardAppearance: "original",
        limit: 12,
        featuredOnly: true,
      },
      {
        type: "featureGrid",
        eyebrow: "Patient Journey",
        heading: "Your journey to better health",
        description:
          "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
        columns: 3,
        variant: "cards",
        items: [
          {
            tag: "01",
            icon: "MessageCircle",
            title: "Explore Your Options",
            description:
              "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences.",
          },
          {
            tag: "02",
            icon: "Calendar",
            title: "Receive a Personalized Treatment Plan",
            description:
              "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision.",
          },
          {
            tag: "03",
            icon: "Plane",
            title: "Prepare for Your Trip",
            description:
              "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival.",
          },
          {
            tag: "04",
            icon: "Heart",
            title: "Arrive with Confidence",
            description:
              "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin.",
          },
          {
            tag: "05",
            icon: "Home",
            title: "Undergo Treatment with Full Support",
            description:
              "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics.",
          },
          {
            tag: "06",
            icon: "CheckCircle",
            title: "Recover Safely and Comfortably",
            description:
              "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support.",
          },
        ],
      },
      {
        type: "trustSignals",
        eyebrow: "What Makes Us Different",
        heading: "The standards behind every treatment journey",
        description:
          "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
        items: [
          {
            eyebrow: "100% Accredited",
            icon: "Award",
            title: "JCI Accredited Hospitals",
            description:
              "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards.",
          },
          {
            eyebrow: "200+ Specialists",
            icon: "Shield",
            title: "Board-Certified Surgeons",
            description:
              "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions.",
          },
          {
            eyebrow: "Up to 70% Savings",
            icon: "DollarSign",
            title: "All-Inclusive Packages",
            description:
              "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support.",
          },
          {
            eyebrow: "2-3 Weeks",
            icon: "Clock",
            title: "Fast-Track Treatment",
            description:
              "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking.",
          },
          {
            eyebrow: "15+ Languages",
            icon: "Globe",
            title: "Multilingual Support",
            description:
              "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey.",
          },
          {
            eyebrow: "End-to-End Care",
            icon: "Plane",
            title: "Complete Travel Support",
            description:
              "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay.",
          },
        ],
      },
      {
        type: "faq",
        eyebrow: "Frequently Asked Questions",
        heading:
          "Questions we answer before international patients choose treatment in Egypt",
        description:
          "At Care N Tour, we explain how specialist review, accredited hospitals in Egypt, treatment timelines, travel planning, accommodation, companion support, pricing guidance, and follow-up work so patients and families can move forward with confidence.",
        layout: "twoColumn",
        items: [
          {
            question:
              "How does Care N Tour help international patients plan treatment in Egypt?",
            answer:
              "We review each patient's goals and medical records, coordinate specialist matching, and build a personalized treatment and medical travel plan that can include hospital access, timing, accommodation, transfers, and follow-up support.",
          },
          {
            question: "How do you choose doctors and hospitals in Egypt?",
            answer:
              "We introduce patients to trusted doctors and accredited hospitals in Egypt based on medical needs, treatment goals, and practical travel considerations, so provider evaluation is clearer before any decision is made.",
          },
          {
            question:
              "Will I understand the expected cost before I decide to travel?",
            answer:
              "We prepare pricing guidance based on the recommended treatment, hospital, expected length of stay, accommodation, and support scope, so patients can understand the package structure and expected costs before committing.",
          },
          {
            question:
              "What do you need from me before you can build a treatment and travel plan?",
            answer:
              "We usually need medical records, recent test results or imaging, passport details, and the preferred travel window. With that information, we can coordinate specialist review and outline a realistic treatment and travel timeline.",
          },
          {
            question:
              "Can Care N Tour arrange accommodation, airport transfers, and support for family members?",
            answer:
              "Yes. We coordinate accommodation, airport reception, local transportation, and companion planning so patients and families have one point of contact before arrival, during treatment, and throughout recovery in Egypt.",
          },
          {
            question: "What happens after treatment in Egypt is completed?",
            answer:
              "We continue coordinating discharge guidance, recovery planning, return-travel logistics, and follow-up communication so the patient leaves Egypt with clear documentation, defined next steps, and continuity after returning home.",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Start Planning",
        heading:
          "Ready to start your health journey with clarity and confidence?",
        description:
          "Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Get Free Consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "about-global",
    name: "About Page",
    description:
      "Premium About page for corporate narrative, trust signals, and company values.",
    defaultSlug: "about",
    defaultTitle: "About Us",
    seo: {
      title: "About Care N Tour | Medical Tourism Experts in Egypt",
      description:
        "Learn how Care N Tour guides international patients to trusted treatment providers in Egypt with verified partners, coordinated planning, and personal support.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "About Care N Tour",
        heading:
          "A trusted medical travel partner built to make treatment in Egypt feel clear, coordinated, and personal.",
        description:
          "Care N Tour helps patients from around the world access premium medical care in Egypt through verified providers, transparent guidance, and concierge-style coordination from first contact to post-treatment follow-up.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Established",
            label:
              "Formally established in 2025 after years of groundwork and partnerships",
          },
          {
            kicker: "Based In",
            label:
              "Egypt with a service model built for international patients",
          },
          {
            kicker: "Approach",
            label:
              "Verified partners, end-to-end coordination, and dedicated case management",
          },
        ],
        primaryAction: {
          label: "Contact our team",
          href: "/contact",
          variant: "default",
        },
        secondaryAction: {
          label: "Start your journey",
          href: "/start-journey",
          variant: "hero",
        },
      },
      {
        type: "storyNarrative",
        eyebrow: "Our Story",
        heading:
          "Created to remove the uncertainty patients face when arranging treatment abroad on their own.",
        lead: "Care N Tour brings medical access, travel planning, and ongoing guidance into one coordinated experience for patients who want confidence before they commit.",
        paragraphs: [
          "Care N Tour is a leading medical tourism provider based in Egypt, dedicated to helping patients access premium healthcare with confidence, comfort, and ease. Formally established in 2025, the company grew from years of groundwork, partnerships, and practical experience in the medical, digital transformation, and service-delivery fields. We connect trusted Egyptian medical experts with patients seeking world-class treatment abroad and guide them through a seamless journey from consultation to recovery.",
          "Care N Tour is led by a founding team with diverse backgrounds in healthcare, medical tourism, digital platforms, customer experience, and international travel services. The team has worked with accredited hospitals, reputable medical institutions, and major transformation programs, creating a strong foundation in governance, quality, and operational excellence.",
          "We collaborate with top hospitals, accredited specialists, and experienced medical professionals across Egypt to provide care that is tailored to each patient’s needs. Our role includes helping patients choose the right doctors, supporting travel and accommodation arrangements, and coordinating follow-up support with precision and compassion.",
          "The idea for Care N Tour emerged from a clear need in the market. Many medical travelers previously had to manage everything on their own, from verifying hospitals and comparing costs to arranging travel and coordinating appointments. That often led to unclear pricing, fragmented services, and a stressful experience. Care N Tour brings everything together in one trusted place.",
        ],
        strengthsTitle: "Our approach is built on three main strengths",
        strengths: [
          {
            title: "Carefully selected and verified medical partners",
            description:
              "Patients are introduced to reputable hospitals, specialists, and medical professionals aligned with their needs.",
          },
          {
            title: "Complete end-to-end coordination supported by technology",
            description:
              "Medical review, planning, travel logistics, and communication are handled as one connected experience.",
          },
          {
            title: "A personalized, concierge-style experience",
            description:
              "Every patient journey is guided with individual attention before, during, and after treatment.",
          },
        ],
        closing:
          "We believe medical care should feel accessible, transparent, and worry-free. By combining medical expertise with personal guidance, we help patients and their families feel supported at every stage of the journey.",
      },
      {
        type: "trustSignals",
        eyebrow: "How The Model Works",
        heading:
          "More than a referral service, less fragmented than arranging treatment alone.",
        description:
          "The company’s role is to reduce risk, simplify decision-making, and create a more dependable patient experience from planning through recovery.",
        items: [
          {
            eyebrow: "01",
            title: "Trusted provider selection",
            description:
              "Patients are matched with accredited hospitals, reputable specialists, and experienced medical professionals across Egypt.",
            icon: "Shield",
          },
          {
            eyebrow: "02",
            title: "Integrated travel and treatment coordination",
            description:
              "Travel, accommodation, scheduling, and treatment planning are coordinated together instead of across disconnected vendors.",
            icon: "Route",
          },
          {
            eyebrow: "03",
            title: "Clearer planning and less friction",
            description:
              "The process is designed to reduce confusion around pricing, provider verification, appointments, and logistics.",
            icon: "MessagesSquare",
          },
          {
            eyebrow: "04",
            title: "Support before, during, and after treatment",
            description:
              "Patients receive guidance from first enquiry through post-treatment follow-up, with dedicated case management throughout.",
            icon: "HeartHandshake",
          },
        ],
      },
      {
        type: "missionVisionValues",
        eyebrow: "Mission, Vision & Values",
        heading: "The standards behind every patient experience",
        description:
          "Care N Tour’s mission and vision are rooted in trust, operational clarity, and a long-term commitment to positioning Egypt as a world-class destination for care.",
        missionTitle: "Mission",
        missionBody:
          "Care N Tour is committed to guiding patients from around the world to premium and accessible medical care in Egypt. We connect them with trusted doctors and accredited hospitals while coordinating travel, accommodation, and follow-up in a simple and supportive way. Our mission is to create a medical journey that feels safe, personal, well-organized, and reassuring.",
        missionAccentPreset: "neutral",
        visionTitle: "Vision",
        visionBody:
          "Our vision is to lead the medical tourism industry in a way that helps position Egypt as a trusted first-choice global destination for high-quality healthcare. We aim to offer exceptional patient experiences through verified medical partners, clear and honest information, and thoughtful concierge-style support backed by reliable coordination and digital innovation.",
        visionAccentPreset: "warm",
        valuesTitle: "Our Core Values",
        valuesDescription:
          "The principles that guide everything we do in delivering exceptional medical tourism experiences.",
        values: [
          {
            title: "Safety First",
            description:
              "We maintain high standards in provider selection, coordination quality, and patient support throughout the journey.",
            icon: "Shield",
          },
          {
            title: "Patient-Centered Care",
            description:
              "Every treatment journey is planned around the patient’s needs, goals, comfort, and peace of mind.",
            icon: "Heart",
          },
          {
            title: "24/7 Support",
            description:
              "Our team stays available across the journey so patients and families never feel unsupported during treatment planning or recovery.",
            icon: "Clock",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Speak With Care N Tour",
        heading:
          "Start your treatment planning with a team built around clarity and support.",
        description:
          "If you are exploring medical treatment in Egypt, our coordinators can help you understand options, next steps, and what a well-managed journey should look like.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Book a consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Contact our team",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "treatments-global",
    name: "Treatments Page",
    description:
      "Corporate treatments page with narrative positioning, specialties catalog, FAQs, and conversion CTA.",
    defaultSlug: "treatments",
    defaultTitle: "Treatments",
    seo: {
      title: "Treatments | Care N Tour | Medical Treatments in Egypt",
      description:
        "Explore medical treatments in Egypt through Care N Tour, with accredited specialists, transparent planning, and coordinated support for international patients.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Treatments",
        heading:
          "Medical treatments in Egypt, presented with the clarity international patients expect.",
        description:
          "Explore high-demand treatments coordinated through Care N Tour, where accredited specialists, transparent planning, and end-to-end patient support come together in one managed experience.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Coverage",
            label:
              "Cardiac, fertility, dental, ophthalmology, cosmetic, and other specialist pathways",
          },
          {
            kicker: "Standard",
            label:
              "Accredited providers, structured planning, and multilingual patient coordination",
          },
          {
            kicker: "Approach",
            label:
              "Designed for international patients comparing quality, speed, and total journey clarity",
          },
        ],
        primaryAction: {
          label: "Start your journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Speak with our team",
          href: "/contact",
          variant: "hero",
        },
      },
      {
        type: "storyNarrative",
        eyebrow: "Treatment Planning",
        heading:
          "A better treatments page should help patients understand options, not just scan a card grid.",
        lead: "International patients need more than a list of procedures. They need context around quality, suitability, next steps, and what a coordinated treatment journey actually looks like.",
        paragraphs: [
          "Care N Tour curates treatment pathways around accredited providers, specialist access, and operational support so patients can evaluate Egypt with greater confidence.",
          "That means the Treatments page should do two jobs well: clearly present the available specialties, and reinforce the standards, planning support, and patient journey behind them.",
          "The result is a page that feels more like a multinational healthcare platform and less like a brochure of disconnected offers.",
        ],
        strengthsTitle: "What patients should understand quickly",
        strengths: [
          {
            title:
              "Which treatments are available and who they are designed for",
            description:
              "Visitors should be able to scan specialties, compare relevance, and move deeper into a treatment page with confidence.",
          },
          {
            title: "What makes the service model credible",
            description:
              "The page needs to communicate provider quality, coordination standards, and international patient readiness.",
          },
          {
            title: "What to do next",
            description:
              "Every major section should naturally guide the visitor toward consultation, shortlisting, or starting the journey.",
          },
        ],
        closing:
          "This makes the page stronger for users, search engines, and AI systems looking for structured, trustworthy healthcare content.",
      },
      {
        type: "statGrid",
        eyebrow: "At A Glance",
        heading: "Built to answer global patient concerns early",
        description:
          "The Treatments page should reassure visitors on quality, access, communication, and value before they reach out.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Partner hospitals",
            value: "100% Accredited",
            helper: "Leading facilities selected for international standards",
            icon: "Award",
          },
          {
            label: "Specialist network",
            value: "200+ Experts",
            helper: "Board-certified doctors across major specialties",
            icon: "Shield",
          },
          {
            label: "Coordinator support",
            value: "15+ Languages",
            helper: "Clear communication throughout the patient journey",
            icon: "Globe",
          },
          {
            label: "Potential savings",
            value: "Up to 70%",
            helper: "Transparent planning compared with many Western markets",
            icon: "DollarSign",
          },
        ],
      },
      {
        type: "treatmentSpecialties",
        heading: "Our Medical Specialties",
        description:
          "World-class medical care across multiple specialties with significant cost savings.",
        showSearch: true,
        searchPlaceholder: "Search treatments by name or specialty...",
        emptyStateHeading: "No specialties match your search",
        emptyStateDescription:
          "Try another keyword or clear the search to browse all specialties.",
        priceLabel: "Starting at",
        primaryActionLabel: "Learn More",
        secondaryActionLabel: "Start Your Journey",
        limit: 4,
        featuredOnly: false,
      },
      {
        type: "trustSignals",
        eyebrow: "Why Patients Compare Egypt",
        heading:
          "The combination of medical quality and operational support matters as much as price.",
        description:
          "Care N Tour positions Egypt as a serious treatment destination by reducing the friction that usually makes cross-border care feel risky.",
        items: [
          {
            eyebrow: "01",
            title: "Accredited provider access",
            description:
              "Treatment pathways are aligned with vetted hospitals and specialists, not generic referral lists.",
            icon: "Shield",
          },
          {
            eyebrow: "02",
            title: "Transparent planning before travel",
            description:
              "Visitors can understand treatments, expected costs, and next steps before committing to a trip.",
            icon: "FileCheck",
          },
          {
            eyebrow: "03",
            title: "Multilingual coordination",
            description:
              "Communication, scheduling, and logistics are easier for international patients and families.",
            icon: "Languages",
          },
          {
            eyebrow: "04",
            title: "One managed journey",
            description:
              "Medical planning, travel support, and follow-up communication are handled as one connected experience.",
            icon: "Route",
          },
        ],
      },
      {
        type: "doctors",
        title: "Meet specialists patients can shortlist with confidence",
        description:
          "Featured doctors reinforce that the page represents real expertise, not just a marketing list of treatments.",
        layout: "grid",
        limit: 3,
        featuredOnly: true,
      },
      {
        type: "faq",
        eyebrow: "Frequently Asked Questions",
        heading:
          "Questions international patients commonly ask before choosing a treatment",
        description:
          "These answers make the page more useful for visitors and improve search and AI visibility with structured, high-intent content.",
        layout: "twoColumn",
        items: [
          {
            question:
              "What medical specialties can I explore through Care N Tour?",
            answer:
              "The Treatments page covers major specialties such as cardiac care, fertility treatment, dental care, ophthalmology, cosmetic surgery, and other procedures coordinated through Care N Tour's provider network in Egypt.",
          },
          {
            question:
              "Are the treatments on this page managed through accredited providers?",
            answer:
              "Care N Tour works with vetted hospitals, clinics, and specialists selected for quality, credibility, and readiness to support international patients.",
          },
          {
            question:
              "Can I request a consultation before deciding on a treatment?",
            answer:
              "Yes. Patients can speak with the team, share medical information, and receive guidance on suitable treatment pathways before confirming travel.",
          },
          {
            question: "Are treatment prices fixed on the website?",
            answer:
              "Displayed prices are directional starting points. Final pricing depends on the medical case, provider selection, diagnostics, and the treatment plan recommended after review.",
          },
          {
            question:
              "How does Care N Tour support patients traveling from abroad?",
            answer:
              "Support can include treatment coordination, provider matching, scheduling, communication assistance, travel guidance, accommodation planning, and post-treatment follow-up support.",
          },
          {
            question: "What should I do after choosing a treatment?",
            answer:
              "The next step is to start your journey or contact the Care N Tour team so your case can be reviewed and a personalized treatment pathway can be prepared.",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Start Planning",
        heading:
          "Shortlist your treatment with a team built to support international patients properly.",
        description:
          "If you already know the treatment you are exploring, we can help you move from browsing to a clear, personalized treatment plan.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Book a consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Contact our team",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "plan-global",
    name: "Plan Your Trip",
    description:
      "Corporate planning page with embedded intake, travel guidance, and conversion-focused FAQs.",
    defaultSlug: "plan",
    defaultTitle: "Plan Your Trip",
    seo: {
      title:
        "Plan Your Medical Trip to Egypt | Care N Tour International Patient Services",
      description:
        "Plan medical travel to Egypt with Care N Tour. Explore treatment coordination, visa guidance, recovery accommodation, airport transfers, multilingual support, and a guided patient intake.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Plan Your Trip",
        heading:
          "Plan your medical trip to Egypt with one coordinated team for treatment, travel, and recovery.",
        description:
          "Care N Tour helps international patients align medical review, travel preparation, accommodation, airport transfers, and recovery planning through one guided pathway.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Planning",
            label:
              "Treatment coordination, travel preparation, and recovery logistics managed together",
          },
          {
            kicker: "Audience",
            label:
              "Built for international patients, companions, and referring families",
          },
          {
            kicker: "Access",
            label:
              "Start with a guided intake and receive a tailored treatment and travel plan",
          },
        ],
        primaryAction: {
          label: "Start your journey",
          href: "#start-journey-intake",
          variant: "default",
        },
        secondaryAction: {
          label: "View treatments",
          href: "/treatments",
          variant: "hero",
        },
      },
      {
        type: "storyNarrative",
        eyebrow: "International Patient Planning",
        heading:
          "Care N Tour turns medical travel to Egypt into one clear, supported journey from consultation to recovery.",
        lead: "We help patients from around the world access premium healthcare in Egypt with confidence, comfort, and operational clarity.",
        paragraphs: [
          "Our team connects international patients with trusted doctors, accredited hospitals, and a structured care pathway designed around their medical goals, travel timeline, and recovery needs.",
          "From medical review and specialist matching to visa guidance, accommodation, airport transfers, and local coordination, every stage is planned as part of one connected experience.",
          "The result is a medical tourism journey that feels safer, more transparent, and more comfortable for patients and their families.",
        ],
        strengthsTitle: "Why patients choose Care N Tour",
        strengths: [
          {
            title: "Trusted medical access",
            description:
              "We work with carefully selected providers so patients can move forward with greater confidence in quality, safety, and clinical standards.",
          },
          {
            title: "End-to-end coordination",
            description:
              "Treatment planning, travel logistics, accommodation, and recovery support are managed together instead of across disconnected vendors.",
          },
          {
            title: "Personalized support",
            description:
              "Every case is handled around the patient, with multilingual communication, tailored planning, and follow-up support before and after travel.",
          },
        ],
        closing:
          "This is how Care N Tour represents Egypt as a trusted destination for world-class treatment and concierge-level patient care.",
      },
      {
        type: "statGrid",
        eyebrow: "At A Glance",
        heading:
          "A medical tourism company built for international patient expectations",
        description:
          "Care N Tour combines healthcare access, global patient support, and premium travel coordination in one managed service model.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Successful procedures",
            value: "5000+",
            helper:
              "Patients supported across treatment planning, travel, and recovery",
            icon: "Globe2",
          },
          {
            label: "Countries served",
            value: "50+",
            helper:
              "International reach across North America, Europe, the Gulf, and beyond",
            icon: "Shield",
          },
          {
            label: "Patient satisfaction",
            value: "98%",
            helper:
              "A service standard built around clarity, comfort, and continuity",
            icon: "Clock",
          },
          {
            label: "Languages supported",
            value: "15+",
            helper:
              "Multilingual communication for patients, companions, and families",
            icon: "Plane",
          },
        ],
      },
      {
        type: "featureGrid",
        eyebrow: "How Planning Works",
        heading: "Your Care N Tour journey, step by step",
        description:
          "A seamless process designed to make medical tourism in Egypt feel organized, transparent, and fully supported.",
        columns: 3,
        variant: "cards",
        items: [
          {
            tag: "01",
            icon: "FileSearch",
            title: "Initial consultation",
            description:
              "Share your medical goals, treatment interests, and preferred timeline so our coordinators can understand your case and advise on the next step.",
          },
          {
            tag: "02",
            icon: "ClipboardList",
            title: "Medical evaluation",
            description:
              "Your records are reviewed with the relevant specialists so we can help shape a treatment plan, expected timeline, and preliminary guidance.",
          },
          {
            tag: "03",
            icon: "CalendarCheck",
            title: "Travel planning",
            description:
              "We coordinate visa guidance, accommodation, airport transfers, and travel logistics around your medical schedule and recovery needs.",
          },
          {
            tag: "04",
            icon: "BadgeCheck",
            title: "Arrival and treatment",
            description:
              "You arrive to dedicated on-ground support, settle into your stay, and move through consultations and treatment with one coordination team beside you.",
          },
          {
            tag: "05",
            icon: "Hotel",
            title: "Recovery support",
            description:
              "Recovery arrangements are planned around your procedure, comfort, follow-up visits, and any companion or family requirements.",
          },
          {
            tag: "06",
            icon: "HeartHandshake",
            title: "Follow-up continuity",
            description:
              "Even after you return home, Care N Tour helps maintain communication, follow-up coordination, and continuity with your treating team.",
          },
        ],
      },
      {
        type: "startJourneyEmbed",
        eyebrow: "Start Your Journey",
        heading:
          "Share your treatment goals, medical history, and travel preferences in one guided intake.",
        description:
          "This guided form helps our team assess treatment suitability, timing, accommodation needs, companion travel, and the practical steps required for your medical trip to Egypt.",
        supportCardTitle: "What happens after you submit?",
        supportCardDescription:
          "Our international patient team reviews your case, confirms any missing records, and prepares a coordinated treatment and travel recommendation.",
        supportBullets: [
          "Medical coordinators review diagnosis, treatment goals, and preferred timing",
          "The team shortlists suitable providers and clarifies any missing documents",
          "Travel planners align accommodation, airport transfers, and companion needs",
          "You receive clear next steps for consultation, scheduling, and arrival planning",
        ],
        responseTimeLabel: "Initial follow-up: typically within hours",
        reassuranceLabel:
          "Submitting your intake is free and carries no booking obligation",
        advanced: {
          anchorId: "start-journey-intake",
        },
      },
      {
        type: "tabbedGuide",
        eyebrow: "Planning Essentials",
        badge: "Before You Travel",
        heading:
          "Before you travel with Care N Tour, we help you prepare every essential step.",
        description:
          "Our team supports patients and families with the travel preparation, recovery planning, and local coordination needed for a smoother medical journey to Egypt.",
        tabs: [
          {
            id: "entry-visa",
            label: "Entry & Visa",
            icon: "FileText",
            heading:
              "Care N Tour helps you prepare the travel documents needed before departure.",
            description:
              "We guide patients on passport readiness, common visa routes, and the medical records typically needed before treatment dates are confirmed.",
            sections: [
              {
                type: "cardGrid",
                columns: 2,
                cards: [
                  {
                    title: "Visa and entry guidance",
                    description:
                      "Our coordinators help patients understand the usual entry pathway for their nationality and treatment schedule.",
                    icon: "Globe",
                    bullets: [
                      "Visa requirements can vary by passport and expected length of stay",
                      "Many patients travel on tourist or e-visa routes where eligible",
                      "Passports should usually remain valid for at least six months",
                      "Longer treatment journeys may need extra travel planning",
                    ],
                  },
                  {
                    title: "What our team may ask you to prepare",
                    description:
                      "Preparing these items early helps Care N Tour move faster with hospitals, doctors, and scheduling.",
                    icon: "FolderCheck",
                    bullets: [
                      "Passport copy",
                      "Medical reports, scans, and lab results",
                      "Current medications, allergies, and medical history",
                      "Preferred travel dates and companion details",
                    ],
                  },
                ],
              },
              {
                type: "cta",
                eyebrow: "Need help with documents?",
                title: "Speak with the Care N Tour team",
                description:
                  "We can explain what documents to prepare before you confirm treatment dates, flights, and accommodation.",
                actions: [
                  { label: "Contact our team", href: "/contact" },
                  {
                    label: "View travel info",
                    href: "/travel-info",
                    variant: "outline",
                  },
                ],
              },
            ],
          },
          {
            id: "stay-recovery",
            label: "Stay & Recovery",
            icon: "Hotel",
            heading:
              "We help you plan a stay that fits your treatment schedule and recovery needs.",
            description:
              "Care N Tour coordinates accommodation and recovery planning around the procedure, follow-up visits, mobility requirements, and companion travel.",
            sections: [
              {
                type: "infoPanels",
                panels: [
                  {
                    title: "How we approach recovery stays",
                    items: [
                      "We help identify hotels or apartments based on hospital proximity, comfort, and the type of recovery support required.",
                      "For procedures with follow-up visits or mobility considerations, we may recommend a longer and more recovery-friendly stay.",
                      "Companion rooms, dietary preferences, and quieter environments can be planned in advance.",
                    ],
                  },
                  {
                    title: "What Care N Tour aligns before arrival",
                    items: [
                      "Arrival timing around consultation, testing, and admission",
                      "Procedure and discharge timing in relation to hotel arrangements",
                      "Recovery days in relation to follow-up care and return travel",
                    ],
                  },
                ],
              },
              {
                type: "cta",
                eyebrow: "Recovery logistics",
                title: "Explore the full travel guide",
                description:
                  "Explore more destination, accommodation, and visitor guidance for patients traveling with Care N Tour.",
                actions: [
                  {
                    label: "Open travel guide",
                    href: "/travel-info",
                  },
                ],
              },
            ],
          },
          {
            id: "on-ground-support",
            label: "On-Ground Support",
            icon: "Car",
            heading:
              "From the moment you arrive, Care N Tour stays involved on the ground.",
            description:
              "Our local coordination helps patients and companions move through arrival, appointments, treatment, and recovery with more confidence and less friction.",
            sections: [
              {
                type: "cardGrid",
                columns: 2,
                cards: [
                  {
                    title: "Transfers and transportation",
                    icon: "Car",
                    bullets: [
                      "Airport pickup and return transfer planning",
                      "Hospital, clinic, hotel, and pharmacy transfers coordinated in advance",
                      "Daily movement aligned with consultation, treatment, and discharge timing",
                    ],
                  },
                  {
                    title: "Patient and family support",
                    icon: "Languages",
                    bullets: [
                      "One Care N Tour coordination team for patients and companions",
                      "Multilingual communication before treatment, during the stay, and after discharge",
                      "Ongoing support through recovery and after the patient returns home",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "trustSignals",
        eyebrow: "Why Patients Trust The Process",
        heading: "The Care N Tour difference goes beyond booking appointments.",
        description:
          "Our service model combines medical credibility, concierge support, and international patient care in one experience.",
        items: [
          {
            eyebrow: "01",
            title: "Accredited provider coordination",
            description:
              "We connect patients with trusted doctors, accredited hospitals, and carefully selected treatment partners in Egypt.",
            icon: "Route",
          },
          {
            eyebrow: "02",
            title: "Medical concierge support",
            description:
              "Patients receive clear guidance across consultation, treatment planning, travel preparation, and on-ground coordination.",
            icon: "MessagesSquare",
          },
          {
            eyebrow: "03",
            title: "Premium travel coordination",
            description:
              "Accommodation, airport transfers, local transport, and recovery-friendly arrangements are handled with comfort and convenience in mind.",
            icon: "HeartHandshake",
          },
          {
            eyebrow: "04",
            title: "Continuity before and after treatment",
            description:
              "Support continues before departure, during the stay in Egypt, and through the follow-up stage after the patient returns home.",
            icon: "Shield",
          },
        ],
      },
      {
        type: "faq",
        eyebrow: "Planning Questions",
        heading:
          "Questions international patients commonly ask before submitting their case",
        description:
          "These answers are written for high-intent patient queries around medical travel to Egypt, treatment planning, and recovery logistics.",
        layout: "twoColumn",
        items: [
          {
            question:
              "What do I need to plan medical travel to Egypt with Care N Tour?",
            answer:
              "Before you start, it helps to have a passport copy, relevant medical reports, scans or lab results, your treatment goal, and preferred travel dates. If some records are missing, the Care N Tour team can still advise on the next best step.",
          },
          {
            question:
              "Can I start planning if I am still comparing treatments or doctors?",
            answer:
              "Yes. Many international patients begin with a broad treatment goal rather than a final doctor selection. Care N Tour can review your case, explain suitable treatment pathways, and help narrow the right provider options in Egypt.",
          },
          {
            question:
              "Does Care N Tour arrange accommodation, airport transfers, and companion travel?",
            answer:
              "Yes. Planning support can include recovery-friendly accommodation, airport pickup, local transfers, and arrangements for family members or companions traveling with the patient.",
          },
          {
            question:
              "How does visa guidance work for medical travel to Egypt?",
            answer:
              "Visa requirements depend on nationality and trip length. Care N Tour helps patients understand the common visa route for their case, the documents usually needed before departure, and any extra planning required for longer medical stays.",
          },
          {
            question:
              "How fast will I receive a response after submitting the intake?",
            answer:
              "The team aims to follow up within hours for most complete submissions. Response time can vary by case complexity, specialty, and whether additional medical records are needed for review.",
          },
          {
            question:
              "What happens after I submit my treatment and travel request?",
            answer:
              "After submission, the team reviews your medical and travel information, requests any missing documents, shortlists suitable providers when appropriate, and sends clear next steps for consultation, scheduling, and trip planning.",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Prefer To Speak First?",
        heading:
          "Talk to our international patient team before you complete the intake.",
        description:
          "If you want a quick conversation first, our coordinators can explain the process, required records, likely timelines, and how treatment planning in Egypt works.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Book a consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Contact our team",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "travel-info",
    name: "Travel Info Guide",
    description:
      "Corporate travel information page built from reusable CMS blocks.",
    defaultSlug: "travel-info",
    defaultTitle: "Travel Information",
    seo: {
      title:
        "Travel Information for International Patients Visiting Egypt | Care N Tour",
      description:
        "Review entry planning, accommodation, local mobility, payments, language support, and recovery-focused travel guidance for medical trips to Egypt with Care N Tour.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Travel Information",
        heading:
          "Medical travel information for international patients planning treatment in Egypt.",
        description:
          "At Care N Tour, we help international patients and families prepare for medical travel to Egypt with clearer guidance on entry planning, accommodation, recovery, local mobility, and companion support.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Entry",
            label:
              "Egypt entry pathways, document planning, and case-specific travel timing explained clearly",
          },
          {
            kicker: "Stay",
            label:
              "Recovery-focused accommodation and companion planning aligned with consultations, procedures, and follow-up",
          },
          {
            kicker: "Coordination",
            label:
              "One Care N Tour coordination team connecting treatment planning, travel preparation, and on-ground support",
          },
        ],
        primaryAction: {
          label: "Start your journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Plan your trip",
          href: "/plan",
          variant: "hero",
        },
      },
      {
        type: "advisoryNotice",
        eyebrow: "Before You Book",
        heading:
          "Use this Care N Tour guide to prepare for medical travel to Egypt, then let us confirm the travel details for your case.",
        description:
          "We publish this travel information for international patients, companions, and family decision-makers planning treatment in Egypt through Care N Tour. Entry route, expected stay, recovery accommodation, and return timing all depend on passport nationality, procedure type, and medical clearance.",
        tone: "info",
        lastReviewed:
          "Reviewed March 2026 by Care N Tour international patient coordinators",
        appliesTo:
          "International patients, companions, and family decision-makers planning consultations, procedures, surgery, or recovery stays in Egypt",
        planningScope:
          "Practical planning guidance for medical travel to Egypt. Final visa pathway, supporting documents, treatment timing, and fit-to-fly considerations are confirmed individually by Care N Tour and the relevant providers.",
        disclaimer:
          "Do not issue flights, pay non-refundable accommodation, or lock return dates until we confirm your treatment timeline, likely entry route, and expected recovery window.",
        items: [
          "Send us your passport nationality, preferred travel window, treatment goal, and companion details early so we can guide the most realistic preparation path.",
          "Patients traveling for surgery, fertility treatment, dental rehabilitation, cardiology, or longer recovery usually need different stay planning than patients coming for short consultations or minimally invasive procedures.",
          "We monitor official Egypt entry information, including e-visa and visa-on-arrival pathways, and we update this guide when rules affecting international patients change.",
        ],
      },
      {
        type: "statGrid",
        eyebrow: "At A Glance",
        heading: "A travel planning model built for international patients",
        description:
          "We combine medical coordination with practical travel preparation so patients can move from research to confirmed plans with less uncertainty.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Languages supported",
            value: "15+",
            helper:
              "Multilingual communication across planning, arrival, and follow-up",
            icon: "Languages",
          },
          {
            label: "Coordination window",
            value: "24/7",
            helper:
              "Responsive communication across preparation, arrival, and follow-up",
            icon: "Clock3",
          },
          {
            label: "Journey coverage",
            value: "End-to-End",
            helper:
              "Treatment planning, local logistics, companion support, and recovery coordination",
            icon: "Route",
          },
          {
            label: "Stay planning",
            value: "Short To Extended",
            helper:
              "Accommodation and return-travel guidance shaped around the treatment pathway",
            icon: "Plane",
          },
        ],
      },
      {
        type: "tabbedGuide",
        eyebrow: "Travel Guide",
        badge: "Patient Preparation",
        heading:
          "The travel information international patients usually need before coming to Egypt for treatment",
        description:
          "At Care N Tour, we organize this medical travel guide around the questions patients and families ask most often when planning treatment in Egypt, so the information stays clear, searchable, and useful for both people and AI systems.",
        tabs: [
          {
            id: "entry-visa",
            label: "Entry & Visa",
            icon: "FileText",
            heading:
              "Confirm the most realistic Egypt entry route before you commit to flights.",
            description:
              "Egypt entry requirements depend on passport nationality, stay length, and how your treatment timeline is structured. We help patients understand whether e-visa, visa-on-arrival, or consular planning is the more realistic path before travel is finalized.",
            sections: [
              {
                type: "dataGrid",
                title:
                  "Common entry-planning routes for medical travel to Egypt",
                description:
                  "These routes are intended to orient international patients early. Final eligibility should always be confirmed against the official Egypt e-Visa portal, consular guidance, and your Care N Tour treatment schedule.",
                layout: "stacked",
                pillColumnKey: "route",
                columns: [
                  { key: "route", label: "Typical route" },
                  { key: "bestFor", label: "Often used for" },
                  { key: "prepare", label: "What to prepare" },
                  { key: "support", label: "How we help" },
                ],
                rows: [
                  {
                    title: "Patients eligible for e-visa pathways",
                    values: {
                      route: "E-visa",
                      bestFor:
                        "Planned treatment trips with a clear travel window and eligible passport",
                      prepare:
                        "Passport with sufficient validity, digital documents, and expected stay details",
                      support:
                        "We help you prepare the likely document set and align application timing with consultations, procedures, and recovery.",
                    },
                  },
                  {
                    title: "Patients using airport-arrival visa routes",
                    values: {
                      route: "Visa on arrival",
                      bestFor:
                        "Short stays where nationality, itinerary, and official rules allow it",
                      prepare:
                        "Passport, return-travel details, accommodation details, and supporting documents",
                      support:
                        "We confirm whether this route looks practical for your case before tickets or accommodation are locked in.",
                    },
                  },
                  {
                    title: "Patients planning longer or multi-step stays",
                    values: {
                      route: "Case-dependent",
                      bestFor:
                        "Extended recovery, staged procedures, repeat visits, or complex treatment pathways",
                      prepare:
                        "Earlier planning around length of stay, follow-up visits, accommodation, and return travel",
                      support:
                        "We align entry planning with provider scheduling, recovery milestones, and the safest return-travel window.",
                    },
                  },
                  {
                    title:
                      "Patients who may need consular processing before departure",
                    values: {
                      route: "Consular route",
                      bestFor:
                        "Passport categories or travel scenarios that require advance approval",
                      prepare:
                        "Passport, treatment-planning documents, supporting letters, and more lead time before departure",
                      support:
                        "We help you understand the planning sequence so medical scheduling does not move ahead of travel clearance.",
                    },
                  },
                ],
              },
              {
                type: "callout",
                tone: "info",
                title:
                  "Confirm entry eligibility before you finalize any non-refundable booking.",
                body: "Official Egypt travel rules can change, and the right route depends on your passport and case timeline. Care N Tour recommends checking the official Egypt e-Visa portal or consular guidance first, then confirming the travel sequence with our team before flights are booked.",
                bullets: [
                  "Keep a passport that meets current validity requirements.",
                  "Have your expected treatment dates and stay length ready before you apply.",
                  "Share companion details early if a family member will travel with you.",
                ],
              },
              {
                type: "cta",
                eyebrow: "Need case-specific guidance?",
                title:
                  "Send us your passport country, treatment goal, and expected travel window.",
                description:
                  "Our international patient coordinators can help you understand the most practical entry-planning route before you commit to flights or accommodation.",
                actions: [
                  {
                    label: "Start your journey",
                    href: "/start-journey",
                  },
                  {
                    label: "Contact our team",
                    href: "/contact",
                    variant: "outline",
                  },
                ],
              },
            ],
          },
          {
            id: "before-you-travel",
            label: "Before You Travel",
            icon: "ClipboardList",
            heading:
              "Prepare medical records, travel documents, and practical trip details before departure.",
            description:
              "Good preparation reduces delays, helps providers review the case faster, and makes medical travel to Egypt easier to coordinate with confidence.",
            sections: [
              {
                type: "cardGrid",
                columns: 3,
                cards: [
                  {
                    title: "Documents and medical records",
                    icon: "FolderCheck",
                    bullets: [
                      "Passport copy and core travel identity documents",
                      "Medical reports, scans, prescriptions, diagnoses, and allergy notes",
                      "Contact details for the patient and any companion traveling",
                    ],
                  },
                  {
                    title: "Timing and treatment scheduling",
                    icon: "CalendarCheck",
                    bullets: [
                      "Preferred consultation and procedure timing",
                      "Likely recovery window before you return home",
                      "Any work, school, caregiver, or companion timing constraints",
                    ],
                  },
                  {
                    title: "Companion planning",
                    icon: "Users",
                    bullets: [
                      "Who is traveling with the patient and when they arrive",
                      "Preferred hotel room arrangement or serviced-apartment setup",
                      "Support needed on treatment days, discharge days, or transfer days",
                    ],
                  },
                ],
              },
              {
                type: "compactList",
                title:
                  "Recommended preparation sequence for international patients",
                description:
                  "A simple sequence helps you avoid booking too early, missing documents, or misaligning travel with recovery.",
                icon: "ListChecks",
                rows: [
                  {
                    title: "Share your case and your broad travel window",
                    description:
                      "Start with medical records, passport nationality, treatment goals, and the broad timing you are considering.",
                    pill: "Step 1",
                  },
                  {
                    title: "Confirm the likely treatment timeline",
                    description:
                      "Make sure the consultation, procedure, admission, and likely recovery schedule are realistic before you book flights or extended stays.",
                    pill: "Step 2",
                  },
                  {
                    title: "Prepare documents and stay preferences",
                    description:
                      "Clarify the documents, accommodation format, and companion support you will need on the ground before travel is finalized.",
                    pill: "Step 3",
                  },
                  {
                    title: "Finalize arrival and first-day logistics",
                    description:
                      "Airport pickup, accommodation check-in, and first appointment timing should be aligned together so arrival feels controlled and low-friction.",
                    pill: "Step 4",
                  },
                ],
              },
            ],
          },
          {
            id: "stay-recovery",
            label: "Stay & Recovery",
            icon: "Hotel",
            heading:
              "Choose accommodation and recovery timing around the medical plan, not only around price.",
            description:
              "The right recovery stay depends on the procedure, expected mobility, follow-up schedule, and whether a companion or family member is traveling with you. At Care N Tour, we help patients balance comfort, proximity to care, privacy, and practicality.",
            sections: [
              {
                type: "infoPanels",
                title: "Recovery stay formats we commonly coordinate",
                panels: [
                  {
                    title: "Recovery-oriented hotels",
                    description:
                      "Well suited to shorter stays, executive travelers, and patients who want high service levels with less operational complexity.",
                    items: [
                      "Easy coordination around appointments, airport transfers, and daily movement",
                      "Daily housekeeping, on-site service, and easier front-desk support",
                      "Useful when comfort, speed, and convenience matter more than extra living space",
                    ],
                  },
                  {
                    title: "Serviced apartments",
                    description:
                      "Often preferred for longer recovery stays, companion travel, or patients who want more privacy and residential comfort.",
                    items: [
                      "More living space, privacy, and flexibility for day-to-day recovery",
                      "Useful when meal preparation, laundry access, or a quieter routine matters",
                      "Helpful when the patient is expected to stay beyond a short post-procedure window",
                    ],
                  },
                  {
                    title: "Companion and family stays",
                    description:
                      "Best when a patient needs a more supportive setup with family, caregivers, or a longer bedside presence.",
                    items: [
                      "Room configuration can be planned around companion needs and daily support",
                      "Location should support both recovery comfort and hospital or clinic access",
                      "Calmer environments matter more when recovery will be intensive or mobility is limited",
                    ],
                  },
                ],
              },
              {
                type: "callout",
                tone: "muted",
                title:
                  "Return-travel timing should follow medical readiness, not the cheapest ticket window.",
                body: "Patients often need a clearer view of discharge timing, follow-up visits, wound care, mobility expectations, and fit-to-fly guidance before return travel is finalized.",
              },
            ],
          },
          {
            id: "arrival-local-mobility",
            label: "Arrival & Local Mobility",
            icon: "MapPinned",
            heading:
              "Plan how you will move through arrival, consultations, treatment, and follow-up in Egypt.",
            description:
              "Local movement in Cairo or other treatment cities should be aligned with the medical schedule so patients can focus on treatment and recovery rather than day-to-day transport problems.",
            sections: [
              {
                type: "cardGrid",
                columns: 3,
                cards: [
                  {
                    title: "Airport arrival",
                    icon: "PlaneLanding",
                    bullets: [
                      "Pickup timing should match the confirmed arrival itinerary exactly",
                      "Companion count, luggage needs, and mobility support should be known in advance",
                      "Late-night or delayed arrivals may affect first-day scheduling and check-in planning",
                    ],
                  },
                  {
                    title: "In-city transfers",
                    icon: "CarFront",
                    bullets: [
                      "Travel time within Cairo can vary significantly by district and time of day",
                      "Hotel, hospital, clinic, imaging, and pharmacy visits should be planned together",
                      "Mobility after treatment may change the vehicle type or assistance required",
                    ],
                  },
                  {
                    title: "Appointment-day coordination",
                    icon: "Clock3",
                    bullets: [
                      "Transfer timing should account for registration, security, and waiting periods",
                      "Follow-up visits may require shorter but repeated journeys during recovery",
                      "Discharge-day and recovery-day movement should be planned conservatively, not aggressively",
                    ],
                  },
                ],
              },
              {
                type: "compactList",
                title: "What Care N Tour aligns on the ground",
                rows: [
                  {
                    title: "Arrival timing",
                    description:
                      "We coordinate arrival details with the first consultation, diagnostic visit, or admission milestone.",
                  },
                  {
                    title: "Daily movement",
                    description:
                      "Hotel, clinic, hospital, and follow-up visits are planned around the confirmed medical schedule, not left to ad-hoc transport decisions.",
                  },
                  {
                    title: "Departure readiness",
                    description:
                      "Return transfer planning reflects discharge timing, airport distance, and the patient’s condition at departure.",
                  },
                ],
              },
            ],
          },
          {
            id: "payments-language",
            label: "Money & Daily Life",
            icon: "Languages",
            heading:
              "Know the practical basics for payments, communication, climate, and day-to-day comfort.",
            description:
              "International patients usually want the simple operational details that make treatment travel feel predictable. We keep this section practical so patients and companions can arrive better prepared.",
            sections: [
              {
                type: "infoPanels",
                title: "Practical local information for medical travelers",
                panels: [
                  {
                    title: "Payments and currency",
                    items: [
                      "The Egyptian Pound (EGP) is the local currency used for everyday spending.",
                      "Many hospitals, hotels, and larger urban venues accept card payments, but some cash is still useful for smaller daily needs.",
                      "We recommend keeping payment planning simple and confirming what will be paid in advance versus locally on the ground.",
                    ],
                  },
                  {
                    title: "Language and connectivity",
                    items: [
                      "Arabic is the official language in Egypt, while English is widely understood in international patient and hospitality environments.",
                      "Local SIM cards and mobile connectivity are usually easy to arrange after arrival if needed.",
                      "Care N Tour supports multilingual coordination for international patients and families across multiple markets.",
                    ],
                  },
                  {
                    title: "Climate and clothing",
                    items: [
                      "Egypt is generally warm and sunny, but temperatures vary by season and region.",
                      "Patients should pack around the treatment plan, mobility needs, and expected recovery stage, not only around sightseeing plans.",
                      "Light clothing is usually practical, with added layers for air-conditioned interiors or cooler evenings in some seasons.",
                    ],
                  },
                  {
                    title: "Daily comfort in Cairo",
                    items: [
                      "Travel time can vary, so appointment days should stay lightly planned outside medical activity.",
                      "Companion support matters more when recovery is expected to be longer, more intensive, or mobility-limited.",
                      "A calm stay close to care is usually better for recovery than optimizing only for sightseeing or nightlife.",
                    ],
                  },
                ],
              },
              {
                type: "callout",
                tone: "info",
                title:
                  "Practical comfort improves treatment readiness and recovery confidence.",
                body: "Clear communication, realistic daily schedules, and recovery-appropriate accommodation often make the medical journey feel safer, easier, and more manageable for both patients and companions.",
              },
            ],
          },
        ],
      },
      {
        type: "serviceCatalog",
        eyebrow: "How Care N Tour Supports The Journey",
        heading: "The travel support we coordinate around treatment in Egypt",
        description:
          "At Care N Tour, our role is not limited to connecting patients with doctors and hospitals. We also coordinate the travel, accommodation, arrival, companion, and continuity details that make medical travel to Egypt feel structured, credible, and easier to manage.",
        items: [
          {
            title: "Entry, visa, and documentation support",
            description:
              "We help international patients understand the likely Egypt entry route for their case and prepare the documents that usually need to be in place before treatment dates and flights are confirmed.",
            icon: "FileText",
            availability: "Before departure",
            bullets: [
              "Guidance on common e-visa, visa-on-arrival, or consular planning pathways",
              "Passport, medical-record, and travel-readiness checks before booking milestones",
              "Case-specific preparation aligned with treatment timing, stay length, and companion travel",
            ],
            languages: ["English", "Arabic", "French", "German"],
            note: "We frame entry planning around the patient's actual passport, medical timeline, and recovery needs rather than generic assumptions.",
            action: {
              label: "Contact our team",
              href: "/contact",
              variant: "outline",
            },
          },
          {
            title: "Accommodation and recovery planning",
            description:
              "We shape accommodation and stay planning around the procedure, expected recovery timeline, mobility needs, and the practical requirements of the patient and any companion.",
            icon: "Hotel",
            availability: "Before arrival through recovery",
            bullets: [
              "Recovery-friendly hotel and serviced-apartment planning",
              "Accommodation matched to hospital access, privacy, comfort, and expected recovery intensity",
              "Support for companion rooms, extended stays, and return-travel timing after treatment",
            ],
            languages: ["English", "Arabic", "Spanish"],
            note: "We treat recovery logistics as part of the medical journey, not as a separate booking exercise.",
            action: {
              label: "Plan your trip",
              href: "/plan",
              variant: "outline",
            },
          },
          {
            title: "Airport, local transport, and appointment mobility",
            description:
              "We coordinate practical movement through arrival, consultations, treatment, diagnostics, and follow-up so the medical journey stays synchronized on the ground in Egypt.",
            icon: "Car",
            availability: "Arrival to departure",
            bullets: [
              "Airport pickup, return transfer, and arrival-day coordination",
              "Transport aligned with appointment times, admission milestones, and recovery requirements",
              "On-ground coordination between hotel, hospital, clinic, imaging, pharmacy, and follow-up visits",
            ],
            languages: ["English", "Arabic", "Italian"],
            note: "The goal is to remove operational friction so patients can focus on treatment and recovery rather than transport logistics.",
            action: {
              label: "Start your journey",
              href: "/start-journey",
              variant: "default",
            },
          },
          {
            title: "Companion and continuity support",
            description:
              "We help patients, companions, and families stay informed before arrival, during treatment in Egypt, and as discharge, follow-up, and return-home planning approach.",
            icon: "MessagesSquare",
            availability: "Throughout the journey",
            bullets: [
              "Companion planning and practical support around the patient stay",
              "Clear updates on travel, scheduling, treatment logistics, and next operational steps",
              "Continuity planning for discharge, follow-up, documentation, and return travel",
            ],
            languages: ["English", "Arabic", "German", "Portuguese"],
            note: "This helps keep the wider journey coherent when several family members, coordinators, or decision-makers are involved.",
            action: {
              label: "View concierge services",
              href: "/concierge",
              variant: "outline",
            },
          },
        ],
      },
      {
        type: "trustSignals",
        eyebrow: "Operating Standard",
        heading:
          "Why international patients trust Care N Tour for travel preparation as well as treatment coordination in Egypt",
        description:
          "At Care N Tour, we coordinate the operational side of medical travel to Egypt with the same discipline we bring to provider access, so patients and families can move from research to arrival with more clarity, continuity, and confidence.",
        items: [
          {
            eyebrow: "01",
            title: "Case-specific planning before you book",
            description:
              "We review the likely entry route, recovery stay format, companion needs, and realistic travel timing before you commit to flights, accommodation, or treatment dates.",
            icon: "FileCheck",
          },
          {
            eyebrow: "02",
            title: "Travel logistics aligned with the treatment pathway",
            description:
              "Visa planning, accommodation, airport transfers, local mobility, and return timing are coordinated around consultations, procedures, follow-up, and recovery.",
            icon: "Route",
          },
          {
            eyebrow: "03",
            title: "Support for patients, companions, and families",
            description:
              "We keep the wider journey organized with practical support around arrival, stay logistics, discharge planning, and continuity after treatment in Egypt.",
            icon: "Users",
          },
          {
            eyebrow: "04",
            title:
              "Multilingual communication built for international expectations",
            description:
              "Our coordination model is built for multinational patients and families who need clear updates, responsive planning, and confident communication across markets and languages.",
            icon: "Languages",
          },
        ],
      },
      {
        type: "faq",
        eyebrow: "Travel Questions",
        heading:
          "Questions international patients commonly ask before medical travel to Egypt",
        description:
          "These answers explain how Care N Tour helps patients and families prepare for visas, accommodation, recovery planning, local transport, and companion travel before treatment in Egypt.",
        layout: "twoColumn",
        items: [
          {
            question:
              "What travel information should I review before planning treatment in Egypt?",
            answer:
              "Before planning treatment in Egypt, review the likely entry route for your passport, expected stay length, accommodation needs, local transport planning, companion travel, and how recovery timing could affect your return journey. At Care N Tour, we help connect all of those travel decisions to your consultation, procedure, and follow-up schedule so the journey is planned as one coordinated pathway.",
          },
          {
            question: "Does Care N Tour help with visa and travel preparation?",
            answer:
              "Yes. Care N Tour helps international patients understand the most realistic Egypt entry pathway for their case, the common documents to prepare, and when travel planning should move forward in relation to the treatment timeline. Final visa eligibility still depends on passport nationality and current official Egypt requirements.",
          },
          {
            question: "How long should I plan to stay in Egypt for treatment?",
            answer:
              "Length of stay depends on the procedure, medical review, follow-up needs, recovery progress, and whether you should remain in Egypt before flying home. We help patients estimate a realistic travel window before flights, accommodation, and companion arrangements are finalized.",
          },
          {
            question:
              "Can Care N Tour arrange accommodation for recovery after treatment?",
            answer:
              "Yes. We can help coordinate recovery-friendly hotels, serviced apartments, and companion-ready stays based on the procedure, expected recovery period, comfort preferences, privacy needs, and proximity to the treating hospital or clinic.",
          },
          {
            question:
              "What kind of local transport support can Care N Tour coordinate?",
            answer:
              "Care N Tour can coordinate airport pickup, return transfers, and local movement between your hotel, hospital, clinic, imaging appointments, pharmacy stops, and follow-up visits. The goal is to keep transport aligned with your medical schedule and recovery needs, not left to last-minute arrangements.",
          },
          {
            question: "Can a family member or companion travel with me?",
            answer:
              "Yes. Many international patients travel with a family member or companion. We recommend planning the companion's documents, room setup, arrival timing, and on-ground support early, especially when the treatment pathway or recovery period is more complex.",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Plan With Care N Tour",
        heading:
          "Speak with our team before you confirm flights, accommodation, or treatment timing.",
        description:
          "We help connect the medical pathway to the travel pathway so patients and families can commit with better clarity.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Start your journey",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Contact our team",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "operations-overview",
    name: "Operations Overview",
    description: "Hero, stat highlights, and CTA ready for team pages.",
    defaultSlug: "operations",
    defaultTitle: "Operations Team",
    seo: {
      title: "Operations Team | Care N Tour",
      description:
        "Meet the Care N Tour operations team keeping journeys coordinated and seamless.",
    },
    blocks: [
      {
        type: "hero",
        eyebrow: "Operations",
        heading: "Meet the team behind every successful journey",
        highlight: "Care without compromise",
        description:
          "Our coordinators orchestrate medical, travel, and hospitality details so patients focus on recovery.",
        alignment: "left",
        background: "white",
        containerWidth: "wide",
        primaryAction: {
          label: "Talk to operations",
          href: "/contact",
          variant: "default",
        },
        secondaryAction: {
          label: "View concierge services",
          href: "/concierge",
          variant: "secondary",
        },
      },
      {
        type: "statGrid",
        columns: 3,
        emphasizeValue: true,
        items: [
          { label: "Coordinators", value: "25+" },
          { label: "Avg. response time", value: "15 min" },
          { label: "Countries handled", value: "40" },
        ],
      },
      {
        type: "featureGrid",
        columns: 3,
        variant: "cards",
        items: [
          {
            title: "Itinerary control",
            description:
              "Dedicated trip managers ensure transfers, lodging, and clinic visits are synchronized.",
          },
          {
            title: "Medical liaisons",
            description:
              "Bilingual coordinators keep specialists and patients aligned across time zones.",
          },
          {
            title: "24/7 assurance",
            description:
              "Real-time monitoring and escalation paths for every stage of the journey.",
          },
        ],
      },
      {
        type: "doctors",
        title: "Operations leadership",
        description:
          "Meet the coordinators orchestrating travel, medical, and hospitality logistics.",
        layout: "carousel",
        limit: 6,
        featuredOnly: true,
      },
      {
        type: "callToAction",
        heading: "Plan your treatment journey with our operations team",
        description:
          "Share your timeline and we will build a bespoke travel and care plan in under 24 hours.",
        layout: "centered",
        background: "muted",
        actions: [
          {
            label: "Book coordination call",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Download playbook",
            href: "/travel-info",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "campaign-landing",
    name: "Campaign Landing",
    description: "High-impact hero, benefits grid, testimonials, and FAQ.",
    defaultSlug: "campaign",
    defaultTitle: "Campaign Landing",
    seo: {
      title: "Campaign Landing | Care N Tour",
      description:
        "Convert visitors with a compelling hero, benefits, and testimonials layout.",
    },
    blocks: [
      {
        type: "hero",
        eyebrow: "Medical travel offer",
        heading: "Transform your care experience",
        highlight: "Personalized treatment packages",
        description:
          "Bundle flights, accommodation, and world-class medical expertise with concierge guidance.",
        alignment: "center",
        background: "muted",
        containerWidth: "wide",
        primaryAction: {
          label: "Start your plan",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Download brochure",
          href: "/travel-info",
          variant: "secondary",
        },
      },
      {
        type: "featureGrid",
        columns: 3,
        variant: "cards",
        items: [
          {
            title: "Accredited hospitals",
            description:
              "JCI-certified providers with translators and bedside support.",
          },
          {
            title: "Transparent pricing",
            description:
              "Upfront quotes with no surprise fees across treatments and travel.",
          },
          {
            title: "Recovery comfort",
            description:
              "Partner hotels and recovery suites tailored to medical needs.",
          },
        ],
      },
      {
        type: "treatments",
        title: "Featured treatments",
        description: "Curated procedures aligned with this campaign.",
        layout: "carousel",
        limit: 6,
        featuredOnly: true,
      },
      {
        type: "quote",
        quote:
          "Care N Tour organized every detail, letting us focus entirely on recovery.",
        attribution: "Layla, Knee Replacement",
        highlight: "5-star experience from arrival to discharge.",
      },
      {
        type: "faq",
        layout: "twoColumn",
        items: [
          {
            question: "What is included in a package?",
            answer:
              "Treatment planning, travel logistics, accommodation recommendations, and on-ground support.",
          },
          {
            question: "How quickly can we start?",
            answer:
              "Most treatment journeys can be coordinated within 7-10 days once medical records are received.",
          },
          {
            question: "Can family travel too?",
            answer:
              "Yes, we coordinate companion stays and activities while the patient is receiving care.",
          },
          {
            question: "Do you support visa assistance?",
            answer:
              "Our team provides invitation letters and step-by-step guidance for medical visa approvals.",
          },
        ],
      },
      {
        type: "callToAction",
        heading: "Ready to design your medical journey?",
        description:
          "Share your goals and our medical travel specialists will craft a personalized itinerary.",
        layout: "centered",
        background: "accent",
        actions: [
          {
            label: "Book consultation",
            href: "/consultation",
            variant: "default",
          },
        ],
      },
    ],
  },
  {
    slug: "concierge-global",
    name: "Concierge Page",
    description:
      "Corporate international patient services page with concierge operations, travel support, and guided intake.",
    defaultSlug: "concierge",
    defaultTitle: "Concierge",
    seo: {
      title: "International Patient Concierge Services | Care N Tour",
      description:
        "Explore Care N Tour concierge services for international patients, including medical coordination, travel planning, accommodation, airport transfers, multilingual support, and recovery logistics in Egypt.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "International Patient Concierge",
        heading:
          "International patient services coordinated with the structure, clarity, and responsiveness global families expect.",
        description:
          "At Care N Tour, we coordinate the non-clinical side of treatment with the same discipline patients expect from a multinational healthcare partner. We align medical scheduling, travel preparation, accommodation, airport transfers, communication support, and recovery logistics through one connected service model.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Coverage",
            label:
              "Medical coordination, travel planning, accommodation, transfers, companion support, and recovery logistics",
          },
          {
            kicker: "Model",
            label:
              "One operational team aligning treatment milestones with every practical step around them",
          },
          {
            kicker: "Audience",
            label:
              "Designed for international patients, families, and decision-makers comparing treatment abroad",
          },
        ],
        primaryAction: {
          label: "Start your journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Plan your trip",
          href: "/plan",
          variant: "hero",
        },
      },
      {
        type: "storyNarrative",
        eyebrow: "How We Work",
        heading:
          "We coordinate international patient concierge services as one connected operating model, so treatment in Egypt feels clear, supported, and manageable from first inquiry to follow-up.",
        lead: "Choosing care abroad is not only a medical decision. Records review, specialist scheduling, medical travel planning, airport reception, accommodation, companion support, and follow-up all shape whether the journey feels organized and trustworthy.",
        paragraphs: [
          "At Care N Tour, we connect those moving parts through one accountable service model. Our team aligns medical case coordination, travel preparation, arrival logistics, recovery-friendly accommodation planning, and patient communication so every practical step supports the treatment plan.",
          "This matters because international patients and families evaluate the entire experience, not isolated services. They expect responsive communication, multilingual support, clear next steps, and continuity before arrival, during treatment in Egypt, and after returning home.",
          "Our concierge model is built to meet that expectation with structure, discretion, and operational clarity. Instead of leaving patients to manage separate vendors for treatment logistics, transportation, accommodation, and companion needs, we coordinate the journey around care.",
        ],
        strengthsTitle:
          "What international patients can expect from Care N Tour",
        strengths: [
          {
            title: "One point of coordination across treatment and travel",
            description:
              "We align scheduling, airport transfers, accommodation, companion logistics, and recovery timing so patients do not have to piece the journey together on their own.",
          },
          {
            title:
              "Multilingual communication with international-service discipline",
            description:
              "We support patients, families, and decision-makers with clearer updates, understandable documentation requirements, and communication designed for global audiences.",
          },
          {
            title:
              "Continuity before arrival, during treatment, and after return",
            description:
              "We help organize pre-arrival preparation, on-ground support in Egypt, and follow-up planning so the experience remains connected beyond the procedure itself.",
          },
        ],
        closing:
          "This is how we deliver international patient services in Egypt: as a structured concierge layer around treatment, not an afterthought.",
      },
      {
        type: "statGrid",
        eyebrow: "At A Glance",
        heading: "Built to support the full international patient journey",
        description:
          "Our concierge model exists to reduce friction, increase confidence, and keep treatment logistics aligned from first contact to follow-up.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Support window",
            value: "24/7",
            helper:
              "Responsive coordination for time-sensitive travel and care planning",
            icon: "Clock3",
          },
          {
            label: "Languages supported",
            value: "15+",
            helper:
              "Multilingual communication for patients, families, and companions",
            icon: "Languages",
          },
          {
            label: "Journey coverage",
            value: "End-to-End",
            helper:
              "From records and scheduling to recovery logistics and continuity",
            icon: "Route",
          },
          {
            label: "Coordination style",
            value: "One Team",
            helper:
              "A single operating layer across medical, travel, and support needs",
            icon: "Handshake",
          },
        ],
      },
      {
        type: "serviceCatalog",
        eyebrow: "Service Scope",
        heading:
          "The concierge services we coordinate for international patients, companions, and family decision-makers",
        description:
          "At Care N Tour, each concierge service is designed to remove friction from medical travel in Egypt by connecting treatment planning, travel logistics, accommodation, communication, and follow-up through one coordinated international patient service model.",
        items: [
          {
            title: "Medical case coordination",
            description:
              "We coordinate the practical work around medical review so international patients can move from inquiry to a clearer treatment plan with less delay and less back-and-forth.",
            icon: "HeartHandshake",
            availability: "Pre-arrival through follow-up",
            bullets: [
              "Collection and organization of medical reports, scans, and supporting documents for review",
              "Specialist matching and appointment coordination aligned with the patient case",
              "Scheduling support across consultation, diagnostics, treatment, and review milestones",
              "Follow-up planning built in early so continuity is considered from the start",
            ],
            languages: ["English", "Arabic", "French", "German"],
            note: "This service helps patients move faster with clearer treatment direction before travel is confirmed.",
            action: {
              label: "Explore treatments",
              href: "/treatments",
              variant: "outline",
            },
          },
          {
            title: "Travel and arrival management",
            description:
              "We align treatment schedules with the travel and arrival details that often create stress for international patients and families.",
            icon: "Plane",
            availability: "Before departure and on arrival",
            bullets: [
              "Travel preparation guidance aligned with treatment dates, admission timing, and expected stay",
              "Airport reception planning and in-city transfer coordination",
              "Arrival timing support around consultations, diagnostics, admission, discharge, and review visits",
              "Companion and family travel logistics coordinated alongside the patient journey",
            ],
            languages: ["English", "Arabic", "Spanish", "Italian"],
            note: "Patients should not have to manage medical timing and travel timing through separate channels.",
            action: {
              label: "Plan your trip",
              href: "/plan",
              variant: "outline",
            },
          },
          {
            title: "Accommodation and recovery support",
            description:
              "We help coordinate accommodation that matches the procedure, expected recovery timeline, mobility needs, and distance to care.",
            icon: "Hotel",
            availability: "During treatment and recovery",
            bullets: [
              "Recovery-friendly accommodation planning based on the medical schedule, comfort, and practical needs",
              "Coordination for extended stays, companion rooms, and post-procedure support requirements",
              "Support around follow-up visits, discharge timing, and return-travel readiness",
              "Local logistics planning that keeps recovery conditions, convenience, and continuity in view",
            ],
            languages: ["English", "Arabic", "French"],
            note: "Recovery logistics are treated as part of the treatment journey, not as an afterthought.",
            action: {
              label: "View travel information",
              href: "/travel-info",
              variant: "outline",
            },
          },
          {
            title: "Communication and continuity",
            description:
              "We help patients, companions, and families stay informed before arrival, during treatment, and after returning home.",
            icon: "MessagesSquare",
            availability: "Throughout the journey",
            bullets: [
              "Multilingual communication support for international patient coordination",
              "Clear updates around scheduling, documentation, treatment logistics, and next operational steps",
              "Family and companion coordination when additional support is required",
              "Continuity support after treatment so follow-up communication stays organized",
            ],
            languages: ["English", "Arabic", "German", "Portuguese"],
            note: "This is the service layer that keeps the journey coherent when multiple stakeholders are involved.",
            action: {
              label: "Start your journey",
              href: "/start-journey",
              variant: "default",
            },
          },
        ],
      },
      {
        type: "featureGrid",
        eyebrow: "Who We Support",
        heading:
          "A concierge model designed for the realities of international treatment decisions",
        description:
          "Patients do not arrive with the same priorities. This page should show how Care N Tour supports different decision contexts without diluting the brand.",
        columns: 3,
        variant: "cards",
        items: [
          {
            tag: "Patients",
            icon: "UserRound",
            title: "Individuals comparing providers abroad",
            description:
              "We help patients evaluate practical readiness, not just clinical availability, before they commit to travel.",
          },
          {
            tag: "Families",
            icon: "Users",
            title: "Companions and family members",
            description:
              "We coordinate the stay around shared travel, updates, recovery planning, and support requirements.",
          },
          {
            tag: "Complex cases",
            icon: "BriefcaseMedical",
            title: "Multi-step treatment journeys",
            description:
              "When the itinerary includes diagnostics, consultations, procedures, and review visits, we keep the operational plan connected.",
          },
        ],
      },
      {
        type: "trustSignals",
        eyebrow: "Operating Standard",
        heading:
          "Our international patient concierge services reflect the discipline, responsiveness, and global readiness patients expect when planning treatment in Egypt.",
        description:
          "At Care N Tour, we deliver concierge support through a structured international patient service model built for clear communication, dependable coordination, and continuity across medical travel, treatment, and recovery.",
        items: [
          {
            eyebrow: "01",
            title:
              "Medical travel coordination connected to the treatment plan",
            description:
              "We align records review, specialist scheduling, consultations, procedures, transfers, and follow-up timing so non-clinical logistics support the care plan instead of competing with it.",
            icon: "Workflow",
          },
          {
            eyebrow: "02",
            title:
              "Multilingual communication for international patients and families",
            description:
              "Our coordination model is designed for multinational audiences who need understandable updates, clearer documentation requirements, and responsive communication across languages and time zones.",
            icon: "Languages",
          },
          {
            eyebrow: "03",
            title:
              "Accommodation, transfers, and recovery support planned early",
            description:
              "We plan airport reception, accommodation, companion arrangements, and recovery-related logistics around the procedure, expected stay, mobility needs, and discharge timeline.",
            icon: "BedSingle",
          },
          {
            eyebrow: "04",
            title: "International patient support that continues after arrival",
            description:
              "Our concierge support continues through treatment logistics, discharge preparation, return-travel planning, and follow-up coordination after the patient returns home.",
            icon: "RefreshCcw",
          },
        ],
      },
      {
        type: "tabbedGuide",
        eyebrow: "How Coordination Works",
        badge: "Concierge Journey",
        heading:
          "We guide international patients through each stage of the concierge journey, from pre-arrival planning to on-ground support and post-treatment follow-up.",
        description:
          "At Care N Tour, we break medical travel coordination into clear stages so patients, families, and decision-makers can understand exactly how we support treatment planning in Egypt.",
        tabs: [
          {
            id: "before-arrival",
            label: "Before Arrival",
            icon: "CalendarClock",
            heading:
              "Before you travel, we organize medical records, scheduling, and travel planning so your treatment journey starts with clarity.",
            description:
              "This stage reduces uncertainty before flights, accommodation, and admission dates are finalized.",
            sections: [
              {
                type: "cardGrid",
                columns: 2,
                cards: [
                  {
                    title: "Case preparation",
                    icon: "FolderCheck",
                    bullets: [
                      "Medical reports, imaging, and case details organized for specialist review",
                      "Missing records, clarifications, and next-step requirements identified early",
                      "Consultations, diagnostic needs, and likely treatment timelines mapped around the case",
                    ],
                  },
                  {
                    title: "Travel readiness",
                    icon: "PlaneTakeoff",
                    bullets: [
                      "Expected stay length aligned with consultation, procedure, and recovery milestones",
                      "Airport arrival, accommodation timing, and local transport planned around the schedule",
                      "Companion needs, language support, and practical travel requirements considered before booking",
                    ],
                  },
                ],
              },
              {
                type: "cta",
                eyebrow: "Ready to plan?",
                title:
                  "Share your case, timeline, and travel needs with Care N Tour",
                description:
                  "Our guided intake helps us review your medical goals and coordinate the next practical steps for treatment in Egypt.",
                actions: [
                  {
                    label: "Start your journey",
                    href: "/start-journey",
                  },
                ],
              },
            ],
          },
          {
            id: "during-stay",
            label: "During Your Stay",
            icon: "MapPinned",
            heading:
              "Once you arrive in Egypt, we coordinate accommodation, transfers, and treatment logistics so each appointment and recovery step stays connected.",
            description:
              "Our role on the ground is to reduce friction and keep the itinerary moving with clearer communication.",
            sections: [
              {
                type: "infoPanels",
                panels: [
                  {
                    title: "Arrival and movement",
                    items: [
                      "Airport reception and transfer coordination aligned with your confirmed itinerary",
                      "Transport scheduling across consultations, diagnostics, treatment, and review visits",
                      "Practical support for companions and family members traveling with the patient",
                    ],
                  },
                  {
                    title: "Stay and recovery setup",
                    items: [
                      "Accommodation coordinated around hospital access, comfort, and expected recovery needs",
                      "Scheduling around discharge dates, follow-up visits, and return-travel readiness",
                      "Responsive operational support if the treatment plan changes, extends, or needs adjustment",
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "after-treatment",
            label: "After Treatment",
            icon: "ShieldCheck",
            heading:
              "After treatment, we help keep follow-up, discharge, and return-travel planning organized.",
            description:
              "Patients should leave with clearer continuity, not unanswered logistical questions.",
            sections: [
              {
                type: "compactList",
                title: "What continuity support can include",
                rows: [
                  {
                    title: "Follow-up coordination",
                    description:
                      "We help keep communication, records requests, and next operational steps clear after procedures are completed.",
                  },
                  {
                    title: "Return-travel alignment",
                    description:
                      "We review recovery timing, follow-up visits, and departure readiness before travel home is finalized.",
                  },
                  {
                    title: "Companion and family closure",
                    description:
                      "We help ensure companion logistics, accommodation timing, and final practical details are resolved before departure.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "faq",
        eyebrow: "Frequently Asked Questions",
        heading:
          "Frequently asked questions about Care N Tour concierge services for international patients",
        description:
          "These answers explain how Care N Tour coordinates medical travel, treatment logistics, accommodation, transfers, companion support, and follow-up for international patients coming to Egypt.",
        layout: "twoColumn",
        items: [
          {
            question:
              "What does Care N Tour concierge support include for international patients?",
            answer:
              "Care N Tour concierge services for international patients can include medical scheduling coordination, medical records review support, travel planning, airport transfers, accommodation arrangements, companion logistics, multilingual communication, and practical recovery planning around treatment in Egypt. Our role is to keep the full patient journey organized from pre-arrival preparation to post-treatment follow-up.",
          },
          {
            question:
              "Is concierge support separate from treatment coordination?",
            answer:
              "No. At Care N Tour, concierge support is integrated with treatment coordination. We align consultations, diagnostics, procedures, admission timing, discharge, travel logistics, and follow-up so patients are not managing medical planning and practical planning through separate channels.",
          },
          {
            question:
              "Can Care N Tour help family members or companions traveling with the patient?",
            answer:
              "Yes. We can coordinate accommodation, airport reception, local transportation, and practical planning for family members or companions traveling with the patient. This helps international families stay informed, supported, and logistically prepared throughout the treatment journey in Egypt.",
          },
          {
            question: "Do you help patients before they arrive in Egypt?",
            answer:
              "Yes. Before arrival, Care N Tour helps patients organize medical records, clarify treatment steps, align the expected travel window, and prepare accommodation and airport transfer planning before bookings are finalized. Early coordination helps reduce uncertainty and makes treatment travel to Egypt easier to plan with confidence.",
          },
          {
            question:
              "Is concierge support available after treatment is completed?",
            answer:
              "Yes. Our concierge support can continue after treatment through discharge planning, follow-up coordination, return-travel preparation, and practical continuity once the patient returns home. We want patients to leave Egypt with a clear next step, not unresolved coordination questions.",
          },
          {
            question:
              "What is the best next step if I want Care N Tour to coordinate my trip?",
            answer:
              "The best next step is to submit your request through our guided intake. Once we review your medical goals, timeline, travel preferences, and support needs, our team can recommend the next steps for treatment planning, medical travel coordination, and concierge support in Egypt.",
          },
        ],
      },
      {
        type: "startJourneyEmbed",
        eyebrow: "Start Coordination",
        heading:
          "Share your treatment goals and travel needs so we can coordinate the next practical steps properly.",
        description:
          "Our guided intake helps us understand your case, expected timing, companion requirements, accommodation preferences, and the operational support needed around treatment in Egypt.",
        supportCardTitle: "What happens after you submit?",
        supportCardDescription:
          "Our international patient team reviews your case and prepares a coordinated recommendation that connects treatment, travel, and recovery logistics.",
        supportBullets: [
          "We review your medical goals, timeline, and practical travel constraints",
          "We identify what records or clarifications are still needed",
          "We align likely providers, scheduling windows, and support requirements",
          "We prepare clearer next steps for treatment planning and travel coordination",
        ],
        responseTimeLabel: "Initial follow-up: typically within hours",
        reassuranceLabel:
          "Submitting your intake is free and does not commit you to a booking",
      },
    ],
  },
  {
    slug: "contact-global",
    name: "Contact Page",
    description:
      "Corporate contact page for patients, families, referral partners, and institutional enquiries.",
    defaultSlug: "contact",
    defaultTitle: "Contact Us",
    seo: {
      title:
        "Contact Care N Tour | International Patient, Partner & Corporate Enquiries",
      description:
        "Contact Care N Tour for treatment planning, international patient support, referral coordination, and corporate or partner enquiries related to medical travel in Egypt.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Contact Care N Tour",
        heading:
          "One point of contact for international patients, families, referral partners, and corporate enquiries.",
        description:
          "We coordinate medical travel planning, patient communication, referral support, and partner conversations through one Egypt-based team built for cross-border care journeys.",
        backgroundImageUrl: "/consultation.jpg",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Patients",
            label:
              "We respond to treatment planning, travel coordination, and case guidance enquiries.",
          },
          {
            kicker: "Partners",
            label:
              "We handle referral, corporate, and institutional conversations through the same coordinated team.",
          },
          {
            kicker: "Coverage",
            label:
              "We support international communication with a direct, multilingual, Egypt-based operating model.",
          },
        ],
        primaryAction: {
          label: "Send An Enquiry",
          href: "#contact-form",
          variant: "default",
        },
        secondaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "hero",
        },
      },
      {
        type: "statGrid",
        eyebrow: "Global Contact Model",
        heading: "A communications layer built for international coordination",
        description:
          "Care N Tour manages contact across treatment planning, travel logistics, and institutional conversations through one connected response model.",
        columns: 4,
        emphasizeValue: true,
        items: [
          {
            label: "Support window",
            value: "24/7",
            helper: "Urgent coordination and patient support coverage",
            icon: "Clock",
          },
          {
            label: "Communication style",
            value: "Multilingual",
            helper:
              "Built for international patients and cross-border enquiries",
            icon: "Globe",
          },
          {
            label: "Request types",
            value: "Patient & Partner",
            helper: "Clinical, travel, referral, and corporate coordination",
            icon: "BriefcaseBusiness",
          },
          {
            label: "Operating base",
            value: "Egypt-Based",
            helper:
              "Direct coordination close to providers and recovery logistics",
            icon: "Building2",
          },
        ],
      },
      {
        type: "serviceCatalog",
        eyebrow: "Who This Page Supports",
        heading:
          "We route each enquiry to the right Care N Tour team from the first message.",
        description:
          "The Contact Us page is designed for more than general marketing enquiries. We use it as the front door for patient planning, referral coordination, and institutional communication.",
        items: [
          {
            title: "Patients & Families",
            description:
              "Use this page when you need treatment planning guidance, travel coordination support, or clarity on the next step for a medical journey to Egypt.",
            icon: "HeartHandshake",
            availability: "Treatment & travel enquiries",
            bullets: [
              "Treatment planning and case guidance",
              "Travel timing, accommodation, and arrival questions",
              "Follow-up communication and support requests",
            ],
            languages: ["English", "Arabic"],
          },
          {
            title: "Referring Physicians",
            description:
              "We work with physicians and medical coordinators who need a direct route for patient referrals, records exchange, and treatment pathway alignment.",
            icon: "Stethoscope",
            availability: "Referral coordination",
            bullets: [
              "Case discussion and referral handoff",
              "Medical record coordination",
              "Cross-border communication support",
            ],
            languages: ["English", "Arabic"],
          },
          {
            title: "Corporate & Insurance Stakeholders",
            description:
              "We respond to institutional conversations related to care coordination, patient access models, and multinational support requirements.",
            icon: "Building2",
            availability: "Institutional enquiries",
            bullets: [
              "Corporate healthcare enquiries",
              "Insurance and case coordination discussions",
              "Cross-border patient support workflows",
            ],
            languages: ["English", "Arabic"],
          },
          {
            title: "Service & Destination Partners",
            description:
              "We also support operational conversations with accommodation, transport, and destination partners involved in the wider patient journey.",
            icon: "Plane",
            availability: "Operational partnerships",
            bullets: [
              "Accommodation and transfer coordination",
              "Destination operations alignment",
              "Partner communication and service planning",
            ],
            languages: ["English", "Arabic"],
          },
        ],
      },
      {
        type: "contactFormEmbed",
        advanced: {
          anchorId: "contact-form",
        },
        eyebrow: "Send A Direct Enquiry",
        heading:
          "Tell us what you need and we will route your message to the right Care N Tour team.",
        description:
          "We review every message in the context of treatment planning, travel coordination, referral support, or institutional communication so visitors do not need to navigate multiple departments alone.",
        channelsHeading: "Contact Channels",
        channelsDescription:
          "Use the form for detailed enquiries, or reach us directly through the channels below when you already know the team you need.",
        channels: [
          {
            icon: "Phone",
            title: "International Patient Desk",
            content: "+20 122 9503333",
            description:
              "Treatment planning, urgent coordination, and direct support for patients and families.",
            href: "tel:+201229503333",
            schemaContactType: "customer support",
          },
          {
            icon: "Mail",
            title: "General Enquiries",
            content: "info@carentour.com",
            description:
              "Patient, referral, and institutional enquiries handled by the Care N Tour coordination team.",
            href: "mailto:info@carentour.com",
            schemaContactType: "customer support",
          },
          {
            icon: "Building2",
            title: "Head Office",
            content: "Office 23, Building D, Agora Mall, New Cairo, Egypt",
            description:
              "Scheduled meetings and in-person visits can be coordinated through the main office.",
          },
        ],
        supportHeading: "How We Handle Incoming Enquiries",
        supportDescription:
          "Our contact experience is designed to feel structured, accountable, and internationally legible from the first interaction.",
        supportItems: [
          "We review each enquiry against its real context, from patient care planning to partner coordination.",
          "We keep communication centralized so the next step is clear even when multiple teams are involved.",
          "We respond with practical guidance, not generic acknowledgements, so visitors know what happens next.",
        ],
        formTitle: "Send A Message",
        formDescription:
          "Share your treatment question, travel concern, referral request, or corporate enquiry and we will respond with the appropriate next step.",
        labels: {
          firstName: "First Name",
          lastName: "Last Name",
          email: "Email Address",
          phone: "Phone Number",
          country: "Country",
          treatment: "Treatment Or Enquiry Type",
          message: "Message",
        },
        placeholders: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1 555 123 4567",
          country: "United States",
          treatment:
            "Cardiac surgery, referral partnership, corporate enquiry…",
          message:
            "Tell us about your enquiry, timeline, and the support you need…",
        },
        submitLabel: "Send Message",
        submittingLabel: "Sending…",
        responseTimeLabel: "Typical response window: within 2 hours",
        privacyNote:
          "By submitting this form, you allow Care N Tour to review your enquiry and contact you with the next practical step.",
        successTitle: "Message Sent",
        successDescription:
          "We have received your enquiry and our team will respond shortly.",
        errorTitle: "Unable To Send Message",
        errorDescription:
          "Please try again or use one of the listed contact channels.",
      },
      {
        type: "faq",
        eyebrow: "Contact FAQ",
        heading: "Questions we answer before or after the first message",
        description:
          "We explain how communication, response timing, referral handling, and patient support work so visitors know what to expect when they contact Care N Tour.",
        layout: "twoColumn",
        items: [
          {
            question: "Who should use the Contact Us page?",
            answer:
              "Patients, families, referral physicians, corporate stakeholders, and operational partners can all use this page. We review the enquiry and route it to the right Care N Tour team without asking you to start over.",
          },
          {
            question: "How quickly does Care N Tour respond?",
            answer:
              "We aim to respond within a short coordination window for most enquiries, and urgent patient-related issues are prioritized immediately when the situation requires it.",
          },
          {
            question:
              "Can I contact Care N Tour before I have full medical records?",
            answer:
              "Yes. You can contact us early for guidance on what information is needed, what the likely planning path looks like, and what the next practical step should be.",
          },
          {
            question:
              "Can referral partners and institutions use the same form?",
            answer:
              "Yes. We use the same entry point for patient, referral, and institutional communication so conversations stay connected and accountable from the beginning.",
          },
        ],
      },
    ],
  },
  {
    slug: "faq-global",
    name: "FAQ Page",
    description:
      "Corporate FAQ page with editorial hero, trust framing, dynamic FAQ directory, and conversion CTA.",
    defaultSlug: "faq",
    defaultTitle: "FAQ",
    seo: {
      title:
        "FAQ for International Patients Seeking Treatment in Egypt | Care N Tour",
      description:
        "Read Care N Tour's FAQ for international patients seeking treatment in Egypt, with answers on doctors, accredited hospitals, medical travel planning, pricing, accommodation, safety, recovery, and follow-up.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Care N Tour FAQ",
        heading:
          "We answer the questions international patients ask before planning treatment in Egypt.",
        description:
          "At Care N Tour, we explain how we coordinate specialist review, accredited hospital access, treatment planning, travel, accommodation, pricing guidance, safety, and follow-up so you can evaluate treatment in Egypt with clarity and confidence.",
        backgroundImageUrl: "/consultation.jpg",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Planning",
            label:
              "We explain how records review, specialist matching, timelines, and next-step planning work before you travel.",
          },
          {
            kicker: "Travel",
            label:
              "We answer practical questions about arrival, accommodation, companions, and local coordination in Egypt.",
          },
          {
            kicker: "Continuity",
            label:
              "We clarify pricing guidance, recovery expectations, discharge planning, and follow-up after you return home.",
          },
        ],
        primaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Speak with a Coordinator",
          href: "/contact",
          variant: "hero",
        },
      },
      {
        type: "trustSignals",
        eyebrow: "What This Page Covers",
        heading:
          "We organize answers around the decisions international patients need to make",
        description:
          "At Care N Tour, we use this FAQ to answer the medical, operational, and travel questions patients ask before choosing treatment in Egypt.",
        items: [
          {
            eyebrow: "01",
            icon: "Stethoscope",
            title: "Treatment planning and doctor selection",
            description:
              "We explain how we review records, coordinate specialist opinions, outline timelines, and help you evaluate the right treatment pathway.",
          },
          {
            eyebrow: "02",
            icon: "Plane",
            title: "Travel, arrival, and accommodation",
            description:
              "We answer practical questions about airport reception, stay planning, companion support, and on-ground coordination in Egypt.",
          },
          {
            eyebrow: "03",
            icon: "BadgeDollarSign",
            title: "Pricing, packages, and payment clarity",
            description:
              "We clarify what patients usually want to understand about estimated costs, package scope, payment timing, and what can affect final pricing.",
          },
          {
            eyebrow: "04",
            icon: "ShieldCheck",
            title: "Recovery, discharge, and follow-up",
            description:
              "We explain how aftercare, discharge planning, return travel, and post-treatment communication are coordinated after you leave Egypt.",
          },
        ],
      },
      {
        type: "faqDirectory",
        eyebrow: "Frequently Asked Questions",
        heading:
          "Browse our international patient FAQ by topic or search for a specific question",
        description:
          "Every answer below is managed in our CMS and written to help patients, families, and referral partners find clear information about treatment in Egypt, medical travel planning, pricing, accommodation, safety, and recovery.",
        layout: "sidebar",
        navigationHeading: "Browse FAQ topics",
        showSearch: true,
        showCategoryDescriptions: true,
        showSourceBadge: true,
        searchPlaceholder:
          "Search the FAQ for treatment in Egypt, doctors, travel planning, pricing, accommodation, safety, or recovery",
        emptyStateHeading: "No questions match your search",
        emptyStateDescription:
          "Try a broader keyword or clear the search to return to the full FAQ directory.",
        clearSearchLabel: "Clear search",
      },
      {
        type: "callToAction",
        eyebrow: "Need A Direct Answer?",
        heading:
          "Speak with Care N Tour if your case requires guidance beyond the FAQ.",
        description:
          "We can review your treatment goals, travel window, and coordination needs directly and tell you what the next practical step should be.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Contact Care N Tour",
            href: "/contact",
            variant: "secondary",
          },
        ],
      },
    ],
  },
  {
    slug: "medical-service",
    name: "Medical Service",
    description: "Procedure details, doctor spotlight, and travel checklist.",
    defaultSlug: "service",
    defaultTitle: "Medical Service",
    seo: {
      title: "Medical Service | Care N Tour",
      description:
        "Explain a signature treatment with doctor expertise and travel planning guidance.",
    },
    blocks: [
      {
        type: "hero",
        eyebrow: "Featured treatment",
        heading: "Comprehensive cardiac care in Cairo",
        highlight: "Expert cardiologists & modern facilities",
        description:
          "Partner with Egypt's top cardiology teams for diagnosis, surgery, and recovery in one itinerary.",
        alignment: "left",
        background: "white",
        containerWidth: "wide",
        primaryAction: {
          label: "Check availability",
          href: "/consultation",
          variant: "default",
        },
        secondaryAction: {
          label: "Meet the doctors",
          href: "/doctors",
          variant: "secondary",
        },
      },
      {
        type: "imageFeature",
        layout: "imageRight",
        heading: "Why patients choose Care N Tour",
        body: "From pre-operative planning to post-treatment recovery, our specialists stay involved at every stage.",
        image: {
          src: "/heart-procedure.jpg",
          alt: "Cardiac procedure consultation",
          rounded: true,
        },
        items: [
          {
            title: "Accredited cardiac centers",
            description:
              "Access to facilities with hybrid operating rooms and critical care suites.",
          },
          {
            title: "Renowned surgeons",
            description:
              "Internationally trained cardiologists with thousands of successful procedures.",
          },
          {
            title: "Dedicated recovery",
            description:
              "Customized physiotherapy and cardiac rehabilitation pathways.",
          },
        ],
      },
      {
        type: "statGrid",
        columns: 3,
        emphasizeValue: true,
        items: [
          { label: "Success rate", value: "98%" },
          { label: "Years experience", value: "15+" },
          { label: "Average stay", value: "7 days" },
        ],
      },
      {
        type: "treatments",
        title: "Related procedures",
        description:
          "Explore complementary services that pair with this treatment.",
        layout: "grid",
        limit: 4,
        featuredOnly: false,
        categories: ["cardiology"],
      },
      {
        type: "doctors",
        title: "Specialist team",
        description: "Internationally trained cardiologists guiding your care.",
        layout: "carousel",
        limit: 4,
        featuredOnly: true,
        specialties: ["Cardiology"],
      },
      {
        type: "callToAction",
        heading: "Start your cardiac treatment plan",
        description:
          "Submit medical records and receive a tailored treatment plan within 48 hours.",
        layout: "centered",
        background: "muted",
        actions: [
          {
            label: "Upload records",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Talk to a coordinator",
            href: "/contact",
            variant: "secondary",
          },
        ],
      },
    ],
  },
  {
    slug: "medical-facilities-global",
    name: "Medical Facilities Page",
    description:
      "CMS-led medical facilities listing with editorial framing, live directory results, FAQ, and CTA support.",
    defaultSlug: "medical-facilities",
    defaultTitle: "Medical Facilities",
    seo: {
      title:
        "Accredited Hospitals and Medical Facilities in Egypt | Care N Tour",
      description:
        "Browse accredited hospitals and medical facilities in Egypt through Care N Tour, with live specialties, procedures, international patient coordination, multilingual support, and recovery-focused planning.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Care N Tour Medical Facilities",
        heading:
          "Explore accredited hospitals and medical facilities in Egypt with clearer coordination from the start.",
        description:
          "Care N Tour helps international patients evaluate hospitals, specialty centers, and medical facilities in Egypt through a more structured planning experience that brings provider access, multilingual support, and travel coordination together.",
        backgroundImageUrl:
          "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
        overlay: DEFAULT_HERO_OVERLAY,
        highlights: [
          {
            kicker: "Providers",
            label:
              "Accredited hospitals, specialty centers, and trusted medical institutions",
          },
          {
            kicker: "Planning",
            label:
              "International patient coordination, multilingual communication, and clearer next-step guidance",
          },
          {
            kicker: "Recovery",
            label:
              "Travel logistics and post-treatment planning aligned around the medical journey",
          },
        ],
        primaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Contact Care N Tour",
          href: "/contact",
          variant: "hero",
        },
      },
      {
        type: "storyNarrative",
        eyebrow: "Why This Directory Matters",
        heading:
          "A facilities directory should help patients evaluate fit, credibility, and operational readiness, not just scroll through names.",
        lead: "Care N Tour brings editorial context around the live provider data so international patients can move from search to serious planning with more clarity.",
        paragraphs: [
          "We organize live facility profiles around the questions international patients actually ask: where the facility is located, which specialties and procedures it supports, what the operational infrastructure looks like, and how Care N Tour can coordinate the wider treatment journey.",
          "That means patients can review medical facilities in Egypt with a clearer understanding of accreditation context, multilingual support, institutional capabilities, and the planning pathway that follows once they are ready to move forward.",
        ],
        strengthsTitle: "What this page is designed to clarify early",
        strengths: [
          {
            title: "Accredited and institutionally credible options",
            description:
              "Review hospitals and medical facilities with live specialties, procedures, and operational detail.",
          },
          {
            title: "Searchable clinical fit",
            description:
              "Filter by city, specialty, and procedure to narrow the directory to the facilities most relevant to the case.",
          },
          {
            title: "Better planning continuity",
            description:
              "Move from facility discovery to coordinated next steps without losing the broader travel and recovery context.",
          },
        ],
      },
      {
        type: "medicalFacilitiesDirectory",
        eyebrow: "Live Directory",
        heading:
          "Search accredited hospitals and medical facilities across Egypt",
        description:
          "Use the live directory below to compare institutions, specialties, procedures, and location context while keeping the wider Care N Tour planning experience in view.",
      },
      {
        type: "faq",
        eyebrow: "Medical Facilities FAQ",
        heading:
          "Questions international patients ask before choosing a facility in Egypt",
        description:
          "These answers explain how Care N Tour helps evaluate hospitals and medical facilities before treatment planning moves forward.",
        layout: "twoColumn",
        items: [
          {
            question:
              "How does Care N Tour help me choose between hospitals and medical facilities in Egypt?",
            answer:
              "We help patients compare accredited hospitals, specialty centers, and medical facilities based on clinical fit, procedure availability, logistics, and the level of international patient coordination required for the case.",
          },
          {
            question:
              "Can I search for facilities by specialty or procedure before speaking with a coordinator?",
            answer:
              "Yes. The live directory lets you search by location, specialty, and procedure so you can review the most relevant institutions before discussing the case with Care N Tour.",
          },
          {
            question:
              "Does Care N Tour also support travel and recovery planning after I shortlist a facility?",
            answer:
              "Yes. Once the right medical facility is identified, we can coordinate treatment planning, travel logistics, multilingual communication, accommodation, and recovery-focused support around the live provider relationship.",
          },
        ],
      },
      {
        type: "callToAction",
        eyebrow: "Need Help Evaluating Options?",
        heading:
          "Let Care N Tour help you compare facilities, procedures, and the planning path around your case.",
        description:
          "Share your treatment goal and timeline, and we will help structure the next step with the right hospital or medical facility in Egypt.",
        layout: "split",
        background: "dark",
        style: buildCallToActionBaseStyle("dark"),
        actions: [
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Contact Care N Tour",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "medical-facilities-detail-global",
    name: "Medical Facility Detail Shell",
    description:
      "CMS-led facility detail shell with the live provider profile block and follow-up conversion support.",
    defaultSlug: "medical-facilities-detail-template",
    defaultTitle: "Medical Facility Detail Shell",
    seo: {
      title: "Medical Facility Profile | Care N Tour",
      description:
        "Facility profile shell used by Care N Tour to present live provider details with international patient support context.",
    },
    blocks: [
      {
        type: "medicalFacilityProfile",
        eyebrow: "Care N Tour Medical Facility Profile",
        trustStatement:
          "Care N Tour coordinates provider review, multilingual communication, travel planning, and recovery support around the live medical facility profile shown below.",
        sectionDescriptions: {
          overview:
            "Review the provider profile, planning context, and facility capabilities before speaking with Care N Tour about next steps.",
          procedures:
            "Procedures listed here come directly from the live provider record currently available through Care N Tour.",
          contact:
            "Use the live contact and location details below as a reference point, then speak with Care N Tour for coordinated next-step planning.",
        },
      },
      {
        type: "callToAction",
        eyebrow: "Need Case-Specific Guidance?",
        heading:
          "Care N Tour can help you evaluate this facility in the context of your treatment, travel, and recovery requirements.",
        description:
          "Share your case and our team will help you understand the most practical next step, whether that means provider review, procedure matching, or broader treatment planning.",
        layout: "split",
        background: "dark",
        style: buildCallToActionBaseStyle("dark"),
        actions: [
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Contact Care N Tour",
            href: "/contact",
            variant: "outline",
          },
        ],
      },
    ],
  },
  {
    slug: "blog-global",
    name: "Blog Landing Page",
    description:
      "CMS-native editorial landing page for the public blog with a featured feed and taxonomy exploration.",
    defaultSlug: "blog",
    defaultTitle: "Blog",
    seo: {
      title: "Health Insights & Travel Guides | Care N Tour Blog",
      description:
        "Read Care N Tour guidance on medical travel planning, treatment preparation, recovery, and patient decision-making.",
    },
    blocks: [
      {
        type: "aboutHero",
        eyebrow: "Care N Tour Journal",
        heading:
          "Medical travel insights written for patients, families, and referring partners.",
        description:
          "Explore clear guidance on treatment planning, travel logistics, provider evaluation, recovery expectations, and practical decisions that shape a confident medical journey to Egypt.",
        backgroundImageUrl: "/blog-medical-tourism.jpg",
        highlights: [
          {
            kicker: "Perspective",
            label:
              "Editorial guidance written in Care N Tour's voice for international patients",
          },
          {
            kicker: "Topics",
            label:
              "Treatments, facilities, travel preparation, recovery, and planning clarity",
          },
          {
            kicker: "Use",
            label:
              "A living knowledge base that supports better conversations before treatment begins",
          },
        ],
        primaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "default",
        },
        secondaryAction: {
          label: "Contact Care N Tour",
          href: "/contact",
          variant: "secondary",
        },
        overlay: DEFAULT_HERO_OVERLAY,
      },
      {
        type: "blogPostFeed",
        eyebrow: "Featured articles",
        heading: "Latest guidance from Care N Tour",
        description:
          "Start with the articles most useful for patients evaluating treatment, travel timing, and next steps.",
        source: "latest",
        layout: "heroFeatured",
        limit: 7,
      },
      {
        type: "blogTaxonomyGrid",
        eyebrow: "Explore by topic",
        heading: "Navigate the blog by category",
        description:
          "Move directly into the archive that matches the question you are trying to answer.",
        taxonomy: "categories",
        limit: 9,
        cardStyle: "editorial",
        ctaLabel: "Explore archive",
      },
      {
        type: "callToAction",
        eyebrow: "Need direction",
        heading: "Turn what you read into a personalized treatment plan.",
        description:
          "Our coordinators can translate editorial guidance into provider options, timelines, logistics, and a plan built around your case.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Request Consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Contact Care N Tour",
            href: "/contact",
            variant: "outline",
          },
        ],
        style: buildCallToActionBaseStyle("dark"),
      },
    ],
  },
  {
    slug: "blog-category-global",
    name: "Blog Category Template",
    description:
      "Internal category archive template for dynamic blog category routes.",
    defaultSlug: "blog-category-template",
    defaultTitle: "Blog Category Template",
    blocks: [
      {
        type: "blogPostFeed",
        eyebrow: "Category archive",
        source: "category",
        layout: "grid",
        limit: 12,
      },
      {
        type: "callToAction",
        eyebrow: "Plan with confidence",
        heading: "Need help turning research into a treatment decision?",
        description:
          "Speak with Care N Tour to compare providers, timelines, logistics, and the right next step for your case.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "default",
          },
          {
            label: "Contact Care N Tour",
            href: "/contact",
            variant: "outline",
          },
        ],
        style: buildCallToActionBaseStyle("dark"),
      },
    ],
  },
  {
    slug: "blog-tag-global",
    name: "Blog Tag Template",
    description: "Internal tag archive template for dynamic blog tag routes.",
    defaultSlug: "blog-tag-template",
    defaultTitle: "Blog Tag Template",
    blocks: [
      {
        type: "blogPostFeed",
        eyebrow: "Tagged archive",
        source: "tag",
        layout: "grid",
        limit: 12,
      },
    ],
  },
  {
    slug: "blog-author-global",
    name: "Blog Author Template",
    description:
      "Internal author archive template for dynamic blog author routes.",
    defaultSlug: "blog-author-template",
    defaultTitle: "Blog Author Template",
    blocks: [
      {
        type: "blogAuthorSummary",
        heading: "About the author",
        showArchiveLink: false,
      },
      {
        type: "blogPostFeed",
        eyebrow: "Author archive",
        source: "author",
        layout: "grid",
        limit: 12,
      },
    ],
  },
  {
    slug: "blog-post-global",
    name: "Blog Post Template",
    description: "Internal article template for dynamic blog post routes.",
    defaultSlug: "blog-post-template",
    defaultTitle: "Blog Post Template",
    blocks: [
      {
        type: "blogArticleHero",
      },
      {
        type: "blogArticleBody",
        showTableOfContents: true,
      },
      {
        type: "blogAuthorSummary",
        heading: "About the author",
        showArchiveLink: true,
      },
      {
        type: "blogPostFeed",
        eyebrow: "Continue reading",
        source: "related",
        layout: "grid",
        limit: 3,
        relatedHeading: "Related articles",
      },
      {
        type: "callToAction",
        eyebrow: "Talk to Care N Tour",
        heading: "Need a treatment plan built around your case?",
        description:
          "Move from editorial guidance into a coordinated next step with provider matching, travel planning, and operational clarity.",
        layout: "split",
        background: "dark",
        actions: [
          {
            label: "Request Consultation",
            href: "/consultation",
            variant: "default",
          },
          {
            label: "Start Your Journey",
            href: "/start-journey",
            variant: "outline",
          },
        ],
        style: buildCallToActionBaseStyle("dark"),
      },
    ],
  },
];

export function getTemplate(slug: string | null): CmsTemplate | undefined {
  if (!slug) return undefined;
  return cmsTemplates.find((template) => template.slug === slug);
}
