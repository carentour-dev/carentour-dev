-- Secure bucket for patient intake documents
-- uploaded via the Start Journey wizard
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow authenticated users to upload into the
-- patient-documents bucket when needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Allow authenticated upload to patient-documents'
    ) THEN
        CREATE POLICY "Allow authenticated upload to patient-documents"
            ON storage.objects
            FOR INSERT
            WITH CHECK (
                bucket_id = 'patient-documents'
                AND auth.role() = 'authenticated'
            );
    END IF;
END
$$;
