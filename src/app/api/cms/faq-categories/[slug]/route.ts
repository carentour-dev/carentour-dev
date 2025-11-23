import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { requirePermission } from "@/server/auth/requireAdmin";

type CategoryRow = Database["public"]["Tables"]["faq_categories"]["Row"];

const CATEGORY_SELECT =
  "slug, title, description, icon, color, fragment, position, created_at, updated_at";

const categorySchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, or hyphens"),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  fragment: z.string().nullish(),
  position: z.coerce.number().int().min(0).optional(),
});

function mapRow(row: CategoryRow) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    color: row.color,
    fragment: row.fragment,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatValidationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid payload";
  const path = issue.path?.length ? issue.path.join(".") : null;
  return path ? `${issue.message} (field: ${path})` : issue.message;
}

async function categoryHasFaqs(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  slug: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("faqs")
    .select("id", { count: "exact", head: true })
    .eq("category", slug);

  if (error) {
    console.warn("Failed to count FAQs for category", slug, error);
    return true;
  }

  return (count ?? 0) > 0;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requirePermission("cms.write");
  const { slug } = await params;
  const payload = await request.json();
  const parsed = categorySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("faq_categories")
    .update({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
      fragment: parsed.data.fragment ?? null,
      position:
        typeof parsed.data.position === "number" ? parsed.data.position : 0,
    })
    .eq("slug", slug)
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapRow(data!) });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requirePermission("cms.write");
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  if (await categoryHasFaqs(supabase, slug)) {
    return NextResponse.json(
      {
        error:
          "Cannot delete category while FAQs are assigned. Reassign or delete those FAQs first.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("faq_categories")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
