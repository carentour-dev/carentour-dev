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
        background: "gradient",
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
