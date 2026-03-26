import { NextResponse } from "next/server";
import {
  CANONICAL_ORIGIN,
  getPublicRouteInventory,
  isInternalNoindexPath,
  listSeoOverrides,
  normalizePath,
} from "@/lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET() {
  const [inventory, overrides] = await Promise.all([
    getPublicRouteInventory("en"),
    listSeoOverrides({ locale: "en" }),
  ]);

  const overrideLookup = new Map(
    overrides.map((row) => [normalizePath(row.route_key), row]),
  );

  const routes = inventory
    .filter(
      (entry) => entry.indexable && !isInternalNoindexPath(entry.pathname),
    )
    .map((entry) => {
      const override = overrideLookup.get(normalizePath(entry.routeKey));
      return {
        pathname: entry.pathname,
        title: override?.title ?? entry.sourceTitle ?? entry.label,
        summary:
          override?.ai_summary ??
          override?.description ??
          entry.sourceDescription ??
          null,
        include: override?.llms_include ?? true,
        priority: override?.llms_priority ?? 0,
      };
    })
    .filter((entry) => entry.include)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.pathname.localeCompare(b.pathname);
    });

  const lines = [
    "# llms.txt",
    "project: Care N Tour",
    `origin: ${CANONICAL_ORIGIN}`,
    "language: en",
    "",
    "## Indexable Routes",
    ...routes.map((entry) => {
      const summary = entry.summary ? ` | ${entry.summary}` : "";
      return `- ${entry.pathname} | ${entry.title}${summary}`;
    }),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
