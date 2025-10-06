-- Capture inbound contact submissions for admin triage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'contact_request_status'
  ) THEN
    CREATE TYPE public.contact_request_status AS ENUM ('new', 'in_progress', 'resolved');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL DEFAULT 'general',
  status public.contact_request_status NOT NULL DEFAULT 'new',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  treatment TEXT,
  message TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Anyone can submit a contact request'
  ) THEN
    CREATE POLICY "Anyone can submit a contact request"
      ON public.contact_requests
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'Service role manages contact requests'
  ) THEN
    CREATE POLICY "Service role manages contact requests"
      ON public.contact_requests
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_contact_requests_updated_at'
      AND tgrelid = 'public.contact_requests'::regclass
  ) THEN
    CREATE TRIGGER update_contact_requests_updated_at
      BEFORE UPDATE ON public.contact_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests (status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON public.contact_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned_to ON public.contact_requests (assigned_to);
