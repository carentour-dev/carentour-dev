import { NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        color,
        post_count:blog_posts!blog_posts_category_id_fkey(count)
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

    // Transform post count - only count published posts
    const transformedCategories = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id)
          .eq("status", "published")
          .or(
            `publish_date.is.null,publish_date.lte.${new Date().toISOString()}`,
          );

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          color: cat.color,
          post_count: count || 0,
        };
      }),
    );

    return NextResponse.json({ categories: transformedCategories });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
