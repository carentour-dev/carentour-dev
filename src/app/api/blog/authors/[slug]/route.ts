import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: author, error } = await supabase
      .from("blog_authors")
      .select("id, slug, name, bio, avatar, website, social_links")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error || !author) {
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
