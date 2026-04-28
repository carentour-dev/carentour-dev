DO $$
DECLARE
  broken_url text := 'https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/optimized-migration/4bf8747aed55ed11/cnt-hero.webp';
  replacement_url text := 'https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png';
BEGIN
  UPDATE public.cms_pages
  SET
    settings = replace(settings::text, broken_url, replacement_url)::jsonb,
    content = replace(content::text, broken_url, replacement_url)::jsonb
  WHERE settings::text LIKE '%' || broken_url || '%'
    OR content::text LIKE '%' || broken_url || '%';

  UPDATE public.cms_page_translations
  SET content = replace(content::text, broken_url, replacement_url)::jsonb
  WHERE content::text LIKE '%' || broken_url || '%';
END $$;
