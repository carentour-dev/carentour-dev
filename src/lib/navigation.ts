import type { Database } from "@/integrations/supabase/types";

export type NavigationLinkStatus = "published" | "hidden";

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

type NavigationQueryOptions = {
  includeHidden?: boolean;
};

type NavigationQueryResult = {
  links: NavigationLink[];
  fallback: boolean;
  error?: string;
};

// Documented snapshot of the hardcoded routes that previously lived in Header.tsx.
export const DEFAULT_NAVIGATION_ENTRIES: Array<{
  slug: string;
  href: string;
  label: string;
}> = [
  { slug: "home", href: "/", label: "Home" },
  { slug: "about", href: "/about", label: "About Us" },
  { slug: "treatments", href: "/treatments", label: "Treatments" },
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

export function mapNavigationRow(row: NavigationRow): NavigationLink {
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

export function sortNavigationLinks(links: NavigationLink[]): NavigationLink[] {
  return [...links].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.label.localeCompare(b.label);
  });
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
  _client?: unknown,
  _options: NavigationQueryOptions = {},
): Promise<NavigationQueryResult> {
  try {
    const response = await fetch("/api/navigation/public", {
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

    const json = (await response.json()) as { links?: NavigationRow[] };
    const data = Array.isArray(json.links) ? json.links : [];

    return {
      links: sortNavigationLinks(data.map(mapNavigationRow)),
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
