import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";

const toTagPath = (slug: string) => `/blog/tag/${slug.replace(/^\/+/, "")}`;

export async function GET() {
  try {
    await requirePermission("cms.read");
    const supabase = getSupabaseAdmin();

    const { data: tags, error } = await supabase
      .from("blog_tags")
      .select(
        `
        *,
        post_count:blog_post_tags(count)
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching tags:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 },
      );
    }

    // Transform post count
    const transformedTags =
      tags?.map((tag) => ({
        ...tag,
        post_count: tag.post_count?.[0]?.count || 0,
      })) || [];

    return NextResponse.json({ tags: transformedTags });
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
    await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const { data: tag, error: insertError } = await supabase
      .from("blog_tags")
      .insert({ name, slug })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating tag:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create tag" },
        { status: 400 },
      );
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { id, name, slug } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    const { data: existingTag, error: existingTagError } = await supabase
      .from("blog_tags")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();

    if (existingTagError) {
      console.error("Error loading existing tag:", existingTagError);
      return NextResponse.json(
        { error: "Failed to load existing tag" },
        { status: 500 },
      );
    }

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const { data: tag, error: updateError } = await supabase
      .from("blog_tags")
      .update({ name, slug })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating tag:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update tag" },
        { status: 400 },
      );
    }

    const oldSlug = existingTag.slug;
    const newSlug = tag.slug;
    if (oldSlug && newSlug) {
      const oldPath = toTagPath(oldSlug);
      const newPath = toTagPath(newSlug);

      if (oldPath !== newPath) {
        try {
          await recordPathRedirect({
            fromPath: oldPath,
            toPath: newPath,
            source: "cms.blog.tags.update",
            sourceMetadata: { tagId: id },
            createdBy: context.user.id,
          });
        } catch (redirectError) {
          console.error("Failed to record tag redirect", {
            tagId: id,
            oldPath,
            newPath,
            redirectError,
          });
        }
      }

      revalidateSeoPaths(["/blog", oldPath, newPath]);
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("blog_tags").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tag:", error);
      return NextResponse.json(
        { error: "Failed to delete tag" },
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
