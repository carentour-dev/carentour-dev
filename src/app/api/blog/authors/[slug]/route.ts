import { NextRequest, NextResponse } from "next/server";
import { BLOG_SURFACE_REVALIDATE_SECONDS } from "@/lib/blog/revalidation";
import { getLocalizedBlogAuthorBySlug } from "@/lib/blog/server";
import { resolvePublicLocaleFromRequest } from "@/lib/public/requestLocale";

export const revalidate = BLOG_SURFACE_REVALIDATE_SECONDS;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = resolvePublicLocaleFromRequest(request);
    const author = await getLocalizedBlogAuthorBySlug({
      slug,
      locale,
      publishedOnly: true,
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    return NextResponse.json({ author });
  } catch (error) {
    console.error("Error fetching author:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
