-- Blog System: Complete database schema for dynamic blog management
-- Creates blog_posts, blog_categories, blog_tags, blog_authors
-- and blog_comments tables
-- Includes RLS policies for public read and admin/editor management access.

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: blog_categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: blog_tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: blog_authors
CREATE TABLE IF NOT EXISTS public.blog_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    email TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}'::JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Table: blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '{"type":"richtext","data":""}'::JSONB,
    featured_image TEXT,
    category_id UUID REFERENCES public.blog_categories (id)
    ON DELETE SET NULL,
    author_id UUID REFERENCES public.blog_authors (id)
    ON DELETE SET NULL,
    author_user_id UUID REFERENCES auth.users (id)
    ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'scheduled')),
    publish_date TIMESTAMPTZ,
    reading_time INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    og_image TEXT,
    enable_comments BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: blog_post_tags (junction table)
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
    post_id UUID NOT NULL REFERENCES public.blog_posts (id)
    ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags (id)
    ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, tag_id)
);

-- Table: blog_comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.blog_posts (id)
    ON DELETE CASCADE,
    parent_id UUID REFERENCES public.blog_comments (id)
    ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_user_id UUID REFERENCES auth.users (id)
    ON DELETE SET NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug
ON public.blog_categories (slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_order
ON public.blog_categories ("order");
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug
ON public.blog_tags (slug);
CREATE INDEX IF NOT EXISTS idx_blog_authors_user_id
ON public.blog_authors (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status
ON public.blog_posts (status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id
ON public.blog_posts (category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id
ON public.blog_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date
ON public.blog_posts (publish_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
ON public.blog_posts (featured)
WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id
ON public.blog_post_tags (post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id
ON public.blog_post_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id
ON public.blog_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status
ON public.blog_comments (status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id
ON public.blog_comments (parent_id);

-- Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION public.blog_categories_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.blog_authors_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.blog_posts_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER trg_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.blog_categories_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_authors_updated_at ON public.blog_authors;
CREATE TRIGGER trg_blog_authors_updated_at
BEFORE UPDATE ON public.blog_authors
FOR EACH ROW
EXECUTE FUNCTION public.blog_authors_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.blog_posts_set_updated_at();

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
DROP POLICY IF EXISTS public_read_blog_categories
ON public.blog_categories;
CREATE POLICY public_read_blog_categories
ON public.blog_categories
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS admin_editor_manage_blog_categories
ON public.blog_categories;
CREATE POLICY admin_editor_manage_blog_categories
ON public.blog_categories
FOR ALL
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

-- RLS Policies for blog_tags
DROP POLICY IF EXISTS public_read_blog_tags
ON public.blog_tags;
CREATE POLICY public_read_blog_tags
ON public.blog_tags
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS admin_editor_manage_blog_tags
ON public.blog_tags;
CREATE POLICY admin_editor_manage_blog_tags
ON public.blog_tags
FOR ALL
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

-- RLS Policies for blog_authors
DROP POLICY IF EXISTS public_read_active_blog_authors
ON public.blog_authors;
CREATE POLICY public_read_active_blog_authors
ON public.blog_authors
FOR SELECT
TO public
USING (active = true);

DROP POLICY IF EXISTS admin_editor_read_all_blog_authors
ON public.blog_authors;
CREATE POLICY admin_editor_read_all_blog_authors
ON public.blog_authors
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_insert_blog_authors
ON public.blog_authors;
CREATE POLICY admin_editor_insert_blog_authors
ON public.blog_authors
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_update_blog_authors
ON public.blog_authors;
CREATE POLICY admin_editor_update_blog_authors
ON public.blog_authors
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_delete_blog_authors
ON public.blog_authors;
CREATE POLICY admin_editor_delete_blog_authors
ON public.blog_authors
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- RLS Policies for blog_posts
DROP POLICY IF EXISTS public_read_published_blog_posts
ON public.blog_posts;
CREATE POLICY public_read_published_blog_posts
ON public.blog_posts
FOR SELECT
TO public
USING (
    status = 'published'
    AND (
        publish_date IS null
        OR publish_date <= now()
    )
);

DROP POLICY IF EXISTS admin_editor_read_all_blog_posts
ON public.blog_posts;
CREATE POLICY admin_editor_read_all_blog_posts
ON public.blog_posts
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_insert_blog_posts
ON public.blog_posts;
CREATE POLICY admin_editor_insert_blog_posts
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_update_blog_posts
ON public.blog_posts;
CREATE POLICY admin_editor_update_blog_posts
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_delete_blog_posts
ON public.blog_posts;
CREATE POLICY admin_editor_delete_blog_posts
ON public.blog_posts
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- RLS Policies for blog_post_tags
DROP POLICY IF EXISTS public_read_blog_post_tags
ON public.blog_post_tags;
CREATE POLICY public_read_blog_post_tags
ON public.blog_post_tags
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE
            id = post_id
            AND status = 'published'
            AND (
                publish_date IS null
                OR publish_date <= now()
            )
    )
);

DROP POLICY IF EXISTS admin_editor_read_all_blog_post_tags
ON public.blog_post_tags;
CREATE POLICY admin_editor_read_all_blog_post_tags
ON public.blog_post_tags
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_manage_blog_post_tags
ON public.blog_post_tags;
CREATE POLICY admin_editor_manage_blog_post_tags
ON public.blog_post_tags
FOR ALL
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

-- RLS Policies for blog_comments
DROP POLICY IF EXISTS public_read_approved_blog_comments
ON public.blog_comments;
CREATE POLICY public_read_approved_blog_comments
ON public.blog_comments
FOR SELECT
TO public
USING (
    status = 'approved'
    AND EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE
            id = post_id
            AND status = 'published'
            AND enable_comments = true
            AND (
                publish_date IS null
                OR publish_date <= now()
            )
    )
);

DROP POLICY IF EXISTS public_insert_blog_comments
ON public.blog_comments;
CREATE POLICY public_insert_blog_comments
ON public.blog_comments
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE
            id = post_id
            AND status = 'published'
            AND enable_comments = true
            AND (
                publish_date IS null
                OR publish_date <= now()
            )
    )
);

DROP POLICY IF EXISTS admin_editor_read_all_blog_comments
ON public.blog_comments;
CREATE POLICY admin_editor_read_all_blog_comments
ON public.blog_comments
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_update_blog_comments
ON public.blog_comments;
CREATE POLICY admin_editor_update_blog_comments
ON public.blog_comments
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_delete_blog_comments
ON public.blog_comments;
CREATE POLICY admin_editor_delete_blog_comments
ON public.blog_comments
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-assets', 'blog-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS public_read_blog_assets
ON storage.objects;
CREATE POLICY public_read_blog_assets
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-assets');

DROP POLICY IF EXISTS admin_editor_insert_blog_assets
ON storage.objects;
CREATE POLICY admin_editor_insert_blog_assets
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'blog-assets'
    AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE
            p.user_id = auth.uid()
            AND p.role IN ('admin', 'editor')
    )
);

DROP POLICY IF EXISTS admin_editor_update_blog_assets
ON storage.objects;
CREATE POLICY admin_editor_update_blog_assets
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'blog-assets'
    AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE
            p.user_id = auth.uid()
            AND p.role IN ('admin', 'editor')
    )
)
WITH CHECK (
    bucket_id = 'blog-assets'
    AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE
            p.user_id = auth.uid()
            AND p.role IN ('admin', 'editor')
    )
);

DROP POLICY IF EXISTS admin_editor_delete_blog_assets
ON storage.objects;
CREATE POLICY admin_editor_delete_blog_assets
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'blog-assets'
    AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE
            p.user_id = auth.uid()
            AND p.role IN ('admin', 'editor')
    )
);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_blog_post_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.blog_posts
    SET view_count = view_count + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
