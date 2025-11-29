import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fallbackFromAddress = "Care N Tour Team <admin@carentour.com>";
const resendFromAddress =
  Deno.env.get("RESEND_STAFF_INVITE_FROM")?.trim() ||
  Deno.env.get("RESEND_FROM_ADDRESS")?.trim() ||
  fallbackFromAddress;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StaffInviteParams {
  inviteUrl: string;
  inviterName: string;
  staffName?: string;
  roles: string[];
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    if (message && typeof message === "object") {
      const nestedMessage = (message as { message?: unknown }).message;
      if (
        typeof nestedMessage === "string" &&
        nestedMessage.trim().length > 0
      ) {
        return nestedMessage;
      }
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown error occurred";
}

function createStaffInviteHTML(params: StaffInviteParams): string {
  const rolesFormatted = params.roles
    .map((role) => role.replace(/[-_]/g, " "))
    .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
    .join(", ");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've been invited to Care N Tour Staff</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #60a5fa; font-size: 30px; font-weight: bold; margin-bottom: 10px; margin-top: 0;">Welcome to Care N Tour Staff!</h1>
            <p style="color: #cbd5f5; font-size: 16px; margin: 0;">You've been invited to join the team</p>
          </div>

          <div style="background-color: #1f2937; padding: 26px; border-radius: 16px; margin: 25px 0;">
            <h2 style="color: #f8fafc; margin-top: 0; font-size: 20px;">Staff Account Invitation</h2>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 16px 0;">
              Hello${params.staffName ? ` ${params.staffName}` : ""},
            </p>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 16px 0;">
              <strong>${params.inviterName}</strong> has invited you to join Care N Tour as a staff member.
            </p>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 16px 0;">
              <strong style="color: #f8fafc;">Your assigned roles:</strong> ${rolesFormatted}
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${params.inviteUrl}"
               style="background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 10px 25px rgba(29, 78, 216, 0.3);">
              Accept Invitation &amp; Set Password
            </a>
          </div>

          <div style="background-color: #1f2937; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #f8fafc; font-size: 18px; margin-top: 0; margin-bottom: 16px;">What happens next?</h3>
            <ol style="color: #cbd5f5; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Click the button above to activate your account</li>
              <li style="margin-bottom: 8px;">Set a secure password for your staff account</li>
              <li style="margin-bottom: 8px;">Access the Care N Tour admin console</li>
              <li style="margin-bottom: 0;">Start managing patients and medical tourism operations</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 30px; margin-bottom: 0;">
            <strong>Important:</strong> This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px; line-height: 20px; margin: 0 0 8px 0;">
              <strong style="color: #f8fafc;">The Care N Tour Team</strong><br>
              Your Trusted Partner in Medical Tourism
            </p>
            <p style="color: #64748b; font-size: 13px; line-height: 18px; margin: 0;">
              24/7 Emergency Hotline: +20 122 9503333<br>
              Email: <a href="mailto:info@carentour.com" style="color: #93c5fd; text-decoration: none;">info@carentour.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", success: false }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  try {
    const { email, inviteUrl, inviterName, staffName, roles } =
      await req.json();

    // Validate required parameters
    if (!email || typeof email !== "string") {
      throw new Error("Missing or invalid email parameter");
    }

    if (!inviteUrl || typeof inviteUrl !== "string") {
      throw new Error("Missing or invalid inviteUrl parameter");
    }

    if (!inviterName || typeof inviterName !== "string") {
      throw new Error("Missing or invalid inviterName parameter");
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error("Missing or invalid roles parameter");
    }

    console.log("Sending staff invite email to:", email);
    console.log("Roles:", roles.join(", "));

    const html = createStaffInviteHTML({
      inviteUrl,
      inviterName,
      staffName: staffName || email.split("@")[0],
      roles,
    });

    if (!resend) {
      console.error(
        "RESEND_API_KEY is not configured for the send-staff-invite function.",
      );

      return new Response(
        JSON.stringify({
          error:
            "Email service is not configured. Add RESEND_API_KEY via Supabase secrets.",
          success: false,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const { data, error } = await resend.emails.send({
      from: resendFromAddress,
      to: [email],
      subject: "You've been invited to Care N Tour Staff",
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Staff invite email sent successfully:", data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: data?.id,
        message: "Staff invitation email sent successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("Error in send-staff-invite function:", error);

    const errorMessage = extractErrorMessage(error);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
};

serve(handler);
