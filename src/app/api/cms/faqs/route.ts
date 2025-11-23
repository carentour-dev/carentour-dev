import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { requirePermission } from "@/server/auth/requireAdmin";
import type { Database } from "@/integrations/supabase/types";
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
  revalidatePath("/faq");
  revalidatePath("/api/faq");
}

export async function GET() {
  await requirePermission("cms.read");
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

  const faqs = sortFaqs((data ?? []).map(mapRow));
  return NextResponse.json({ data: faqs });
}

export async function POST(request: NextRequest) {
  await requirePermission("cms.write");
  const payload = await request.json();
  const parsed = faqSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 },
    );
  }

  const position = await resolvePosition(
    parsed.data.category,
    parsed.data.position,
  );

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("faqs")
    .insert({
      category: parsed.data.category,
      question: parsed.data.question,
      answer: parsed.data.answer,
      status: parsed.data.status,
      position,
    })
    .select(FAQ_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateFaqCaches();
  return NextResponse.json({ data: mapRow(data!) }, { status: 201 });
}
