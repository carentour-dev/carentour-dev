import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const treatmentsService = new CrudService("treatments", "treatment");

const METADATA_TABLE = "treatment_metadata";
const DEFAULT_GRADE: Database["public"]["Enums"]["treatment_grade"] = "grade_c";

const gradeSchema = z.enum(["grade_a", "grade_b", "grade_c"]);

const internationalPriceSchema = z.object({
  country: z.string().min(1),
  currency: z.string().min(1),
  price: z.coerce.number().min(0),
});

const recoveryStageSchema = z.object({
  stage: z.string().min(1),
  description: z.string().min(1),
});

const procedureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  duration: z.string().optional(),
  recovery: z.string().optional(),
  price: z.string().optional(),
  egyptPrice: z.coerce.number().min(0).optional(),
  successRate: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  candidateRequirements: z.array(z.string().min(1)).default([]),
  recoveryStages: z.array(recoveryStageSchema).default([]),
  internationalPrices: z.array(internationalPriceSchema).default([]),
});

const baseTreatmentSchema = z.object({
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
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  grade: gradeSchema.default("grade_c"),
});

const createTreatmentSchema = baseTreatmentSchema.extend({
  procedures: z.array(procedureSchema).nonempty("Add at least one procedure"),
});

const updateTreatmentSchema = baseTreatmentSchema.partial().extend({
  procedures: z.array(procedureSchema).optional(),
});

const treatmentIdSchema = z.string().uuid();

const upsertTreatmentGrade = async (
  treatmentId: string,
  grade: Database["public"]["Enums"]["treatment_grade"],
) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(METADATA_TABLE)
    .upsert({ treatment_id: treatmentId, grade })
    .select("grade")
    .single();

  if (error) {
    throw new ApiError(500, "Failed to update treatment grade", error.message);
  }

  return (data?.grade ??
    grade) as Database["public"]["Enums"]["treatment_grade"];
};

const fetchTreatmentGrade = async (
  treatmentId: string,
): Promise<Database["public"]["Enums"]["treatment_grade"]> => {
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

    return (data?.grade ??
      DEFAULT_GRADE) as Database["public"]["Enums"]["treatment_grade"];
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

    const map = new Map<
      string,
      Database["public"]["Enums"]["treatment_grade"]
    >();

    for (const row of data ?? []) {
      map.set(
        row.treatment_id,
        row.grade as Database["public"]["Enums"]["treatment_grade"],
      );
    }

    return map;
  } catch (error) {
    console.error("Failed to load treatment metadata", error);
    return new Map<string, Database["public"]["Enums"]["treatment_grade"]>();
  }
};

const detachLegacyProcedures = async (treatmentId: string) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("treatment_procedures")
    .delete()
    .eq("treatment_id", treatmentId);

  if (error) {
    throw new ApiError(
      500,
      "Failed to reset treatment procedures",
      error.message,
    );
  }
};

const upsertProcedures = async (
  treatmentId: string,
  procedures: z.infer<typeof procedureSchema>[],
) => {
  const supabase = getSupabaseAdmin();
  await detachLegacyProcedures(treatmentId);

  if (procedures.length === 0) {
    throw new ApiError(400, "Treatments must include at least one procedure");
  }

  const payload = procedures.map((procedure, index) => ({
    treatment_id: treatmentId,
    name: procedure.name,
    description: procedure.description ?? null,
    duration: procedure.duration ?? null,
    recovery: procedure.recovery ?? null,
    price: procedure.price ?? null,
    egypt_price: procedure.egyptPrice ?? null,
    success_rate: procedure.successRate ?? null,
    candidate_requirements: procedure.candidateRequirements,
    recovery_stages: procedure.recoveryStages,
    international_prices: procedure.internationalPrices,
    display_order: procedure.displayOrder ?? index,
  }));

  const { error } = await supabase.from("treatment_procedures").insert(payload);

  if (error) {
    throw new ApiError(
      500,
      "Failed to save treatment procedures",
      error.message,
    );
  }
};

const fetchTreatmentWithProcedures = async (
  treatmentId: string,
): Promise<
  Database["public"]["Tables"]["treatments"]["Row"] & {
    procedures: Database["public"]["Tables"]["treatment_procedures"]["Row"][];
  }
> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("treatments")
    .select("*, procedures:treatment_procedures(*)")
    .eq("id", treatmentId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load treatment", error.message);
  }

  if (!data) {
    throw new ApiError(404, "Treatment not found");
  }

  return data as Database["public"]["Tables"]["treatments"]["Row"] & {
    procedures: Database["public"]["Tables"]["treatment_procedures"]["Row"][];
  };
};

export const treatmentController = {
  async list() {
    const rows =
      (await treatmentsService.list()) as Database["public"]["Tables"]["treatments"]["Row"][];
    const metadata = await fetchTreatmentMetadataMap();

    const supabase = getSupabaseAdmin();
    const { data: proceduresData, error: proceduresError } = await supabase
      .from("treatment_procedures")
      .select("*");

    if (proceduresError) {
      throw new ApiError(
        500,
        "Failed to load treatment procedures",
        proceduresError.message,
      );
    }

    const procedureGroups = new Map<
      string,
      Database["public"]["Tables"]["treatment_procedures"]["Row"][]
    >();
    for (const procedure of proceduresData ?? []) {
      if (!procedureGroups.has(procedure.treatment_id)) {
        procedureGroups.set(procedure.treatment_id, []);
      }
      procedureGroups.get(procedure.treatment_id)?.push(procedure);
    }

    return rows.map((row) => ({
      ...row,
      grade: metadata.get(row.id) ?? DEFAULT_GRADE,
      procedures: (procedureGroups.get(row.id) ?? []).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      ),
    }));
  },

  async get(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    const treatment = await fetchTreatmentWithProcedures(treatmentId);
    const grade = await fetchTreatmentGrade(treatment.id);

    return { ...treatment, grade };
  },

  async create(payload: unknown) {
    const parsed = createTreatmentSchema.parse(payload);

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
    };

    const created = (await treatmentsService.create(
      createPayload,
    )) as Database["public"]["Tables"]["treatments"]["Row"];

    await upsertProcedures(created.id, parsed.procedures);

    const grade = await upsertTreatmentGrade(
      created.id,
      parsed.grade ?? DEFAULT_GRADE,
    );

    const treatment = await fetchTreatmentWithProcedures(created.id);

    return { ...treatment, grade };
  },

  async update(id: unknown, payload: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    const parsed = updateTreatmentSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const updatePayload: TreatmentUpdate = {};

    if (parsed.name !== undefined) updatePayload.name = parsed.name;
    if (parsed.slug !== undefined) updatePayload.slug = parsed.slug;
    if (parsed.category !== undefined)
      updatePayload.category = parsed.category ?? null;
    if (parsed.summary !== undefined)
      updatePayload.summary = parsed.summary ?? null;
    if (parsed.description !== undefined)
      updatePayload.description = parsed.description ?? null;
    if (parsed.overview !== undefined)
      updatePayload.overview = parsed.overview ?? null;
    if (parsed.base_price !== undefined)
      updatePayload.base_price = parsed.base_price ?? null;
    if (parsed.currency !== undefined)
      updatePayload.currency = parsed.currency ?? null;
    if (parsed.duration_days !== undefined)
      updatePayload.duration_days = parsed.duration_days ?? null;
    if (parsed.recovery_time_days !== undefined)
      updatePayload.recovery_time_days = parsed.recovery_time_days ?? null;
    if (parsed.success_rate !== undefined)
      updatePayload.success_rate = parsed.success_rate ?? null;
    if (parsed.is_featured !== undefined)
      updatePayload.is_featured = parsed.is_featured;
    if (parsed.is_active !== undefined)
      updatePayload.is_active = parsed.is_active;
    if (parsed.ideal_candidates !== undefined) {
      updatePayload.ideal_candidates = parsed.ideal_candidates ?? [];
    }

    const updated = (await treatmentsService.update(
      treatmentId,
      updatePayload,
    )) as Database["public"]["Tables"]["treatments"]["Row"];

    if (parsed.procedures !== undefined) {
      await upsertProcedures(treatmentId, parsed.procedures ?? []);
    }

    const grade = Object.prototype.hasOwnProperty.call(parsed, "grade")
      ? await upsertTreatmentGrade(treatmentId, parsed.grade ?? DEFAULT_GRADE)
      : await fetchTreatmentGrade(treatmentId);

    const treatment = await fetchTreatmentWithProcedures(treatmentId);

    return { ...treatment, grade };
  },

  async delete(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    await detachLegacyProcedures(treatmentId);
    return treatmentsService.remove(treatmentId);
  },
};
