import { NextRequest, NextResponse } from "next/server";
import {
  listSeoOverrides,
  normalizePath,
  revalidateSeoPaths,
  seoOverrideUpsertSchema,
  upsertSeoOverride,
} from "@/lib/seo";
import { requirePermission } from "@/server/auth/requireAdmin";
import { ApiError } from "@/server/utils/errors";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");

    const params = request.nextUrl.searchParams;
    const localeRaw = params.get("locale");
    if (localeRaw && localeRaw !== "en" && localeRaw !== "ar") {
      throw new ApiError(400, "Invalid locale");
    }
    const routeKey = params.get("routeKey");

    const overrides = await listSeoOverrides({
      locale: localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : undefined,
      routeKey: routeKey ? normalizePath(routeKey) : undefined,
    });

    return NextResponse.json({ overrides });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500
              ? "Failed to load SEO overrides"
              : error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to load SEO overrides" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requirePermission("cms.write");

    const body = await request.json().catch((error) => {
      if (error instanceof SyntaxError) {
        throw new ApiError(400, "Invalid JSON payload");
      }
      throw error;
    });
    const parsed = seoOverrideUpsertSchema.parse(body);
    const normalizedRouteKey = normalizePath(parsed.routeKey);

    const override = await upsertSeoOverride({
      routeKey: normalizedRouteKey,
      locale: parsed.locale,
      updatedAt: parsed.updatedAt,
      title: parsed.title,
      description: parsed.description,
      canonicalUrl: parsed.canonicalUrl,
      robotsIndex: parsed.robotsIndex,
      robotsFollow: parsed.robotsFollow,
      ogTitle: parsed.ogTitle,
      ogDescription: parsed.ogDescription,
      ogImageUrl: parsed.ogImageUrl,
      twitterTitle: parsed.twitterTitle,
      twitterDescription: parsed.twitterDescription,
      twitterImageUrl: parsed.twitterImageUrl,
      keywords: parsed.keywords,
      schemaOverride: parsed.schemaOverride,
      aiSummary: parsed.aiSummary,
      llmsInclude: parsed.llmsInclude,
      llmsPriority: parsed.llmsPriority,
      updatedBy: context.user.id,
    });

    revalidateSeoPaths([normalizedRouteKey]);

    return NextResponse.json({ override });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500
              ? "Failed to update SEO override"
              : error.message,
        },
        { status: error.status },
      );
    }

    if (error?.issues) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update SEO override" },
      { status: 500 },
    );
  }
}
