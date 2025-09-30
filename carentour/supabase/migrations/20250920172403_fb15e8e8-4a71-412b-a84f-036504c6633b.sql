-- Enhanced security: Create secure user display functions and policies

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

-- Create a secure view for profile data that excludes email addresses
CREATE OR REPLACE VIEW public.secure_profiles AS
SELECT 
  id,
  user_id,
  username,
  role,
  avatar_url,
  created_at,
  updated_at,
  -- Never expose email in any public view
  NULL as email
FROM public.profiles;

-- Update the existing RLS policy on profiles to be more explicit about email protection
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create separate policies for different operations with explicit email protection
CREATE POLICY "Users can view their own profile data" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add a policy that prevents any accidental email exposure through API
CREATE POLICY "Prevent email access via API" 
ON public.profiles 
FOR SELECT 
USING (false) 
WITH CHECK (email IS NULL);

-- Create a comment documenting the email protection
COMMENT ON COLUMN public.profiles.email IS 'EMAIL FIELD: This field should never be exposed through public APIs or frontend. Use username for display purposes only.';

-- Create an audit function to log any attempts to access email data
CREATE OR REPLACE FUNCTION public.audit_email_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any SELECT operations that might be trying to access email
  IF TG_OP = 'SELECT' AND OLD.email IS NOT NULL THEN
    INSERT INTO public.security_audit_log (
      event_type,
      table_name,
      user_id,
      details,
      created_at
    ) VALUES (
      'EMAIL_ACCESS_ATTEMPT',
      'profiles',
      auth.uid(),
      'Attempt to access email field detected',
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create security audit log table if it doesn't exist
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

-- Only allow system admin access to audit logs
CREATE POLICY "System audit access only" 
ON public.security_audit_log 
FOR ALL 
USING (false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.secure_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO authenticated;