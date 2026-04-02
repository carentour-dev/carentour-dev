import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("blog post editor no longer exposes per-post block builders", () => {
  const source = readSource("src/components/cms/BlogPostEditor.tsx");

  assert.doesNotMatch(source, /PageBuilder/);
  assert.doesNotMatch(source, /pre_body_blocks/);
  assert.doesNotMatch(source, /post_body_blocks/);
  assert.match(source, /page template controls the post layout/i);
});

test("blog article body block renders only article content and toc", () => {
  const source = readSource(
    "src/components/cms/blocks/BlogArticleBodyBlock.tsx",
  );

  assert.doesNotMatch(source, /NestedBlocks/);
  assert.doesNotMatch(source, /pre_body_blocks/);
  assert.doesNotMatch(source, /post_body_blocks/);
  assert.match(source, /<BlogContent content=\{post\.content as any\} \/>/);
});

test("blog post APIs stop selecting translation block zones", () => {
  const listRoute = readSource("src/app/api/cms/blog/posts/route.ts");
  const detailRoute = readSource("src/app/api/cms/blog/posts/[id]/route.ts");

  assert.doesNotMatch(listRoute, /pre_body_blocks/);
  assert.doesNotMatch(listRoute, /post_body_blocks/);
  assert.doesNotMatch(detailRoute, /pre_body_blocks/);
  assert.doesNotMatch(detailRoute, /post_body_blocks/);
});

test("blog translation schema no longer defines post-adjacent block columns", () => {
  const initialMigration = readSource(
    "supabase/migrations/20260402120000_add_blog_locale_translation_tables.sql",
  );
  const cleanupMigration = readSource(
    "supabase/migrations/20270402120000_drop_blog_post_adjacent_block_columns.sql",
  );

  assert.doesNotMatch(initialMigration, /pre_body_blocks/);
  assert.doesNotMatch(initialMigration, /post_body_blocks/);
  assert.match(cleanupMigration, /DROP COLUMN IF EXISTS pre_body_blocks/);
  assert.match(cleanupMigration, /DROP COLUMN IF EXISTS post_body_blocks/);
});
