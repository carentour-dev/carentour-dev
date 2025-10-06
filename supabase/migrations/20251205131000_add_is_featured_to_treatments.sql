-- Add explicit featured flag to treatments so admins can control homepage highlights
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Ensure existing records have a deterministic value
UPDATE public.treatments
SET is_featured = COALESCE(is_featured, false);

ALTER TABLE public.treatments
  ALTER COLUMN is_featured SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treatments_featured
  ON public.treatments(is_featured);
