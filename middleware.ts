import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

  const url = new URL("/rest/v1/route_redirects", supabaseUrl);
  url.searchParams.set("select", "to_path,code");
  url.searchParams.set("from_path", `eq.${pathname}`);
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
      return null;
    }

    const rows = (await response.json()) as RedirectLookupRow[];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || typeof row.to_path !== "string") {
      return null;
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

export async function middleware(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const pathname = normalizePath(request.nextUrl.pathname);
  if (isInternalNoindexPath(pathname)) {
    return continueRequest(request);
  }

  const redirectMatch = await lookupRouteRedirect(pathname);
  if (!redirectMatch) {
    return continueRequest(request);
  }

  const targetPath = normalizePath(redirectMatch.toPath);
  if (targetPath === pathname) {
    return continueRequest(request);
  }

  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = targetPath;

  return NextResponse.redirect(targetUrl, redirectMatch.code);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
