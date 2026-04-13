import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("blog publication cron route enforces CRON_SECRET auth", () => {
  const source = readSource(
    "src/app/api/cron/revalidate-blog-publication/route.ts",
  );

  assert.match(source, /process\.env\.CRON_SECRET/);
  assert.match(source, /authorization !== `Bearer \$\{secret\}`/);
});

test("blog publication cron revalidates blog surfaces across locales", () => {
  const source = readSource(
    "src/app/api/cron/revalidate-blog-publication/route.ts",
  );

  assert.match(source, /buildLocalizedBlogLandingPath/);
  assert.match(source, /buildLocalizedBlogCategoryPath/);
  assert.match(source, /buildLocalizedBlogPostPath/);
  assert.match(source, /buildLocalizedBlogAuthorPath/);
  assert.match(source, /buildLocalizedBlogTagPath/);
  assert.match(source, /revalidateSeoPaths\(Array\.from\(paths\)\)/);
});

test("vercel cron is configured for blog publication revalidation", () => {
  const source = readSource("vercel.json");

  assert.match(source, /"path": "\/api\/cron\/revalidate-blog-publication"/);
  assert.match(source, /"schedule": "\* \* \* \* \*"/);
});
