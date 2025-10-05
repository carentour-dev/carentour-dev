import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const baseSchema = z.object({
  patient_name: z.string().min(2),
  patient_country: z.string().optional(),
  patient_id: z.string().uuid().optional().nullable(),
  doctor_id: z.string().uuid().optional().nullable(),
  treatment_id: z.string().uuid(),
  procedure_name: z.string().optional().nullable(),
  rating: z.coerce.number().min(0).max(5),
  review_text: z.string().min(10),
  recovery_time: z.string().optional().nullable(),
  media: z.array(z.any()).optional(),
  is_verified: z.boolean().optional(),
  published: z.boolean().optional(),
  highlight: z.boolean().optional(),
  display_order: z.coerce.number().int().optional(),
  locale: z.string().optional(),
});

const createSchema = baseSchema.extend({
  doctor_id: z.string().uuid(),
});

const updateSchema = baseSchema.partial().extend({
  doctor_id: z.string().uuid().optional(),
  treatment_id: z.string().uuid().optional(),
});

const sanitizePatientCountry = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return null;
  }

  const allowed = ["International Patient", "Overseas Patient"];
  return allowed.includes(normalized) ? normalized : "International Patient";
};

export const testimonialReviews = {
  async list() {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("doctor_reviews")
      .select(
        `id, patient_name, patient_country, patient_id, doctor_id, treatment_id, procedure_name, rating, review_text, recovery_time, is_verified, published, highlight, display_order, locale, media, created_at, updated_at, doctors(name), patients(full_name), treatments(name, slug)`
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "Failed to fetch patient reviews", error.message);
    }

    return (data ?? []).map((review: any) => {
      const mapped = {
        ...review,
        treatment_slug: review.treatments?.slug ?? null,
        treatment_name: review.treatments?.name ?? null,
      };
      delete (mapped as any).treatments;
      return mapped;
    });
  },

  async create(payload: unknown) {
    const parsed = createSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("doctor_reviews")
      .insert({
        patient_name: parsed.patient_name,
        patient_country: sanitizePatientCountry(parsed.patient_country),
        patient_id: parsed.patient_id ?? null,
        doctor_id: parsed.doctor_id,
        treatment_id: parsed.treatment_id,
        procedure_name: parsed.procedure_name ?? null,
        rating: parsed.rating,
        review_text: parsed.review_text,
        recovery_time: parsed.recovery_time ?? null,
        media: parsed.media ?? [],
        is_verified: parsed.is_verified ?? true,
        published: parsed.published ?? true,
        highlight: parsed.highlight ?? false,
        display_order: parsed.display_order ?? 0,
        locale: parsed.locale ?? "en",
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, "Failed to create patient review", error.message);
    }

    return data;
  },

  async update(id: string, payload: unknown) {
    const parsed = updateSchema.parse(payload);

    const updates: Record<string, unknown> = {};

    if (parsed.patient_name !== undefined) {
      updates.patient_name = parsed.patient_name;
    }
    if (parsed.patient_country !== undefined) {
      updates.patient_country = sanitizePatientCountry(parsed.patient_country);
    }
    if (parsed.patient_id !== undefined) {
      updates.patient_id = parsed.patient_id ?? null;
    }
    if (parsed.doctor_id !== undefined) {
      updates.doctor_id = parsed.doctor_id;
    }
    if (parsed.treatment_id !== undefined) {
      updates.treatment_id = parsed.treatment_id;
    }
    if (parsed.procedure_name !== undefined) {
      updates.procedure_name = parsed.procedure_name ?? null;
    }
    if (parsed.rating !== undefined) {
      updates.rating = parsed.rating;
    }
    if (parsed.review_text !== undefined) {
      updates.review_text = parsed.review_text;
    }
    if (parsed.recovery_time !== undefined) {
      updates.recovery_time = parsed.recovery_time ?? null;
    }
    if (parsed.is_verified !== undefined) {
      updates.is_verified = parsed.is_verified;
    }
    if (parsed.published !== undefined) {
      updates.published = parsed.published;
    }
    if (parsed.highlight !== undefined) {
      updates.highlight = parsed.highlight;
    }
    if (parsed.display_order !== undefined) {
      updates.display_order = parsed.display_order;
    }
    if (parsed.locale !== undefined) {
      updates.locale = parsed.locale;
    }
    if (parsed.media !== undefined) {
      updates.media = parsed.media;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("doctor_reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update patient review", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Review not found");
    }

    return data;
  },

  async remove(id: string) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("doctor_reviews")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to delete patient review", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Review not found");
    }

    return { success: true };
  },
};
