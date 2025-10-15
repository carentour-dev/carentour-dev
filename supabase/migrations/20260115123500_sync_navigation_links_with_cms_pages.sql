DO $$
BEGIN
  ALTER TABLE public.navigation_links
    ADD CONSTRAINT navigation_links_cms_page_id_key UNIQUE (cms_page_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_navigation_link_for_cms_page()
RETURNS TRIGGER AS $$
DECLARE
  nav_record public.navigation_links%ROWTYPE;
  default_label TEXT;
  old_default_label TEXT;
  nav_href TEXT;
  base_position INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.navigation_links WHERE cms_page_id = OLD.id;
    RETURN OLD;
  END IF;

  default_label := COALESCE(NULLIF(trim(NEW.title), ''), NEW.slug);
  nav_href := CASE WHEN NEW.slug = 'home' THEN '/' ELSE '/' || NEW.slug END;
  old_default_label := NULL;

  IF TG_OP = 'UPDATE' THEN
    old_default_label := COALESCE(NULLIF(trim(OLD.title), ''), OLD.slug);
  END IF;

  SELECT *
    INTO nav_record
  FROM public.navigation_links
  WHERE cms_page_id = NEW.id
  LIMIT 1;

  IF NEW.status = 'published' THEN
    IF nav_record.id IS NULL THEN
      IF EXISTS (SELECT 1 FROM public.navigation_links WHERE slug = NEW.slug) THEN
        RETURN NEW;
      END IF;

      SELECT COALESCE(MAX(position), -10)
        INTO base_position
      FROM public.navigation_links;

      INSERT INTO public.navigation_links (label, slug, href, status, position, kind, cms_page_id)
      VALUES (
        default_label,
        NEW.slug,
        nav_href,
        'published',
        base_position + 10,
        'cms',
        NEW.id
      );
    ELSE
      UPDATE public.navigation_links
      SET
        slug = NEW.slug,
        href = nav_href,
        status = 'published',
        kind = 'cms',
        updated_at = now(),
        label = CASE
          WHEN TG_OP = 'UPDATE' AND (nav_record.label IS NULL OR nav_record.label = old_default_label OR nav_record.label = nav_record.slug) THEN default_label
          ELSE nav_record.label
        END
      WHERE id = nav_record.id;
    END IF;
  ELSE
    IF nav_record.id IS NOT NULL THEN
      UPDATE public.navigation_links
      SET status = 'hidden', updated_at = now()
      WHERE id = nav_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_cms_pages_sync_navigation ON public.cms_pages;

CREATE TRIGGER trg_cms_pages_sync_navigation
AFTER INSERT OR UPDATE OR DELETE ON public.cms_pages
FOR EACH ROW
EXECUTE FUNCTION public.sync_navigation_link_for_cms_page();

WITH existing_positions AS (
    SELECT COALESCE(MAX(position), -10) AS max_position
    FROM
        public.navigation_links
),

published_pages AS (
    SELECT
        cms_page.id,
        cms_page.slug,
        cms_page.title,
        ROW_NUMBER() OVER (ORDER BY cms_page.title) AS rn
    FROM
        public.cms_pages AS cms_page
    LEFT JOIN public.navigation_links AS nav_link
        ON cms_page.id = nav_link.cms_page_id
    WHERE
        cms_page.status = 'published'
        AND nav_link.id IS NULL
        AND NOT EXISTS (
            SELECT 1
            FROM
                public.navigation_links AS other
            WHERE
                other.slug = cms_page.slug
        )
)

INSERT INTO public.navigation_links (
    label,
    slug,
    href,
    status,
    position,
    kind,
    cms_page_id
)
SELECT
    COALESCE(
        NULLIF(TRIM(published_page.title), ''),
        published_page.slug
    ) AS link_label,
    published_page.slug,
    CASE
        WHEN published_page.slug = 'home' THEN '/'
        ELSE '/' || published_page.slug
    END AS href,
    'published' AS published_status,
    existing_positions.max_position + published_page.rn * 10 AS position_offset,
    'cms' AS link_kind,
    published_page.id AS cms_page_id
FROM published_pages AS published_page
CROSS JOIN existing_positions;
