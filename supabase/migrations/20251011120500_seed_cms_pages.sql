-- Seed initial CMS pages from existing static content placeholders
INSERT INTO public.cms_pages (slug, title, status, seo, content)
VALUES
  ('home', 'Home', 'draft', '{"title":"Care N Tour","description":"Home page"}', '[{"type":"hero","heading":"Care N Tour","subheading":"World-Class Healthcare in Egypt"}]'),
  ('about', 'About', 'draft', '{"title":"About Care N Tour","description":"About page"}', '[{"type":"hero","heading":"About Care N Tour","subheading":"Transforming Lives Through World-Class Healthcare"}]'),
  ('travel-info', 'Travel Info', 'draft', '{"title":"Travel Information","description":"Travel and medical tourism guidance"}', '[{"type":"hero","heading":"Travel Information","subheading":"Your Complete Guide to Medical Tourism in Egypt"}]')
ON CONFLICT (slug) DO NOTHING;


