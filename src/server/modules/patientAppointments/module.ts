import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const STATUS_VALUES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
] as const;
const statusSchema = z.enum(STATUS_VALUES);
const ACTIVE_STATUS_VALUES = ["scheduled", "confirmed", "rescheduled"] as const;
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

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

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const selectColumns =
  "*, patients(id, full_name, contact_email, contact_phone, nationality), doctors(id, name, title), patient_consultations(id, scheduled_at, status), service_provider:service_providers(id, name, facility_type)";

const appointmentService = new CrudService(
  "patient_appointments",
  "patient appointment",
  selectColumns,
);

const appointmentPayloadSchema = z.object({
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
  timezone: z.string().min(2).max(60).optional().nullable(),
  location: z.string().optional().nullable(),
  pre_visit_instructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createAppointmentSchema = appointmentPayloadSchema.refine(
  (data) => {
    if (!data.ends_at) return true;
    return new Date(data.ends_at) > new Date(data.starts_at);
  },
  {
    path: ["ends_at"],
    message: "Appointment end time must be after start time",
  },
);

const updateAppointmentSchema = appointmentPayloadSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  })
  .refine(
    (data) => {
      if (!data.starts_at || !data.ends_at) return true;
      return new Date(data.ends_at) > new Date(data.starts_at);
    },
    {
      path: ["ends_at"],
      message: "Appointment end time must be after start time",
    },
  );

const listFiltersSchema = z.object({
  status: statusSchema.optional(),
  patientId: z.string().uuid().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
});

type AppointmentInsert =
  Database["public"]["Tables"]["patient_appointments"]["Insert"];
type AppointmentUpdate =
  Database["public"]["Tables"]["patient_appointments"]["Update"];
type AppointmentRow =
  Database["public"]["Tables"]["patient_appointments"]["Row"];

const isActiveAppointmentStatus = (
  status: AppointmentRow["status"],
): status is (typeof ACTIVE_STATUS_VALUES)[number] =>
  ACTIVE_STATUS_VALUES.includes(
    status as (typeof ACTIVE_STATUS_VALUES)[number],
  );

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);

const resolveAppointmentEnd = (startsAt: string, endsAt?: string | null) => {
  if (endsAt) return new Date(endsAt);
  return addMinutes(new Date(startsAt), DEFAULT_APPOINTMENT_DURATION_MINUTES);
};

const intervalsOverlap = (
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
) => leftStart < rightEnd && rightStart < leftEnd;

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

const mapAppointmentWriteError = (error: {
  code?: string;
  message?: string;
}) => {
  if (error.code === "23P01") {
    return new ApiError(
      409,
      "This appointment conflicts with an existing active patient, doctor, or facility appointment.",
      error.message,
    );
  }

  if (error.code === "23514") {
    return new ApiError(
      422,
      "Appointment end time must be after start time.",
      error.message,
    );
  }

  return new ApiError(
    500,
    "Patient appointment operation failed",
    error.message,
  );
};

