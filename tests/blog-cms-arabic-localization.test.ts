import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps a shared blog localization helper for CMS and shared blog ui", () => {
  const source = readSource("src/lib/blog/localization.ts");

  assert.match(source, /export function resolveBlogUiText/);
  assert.match(source, /featuredBadge: "مقالة مميزة"/);
  assert.match(source, /listCtaLabel: "اقرأ المقال"/);
  assert.match(source, /publishDateLabel: "تاريخ النشر"/);
  assert.match(source, /updatedLabel: "آخر تحديث"/);
  assert.match(source, /new Intl\.DateTimeFormat/);
});

test("routes CMS blog blocks through localized fallback labels on arabic pages", () => {
  const heroSource = readSource(
    "src/components/cms/blocks/BlogArticleHeroBlock.tsx",
  );
  const feedSource = readSource(
    "src/components/cms/blocks/BlogPostFeedBlock.tsx",
  );
  const bodySource = readSource(
    "src/components/cms/blocks/BlogArticleBodyBlock.tsx",
  );
  const taxonomySource = readSource(
    "src/components/cms/blocks/BlogTaxonomyGridBlock.tsx",
  );
  const summarySource = readSource(
    "src/components/cms/blocks/BlogAuthorSummaryBlock.tsx",
  );
  const rendererSource = readSource("src/components/cms/BlockRenderer.tsx");

  assert.match(heroSource, /resolveBlogUiText\("backLabel"/);
  assert.match(
    heroSource,
    /formatBlogMetadataDate\(post\.publish_date, locale\)/,
  );
  assert.match(
    heroSource,
    /formatBlogReadingTime\(post\.reading_time, locale\)/,
  );
  assert.match(feedSource, /resolveBlogUiText\(\s*"featuredBadge"/);
  assert.match(
    feedSource,
    /<BlogPostCard key=\{post\.id\} post=\{post\} locale=\{locale\} \/>/,
  );
  assert.match(
    bodySource,
    /resolveBlogUiText\("tocHeading", locale, block\.tocHeading\)/,
  );
  assert.match(taxonomySource, /resolveBlogUiText\(\s*"taxonomyCtaLabel"/);
  assert.match(summarySource, /resolveBlogUiText\(\s*"authorArchiveLinkLabel"/);
  assert.match(
    rendererSource,
    /<BlogAuthorSummaryBlock[\s\S]*locale=\{locale\}/,
  );
});

test("localizes shared blog components used by CMS article pages", () => {
  const cardSource = readSource("src/components/blog/BlogPostCard.tsx");
  const shareSource = readSource("src/components/blog/SocialShare.tsx");
  const relatedSource = readSource("src/components/blog/RelatedPosts.tsx");
  const tocSource = readSource("src/components/blog/TableOfContents.tsx");

  assert.match(cardSource, /formatBlogCardDate/);
  assert.match(cardSource, /formatBlogReadingTime/);
  assert.match(shareSource, /resolveBlogUiText\("shareLabel"/);
  assert.match(shareSource, /resolveBlogUiText\("copySuccessTitle"/);
  assert.match(relatedSource, /resolveBlogUiText\("relatedHeading"/);
  assert.match(tocSource, /resolveBlogUiText\("tocHeading"/);
});
