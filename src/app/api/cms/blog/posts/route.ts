import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "editor"]);
    const supabase = getSupabaseAdmin();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("blog_posts")
      .select(
        `
        *,
        category:blog_categories(id, name, slug, color),
        author:blog_authors(id, name, slug, avatar),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category_id", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
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

export async function POST(request: NextRequest) {
  try {
    const context = await requireRole(["admin", "editor"]);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      author_id,
      status = "draft",
      publish_date,
      reading_time,
      seo_title,
      seo_description,
      seo_keywords,
      og_image,
      enable_comments = true,
      featured = false,
      tags = [],
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 },
      );
    }

    // Insert blog post
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt,
        content: content || { type: "richtext", data: "" },
        featured_image,
        category_id,
        author_id,
        author_user_id: context.user.id,
        status,
        publish_date,
        reading_time,
        seo_title,
        seo_description,
        seo_keywords,
        og_image,
        enable_comments,
        featured,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating blog post:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create blog post" },
        { status: 400 },
      );
    }

    // Insert tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("blog_post_tags")
        .insert(tagInserts);

      if (tagsError) {
        console.error("Error adding tags:", tagsError);
      }
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
