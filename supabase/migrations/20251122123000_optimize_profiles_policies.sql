-- Optimize profile policies to avoid per-row auth function evaluation
BEGIN;

-- Ensure a consistent viewer policy name and definition
DROP POLICY IF EXISTS "Users can view their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile data"
  ON public.profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Refresh the update policy definition
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Refresh the insert policy definition
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
