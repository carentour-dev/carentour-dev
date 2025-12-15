-- Expand service providers to capture richer profiles and filterable geography
BEGIN;

ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS facilities TEXT [],
ADD COLUMN IF NOT EXISTS infrastructure JSONB,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT [],
ADD COLUMN IF NOT EXISTS procedure_ids UUID [];

-- Backfill country/city from the existing address JSON where present
UPDATE public.service_providers
SET
    country_code = COALESCE(country_code, address ->> 'country'),
    city = COALESCE(city, address ->> 'city');

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_service_providers_country
ON public.service_providers (country_code);
CREATE INDEX IF NOT EXISTS idx_service_providers_city
ON public.service_providers (city);
CREATE INDEX IF NOT EXISTS idx_service_providers_specialties_gin
ON public.service_providers USING gin (specialties);
CREATE INDEX IF NOT EXISTS idx_service_providers_procedure_ids_gin
ON public.service_providers USING gin (procedure_ids);

COMMIT;
