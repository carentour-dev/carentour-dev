import { z } from "zod";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database, Json } from "@/integrations/supabase/types";

const BOOKING_STATUSES = [
  "requested",
  "held",
  "confirmed",
  "reschedule_requested",
  "cancelled",
  "expired",
  "completed",
  "no_show",
] as const;

const BOOKING_TYPES = ["onsite", "phone", "video"] as const;

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, z.string().uuid().nullable().optional());

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const createRequestedBookingSchema = z.object({
  patient_id: optionalUuid,
  user_id: optionalUuid,
  contact_request_id: optionalUuid,
  consultation_slot_id: z.string().uuid(),
  booking_type: z.enum(BOOKING_TYPES).optional(),
  source: z.string().min(2).max(80).optional(),
  notes: z.string().optional().nullable(),
  metadata: jsonSchema.optional(),
});

const listBookingsSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  patientId: z.string().uuid().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
});

const updateBookingSchema = z
  .object({
    status: z.enum(BOOKING_STATUSES).optional(),
    notes: z.string().optional().nullable(),
    metadata: jsonSchema.optional(),
    cancellation_reason: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });

const bookingActionSchema = z.object({
  action: z.enum([
    "confirm",
    "release",
    "cancel",
    "request_reschedule",
    "assign_slot",
  ]),
  slot_id: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
  cancellation_reason: z.string().optional().nullable(),
});

type AppointmentBookingInsert =
  Database["public"]["Tables"]["appointment_bookings"]["Insert"];
type AppointmentBookingUpdate =
  Database["public"]["Tables"]["appointment_bookings"]["Update"];
type AppointmentBookingRow =
  Database["public"]["Tables"]["appointment_bookings"]["Row"];

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapBookingError = (error: { code?: string; message?: string }) => {
  if (error.code === "23505") {
    return new ApiError(
      409,
      "This appointment slot is no longer available.",
      error.message,
    );
  }

  if (error.code === "23514" || error.code === "22023") {
    return new ApiError(
      422,
      "Appointment booking state is invalid for this operation.",
      error.message,
    );
  }

  if (error.code === "P0002") {
    return new ApiError(404, "Appointment booking resource not found.");
  }

  return new ApiError(
    500,
    "Appointment booking operation failed",
    error.message,
  );
};

export const appointmentBookingStatusValues = BOOKING_STATUSES;

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
    title,
    specialization
  ),
  contact_requests(
    id,
    status,
    request_type,
    origin,
    treatment,
    email,
    phone
  ),
  consultation_slots(
    id,
    status,
    starts_at,
    ends_at,
    timezone
  ),
  patient_consultations(
    id,
    status,
    scheduled_at
  )
