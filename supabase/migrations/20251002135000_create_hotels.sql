-- Create hotels table for recovery-friendly accommodations
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  star_rating INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  nightly_rate NUMERIC(10,2),
  currency TEXT,
  distance_to_facility_km NUMERIC(6,2),
  address JSONB,
  contact_info JSONB,
  coordinates JSONB,
  amenities TEXT[],
  medical_services TEXT[],
  images JSONB,
  is_partner BOOLEAN DEFAULT true,
  rating NUMERIC(3,2),
  review_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotels are public"
ON public.hotels
FOR SELECT
USING (is_partner IS TRUE);

CREATE POLICY "Service role manages hotels"
ON public.hotels
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_hotels_updated_at
BEFORE UPDATE ON public.hotels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_hotels_slug ON public.hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_star_rating ON public.hotels(star_rating);
CREATE INDEX IF NOT EXISTS idx_hotels_partner ON public.hotels(is_partner);
