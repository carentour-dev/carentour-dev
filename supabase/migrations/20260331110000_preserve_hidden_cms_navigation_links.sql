CREATE OR REPLACE FUNCTION public.sync_navigation_link_for_cms_page()
RETURNS TRIGGER AS $$
DECLARE
  nav_record public.navigation_links%ROWTYPE;
  slug_record public.navigation_links%ROWTYPE;
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

  IF nav_record.id IS NULL THEN
    SELECT *
      INTO slug_record
    FROM public.navigation_links
    WHERE slug = NEW.slug
      AND cms_page_id IS NULL
    ORDER BY position NULLS LAST, created_at NULLS LAST, id
    LIMIT 1;

    IF slug_record.id IS NOT NULL THEN
      nav_record := slug_record;
    END IF;
  END IF;

  IF NEW.status = 'published' THEN
    IF nav_record.id IS NULL THEN
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
        status = COALESCE(nav_record.status, 'published'),
        kind = 'cms',
        cms_page_id = NEW.id,
        updated_at = now(),
        label = CASE
          WHEN nav_record.cms_page_id = NEW.id
            AND TG_OP = 'UPDATE'
            AND (
              nav_record.label IS NULL
              OR nav_record.label = old_default_label
              OR nav_record.label = nav_record.slug
            ) THEN default_label
          ELSE COALESCE(NULLIF(trim(nav_record.label), ''), default_label)
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
