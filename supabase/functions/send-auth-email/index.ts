import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@2.0.0';
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// HTML template function
function createConfirmationEmailHTML(params) {
  const confirmationUrl = `${params.supabase_url}/auth/v1/verify?token=${params.token_hash}&type=${params.email_action_type}&redirect_to=${params.redirect_to}`;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm your Care N Tour account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e40af; font-size: 24px; font-weight: bold; margin: 40px 0 20px 0; text-align: center;">
            Welcome to Care N Tour!
          </h1>
          
          <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0;">
            Thank you for signing up for Care N Tour, your trusted partner in medical tourism. 
            To complete your registration, please confirm your email address.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Confirm Your Email Address
            </a>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0;">
            Or, copy and paste this confirmation code:
          </p>
          
          <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 16px 0;">
            <code style="color: #374151; font-size: 18px; font-weight: bold; letter-spacing: 2px; font-family: monospace;">
              ${params.token}
            </code>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0;">
            Once confirmed, you'll be able to:
          </p>
          
          <ul style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Access your personalized dashboard</li>
            <li style="margin-bottom: 8px;">Schedule consultations with top medical experts</li>
            <li style="margin-bottom: 8px;">Plan your medical journey to Egypt</li>
            <li style="margin-bottom: 8px;">Connect with our 24/7 support team</li>
          </ul>
          
          <p style="color: #64748b; font-size: 16px; line-height: 24px; margin: 24px 0 16px 0;">
            If you didn't create an account with Care N Tour, you can safely ignore this email.
          </p>
          
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #64748b; font-size: 14px; line-height: 20px;">
            <strong>Care N Tour Team</strong><br>
            <span>Your Trusted Partner in Medical Tourism</span><br>
            24/7 Emergency Hotline: +20 100 1741666<br>
            Email: info@carentour.com
          </div>
        </div>
      </body>
    </html>
  `;
}
const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    console.log('Received auth webhook:', {
      headers: Object.keys(headers)
    });
    const wh = new Webhook(hookSecret);
    const { user, email_data: { token, token_hash, redirect_to, email_action_type } } = wh.verify(payload, headers);
    console.log('Processing auth email:', {
      email: user.email,
      action_type: email_action_type
    });
    // Only handle signup confirmations
    if (email_action_type !== 'signup') {
      console.log('Ignoring non-signup email type:', email_action_type);
      return new Response(JSON.stringify({
        message: 'Email type not handled'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    // Generate the HTML email
    const html = createConfirmationEmailHTML({
      supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
      token,
      token_hash,
      redirect_to,
      email_action_type,
      user_email: user.email
    });
    console.log('Sending confirmation email to:', user.email);
    const { data, error } = await resend.emails.send({
      from: 'Care N Tour <info@carentour.com>',
      to: [
        user.email
      ],
      subject: 'Confirm your Care N Tour Account',
      html
    });
    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }
    console.log('Email sent successfully:', data?.id);
    return new Response(JSON.stringify({
      success: true,
      email_id: data?.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in send-auth-email function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};
serve(handler);
