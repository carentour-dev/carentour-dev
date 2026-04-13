import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("blog revalidation constants match the Hobby-safe publication strategy", async () => {
  const revalidationModule = await import("../src/lib/blog/revalidation.ts");

  assert.equal(revalidationModule.BLOG_SURFACE_REVALIDATE_SECONDS, 60);
  assert.equal(revalidationModule.BLOG_DISCOVERY_REVALIDATE_SECONDS, 300);
});

test("scheduled publication no longer depends on a Vercel cron config", () => {
  assert.equal(
    fs.existsSync(path.join(workspaceRoot, "vercel.json")),
    false,
    "vercel.json should not define a cron deployment blocker",
  );
  assert.equal(
    fs.existsSync(
      path.join(
        workspaceRoot,
        "src/app/api/cron/revalidate-blog-publication/route.ts",
      ),
    ),
    false,
    "the cron revalidation route should be removed",
  );
});

test("public blog surfaces use the shared short ISR window", () => {
  const blogSurfaceFiles = [
    "src/app/(public)/[locale]/blog/page.tsx",
    "src/app/(public)/[locale]/blog/[category]/page.tsx",
    "src/app/(public)/[locale]/blog/[category]/[slug]/page.tsx",
    "src/app/(public)/[locale]/blog/author/[slug]/page.tsx",
    "src/app/(public)/[locale]/blog/tag/[slug]/page.tsx",
    "src/app/(public-default)/blog/page.tsx",
    "src/app/(public-default)/blog/[category]/page.tsx",
    "src/app/(public-default)/blog/[category]/[slug]/page.tsx",
    "src/app/(public-default)/blog/author/[slug]/page.tsx",
    "src/app/(public-default)/blog/tag/[slug]/page.tsx",
    "src/app/api/blog/archive/route.ts",
    "src/app/api/blog/categories/route.ts",
    "src/app/api/blog/posts/route.ts",
    "src/app/api/blog/related/[id]/route.ts",
    "src/app/api/blog/authors/[slug]/route.ts",
    "src/app/api/blog/tags/[slug]/route.ts",
  ];

  for (const relativePath of blogSurfaceFiles) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /BLOG_SURFACE_REVALIDATE_SECONDS/,
      `${relativePath} should import the shared blog surface revalidation window`,
    );
    assert.match(
      source,
      /export const revalidate = BLOG_SURFACE_REVALIDATE_SECONDS;/,
      `${relativePath} should use the shared blog surface revalidation window`,
    );
  }
});

test("discovery artifacts use the shared discovery revalidation window", () => {
  const discoveryFiles = ["src/app/sitemap.ts", "src/app/llms.txt/route.ts"];

  for (const relativePath of discoveryFiles) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /BLOG_DISCOVERY_REVALIDATE_SECONDS/,
      `${relativePath} should import the shared discovery revalidation window`,
    );
    assert.match(
      source,
      /export const revalidate = BLOG_DISCOVERY_REVALIDATE_SECONDS;/,
      `${relativePath} should use the shared discovery revalidation window`,
    );
  }
});
