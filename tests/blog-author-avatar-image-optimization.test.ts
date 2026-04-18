import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("optimized image wrapper lets callers override optimization props", () => {
  const source = readSource("src/components/OptimizedImage.tsx");

  assert.match(
    source,
    /<NextImage src=\{src\} \{\.\.\.optimizationProps\} \{\.\.\.props\} \/>/,
  );
});

test("blog author avatar surfaces opt out of image optimization", () => {
  for (const relativePath of [
    "src/components/blog/AuthorCard.tsx",
    "src/app/(public)/[locale]/blog/author/[slug]/BlogAuthorPageClient.tsx",
    "src/components/cms/blocks/BlogTaxonomyGridBlockContent.tsx",
    "src/app/(internal)/cms/blog/authors/page.tsx",
  ]) {
    const source = readSource(relativePath);

    assert.match(source, /unoptimized/);
  }
});
