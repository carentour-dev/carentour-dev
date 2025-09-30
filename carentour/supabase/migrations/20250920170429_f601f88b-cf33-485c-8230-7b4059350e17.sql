-- Delete all profiles first (to avoid foreign key issues)
DELETE FROM public.profiles;

-- Delete all users from auth.users table using Supabase admin function
-- Note: This will cascade delete related auth data automatically
SELECT auth.users.id FROM auth.users;