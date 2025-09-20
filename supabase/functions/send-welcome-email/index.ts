import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Care N Tour <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Care N Tour - Account Created Successfully!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Welcome to Care N Tour!</h1>
            <p style="color: #64748b; font-size: 16px;">Your trusted partner in medical tourism</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2563eb;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Account Created Successfully!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hello ${username ? username : 'there'},
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Your Care N Tour account has been created successfully! You can now access our platform to explore world-class medical treatments and personalized care services.
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #1e293b; font-size: 18px;">What's Next?</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li>Browse our featured treatments and partner hospitals</li>
              <li>Schedule a consultation with our medical coordinators</li>
              <li>Get personalized treatment recommendations</li>
              <li>Plan your medical journey with our concierge services</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0;">
              📞 Need assistance? Our team is here to help 24/7
            </p>
            <p style="color: #3730a3; margin: 5px 0 0 0;">
              Emergency Hotline: +20 100 1741666
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #1e293b;">The Care N Tour Team</strong>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">
              Email: info@carentour.com | Website: www.carentour.com
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);