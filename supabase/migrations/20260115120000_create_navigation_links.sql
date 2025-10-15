-- Navigation links table to manage core and CMS routes from the CMS UI.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.navigation_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    href TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published'
    CHECK (
        status IN ('published', 'hidden')
    ),
    position INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (
        kind IN ('system', 'cms', 'manual')
    ),
    cms_page_id UUID REFERENCES public.cms_pages (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_navigation_links_position
ON public.navigation_links (position, id);

CREATE OR REPLACE FUNCTION public.navigation_links_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_navigation_links_updated_at
ON public.navigation_links;
CREATE TRIGGER trg_navigation_links_updated_at
BEFORE UPDATE ON public.navigation_links
FOR EACH ROW
EXECUTE FUNCTION public.navigation_links_set_updated_at();

ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_navigation_links
ON public.navigation_links;
DROP POLICY IF EXISTS read_published_navigation_links
ON public.navigation_links;
DROP POLICY IF EXISTS admin_editor_read_navigation_links
ON public.navigation_links;
CREATE POLICY read_navigation_links
ON public.navigation_links
FOR SELECT
USING (
    status = 'published'
    OR public.is_admin_or_editor()
);

DROP POLICY IF EXISTS admin_editor_insert_navigation_links
ON public.navigation_links;
CREATE POLICY admin_editor_insert_navigation_links
ON public.navigation_links
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_update_navigation_links
ON public.navigation_links;
CREATE POLICY admin_editor_update_navigation_links
ON public.navigation_links
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS admin_editor_delete_navigation_links
ON public.navigation_links;
CREATE POLICY admin_editor_delete_navigation_links
ON public.navigation_links
FOR DELETE
USING (public.is_admin_or_editor());

INSERT INTO public.navigation_links (
    label,
    slug,
    href,
    status,
    position,
    kind
)
VALUES
('Home', 'home', '/', 'published', 0, 'system'),
('About Us', 'about', '/about', 'published', 1, 'system'),
('Treatments', 'treatments', '/treatments', 'published', 2, 'system'),
('Our Doctors', 'doctors', '/doctors', 'published', 3, 'system'),
('Patient Stories', 'stories', '/stories', 'published', 4, 'system'),
(
    'Plan Your Trip',
    'plan',
    '/plan',
    'published',
    5,
    'system'
),
(
    'Travel Info',
    'travel-info',
    '/travel-info',
    'published',
    6,
    'system'
),
('Concierge', 'concierge', '/concierge', 'published', 7, 'system'),
('Blog', 'blog', '/blog', 'published', 8, 'system'),
('FAQ', 'faq', '/faq', 'published', 9, 'system'),
('Contact', 'contact', '/contact', 'published', 10, 'system')
ON CONFLICT (slug) DO NOTHING;
