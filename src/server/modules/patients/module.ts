import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

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

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

const trimString = (value: string) => value.trim();

const trimOptionalString = (value: string | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const patientController = {
  async list() {
    return patientService.list();
  },

  async search(query: string) {
    const supabase = getSupabaseAdmin();
    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, contact_email, nationality, home_city, has_testimonial")
      .or(`full_name.ilike.${searchTerm},contact_email.ilike.${searchTerm}`)
      .order("full_name", { ascending: true })
      .limit(20);

    if (error) {
      throw new ApiError(500, "Failed to search patients", error.message);
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.getById(patientId);
  },

  async create(payload: unknown) {
    const parsed = createPatientSchema.parse(payload);

    const createPayload: PatientInsert = {
      full_name: trimString(parsed.full_name),
      user_id: parsed.user_id ?? null,
      date_of_birth: parsed.date_of_birth ?? null,
      sex: parsed.sex ?? null,
      nationality: trimOptionalString(parsed.nationality),
      contact_email: trimOptionalString(parsed.contact_email),
      contact_phone: trimOptionalString(parsed.contact_phone),
      preferred_language: trimOptionalString(parsed.preferred_language),
      preferred_currency: trimOptionalString(parsed.preferred_currency),
      notes: trimOptionalString(parsed.notes),
    };

    return patientService.create(createPayload);
  },

  async update(id: unknown, payload: unknown) {
    const patientId = patientIdSchema.parse(id);
    const parsed = updatePatientSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const updatePayload: PatientUpdate = {};

    if (parsed.full_name !== undefined) updatePayload.full_name = trimString(parsed.full_name);
    if (parsed.user_id !== undefined) updatePayload.user_id = parsed.user_id ?? null;
    if (parsed.date_of_birth !== undefined) updatePayload.date_of_birth = parsed.date_of_birth ?? null;
    if (parsed.sex !== undefined) updatePayload.sex = parsed.sex ?? null;
    if (parsed.nationality !== undefined) updatePayload.nationality = trimOptionalString(parsed.nationality);
    if (parsed.contact_email !== undefined) updatePayload.contact_email = trimOptionalString(parsed.contact_email);
    if (parsed.contact_phone !== undefined) updatePayload.contact_phone = trimOptionalString(parsed.contact_phone);
    if (parsed.preferred_language !== undefined)
      updatePayload.preferred_language = trimOptionalString(parsed.preferred_language);
    if (parsed.preferred_currency !== undefined)
      updatePayload.preferred_currency = trimOptionalString(parsed.preferred_currency);
    if (parsed.notes !== undefined) updatePayload.notes = trimOptionalString(parsed.notes);

    return patientService.update(patientId, updatePayload);
  },

  async delete(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.remove(patientId);
  },
};
