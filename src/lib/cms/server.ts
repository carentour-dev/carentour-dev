import { createClient } from "@/integrations/supabase/server";
import type { Database } from "@/integrations/supabase/types";
import { normalizeBlocks, type BlockValue } from "@/lib/cms/blocks";
import { normalizeTreatment } from "@/lib/treatments";

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seo: Record<string, any> | null;
  content: BlockValue[];
  updated_at: string | null;
};

export async function getPublishedPageBySlug(slug: string): Promise<CmsPage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, seo, content, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    status: data.status as "draft" | "published",
    seo: data.seo as Record<string, any> | null,
  content: normalizeBlocks(data.content) as BlockValue[],
  updated_at: data.updated_at,
  };
}

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];

const TREATMENT_SELECT = "id, name, slug, summary, description, category, base_price, currency, duration_days, recovery_time_days, success_rate, is_featured, is_active, procedures, ideal_candidates";
const DOCTOR_SELECT = "id, name, title, specialization, bio, experience_years, languages, avatar_url, patient_rating, total_reviews, successful_procedures, is_active";

export async function getTreatmentsForBlock(config: BlockValue<"treatments">) {
  const supabase = await createClient();
  const manual = (config.manualTreatments ?? []).map((entry) => entry.trim()).filter(Boolean);

  if (manual.length > 0) {
    const { data, error } = await supabase
      .from("treatments")
      .select(TREATMENT_SELECT)
      .in("slug", manual);

    if (error) {
      console.error("Failed to load manual treatments for block", error);
      return [];
    }

    const rows = (data ?? []) as TreatmentRow[];
    const orderMap = new Map(manual.map((slug, index) => [slug, index]));
    const sorted = rows.sort((a, b) => {
      const rankA = orderMap.get(a.slug ?? a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = orderMap.get(b.slug ?? b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });
    return sorted.slice(0, config.limit).map((row) => normalizeTreatment(row));
  }

  let query = supabase
    .from("treatments")
    .select(TREATMENT_SELECT)
    .eq("is_active", true);

  if (config.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (config.categories && config.categories.length > 0) {
    query = query.in("category", config.categories);
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(config.limit);

  if (error) {
    console.error("Failed to load treatments for block", error);
    return [];
  }

  return (data ?? []).map((row) => normalizeTreatment(row as TreatmentRow));
}

export async function getDoctorsForBlock(config: BlockValue<"doctors">) {
  const supabase = await createClient();
  const manual = (config.manualDoctors ?? []).map((entry) => entry.trim()).filter(Boolean);

  if (manual.length > 0) {
    const { data, error } = await supabase
      .from("doctors")
      .select(DOCTOR_SELECT)
      .in("id", manual);

    if (error) {
      console.error("Failed to load manual doctors for block", error);
      return [];
    }

    const rows = (data ?? []) as DoctorRow[];
    const orderMap = new Map(manual.map((id, index) => [id, index]));
    const sorted = rows.sort((a, b) => {
      const rankA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });
    return sorted.slice(0, config.limit);
  }

  let query = supabase
    .from("doctors")
    .select(DOCTOR_SELECT)
    .eq("is_active", true);

  if (config.featuredOnly) {
    query = query.gte("patient_rating", 4.5);
  }

  if (config.specialties && config.specialties.length > 0) {
    query = query.in("specialization", config.specialties);
  }

  const { data, error } = await query
    .order("patient_rating", { ascending: false, nullsFirst: false })
    .order("successful_procedures", { ascending: false, nullsFirst: false })
    .limit(config.limit);

  if (error) {
    console.error("Failed to load doctors for block", error);
    return [];
  }

  return (data ?? []) as DoctorRow[];
}
