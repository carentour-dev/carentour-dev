import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { createRouteRedirect, resolveRouteRedirect } from "@/lib/seo/data";
import { normalizePath } from "@/lib/seo/utils";

export async function recordPathRedirect(input: {
  fromPath: string;
  toPath: string;
  code?: 301 | 302 | 307 | 308;
  source?: string;
  sourceMetadata?: Record<string, unknown>;
  createdBy?: string | null;
}) {
  const fromPath = normalizePath(input.fromPath);
  const toPath = normalizePath(input.toPath);

  if (fromPath === toPath) {
    return null;
  }

  return createRouteRedirect({
    fromPath,
    toPath,
    code: input.code ?? 301,
    source: input.source,
    sourceMetadata: input.sourceMetadata,
    createdBy: input.createdBy,
    isActive: true,
    mode: "upsert",
  });
}

export async function maybeRedirectFromLegacyPath(pathname: string) {
  try {
    const requestHeaders = await headers();
    if (requestHeaders.get("x-route-redirect-checked") === "1") {
      return false;
    }
  } catch {
    // Static generation has no request context, so redirect-table lookups
    // are not useful there and can make builds depend on live upstream data.
    return false;
  }

  const match = await resolveRouteRedirect(pathname);

  if (!match) {
    return false;
  }

  const target = normalizePath(match.to_path);

  if (match.code === 301 || match.code === 308) {
    permanentRedirect(target);
  }

  redirect(target);
}
