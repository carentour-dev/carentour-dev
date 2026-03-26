import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getPublicRouteInventory } from "@/lib/seo";
import { ApiError } from "@/server/utils/errors";

const ALLOWED_SOURCE_TYPES = new Set([
  "all",
  "static",
  "cms-page",
  "blog-category",
  "blog-post",
  "blog-tag",
  "blog-author",
  "treatment",
  "doctor",
  "medical-facility",
  "patient-story",
]);

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");

    const params = request.nextUrl.searchParams;
    const localeRaw = params.get("locale");
    if (localeRaw && localeRaw !== "en" && localeRaw !== "ar") {
      throw new ApiError(400, "Invalid locale");
    }
    const locale = localeRaw === "ar" ? "ar" : "en";

    const sourceType = (params.get("sourceType") ?? "all").trim().toLowerCase();
    if (!ALLOWED_SOURCE_TYPES.has(sourceType)) {
      throw new ApiError(400, "Invalid sourceType");
    }

    const minScore = Number(params.get("minScore") ?? "0");
    if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
      throw new ApiError(400, "Invalid minScore");
    }
    const limit = Number(params.get("limit") ?? "2000");
    const offset = Number(params.get("offset") ?? "0");
    if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
      throw new ApiError(400, "Invalid limit");
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ApiError(400, "Invalid offset");
    }

    const query = params.get("query")?.trim().toLowerCase() ?? "";

    const inventory = await getPublicRouteInventory(locale);
    const sourceTypes = Array.from(
      new Set(inventory.map((entry) => entry.sourceType)),
    ).sort((a, b) => a.localeCompare(b));

    const filtered = inventory.filter((entry) => {
      if (sourceType !== "all" && entry.sourceType !== sourceType) {
        return false;
      }

      if (entry.needsSeoScore < minScore) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        entry.pathname,
        entry.label,
        entry.sourceTitle,
        entry.sourceDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    const summary = filtered.reduce(
      (acc, entry) => {
        acc.total += 1;
        if (entry.needsSeoScore >= 60) {
          acc.highPriority += 1;
        } else if (entry.needsSeoScore >= 30) {
          acc.mediumPriority += 1;
        } else {
          acc.lowPriority += 1;
        }
        return acc;
      },
      { total: 0, highPriority: 0, mediumPriority: 0, lowPriority: 0 },
    );
    const pagedEntries = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      locale,
      sourceTypes,
      summary,
      entries: pagedEntries,
      pagination: {
        total: filtered.length,
        offset,
        limit,
        hasMore: offset + limit < filtered.length,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500
              ? "Failed to build SEO inventory"
              : error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to build SEO inventory" },
      { status: 500 },
    );
  }
}
