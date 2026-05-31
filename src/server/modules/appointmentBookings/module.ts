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
  archived: z.enum(["active", "archived", "all"]).optional(),
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
    "archive",
  ]),
  patient_id: optionalUuid,
  slot_id: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
  cancellation_reason: z.string().optional().nullable(),
});

const reminderActionSchema = z.object({
  dryRun: z.coerce.boolean().optional().default(true),
});

type AppointmentBookingInsert =
  Database["public"]["Tables"]["appointment_bookings"]["Insert"];
type AppointmentBookingUpdate =
  Database["public"]["Tables"]["appointment_bookings"]["Update"];
type AppointmentBookingRow =
  Database["public"]["Tables"]["appointment_bookings"]["Row"];
type AppointmentBookingNotificationType =
  | "confirmed"
  | "rescheduled"
  | "cancelled";
type AppointmentBookingReminderResult = {
  success: boolean;
  dryRun: boolean;
  checked: number;
  processed: number;
  results?: Array<{
    bookingId?: string;
    key?: string;
    status?: string;
    email?: string;
    emailId?: string | null;
    error?: string;
    preview?: {
      subject?: string;
      text?: string;
    };
  }>;
  error?: string;
};
type AppointmentBookingWithRelations = AppointmentBookingRow & {
  patients?: {
    full_name?: string | null;
    contact_email?: string | null;
  } | null;
  doctors?: { name?: string | null } | null;
  contact_requests?: { email?: string | null } | null;
};

const trimOptional = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const formatReminderBookingType = (
  value: Database["public"]["Enums"]["consultation_booking_type"],
) => {
  if (value === "onsite") return "Onsite";
  if (value === "phone") return "Phone";
  return "Video";
};

const formatReminderDateTime = (
  value: string | null,
  timezone: string | null,
) => {
  if (!value) return "To be confirmed";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be confirmed";

  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return date.toUTCString();
  }
};

const getReminderEmail = (booking: AppointmentBookingWithRelations) =>
  trimOptional(booking.patients?.contact_email) ??
  trimOptional(booking.contact_requests?.email);

const getReminderLocationRows = (booking: AppointmentBookingWithRelations) => {
  if (booking.booking_type === "onsite" && booking.location) {
    return [["Location", booking.location]] as Array<[string, string]>;
  }

  if (booking.booking_type === "video" && booking.meeting_url) {
    return [["Meeting link", booking.meeting_url]] as Array<[string, string]>;
  }

  return [];
};

const buildManualReminderPreview = (
  booking: AppointmentBookingWithRelations,
) => {
  const patientName = booking.patients?.full_name?.trim() || "there";
  const subject = "Reminder: your Care N Tour consultation is coming up";
  const rows = [
    ["Reminder", "manual"],
    [
      "Time",
      formatReminderDateTime(booking.confirmed_starts_at, booking.timezone),
    ],
    booking.doctors?.name ? ["Doctor", booking.doctors.name] : null,
    ["Consultation type", formatReminderBookingType(booking.booking_type)],
    ...getReminderLocationRows(booking),
  ].filter(Boolean) as Array<[string, string]>;

  return {
    subject,
    text: [
      `Hello ${patientName},`,
      "",
      "This is your consultation reminder.",
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      "If you need to reschedule, reply to this email or contact your Care N Tour coordinator.",
      "",
      "Care N Tour Team",
    ].join("\n"),
  };
};

const toRecord = (value: Json | null | undefined): Record<string, Json> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...value }
    : {};

const appendNotificationMetadata = (
  metadata: Json | null | undefined,
  notification: Record<string, Json>,
): Json => {
  const base = toRecord(metadata);
  const notifications = toRecord(base.notifications);

  return {
    ...base,
    notifications: {
      ...notifications,
      bookingEmail: notification,
    },
  };
};

