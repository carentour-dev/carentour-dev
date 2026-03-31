import {
  buildPublicNavigationLinks,
  getFallbackNavigationLinks,
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

    const links = buildPublicNavigationLinks(navRows ?? [], cmsPages ?? []);

    if (cmsError) {
      console.warn(
        "Failed to load published CMS pages for navigation",
        cmsError,
      );
    }

    return {
      links: links.length ? links : getFallbackNavigationLinks(),
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