const ensureNoAppointmentConflict = async (
  candidate: Pick<
    AppointmentRow,
    | "patient_id"
    | "doctor_id"
    | "facility_id"
    | "status"
    | "starts_at"
    | "ends_at"
  >,
  options: { excludeAppointmentId?: string } = {},
) => {
  if (!isActiveAppointmentStatus(candidate.status)) return;

  const startsAt = new Date(candidate.starts_at);
  const endsAt = resolveAppointmentEnd(candidate.starts_at, candidate.ends_at);

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    endsAt <= startsAt
  ) {
    throw new ApiError(422, "Appointment end time must be after start time.");
  }

  const resourceFilters = [`patient_id.eq.${candidate.patient_id}`];

  if (candidate.doctor_id) {
    resourceFilters.push(`doctor_id.eq.${candidate.doctor_id}`);
  }

  if (candidate.facility_id) {
    resourceFilters.push(`facility_id.eq.${candidate.facility_id}`);
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("patient_appointments")
    .select(
      "id, patient_id, doctor_id, facility_id, status, starts_at, ends_at",
    )
    .in("status", [...ACTIVE_STATUS_VALUES])
    .lt("starts_at", endsAt.toISOString())
    .or(resourceFilters.join(","));

  if (options.excludeAppointmentId) {
    query = query.neq("id", options.excludeAppointmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new ApiError(
      500,
      "Failed to check appointment availability",
      error.message,
    );
  }

  const conflict = (
    (data ?? []) as Pick<
      AppointmentRow,
      | "id"
      | "patient_id"
      | "doctor_id"
      | "facility_id"
      | "starts_at"
      | "ends_at"
    >[]
  ).find((appointment) => {
    const existingStart = new Date(appointment.starts_at);
    const existingEnd = resolveAppointmentEnd(
      appointment.starts_at,
      appointment.ends_at,
    );

    return (
      intervalsOverlap(startsAt, endsAt, existingStart, existingEnd) &&
      (appointment.patient_id === candidate.patient_id ||
        (candidate.doctor_id !== null &&
          appointment.doctor_id === candidate.doctor_id) ||
        (candidate.facility_id !== null &&
          appointment.facility_id === candidate.facility_id))
    );
  });

  if (conflict) {
    throw new ApiError(
      409,
      "This appointment conflicts with an existing active patient, doctor, or facility appointment.",
      { conflictingAppointmentId: conflict.id },
    );
  }
};

export const appointmentStatusValues = STATUS_VALUES;

export const patientAppointmentController = {
  async list(
    filters: {
      status?: (typeof STATUS_VALUES)[number];
      patientId?: string;
      upcomingOnly?: boolean;
    } = {},
  ) {
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
      throw new ApiError(
        500,
        "Failed to load patient appointments",
        error.message,
      );
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    return appointmentService.getById(appointmentId);
  },

  async create(payload: unknown) {
    const parsed = createAppointmentSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const insertPayload: AppointmentInsert = {
      patient_id: parsed.patient_id,
      user_id: await resolveUserIdForPatient(
        parsed.patient_id,
        parsed.user_id ?? undefined,
      ),
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

    await ensureNoAppointmentConflict({
      patient_id: insertPayload.patient_id,
      doctor_id: insertPayload.doctor_id ?? null,
      facility_id: insertPayload.facility_id ?? null,
      status: insertPayload.status ?? "scheduled",
      starts_at: insertPayload.starts_at,
      ends_at: insertPayload.ends_at ?? null,
    });

    const { data, error } = await supabase
      .from("patient_appointments")
      .insert(insertPayload)
      .select(selectColumns)
      .single();

    if (error) {
      throw mapAppointmentWriteError(error);
    }

    return data;
  },

  async update(id: unknown, payload: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    const parsed = updateAppointmentSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const updatePayload: AppointmentUpdate = {};

    if (parsed.patient_id !== undefined) {
      updatePayload.patient_id = parsed.patient_id;
      updatePayload.user_id = await resolveUserIdForPatient(
        parsed.patient_id,
        parsed.user_id ?? undefined,
      );
    } else if (parsed.user_id !== undefined) {
      updatePayload.user_id = parsed.user_id ?? null;
    }

    if (parsed.consultation_id !== undefined)
      updatePayload.consultation_id = parsed.consultation_id ?? null;
    if (parsed.doctor_id !== undefined)
      updatePayload.doctor_id = parsed.doctor_id ?? null;
    if (parsed.facility_id !== undefined)
      updatePayload.facility_id = parsed.facility_id ?? null;
    if (parsed.title !== undefined) updatePayload.title = parsed.title.trim();
    if (parsed.appointment_type !== undefined)
      updatePayload.appointment_type = parsed.appointment_type.trim();
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.starts_at !== undefined)
      updatePayload.starts_at = parsed.starts_at;
    if (parsed.ends_at !== undefined)
      updatePayload.ends_at = parsed.ends_at ?? null;
    if (parsed.timezone !== undefined)
      updatePayload.timezone = trimOptional(parsed.timezone);
    if (parsed.location !== undefined)
      updatePayload.location = trimOptional(parsed.location);
    if (parsed.pre_visit_instructions !== undefined) {
      updatePayload.pre_visit_instructions = trimOptional(
        parsed.pre_visit_instructions,
      );
    }
    if (parsed.notes !== undefined)
      updatePayload.notes = trimOptional(parsed.notes);

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const { data: currentAppointment, error: loadError } = await supabase
      .from("patient_appointments")
      .select(
        "id, patient_id, doctor_id, facility_id, status, starts_at, ends_at",
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (loadError) {
      throw new ApiError(
        500,
        "Failed to load patient appointment",
        loadError.message,
      );
    }

    if (!currentAppointment) {
      throw new ApiError(404, "patient appointment not found");
    }

    await ensureNoAppointmentConflict(
      {
        patient_id: updatePayload.patient_id ?? currentAppointment.patient_id,
        doctor_id:
          updatePayload.doctor_id !== undefined
            ? (updatePayload.doctor_id ?? null)
            : currentAppointment.doctor_id,
        facility_id:
          updatePayload.facility_id !== undefined
            ? (updatePayload.facility_id ?? null)
            : currentAppointment.facility_id,
        status: updatePayload.status ?? currentAppointment.status,
        starts_at: updatePayload.starts_at ?? currentAppointment.starts_at,
        ends_at:
          updatePayload.ends_at !== undefined
            ? (updatePayload.ends_at ?? null)
            : currentAppointment.ends_at,
      },
      { excludeAppointmentId: appointmentId },
    );

    const { data, error } = await supabase
      .from("patient_appointments")
      .update(updatePayload)
      .eq("id", appointmentId)
      .select(selectColumns)
      .maybeSingle();

    if (error) {
      throw mapAppointmentWriteError(error);
    }

    if (!data) {
      throw new ApiError(404, "patient appointment not found");
    }

    return data;
  },

  async delete(id: unknown) {
    const appointmentId = z.string().uuid().parse(id);
    return appointmentService.remove(appointmentId);
  },
};
