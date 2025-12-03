-- Add public treatment images for cards and hero sections
ALTER TABLE public.treatments
ADD COLUMN IF NOT EXISTS card_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN public.treatments.card_image_url IS
'Primary card image shown in listings and featured sections.';
COMMENT ON COLUMN public.treatments.hero_image_url IS
'Hero/cover image for detailed treatment pages.';
