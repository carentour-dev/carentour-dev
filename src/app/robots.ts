import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN, INTERNAL_NOINDEX_PREFIXES } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...INTERNAL_NOINDEX_PREFIXES],
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "ClaudeBot", "CCBot"],
        allow: "/",
        disallow: [...INTERNAL_NOINDEX_PREFIXES],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
}
