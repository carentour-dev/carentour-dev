import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicNavigationLinks } from "../src/lib/navigation.ts";
import type { Database } from "../src/integrations/supabase/types.ts";

type NavigationRow = Database["public"]["Tables"]["navigation_links"]["Row"];
type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];

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
    created_at: "2026-03-31T00:00:00.000Z",
    updated_at: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

function createCmsPage(overrides: Partial<CmsPageRow>): CmsPageRow {
  return {
    id: "page-1",
    slug: "sample",
    title: "Sample",
    status: "published",
    seo: null,
    settings: {},
    content: [],
    created_at: "2026-03-31T00:00:00.000Z",
    updated_at: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

test("keeps hidden CMS links out of public navigation without re-adding the page", () => {
  const rows = [
    createNavigationRow({
      id: "nav-hidden-facility-detail",
      label: "Medical Facility Detail Shell",
      slug: "medical-facilities-detail-template",
      href: "/medical-facilities-detail-template",
      status: "hidden",
      kind: "cms",
      cms_page_id: "page-facility-detail",
    }),
  ];

  const cmsPages = [
    createCmsPage({
      id: "page-facility-detail",
      slug: "medical-facilities-detail-template",
      title: "Medical Facility Detail Shell",
      status: "published",
    }),
  ];

  assert.deepEqual(buildPublicNavigationLinks(rows, cmsPages), []);
});

test("auto-adds published CMS pages that have no navigation row yet", () => {
  const cmsPages = [
    createCmsPage({
      id: "page-about",
      slug: "about",
      title: "About Us",
      status: "published",
    }),
  ];

  assert.deepEqual(buildPublicNavigationLinks([], cmsPages), [
    {
      id: "cms-page-about",
      label: "About Us",
      href: "/about",
      slug: "about",
      status: "published",
      position: 1000,
      kind: "cms",
      cmsPageId: "page-about",
    },
  ]);
});

test("does not auto-add internal blog template CMS pages", () => {
  const cmsPages = [
    createCmsPage({
      id: "page-blog-category-template",
      slug: "blog-category-template",
      title: "Blog Category Template",
      status: "published",
    }),
    createCmsPage({
      id: "page-blog-post-template",
      slug: "blog-post-template",
      title: "Blog Post Template",
      status: "published",
    }),
  ];

  assert.deepEqual(buildPublicNavigationLinks([], cmsPages), []);
});
