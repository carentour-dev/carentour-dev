import { NextRequest, NextResponse } from "next/server";
import { getLocalizedBlogPostByPath } from "@/lib/blog/server";
import { resolvePublicLocaleFromRequest } from "@/lib/public/requestLocale";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  try {
    const { category: categorySlug, slug } = await params;
    const locale = resolvePublicLocaleFromRequest(request);

    const post = await getLocalizedBlogPostByPath({
      categorySlug,
      postSlug: slug,
      locale,
      publishedOnly: true,
      incrementViewCount: true,
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
