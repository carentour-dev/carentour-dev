-- Add attachments metadata storage for consultation requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_requests'
      AND column_name = 'documents'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD COLUMN documents JSONB;
  END IF;
END;
$$;
