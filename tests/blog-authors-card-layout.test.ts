import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps CMS author cards wrap-safe for Arabic status badges", () => {
  const source = readSource("src/app/(internal)/cms/blog/authors/page.tsx");

  assert.match(source, /const isArabicLocale = locale === "ar";/);
  assert.match(source, /className="mt-2 flex flex-wrap items-center gap-2"/);
  assert.match(source, /isArabicLocale \? "text-right" : ""/);
  assert.match(
    source,
    /author\.status === "published" \? "Published" : "Draft"/,
  );
});
