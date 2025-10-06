-- Extend contact requests with consultation-specific intake details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'destination'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN destination TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'travel_window'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN travel_window TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'health_background'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN health_background TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN budget_range TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'companions'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN companions TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'medical_reports'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN medical_reports TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN contact_preference TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'additional_questions'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN additional_questions TEXT;
  END IF;
END;
$$;
