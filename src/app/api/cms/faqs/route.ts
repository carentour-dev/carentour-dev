import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { requirePermission } from "@/server/auth/requireAdmin";
import type { Database } from "@/integrations/supabase/types";
import { revalidateSeoPaths } from "@/lib/seo";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { sortFaqs, type FaqEntry, type FaqStatus } from "@/lib/faq/data";

type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];

const FAQ_SELECT =
  "id, category, question, answer, status, position, created_at, updated_at";

const faqSchema = z.object({
  category: z.string().min(1, "Category is required"),
  question: z.string().min(3, "Question is required"),
  answer: z.string().min(3, "Answer is required"),
  status: z.enum(["draft", "published"]).default("draft"),
  position: z.coerce.number().int().min(0).optional(),
});

function mapRow(row: FaqRow): FaqEntry {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    status: row.status as FaqStatus,
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

type SupabaseError = { code?: string; message?: string };

function isDuplicateFaqError(error: SupabaseError | null) {
  if (!error) return false;
  const { code, message } = error;
  return (
    code === "23505" ||
    (typeof message === "string" &&
      message.includes("uq_faqs_category_question"))
  );
}

function handleFaqWriteError(error: SupabaseError | null) {
  if (isDuplicateFaqError(error)) {
    return NextResponse.json(
      {
        error:
          "A FAQ with this question already exists in this category. Edit the existing entry or change the question text.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: error?.message ?? "Failed to save FAQ" },
    { status: 500 },
  );
}

async function resolvePosition(
  category: string,
  position: number | undefined,
): Promise<number> {
  if (typeof position === "number" && Number.isFinite(position)) {
    return position;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("faqs")
    .select("position")
    .eq("category", category)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Failed to resolve FAQ position; defaulting to 0", error);
  }

  return (data?.position ?? 0) + 1;
}

function revalidateFaqCaches() {
  revalidateSeoPaths(["/faq", "/ar/faq"]);
  revalidatePath("/api/faq");
}

export async function GET(request: NextRequest) {
  await requirePermission("cms.read");
  const locale = resolveAdminLocale(request);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("faqs")
    .select(FAQ_SELECT)
    .order("category", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (locale === "ar") {
    const translationsResult = await (supabase as any)
      .from("faq_translations")
      .select("faq_id, question, answer, status, updated_at")
      .eq("locale", "ar");

    if (translationsResult.error) {
      return NextResponse.json(
        { error: translationsResult.error.message },
        { status: 500 },
      );
    }

    const translationsByFaqId = new Map<string, any>(
      (translationsResult.data ?? []).map((row: any) => [row.faq_id, row]),
    );

    const faqs = sortFaqs(
      (data ?? []).map((row) => {
        const translation = translationsByFaqId.get(row.id);
        return {
          ...mapRow(row),
          question: translation?.question ?? row.question,
          answer: translation?.answer ?? row.answer,
          status: (translation?.status ?? "draft") as FaqStatus,
          updated_at: translation?.updated_at ?? row.updated_at,
        };
      }),
    );

    return NextResponse.json({ data: faqs });
  }

  const faqs = sortFaqs((data ?? []).map(mapRow));
  return NextResponse.json({ data: faqs });
}

export async function POST(request: NextRequest) {
  await requirePermission("cms.write");
  const locale = resolveAdminLocale(request);
  const payload = await request.json();

  if (locale === "ar") {
    return NextResponse.json(
      {
        error:
          "Create the English FAQ first, then add the Arabic translation from the existing entry.",
      },
      { status: 400 },
    );
  }

  const parsed = faqSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 },
    );
  }

  const category = parsed.data.category.trim();
  const question = parsed.data.question.trim();
  const answer = parsed.data.answer.trim();
  const position = await resolvePosition(category, parsed.data.position);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("faqs")
    .insert({
      category,
      question,
      answer,
      status: parsed.data.status,
      position,
    })
    .select(FAQ_SELECT)
    .single();

  if (error) {
    return handleFaqWriteError(error);
  }

  revalidateFaqCaches();
  return NextResponse.json({ data: mapRow(data!) }, { status: 201 });
}
