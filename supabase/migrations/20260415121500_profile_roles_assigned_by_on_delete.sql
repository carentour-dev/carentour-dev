-- Allow deleting Supabase users even if they assigned roles
BEGIN;

ALTER TABLE public.profile_roles
DROP CONSTRAINT IF EXISTS profile_roles_assigned_by_fkey;

ALTER TABLE public.profile_roles
ADD CONSTRAINT profile_roles_assigned_by_fkey
FOREIGN KEY (assigned_by)
REFERENCES auth.users (id)
ON DELETE SET NULL;

COMMIT;
