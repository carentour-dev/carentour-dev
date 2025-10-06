import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"];
type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"];
type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentGrade = Database["public"]["Enums"]["treatment_grade"];

type TreatmentWithGrade = TreatmentRow & {
  grade: TreatmentGrade;
};

const treatmentsService = new CrudService("treatments", "treatment");
const gradeSchema = z.enum(["grade_a", "grade_b", "grade_c"]);
const METADATA_TABLE = "treatment_metadata";
const DEFAULT_GRADE: TreatmentGrade = "grade_c";

const upsertTreatmentGrade = async (treatmentId: string, grade: TreatmentGrade) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(METADATA_TABLE)
    .upsert({ treatment_id: treatmentId, grade })
    .select("grade")
    .single();

  if (error) {
    throw new ApiError(500, "Failed to update treatment grade", error.message);
  }

  return (data?.grade ?? grade) as TreatmentGrade;
};

const fetchTreatmentGrade = async (treatmentId: string): Promise<TreatmentGrade> => {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from(METADATA_TABLE)
      .select("grade")
      .eq("treatment_id", treatmentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.grade ?? DEFAULT_GRADE) as TreatmentGrade;
  } catch (error) {
    console.error("Failed to load treatment metadata", error);
    return DEFAULT_GRADE;
  }
};

const fetchTreatmentMetadataMap = async () => {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from(METADATA_TABLE)
      .select("treatment_id, grade");

    if (error) {
      throw error;
    }

    const map = new Map<string, TreatmentGrade>();

    for (const row of data ?? []) {
      map.set(row.treatment_id, row.grade as TreatmentGrade);
    }

    return map;
  } catch (error) {
    console.error("Failed to load treatment metadata", error);
    return new Map<string, TreatmentGrade>();
  }
};

const internationalPriceSchema = z.object({
  country: z.string().min(1),
  flag: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(1),
});

const recoveryStageSchema = z.object({
  stage: z.string().min(1),
  description: z.string().min(1),
});

const procedureSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  duration: z.string().optional(),
  recovery: z.string().optional(),
  price: z.string().optional(),
  egyptPrice: z.number().min(0).optional(),
  success_rate: z.string().optional(),
  internationalPrices: z.array(internationalPriceSchema).default([]),
  candidateRequirements: z.array(z.string().min(1)).default([]),
  recoveryStages: z.array(recoveryStageSchema).default([]),
});

const createTreatmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  overview: z.string().optional(),
  ideal_candidates: z.array(z.string().min(1)).default([]),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  recovery_time_days: z.coerce.number().int().min(0).optional(),
  success_rate: z.coerce.number().min(0).max(100).optional(),
  procedures: z.array(procedureSchema).nonempty("Add at least one procedure"),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  grade: gradeSchema.default("grade_c"),
});

const updateTreatmentSchema = createTreatmentSchema.partial();
const treatmentIdSchema = z.string().uuid();

export const treatmentController = {
  async list(): Promise<TreatmentWithGrade[]> {
    const treatments = (await treatmentsService.list()) as TreatmentRow[];
    const metadataMap = await fetchTreatmentMetadataMap();

    return treatments.map((treatment) => ({
      ...treatment,
      grade: metadataMap.get(treatment.id) ?? DEFAULT_GRADE,
    }));
  },

  async get(id: unknown): Promise<TreatmentWithGrade> {
    const treatmentId = treatmentIdSchema.parse(id);
    const treatment = (await treatmentsService.getById(treatmentId)) as TreatmentRow;
    const grade = await fetchTreatmentGrade(treatment.id);
    return { ...treatment, grade };
  },

  async create(payload: unknown): Promise<TreatmentWithGrade> {
    const parsed = createTreatmentSchema.parse(payload);

    const sanitizedProcedures = parsed.procedures.map((procedure) => ({
      ...procedure,
      candidateRequirements: procedure.candidateRequirements ?? [],
      recoveryStages: procedure.recoveryStages ?? [],
      internationalPrices: procedure.internationalPrices ?? [],
    }));

    const createPayload: TreatmentInsert = {
      name: parsed.name,
      slug: parsed.slug,
      category: parsed.category ?? null,
      summary: parsed.summary ?? null,
      description: parsed.description ?? null,
      overview: parsed.overview ?? null,
      base_price: parsed.base_price ?? null,
      currency: parsed.currency ?? null,
      duration_days: parsed.duration_days ?? null,
      recovery_time_days: parsed.recovery_time_days ?? null,
      success_rate: parsed.success_rate ?? null,
      is_featured: parsed.is_featured ?? false,
      is_active: parsed.is_active ?? true,
      ideal_candidates: parsed.ideal_candidates ?? [],
      procedures: sanitizedProcedures,
    };

    const created = (await treatmentsService.create(createPayload)) as TreatmentRow;
    const grade = await upsertTreatmentGrade(created.id, (parsed.grade ?? DEFAULT_GRADE) as TreatmentGrade);
    return { ...created, grade };
  },

  async update(id: unknown, payload: unknown): Promise<TreatmentWithGrade> {
    const treatmentId = treatmentIdSchema.parse(id);
    const parsed = updateTreatmentSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const updatePayload: TreatmentUpdate = {};

    if (parsed.name !== undefined) updatePayload.name = parsed.name;
    if (parsed.slug !== undefined) updatePayload.slug = parsed.slug;
    if (parsed.category !== undefined) updatePayload.category = parsed.category ?? null;
    if (parsed.summary !== undefined) updatePayload.summary = parsed.summary ?? null;
    if (parsed.description !== undefined) updatePayload.description = parsed.description ?? null;
    if (parsed.overview !== undefined) updatePayload.overview = parsed.overview ?? null;
    if (parsed.base_price !== undefined) updatePayload.base_price = parsed.base_price ?? null;
    if (parsed.currency !== undefined) updatePayload.currency = parsed.currency ?? null;
    if (parsed.duration_days !== undefined) updatePayload.duration_days = parsed.duration_days ?? null;
    if (parsed.recovery_time_days !== undefined)
      updatePayload.recovery_time_days = parsed.recovery_time_days ?? null;
    if (parsed.success_rate !== undefined) updatePayload.success_rate = parsed.success_rate ?? null;
    if (parsed.is_featured !== undefined) updatePayload.is_featured = parsed.is_featured;
    if (parsed.is_active !== undefined) updatePayload.is_active = parsed.is_active;
    if (parsed.ideal_candidates !== undefined)
      updatePayload.ideal_candidates = parsed.ideal_candidates ?? [];
    if (parsed.procedures !== undefined) {
      updatePayload.procedures = (parsed.procedures ?? []).map((procedure) => ({
        ...procedure,
        candidateRequirements: procedure.candidateRequirements ?? [],
        recoveryStages: procedure.recoveryStages ?? [],
        internationalPrices: procedure.internationalPrices ?? [],
      }));
    }

    const updated = (await treatmentsService.update(treatmentId, updatePayload)) as TreatmentRow;

    const shouldUpdateGrade = Object.prototype.hasOwnProperty.call(parsed, "grade");
    const grade = shouldUpdateGrade
      ? await upsertTreatmentGrade(
          treatmentId,
          ((parsed.grade ?? DEFAULT_GRADE) as TreatmentGrade),
        )
      : await fetchTreatmentGrade(treatmentId);

    return { ...updated, grade };
  },

  async delete(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    return treatmentsService.remove(treatmentId);
  },
};
