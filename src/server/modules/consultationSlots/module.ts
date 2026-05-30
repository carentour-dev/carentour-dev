import { z } from "zod";
import { appointmentBookingController } from "@/server/modules/appointmentBookings/module";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

const BOOKING_TYPES = ["onsite", "phone", "video"] as const;
const SLOT_STATUSES = [
  "available",
  "held",
  "booked",
  "blocked",
  "cancelled",
] as const;

const isoDateTime = z.string().datetime({
  offset: true,
  message: "Expected an ISO 8601 timestamp with timezone information",
});

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const slotSelectColumns = `
  *,
  doctors(
    id,
    name,
    title,
    specialization,
    avatar_url
  ),
  patient_consultations!consultation_slots_patient_consultation_id_fkey(
    id,
    patient_id,
    status,
    scheduled_at,
    patients(
      id,
      full_name,
      contact_email
    )
  )
`;

const publicSlotSelectColumns = `
  id,
  doctor_id,
  booking_type,
  status,
  starts_at,
  ends_at,
  timezone,
  location,
  doctors(
    id,
    name,
    title,
    specialization,
    avatar_url
  )
`;

const slotPayloadSchema = z.object({
  doctor_id: z.string().uuid(),
  booking_type: z.enum(BOOKING_TYPES).default("video"),
  status: z.enum(SLOT_STATUSES).optional(),
  starts_at: isoDateTime,
  ends_at: isoDateTime,
  timezone: z.string().min(2).max(60).default("UTC"),
  location: z.string().optional().nullable(),
  meeting_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_by_profile_id: optionalUuid,
});

const createSlotSchema = slotPayloadSchema.refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  {
    path: ["ends_at"],
    message: "Slot end time must be after start time",
  },
);

const updateSlotSchema = slotPayloadSchema
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
      message: "Slot end time must be after start time",
    },
  );

const listSlotsSchema = z.object({
  doctorId: z.string().uuid().optional(),
  bookingType: z.enum(BOOKING_TYPES).optional(),
  status: z.enum(SLOT_STATUSES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  availableOnly: z.coerce.boolean().optional(),
});

const bookSlotSchema = z.object({
  slot_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  user_id: optionalUuid,
  contact_request_id: optionalUuid,
  notes: z.string().optional().nullable(),
});

type SlotInsert = Database["public"]["Tables"]["consultation_slots"]["Insert"];
type SlotUpdate = Database["public"]["Tables"]["consultation_slots"]["Update"];

const applyDateFilter = <
  T extends {
    gte: (column: string, value: string) => T;
    lte: (column: string, value: string) => T;
  },
>(
  query: T,
  from?: string,
  to?: string,
) => {
  let next = query;
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      next = next.gte("starts_at", fromDate.toISOString());
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      next = next.lte("starts_at", toDate.toISOString());
    }
  }

  return next;
};

const mapSlotError = (error: { code?: string; message?: string }) => {
  if (isMissingSlotSchemaError(error)) {
    return new ApiError(
      503,
      "Consultation slot booking is not set up yet. Apply the latest Supabase migration before managing availability.",
      error.message,
    );
  }

  if (error.code === "23P01") {
    return new ApiError(
      409,
      "This slot overlaps an existing active slot for the selected doctor.",
      error.message,
    );
  }

  if (error.code === "23505") {
    return new ApiError(
      409,
      "This consultation slot is no longer available.",
      error.message,
    );
  }

  return new ApiError(500, "Consultation slot operation failed", error.message);
};

const isMissingSlotSchemaError = (error: {
  code?: string;
  message?: string;
}) => {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("Could not find the table 'public.consultation_slots'") ||
    message.includes("Could not find the 'consultation_slot") ||
    message.includes('type "public.consultation_booking_type" does not exist')
  );
};

export const consultationBookingTypeValues = BOOKING_TYPES;
export const consultationSlotStatusValues = SLOT_STATUSES;

