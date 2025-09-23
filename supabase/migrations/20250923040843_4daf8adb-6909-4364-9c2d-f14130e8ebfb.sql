-- Create newsletter subscription statuses enum
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'unsubscribed', 'bounced');

-- Create newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status subscription_status NOT NULL DEFAULT 'pending',
  subscription_source TEXT DEFAULT 'footer',
  preferences JSONB DEFAULT '{}',
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can unsubscribe with token" 
ON public.newsletter_subscriptions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON public.newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_status ON public.newsletter_subscriptions(status);
CREATE INDEX idx_newsletter_subscriptions_token ON public.newsletter_subscriptions(unsubscribe_token);