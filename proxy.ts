import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import {
  getLocalizedRedirectTargetPath,
  getRedirectLookupPathCandidates,
} from "@/lib/seo/redirect-paths";
import { stripPublicLocalePrefix } from "@/lib/public/routing";
import { isInternalNoindexPath, normalizePath } from "@/lib/seo/utils";

type RedirectLookupRow = {
  to_path: string;
  code: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isRedirectCode = (value: number): value is 301 | 302 | 307 | 308 =>
  value === 301 || value === 302 || value === 307 || value === 308;

const intlMiddleware = createMiddleware(routing);

function continueRequest(request: NextRequest) {
  const nextHeaders = new Headers(request.headers);
  nextHeaders.set("x-route-redirect-checked", "1");
  return NextResponse.next({
    request: {
      headers: nextHeaders,
    },
  });
}

async function lookupRouteRedirect(
  pathname: string,
): Promise<{ toPath: string; code: 301 | 302 | 307 | 308 } | null> {
  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  for (const candidatePath of getRedirectLookupPathCandidates(pathname)) {
    const url = new URL("/rest/v1/route_redirects", supabaseUrl);
    url.searchParams.set("select", "to_path,code");
    url.searchParams.set("from_path", `eq.${candidatePath}`);
    url.searchParams.set("is_active", "eq.true");
    url.searchParams.set("limit", "1");

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          apikey: supabasePublicKey,
          Authorization: `Bearer ${supabasePublicKey}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const rows = (await response.json()) as RedirectLookupRow[];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row || typeof row.to_path !== "string") {
        continue;
      }

      const code = isRedirectCode(row.code) ? row.code : 301;
      return {
        toPath: row.to_path,
        code,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const pathname = normalizePath(request.nextUrl.pathname);
  const hasLocalePrefix = pathname === "/ar" || pathname.startsWith("/ar/");
  const isFrameworkAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname);
  if (isFrameworkAsset) {
    return continueRequest(request);
  }

  const basePathname = stripPublicLocalePrefix(pathname);
  const locale =
    pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";

  if (isInternalNoindexPath(basePathname)) {
    return continueRequest(request);
  }

  const redirectMatch = await lookupRouteRedirect(basePathname);
  if (!redirectMatch) {
    return hasLocalePrefix ? intlMiddleware(request) : continueRequest(request);
  }

  const localizedTargetPath = getLocalizedRedirectTargetPath(
    pathname,
    redirectMatch.toPath,
  );

  if (localizedTargetPath === pathname) {
    return continueRequest(request);
  }

  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = localizedTargetPath;

  return NextResponse.redirect(targetUrl, redirectMatch.code);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
