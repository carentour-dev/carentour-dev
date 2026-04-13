import { NextRequest, NextResponse } from "next/server";
import { getLocalizedBlogTagBySlug } from "@/lib/blog/server";
import { resolvePublicLocaleFromRequest } from "@/lib/public/requestLocale";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = resolvePublicLocaleFromRequest(request);
    const tag = await getLocalizedBlogTagBySlug({
      slug,
      locale,
      publishedOnly: true,
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
