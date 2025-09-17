import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  treatment?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, phone, country, treatment, message }: ContactEmailRequest = await req.json();

    console.log("Processing contact form submission:", { firstName, lastName, email });

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: "CarenTour Medical Tourism <onboarding@resend.dev>",
      to: ["me@myassin.net"], // Using verified email for testing
      subject: "Thank you for contacting CarenTour",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Thank you for contacting us!</h1>
          <p>Dear ${firstName} ${lastName},</p>
          <p>We have received your message and will get back to you within 2 hours.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your message details:</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${country ? `<p><strong>Country:</strong> ${country}</p>` : ''}
            ${treatment ? `<p><strong>Treatment of Interest:</strong> ${treatment}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px;">${message}</p>
          </div>
          
          <p>Our medical coordinators will review your inquiry and contact you soon with personalized information about your treatment options.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The CarenTour Team</strong><br>
            <span style="color: #64748b;">Your trusted partner in medical tourism</span>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
            <p>For urgent matters, contact our 24/7 emergency hotline: +20 100 1741666</p>
            <p>Email: info@carentour.com | Website: www.carentour.com</p>
          </div>
        </div>
      `,
    });

    // Send notification email to the business
    const businessEmailResponse = await resend.emails.send({
      from: "CarenTour Contact Form <onboarding@resend.dev>",
      to: ["info@carentour.com"], // Replace with actual business email
      subject: `New Contact Form Submission - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">New Contact Form Submission</h1>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Contact Details:</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${country ? `<p><strong>Country:</strong> ${country}</p>` : ''}
            ${treatment ? `<p><strong>Treatment of Interest:</strong> ${treatment}</p>` : ''}
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="background-color: white; padding: 15px; border-radius: 4px; white-space: pre-line;">${message}</p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚠️ Please respond within 2 hours as promised to the customer.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("User email sent successfully:", userEmailResponse);
    console.log("Business email sent successfully:", businessEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Emails sent successfully",
      userEmailId: userEmailResponse.data?.id,
      businessEmailId: businessEmailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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