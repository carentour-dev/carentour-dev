import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const STATUS_VALUES = [
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;
const statusSchema = z.enum(STATUS_VALUES);
const BOOKING_TYPE_VALUES = ["onsite", "phone", "video"] as const;
const bookingTypeSchema = z.enum(BOOKING_TYPE_VALUES);

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const isoDateTime = z.string().datetime({
  offset: true,
  message: "Expected an ISO 8601 timestamp with timezone information",
});

const durationSchema = z
  .preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(5).max(480),
  )
  .optional();

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const selectColumns = `
  *,
  patients(
    id,
    full_name,
    contact_email,
    contact_phone,
    nationality
  ),
  doctors(
    id,
    name,
    title
  ),
  coordinator:profiles!patient_consultations_coordinator_id_fkey(
    id,
    username,
    avatar_url,
    email,
    job_title
  ),
  coordinator_secure:secure_profiles!patient_consultations_coordinator_id_fkey(
    id,
    username,
    email,
    avatar_url
  ),
  contact_requests(
    id,
    status,
    request_type,
    origin
  )
`;

const consultationService = new CrudService(
  "patient_consultations",
  "patient consultation",
  selectColumns,
);

const createConsultationSchema = z.object({
  patient_id: z.string().uuid(),
  user_id: optionalUuid,
  contact_request_id: optionalUuid,
  doctor_id: optionalUuid,
  consultation_slot_id: optionalUuid,
  coordinator_id: optionalUuid,
  status: statusSchema.optional(),
  booking_type: bookingTypeSchema.optional(),
  scheduled_at: isoDateTime,
  duration_minutes: durationSchema,
  timezone: z.string().min(2).max(60).optional().nullable(),
  location: z.string().optional().nullable(),
  meeting_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateConsultationSchema = createConsultationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  patientId: z.string().uuid().optional(),
  contactRequestId: z.string().uuid().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
  coordinatorId: optionalUuid,
});

type ConsultationInsert =
  Database["public"]["Tables"]["patient_consultations"]["Insert"];
type ConsultationUpdate =
  Database["public"]["Tables"]["patient_consultations"]["Update"];
type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

const releaseConsultationSlot = async (
  supabase: SupabaseAdminClient,
  consultationId: string,
  slotId: string | null | undefined,
) => {
  if (!slotId) return;

  const { error } = await supabase
    .from("consultation_slots")
    .update({
      status: "available",
      patient_consultation_id: null,
      hold_expires_at: null,
    })
    .eq("id", slotId)
    .or(
      `patient_consultation_id.eq.${consultationId},patient_consultation_id.is.null`,
    );

  if (error) {
    throw new ApiError(
      500,
      "Failed to release consultation slot",
      error.message,
    );
  }
};

const releaseDeletedConsultationSlot = async (
  supabase: SupabaseAdminClient,
  slotId: string | null | undefined,
) => {
  if (!slotId) return;

  const { error } = await supabase
    .from("consultation_slots")
    .update({
      status: "available",
      patient_consultation_id: null,
      hold_expires_at: null,
    })
    .eq("id", slotId)
    .eq("status", "booked")
    .is("patient_consultation_id", null);

  if (error) {
    throw new ApiError(
      500,
      "Failed to release consultation slot",
      error.message,
    );
  }
};

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

export const consultationStatusValues = STATUS_VALUES;

