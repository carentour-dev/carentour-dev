import type { BlockValue } from "./blocks";

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
      "Recreates the current static homepage using dedicated CMS homepage blocks.",
    defaultSlug: "home",
    defaultTitle: "Home",
    seo: {
      title: "Care N Tour | World-Class Medical Care in Egypt",
      description:
        "Experience premium medical treatments in Egypt with significant cost savings.",
    },
    blocks: [
      {
        type: "homeHero",
        eyebrow: "Experience a New Standard in Medical Travel",
        headingPrefix: "Premium",
        headingHighlight: "Medical Care",
        headingSuffix: "in Egypt",
        description:
          "Access trusted doctors and accredited hospitals with complete travel coordination and personal guidance at every step. We make your medical journey safe, clear, and comfortable from inquiry to recovery.\n\nVerified specialists. Transparent packages. Concierge-level support.",
        backgroundImageUrl: "/hero-medical-facility.webp",
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
      },
      {
        type: "featuredTreatmentsHome",
        title: "Featured Treatments",
        description:
          "Discover our most popular medical procedures, performed by internationally certified specialists",
        limit: 4,
        featuredOnly: true,
      },
      {
        type: "journeySteps",
        title: "Your Journey to",
        highlight: "Better Health",
        description:
          "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
        steps: [
          {
            icon: "MessageCircle",
            title: "Explore Your Options",
            description:
              "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences.",
          },
          {
            icon: "Calendar",
            title: "Receive a Personalized Treatment Plan",
            description:
              "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision.",
          },
          {
            icon: "Plane",
            title: "Prepare for Your Trip",
            description:
              "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival.",
          },
          {
            icon: "Heart",
            title: "Arrive with Confidence",
            description:
              "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin.",
          },
          {
            icon: "Home",
            title: "Undergo Treatment with Full Support",
            description:
              "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics.",
          },
          {
            icon: "CheckCircle",
            title: "Recover Safely and Comfortably",
            description:
              "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support.",
          },
        ],
      },
      {
        type: "differentiators",
        eyebrow: "Why Choose Care N Tour",
        title: "What Makes Us",
        highlight: "Different",
        description:
          "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
        items: [
          {
            icon: "Award",
            title: "JCI Accredited Hospitals",
            description:
              "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards.",
            highlight: "100% Accredited",
          },
          {
            icon: "Shield",
            title: "Board-Certified Surgeons",
            description:
              "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions.",
            highlight: "200+ Specialists",
          },
          {
            icon: "DollarSign",
            title: "All-Inclusive Packages",
            description:
              "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support.",
            highlight: "Up to 70% Savings",
          },
          {
            icon: "Clock",
            title: "Fast-Track Treatment",
            description:
              "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking.",
            highlight: "2-3 Weeks",
          },
          {
            icon: "Globe",
            title: "Multilingual Support",
            description:
              "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey.",
            highlight: "15+ Languages",
          },
          {
            icon: "Plane",
            title: "Complete Travel Support",
            description:
              "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay.",
            highlight: "End-to-End Care",
          },
        ],
      },
      {
        type: "homeCta",
        headingPrefix: "Ready to Start Your",
        headingHighlight: "Health Journey?",
        description:
          "Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.",
        primaryAction: {
          label: "Get Free Consultation",
          href: "/consultation",
          variant: "default",
        },
        secondaryAction: {
          label: "Start Your Journey",
          href: "/start-journey",
          variant: "secondary",
        },
      },
    ],
  },
  {
    slug: "travel-info",
    name: "Travel Info Guide",
    description:
      "Four-tab travel guide covering visas, accommodation, culture, and logistics.",
    defaultSlug: "travel-info",
    defaultTitle: "Travel Information",
    seo: {
      title: "Travel Info | Care N Tour",
      description:
        "Plan your medical journey to Egypt with visa requirements, partner hotels, culture insights, and transport tips.",
    },
    blocks: [
      {
        type: "tabbedGuide",
        eyebrow: "Travel Information",
        badge: "Medical Tourism",
        heading: "Your complete guide to traveling for care in Egypt",
        description:
          "Everything patients and families need before boarding their flight: visas, recovery-ready stays, cultural tips, and logistics.",
        tabs: [
          {
            id: "visa-entry",
            label: "Visa & Entry",
            icon: "FileText",
            heading: "Visa & Entry Requirements",
            description:
              "Simple application paths for every passport, including medical stay extensions.",
            sections: [
              {
                type: "cardGrid",
                columns: 2,
                cards: [
                  {
                    title: "E-Visa (Recommended)",
                    description:
                      "Apply online before travel for the smoothest arrival experience.",
                    icon: "Globe",
                    bullets: [
                      "Processing: 7 business days",
                      "Valid: 30 days single entry",
                      "Cost: $25 USD",
                      "Extension possible for medical plans",
                    ],
                    actions: [
                      {
                        label: "Apply online",
                        href: "https://visa2egypt.gov.eg/",
                        target: "_blank",
                        variant: "outline",
                      },
                    ],
                  },
                  {
                    title: "Visa on Arrival",
                    description:
                      "Pick up a tourist visa at Cairo International Airport.",
                    icon: "Plane",
                    bullets: [
                      "Processing: Instant at airport kiosks",
                      "Valid: 30 days single entry",
                      "Cost: $25 USD cash",
                      "Requirements: Passport + return ticket",
                    ],
                  },
                ],
              },
              {
                type: "dataGrid",
                title: "Visa requirements by country",
                columns: [
                  { key: "requirement", label: "Requirement" },
                  { key: "duration", label: "Duration" },
                  { key: "process", label: "Process" },
                  { key: "cost", label: "Cost" },
                ],
                rows: [
                  {
                    title: "European Union",
                    badge: "Tourist visa",
                    values: {
                      requirement: "Tourist visa",
                      duration: "30 days",
                      process: "Visa on arrival or e-visa",
                      cost: "$25 USD",
                    },
                  },
                  {
                    title: "United States",
                    badge: "Tourist visa",
                    values: {
                      requirement: "Tourist visa",
                      duration: "30 days",
                      process: "E-visa recommended",
                      cost: "$25 USD",
                    },
                  },
                  {
                    title: "Canada",
                    badge: "Tourist visa",
                    values: {
                      requirement: "Tourist visa",
                      duration: "30 days",
                      process: "Visa on arrival / e-visa",
                      cost: "$25 USD",
                    },
                  },
                  {
                    title: "Australia",
                    badge: "Tourist visa",
                    values: {
                      requirement: "Tourist visa",
                      duration: "30 days",
                      process: "E-visa only",
                      cost: "$25 USD",
                    },
                  },
                  {
                    title: "GCC Countries",
                    badge: "Visa free",
                    values: {
                      requirement: "Visa free",
                      duration: "90 days",
                      process: "Passport only",
                      cost: "Free",
                    },
                  },
                ],
              },
              {
                type: "callout",
                tone: "warning",
                title: "Important notes",
                bullets: [
                  "Passport must be valid 6+ months beyond entry date.",
                  "Medical visa extensions available for extended treatment.",
                  "Travel insurance recommended (medical + trip).",
                  "Check current health regulations before flying.",
                ],
              },
            ],
          },
          {
            id: "accommodation",
            label: "Accommodation",
            icon: "Hotel",
            heading: "Recovery-ready accommodation",
            description:
              "Partner hotels, premium apartments, and concierge booking support for smooth recoveries.",
            sections: [
              {
                type: "mediaSpotlight",
                badge: "Concierge",
                title: "Accommodation booking service",
                body: "Share your treatment schedule and preferences—we secure rooms, transfers, and special requests.",
                bullets: [
                  "Pre-arrival confirmations",
                  "Medical-friendly locations",
                  "Airport transfer coordination",
                  "24/7 local support",
                ],
                image: {
                  src: "/accommodation-egypt.jpg",
                  alt: "Accommodation in Egypt",
                },
              },
              {
                type: "hotelShowcase",
                title: "Featured partner stays",
                description:
                  "Live data pulls from the partner hotels table. Manual fallback ensures preview fidelity.",
                limit: 4,
                layout: "grid",
                manualFallback: [
                  {
                    title: "Luxury Medical Hotels",
                    description:
                      "5-star hotels with private nursing, recovery suites, and dietary support.",
                    amenities: [
                      "Medical concierge",
                      "24/7 nursing",
                      "Recovery suites",
                      "Specialized diet",
                    ],
                    priceLabel: "$150 - $300/night",
                    locationLabel: "New Cairo • Zamalek",
                    icon: "Hotel",
                  },
                  {
                    title: "Serviced Apartments",
                    description:
                      "Fully furnished apartments ideal for extended family stays.",
                    amenities: [
                      "Kitchen facilities",
                      "Laundry",
                      "Living areas",
                    ],
                    priceLabel: "$50 - $120/night",
                    locationLabel: "Maadi • Zamalek",
                    icon: "Building",
                  },
                ],
              },
            ],
          },
          {
            id: "about-egypt",
            label: "About Egypt",
            icon: "MapPin",
            heading: "Culture, climate & currency",
            description:
              "Set expectations around weather, language, and payment options before you arrive.",
            sections: [
              {
                type: "infoPanels",
                panels: [
                  {
                    title: "Climate",
                    items: [
                      "Winter (Dec-Feb): 15-25°C, mild and comfortable.",
                      "Spring (Mar-May): 20-30°C, pleasant for recovery.",
                      "Summer (Jun-Aug): 25-35°C, dry heat with AC in clinics.",
                      "Autumn (Sep-Nov): 20-30°C, ideal sightseeing weather.",
                    ],
                  },
                  {
                    title: "Culture & Language",
                    items: [
                      "English widely spoken in medical settings.",
                      "Warm hospitality and family-centric care.",
                      "Respectful attire in religious spaces.",
                    ],
                  },
                  {
                    title: "Currency & Payments",
                    items: [
                      "Egyptian Pound (EGP).",
                      "1 USD ≈ 50 EGP (market dependent).",
                      "Visa/Mastercard widely accepted.",
                      "ATMs across Cairo + Giza.",
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "practical",
            label: "Practical Info",
            icon: "Plane",
            heading: "Transportation & communications",
            description:
              "Ground transport, connectivity, emergency contacts, and CTA for concierge support.",
            sections: [
              {
                type: "cardGrid",
                columns: 2,
                cards: [
                  {
                    title: "Transportation",
                    icon: "Car",
                    bullets: [
                      "Airport transfer: $20-30",
                      "Taxi/Uber: $5-15 per ride",
                      "Metro: $0.50 per trip",
                      "Private driver: $40-60/day",
                    ],
                  },
                  {
                    title: "Communication & Tech",
                    icon: "Wifi",
                    bullets: [
                      "Free WiFi in clinics & partner hotels.",
                      "Tourist SIM cards at airport arrivals.",
                      "Emergency numbers: Police 122, Ambulance 123, Tourist Police 126.",
                    ],
                  },
                ],
              },
              {
                type: "cta",
                eyebrow: "Need assistance?",
                title: "Talk to travel coordination",
                description:
                  "Visa paperwork, accommodation, and local logistics handled by our concierge team.",
                actions: [
                  { label: "Contact travel team", href: "/contact" },
                  {
                    label: "Download travel guide",
                    href: "/travel-info",
                    variant: "outline",
                  },
                ],
              },
            ],
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
];

export function getTemplate(slug: string | null): CmsTemplate | undefined {
  if (!slug) return undefined;
  return cmsTemplates.find((template) => template.slug === slug);
}
