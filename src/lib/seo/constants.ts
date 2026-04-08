export const CANONICAL_ORIGIN = "https://www.carentour.com";

export const DEFAULT_SEO_LOCALE = "en" as const;

export const SUPPORTED_SEO_LOCALES = ["en", "ar"] as const;

export const OG_FALLBACK_ENDPOINT = "/api/og";

export const DEFAULT_OG_IMAGE =
  "https://www.carentour.com/hero-medical-facility.jpg";

export const INTERNAL_NOINDEX_PREFIXES = [
  "/admin",
  "/auth",
  "/cms",
  "/dashboard",
  "/finance",
  "/operations",
  "/staff",
  "/api",
] as const;

export const STATIC_PUBLIC_ROUTE_DEFAULTS = [
  {
    pathname: "/",
    title: "Care N Tour | World-Class Medical Care in Egypt",
    description:
      "Experience premium medical treatments in Egypt with significant cost savings.",
    source: "core",
  },
  {
    pathname: "/about",
    title: "About Care N Tour | Medical Tourism Experts",
    description:
      "Learn how Care N Tour connects patients with trusted treatment providers in Egypt.",
    source: "core",
  },
  {
    pathname: "/travel-info",
    title:
      "Travel Information for International Patients Visiting Egypt | Care N Tour",
    description:
      "Review entry planning, accommodation, local mobility, payments, language support, and recovery-focused travel guidance for medical trips to Egypt with Care N Tour.",
    source: "core",
  },
  {
    pathname: "/plan",
    title: "Plan Your Trip | Care N Tour",
    description:
      "Explore the complete medical travel journey from consultation to recovery.",
    source: "core",
  },
  {
    pathname: "/contact",
    title: "Contact Care N Tour",
    description:
      "Speak with our medical coordinators and get personalized guidance for your treatment journey.",
    source: "core",
  },
  {
    pathname: "/consultation",
    title: "Book a Consultation | Care N Tour",
    description:
      "Share your case and receive specialist recommendations with a free consultation.",
    source: "core",
  },
  {
    pathname: "/start-journey",
    title: "Start Journey | Care N Tour",
    description:
      "Start your medical tourism journey with guided intake, documents, and scheduling.",
    source: "core",
  },
  {
    pathname: "/concierge",
    title: "International Patient Concierge Services | Care N Tour",
    description:
      "Explore Care N Tour concierge services for international patients, including medical coordination, travel planning, accommodation, airport transfers, multilingual support, and recovery logistics in Egypt.",
    source: "core",
  },
  {
    pathname: "/faq",
    title:
      "FAQ for International Patients Seeking Treatment in Egypt | Care N Tour",
    description:
      "Read Care N Tour's FAQ for international patients seeking treatment in Egypt, with answers on doctors, accredited hospitals, medical travel planning, pricing, accommodation, safety, recovery, and follow-up.",
    source: "core",
  },
  {
    pathname: "/blog",
    title: "Health Insights & Travel Guides | Care N Tour Blog",
    description:
      "Read expert guidance, treatment explainers, and patient-focused medical travel articles.",
    source: "blog",
  },
  {
    pathname: "/treatments",
    title: "Treatments | Care N Tour",
    description:
      "Browse medical treatments performed by accredited specialists across Egypt.",
    source: "treatments",
  },
  {
    pathname: "/doctors",
    title:
      "Specialist Doctors in Egypt for International Patients | Care N Tour",
    description:
      "Explore Care N Tour's specialist doctors in Egypt. Compare specialties, languages, experience, and next steps for medical tourism and treatment planning.",
    source: "doctors",
  },
  {
    pathname: "/medical-facilities",
    title: "Medical Facilities | Care N Tour",
    description:
      "Explore partner hospitals and medical facilities across Egypt.",
    source: "facilities",
  },
  {
    pathname: "/stories",
    title: "Patient Stories | Care N Tour",
    description:
      "Read real outcomes and treatment journeys from international patients.",
    source: "stories",
  },
] as const;
