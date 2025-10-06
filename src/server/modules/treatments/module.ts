import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import type { Database } from "@/integrations/supabase/types";

type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"];
type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"];

const treatmentsService = new CrudService("treatments", "treatment");

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
});

const updateTreatmentSchema = createTreatmentSchema.partial();
const treatmentIdSchema = z.string().uuid();

export const treatmentController = {
  async list() {
    return treatmentsService.list();
  },

  async get(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    return treatmentsService.getById(treatmentId);
  },

  async create(payload: unknown) {
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

    return treatmentsService.create(createPayload);
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

    return treatmentsService.update(treatmentId, updatePayload);
  },

  async delete(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    return treatmentsService.remove(treatmentId);
  },
};
