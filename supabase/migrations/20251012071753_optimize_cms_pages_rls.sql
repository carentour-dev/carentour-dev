-- Optimize cms_pages RLS policies
-- Fixes: Multiple permissive policies on cms_pages for dashboard_user role SELECT action
--
-- Issue: Having separate policies for "Read published cms pages" and "Admin/Editor read all cms pages"
-- causes performance degradation as both policies must be evaluated for every SELECT query.
--
-- Solution: Consolidate both SELECT policies into a single policy that handles both cases.

-- Drop the existing SELECT policies
DROP POLICY IF EXISTS "Read published cms pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admin/Editor read all cms pages" ON public.cms_pages;

-- Create a single consolidated SELECT policy
-- This policy allows:
-- 1. Anyone (including anonymous) to read published pages
-- 2. Admin/Editor users to read all pages (including drafts)
CREATE POLICY "Read cms pages"
ON public.cms_pages
FOR SELECT
USING (
  status = 'published'
  OR public.is_admin_or_editor()
);

-- Comment explaining the optimization
COMMENT ON POLICY "Read cms pages" ON public.cms_pages IS
'Consolidated policy: allows public read of published pages, and admin/editor read of all pages. This single policy is more performant than multiple permissive policies.';
