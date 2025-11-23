-- FAQ categories table to allow CMS-managed categories.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.faq_categories (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    fragment TEXT,
    position INTEGER NOT NULL DEFAULT 0, -- noqa: RF04
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_categories_position
ON public.faq_categories (position, slug);

CREATE OR REPLACE FUNCTION public.faq_categories_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_faq_categories_updated_at ON public.faq_categories;
CREATE TRIGGER trg_faq_categories_updated_at
BEFORE UPDATE ON public.faq_categories
FOR EACH ROW
EXECUTE FUNCTION public.faq_categories_set_updated_at();

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_faq_categories ON public.faq_categories;
CREATE POLICY read_faq_categories
ON public.faq_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS insert_faq_categories ON public.faq_categories;
CREATE POLICY insert_faq_categories
ON public.faq_categories
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS update_faq_categories ON public.faq_categories;
CREATE POLICY update_faq_categories
ON public.faq_categories
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS delete_faq_categories ON public.faq_categories;
CREATE POLICY delete_faq_categories
ON public.faq_categories
FOR DELETE
USING (public.is_admin_or_editor());

-- Seed existing categories to match current experience.
INSERT INTO public.faq_categories (
    slug,
    title,
    description,
    icon,
    color,
    fragment,
    position
)
VALUES
(
    'general',
    'General Information',
    'About medical tourism in Egypt',
    'Globe',
    'bg-blue-500/10 text-blue-600 border-blue-200',
    'general',
    1
),
(
    'visa',
    'Visa & Travel',
    'Documentation and travel requirements',
    'FileText',
    'bg-green-500/10 text-green-600 border-green-200',
    'visa-travel',
    2
),
(
    'treatments',
    'Medical Procedures',
    'Treatment processes and specialties',
    'Stethoscope',
    'bg-purple-500/10 text-purple-600 border-purple-200',
    'treatments',
    3
),
(
    'costs',
    'Costs & Payment',
    'Pricing and payment options',
    'CreditCard',
    'bg-orange-500/10 text-orange-600 border-orange-200',
    'costs-payment',
    4
),
(
    'accommodation',
    'Stay & Transport',
    'Hotels and transportation services',
    'Hotel',
    'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    'stay-transport',
    5
),
(
    'aftercare',
    'Recovery & Support',
    'Post-treatment care and follow-ups',
    'HeartHandshake',
    'bg-pink-500/10 text-pink-600 border-pink-200',
    'recovery-support',
    6
),
(
    'emergency',
    'Emergency & Safety',
    '24/7 support and emergency procedures',
    'Shield',
    'bg-red-500/10 text-red-600 border-red-200',
    'emergency',
    7
)
ON CONFLICT (slug) DO NOTHING;

-- Enforce that FAQ entries point to a known category.
ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS fk_faqs_category;
ALTER TABLE public.faqs
ADD CONSTRAINT fk_faqs_category FOREIGN KEY (category)
REFERENCES public.faq_categories (slug)
ON DELETE RESTRICT;