export const patientConsultationController = {
  async list(
    filters: {
      status?: (typeof STATUS_VALUES)[number];
      patientId?: string;
      contactRequestId?: string;
      upcomingOnly?: boolean;
    } = {},
  ) {
    const parsed = listFiltersSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("patient_consultations")
      .select(selectColumns)
      .order("scheduled_at", { ascending: true });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.patientId) {
      query = query.eq("patient_id", parsed.patientId);
    }

    if (parsed.contactRequestId) {
      query = query.eq("contact_request_id", parsed.contactRequestId);
    }

    if (parsed.coordinatorId !== undefined) {
      if (parsed.coordinatorId === null) {
        query = query.is("coordinator_id", null);
      } else {
        query = query.eq("coordinator_id", parsed.coordinatorId);
      }
    }

    if (parsed.upcomingOnly) {
      query = query.gte("scheduled_at", new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(
        500,
        "Failed to load patient consultations",
        error.message,
      );
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const consultationId = z.string().uuid().parse(id);
    return consultationService.getById(consultationId);
  },

  async create(payload: unknown) {
    const parsed = createConsultationSchema.parse(payload);

    const insertPayload: ConsultationInsert = {
      patient_id: parsed.patient_id,
      user_id: await resolveUserIdForPatient(
        parsed.patient_id,
        parsed.user_id ?? undefined,
      ),
      contact_request_id: parsed.contact_request_id ?? null,
      doctor_id: parsed.doctor_id ?? null,
      consultation_slot_id: parsed.consultation_slot_id ?? null,
      coordinator_id: parsed.coordinator_id ?? null,
      status: parsed.status ?? "scheduled",
      booking_type: parsed.booking_type ?? "video",
      scheduled_at: parsed.scheduled_at,
      duration_minutes: parsed.duration_minutes ?? null,
      timezone: trimOptional(parsed.timezone),
      location: trimOptional(parsed.location),
      meeting_url: trimOptional(parsed.meeting_url),
      notes: trimOptional(parsed.notes),
    };

    return consultationService.create(insertPayload);
  },

  async update(id: unknown, payload: unknown) {
    const consultationId = z.string().uuid().parse(id);
    const parsed = updateConsultationSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const updatePayload: ConsultationUpdate = {};

    if (parsed.patient_id !== undefined) {
      updatePayload.patient_id = parsed.patient_id;
      updatePayload.user_id = await resolveUserIdForPatient(
        parsed.patient_id,
        parsed.user_id ?? undefined,
      );
    } else if (parsed.user_id !== undefined) {
      updatePayload.user_id = parsed.user_id ?? null;
    }

    if (parsed.contact_request_id !== undefined)
      updatePayload.contact_request_id = parsed.contact_request_id ?? null;
    if (parsed.doctor_id !== undefined)
      updatePayload.doctor_id = parsed.doctor_id ?? null;
    if (parsed.consultation_slot_id !== undefined)
      updatePayload.consultation_slot_id = parsed.consultation_slot_id ?? null;
    if (parsed.coordinator_id !== undefined)
      updatePayload.coordinator_id = parsed.coordinator_id ?? null;
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.booking_type !== undefined)
      updatePayload.booking_type = parsed.booking_type;
    if (parsed.scheduled_at !== undefined)
      updatePayload.scheduled_at = parsed.scheduled_at;
    if (parsed.duration_minutes !== undefined)
      updatePayload.duration_minutes = parsed.duration_minutes ?? null;
    if (parsed.timezone !== undefined)
      updatePayload.timezone = trimOptional(parsed.timezone);
    if (parsed.location !== undefined)
      updatePayload.location = trimOptional(parsed.location);
    if (parsed.meeting_url !== undefined)
      updatePayload.meeting_url = trimOptional(parsed.meeting_url);
    if (parsed.notes !== undefined)
      updatePayload.notes = trimOptional(parsed.notes);

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const currentConsultation =
      await consultationService.getById(consultationId);
    const updatedConsultation = await consultationService.update(
      consultationId,
      updatePayload,
    );

    if (parsed.status === "cancelled") {
      await releaseConsultationSlot(
        supabase,
        consultationId,
        currentConsultation.consultation_slot_id,
      );
    }

    return updatedConsultation;
  },

  async delete(id: unknown) {
    const consultationId = z.string().uuid().parse(id);
    const supabase = getSupabaseAdmin();
    const consultation = await consultationService.getById(consultationId);
    const result = await consultationService.remove(consultationId);

    await releaseDeletedConsultationSlot(
      supabase,
      consultation.consultation_slot_id,
    );

    return result;
  },
};
