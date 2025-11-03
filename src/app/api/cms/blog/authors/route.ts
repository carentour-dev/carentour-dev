import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function ensureUniqueAuthorSlug(
  supabase: SupabaseClient,
  baseValue: string,
  excludeId?: string,
) {
  const baseSlug = slugify(baseValue) || "author";
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("blog_authors")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data || (excludeId && data.id === excludeId)) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter++}`;
  }
}

export async function GET() {
  try {
    await requirePermission("cms.read");
    const supabase = getSupabaseAdmin();

    const { data: authors, error } = await supabase
      .from("blog_authors")
      .select(
        `
        *,
        post_count:blog_posts(count)
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching authors:", error);
      return NextResponse.json(
        { error: "Failed to fetch authors" },
        { status: 500 },
      );
    }

    // Transform post count
    const transformedAuthors =
      authors?.map((author) => ({
        ...author,
        post_count: author.post_count?.[0]?.count || 0,
      })) || [];

    return NextResponse.json({ authors: transformedAuthors });
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
    const { user_id, name, bio, avatar, email, website, social_links, active } =
      body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await ensureUniqueAuthorSlug(supabase, name);

    const { data: author, error: insertError } = await supabase
      .from("blog_authors")
      .insert({
        user_id: user_id || null,
        name,
        slug,
        bio,
        avatar,
        email,
        website,
        social_links: social_links || {},
        active: active !== undefined ? active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating author:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create author" },
        { status: 400 },
      );
    }

    return NextResponse.json({ author }, { status: 201 });
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
    await requirePermission("cms.write");
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const {
      id,
      user_id,
      name,
      bio,
      avatar,
      email,
      website,
      social_links,
      active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Author ID is required" },
        { status: 400 },
      );
    }

    const updates: Record<string, any> = {
      user_id: user_id || null,
      name,
      bio,
      avatar,
      email,
      website,
      social_links,
      active,
    };

    if (body.slug) {
      updates.slug = await ensureUniqueAuthorSlug(supabase, body.slug, id);
    }

    const { data: author, error: updateError } = await supabase
      .from("blog_authors")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating author:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update author" },
        { status: 400 },
      );
    }

    return NextResponse.json({ author });
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
        { error: "Author ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("blog_authors").delete().eq("id", id);

    if (error) {
      console.error("Error deleting author:", error);
      return NextResponse.json(
        { error: "Failed to delete author" },
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
