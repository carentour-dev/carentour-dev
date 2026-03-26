-- SEO platform foundation:
-- - Per-route SEO overrides (localized)
-- - Managed route redirects for slug/path continuity

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.normalize_route_path(p_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
BEGIN
  IF p_path IS NULL THEN
    RETURN '/';
  END IF;

  v_path := btrim(p_path);
  IF v_path = '' THEN
    RETURN '/';
  END IF;

  -- Remove query/hash fragments if they were accidentally supplied.
  v_path := split_part(v_path, '?', 1);
  v_path := split_part(v_path, '#', 1);

  IF left(v_path, 1) <> '/' THEN
    v_path := '/' || v_path;
  END IF;

  -- Collapse duplicate slashes.
  v_path := regexp_replace(v_path, '/{2,}', '/', 'g');

  -- Keep root as "/" and remove trailing slash for all other paths.
  IF length(v_path) > 1 AND right(v_path, 1) = '/' THEN
    v_path := rtrim(v_path, '/');
  END IF;

  RETURN v_path;
END;
$$;

CREATE TABLE IF NOT EXISTS public.seo_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_key TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'en', -- noqa: RF04
    CHECK (locale IN ('en', 'ar')),
    title TEXT,
    description TEXT,
    canonical_url TEXT,
    robots_index BOOLEAN NOT NULL DEFAULT true,
    robots_follow BOOLEAN NOT NULL DEFAULT true,
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    twitter_title TEXT,
    twitter_description TEXT,
    twitter_image_url TEXT,
    keywords TEXT [],
    schema_override JSONB,
    ai_summary TEXT,
    llms_include BOOLEAN NOT NULL DEFAULT true,
    llms_priority INTEGER NOT NULL DEFAULT 0,
    updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT seo_overrides_route_locale_unique UNIQUE (route_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_seo_overrides_route_key
ON public.seo_overrides (route_key);
CREATE INDEX IF NOT EXISTS idx_seo_overrides_locale
ON public.seo_overrides (locale);
CREATE INDEX IF NOT EXISTS idx_seo_overrides_llms
ON public.seo_overrides (llms_include, llms_priority DESC);

CREATE OR REPLACE FUNCTION public.seo_overrides_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.route_key := public.normalize_route_path(NEW.route_key);
  NEW.locale := lower(coalesce(NULLIF(btrim(NEW.locale), ''), 'en'));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_overrides_set_defaults ON public.seo_overrides;
CREATE TRIGGER trg_seo_overrides_set_defaults
BEFORE INSERT OR UPDATE ON public.seo_overrides
FOR EACH ROW
EXECUTE FUNCTION public.seo_overrides_set_defaults();

ALTER TABLE public.seo_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seo_overrides_read_all ON public.seo_overrides;
CREATE POLICY seo_overrides_read_all
ON public.seo_overrides
FOR SELECT
USING (true);

DROP POLICY IF EXISTS seo_overrides_insert_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_insert_managed
ON public.seo_overrides
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);

DROP POLICY IF EXISTS seo_overrides_update_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_update_managed
ON public.seo_overrides
FOR UPDATE
USING (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
)
WITH CHECK (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);

DROP POLICY IF EXISTS seo_overrides_delete_managed ON public.seo_overrides;
CREATE POLICY seo_overrides_delete_managed
ON public.seo_overrides
FOR DELETE
USING (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);

CREATE TABLE IF NOT EXISTS public.route_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_path TEXT NOT NULL UNIQUE,
    to_path TEXT NOT NULL,
    code INTEGER NOT NULL DEFAULT 301 CHECK (code IN (301, 302, 307, 308)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    source TEXT,
    source_metadata JSONB,
    created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_redirects_from_path
ON public.route_redirects (from_path);
CREATE INDEX IF NOT EXISTS idx_route_redirects_active
ON public.route_redirects (is_active, from_path);

CREATE OR REPLACE FUNCTION public.route_redirects_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.from_path := public.normalize_route_path(NEW.from_path);
  NEW.to_path := public.normalize_route_path(NEW.to_path);
  NEW.updated_at := now();

  IF NEW.from_path = NEW.to_path THEN
    RAISE EXCEPTION 'Redirect from_path and to_path cannot be identical.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_route_redirects_set_defaults
ON public.route_redirects;
CREATE TRIGGER trg_route_redirects_set_defaults
BEFORE INSERT OR UPDATE ON public.route_redirects
FOR EACH ROW
EXECUTE FUNCTION public.route_redirects_set_defaults();

ALTER TABLE public.route_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS route_redirects_read_active ON public.route_redirects;
CREATE POLICY route_redirects_read_active
ON public.route_redirects
FOR SELECT
USING (
    is_active = true
    OR auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.read')
);

DROP POLICY IF EXISTS route_redirects_insert_managed ON public.route_redirects;
CREATE POLICY route_redirects_insert_managed
ON public.route_redirects
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);

DROP POLICY IF EXISTS route_redirects_update_managed ON public.route_redirects;
CREATE POLICY route_redirects_update_managed
ON public.route_redirects
FOR UPDATE
USING (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
)
WITH CHECK (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);

DROP POLICY IF EXISTS route_redirects_delete_managed ON public.route_redirects;
CREATE POLICY route_redirects_delete_managed
ON public.route_redirects
FOR DELETE
USING (
    auth.role() = 'service_role'
    OR public.current_user_has_permission('cms.write')
);
