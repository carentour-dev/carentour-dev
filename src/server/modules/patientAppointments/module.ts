import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const STATUS_VALUES = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"] as const;
const statusSchema = z.enum(STATUS_VALUES);

const optionalUuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  },
  z.string().uuid().nullable().optional(),
);

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: "Expected an ISO 8601 timestamp with timezone information" });

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const selectColumns =
  "*, patients(id, full_name, contact_email, contact_phone, nationality), doctors(id, name, title), patient_consultations(id, scheduled_at, status), facilities(id, name, facility_type)";

const appointmentService = new CrudService("patient_appointments", "patient appointment", selectColumns);

const createAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  user_id: optionalUuid,
  consultation_id: optionalUuid,
  doctor_id: optionalUuid,
  facility_id: optionalUuid,
  title: z.string().min(3),
  appointment_type: z.string().min(2),
  status: statusSchema.optional(),
  starts_at: isoDateTime,
  ends_at: isoDateTime.optional().nullable(),
  timezone: z
    .string()
    .min(2)
    .max(60)
    .optional()
    .nullable(),
  location: z.string().optional().nullable(),
  pre_visit_instructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields provided for update" });

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  patientId: z.string().uuid().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
});

type AppointmentInsert = Database["public"]["Tables"]["patient_appointments"]["Insert"];
type AppointmentUpdate = Database["public"]["Tables"]["patient_appointments"]["Update"];

const resolveUserIdForPatient = async (
  patientId: string,
  providedUserId?: string | null,
): Promise<string | null> => {
  if (providedUserId) {
    return providedUserId;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to resolve patient user", error.message);
  }

  return data?.user_id ?? null;
};

export const appointmentStatusValues = STATUS_VALUES;

export const patientAppointmentController = {
  async list(filters: { status?: (typeof STATUS_VALUES)[number]; patientId?: string; upcomingOnly?: boolean } = {}) {
    const parsed = listFiltersSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("patient_appointments")
      .select(selectColumns)
      .order("starts_at", { ascending: true });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.patientId) {
      query = query.eq("patient_id", parsed.patientId);
    }

    if (parsed.upcomingOnly) {
      query = query.gte("starts_at", new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, "Failed to load patient appointments", error.message);
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    return appointmentService.getById(appointmentId);
  },

  async create(payload: unknown) {
    const parsed = createAppointmentSchema.parse(payload);

    const insertPayload: AppointmentInsert = {
      patient_id: parsed.patient_id,
      user_id: await resolveUserIdForPatient(parsed.patient_id, parsed.user_id ?? undefined),
      consultation_id: parsed.consultation_id ?? null,
      doctor_id: parsed.doctor_id ?? null,
      facility_id: parsed.facility_id ?? null,
      title: parsed.title.trim(),
      appointment_type: parsed.appointment_type.trim(),
      status: parsed.status ?? "scheduled",
      starts_at: parsed.starts_at,
      ends_at: parsed.ends_at ?? null,
      timezone: trimOptional(parsed.timezone),
      location: trimOptional(parsed.location),
      pre_visit_instructions: trimOptional(parsed.pre_visit_instructions),
      notes: trimOptional(parsed.notes),
    };

    return appointmentService.create(insertPayload);
  },

  async update(id: unknown, payload: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    const parsed = updateAppointmentSchema.parse(payload);

    const updatePayload: AppointmentUpdate = {};

    if (parsed.patient_id !== undefined) {
      updatePayload.patient_id = parsed.patient_id;
      updatePayload.user_id = await resolveUserIdForPatient(parsed.patient_id, parsed.user_id ?? undefined);
    } else if (parsed.user_id !== undefined) {
      updatePayload.user_id = parsed.user_id ?? null;
    }

    if (parsed.consultation_id !== undefined) updatePayload.consultation_id = parsed.consultation_id ?? null;
    if (parsed.doctor_id !== undefined) updatePayload.doctor_id = parsed.doctor_id ?? null;
    if (parsed.facility_id !== undefined) updatePayload.facility_id = parsed.facility_id ?? null;
    if (parsed.title !== undefined) updatePayload.title = parsed.title.trim();
    if (parsed.appointment_type !== undefined) updatePayload.appointment_type = parsed.appointment_type.trim();
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.starts_at !== undefined) updatePayload.starts_at = parsed.starts_at;
    if (parsed.ends_at !== undefined) updatePayload.ends_at = parsed.ends_at ?? null;
    if (parsed.timezone !== undefined) updatePayload.timezone = trimOptional(parsed.timezone);
    if (parsed.location !== undefined) updatePayload.location = trimOptional(parsed.location);
    if (parsed.pre_visit_instructions !== undefined) {
      updatePayload.pre_visit_instructions = trimOptional(parsed.pre_visit_instructions);
    }
    if (parsed.notes !== undefined) updatePayload.notes = trimOptional(parsed.notes);

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    return appointmentService.update(appointmentId, updatePayload);
  },

  async delete(id: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    return appointmentService.remove(appointmentId);
  },
};
