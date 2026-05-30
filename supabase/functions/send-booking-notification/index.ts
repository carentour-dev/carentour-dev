import { serve } from "std/http/server";
import { Resend } from "resend";

type NotificationType = "confirmed" | "rescheduled" | "cancelled";

type BookingNotificationPayload = {
  type: NotificationType;
  email: string;
  patientName?: string | null;
  doctorName?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  bookingType?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
};

const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fromAddress =
  Deno.env.get("BOOKING_NOTIFICATION_FROM")?.trim() ||
  "Care N Tour <contact@carentour.com>";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function formatBookingType(value?: string | null) {
  if (value === "onsite") return "Onsite";
  if (value === "phone") return "Phone";
  return "Video";
}

function getSubject(type: NotificationType) {
  if (type === "cancelled")
    return "Your Care N Tour consultation was cancelled";
  if (type === "rescheduled") {
    return "Your Care N Tour consultation was rescheduled";
  }
  return "Your Care N Tour consultation is confirmed";
}

function getIntro(type: NotificationType) {
  if (type === "cancelled") {
    return "Your consultation booking has been cancelled.";
  }
  if (type === "rescheduled") {
    return "Your consultation has been moved to a new time.";
  }
  return "Your consultation booking is confirmed.";
}

function buildEmail(payload: BookingNotificationPayload) {
  const patientName = payload.patientName?.trim() || "there";
  const appointmentTime = formatDateTime(payload.startsAt, payload.timezone);
  const bookingType = formatBookingType(payload.bookingType);
  const showSchedule = payload.type !== "cancelled";
  const detailRows = [
    showSchedule ? ["Time", appointmentTime] : null,
    showSchedule && payload.doctorName ? ["Doctor", payload.doctorName] : null,
    showSchedule ? ["Consultation type", bookingType] : null,
    showSchedule && payload.location ? ["Location", payload.location] : null,
    showSchedule && payload.meetingUrl
      ? ["Meeting link", payload.meetingUrl]
      : null,
    payload.type === "cancelled" && payload.cancellationReason
      ? ["Reason", payload.cancellationReason]
      : null,
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
        <h1 style="margin: 0; color: #0f172a; font-size: 28px;">${escapeHtml(getSubject(payload.type))}</h1>
        <p style="margin: 8px 0 0; color: #64748b;">Care N Tour medical coordination</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Hello ${escapeHtml(patientName)},</p>
      <p style="font-size: 16px; line-height: 1.6;">${escapeHtml(getIntro(payload.type))}</p>

      ${
        detailRows.length > 0
          ? `
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f8fafc; border-radius: 14px; padding: 18px; display: block;">
          <tbody>${detailsHtml}</tbody>
        </table>
      `
          : ""
      }

      ${
        payload.notes
          ? `<p style="font-size: 15px; line-height: 1.6; color: #334155;"><strong>Coordinator note:</strong> ${escapeHtml(payload.notes)}</p>`
          : ""
      }

      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        If you have any questions, reply to this email or contact your Care N Tour coordinator.
      </p>

      <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">Care N Tour Team</p>
        <p style="margin: 6px 0 0;">info@carentour.com · www.carentour.com</p>
      </div>
    </div>
  `;

  const textLines = [
    `Hello ${patientName},`,
    "",
    getIntro(payload.type),
    "",
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    payload.notes ? `Coordinator note: ${payload.notes}` : "",
    "",
    "If you have any questions, reply to this email or contact your Care N Tour coordinator.",
    "",
    "Care N Tour Team",
  ].filter((line) => line !== null);

  return { html, text: textLines.join("\n") };
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

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    if (!resend) {
      return jsonResponse(
        {
          success: false,
          error:
            "Email service is not configured. Add RESEND_API_KEY via Supabase secrets.",
        },
        500,
      );
    }

    const payload = (await req.json()) as BookingNotificationPayload;

    if (!["confirmed", "rescheduled", "cancelled"].includes(payload.type)) {
      return jsonResponse(
        { success: false, error: "Invalid notification type" },
        400,
      );
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return jsonResponse(
        { success: false, error: "Invalid email address" },
        400,
      );
    }

    const { html, text } = buildEmail(payload);
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [payload.email],
      subject: getSubject(payload.type),
      html,
      text,
    });

    if (error) {
      console.error("Booking notification email failed:", error);
      return jsonResponse({ success: false, error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      emailId: data?.id ?? null,
    });
  } catch (error) {
    console.error("Error in send-booking-notification function:", error);
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
