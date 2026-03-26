import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { sanitizeContentPayload } from "@/lib/blog/sanitize-content";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";

const toBlogPostPath = (categorySlug: string, postSlug: string) =>
  `/blog/${categorySlug.replace(/^\/+/, "")}/${postSlug.replace(/^\/+/, "")}`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("cms.read");
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        category:blog_categories(id, name, slug, color),
        author:blog_authors(id, name, avatar, bio),
        tags:blog_post_tags(tag:blog_tags(id, name, slug))
      `,
      )
      .eq("id", id)
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

    return NextResponse.json({ post: transformedPost });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      author_id,
      status,
      publish_date,
      reading_time,
      seo_title,
      seo_description,
      seo_keywords,
      og_image,
      featured,
      tags,
    } = body;

    const sanitizedContent = sanitizeContentPayload(content);

    const { data: existingPost, error: existingPostError } = await supabase
      .from("blog_posts")
      .select("id, slug, category:blog_categories(slug)")
      .eq("id", id)
      .maybeSingle();

    if (existingPostError) {
      console.error("Error loading existing blog post:", existingPostError);
      return NextResponse.json(
        { error: "Failed to load existing blog post" },
        { status: 500 },
      );
    }

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    // Update blog post
    const { data: post, error: updateError } = await supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt,
        content: sanitizedContent,
        featured_image,
        category_id,
        author_id,
        status,
        publish_date,
        reading_time,
        seo_title,
        seo_description,
        seo_keywords,
        og_image,
        featured,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating blog post:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update blog post" },
        { status: 400 },
      );
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from("blog_post_tags").delete().eq("post_id", id);

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from("blog_post_tags")
          .insert(tagInserts);

        if (tagsError) {
          console.error("Error updating tags:", tagsError);
        }
      }
    }

    const { data: updatedPostPath, error: updatedPostPathError } =
      await supabase
        .from("blog_posts")
        .select("slug, category:blog_categories(slug)")
        .eq("id", id)
        .maybeSingle();

    if (!updatedPostPathError && updatedPostPath) {
      const oldCategorySlug = (existingPost as any)?.category?.slug;
      const newCategorySlug = (updatedPostPath as any)?.category?.slug;
      const oldPostSlug = existingPost.slug;
      const newPostSlug = updatedPostPath.slug;

      if (oldCategorySlug && newCategorySlug && oldPostSlug && newPostSlug) {
        const oldPath = toBlogPostPath(oldCategorySlug, oldPostSlug);
        const newPath = toBlogPostPath(newCategorySlug, newPostSlug);

        if (oldPath !== newPath) {
          try {
            await recordPathRedirect({
              fromPath: oldPath,
              toPath: newPath,
              source: "cms.blog.posts.update",
              sourceMetadata: { postId: id },
              createdBy: context.user.id,
            });
          } catch (redirectError) {
            console.error("Failed to record blog post redirect", {
              postId: id,
              oldPath,
              newPath,
              redirectError,
            });
          }
        }

        revalidateSeoPaths([
          "/blog",
          `/blog/${oldCategorySlug}`,
          `/blog/${newCategorySlug}`,
          oldPath,
          newPath,
        ]);
      }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting blog post:", error);
      return NextResponse.json(
        { error: "Failed to delete blog post" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
