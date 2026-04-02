import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("blog routes no longer import code fallback templates", () => {
  const files = [
    "src/app/(public)/[locale]/blog/page.tsx",
    "src/app/(public)/[locale]/blog/[category]/page.tsx",
    "src/app/(public)/[locale]/blog/tag/[slug]/page.tsx",
    "src/app/(public)/[locale]/blog/author/[slug]/page.tsx",
    "src/app/(public)/[locale]/blog/[category]/[slug]/page.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.doesNotMatch(
      source,
      /import \{ getTemplate \} from "@\/lib\/cms\/templates"/,
    );
    assert.doesNotMatch(source, /fallbackTemplate/);
    assert.match(source, /getLocalizedCmsPageBySlug/);
  }
});

test("blog page helper resolves only stored CMS blocks", () => {
  const source = readSource("src/lib/blog/page-helpers.ts");

  assert.match(source, /normalizeBlocks\(cmsPage\?\.content \?\? \[\]\)/);
  assert.doesNotMatch(source, /fallbackTemplate/);
});

test("blog CMS template migration backfills published English and Arabic content", () => {
  const source = readSource(
    "supabase/migrations/20260402193000_backfill_blog_cms_templates_from_fallbacks.sql",
  );

  assert.match(source, /UPDATE public\.cms_pages/);
  assert.match(source, /WHERE slug = 'blog-post-template'/);
  assert.match(source, /INSERT INTO public\.cms_page_translations/);
  assert.match(source, /'published'/);
  assert.match(source, /"type": "blogArticleBody"/);
});