`;

export const appointmentBookingController = {
  async list(filters: z.input<typeof listBookingsSchema> = {}) {
    const parsed = listBookingsSchema.parse(filters);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("appointment_bookings")
      .select(selectColumns)
      .order("created_at", { ascending: false });

    if (parsed.status) {
      query = query.eq("status", parsed.status);
    }

    if (parsed.patientId) {
      query = query.eq("patient_id", parsed.patientId);
    }

    if (parsed.upcomingOnly) {
      query = query.or(
        `requested_starts_at.gte.${new Date().toISOString()},confirmed_starts_at.gte.${new Date().toISOString()}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(
        500,
        "Failed to load appointment bookings",
        error.message,
      );
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const bookingId = z.string().uuid().parse(id);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("appointment_bookings")
      .select(selectColumns)
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load appointment booking",
        error.message,
      );
    }

    if (!data) {
      throw new ApiError(404, "Appointment booking not found");
    }

    return data;
  },

  async expireStaleHolds() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc(
      "expire_stale_appointment_booking_holds",
    );

    if (error) {
      throw mapBookingError(error);
    }

    return data ?? 0;
  },

  async createRequested(payload: unknown) {
    const parsed = createRequestedBookingSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const { data: slot, error: slotError } = await supabase
      .from("consultation_slots")
      .select(
        "id, doctor_id, booking_type, starts_at, ends_at, timezone, location, meeting_url",
      )
      .eq("id", parsed.consultation_slot_id)
      .maybeSingle();

    if (slotError) {
      throw new ApiError(
        500,
        "Failed to load requested consultation slot",
        slotError.message,
      );
    }

    if (!slot) {
      throw new ApiError(404, "Requested consultation slot not found.");
    }

    const insertPayload: AppointmentBookingInsert = {
      patient_id: parsed.patient_id ?? null,
      user_id: parsed.user_id ?? null,
      contact_request_id: parsed.contact_request_id ?? null,
      consultation_slot_id: slot.id,
      doctor_id: slot.doctor_id,
      booking_type: parsed.booking_type ?? slot.booking_type,
      status: "requested",
      requested_starts_at: slot.starts_at,
      requested_ends_at: slot.ends_at,
      timezone: slot.timezone,
      location: slot.location,
      meeting_url: slot.meeting_url,
      source: parsed.source ?? "consultation_form",
      notes: trimOptional(parsed.notes),
      metadata: parsed.metadata ?? {},
    };

    const { data, error } = await supabase
      .from("appointment_bookings")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      throw mapBookingError(error);
    }

    return data;
  },

  async markRequested(id: string, metadata: Json) {
    return this.update(id, {
      status: "requested",
      metadata,
    });
  },

  async hold(
    booking: Pick<
      AppointmentBookingRow,
      | "id"
      | "consultation_slot_id"
      | "patient_id"
      | "user_id"
      | "contact_request_id"
    >,
    options: { notes?: string | null; holdMinutes?: number | null } = {},
  ) {
    if (!booking.consultation_slot_id) {
      throw new ApiError(422, "Appointment booking has no selected slot.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc(
      "hold_appointment_booking_slot",
      {
        p_booking_id: booking.id,
        p_slot_id: booking.consultation_slot_id,
        p_patient_id: booking.patient_id,
        p_user_id: booking.user_id,
        p_contact_request_id: booking.contact_request_id,
        p_notes: trimOptional(options.notes),
        p_hold_minutes: options.holdMinutes ?? 120,
      },
    );

    if (error) {
      throw mapBookingError(error);
    }

    return data;
  },

  async confirm(
    booking: Pick<
      AppointmentBookingRow,
      | "id"
      | "consultation_slot_id"
      | "patient_id"
      | "user_id"
      | "contact_request_id"
    >,
    options: { notes?: string | null } = {},
  ) {
    if (!booking.consultation_slot_id || !booking.patient_id) {
      throw new ApiError(
        422,
        "Appointment booking requires a patient and selected slot before confirmation.",
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("confirm_appointment_booking", {
      p_booking_id: booking.id,
      p_slot_id: booking.consultation_slot_id,
      p_patient_id: booking.patient_id,
      p_user_id: booking.user_id,
      p_contact_request_id: booking.contact_request_id,
      p_notes: trimOptional(options.notes),
    });

    if (error) {
      throw mapBookingError(error);
    }

    return data;
  },

  async assignSlot(
    booking: Pick<
      AppointmentBookingRow,
      | "id"
      | "status"
      | "consultation_slot_id"
      | "patient_id"
      | "user_id"
      | "contact_request_id"
      | "patient_consultation_id"
    >,
    options: { slotId?: unknown; notes?: string | null },
  ) {
    const slotId = z.string().uuid().parse(options.slotId);
    const notes = trimOptional(options.notes);

    if (
      ["cancelled", "expired", "completed", "no_show"].includes(booking.status)
    ) {
      throw new ApiError(
        422,
        "Closed appointment bookings cannot be assigned to a new slot.",
      );
    }

    if (booking.patient_consultation_id) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.rpc(
        "reassign_appointment_booking_slot",
        {
          p_booking_id: booking.id,
          p_slot_id: slotId,
          p_notes: notes,
        },
      );

      if (error) {
        throw mapBookingError(error);
      }

      return this.get(booking.id);
    }

    if (booking.status === "held" && booking.consultation_slot_id === slotId) {
      return this.get(booking.id);
    }

    if (
      booking.status === "held" ||
      booking.status === "reschedule_requested"
    ) {
      await this.releaseHold(booking.id, notes);
    }

    const held = await this.hold(
      {
        id: booking.id,
        consultation_slot_id: slotId,
        patient_id: booking.patient_id,
        user_id: booking.user_id,
        contact_request_id: booking.contact_request_id,
      },
      { notes },
    );

    return this.get(held.id);
  },

  async update(id: unknown, payload: unknown) {
    const bookingId = z.string().uuid().parse(id);
    const parsed = updateBookingSchema.parse(payload);
    const supabase = getSupabaseAdmin();

    const updatePayload: AppointmentBookingUpdate = {};
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.notes !== undefined)
      updatePayload.notes = trimOptional(parsed.notes);
    if (parsed.cancellation_reason !== undefined) {
      updatePayload.cancellation_reason = trimOptional(
        parsed.cancellation_reason,
      );
    }
    if (parsed.metadata !== undefined) updatePayload.metadata = parsed.metadata;

    const { data, error } = await supabase
      .from("appointment_bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw mapBookingError(error);
    }

    if (!data) {
      throw new ApiError(404, "Appointment booking not found");
    }

    return data;
  },

  async releaseHold(id: unknown, notes?: string | null) {
    const bookingId = z.string().uuid().parse(id);
    const supabase = getSupabaseAdmin();
    const booking = await this.get(bookingId);

    const { data, error } = await supabase
      .from("appointment_bookings")
      .update({
        status: "requested",
        hold_expires_at: null,
        notes: trimOptional(notes) ?? booking.notes,
        metadata: {
          ...(typeof booking.metadata === "object" &&
          booking.metadata !== null &&
          !Array.isArray(booking.metadata)
            ? booking.metadata
            : {}),
          releasedAt: new Date().toISOString(),
        },
      })
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw mapBookingError(error);
    }

    if (!data) {
      throw new ApiError(404, "Appointment booking not found");
    }

    if (booking.consultation_slot_id) {
      const { error: slotError } = await supabase
        .from("consultation_slots")
        .update({
          status: "available",
          hold_expires_at: null,
        })
        .eq("id", booking.consultation_slot_id)
        .eq("status", "held")
        .is("patient_consultation_id", null);

      if (slotError) {
        throw new ApiError(
          500,
          "Failed to release consultation slot hold",
          slotError.message,
        );
      }
    }

    return this.get(bookingId);
  },

  async cancel(
    id: unknown,
    payload: { notes?: string | null; cancellation_reason?: string | null },
  ) {
    const bookingId = z.string().uuid().parse(id);
    const released = await this.releaseHold(bookingId, payload.notes);

    return this.update(released.id, {
      status: "cancelled",
      notes: payload.notes ?? released.notes,
      cancellation_reason: payload.cancellation_reason ?? null,
    });
  },

  async requestReschedule(id: unknown, notes?: string | null) {
    const bookingId = z.string().uuid().parse(id);
    const released = await this.releaseHold(bookingId, notes);

    return this.update(released.id, {
      status: "reschedule_requested",
      notes: notes ?? released.notes,
    });
  },

  async performAction(id: unknown, payload: unknown) {
    const parsed = bookingActionSchema.parse(payload);
    const booking = await this.get(id);

    switch (parsed.action) {
      case "confirm":
        return this.confirm(booking, { notes: parsed.notes });
      case "release":
        return this.releaseHold(booking.id, parsed.notes);
      case "cancel":
        return this.cancel(booking.id, {
          notes: parsed.notes,
          cancellation_reason: parsed.cancellation_reason,
        });
      case "request_reschedule":
        return this.requestReschedule(booking.id, parsed.notes);
      case "assign_slot":
        return this.assignSlot(booking, {
          slotId: parsed.slot_id,
          notes: parsed.notes,
        });
    }
  },
};
