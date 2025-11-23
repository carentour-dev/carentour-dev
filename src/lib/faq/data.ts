import * as Icons from "lucide-react";
import {
  CircleHelp,
  CreditCard,
  FileText,
  Globe,
  HeartHandshake,
  Hotel,
  Shield,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type FaqCategoryId =
  | "general"
  | "visa"
  | "treatments"
  | "costs"
  | "accommodation"
  | "aftercare"
  | "emergency";

export type FaqStatus = "draft" | "published";

export type FaqEntry = {
  id: string;
  category: FaqCategoryId | string;
  question: string;
  answer: string;
  status?: FaqStatus | null;
  position?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FaqCategoryMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  fragment: string;
};

export type FaqCategory = {
  slug: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  fragment?: string | null;
  position?: number | null;
};

export const FAQ_CATEGORY_ORDER: FaqCategoryId[] = [
  "general",
  "visa",
  "treatments",
  "costs",
  "accommodation",
  "aftercare",
  "emergency",
] as const;

const FAQ_FRAGMENT_OVERRIDES: Partial<Record<string, string>> = {
  visa: "visa-travel",
  costs: "costs-payment",
  accommodation: "stay-transport",
  aftercare: "recovery-support",
};

const FAQ_CATEGORY_META: Record<FaqCategoryId, FaqCategoryMeta> = {
  general: {
    label: "General Information",
    description: "About medical tourism in Egypt",
    icon: Globe,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    fragment: "general",
  },
  visa: {
    label: "Visa & Travel",
    description: "Documentation and travel requirements",
    icon: FileText,
    color: "bg-green-500/10 text-green-600 border-green-200",
    fragment: "visa-travel",
  },
  treatments: {
    label: "Medical Procedures",
    description: "Treatment processes and specialties",
    icon: Stethoscope,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    fragment: "treatments",
  },
  costs: {
    label: "Costs & Payment",
    description: "Pricing and payment options",
    icon: CreditCard,
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
    fragment: "costs-payment",
  },
  accommodation: {
    label: "Stay & Transport",
    description: "Hotels and transportation services",
    icon: Hotel,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    fragment: "stay-transport",
  },
  aftercare: {
    label: "Recovery & Support",
    description: "Post-treatment care and follow-ups",
    icon: HeartHandshake,
    color: "bg-pink-500/10 text-pink-600 border-pink-200",
    fragment: "recovery-support",
  },
  emergency: {
    label: "Emergency & Safety",
    description: "24/7 support and emergency procedures",
    icon: Shield,
    color: "bg-red-500/10 text-red-600 border-red-200",
    fragment: "emergency",
  },
};

const DEFAULT_CATEGORIES: FaqCategory[] = FAQ_CATEGORY_ORDER.map(
  (category, index) => {
    const meta = FAQ_CATEGORY_META[category];
    return {
      slug: category,
      title: meta.label,
      description: meta.description,
      icon: meta.icon.name,
      color: meta.color,
      fragment: meta.fragment,
      position: index + 1,
    };
  },
);

const FALLBACK_FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "fallback-general-1",
    category: "general",
    question: "What is medical tourism and why choose Egypt?",
    answer:
      "Medical tourism involves traveling to another country for medical treatment. Egypt offers world-class healthcare service providers, internationally trained doctors, significant cost savings (50-70% less than Western countries), and the opportunity to recover in a historically rich environment with excellent hospitality.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-general-2",
    category: "general",
    question:
      "Are Egyptian medical service providers up to international standards?",
    answer:
      "Yes, our partner hospitals are internationally accredited (JCI, ISO) with state-of-the-art equipment and internationally trained doctors. Many Egyptian physicians have trained in Europe, the US, or Canada and hold international certifications.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-general-3",
    category: "general",
    question: "What languages are spoken by medical staff?",
    answer:
      "All our partner doctors and medical coordinators are fluent in English. Many also speak Arabic, French, German, and other languages. We provide translation services when needed to ensure clear communication throughout your treatment.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-general-4",
    category: "general",
    question: "How do I know if I'm a candidate for treatment in Egypt?",
    answer:
      "Our medical coordinators will review your medical history and current condition through a free consultation. We'll connect you with specialists who will assess your case and recommend the best treatment options available.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-visa-1",
    category: "visa",
    question: "Do I need a visa to visit Egypt for medical treatment?",
    answer:
      "Most nationalities require a visa to enter Egypt. We assist with medical visa applications, which often have expedited processing. Tourist visas are also acceptable for medical tourism. We provide detailed guidance based on your nationality.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-visa-2",
    category: "visa",
    question: "What documents do I need for medical treatment in Egypt?",
    answer:
      "You'll need a valid passport, visa, medical records, insurance documentation (if applicable), and any relevant test results. We provide a comprehensive checklist and assist with document preparation and translation if needed.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-visa-3",
    category: "visa",
    question: "How long can I stay in Egypt for treatment?",
    answer:
      "Tourist visas typically allow 30-day stays with possible extensions. Medical visas can accommodate longer treatment periods. We help coordinate visa duration with your treatment timeline and recovery needs.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-visa-4",
    category: "visa",
    question: "Do you provide airport pickup and assistance?",
    answer:
      "Yes, we offer complimentary airport pickup and drop-off services. Our team will meet you at Cairo International Airport and assist with all arrival procedures, including transportation to your accommodation or hospital.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-treatments-1",
    category: "treatments",
    question: "What medical specialties are available?",
    answer:
      "We offer comprehensive medical services including cardiac surgery, orthopedics, cosmetic surgery, dental care, oncology, neurosurgery, fertility treatments, bariatric surgery, ophthalmology (LASIK), and organ transplants.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-treatments-2",
    category: "treatments",
    question: "How do I choose the right doctor for my treatment?",
    answer:
      "Our medical coordinators will match you with specialists based on your condition, preferred treatment approach, and doctor qualifications. You can review doctor profiles, credentials, and patient testimonials before making your decision.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-treatments-3",
    category: "treatments",
    question: "Can I get a second opinion before treatment?",
    answer:
      "Absolutely. We encourage second opinions and can arrange consultations with multiple specialists. This ensures you're completely confident in your treatment plan before proceeding.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-treatments-4",
    category: "treatments",
    question: "What is the typical treatment timeline?",
    answer:
      "Treatment timelines vary by procedure. Simple treatments may require 3-7 days, while complex surgeries might need 2-4 weeks including recovery. We provide detailed timelines during your consultation and help plan accordingly.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-costs-1",
    category: "costs",
    question: "How much can I save compared to treatment in my home country?",
    answer:
      "Patients typically save 50-70% compared to US/European prices while receiving the same quality of care. For example, a heart bypass surgery costing $100,000+ in the US might cost $15,000-25,000 in Egypt, including accommodation and care.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-costs-2",
    category: "costs",
    question: "What is included in the treatment package?",
    answer:
      "Our packages include medical consultation, treatment/surgery, hospital stay, medications, follow-up visits, airport transfers, and medical coordination. Accommodation and additional services can be added based on your preferences.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-costs-3",
    category: "costs",
    question: "What payment methods do you accept?",
    answer:
      "We accept bank transfers, credit cards (Visa, MasterCard), and cash payments. Payment plans can be arranged for complex treatments. We provide detailed cost breakdowns and transparent pricing with no hidden fees.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-costs-4",
    category: "costs",
    question: "Will my insurance cover treatment in Egypt?",
    answer:
      "Some international insurance plans cover overseas medical treatment. We assist with insurance documentation and pre-authorization requests. Even with travel costs, many patients find significant savings compared to domestic treatment.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-accommodation-1",
    category: "accommodation",
    question: "What accommodation options are available?",
    answer:
      "We offer various options from 5-star hotels to comfortable apartments and medical hotels near hospitals. All accommodations are carefully selected for comfort, cleanliness, and proximity to medical service providers.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-accommodation-2",
    category: "accommodation",
    question: "Can my family accompany me during treatment?",
    answer:
      "Yes, we encourage family support during your medical journey. We can arrange accommodation for companions and provide guidance on their visa requirements. Many of our partner hotels offer family-friendly amenities.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-accommodation-3",
    category: "accommodation",
    question: "How is transportation handled during my stay?",
    answer:
      "We provide comprehensive transportation including airport transfers, hospital visits, and local sightseeing if your recovery allows. Our vehicles are comfortable and our drivers are experienced with medical tourism requirements.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-accommodation-4",
    category: "accommodation",
    question: "What amenities are available at your partner accommodations?",
    answer:
      "Our accommodations feature WiFi, 24/7 room service, medical-friendly amenities, proximity to hospitals, and comfortable environments for recovery. Many offer special services for medical tourists including nurse visits and dietary accommodations.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-aftercare-1",
    category: "aftercare",
    question: "What follow-up care is provided after treatment?",
    answer:
      "We provide comprehensive aftercare including post-operative check-ups, medication management, physical therapy if needed, and coordination with your home country physicians for ongoing care. Our support continues after you return home.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-aftercare-2",
    category: "aftercare",
    question: "How do you coordinate care with my doctor at home?",
    answer:
      "We provide detailed medical reports, imaging results, and treatment summaries to your home physicians. Our doctors can consult directly with your local healthcare team to ensure seamless care transition.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-aftercare-3",
    category: "aftercare",
    question: "What if complications arise after I return home?",
    answer:
      "Our doctors remain available for consultation after your return. We maintain communication channels and can provide guidance to your local physicians. In rare cases requiring additional treatment, we assist with return arrangements.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-aftercare-4",
    category: "aftercare",
    question: "Is rehabilitation therapy available in Egypt?",
    answer:
      "Yes, we have excellent rehabilitation service providers and experienced physical therapists. Extended recovery programs can be arranged in Egypt's favorable climate, often providing better outcomes than immediate return home.",
    position: 4,
    status: "published",
  },
  {
    id: "fallback-emergency-1",
    category: "emergency",
    question: "What emergency support is available 24/7?",
    answer:
      "Our medical coordinators are available 24/7 for emergencies. We have direct connections to all partner hospitals and can arrange immediate medical attention. Emergency contact numbers are provided to all patients.",
    position: 1,
    status: "published",
  },
  {
    id: "fallback-emergency-2",
    category: "emergency",
    question: "What safety measures are in place during treatment?",
    answer:
      "All partner service providers follow international safety protocols. We maintain comprehensive medical insurance, have emergency response procedures, and ensure all treatments are performed in accredited service providers with proper safety measures.",
    position: 2,
    status: "published",
  },
  {
    id: "fallback-emergency-3",
    category: "emergency",
    question: "How do you handle medical emergencies?",
    answer:
      "We have established protocols for medical emergencies including immediate hospital access, specialist consultations, family notification procedures, and coordination with embassies if needed. Your safety is our top priority.",
    position: 3,
    status: "published",
  },
  {
    id: "fallback-emergency-4",
    category: "emergency",
    question: "What if I need to return home urgently?",
    answer:
      "We assist with emergency travel arrangements including medical clearance for travel, escort services if needed, and coordination with airlines for medical accommodations. We work with international medical assistance companies when required.",
    position: 4,
    status: "published",
  },
];

