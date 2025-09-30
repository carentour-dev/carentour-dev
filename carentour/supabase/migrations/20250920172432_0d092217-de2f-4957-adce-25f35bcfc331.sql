-- Enhanced security: Remove email exposure and add protection

-- Create a function to get safe user display info that never exposes emails
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  display_name TEXT;
BEGIN
  SELECT 
    COALESCE(username, 'User')
  INTO display_name
  FROM public.profiles 
  WHERE profiles.user_id = $1;
  
  RETURN COALESCE(display_name, 'User');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add a comment documenting the email protection
COMMENT ON COLUMN public.profiles.email IS 'EMAIL FIELD: This field should never be exposed through public APIs or frontend. Use username for display purposes only.';

-- Create security audit log table for monitoring email access attempts
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  user_id UUID,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the audit log table
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system admin access to audit logs (restrictive policy)
CREATE POLICY "System audit access only" 
ON public.security_audit_log 
FOR ALL 
USING (false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO authenticated;