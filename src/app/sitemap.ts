import type { MetadataRoute } from "next";
import {
  CANONICAL_ORIGIN,
  getPublicRouteInventory,
  isInternalNoindexPath,
} from "@/lib/seo";
import { getPublicLocaleAvailability } from "@/lib/public/localization";
import { localizePublicPathname } from "@/lib/public/routing";

export const revalidate = 300;
const INVENTORY_TIMEOUT_MS = 5000;
const LOCALE_AVAILABILITY_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs).unref();
    }),
  ]);
}

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
  let inventory: Awaited<ReturnType<typeof getPublicRouteInventory>>;

  try {
    inventory = await withTimeout(
      getPublicRouteInventory("en"),
      INVENTORY_TIMEOUT_MS,
      "SEO inventory",
    );
  } catch (error) {
    console.error("Failed to build dynamic sitemap inventory", error);

    // Keep deployments alive if CMS/DB dependencies are temporarily unavailable.
    return [
      {
        url: `${CANONICAL_ORIGIN}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }

  const unique = new Map<string, (typeof inventory)[number]>();
  for (const entry of inventory) {
    if (!entry.indexable || isInternalNoindexPath(entry.pathname)) {
      continue;
    }
    unique.set(entry.pathname, entry);
  }

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const uniqueEntries = [...unique.values()];
  const arabicAvailability = await Promise.all(
    uniqueEntries.map(async (entry) => {
      try {
        return await withTimeout(
          getPublicLocaleAvailability(entry.pathname, "ar"),
          LOCALE_AVAILABILITY_TIMEOUT_MS,
          `Arabic locale availability for ${entry.pathname}`,
        );
      } catch (error) {
        console.warn(
          "Failed to resolve Arabic locale availability for sitemap",
          {
            pathname: entry.pathname,
            error,
          },
        );
        return false;
      }
    }),
  );

  for (const [index, entry] of uniqueEntries.entries()) {
    sitemapEntries.push({
      url: `${CANONICAL_ORIGIN}${entry.pathname}`,
      lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
      changeFrequency: resolveFrequency(entry.pathname),
      priority: resolvePriority(entry.pathname),
    });

    if (arabicAvailability[index]) {
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
