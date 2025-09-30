-- Create function to check if email exists before signup
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  email_exists BOOLEAN;
BEGIN
  -- Check if email exists in auth.users table
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = p_email
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$function$;