import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@4.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  email: string;
  source?: string;
  preferences?: Record<string, any>;
}

interface UnsubscribeRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'subscribe';

  try {
    if (action === 'subscribe') {
      return await handleSubscription(req);
    } else if (action === 'unsubscribe') {
      return await handleUnsubscribe(req);
    } else if (action === 'confirm') {
      return await handleConfirmation(req);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in newsletter-subscription function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function handleSubscription(req: Request): Promise<Response> {
  const { email, source = 'footer', preferences = {} }: SubscriptionRequest = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get client IP and user agent
  const forwardedFor = req.headers.get('x-forwarded-for');
  let clientIP = 'unknown';
  
  if (forwardedFor) {
    // Handle comma-separated IP addresses (x-forwarded-for can contain multiple IPs)
    const firstIP = forwardedFor.split(',')[0].trim();
    // Basic IP validation (IPv4 or IPv6)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(firstIP) || /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/.test(firstIP)) {
      clientIP = firstIP;
    }
  }
  
  const userAgent = req.headers.get('user-agent') || '';

  // Check if email already exists
  const { data: existing } = await supabase
    .from('newsletter_subscriptions')
    .select('id, status')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    if (existing.status === 'active') {
      return new Response(
        JSON.stringify({ message: 'Already subscribed', subscriptionId: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Reactivate subscription
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ 
          status: 'pending',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          subscription_source: source,
          preferences,
          ip_address: clientIP,
          user_agent: userAgent
        })
        .eq('id', existing.id);

      if (error) throw error;
    }
  } else {
    // Create new subscription
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase(),
        subscription_source: source,
        preferences,
        ip_address: clientIP,
        user_agent: userAgent
      });

    if (error) throw error;
  }

  // Send confirmation email
  await sendConfirmationEmail(email, source);

  return new Response(
    JSON.stringify({ message: 'Subscription confirmation sent to your email' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleUnsubscribe(req: Request): Promise<Response> {
  const { token }: UnsubscribeRequest = await req.json();

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unsubscribe token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .update({ 
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString()
    })
    .eq('unsubscribe_token', token)
    .select('email')
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid unsubscribe token' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ message: 'Successfully unsubscribed', email: data.email }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleConfirmation(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Confirmation token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .update({ 
      status: 'active',
      confirmed_at: new Date().toISOString()
    })
    .eq('unsubscribe_token', token)
    .eq('status', 'pending')
    .select('email')
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired confirmation token' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Send welcome email
  await sendWelcomeEmail(data.email);

  return new Response(
    JSON.stringify({ message: 'Email confirmed successfully!', email: data.email }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function sendConfirmationEmail(email: string, source: string): Promise<void> {
  // Get the subscription token for confirmation link
  const { data } = await supabase
    .from('newsletter_subscriptions')
    .select('unsubscribe_token')
    .eq('email', email.toLowerCase())
    .single();

  if (!data) return;

  const confirmationUrl = `${supabaseUrl}/functions/v1/newsletter-subscription?action=confirm&token=${data.unsubscribe_token}`;

  await resend.emails.send({
    from: 'Care N Tour <newsletter@carentour.com>',
    to: [email],
    subject: 'Please confirm your newsletter subscription',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Care N Tour!</h1>
        <p>Thank you for subscribing to our newsletter. To complete your subscription, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Confirm Subscription
          </a>
        </div>
        <p>You'll receive updates about:</p>
        <ul>
          <li>Latest medical treatments and procedures</li>
          <li>Travel tips for medical tourism</li>
          <li>Success stories from our patients</li>
          <li>Special offers and promotions</li>
        </ul>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you didn't request this subscription, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

async function sendWelcomeEmail(email: string): Promise<void> {
  await resend.emails.send({
    from: 'Care N Tour <newsletter@carentour.com>',
    to: [email],
    subject: 'Welcome to Care N Tour Newsletter!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Care N Tour!</h1>
        <p>Your subscription has been confirmed! We're excited to have you join our community.</p>
        <p>You'll now receive our newsletter with:</p>
        <ul>
          <li>🏥 Expert insights on medical treatments</li>
          <li>✈️ Travel guides for medical tourism</li>
          <li>📖 Patient success stories</li>
          <li>💰 Exclusive offers and promotions</li>
        </ul>
        <p>Stay tuned for our next newsletter!</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Best regards,<br>
          The Care N Tour Team
        </p>
      </div>
    `,
  });
}

serve(handler);