function toTitleCase(input: string): string {
  if (!input?.trim()) return "FAQ";
  return input
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const ICON_COMPONENT_CACHE: Record<string, LucideIcon> = {};

function isLucideIcon(candidate: unknown): candidate is LucideIcon {
  if (!candidate) return false;
  if (typeof candidate === "function") return true;
  if (typeof candidate === "object") {
    return "$$typeof" in (candidate as Record<string, unknown>);
  }
  return false;
}

function resolveIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return CircleHelp;
  const normalized = iconName.trim();
  const kebab = normalized
    .replace(/\s+/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  const camel = kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);

  const candidates = Array.from(
    new Set([normalized, pascal, camel, kebab]),
  ).filter(Boolean);

  for (const key of candidates) {
    if (ICON_COMPONENT_CACHE[key]) {
      return ICON_COMPONENT_CACHE[key];
    }

    const fromNamespace = (Icons as Record<string, unknown>)[key];
    // Lucide icons are forwardRef components (objects in React 19), so we verify
    // the export shape instead of assuming every export is an icon.
    if (isLucideIcon(fromNamespace)) {
      ICON_COMPONENT_CACHE[key] = fromNamespace;
      return fromNamespace;
    }
  }

  return CircleHelp;
}

export function getCategoryMeta(
  categoryId: string,
  categories?: FaqCategory[],
): FaqCategoryMeta {
  const fromList = categories?.find((category) => category.slug === categoryId);
  const defaultMeta = FAQ_CATEGORY_META[categoryId as FaqCategoryId];

  if (fromList) {
    const fragment =
      fromList.fragment ||
      defaultMeta?.fragment ||
      FAQ_FRAGMENT_OVERRIDES[fromList.slug] ||
      fromList.slug ||
      "faq";
    const resolvedIcon =
      fromList.icon && fromList.icon.trim().length > 0
        ? resolveIcon(fromList.icon)
        : defaultMeta?.icon || CircleHelp;
    return {
      label: fromList.title || defaultMeta?.label || toTitleCase(categoryId),
      description:
        fromList.description ||
        defaultMeta?.description ||
        "Common questions answered for this topic.",
      icon: resolvedIcon,
      color:
        fromList.color ||
        defaultMeta?.color ||
        "bg-muted text-foreground border-border",
      fragment,
    };
  }

  const typed = categoryId as FaqCategoryId;
  if (FAQ_CATEGORY_META[typed]) {
    return FAQ_CATEGORY_META[typed];
  }

  const label = toTitleCase(categoryId);
  return {
    label,
    description: "Common questions answered for this topic.",
    icon: CircleHelp,
    color: "bg-muted text-foreground border-border",
    fragment: categoryId || "faq",
  };
}

