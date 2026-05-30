import { serve } from "std/http/server";
import { createClient } from "supabase-js";
import { Resend } from "resend";

type ReminderKey = "twentyFourHour" | "twoHour" | "manual";

type ReminderRecord = {
  status?: string;
  attemptedAt?: string;
  email?: string;
  emailId?: string | null;
  error?: string;
};

type BookingRecord = {
  id: string;
  status: string;
  booking_type: string;
  confirmed_starts_at: string | null;
  confirmed_ends_at: string | null;
  requested_starts_at: string | null;
  requested_ends_at: string | null;
  timezone: string | null;
  location: string | null;
  meeting_url: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  archived_at?: string | null;
  patients?: {
    full_name?: string | null;
    contact_email?: string | null;
  } | null;
  doctors?: {
    name?: string | null;
  } | null;
  contact_requests?: {
    email?: string | null;
  } | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
const supabaseServiceKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || getDefaultSecretKey();
const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
const reminderSecret = Deno.env.get("REMINDER_JOB_SECRET")?.trim();
const fromAddress =
  Deno.env.get("REMINDER_NOTIFICATION_FROM")?.trim() ||
  Deno.env.get("BOOKING_NOTIFICATION_FROM")?.trim() ||
  "Care N Tour <contact@carentour.com>";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-reminder-secret",
};

function getDefaultSecretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function getReminderRecord(
  metadata: Record<string, unknown> | null,
  key: ReminderKey,
) {
  const reminders = toRecord(metadata?.reminders);
  return toRecord(reminders[key]) as ReminderRecord;
}

function hasAttemptedReminder(
  metadata: Record<string, unknown> | null,
  key: ReminderKey,
) {
  const reminder = getReminderRecord(metadata, key);
  return (
    reminder.status === "sent" ||
    reminder.status === "failed" ||
    reminder.status === "skipped"
  );
}

function setReminderMetadata(
  metadata: Record<string, unknown> | null,
  key: ReminderKey,
  reminder: ReminderRecord,
) {
  const base = toRecord(metadata);
  const reminders = toRecord(base.reminders);

  return {
    ...base,
    reminders: {
      ...reminders,
      [key]: reminder,
    },
  };
}

function appendReminderEvent(
  metadata: Record<string, unknown> | null,
  key: ReminderKey,
  reminder: ReminderRecord,
) {
  const base = toRecord(metadata);
  const existingEvents = Array.isArray(base.reminderEvents)
    ? base.reminderEvents.filter(
        (item) =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];

  return {
    ...base,
    reminderEvents: [
      ...existingEvents,
      {
        id: crypto.randomUUID(),
        key,
        ...reminder,
      },
    ].slice(-50),
  };
}

