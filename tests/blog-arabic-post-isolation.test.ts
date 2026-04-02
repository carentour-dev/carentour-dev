import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("Arabic CMS blog post responses no longer fall back to English post fields", () => {
  const listSource = readSource("src/app/api/cms/blog/posts/route.ts");
  const detailSource = readSource("src/app/api/cms/blog/posts/[id]/route.ts");

  assert.match(
    listSource,
    /title:\s*locale === "ar" \? normalizeText\(translation\?\.title\) : post\.title/,
  );
  assert.match(
    detailSource,
    /title:\s*locale === "ar" \? normalizeText\(translation\?\.title\) : post\.title/,
  );
  assert.doesNotMatch(
    listSource,
    /title:\s*normalizeText\(translation\?\.title\) \|\| post\.title/,
  );
  assert.doesNotMatch(
    detailSource,
    /title:\s*normalizeText\(translation\?\.title\) \|\| post\.title/,
  );
});

test("Arabic public blog posts render translation content without English copy fallback", () => {
  const source = readSource("src/lib/blog/server.ts");

  assert.match(source, /\? cleanText\(entry\.translation\?\.title\) \?\? ""/);
  assert.doesNotMatch(
    source,
    /\? cleanText\(entry\.translation\?\.title\) \?\? entry\.base\.title/,
  );
  assert.doesNotMatch(
    source,
    /\? cleanText\(entry\.translation\?\.excerpt\) \?\? entry\.base\.excerpt/,
  );
});

test("Arabic blog translations require their own title and slug before publishing", () => {
  const source = readSource("src/app/api/cms/blog/posts/[id]/route.ts");

  assert.match(
    source,
    /Arabic title and slug are required before publishing this translation/,
  );
  assert.match(
    source,
    /if \(nextStatus === "published" && \(!normalizeText\(title\) \|\| !normalizeText\(slug\)\)\)/,
  );
});