export function getFallbackFaqs(): FaqEntry[] {
  return FALLBACK_FAQ_ENTRIES.map((faq) => ({ ...faq }));
}

export function sortFaqs(
  faqs: FaqEntry[],
  options: { respectCategoryOrder?: boolean } = {},
): FaqEntry[] {
  const categoryPriority = new Map(
    FAQ_CATEGORY_ORDER.map((category, index) => [category, index]),
  );
  const respectCategoryOrder = options.respectCategoryOrder ?? true;
  const unknownRank = Number.POSITIVE_INFINITY;

  return [...faqs].sort((a, b) => {
    const rankA = respectCategoryOrder
      ? (categoryPriority.get(a.category as FaqCategoryId) ?? unknownRank)
      : 0;
    const rankB = respectCategoryOrder
      ? (categoryPriority.get(b.category as FaqCategoryId) ?? unknownRank)
      : 0;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (rankA === unknownRank && rankB === unknownRank) {
      const categoryComparison = String(a.category).localeCompare(
        String(b.category),
      );
      if (categoryComparison !== 0) {
        return categoryComparison;
      }
    }

    const positionA =
      typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER;
    const positionB =
      typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER;

    if (positionA !== positionB) {
      return positionA - positionB;
    }

    return a.question.localeCompare(b.question);
  });
}

