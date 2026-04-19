import assert from "node:assert/strict";
import test from "node:test";

import { filterOrphanedNavigationRows } from "../src/lib/navigation.ts";
import type { Database } from "../src/integrations/supabase/types.ts";

type NavigationRow = Database["public"]["Tables"]["navigation_links"]["Row"];
type CmsPageReference = Pick<
  Database["public"]["Tables"]["cms_pages"]["Row"],
  "id" | "slug"
>;

function createNavigationRow(overrides: Partial<NavigationRow>): NavigationRow {
  return {
    id: "nav-1",
    label: "Sample",
    slug: "sample",
    href: "/sample",
    status: "published",
    position: 1,
    kind: "manual",
    cms_page_id: null,
    created_at: "2026-03-29T00:00:00.000Z",
    updated_at: "2026-03-29T00:00:00.000Z",
    ...overrides,
  };
}

test("keeps linked CMS navigation rows when the page still exists", () => {
  const rows = [
    createNavigationRow({
      id: "nav-cms",
      slug: "about",
      href: "/about",
      kind: "cms",
      cms_page_id: "page-about",
    }),
  ];
  const cmsPages: CmsPageReference[] = [{ id: "page-about", slug: "about" }];

  assert.deepEqual(filterOrphanedNavigationRows(rows, cmsPages), rows);
});

test("drops CMS navigation rows whose linked page was deleted", () => {
  const rows = [
    createNavigationRow({
      id: "nav-orphan",
      slug: "travel-info",
      href: "/travel-info",
      kind: "cms",
      cms_page_id: null,
    }),
    createNavigationRow({
      id: "nav-manual",
      slug: "contact",
      href: "/contact",
      label: "Contact",
      kind: "manual",
      cms_page_id: null,
    }),
  ];
  const cmsPages: CmsPageReference[] = [{ id: "page-home", slug: "home" }];

  assert.deepEqual(filterOrphanedNavigationRows(rows, cmsPages), [rows[1]]);
});

test("drops internal blog template navigation rows even when the CMS pages exist", () => {
  const rows = [
    createNavigationRow({
      id: "nav-blog-template",
      slug: "blog-post-template",
      href: "/blog-post-template",
      label: "Blog Post Template",
      kind: "cms",
      cms_page_id: "page-blog-template",
    }),
    createNavigationRow({
      id: "nav-contact",
      slug: "contact",
      href: "/contact",
      label: "Contact",
      kind: "manual",
      cms_page_id: null,
    }),
  ];
  const cmsPages: CmsPageReference[] = [
    { id: "page-blog-template", slug: "blog-post-template" },
    { id: "page-contact", slug: "contact" },
  ];

  assert.deepEqual(filterOrphanedNavigationRows(rows, cmsPages), [rows[1]]);
});

test("drops linked internal CMS template rows even when the navigation slug is custom", () => {
  const rows = [
    createNavigationRow({
      id: "nav-treatment-template",
      slug: "treatment-detail-shell",
      href: "/treatment-detail-template",
      label: "Treatment Detail Shell",
      kind: "cms",
      cms_page_id: "page-treatment-template",
    }),
    createNavigationRow({
      id: "nav-about",
      slug: "about",
      href: "/about",
      label: "About",
      kind: "cms",
      cms_page_id: "page-about",
    }),
  ];
  const cmsPages: CmsPageReference[] = [
    { id: "page-treatment-template", slug: "treatment-detail-template" },
    { id: "page-about", slug: "about" },
  ];

  assert.deepEqual(filterOrphanedNavigationRows(rows, cmsPages), [rows[1]]);
});
