import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("registers the treatment detail CMS block and template wiring", () => {
  const blocksSource = readSource("src/lib/cms/blocks.ts");
  const previewSource = readSource("src/components/cms/PreviewRenderer.tsx");
  const templatesSource = readSource("src/lib/cms/templates.ts");

  assert.match(blocksSource, /type:\s*z\.literal\("treatmentDetail"\)/);
  assert.match(blocksSource, /treatmentDetail:\s*\{/);
  assert.match(blocksSource, /label:\s*"Treatment Detail"/);
  assert.match(previewSource, /case "treatmentDetail":/);
  assert.match(templatesSource, /slug: "treatment-detail-global"/);
  assert.match(templatesSource, /defaultSlug: "treatment-detail-template"/);
});

test("keeps the treatment detail CMS template non-routable and off navigation", () => {
  const genericPageSource = readSource(
    "src/app/(public)/[locale]/[slug]/page.tsx",
  );
  const seoDataSource = readSource("src/lib/seo/data.ts");
  const navigationSource = readSource("src/lib/navigation.ts");

  assert.match(genericPageSource, /"treatment-detail-template"/);
  assert.match(seoDataSource, /"treatment-detail-template"/);
  assert.match(navigationSource, /"treatment-detail-template"/);
});

test("routes treatment detail pages through the CMS block renderer", () => {
  const routeSource = readSource(
    "src/app/(public)/[locale]/treatments/[category]/page.tsx",
  );

  assert.match(
    routeSource,
    /const DETAIL_TEMPLATE_PAGE_SLUG = "treatment-detail-template"/,
  );
  assert.match(routeSource, /getTreatmentCmsPage/);
  assert.match(routeSource, /<BlockRenderer/);
  assert.match(routeSource, /treatmentDetail: detail/);
  assert.match(routeSource, /treatmentSlug: category/);
});

test("seeds the treatment detail shell in Supabase", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270419120000_seed_treatment_detail_cms_page.sql",
  );

  assert.match(migrationSource, /INSERT INTO public\.cms_pages/);
  assert.match(migrationSource, /'treatment-detail-template'/);
  assert.match(migrationSource, /"type": "treatmentDetail"/);
});
