import type { Database } from "@/integrations/supabase/types";
import type { PublicLocale } from "@/i18n/routing";

export type NavigationLinkStatus = "published" | "hidden" | "draft";

export type NavigationLinkKind = "system" | "cms" | "manual";

export type NavigationLink = {
  id: string;
  label: string;
  href: string;
  slug: string;
  status: NavigationLinkStatus;
  position: number;
  kind: NavigationLinkKind;
  cmsPageId?: string | null;
  isAutoManaged?: boolean;
};

type NavigationRow = Database["public"]["Tables"]["navigation_links"]["Row"];
type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];
type NavigationRowInput = Pick<
  NavigationRow,
  | "id"
  | "label"
  | "href"
  | "slug"
  | "status"
  | "position"
  | "kind"
  | "cms_page_id"
>;

type NavigationQueryOptions = {
  includeHidden?: boolean;
};

export type NavigationQueryResult = {
  links: NavigationLink[];
  fallback: boolean;
  error?: string;
};

export type CmsPageReference = Pick<CmsPageRow, "id" | "slug">;
export type PublicNavigationCmsPage = Pick<
  CmsPageRow,
  "id" | "slug" | "title" | "status"
>;

const INTERNAL_NAVIGATION_CMS_SLUGS = new Set([
  "medical-facilities-detail-template",
  "blog-category-template",
  "blog-tag-template",
  "blog-author-template",
  "blog-post-template",
]);

function isInternalNavigationCmsSlug(slug: string | null | undefined): boolean {
  if (!slug) {
    return false;
  }

  return INTERNAL_NAVIGATION_CMS_SLUGS.has(slug);
}

// Documented snapshot of the hardcoded routes that previously lived in Header.tsx.
export const DEFAULT_NAVIGATION_ENTRIES: Array<{
  slug: string;
  href: string;
  label: string;
}> = [
  { slug: "home", href: "/", label: "Home" },
  { slug: "about", href: "/about", label: "About Us" },
  { slug: "treatments", href: "/treatments", label: "Treatments" },
  {
    slug: "medical-facilities",
    href: "/medical-facilities",
    label: "Medical Facilities",
  },
  { slug: "doctors", href: "/doctors", label: "Our Doctors" },
  { slug: "stories", href: "/stories", label: "Patient Stories" },
  { slug: "plan", href: "/plan", label: "Plan Your Trip" },
  { slug: "travel-info", href: "/travel-info", label: "Travel Info" },
  { slug: "concierge", href: "/concierge", label: "Concierge" },
  { slug: "blog", href: "/blog", label: "Blog" },
  { slug: "faq", href: "/faq", label: "FAQ" },
  { slug: "contact", href: "/contact", label: "Contact" },
];

export const DEFAULT_QUICK_LINK_SLUGS = [
  "about",
  "treatments",
  "stories",
  "plan",
  "blog",
] as const;

export function getFallbackNavigationLinks(): NavigationLink[] {
  return DEFAULT_NAVIGATION_ENTRIES.map(({ slug, href, label }, index) => ({
    id: `fallback-${slug}`,
    label,
    href,
    slug,
    status: "published",
    position: index,
    kind: "system",
    cmsPageId: null,
  }));
}

export function mapNavigationRow(row: NavigationRowInput): NavigationLink {
  const {
    id,
    label,
    href,
    slug,
    status,
    position,
    kind,
    cms_page_id: cmsPageId,
  } = row;

  return {
    id,
    label,
    href,
    slug,
    status: status as NavigationLinkStatus,
    position: position ?? 0,
    kind: (kind ?? "manual") as NavigationLinkKind,
    cmsPageId,
    isAutoManaged: Boolean(cmsPageId),
  };
}

export function filterOrphanedNavigationRows<
  T extends Pick<NavigationRow, "kind" | "slug" | "cms_page_id">,
>(rows: T[], cmsPages: CmsPageReference[]): T[] {
  const cmsPageIds = new Set(cmsPages.map((page) => page.id));
  const cmsPageSlugs = new Set(cmsPages.map((page) => page.slug));

  return rows.filter((row) => {
    if (isInternalNavigationCmsSlug(row.slug)) {
      return false;
    }

    if (row.cms_page_id) {
      return cmsPageIds.has(row.cms_page_id);
    }

    if (row.kind !== "cms") {
      return true;
    }

    return cmsPageSlugs.has(row.slug);
  });
}

export function sortNavigationLinks(links: NavigationLink[]): NavigationLink[] {
  return [...links].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.label.localeCompare(b.label);
  });
}

export function buildPublicNavigationLinks(
  rows: NavigationRowInput[],
  cmsPages: PublicNavigationCmsPage[],
): NavigationLink[] {
  const filteredRows = filterOrphanedNavigationRows(rows, cmsPages);
  const mappedRows = filteredRows.map(mapNavigationRow);
  const visibleLinks = mappedRows.filter(isNavigationVisible);
  const reservedSlugs = new Set(mappedRows.map((link) => link.slug));

  const cmsLinks: NavigationLink[] = cmsPages
    .filter(
      (page) =>
        page?.slug &&
        page.status === "published" &&
        !isInternalNavigationCmsSlug(page.slug) &&
        !reservedSlugs.has(page.slug),
    )
    .map((page, index) => ({
      id: `cms-${page.id ?? page.slug}`,
      label: page.title ?? page.slug,
      href: page.slug === "home" ? "/" : `/${page.slug}`,
      slug: page.slug!,
      status: "published",
      position: visibleLinks.length + index + 1000,
      kind: "cms",
      cmsPageId: page.id ?? null,
    }));

  return sortNavigationLinks([...visibleLinks, ...cmsLinks]);
}

export function mergeWithFallback(links: NavigationLink[]): NavigationLink[] {
  if (!links.length) {
    return getFallbackNavigationLinks();
  }

  return sortNavigationLinks([...links]);
}

export function isNavigationVisible(link: NavigationLink): boolean {
  return link.status === "published";
}

export function selectQuickLinks(links: NavigationLink[]): NavigationLink[] {
  const quickSlugs = new Set<string>(DEFAULT_QUICK_LINK_SLUGS);
  return links.filter((link) => quickSlugs.has(link.slug));
}

export async function fetchNavigationLinks(
  locale: PublicLocale,
  _client?: unknown,
  _options: NavigationQueryOptions = {},
): Promise<NavigationQueryResult> {
  try {
    const response = await fetch(`/api/navigation/public?locale=${locale}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text();
      return {
        links: getFallbackNavigationLinks(),
        fallback: true,
        error:
          errorText || `Failed to load navigation (status ${response.status})`,
      };
    }

    const json = (await response.json()) as {
      links?: Array<NavigationLink | NavigationRowInput>;
    };
    const data = Array.isArray(json.links) ? json.links : [];

    const normalizedLinks = data.map((link) =>
      "cms_page_id" in link
        ? mapNavigationRow(link as NavigationRowInput)
        : link,
    );

    return {
      links: sortNavigationLinks(normalizedLinks),
      fallback: false,
    };
  } catch (error: any) {
    return {
      links: getFallbackNavigationLinks(),
      fallback: true,
      error: error?.message ?? "Unknown error loading navigation",
    };
  }
}
