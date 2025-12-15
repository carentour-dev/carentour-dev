import {
  getFallbackNavigationLinks,
  mapNavigationRow,
  sortNavigationLinks,
  type NavigationLink,
  type NavigationQueryResult,
} from "@/lib/navigation";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { unstable_noStore as noStore } from "next/cache";

const NAVIGATION_COLUMNS =
  "id,label,href,slug,status,position,kind,cms_page_id";

export async function loadPublicNavigationLinks(): Promise<NavigationQueryResult> {
  // Navigation updates (like hiding/showing links) should appear immediately.
  // Disable Next.js fetch caching so we always render with fresh data.
  noStore();

  try {
    const supabase = getSupabaseAdmin();

    const [
      { data: navRows, error: navError },
      { data: cmsPages, error: cmsError },
    ] = await Promise.all([
      supabase
        .from("navigation_links")
        .select(NAVIGATION_COLUMNS)
        .eq("status", "published")
        .order("position", { ascending: true })
        .order("label", { ascending: true }),
      supabase
        .from("cms_pages")
        .select("id, slug, title, status")
        .eq("status", "published")
        .order("title", { ascending: true }),
    ]);

    if (navError) {
      return {
        links: getFallbackNavigationLinks(),
        fallback: true,
        error: navError.message,
      };
    }

    const navLinks = (navRows ?? []).map(mapNavigationRow);
    const existingSlugs = new Set(navLinks.map((link) => link.slug));

    const cmsLinks: NavigationLink[] = (cmsPages ?? [])
      .filter(
        (page) =>
          page?.slug &&
          page.status === "published" &&
          !existingSlugs.has(page.slug),
      )
      .map((page, index) => ({
        id: `cms-${page.id ?? page.slug}`,
        label: page.title ?? page.slug,
        href: page.slug === "home" ? "/" : `/${page.slug}`,
        slug: page.slug!,
        status: "published",
        position: navLinks.length + index + 1000,
        kind: "cms",
        cmsPageId: page.id ?? null,
      }));

    if (cmsError) {
      console.warn(
        "Failed to load published CMS pages for navigation",
        cmsError,
      );
    }

    const combined = sortNavigationLinks([...navLinks, ...cmsLinks]);
    const links = combined.length ? combined : getFallbackNavigationLinks();

    return {
      links,
      fallback: Boolean(cmsError),
      error: undefined,
    };
  } catch (error: any) {
    console.error("Failed to load public navigation links", error);
    return {
      links: getFallbackNavigationLinks(),
      fallback: true,
      error: error?.message ?? "Unknown error loading navigation",
    };
  }
}