const appendActivityMetadata = (
  metadata: Json | null | undefined,
  activity: Record<string, Json>,
): Json => {
  const base = toRecord(metadata);
  const existingActivity = Array.isArray(base.activity)
    ? base.activity.filter(
        (item): item is Json =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];

  return {
    ...base,
    activity: [
      ...existingActivity,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ...activity,
      },
    ].slice(-80),
  };
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

    if (parsed.archived !== "archived") {
      await this.expireStaleHolds();
    }

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

    if (parsed.archived === "archived") {
      query = query.not("archived_at", "is", null);
    } else if (parsed.archived !== "all") {
      query = query.is("archived_at", null);
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
      metadata: appendActivityMetadata(parsed.metadata ?? {}, {
        type: "requested",
        title: "Booking requested",
        detail: "Patient selected a preferred consultation slot.",
        slotId: slot.id,
      }),
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

    await this.recordBookingActivity(data.id, {
      type: "held",
      title: "Slot held",
      detail: `Slot hold created for ${options.holdMinutes ?? 120} minutes.`,
      slotId: booking.consultation_slot_id,
    });

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

    await this.recordBookingActivity(data.id, {
      type: "confirmed",
      title: "Booking confirmed",
      detail: "Linked consultation created and slot booked.",
      slotId: booking.consultation_slot_id,
    });

    return data;
  },

  async recordBookingActivity(
    bookingId: string,
    activity: Record<string, Json>,
  ) {
    const supabase = getSupabaseAdmin();
    const booking = await this.get(bookingId);
    const metadata = appendActivityMetadata(booking.metadata, activity);

    const { error } = await supabase
      .from("appointment_bookings")
      .update({ metadata })
      .eq("id", bookingId);

    if (error) {
      console.error(
        "[appointment-bookings] failed to record activity metadata",
        error,
      );
    }
  },

  async recordNotificationStatus(
    bookingId: string,
    notification: Record<string, Json>,
  ) {
    const supabase = getSupabaseAdmin();
    const booking = await this.get(bookingId);
    const metadata = appendNotificationMetadata(booking.metadata, notification);

    const { error } = await supabase
      .from("appointment_bookings")
      .update({ metadata })
      .eq("id", bookingId);

    if (error) {
      console.error(
        "[appointment-bookings] failed to record notification metadata",
        error,
      );
    }
  },

  async sendBookingNotification(
    bookingId: string,
    type: AppointmentBookingNotificationType,
    options: { notes?: string | null } = {},
  ) {
    const booking = (await this.get(bookingId)) as Awaited<
      ReturnType<typeof this.get>
    > & {
      patients?: {
        full_name?: string | null;
        contact_email?: string | null;
      } | null;
      doctors?: { name?: string | null } | null;
      contact_requests?: { email?: string | null } | null;
    };
    const email =
      trimOptional(booking.patients?.contact_email) ??
      trimOptional(booking.contact_requests?.email);

    if (!email) {
      await this.recordNotificationStatus(booking.id, {
        type,
        status: "skipped",
        reason: "missing_email",
        attemptedAt: new Date().toISOString(),
      });
      await this.recordBookingActivity(booking.id, {
        type: "email_skipped",
        title: "Email skipped",
        detail: "No patient or request email was available.",
      });
      return;
    }

    const supabase = getSupabaseAdmin();
    const payload = {
      type,
      email,
      patientName: booking.patients?.full_name ?? null,
      doctorName: booking.doctors?.name ?? null,
      startsAt: booking.confirmed_starts_at ?? booking.requested_starts_at,
      endsAt: booking.confirmed_ends_at ?? booking.requested_ends_at,
      timezone: booking.timezone,
      bookingType: booking.booking_type,
      location: booking.location,
      meetingUrl: booking.meeting_url,
      cancellationReason: booking.cancellation_reason,
      notes: trimOptional(options.notes) ?? booking.notes,
    };

    const attemptedAt = new Date().toISOString();

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-booking-notification",
        { body: payload },
      );

      if (error) {
        throw error;
      }

      await this.recordNotificationStatus(booking.id, {
        type,
        status: "sent",
        email,
        emailId:
          data && typeof data === "object" && "emailId" in data
            ? ((data.emailId as string | null) ?? null)
            : null,
        attemptedAt,
      });
      await this.recordBookingActivity(booking.id, {
        type: "email_sent",
        title: "Email sent",
        detail: `${type} notification sent to ${email}.`,
      });
    } catch (error) {
      console.error(
        "[appointment-bookings] booking notification failed",
        error,
      );
      await this.recordNotificationStatus(booking.id, {
        type,
        status: "failed",
        email,
        error: error instanceof Error ? error.message : String(error),
        attemptedAt,
      });
      await this.recordBookingActivity(booking.id, {
        type: "email_failed",
        title: "Email failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async sendAppointmentReminder(id: unknown, payload: unknown) {
    const bookingId = z.string().uuid().parse(id);
    const parsed = reminderActionSchema.parse(payload);
    const booking = (await this.get(
      bookingId,
    )) as AppointmentBookingWithRelations;

    if (booking.status !== "confirmed" || booking.archived_at) {
      throw new ApiError(
        422,
        "Only active confirmed appointment bookings can receive reminders.",
      );
    }

    if (!booking.confirmed_starts_at) {
      throw new ApiError(
        422,
        "Appointment booking has no confirmed start time.",
      );
    }

    const confirmedStartsAt = new Date(booking.confirmed_starts_at);
    if (
      Number.isNaN(confirmedStartsAt.getTime()) ||
      confirmedStartsAt.getTime() <= Date.now()
    ) {
      throw new ApiError(
        422,
        "Appointment reminders can only be sent before the start time.",
      );
    }

    const email = getReminderEmail(booking);
    if (!email) {
      throw new ApiError(
        422,
        "No patient or request email is available for this booking.",
      );
    }

    if (parsed.dryRun) {
      const preview = buildManualReminderPreview(booking);
      return {
        reminder: {
          success: true,
          dryRun: true,
          checked: 1,
          processed: 1,
          results: [
            {
              bookingId,
              key: "manual",
              status: "dry_run",
              email,
              preview,
            },
          ],
        },
        booking,
      };
    }

    const reminderSecret = process.env.REMINDER_JOB_SECRET?.trim();
    if (!reminderSecret) {
      throw new ApiError(
        500,
        "REMINDER_JOB_SECRET is not configured on the server. Add the same reminder secret used by the Supabase cron job to your app environment.",
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } =
      await supabase.functions.invoke<AppointmentBookingReminderResult>(
        "send-appointment-reminders",
        {
          headers: {
            "x-reminder-secret": reminderSecret,
          },
          body: {
            bookingId,
            dryRun: parsed.dryRun,
            reminderKey: "manual",
          },
        },
      );

    if (error) {
      throw new ApiError(
        502,
        "Appointment reminder function failed",
        error.message,
      );
    }

    if (!data?.success) {
      throw new ApiError(
        502,
        data?.error ?? "Appointment reminder function failed",
      );
    }

    const result = data.results?.[0];
    if (!result) {
      throw new ApiError(
        502,
        "Appointment reminder function did not return a booking result. Redeploy the send-appointment-reminders Edge Function so it supports manual bookingId reminders.",
      );
    }

    if (result?.status !== "sent") {
      throw new ApiError(
        result?.status === "skipped" ? 422 : 502,
        result?.error ??
          `Appointment reminder was not sent. Status: ${result?.status ?? "unknown"}.`,
      );
    }

    return {
      reminder: data,
      booking: parsed.dryRun ? booking : await this.get(bookingId),
    };
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

      await this.recordBookingActivity(booking.id, {
        type: "rescheduled",
        title: "Slot rescheduled",
        detail: "Confirmed consultation moved to a new available slot.",
        previousSlotId: booking.consultation_slot_id,
        newSlotId: slotId,
      });

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

  async linkPatient(
    booking: Pick<AppointmentBookingRow, "id" | "contact_request_id">,
    patientId: string,
  ) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointment_bookings")
      .update({ patient_id: patientId })
      .eq("id", booking.id)
      .select(selectColumns)
      .maybeSingle();

    if (error) {
      throw mapBookingError(error);
    }

    if (!data) {
      throw new ApiError(404, "Appointment booking not found");
    }

    if (booking.contact_request_id) {
      const { error: requestError } = await supabase
        .from("contact_requests")
        .update({ patient_id: patientId })
        .eq("id", booking.contact_request_id);

      if (requestError) {
        throw mapBookingError(requestError);
      }
    }

    await this.recordBookingActivity(data.id, {
      type: "patient_linked",
      title: "Patient linked",
      detail: "Booking linked to a patient before confirmation.",
      patientId,
    });

    return data;
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

    await this.recordBookingActivity(bookingId, {
      type: "hold_released",
      title: "Slot released",
      detail: "Held slot released back to available inventory.",
      slotId: booking.consultation_slot_id,
    });

    return this.get(bookingId);
  },

  async cancel(
    id: unknown,
    payload: { notes?: string | null; cancellation_reason?: string | null },
  ) {
    const bookingId = z.string().uuid().parse(id);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("cancel_appointment_booking", {
      p_booking_id: bookingId,
      p_notes: trimOptional(payload.notes),
      p_cancellation_reason: trimOptional(payload.cancellation_reason),
    });

    if (error) {
      throw mapBookingError(error);
    }

    await this.recordBookingActivity(data.id, {
      type: "cancelled",
      title: "Booking cancelled",
      detail:
        trimOptional(payload.cancellation_reason) ??
        "Booking cancelled and linked slot released.",
    });

    return this.get(data.id);
  },

  async requestReschedule(id: unknown, notes?: string | null) {
    const bookingId = z.string().uuid().parse(id);
    const released = await this.releaseHold(bookingId, notes);

    const updated = await this.update(released.id, {
      status: "reschedule_requested",
      notes: notes ?? released.notes,
    });

    await this.recordBookingActivity(updated.id, {
      type: "needs_reschedule",
      title: "Needs reschedule",
      detail: "Booking flagged for reschedule follow-up.",
    });

    return this.get(updated.id);
  },

  async archive(id: unknown, notes?: string | null) {
    const bookingId = z.string().uuid().parse(id);
    const booking = await this.get(bookingId);

    if (
      !["cancelled", "expired", "completed", "no_show"].includes(booking.status)
    ) {
      throw new ApiError(
        422,
        "Only closed appointment bookings can be archived.",
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointment_bookings")
      .update({
        archived_at: new Date().toISOString(),
        archive_note: trimOptional(notes),
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

    await this.recordBookingActivity(data.id, {
      type: "archived",
      title: "Record archived",
      detail: trimOptional(notes) ?? "Closed booking hidden from active queue.",
    });

    return this.get(data.id);
  },

  async performAction(id: unknown, payload: unknown) {
    const parsed = bookingActionSchema.parse(payload);
    const booking = await this.get(id);
    let result: AppointmentBookingRow | null = null;
    let notificationType: AppointmentBookingNotificationType | null = null;

    switch (parsed.action) {
      case "confirm":
        result = await this.confirm(
          parsed.patient_id && parsed.patient_id !== booking.patient_id
            ? await this.linkPatient(booking, parsed.patient_id)
            : booking,
          { notes: parsed.notes },
        );
        notificationType = "confirmed";
        break;
      case "release":
        result = await this.releaseHold(booking.id, parsed.notes);
        break;
      case "cancel":
        result = await this.cancel(booking.id, {
          notes: parsed.notes,
          cancellation_reason: parsed.cancellation_reason,
        });
        notificationType = "cancelled";
        break;
      case "request_reschedule":
        result = await this.requestReschedule(booking.id, parsed.notes);
        break;
      case "assign_slot":
        result = await this.assignSlot(booking, {
          slotId: parsed.slot_id,
          notes: parsed.notes,
        });
        if (booking.patient_consultation_id) {
          notificationType = "rescheduled";
        }
        break;
      case "archive":
        result = await this.archive(booking.id, parsed.notes);
        break;
    }

    if (result && notificationType) {
      await this.sendBookingNotification(result.id, notificationType, {
        notes: parsed.notes,
      });
      return this.get(result.id);
    }

    return result;
  },
};
