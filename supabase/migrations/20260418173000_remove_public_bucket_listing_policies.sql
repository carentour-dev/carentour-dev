-- Public buckets can serve object URLs without broad SELECT policies on
-- storage.objects. Removing these policies keeps public access to known asset
-- URLs while preventing anonymous bucket listing.

DO $$
DECLARE
    policy_name TEXT;
    policy_names TEXT[] := ARRAY[
        'Avatar images are publicly accessible',
        'public_read_blog_assets',
        'Public read cms-assets',
        'Allow public read on media'
    ];
BEGIN
    FOREACH policy_name IN ARRAY policy_names LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON storage.objects',
            policy_name
        );
    END LOOP;
END
$$;
