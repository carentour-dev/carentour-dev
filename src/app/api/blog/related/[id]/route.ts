import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "4");

    // First, get the current post to know its category and tags
    const { data: currentPost, error: currentError } = await supabase
      .from("blog_posts")
      .select(
        `
        id,
        category_id,
        tags:blog_post_tags(tag_id)
      `,
      )
      .eq("id", id)
      .single();

    if (currentError || !currentPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const tagIds = currentPost.tags?.map((t: any) => t.tag_id) || [];

    // Get related posts:
    // 1. Same category (priority)
    // 2. Shared tags
    // 3. Recent posts
    // Exclude current post

    let relatedPosts: any[] = [];

    // Try to get posts from same category
    if (currentPost.category_id) {
      const { data: sameCategoryPosts } = await supabase
        .from("blog_posts")
        .select(
          `
          id,
          slug,
          title,
          excerpt,
          featured_image,
          publish_date,
          reading_time,
          view_count,
          category:blog_categories(id, name, slug, color),
          author:blog_authors(id, name, avatar)
        `,
        )
        .eq("status", "published")
        .eq("category_id", currentPost.category_id)
        .neq("id", id)
        .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
        .order("publish_date", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (sameCategoryPosts) {
        relatedPosts.push(...sameCategoryPosts);
      }
    }

    // If we don't have enough, get posts with shared tags
    if (relatedPosts.length < limit && tagIds.length > 0) {
      const { data: sharedTagPosts } = await supabase
        .from("blog_posts")
        .select(
          `
          id,
          slug,
          title,
          excerpt,
          featured_image,
          publish_date,
          reading_time,
          view_count,
          category:blog_categories(id, name, slug, color),
          author:blog_authors(id, name, avatar),
          tags:blog_post_tags(tag_id)
        `,
        )
        .eq("status", "published")
        .neq("id", id)
        .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
        .order("publish_date", { ascending: false, nullsFirst: false })
        .limit(limit * 2); // Get more to filter

      if (sharedTagPosts) {
        // Filter posts that share at least one tag
        const postsWithSharedTags = sharedTagPosts
          .filter((post) => {
            const postTagIds = post.tags?.map((t: any) => t.tag_id) || [];
            return postTagIds.some((tid) => tagIds.includes(tid));
          })
          .filter((post) => !relatedPosts.find((p) => p.id === post.id));

        relatedPosts.push(
          ...postsWithSharedTags.slice(0, limit - relatedPosts.length),
        );
      }
    }

    // If still not enough, get recent posts
    if (relatedPosts.length < limit) {
      const { data: recentPosts } = await supabase
        .from("blog_posts")
        .select(
          `
          id,
          slug,
          title,
          excerpt,
          featured_image,
          publish_date,
          reading_time,
          view_count,
          category:blog_categories(id, name, slug, color),
          author:blog_authors(id, name, avatar)
        `,
        )
        .eq("status", "published")
        .neq("id", id)
        .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
        .order("publish_date", { ascending: false, nullsFirst: false })
        .limit(limit - relatedPosts.length);

      if (recentPosts) {
        const newPosts = recentPosts.filter(
          (post) => !relatedPosts.find((p) => p.id === post.id),
        );
        relatedPosts.push(...newPosts);
      }
    }

    // Limit to requested number
    relatedPosts = relatedPosts.slice(0, limit);

    return NextResponse.json({ posts: relatedPosts });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
