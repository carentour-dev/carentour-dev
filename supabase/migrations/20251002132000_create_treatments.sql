-- Create treatments catalogue table
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  summary TEXT,
  description TEXT,
  base_price NUMERIC(10,2),
  currency TEXT,
  duration_days INTEGER,
  recovery_time_days INTEGER,
  success_rate NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatments are viewable by everyone"
ON public.treatments
FOR SELECT
USING (is_active IS TRUE);

CREATE POLICY "Service role can manage treatments"
ON public.treatments
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_treatments_updated_at
BEFORE UPDATE ON public.treatments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_treatments_slug ON public.treatments(slug);
CREATE INDEX IF NOT EXISTS idx_treatments_category ON public.treatments(category);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON public.treatments(is_active);
