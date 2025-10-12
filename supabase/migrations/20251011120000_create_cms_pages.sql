-- CMS: pages table, RLS policies, and storage bucket for assets
-- Creates `cms_pages` with draft/published workflow and grants public read for published content.

-- Ensure required extension for UUID generation (if not already enabled elsewhere)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: cms_pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  seo JSONB,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages (slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages (status);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.cms_pages_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_cms_pages_updated_at ON public.cms_pages;
CREATE TRIGGER trg_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_pages_set_updated_at();

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Helper: checks if current user is admin or editor via profiles.role
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
DECLARE
  r TEXT;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE user_id = auth.uid();
  RETURN r IN ('admin','editor');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Policies
-- 1) Anyone can read published pages
DROP POLICY IF EXISTS "Read published cms pages" ON public.cms_pages;
CREATE POLICY "Read published cms pages"
ON public.cms_pages
FOR SELECT
USING (status = 'published');

-- 2) Admin/Editor can read all pages (including drafts)
DROP POLICY IF EXISTS "Admin/Editor read all cms pages" ON public.cms_pages;
CREATE POLICY "Admin/Editor read all cms pages"
ON public.cms_pages
FOR SELECT
USING (public.is_admin_or_editor());

-- 3) Admin/Editor can insert
DROP POLICY IF EXISTS "Admin/Editor insert cms pages" ON public.cms_pages;
CREATE POLICY "Admin/Editor insert cms pages"
ON public.cms_pages
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

-- 4) Admin/Editor can update
DROP POLICY IF EXISTS "Admin/Editor update cms pages" ON public.cms_pages;
CREATE POLICY "Admin/Editor update cms pages"
ON public.cms_pages
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

-- 5) Admin/Editor can delete
DROP POLICY IF EXISTS "Admin/Editor delete cms pages" ON public.cms_pages;
CREATE POLICY "Admin/Editor delete cms pages"
ON public.cms_pages
FOR DELETE
USING (public.is_admin_or_editor());

-- Create bucket if not exists (portable syntax across Supabase versions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies on objects
-- Allow public read of objects in cms-assets
DROP POLICY IF EXISTS "Public read cms-assets" ON storage.objects;
CREATE POLICY "Public read cms-assets"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'cms-assets');

-- Allow admin/editor to insert into cms-assets
DROP POLICY IF EXISTS "Admin/Editor write cms-assets" ON storage.objects;
CREATE POLICY "Admin/Editor write cms-assets"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cms-assets' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','editor')
  )
);

-- Allow admin/editor to update/delete their objects in cms-assets
DROP POLICY IF EXISTS "Admin/Editor modify cms-assets" ON storage.objects;
CREATE POLICY "Admin/Editor modify cms-assets"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'cms-assets' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','editor')
  )
)
WITH CHECK (
  bucket_id = 'cms-assets' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','editor')
  )
);

DROP POLICY IF EXISTS "Admin/Editor delete cms-assets" ON storage.objects;
CREATE POLICY "Admin/Editor delete cms-assets"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'cms-assets' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','editor')
  )
);