export function sortFaqsWithinCategory(faqs: FaqEntry[]): FaqEntry[] {
  return sortFaqs(faqs, { respectCategoryOrder: false });
}

export function groupFaqsByCategory(
  faqs: FaqEntry[],
): Record<string, FaqEntry[]> {
  return faqs.reduce<Record<string, FaqEntry[]>>((grouped, faq) => {
    const key = faq.category || "general";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(faq);
    return grouped;
  }, {});
}

export type FaqCategoryBucket = {
  id: string;
  meta: FaqCategoryMeta;
  items: FaqEntry[];
};

export function buildFaqCategories(
  faqs: FaqEntry[],
  categories?: FaqCategory[],
): FaqCategoryBucket[] {
  const grouped = groupFaqsByCategory(faqs);
  const categoriesList =
    categories && categories.length > 0
      ? categories.slice().sort((a, b) => {
          const positionA =
            typeof a.position === "number"
              ? a.position
              : Number.MAX_SAFE_INTEGER;
          const positionB =
            typeof b.position === "number"
              ? b.position
              : Number.MAX_SAFE_INTEGER;
          if (positionA !== positionB) return positionA - positionB;
          return a.title.localeCompare(b.title);
        })
      : DEFAULT_CATEGORIES;

  const buckets: FaqCategoryBucket[] = [];

  for (const category of categoriesList) {
    const items = grouped[category.slug] ?? [];
    if (!items.length) continue;
    buckets.push({
      id: category.slug,
      meta: getCategoryMeta(category.slug, categoriesList),
      items: sortFaqsWithinCategory(items),
    });
  }

  const knownSlugs = new Set(categoriesList.map((cat) => cat.slug));
  const unknownCategories = Object.keys(grouped).filter(
    (category) => !knownSlugs.has(category),
  );

  for (const category of unknownCategories.sort((a, b) => a.localeCompare(b))) {
    buckets.push({
      id: category,
      meta: getCategoryMeta(category, categoriesList),
      items: sortFaqsWithinCategory(grouped[category] ?? []),
    });
  }

  return buckets;
}

export function getFragmentForCategory(
  categoryId: string,
  categories?: FaqCategory[],
): string {
  const fromList = categories?.find((category) => category.slug === categoryId);
  if (fromList?.fragment) return fromList.fragment;
  return FAQ_FRAGMENT_OVERRIDES[categoryId] ?? categoryId;
}

export function getDefaultCategories(): FaqCategory[] {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}
