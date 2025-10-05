import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const baseSchema = z.object({
  patient_id: z.string().uuid().optional().nullable(),
  doctor_id: z.string().uuid().optional().nullable(),
  treatment_id: z.string().uuid(),
  headline: z.string().min(4),
  excerpt: z.string().optional().nullable(),
  body_markdown: z.string().min(20),
  outcome_summary: z.array(z.any()).optional(),
  media: z.array(z.any()).optional(),
  hero_image: z.string().optional().nullable(),
  locale: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  display_order: z.coerce.number().int().optional(),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.partial();

export const patientStories = {
  async list() {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patient_stories")
      .select(
        `id, patient_id, doctor_id, treatment_id, headline, excerpt, body_markdown, outcome_summary, media, hero_image, locale, published, featured, display_order, created_at, updated_at, patients(full_name), doctors(name), treatments(name, slug)`
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "Failed to fetch patient stories", error.message);
    }

    return (data ?? []).map((story: any) => {
      const mapped = {
        ...story,
        treatment_slug: story.treatments?.slug ?? null,
        treatment_name: story.treatments?.name ?? null,
      };
      delete (mapped as any).treatments;
      return mapped;
    });
  },

  async create(payload: unknown) {
    const parsed = createSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patient_stories")
      .insert({
        patient_id: parsed.patient_id ?? null,
        doctor_id: parsed.doctor_id ?? null,
        treatment_id: parsed.treatment_id,
        headline: parsed.headline,
        excerpt: parsed.excerpt ?? null,
        body_markdown: parsed.body_markdown,
        outcome_summary: parsed.outcome_summary ?? [],
        media: parsed.media ?? [],
        hero_image: parsed.hero_image ?? null,
        locale: parsed.locale ?? "en",
        published: parsed.published ?? true,
        featured: parsed.featured ?? false,
        display_order: parsed.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, "Failed to create patient story", error.message);
    }

    return data;
  },

  async update(id: string, payload: unknown) {
    const parsed = updateSchema.parse(payload);
    const updates: Record<string, unknown> = {};

    if (parsed.patient_id !== undefined) {
      updates.patient_id = parsed.patient_id ?? null;
    }
    if (parsed.doctor_id !== undefined) {
      updates.doctor_id = parsed.doctor_id ?? null;
    }
    if (parsed.treatment_id !== undefined) {
      updates.treatment_id = parsed.treatment_id;
    }
    if (parsed.headline !== undefined) {
      updates.headline = parsed.headline;
    }
    if (parsed.excerpt !== undefined) {
      updates.excerpt = parsed.excerpt ?? null;
    }
    if (parsed.body_markdown !== undefined) {
      updates.body_markdown = parsed.body_markdown;
    }
    if (parsed.hero_image !== undefined) {
      updates.hero_image = parsed.hero_image ?? null;
    }
    if (parsed.locale !== undefined) {
      updates.locale = parsed.locale;
    }
    if (parsed.published !== undefined) {
      updates.published = parsed.published;
    }
    if (parsed.featured !== undefined) {
      updates.featured = parsed.featured;
    }
    if (parsed.display_order !== undefined) {
      updates.display_order = parsed.display_order;
    }
    if (parsed.outcome_summary !== undefined) {
      updates.outcome_summary = parsed.outcome_summary;
    }
    if (parsed.media !== undefined) {
      updates.media = parsed.media;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patient_stories")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update patient story", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Story not found");
    }

    return data;
  },

  async remove(id: string) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patient_stories")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to delete patient story", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Story not found");
    }

    return { success: true };
  },
};
