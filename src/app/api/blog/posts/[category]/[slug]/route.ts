import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; slug: string } },
) {
  try {
    const supabase = await createClient();
    const { category: categorySlug, slug } = params;

    // First get the category
    const { data: category, error: categoryError } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Then get the post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        category:blog_categories(id, name, slug, color, description),
        author:blog_authors(id, name, slug, bio, avatar, website, social_links),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
      )
      .eq("slug", slug)
      .eq("category_id", category.id)
      .eq("status", "published")
      .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
      .single();

    if (error) {
      console.error("Error fetching blog post:", error);
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    // Transform tags
    const transformedPost = {
      ...post,
      tags: post.tags?.map((t: any) => t.tag) || [],
    };

    // Increment view count (fire and forget)
    supabase.rpc("increment_blog_post_view_count", { post_id: post.id }).then();

    return NextResponse.json({ post: transformedPost });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
