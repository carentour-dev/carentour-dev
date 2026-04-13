import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("CMS blog feed block uses infinite archive loading for archive pages", () => {
  const source = readSource("src/components/cms/blocks/BlogPostFeedBlock.tsx");

  assert.match(source, /resolveInfiniteArchiveRequest/);
  assert.match(source, /BlogPostFeedInfiniteArchive/);
  assert.match(
    source,
    /if \(infiniteArchiveRequest && result\.totalPages > 1\)/,
  );
});

test("infinite archive client watches a sentinel and fetches localized archive pages", () => {
  const clientSource = readSource(
    "src/components/cms/blocks/BlogPostFeedInfiniteArchive.tsx",
  );
  const blockSource = readSource(
    "src/components/cms/blocks/BlogPostFeedBlock.tsx",
  );

  assert.match(clientSource, /new IntersectionObserver/);
  assert.match(clientSource, /\/api\/blog\/archive\?/);
  assert.match(clientSource, /scope: request\.scope/);
  assert.match(clientSource, /Load more articles/);
  assert.match(blockSource, /slug: blog\.(category|tag|author)\.slug/);
});

test("localized blog archive API resolves archive scope through localized slugs", () => {
  const source = readSource("src/app/api/blog/archive/route.ts");

  assert.match(source, /resolvePublicLocaleFromRequest\(request\)/);
  assert.match(source, /getLocalizedBlogCategoryBySlug/);
  assert.match(source, /getLocalizedBlogTagBySlug/);
  assert.match(source, /getLocalizedBlogAuthorBySlug/);
  assert.match(source, /listLocalizedBlogPosts/);
});
