-- Add Medical Facilities to primary navigation
INSERT INTO public.navigation_links (
    label,
    slug,
    href,
    status,
    position,
    kind
)
VALUES (
    'Medical Facilities',
    'medical-facilities',
    '/medical-facilities',
    'published',
    3,
    'system'
)
ON CONFLICT (slug) DO NOTHING;
