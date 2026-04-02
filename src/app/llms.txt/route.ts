import { NextResponse } from "next/server";
import { publicLocales, type PublicLocale } from "@/i18n/routing";
import {
  getPublicLocaleAvailability,
  resolvePublicLocaleSwitchHref,
} from "@/lib/public/localization";
import {
  CANONICAL_ORIGIN,
  getPublicRouteInventory,
  isInternalNoindexPath,
  listSeoOverrides,
  normalizePath,
} from "@/lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

async function buildLocaleRoutes(locale: PublicLocale) {
  const [inventory, overrides] = await Promise.all([
    getPublicRouteInventory(locale),
    listSeoOverrides({ locale }),
  ]);

  const overrideLookup = new Map(
    overrides.map((row) => [normalizePath(row.route_key), row]),
  );

  const localizedEntries = await Promise.all(
    inventory
      .filter(
        (entry) => entry.indexable && !isInternalNoindexPath(entry.pathname),
      )
      .map(async (entry) => {
        const override = overrideLookup.get(normalizePath(entry.routeKey));
        const include = override?.llms_include ?? true;

        if (!include) {
          return null;
        }

        if (locale !== "en") {
          const isAvailable = await getPublicLocaleAvailability(
            entry.pathname,
            locale,
          );
          if (!isAvailable) {
            return null;
          }
        }

        const pathname =
          locale === "en"
            ? entry.pathname
            : await resolvePublicLocaleSwitchHref(entry.pathname, locale);

        return {
          pathname,
          title: override?.title ?? entry.sourceTitle ?? entry.label,
          summary:
            override?.ai_summary ??
            override?.description ??
            entry.sourceDescription ??
            null,
          priority: override?.llms_priority ?? 0,
        };
      }),
  );

  return localizedEntries
    .filter(
      (
        entry,
      ): entry is {
        pathname: string;
        title: string;
        summary: string | null;
        priority: number;
      } => Boolean(entry),
    )
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.pathname.localeCompare(b.pathname);
    });
}

export async function GET() {
  const routeSections = await Promise.all(
    publicLocales.map(async (locale) => ({
      locale,
      routes: await buildLocaleRoutes(locale),
    })),
  );

  const lines = [
    "# llms.txt",
    "project: Care N Tour",
    `origin: ${CANONICAL_ORIGIN}`,
    `languages: ${publicLocales.join(", ")}`,
    "",
    ...routeSections.flatMap(({ locale, routes }) => [
      `## ${locale === "ar" ? "Arabic" : "English"} Routes`,
      ...(routes.length > 0
        ? routes.map((entry) => {
            const summary = entry.summary ? ` | ${entry.summary}` : "";
            return `- ${entry.pathname} | ${entry.title}${summary}`;
          })
        : ["- No indexable routes available."]),
      "",
    ]),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
