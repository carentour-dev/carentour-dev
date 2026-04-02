import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("registers the CMS-native bilingual blog block types across schema and renderer layers", () => {
  const blocksSource = readSource("src/lib/cms/blocks.ts");
  const rendererSource = readSource("src/components/cms/BlockRenderer.tsx");
  const previewSource = readSource("src/components/cms/PreviewRenderer.tsx");

  assert.match(blocksSource, /type:\s*z\.literal\("blogPostFeed"\)/);
  assert.match(blocksSource, /type:\s*z\.literal\("blogTaxonomyGrid"\)/);
  assert.match(blocksSource, /type:\s*z\.literal\("blogArticleHero"\)/);
  assert.match(blocksSource, /type:\s*z\.literal\("blogArticleBody"\)/);
  assert.match(blocksSource, /type:\s*z\.literal\("blogAuthorSummary"\)/);
  assert.match(rendererSource, /case "blogPostFeed":/);
  assert.match(rendererSource, /case "blogTaxonomyGrid":/);
  assert.match(rendererSource, /case "blogArticleHero":/);
  assert.match(rendererSource, /case "blogArticleBody":/);
  assert.match(rendererSource, /case "blogAuthorSummary":/);
  assert.match(previewSource, /case "blogPostFeed":/);
  assert.match(previewSource, /case "blogArticleBody":/);
});

test("cuts public blog routes over to CMS block rendering without route-level shell duplication", () => {
  const landingSource = readSource("src/app/(public)/[locale]/blog/page.tsx");
  const categorySource = readSource(
    "src/app/(public)/[locale]/blog/[category]/page.tsx",
  );
  const postSource = readSource(
    "src/app/(public)/[locale]/blog/[category]/[slug]/page.tsx",
  );

  assert.match(landingSource, /<BlockRenderer/);
  assert.match(categorySource, /<BlockRenderer/);
  assert.match(postSource, /<BlockRenderer/);
  assert.doesNotMatch(landingSource, /import Header/);
  assert.doesNotMatch(landingSource, /import Footer/);
  assert.doesNotMatch(categorySource, /import Header/);
  assert.doesNotMatch(postSource, /import Footer/);
});

test("treats blog routes as Arabic-capable and resolves locale switches through translated blog slugs", () => {
  const routingSource = readSource("src/lib/public/routing.ts");
  const localizationSource = readSource("src/lib/public/localization.ts");

  assert.match(routingSource, /PUBLIC_ARABIC_UNSUPPORTED_PREFIXES/);
  assert.doesNotMatch(routingSource, /"\/blog"/);
  assert.match(localizationSource, /resolveLocalizedBlogSwitchPath/);
  assert.match(
    localizationSource,
    /normalized === "\/blog" \|\| normalized\.startsWith\("\/blog\/"\)/,
  );
  assert.match(
    localizationSource,
    /if \(normalized\.startsWith\("\/blog\/"\)\)/,
  );
  assert.match(
    localizationSource,
    /const segments = normalized\.split\("\/"\)/,
  );
});

test("keeps internal blog templates out of the generic CMS route inventory", () => {
  const genericPageSource = readSource(
    "src/app/(public)/[locale]/[slug]/page.tsx",
  );
  const seoInventorySource = readSource("src/lib/seo/data.ts");

  assert.match(genericPageSource, /BLOG_INTERNAL_TEMPLATE_SLUGS/);
  assert.match(genericPageSource, /\.\.\.BLOG_INTERNAL_TEMPLATE_SLUGS/);
  assert.match(seoInventorySource, /BLOG_INTERNAL_TEMPLATE_SLUGS/);
  assert.match(
    seoInventorySource,
    /if \(BLOG_INTERNAL_TEMPLATE_SLUGS\.has\(page\.slug\)\)/,
  );
});
