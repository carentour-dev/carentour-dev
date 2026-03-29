import { CANONICAL_ORIGIN } from "@/lib/seo/constants";
import { normalizePath, toAbsoluteUrl } from "@/lib/seo/utils";
import type { JsonLdNode } from "@/lib/seo/types";

const organizationId = `${CANONICAL_ORIGIN}#organization`;
const websiteId = `${CANONICAL_ORIGIN}#website`;

const cleanText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toIsoDateTime = (value: string | null | undefined) => {
  const trimmed = cleanText(value);
  if (!trimmed) {
    return undefined;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return new Date(parsed).toISOString();
};

export function organizationSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: "Care N Tour",
    url: CANONICAL_ORIGIN,
    logo: {
      "@type": "ImageObject",
      url: `${CANONICAL_ORIGIN}/carentour-logo-light.png`,
    },
    sameAs: ["https://www.carentour.com"],
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: CANONICAL_ORIGIN,
    name: "Care N Tour",
    publisher: {
      "@id": organizationId,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${CANONICAL_ORIGIN}/blog?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageSchema(input: {
  urlPath: string;
  title: string;
  description?: string | null;
  breadcrumbs?: Array<{ name: string; path: string }>;
}): JsonLdNode {
  const canonicalUrl = `${CANONICAL_ORIGIN}${normalizePath(input.urlPath)}`;

  const schema: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: input.title,
    description: input.description ?? undefined,
    isPartOf: {
      "@id": websiteId,
    },
    about: {
      "@id": organizationId,
    },
  };

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    schema.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: input.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${CANONICAL_ORIGIN}${normalizePath(item.path)}`,
      })),
    };
  }

  return schema;
}

export function collectionPageSchema(input: {
  urlPath: string;
  title: string;
  description?: string | null;
  items?: Array<{ name: string; path: string }>;
}): JsonLdNode {
  const canonicalUrl = `${CANONICAL_ORIGIN}${normalizePath(input.urlPath)}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    url: canonicalUrl,
    name: input.title,
    description: input.description ?? undefined,
    isPartOf: {
      "@id": websiteId,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items?.length ?? 0,
      itemListElement:
        input.items?.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: `${CANONICAL_ORIGIN}${normalizePath(item.path)}`,
        })) ?? [],
    },
  };
}

export function blogPostingSchema(input: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authorName?: string | null;
  keywords?: string[];
}): JsonLdNode {
  const url = `${CANONICAL_ORIGIN}${normalizePath(input.path)}`;
  const keywords =
    input.keywords
      ?.map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0) ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ? toAbsoluteUrl(input.imageUrl) : undefined,
    datePublished: toIsoDateTime(input.publishedTime),
    dateModified:
      toIsoDateTime(input.modifiedTime) ?? toIsoDateTime(input.publishedTime),
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : undefined,
    publisher: {
      "@id": organizationId,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords,
  };
}

export function faqPageSchema(input: {
  path: string;
  faqs: Array<{ question: string; answer: string }>;
}): JsonLdNode {
  const faqs = input.faqs
    .map((entry) => ({
      question: cleanText(entry.question),
      answer: cleanText(entry.answer),
    }))
    .filter((entry): entry is { question: string; answer: string } =>
      Boolean(entry.question && entry.answer),
    );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
    url: `${CANONICAL_ORIGIN}${normalizePath(input.path)}`,
  };
}

export function medicalOrganizationSchema(input: {
  path: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: input.name,
    url: `${CANONICAL_ORIGIN}${normalizePath(input.path)}`,
    description: input.description ?? undefined,
    image: input.imageUrl ? toAbsoluteUrl(input.imageUrl) : undefined,
  };
}

export function physicianSchema(input: {
  path: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  specialty?: string | null;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: input.name,
    url: `${CANONICAL_ORIGIN}${normalizePath(input.path)}`,
    description: input.description ?? undefined,
    image: input.imageUrl ? toAbsoluteUrl(input.imageUrl) : undefined,
    medicalSpecialty: input.specialty ?? undefined,
  };
}

export function medicalProcedureSchema(input: {
  path: string;
  name: string;
  description?: string | null;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: input.name,
    description: input.description ?? undefined,
    url: `${CANONICAL_ORIGIN}${normalizePath(input.path)}`,
  };
}

export function serviceSchema(input: {
  path: string;
  name: string;
  description?: string | null;
  serviceType?: string | null;
  availableLanguage?: string[] | null;
  areaServed?: string[] | null;
}): JsonLdNode {
  const languages =
    input.availableLanguage
      ?.map((language) => cleanText(language))
      .filter((language): language is string => Boolean(language)) ?? undefined;
  const areas =
    input.areaServed
      ?.map((area) => cleanText(area))
      .filter((area): area is string => Boolean(area)) ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description ?? undefined,
    url: `${CANONICAL_ORIGIN}${normalizePath(input.path)}`,
    serviceType: cleanText(input.serviceType ?? undefined),
    provider: {
      "@id": organizationId,
    },
    availableLanguage: languages,
    areaServed: areas,
  };
}
