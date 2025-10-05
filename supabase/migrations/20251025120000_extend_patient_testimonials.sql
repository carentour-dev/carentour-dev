-- Extend doctor reviews with richer testimonial metadata
ALTER TABLE public.doctor_reviews
  ADD COLUMN patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN treatment_slug TEXT,
  ADD COLUMN locale TEXT DEFAULT 'en',
  ADD COLUMN published BOOLEAN DEFAULT true,
  ADD COLUMN highlight BOOLEAN DEFAULT false,
  ADD COLUMN display_order INTEGER DEFAULT 0,
  ADD COLUMN media JSONB DEFAULT '[]'::jsonb;

-- Ensure doctor reviews reference at least a doctor or treatment
ALTER TABLE public.doctor_reviews
  ADD CONSTRAINT doctor_reviews_requires_reference
  CHECK ((doctor_id IS NOT NULL) OR (treatment_slug IS NOT NULL));

-- Table to store long-form patient stories
CREATE TABLE public.patient_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  treatment_slug TEXT NOT NULL,
  headline TEXT NOT NULL,
  excerpt TEXT,
  body_markdown TEXT NOT NULL,
  outcome_summary JSONB DEFAULT '[]'::jsonb,
  media JSONB DEFAULT '[]'::jsonb,
  hero_image TEXT,
  locale TEXT DEFAULT 'en',
  published BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient stories are viewable by everyone"
ON public.patient_stories
FOR SELECT
USING (published = true);

CREATE POLICY "Service role can manage patient stories"
ON public.patient_stories
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_patient_stories_treatment ON public.patient_stories(treatment_slug);
CREATE INDEX idx_patient_stories_featured ON public.patient_stories(featured);

-- Update trigger for patient stories timestamps
CREATE TRIGGER update_patient_stories_updated_at
BEFORE UPDATE ON public.patient_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enrich patients with testimonial metadata
ALTER TABLE public.patients
  ADD COLUMN home_city TEXT,
  ADD COLUMN travel_year INTEGER,
  ADD COLUMN has_testimonial BOOLEAN DEFAULT false;

CREATE INDEX idx_doctor_reviews_treatment_slug ON public.doctor_reviews(treatment_slug);
CREATE INDEX idx_doctor_reviews_display_order ON public.doctor_reviews(display_order);
