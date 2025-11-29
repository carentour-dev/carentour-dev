import { serve } from "std/http/server";
import { Resend } from "resend";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const handler = async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    const { email, username, password } = await req.json();
    // Email validation
    if (typeof email !== "string" || !email.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid email address.",
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }
    const trimmedPassword = typeof password === "string" ? password.trim() : "";
    console.log("Password provided:", trimmedPassword.length > 0);
    console.log("Sending welcome email to:", email);
    const passwordText = trimmedPassword
      ? `
Temporary password: ${trimmedPassword}

Please change this password after your first login.
`
      : "";
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #60a5fa; font-size: 30px; margin-bottom: 10px;">Welcome to Care N Tour!</h1>
          <p style="color: #cbd5f5; font-size: 16px;">Your trusted partner in medical tourism</p>
        </div>
        <div style="background-color: #1f2937; padding: 26px; border-radius: 16px; margin: 25px 0;">
          <h2 style="color: #f8fafc; margin-top: 0; font-size: 20px;">Account Created Successfully!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            Hello ${username ? username : "there"},
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Your Care N Tour account has been created successfully! You can now access our platform to explore world-class medical treatments and personalized care services.
          </p>
        </div>
        ${
          trimmedPassword
            ? `
        <div style="background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 28px; border-radius: 16px; margin: 32px 0; box-shadow: 0 20px 45px rgba(14, 116, 144, 0.35);">
          <h2 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 22px;">Your Portal Credentials</h2>
          <p style="color: #e2e8f0; line-height: 1.6; margin: 0 0 18px 0;">
            Use the temporary password below to access your patient portal and start planning your journey.
          </p>
          <div style="background-color: rgba(15, 23, 42, 0.9); color: #bbf7d0; padding: 14px 22px; border-radius: 12px; font-size: 19px; letter-spacing: 0.04em; text-align: center; font-weight: 600; font-family: 'Courier New', Courier, monospace;">
            ${trimmedPassword}
          </div>
          <p style="color: #f8fafc; margin: 20px 0 0 0;">
            We recommend changing this password after your first login. You can explore our services any time at <a href="https://www.carentour.com" style="color: #bfdbfe; font-weight: 600;">www.carentour.com</a>.
          </p>
        </div>
        `
            : ""
        }
        <div style="margin: 30px 0;">
          <h3 style="color: #f8fafc; font-size: 18px;">What's Next?</h3>
          <ul style="color: #cbd5f5; line-height: 1.8; padding-left: 20px;">
            <li>Browse our featured treatments and partner hospitals</li>
            <li>Schedule a consultation with our medical coordinators</li>
            <li>Get personalized treatment recommendations</li>
            <li>Plan your medical journey with our concierge services</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #1e3a8a; border-radius: 12px;">
          <p style="color: #bfdbfe; font-weight: 600; margin: 0;">
            📞 Need assistance? Our team is here to help 24/7
          </p>
          <p style="color: #cbd5f5; margin: 5px 0 0 0;">
            Emergency Hotline: +20 122 9503333
          </p>
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #f8fafc;">The Care N Tour Team</strong>
          </p>
          <p style="color: #64748b; font-size: 12px; margin-top: 15px;">
            Email: <a href="mailto:info@carentour.com" style="color: #93c5fd;">info@carentour.com</a> | Website: <a href="https://www.carentour.com" style="color: #93c5fd;">www.carentour.com</a>
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Care N Tour <info@carentour.com>",
      to: email,
      subject: trimmedPassword
        ? "Welcome to Care N Tour – Your Portal Password Inside"
        : "Welcome to Care N Tour - Account Created Successfully!",
      html: htmlBody,
      text: `Welcome to Care N Tour, ${username || "there"}!

Your account has been created successfully.${passwordText}
Need assistance? Our team is available 24/7.

Care N Tour Team
info@carentour.com`,
    });
    console.log("Welcome email sent successfully:", emailResponse);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
        emailId: emailResponse.data?.id,
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
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
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