function appendActivity(
  metadata: Record<string, unknown> | null,
  activity: Record<string, unknown>,
) {
  const base = toRecord(metadata);
  const existingActivity = Array.isArray(base.activity)
    ? base.activity.filter(
        (item) =>
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
}

function updateReminderAndActivity(
  metadata: Record<string, unknown> | null,
  key: ReminderKey,
  reminder: ReminderRecord,
  activity: Record<string, unknown>,
) {
  const withReminder = setReminderMetadata(metadata, key, reminder);
  const withReminderEvent = appendReminderEvent(withReminder, key, reminder);
  return appendActivity(withReminderEvent, activity);
}

function getDueReminderKey(
  booking: BookingRecord,
  now: Date,
): ReminderKey | null {
  if (booking.status !== "confirmed" || booking.archived_at) return null;
  if (!booking.confirmed_starts_at) return null;

  const startsAt = new Date(booking.confirmed_starts_at);
  if (Number.isNaN(startsAt.getTime())) return null;

  const msUntil = startsAt.getTime() - now.getTime();
  if (msUntil <= 0) return null;

  const twoHoursMs = 2 * 60 * 60 * 1000;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  if (
    msUntil <= twoHoursMs &&
    !hasAttemptedReminder(booking.metadata, "twoHour")
  ) {
    return "twoHour";
  }

  if (
    msUntil > twoHoursMs &&
    msUntil <= twentyFourHoursMs &&
    !hasAttemptedReminder(booking.metadata, "twentyFourHour")
  ) {
    return "twentyFourHour";
  }

  return null;
}

function getManualReminderKey(
  booking: BookingRecord,
  now: Date,
  requestedKey?: unknown,
): ReminderKey {
  if (
    requestedKey === "twentyFourHour" ||
    requestedKey === "twoHour" ||
    requestedKey === "manual"
  ) {
    return requestedKey;
  }

  if (!booking.confirmed_starts_at) return "manual";

  const startsAt = new Date(booking.confirmed_starts_at);
  if (Number.isNaN(startsAt.getTime())) return "manual";

  const msUntil = startsAt.getTime() - now.getTime();
  if (msUntil <= 0) return "manual";

  return msUntil <= 2 * 60 * 60 * 1000 ? "twoHour" : "twentyFourHour";
}

function formatReminderName(key: ReminderKey) {
  if (key === "twoHour") return "2-hour";
  if (key === "twentyFourHour") return "24-hour";
  return "consultation";
}

function formatBookingType(value?: string | null) {
  if (value === "onsite") return "Onsite";
  if (value === "phone") return "Phone";
  return "Video";
}

function formatDateTime(value?: string | null, timezone?: string | null) {
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
}

function getEmail(booking: BookingRecord) {
  const patientEmail = booking.patients?.contact_email?.trim();
  if (patientEmail) return patientEmail;
  return booking.contact_requests?.email?.trim() || null;
}

function getReminderLocationRows(booking: BookingRecord) {
  if (booking.booking_type === "onsite" && booking.location) {
    return [["Location", booking.location]] as Array<[string, string]>;
  }

  if (booking.booking_type === "video" && booking.meeting_url) {
    return [["Meeting link", booking.meeting_url]] as Array<[string, string]>;
  }

  return [];
}

function buildEmail(booking: BookingRecord, key: ReminderKey) {
  const patientName = booking.patients?.full_name?.trim() || "there";
  const reminderName = formatReminderName(key);
  const appointmentTime = formatDateTime(
    booking.confirmed_starts_at,
    booking.timezone,
  );
  const subject = `Reminder: your Care N Tour consultation is coming up`;
  const detailRows = [
    ["Reminder", reminderName],
    ["Time", appointmentTime],
    booking.doctors?.name ? ["Doctor", booking.doctors.name] : null,
    ["Consultation type", formatBookingType(booking.booking_type)],
    ...getReminderLocationRows(booking),
  ].filter(Boolean) as Array<[string, string]>;

  const detailsHtml = detailRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 0; color: #64748b; width: 150px;">${escapeHtml(label)}</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #0f172a;">
      <div style="margin-bottom: 24px;">
        <h1 style="margin: 0; color: #0f172a; font-size: 28px;">${escapeHtml(subject)}</h1>
        <p style="margin: 8px 0 0; color: #64748b;">Care N Tour medical coordination</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Hello ${escapeHtml(patientName)},</p>
      <p style="font-size: 16px; line-height: 1.6;">This is your consultation reminder.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f8fafc; border-radius: 14px; padding: 18px; display: block;">
        <tbody>${detailsHtml}</tbody>
      </table>

      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        If you need to reschedule, reply to this email or contact your Care N Tour coordinator.
      </p>

      <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">Care N Tour Team</p>
        <p style="margin: 6px 0 0;">info@carentour.com · www.carentour.com</p>
      </div>
    </div>
  `;

  const text = [
    `Hello ${patientName},`,
    "",
    "This is your consultation reminder.",
    "",
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "If you need to reschedule, reply to this email or contact your Care N Tour coordinator.",
    "",
    "Care N Tour Team",
  ].join("\n");

  return { subject, html, text };
}

async function updateBookingMetadata(
  booking: BookingRecord,
  metadata: Record<string, unknown>,
) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { error } = await supabase
    .from("appointment_bookings")
    .update({ metadata })
    .eq("id", booking.id);

  if (error) throw error;
}

async function processReminder(
  booking: BookingRecord,
  key: ReminderKey,
  dryRun: boolean,
) {
  const email = getEmail(booking);
  const attemptedAt = new Date().toISOString();
  const reminderName = formatReminderName(key);

  if (!email) {
    const metadata = updateReminderAndActivity(
      booking.metadata,
      key,
      {
        status: "skipped",
        attemptedAt,
        error: "missing_email",
      },
      {
        type: "reminder_skipped",
        title: "Reminder skipped",
        detail: `${reminderName} reminder skipped because no email is available.`,
      },
    );

    if (!dryRun) await updateBookingMetadata(booking, metadata);

    return { bookingId: booking.id, key, status: "skipped" };
  }

  if (dryRun) {
    const { subject, text } = buildEmail(booking, key);
    return {
      bookingId: booking.id,
      key,
      status: "dry_run",
      email,
      preview: { subject, text },
    };
  }

  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { subject, html, text } = buildEmail(booking, key);
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [email],
    subject,
    html,
    text,
  });

  if (error) {
    const metadata = updateReminderAndActivity(
      booking.metadata,
      key,
      {
        status: "failed",
        attemptedAt,
        email,
        error: error.message,
      },
      {
        type: "reminder_failed",
        title: "Reminder failed",
        detail: error.message,
      },
    );
    await updateBookingMetadata(booking, metadata);
    return {
      bookingId: booking.id,
      key,
      status: "failed",
      email,
      error: error.message,
    };
  }

  const metadata = updateReminderAndActivity(
    booking.metadata,
    key,
    {
      status: "sent",
      attemptedAt,
      email,
      emailId: data?.id ?? null,
    },
    {
      type: "reminder_sent",
      title: "Reminder sent",
      detail: `${reminderName} reminder sent to ${email}.`,
    },
  );
  await updateBookingMetadata(booking, metadata);

  return {
    bookingId: booking.id,
    key,
    status: "sent",
    email,
    emailId: data?.id ?? null,
  };
}

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  if (reminderSecret) {
    const providedSecret = req.headers.get("x-reminder-secret")?.trim();
    const authorization = req.headers.get("authorization")?.trim();
    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : null;
    const hasServiceRoleToken =
      Boolean(supabaseServiceKey) && bearerToken === supabaseServiceKey;

    if (providedSecret !== reminderSecret && !hasServiceRoleToken) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }
  }

  if (!supabase) {
    return jsonResponse(
      { success: false, error: "Supabase client is not configured." },
      500,
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const bookingId =
      typeof body?.bookingId === "string" ? body.bookingId.trim() : null;
    const now = body?.now ? new Date(String(body.now)) : new Date();

    if (Number.isNaN(now.getTime())) {
      return jsonResponse({ success: false, error: "Invalid now value" }, 400);
    }

    const lookAheadHours =
      typeof body?.lookAheadHours === "number"
        ? Math.min(Math.max(body.lookAheadHours, 2), 48)
        : 24;
    const to = new Date(now.getTime() + lookAheadHours * 60 * 60 * 1000);

    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from("appointment_bookings")
        .select(
          `
            id,
            status,
            booking_type,
            confirmed_starts_at,
            confirmed_ends_at,
            requested_starts_at,
            requested_ends_at,
            timezone,
            location,
            meeting_url,
            notes,
            metadata,
            archived_at,
            patients(full_name, contact_email),
            doctors(name),
            contact_requests(email)
          `,
        )
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError) throw bookingError;

      if (!booking) {
        return jsonResponse(
          { success: false, error: "Appointment booking not found." },
          404,
        );
      }

      const typedBooking = booking as BookingRecord;
      if (
        typedBooking.status !== "confirmed" ||
        typedBooking.archived_at ||
        !typedBooking.confirmed_starts_at
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Only active confirmed appointment bookings can receive reminders.",
          },
          422,
        );
      }

      const startsAt = new Date(typedBooking.confirmed_starts_at);
      if (
        Number.isNaN(startsAt.getTime()) ||
        startsAt.getTime() <= now.getTime()
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Appointment reminders can only be sent before the start time.",
          },
          422,
        );
      }

      const key = getManualReminderKey(typedBooking, now, body?.reminderKey);
      const result = await processReminder(typedBooking, key, dryRun);

      return jsonResponse({
        success: true,
        dryRun,
        checked: 1,
        processed: 1,
        results: [result],
      });
    }

    const { data, error } = await supabase
      .from("appointment_bookings")
      .select(
        `
          id,
          status,
          booking_type,
          confirmed_starts_at,
          confirmed_ends_at,
          requested_starts_at,
          requested_ends_at,
          timezone,
          location,
          meeting_url,
          notes,
          metadata,
          archived_at,
          patients(full_name, contact_email),
          doctors(name),
          contact_requests(email)
        `,
      )
      .eq("status", "confirmed")
      .is("archived_at", null)
      .not("confirmed_starts_at", "is", null)
      .gte("confirmed_starts_at", now.toISOString())
      .lte("confirmed_starts_at", to.toISOString())
      .order("confirmed_starts_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    const results = [];
    for (const booking of (data ?? []) as BookingRecord[]) {
      const key = getDueReminderKey(booking, now);
      if (!key) continue;
      results.push(await processReminder(booking, key, dryRun));
    }

    return jsonResponse({
      success: true,
      dryRun,
      checked: data?.length ?? 0,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in send-appointment-reminders function:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
};

serve(handler);
