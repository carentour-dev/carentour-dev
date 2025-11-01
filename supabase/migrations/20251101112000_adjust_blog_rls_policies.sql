-- Adjust blog RLS policies to avoid duplicate permissive SELECT rules
BEGIN;

-- blog_categories: replace FOR ALL policy with scoped write policies
DROP POLICY IF EXISTS admin_editor_manage_blog_categories
ON public.blog_categories;
DROP POLICY IF EXISTS admin_editor_insert_blog_categories
ON public.blog_categories;
DROP POLICY IF EXISTS admin_editor_update_blog_categories
ON public.blog_categories;
DROP POLICY IF EXISTS admin_editor_delete_blog_categories
ON public.blog_categories;

CREATE POLICY admin_editor_insert_blog_categories
ON public.blog_categories
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_update_blog_categories
ON public.blog_categories
FOR UPDATE TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_delete_blog_categories
ON public.blog_categories
FOR DELETE TO authenticated
USING (public.is_admin_or_editor());

-- blog_tags: replace FOR ALL policy with scoped write policies
DROP POLICY IF EXISTS admin_editor_manage_blog_tags
ON public.blog_tags;
DROP POLICY IF EXISTS admin_editor_insert_blog_tags
ON public.blog_tags;
DROP POLICY IF EXISTS admin_editor_update_blog_tags
ON public.blog_tags;
DROP POLICY IF EXISTS admin_editor_delete_blog_tags
ON public.blog_tags;

CREATE POLICY admin_editor_insert_blog_tags
ON public.blog_tags
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_update_blog_tags
ON public.blog_tags
FOR UPDATE TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_delete_blog_tags
ON public.blog_tags
FOR DELETE TO authenticated
USING (public.is_admin_or_editor());

-- blog_post_tags: remove ALL policy and scope to write operations
DROP POLICY IF EXISTS admin_editor_manage_blog_post_tags
ON public.blog_post_tags;
DROP POLICY IF EXISTS admin_editor_insert_blog_post_tags
ON public.blog_post_tags;
DROP POLICY IF EXISTS admin_editor_update_blog_post_tags
ON public.blog_post_tags;
DROP POLICY IF EXISTS admin_editor_delete_blog_post_tags
ON public.blog_post_tags;

CREATE POLICY admin_editor_insert_blog_post_tags
ON public.blog_post_tags
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_update_blog_post_tags
ON public.blog_post_tags
FOR UPDATE TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY admin_editor_delete_blog_post_tags
ON public.blog_post_tags
FOR DELETE TO authenticated
USING (public.is_admin_or_editor());

-- blog_authors: split public/anon and authenticated read policies
DROP POLICY IF EXISTS public_read_active_blog_authors
ON public.blog_authors;
DROP POLICY IF EXISTS admin_editor_read_all_blog_authors
ON public.blog_authors;
DROP POLICY IF EXISTS authenticated_read_blog_authors
ON public.blog_authors;

CREATE POLICY public_read_active_blog_authors
ON public.blog_authors
FOR SELECT TO anon
USING (active = true);

CREATE POLICY authenticated_read_blog_authors
ON public.blog_authors
FOR SELECT TO authenticated
USING (
    active = true
    OR public.is_admin_or_editor()
);

-- blog_posts: split public/anon and authenticated read policies
DROP POLICY IF EXISTS public_read_published_blog_posts
ON public.blog_posts;
DROP POLICY IF EXISTS admin_editor_read_all_blog_posts
ON public.blog_posts;
DROP POLICY IF EXISTS authenticated_read_blog_posts
ON public.blog_posts;

CREATE POLICY public_read_published_blog_posts
ON public.blog_posts
FOR SELECT TO anon
USING (
    status = 'published'
    AND (
        publish_date IS null
        OR publish_date <= now()
    )
);

CREATE POLICY authenticated_read_blog_posts
ON public.blog_posts
FOR SELECT TO authenticated
USING (
    public.is_admin_or_editor()
    OR (
        status = 'published'
        AND (
            publish_date IS null
            OR publish_date <= now()
        )
    )
);

-- blog_comments: split public/anon and authenticated read policies
DROP POLICY IF EXISTS public_read_approved_blog_comments
ON public.blog_comments;
DROP POLICY IF EXISTS admin_editor_read_all_blog_comments
ON public.blog_comments;
DROP POLICY IF EXISTS authenticated_read_blog_comments
ON public.blog_comments;

CREATE POLICY public_read_approved_blog_comments
ON public.blog_comments
FOR SELECT TO anon
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

CREATE POLICY authenticated_read_blog_comments
ON public.blog_comments
FOR SELECT TO authenticated
USING (
    public.is_admin_or_editor()
    OR (
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
    )
);

-- blog_post_tags: align read policies with anon/auth split
DROP POLICY IF EXISTS public_read_blog_post_tags
ON public.blog_post_tags;
DROP POLICY IF EXISTS admin_editor_read_all_blog_post_tags
ON public.blog_post_tags;
DROP POLICY IF EXISTS authenticated_read_blog_post_tags
ON public.blog_post_tags;

CREATE POLICY public_read_blog_post_tags
ON public.blog_post_tags
FOR SELECT TO anon
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

CREATE POLICY authenticated_read_blog_post_tags
ON public.blog_post_tags
FOR SELECT TO authenticated
USING (
    public.is_admin_or_editor()
    OR EXISTS (
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

COMMIT;
