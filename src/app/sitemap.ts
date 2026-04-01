import type { MetadataRoute } from "next";
import {
  CANONICAL_ORIGIN,
  getPublicRouteInventory,
  isInternalNoindexPath,
} from "@/lib/seo";
import { getPublicLocaleAvailability } from "@/lib/public/localization";
import { localizePublicPathname } from "@/lib/public/routing";

export const dynamic = "force-dynamic";

function resolvePriority(pathname: string) {
  if (pathname === "/") return 1;
  if (pathname.startsWith("/blog/")) return 0.8;
  if (pathname.startsWith("/treatments/")) return 0.85;
  if (pathname.startsWith("/doctors/")) return 0.8;
  if (pathname.startsWith("/medical-facilities/")) return 0.8;
  if (pathname.startsWith("/patients/")) return 0.65;
  return 0.7;
}

function resolveFrequency(
  pathname: string,
): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (pathname === "/") return "daily";
  if (pathname.startsWith("/blog")) return "daily";
  if (pathname.startsWith("/treatments") || pathname.startsWith("/doctors")) {
    return "weekly";
  }
  return "monthly";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const inventory = await getPublicRouteInventory("en");

  const unique = new Map<string, (typeof inventory)[number]>();
  for (const entry of inventory) {
    if (!entry.indexable || isInternalNoindexPath(entry.pathname)) {
      continue;
    }
    unique.set(entry.pathname, entry);
  }

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const entry of unique.values()) {
    sitemapEntries.push({
      url: `${CANONICAL_ORIGIN}${entry.pathname}`,
      lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
      changeFrequency: resolveFrequency(entry.pathname),
      priority: resolvePriority(entry.pathname),
    });

    if (await getPublicLocaleAvailability(entry.pathname, "ar")) {
      sitemapEntries.push({
        url: `${CANONICAL_ORIGIN}${localizePublicPathname(entry.pathname, "ar")}`,
        lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        changeFrequency: resolveFrequency(entry.pathname),
        priority: resolvePriority(entry.pathname),
      });
    }
  }

  return sitemapEntries;
}
