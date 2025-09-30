-- Create enhanced security monitoring tables and functions

-- Enhanced security audit log with more detailed tracking
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only allow admins and system to view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access policy - only through functions
CREATE POLICY "No direct access to login attempts" 
ON public.login_attempts 
FOR ALL 
USING (false);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type, user_id, ip_address, user_agent, event_data, risk_level
  ) VALUES (
    p_event_type, p_user_id, p_ip_address, p_user_agent, p_event_data, p_risk_level
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to check rate limiting for login attempts
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_ip_address INET,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ip_attempts INTEGER;
  email_attempts INTEGER;
  result JSONB;
BEGIN
  -- Count failed attempts from IP in last 15 minutes
  SELECT COUNT(*) INTO ip_attempts
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';
    
  -- Count failed attempts for email in last 15 minutes
  SELECT COUNT(*) INTO email_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';
  
  -- Check limits (5 failed attempts per IP, 3 per email)
  IF ip_attempts >= 5 OR email_attempts >= 3 THEN
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'ip_attempts', ip_attempts,
      'email_attempts', email_attempts
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'ip_attempts', ip_attempts,
      'email_attempts', email_attempts
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_ip_address INET,
  p_email TEXT,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (ip_address, email, success)
  VALUES (p_ip_address, p_email, p_success);
  
  -- Log security event
  PERFORM public.log_security_event(
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failure' END,
    NULL, -- User ID not available yet for failed attempts
    p_ip_address,
    NULL,
    jsonb_build_object('email', p_email),
    CASE WHEN p_success THEN 'low' ELSE 'medium' END
  );
END;
$$;

-- Function to clean old login attempts (call this periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.login_attempts
  WHERE created_at < now() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_level ON public.security_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);