import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

export async function GET() {
  try {
    await requirePermission("cms.read");
    const supabase = getSupabaseAdmin();

    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select(
        `
        *,
        post_count:blog_posts(count)
      `,
      )
      .order("order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 },
      );
    }

    // Transform post count
    const transformedCategories =
      categories?.map((cat) => ({
        ...cat,
        post_count: cat.post_count?.[0]?.count || 0,
      })) || [];

    return NextResponse.json({ categories: transformedCategories });
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
    const { name, slug, description, color, order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const { data: category, error: insertError } = await supabase
      .from("blog_categories")
      .insert({ name, slug, description, color, order })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating category:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create category" },
        { status: 400 },
      );
    }

    return NextResponse.json({ category }, { status: 201 });
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
    const { id, name, slug, description, color, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    const { data: category, error: updateError } = await supabase
      .from("blog_categories")
      .update({ name, slug, description, color, order })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating category:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update category" },
        { status: 400 },
      );
    }

    return NextResponse.json({ category });
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
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json(
        { error: "Failed to delete category" },
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