export const consultationSlotController = {
  async list(
    filters: z.input<typeof listSlotsSchema> = {},
    options: { publicOnly?: boolean } = {},
  ) {
    const parsed = listSlotsSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    if (options.publicOnly || parsed.availableOnly) {
      await appointmentBookingController.expireStaleHolds();
    }

    let query = supabase
      .from("consultation_slots")
      .select(options.publicOnly ? publicSlotSelectColumns : slotSelectColumns)
      .order("starts_at", { ascending: true });

    if (options.publicOnly || parsed.availableOnly) {
      query = query
        .eq("status", "available")
        .gte("starts_at", new Date().toISOString());
    } else if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.doctorId) {
      query = query.eq("doctor_id", parsed.doctorId);
    }

    if (parsed.bookingType) {
      query = query.eq("booking_type", parsed.bookingType);
    }

    query = applyDateFilter(query, parsed.from, parsed.to);

    const { data, error } = await query;

    if (error) {
      if (isMissingSlotSchemaError(error)) {
        console.warn(
          "[consultation-slots] schema is not available yet; returning an empty slot list",
          error.message,
        );
        return [];
      }

      throw new ApiError(
        500,
        "Failed to load consultation slots",
        error.message,
      );
    }

    return data ?? [];
  },

  async create(payload: unknown, createdByProfileId?: string | null) {
    const parsed = createSlotSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const insertPayload: SlotInsert = {
      doctor_id: parsed.doctor_id,
      booking_type: parsed.booking_type,
      status: parsed.status ?? "available",
      starts_at: parsed.starts_at,
      ends_at: parsed.ends_at,
      timezone: parsed.timezone,
      location: trimOptional(parsed.location),
      meeting_url: trimOptional(parsed.meeting_url),
      notes: trimOptional(parsed.notes),
      created_by_profile_id:
        parsed.created_by_profile_id ?? createdByProfileId ?? null,
    };

    const { data, error } = await supabase
      .from("consultation_slots")
      .insert(insertPayload)
      .select(slotSelectColumns)
      .single();

    if (error) {
      throw mapSlotError(error);
    }

    return data;
  },

  async update(id: unknown, payload: unknown) {
    const slotId = z.string().uuid().parse(id);
    const parsed = updateSlotSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const updatePayload: SlotUpdate = {};
    if (parsed.doctor_id !== undefined)
      updatePayload.doctor_id = parsed.doctor_id;
    if (parsed.booking_type !== undefined)
      updatePayload.booking_type = parsed.booking_type;
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.starts_at !== undefined)
      updatePayload.starts_at = parsed.starts_at;
    if (parsed.ends_at !== undefined) updatePayload.ends_at = parsed.ends_at;
    if (parsed.timezone !== undefined) updatePayload.timezone = parsed.timezone;
    if (parsed.location !== undefined)
      updatePayload.location = trimOptional(parsed.location);
    if (parsed.meeting_url !== undefined)
      updatePayload.meeting_url = trimOptional(parsed.meeting_url);
    if (parsed.notes !== undefined)
      updatePayload.notes = trimOptional(parsed.notes);
    if (parsed.created_by_profile_id !== undefined) {
      updatePayload.created_by_profile_id =
        parsed.created_by_profile_id ?? null;
    }

    if (updatePayload.status && updatePayload.status !== "held") {
      updatePayload.hold_expires_at = null;
    }

    const { data, error } = await supabase
      .from("consultation_slots")
      .update(updatePayload)
      .eq("id", slotId)
      .select(slotSelectColumns)
      .maybeSingle();

    if (error) {
      throw mapSlotError(error);
    }

    if (!data) {
      throw new ApiError(404, "Consultation slot not found");
    }

    return data;
  },

  async delete(id: unknown) {
    const slotId = z.string().uuid().parse(id);
    const supabase = getSupabaseAdmin();

    const { data: existingSlot, error: loadError } = await supabase
      .from("consultation_slots")
      .select("id, status, patient_consultation_id")
      .eq("id", slotId)
      .maybeSingle();

    if (loadError) {
      throw mapSlotError(loadError);
    }

    if (!existingSlot) {
      throw new ApiError(404, "Consultation slot not found");
    }

    const { data: linkedConsultation, error: linkError } = await supabase
      .from("patient_consultations")
      .select("id")
      .eq("consultation_slot_id", slotId)
      .limit(1)
      .maybeSingle();

    if (linkError) {
      throw mapSlotError(linkError);
    }

    if (
      existingSlot.status === "booked" &&
      (existingSlot.patient_consultation_id || linkedConsultation)
    ) {
      throw new ApiError(
        409,
        "Booked slots with a linked consultation must be managed from the consultation record.",
      );
    }

    const { data, error } = await supabase
      .from("consultation_slots")
      .delete()
      .eq("id", slotId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to delete consultation slot",
        error.message,
      );
    }

    if (!data) {
      throw new ApiError(404, "Consultation slot not found");
    }

    return { success: true };
  },

  async book(payload: unknown) {
    const parsed = bookSlotSchema.parse(payload);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("book_consultation_slot", {
      p_slot_id: parsed.slot_id,
      p_patient_id: parsed.patient_id,
      p_user_id: parsed.user_id ?? null,
      p_contact_request_id: parsed.contact_request_id ?? null,
      p_notes: trimOptional(parsed.notes),
    });

    if (error) {
      throw mapSlotError(error);
    }

    if (!data) {
      throw new ApiError(
        500,
        "Consultation slot booking did not return a consultation",
      );
    }

    return data;
  },
};
