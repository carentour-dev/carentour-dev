import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("Arabic blog dynamic routes decode localized path segments before lookups", () => {
  const articleSource = readSource(
    "src/app/(public)/[locale]/blog/[category]/[slug]/page.tsx",
  );
  const categorySource = readSource(
    "src/app/(public)/[locale]/blog/[category]/page.tsx",
  );
  const tagSource = readSource(
    "src/app/(public)/[locale]/blog/tag/[slug]/page.tsx",
  );
  const authorSource = readSource(
    "src/app/(public)/[locale]/blog/author/[slug]/page.tsx",
  );

  for (const source of [
    articleSource,
    categorySource,
    tagSource,
    authorSource,
  ]) {
    assert.match(source, /decodePublicRouteSegment/);
  }

  assert.match(
    articleSource,
    /const category = decodePublicRouteSegment\(rawCategory\);[\s\S]*const slug = decodePublicRouteSegment\(rawSlug\);/,
  );
  assert.match(
    categorySource,
    /const category = decodePublicRouteSegment\(rawCategory\);/,
  );
  assert.match(tagSource, /const slug = decodePublicRouteSegment\(rawSlug\);/);
  assert.match(
    authorSource,
    /const slug = decodePublicRouteSegment\(rawSlug\);/,
  );
});

test("Arabic blog locale switching decodes localized slugs before resolving alternates", () => {
  const localizationSource = readSource("src/lib/public/localization.ts");
  const serverSource = readSource("src/lib/blog/server.ts");

  assert.match(
    localizationSource,
    /split\("\/"\)\s*\.filter\(Boolean\)\s*\.map\(\(segment\) => decodePathSegment\(segment\)\)/,
  );
  assert.match(
    serverSource,
    /categorySlug: decodePathSegment\(segments\[1\]\)/,
  );
  assert.match(serverSource, /postSlug: decodePathSegment\(segments\[2\]\)/);
});
