import { createClient } from "@/integrations/supabase/server";
import type { Database } from "@/integrations/supabase/types";
import {
  getDefaultCategories,
  getFallbackFaqs,
  sortFaqs,
  type FaqCategory,
  type FaqEntry,
  type FaqStatus,
} from "./data";

type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
type FaqCategoryRow = Database["public"]["Tables"]["faq_categories"]["Row"];

const FAQ_COLUMNS =
  "id, category, question, answer, status, position, created_at, updated_at";
const CATEGORY_COLUMNS =
  "slug, title, description, icon, color, fragment, position, created_at, updated_at";

export type FaqSource = "cms" | "fallback";

function mapFaqRow(row: FaqRow): FaqEntry {
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

function mapCategoryRow(row: FaqCategoryRow): FaqCategory {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    color: row.color,
    fragment: row.fragment,
    position: row.position,
  };
}

export async function fetchPublishedFaqs(): Promise<{
  faqs: FaqEntry[];
  categories: FaqCategory[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const [{ data, error }, categoryResult] = await Promise.all([
      supabase
        .from("faqs")
        .select(FAQ_COLUMNS)
        .eq("status", "published")
        .order("category", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("faq_categories")
        .select(CATEGORY_COLUMNS)
        .order("position", { ascending: true })
        .order("title", { ascending: true }),
    ]);

    if (error) {
      return { faqs: [], categories: [], error: error.message };
    }

    const mapped = (data ?? []).map(mapFaqRow);
    const categories = (categoryResult.data ?? []).map(mapCategoryRow);
    return { faqs: sortFaqs(mapped), categories };
  } catch (error: any) {
    return {
      faqs: [],
      categories: [],
      error: error?.message ?? "Failed to load FAQs",
    };
  }
}

export async function getFaqsWithFallback(): Promise<{
  faqs: FaqEntry[];
  categories: FaqCategory[];
  source: FaqSource;
  error?: string;
}> {
  const fallbackFaqs = getFallbackFaqs();
  const fallbackCategories = getDefaultCategories();
  const { faqs, categories, error } = await fetchPublishedFaqs();

  if (faqs.length > 0) {
    return {
      faqs,
      categories: categories.length ? categories : fallbackCategories,
      source: "cms",
      error,
    };
  }

  return {
    faqs: fallbackFaqs,
    categories: fallbackCategories,
    source: "fallback",
    error: error ?? "No FAQs available from the CMS. Using fallback content.",
  };
}
