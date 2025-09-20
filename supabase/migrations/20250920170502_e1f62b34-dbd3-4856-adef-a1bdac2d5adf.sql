-- Create a function to delete all auth users
CREATE OR REPLACE FUNCTION delete_all_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Delete all profiles first
    DELETE FROM public.profiles;
    
    -- Loop through all users and delete them
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM auth.uid(); -- Ensure we're in admin context
        DELETE FROM auth.users WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- Execute the function
SELECT delete_all_auth_users();

-- Drop the function after use
DROP FUNCTION delete_all_auth_users();