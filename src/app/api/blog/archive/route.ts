import { NextRequest, NextResponse } from "next/server";

import {
  getLocalizedBlogAuthorBySlug,
  getLocalizedBlogCategoryBySlug,
  getLocalizedBlogTagBySlug,
  listLocalizedBlogPosts,
} from "@/lib/blog/server";
import { resolvePublicLocaleFromRequest } from "@/lib/public/requestLocale";

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const locale = resolvePublicLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") ?? "latest";
    const slug = searchParams.get("slug")?.trim() ?? "";
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const limit = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 12),
      24,
    );

    let categoryId: string | null = null;
    let tagId: string | null = null;
    let authorId: string | null = null;

    if (scope === "category") {
      if (!slug) {
        return NextResponse.json(
          { error: "slug is required for category archives" },
          { status: 400 },
        );
      }

      const category = await getLocalizedBlogCategoryBySlug({
        slug,
        locale,
        publishedOnly: true,
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }

      categoryId = category.id;
    } else if (scope === "tag") {
      if (!slug) {
        return NextResponse.json(
          { error: "slug is required for tag archives" },
          { status: 400 },
        );
      }

      const tag = await getLocalizedBlogTagBySlug({
        slug,
        locale,
        publishedOnly: true,
      });
      if (!tag) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }

      tagId = tag.id;
    } else if (scope === "author") {
      if (!slug) {
        return NextResponse.json(
          { error: "slug is required for author archives" },
          { status: 400 },
        );
      }

      const author = await getLocalizedBlogAuthorBySlug({
        slug,
        locale,
        publishedOnly: true,
      });
      if (!author) {
        return NextResponse.json(
          { error: "Author not found" },
          { status: 404 },
        );
      }

      authorId = author.id;
    } else if (scope !== "latest") {
      return NextResponse.json(
        { error: "Unsupported archive scope" },
        { status: 400 },
      );
    }

    const result = await listLocalizedBlogPosts({
      locale,
      page,
      limit,
      categoryId,
      tagId,
      authorId,
      publishedOnly: true,
    });

    return NextResponse.json({
      posts: result.posts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Unexpected error fetching blog archive posts", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
