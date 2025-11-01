import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const author = searchParams.get("author");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Build query for published posts only
    let query = supabase
      .from("blog_posts")
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        featured_image,
        category_id,
        publish_date,
        reading_time,
        view_count,
        featured,
        category:blog_categories(id, name, slug, color),
        author:blog_authors(id, name, slug, avatar),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
        { count: "exact" },
      )
      .eq("status", "published")
      .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
      .order("publish_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq("category_id", category);
    }

    if (tag) {
      // For tag filtering, we need to join through the junction table
      query = query.contains("tags", [{ tag: { id: tag } }]);
    }

    if (author) {
      query = query.eq("author_id", author);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    if (featured === "true") {
      query = query.eq("featured", true);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Error fetching blog posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch blog posts" },
        { status: 500 },
      );
    }

    // Transform tags from nested structure
    const transformedPosts =
      posts?.map((post) => ({
        ...post,
        tags: post.tags?.map((t: any) => t.tag) || [],
      })) || [];

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
