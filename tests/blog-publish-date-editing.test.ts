import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("new blog post publish action preserves an editor-selected publish date", () => {
  const source = readSource("src/app/(internal)/cms/blog/posts/new/page.tsx");

  assert.match(
    source,
    /publish_date:\s*selectedPublishDate\s*\?\?\s*new Date\(\)\.toISOString\(\)/,
  );
});

test("edit blog post publish action preserves an edited publish date", () => {
  const source = readSource(
    "src/app/(internal)/cms/blog/posts/[id]/edit/page.tsx",
  );

  assert.match(
    source,
    /publish_date:\s*selectedPublishDate\s*\?\?\s*new Date\(\)\.toISOString\(\)/,
  );
});
