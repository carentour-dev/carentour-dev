-- Create facilities table capturing partner hospitals/clinics metadata
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  facility_type TEXT NOT NULL,
  description TEXT,
  address JSONB,
  contact_info JSONB,
  coordinates JSONB,
  amenities TEXT[],
  specialties TEXT[],
  images JSONB,
  is_partner BOOLEAN DEFAULT true,
  rating NUMERIC(3,2),
  review_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilities are public"
ON public.facilities
FOR SELECT
USING (true);

CREATE POLICY "Service role manages facilities"
ON public.facilities
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_facilities_slug ON public.facilities(slug);
CREATE INDEX IF NOT EXISTS idx_facilities_partner ON public.facilities(is_partner);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(facility_type);
