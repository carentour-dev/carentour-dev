import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";

// Patients share the generic CRUD helpers used by other admin modules.
const patientServiceInstance = new CrudService("patients", "patient");

const isoDate = z
  .string()
  .regex(/^(\d{4})-(\d{2})-(\d{2})$/)
  .optional();

const optionalUuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  },
  z.string().uuid().nullable().optional(),
);

const createPatientSchema = z.object({
  user_id: optionalUuid,
  full_name: z.string().min(2),
  date_of_birth: isoDate,
  sex: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  preferred_language: z.string().optional(),
  preferred_currency: z.string().optional(),
  notes: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();
const patientIdSchema = z.string().uuid();

export const patientService = patientServiceInstance;

export const patientController = {
  async list() {
    return patientService.list();
  },

  async get(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.getById(patientId);
  },

  async create(payload: unknown) {
    const parsed = createPatientSchema.parse(payload);

    return patientService.create({
      ...parsed,
      user_id: parsed.user_id ?? null,
      contact_email: parsed.contact_email ?? null,
      contact_phone: parsed.contact_phone ?? null,
      preferred_language: parsed.preferred_language ?? null,
      preferred_currency: parsed.preferred_currency ?? null,
      nationality: parsed.nationality ?? null,
      notes: parsed.notes ?? null,
      date_of_birth: parsed.date_of_birth ?? null,
      sex: parsed.sex ?? null,
    });
  },

  async update(id: unknown, payload: unknown) {
    const patientId = patientIdSchema.parse(id);
    const parsed = updatePatientSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return patientService.update(patientId, parsed);
  },

  async delete(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.remove(patientId);
  },
};
