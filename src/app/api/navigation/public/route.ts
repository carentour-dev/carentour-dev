import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import {
  getFallbackNavigationLinks,
  mapNavigationRow,
  sortNavigationLinks,
  type NavigationLink,
} from "@/lib/navigation";

const NAVIGATION_COLUMNS =
  "id,label,href,slug,status,position,kind,cms_page_id";

export async function GET() {
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
    return NextResponse.json(
      { error: navError.message, links: getFallbackNavigationLinks() },
      { status: 500 },
    );
  }

  const navLinks: NavigationLink[] = (navRows ?? []).map(mapNavigationRow);
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
    console.warn("Failed to load published CMS pages for navigation", cmsError);
  }

  const combined = sortNavigationLinks([...navLinks, ...cmsLinks]);
  const links = combined.length ? combined : getFallbackNavigationLinks();

  return NextResponse.json({ links });
}
