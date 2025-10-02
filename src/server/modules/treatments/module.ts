import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";

const treatmentsService = new CrudService("treatments", "treatment");

const createTreatmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  recovery_time_days: z.coerce.number().int().min(0).optional(),
  success_rate: z.coerce.number().min(0).max(100).optional(),
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

    return treatmentsService.create({
      ...parsed,
      category: parsed.category ?? null,
      summary: parsed.summary ?? null,
      description: parsed.description ?? null,
      base_price: parsed.base_price ?? null,
      currency: parsed.currency ?? null,
      duration_days: parsed.duration_days ?? null,
      recovery_time_days: parsed.recovery_time_days ?? null,
      success_rate: parsed.success_rate ?? null,
      is_active: parsed.is_active ?? true,
    });
  },

  async update(id: unknown, payload: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    const parsed = updateTreatmentSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return treatmentsService.update(treatmentId, parsed);
  },

  async delete(id: unknown) {
    const treatmentId = treatmentIdSchema.parse(id);
    return treatmentsService.remove(treatmentId);
  },
};
