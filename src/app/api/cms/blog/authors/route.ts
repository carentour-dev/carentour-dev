import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { recordPathRedirect, revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toAuthorPath = (slug: string, locale: "en" | "ar" = "en") =>
  localizePublicPathname(`/blog/author/${slug.replace(/^\/+/, "")}`, locale);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

export async function GET(request: NextRequest) {
  try {
    await requirePermission("cms.read");
    const locale = resolveAdminLocale(request);
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

    const transformedAuthors =
      authors?.map((author) => ({
        ...author,
        post_count: author.post_count?.[0]?.count || 0,
      })) || [];

    if (locale === "en") {
      return NextResponse.json({ authors: transformedAuthors });
    }

    const { data: translations, error: translationsError } = await (
      supabase as any
    )
      .from("blog_author_translations")
      .select("blog_author_id, name, slug, bio, status, updated_at")
      .eq("locale", "ar");

    if (translationsError) {
      console.error("Error fetching author translations:", translationsError);
      return NextResponse.json(
        { error: "Failed to fetch author translations" },
        { status: 500 },
      );
    }

    const translationByAuthorId = new Map<string, any>(
      (translations ?? []).map((row: any) => [row.blog_author_id, row]),
    );

    return NextResponse.json({
      authors: transformedAuthors.map((author) => {
        const translation = translationByAuthorId.get(author.id);
        return {
          ...author,
          name: normalizeText(translation?.name) || author.name,
          slug: normalizeText(translation?.slug) || author.slug,
          bio: translation?.bio ?? author.bio,
          status: translation?.status ?? "draft",
          updated_at: translation?.updated_at ?? author.updated_at,
          base_slug: author.slug,
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
        { error: "Create the English author before adding Arabic content" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { user_id, name, bio, avatar, email, website, social_links, active } =
      body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await ensureUniqueAuthorSlug(supabase, body.slug || name);

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
    const context = await requirePermission("cms.write");
    const locale = resolveAdminLocale(request);
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
      slug,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Author ID is required" },
        { status: 400 },
      );
    }

    const { data: existingAuthor, error: existingAuthorError } = await supabase
      .from("blog_authors")
      .select(
        "id, slug, bio, avatar, website, social_links, active, email, user_id, updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (existingAuthorError) {
      console.error("Error loading existing author:", existingAuthorError);
      return NextResponse.json(
        { error: "Failed to load existing author" },
        { status: 500 },
      );
    }

    if (!existingAuthor) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    if (locale === "ar") {
      const { data: existingTranslation, error: existingTranslationError } =
        await (supabase as any)
          .from("blog_author_translations")
          .select("slug, status")
          .eq("blog_author_id", id)
          .eq("locale", "ar")
          .maybeSingle();

      if (existingTranslationError) {
        console.error(
          "Error loading existing Arabic author translation:",
          existingTranslationError,
        );
        return NextResponse.json(
          { error: "Failed to load existing Arabic author translation" },
          { status: 500 },
        );
      }

      const nextStatus = body.status ?? existingTranslation?.status ?? "draft";
      const { data: translation, error: translationError } = await (
        supabase as any
      )
        .from("blog_author_translations")
        .upsert(
          {
            blog_author_id: id,
            locale: "ar",
            name,
            slug,
            bio,
            status: nextStatus,
          },
          { onConflict: "blog_author_id,locale" },
        )
        .select("name, slug, bio, status, updated_at")
        .single();

      if (translationError) {
        console.error(
          "Error updating Arabic author translation:",
          translationError,
        );
        return NextResponse.json(
          {
            error:
              translationError.message ||
              "Failed to update Arabic author translation",
          },
          { status: 400 },
        );
      }

      const oldSlug = existingTranslation?.slug;
      const newSlug = translation?.slug;

      if (oldSlug && newSlug) {
        const oldPath = toAuthorPath(oldSlug, "ar");
        const newPath = toAuthorPath(newSlug, "ar");

        if (oldPath !== newPath) {
          try {
            await recordPathRedirect({
              fromPath: oldPath,
              toPath: newPath,
              source: "cms.blog.authors.translation.update",
              sourceMetadata: { authorId: id, locale: "ar" },
              createdBy: context.user.id,
            });
          } catch (redirectError) {
            console.error("Failed to record Arabic author redirect", {
              authorId: id,
              oldPath,
              newPath,
              redirectError,
            });
          }
          revalidateSeoPaths([
            localizePublicPathname("/blog", "ar"),
            oldPath,
            newPath,
          ]);
        } else {
          revalidateSeoPaths([newPath]);
        }
      }

      return NextResponse.json({
        author: {
          ...existingAuthor,
          name: translation?.name ?? name,
          slug: translation?.slug ?? slug,
          bio: translation?.bio ?? bio,
          status: translation?.status ?? nextStatus,
          updated_at: translation?.updated_at ?? existingAuthor.updated_at,
          locale,
          has_translation: true,
          base_slug: existingAuthor.slug,
        },
      });
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

    if (slug) {
      updates.slug = await ensureUniqueAuthorSlug(supabase, slug, id);
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

    const oldSlug = existingAuthor.slug;
    const newSlug = author.slug;

    if (oldSlug && newSlug) {
      const oldPath = toAuthorPath(oldSlug);
      const newPath = toAuthorPath(newSlug);

      if (oldPath !== newPath) {
        try {
          await recordPathRedirect({
            fromPath: oldPath,
            toPath: newPath,
            source: "cms.blog.authors.update",
            sourceMetadata: { authorId: id },
            createdBy: context.user.id,
          });
        } catch (redirectError) {
          console.error("Failed to record author redirect", {
            authorId: id,
            oldPath,
            newPath,
            redirectError,
          });
        }
      }

      revalidateSeoPaths(["/blog", oldPath, newPath]);
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
    const locale = resolveAdminLocale(request);
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Author ID is required" },
        { status: 400 },
      );
    }

    if (locale === "ar") {
      const { error } = await (supabase as any)
        .from("blog_author_translations")
        .delete()
        .eq("blog_author_id", id)
        .eq("locale", "ar");

      if (error) {
        console.error("Error deleting Arabic author translation:", error);
        return NextResponse.json(
          { error: "Failed to delete Arabic author translation" },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true });
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
