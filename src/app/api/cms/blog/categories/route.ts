import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

const toBlogCategoryPath = (slug: string, locale: "en" | "ar" = "en") =>
  localizePublicPathname(`/blog/${slug.replace(/^\/+/, "")}`, locale);

const toBlogPostPath = (
  categorySlug: string,
  postSlug: string,
  locale: "en" | "ar" = "en",
) =>
  localizePublicPathname(
    `/blog/${categorySlug.replace(/^\/+/, "")}/${postSlug.replace(/^\/+/, "")}`,
    locale,
  );

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");
    const locale = resolveAdminLocale(request);
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

    if (locale === "en") {
      return NextResponse.json({ categories: transformedCategories });
    }

    const { data: translations, error: translationsError } = await (
      supabase as any
    )
      .from("blog_category_translations")
      .select("blog_category_id, name, slug, description, status, updated_at")
      .eq("locale", locale);

    if (translationsError) {
      console.error("Error fetching category translations:", translationsError);
      return NextResponse.json(
        { error: "Failed to fetch category translations" },
        { status: 500 },
      );
    }

    const translationByCategoryId = new Map<string, any>(
      (translations ?? []).map((row: any) => [row.blog_category_id, row]),
    );

    return NextResponse.json({
      categories: transformedCategories.map((category) => {
        const translation = translationByCategoryId.get(category.id);
        return {
          ...category,
          name: translation?.name ?? category.name,
          slug: translation?.slug ?? category.slug,
          description: translation?.description ?? category.description,
          status: translation?.status ?? "draft",
          updated_at: translation?.updated_at ?? category.updated_at,
          base_slug: category.slug,
          locale,
          has_translation: Boolean(translation),
        };
      }),
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
    await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    if (locale === "ar") {
      return NextResponse.json(
        { error: "Create the English category before adding Arabic content" },
        { status: 400 },
      );
    }

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
    const context = await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { id, name, slug, description, color, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    const { data: existingCategory, error: existingCategoryError } =
      await supabase
        .from("blog_categories")
        .select("id, slug")
        .eq("id", id)
        .maybeSingle();

    if (existingCategoryError) {
      console.error("Error loading existing category:", existingCategoryError);
      return NextResponse.json(
        { error: "Failed to load existing category" },
        { status: 500 },
      );
    }

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    if (locale === "ar") {
      const { data: existingTranslation } = await (supabase as any)
        .from("blog_category_translations")
        .select("slug, status")
        .eq("blog_category_id", id)
        .eq("locale", "ar")
        .maybeSingle();

      const nextStatus =
        body.status ?? existingTranslation?.status ?? "published";
      const { data: translation, error: translationError } = await (
        supabase as any
      )
        .from("blog_category_translations")
        .upsert(
          {
            blog_category_id: id,
            locale: "ar",
            name,
            slug,
            description,
            status: nextStatus,
          },
          { onConflict: "blog_category_id,locale" },
        )
        .select("name, slug, description, status, updated_at")
        .single();

      if (translationError) {
        console.error(
          "Error updating Arabic category translation:",
          translationError,
        );
        return NextResponse.json(
          {
            error:
              translationError.message ||
              "Failed to update Arabic category translation",
          },
          { status: 400 },
        );
      }

      const oldSlug = existingTranslation?.slug;
      const newSlug = translation?.slug;

      if (oldSlug && newSlug && oldSlug !== newSlug) {
        const oldCategoryPath = toBlogCategoryPath(oldSlug, "ar");
        const newCategoryPath = toBlogCategoryPath(newSlug, "ar");

        try {
          await recordPathRedirect({
            fromPath: oldCategoryPath,
            toPath: newCategoryPath,
            source: "cms.blog.categories.translation.update",
            sourceMetadata: { categoryId: id, locale: "ar" },
            createdBy: context.user.id,
          });
        } catch (redirectError) {
          console.error("Failed to record Arabic category redirect", {
            categoryId: id,
            oldCategoryPath,
            newCategoryPath,
            redirectError,
          });
        }

        const { data: categoryPosts, error: categoryPostsError } =
          await supabase.from("blog_posts").select("id").eq("category_id", id);

        if (categoryPostsError) {
          console.error("Failed to load posts for Arabic category redirects", {
            categoryId: id,
            categoryPostsError,
          });
        }

        const categoryPostIds = (categoryPosts ?? []).map(
          (post: any) => post.id,
        );
        const { data: localizedPosts, error: localizedPostsError } =
          categoryPostIds.length > 0
            ? await (supabase as any)
                .from("blog_post_translations")
                .select("blog_post_id, slug")
                .eq("locale", "ar")
                .not("slug", "is", null)
                .in("blog_post_id", categoryPostIds)
            : { data: [], error: null };

        if (localizedPostsError) {
          console.error(
            "Failed to load Arabic blog post translations for category redirects",
            {
              categoryId: id,
              localizedPostsError,
            },
          );
        }

        for (const translationRow of localizedPosts ?? []) {
          if (!translationRow.slug) continue;
          const oldPostPath = toBlogPostPath(
            oldSlug,
            translationRow.slug,
            "ar",
          );
          const newPostPath = toBlogPostPath(
            newSlug,
            translationRow.slug,
            "ar",
          );
          if (oldPostPath === newPostPath) continue;

          try {
            await recordPathRedirect({
              fromPath: oldPostPath,
              toPath: newPostPath,
              source: "cms.blog.categories.translation.update",
              sourceMetadata: {
                categoryId: id,
                locale: "ar",
                postId: translationRow.blog_post_id,
              },
              createdBy: context.user.id,
            });
          } catch (redirectError) {
            console.error("Failed to record Arabic category post redirect", {
              categoryId: id,
              postId: translationRow.blog_post_id,
              oldPostPath,
              newPostPath,
              redirectError,
            });
          }
        }

        revalidateSeoPaths([oldCategoryPath, newCategoryPath]);
      } else if (newSlug) {
        revalidateSeoPaths([toBlogCategoryPath(newSlug, "ar")]);
      }

      return NextResponse.json({
        category: {
          ...existingCategory,
          name: translation?.name ?? existingCategory.slug,
          slug: translation?.slug ?? existingCategory.slug,
          description: translation?.description ?? null,
          color,
          order,
          status: translation?.status ?? nextStatus,
          updated_at: translation?.updated_at ?? null,
          locale,
          base_slug: existingCategory.slug,
        },
      });
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

    const oldSlug = existingCategory.slug;
    const newSlug = category.slug;

    if (oldSlug && newSlug && oldSlug !== newSlug) {
      const oldCategoryPath = toBlogCategoryPath(oldSlug);
      const newCategoryPath = toBlogCategoryPath(newSlug);

      try {
        await recordPathRedirect({
          fromPath: oldCategoryPath,
          toPath: newCategoryPath,
          source: "cms.blog.categories.update",
          sourceMetadata: { categoryId: id },
          createdBy: context.user.id,
        });
      } catch (redirectError) {
        console.error("Failed to record category redirect", {
          categoryId: id,
          oldCategoryPath,
          newCategoryPath,
          redirectError,
        });
      }

      const { data: postsInCategory, error: postsInCategoryError } =
        await supabase
          .from("blog_posts")
          .select("id, slug")
          .eq("category_id", id);

      if (postsInCategoryError) {
        console.error("Failed to load posts for category redirect updates", {
          categoryId: id,
          postsInCategoryError,
        });
      } else {
        for (const post of postsInCategory ?? []) {
          if (!post.slug) continue;
          const oldPostPath = toBlogPostPath(oldSlug, post.slug);
          const newPostPath = toBlogPostPath(newSlug, post.slug);
          if (oldPostPath === newPostPath) continue;

          try {
            await recordPathRedirect({
              fromPath: oldPostPath,
              toPath: newPostPath,
              source: "cms.blog.categories.update",
              sourceMetadata: { categoryId: id, postId: post.id },
              createdBy: context.user.id,
            });
          } catch (postRedirectError) {
            console.error("Failed to record category post redirect", {
              categoryId: id,
              postId: post.id,
              oldPostPath,
              newPostPath,
              postRedirectError,
            });
          }
        }
      }

      const revalidatePaths = [
        "/blog",
        oldCategoryPath,
        newCategoryPath,
        ...(postsInCategory ?? []).flatMap((post) =>
          post.slug
            ? [
                toBlogPostPath(oldSlug, post.slug),
                toBlogPostPath(newSlug, post.slug),
              ]
            : [],
        ),
      ];
      revalidateSeoPaths(revalidatePaths);
    } else if (newSlug) {
      revalidateSeoPaths(["/blog", toBlogCategoryPath(newSlug)]);
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
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    if (locale === "ar") {
      const { error } = await (supabase as any)
        .from("blog_category_translations")
        .delete()
        .eq("blog_category_id", id)
        .eq("locale", "ar");

      if (error) {
        console.error("Error deleting Arabic category translation:", error);
        return NextResponse.json(
          { error: "Failed to delete Arabic category translation" },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true });
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
