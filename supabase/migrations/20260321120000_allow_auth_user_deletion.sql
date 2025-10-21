-- Allow Supabase auth users to be deleted
-- even when referenced by optional metadata tables.
BEGIN;

ALTER TABLE public.cms_pages
DROP CONSTRAINT IF EXISTS cms_pages_updated_by_fkey;

ALTER TABLE public.cms_pages
ADD CONSTRAINT cms_pages_updated_by_fkey
FOREIGN KEY (updated_by)
REFERENCES auth.users (id)
ON DELETE SET NULL;

ALTER TABLE public.security_events
DROP CONSTRAINT IF EXISTS security_events_user_id_fkey;

ALTER TABLE public.security_events
ADD CONSTRAINT security_events_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE SET NULL;

COMMIT;
