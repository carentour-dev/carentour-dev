import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("CMS-linked navigation edit flow still submits custom labels", () => {
  const source = readSource("src/app/(internal)/cms/navigation/page.tsx");

  assert.match(source, /isAutoManaged\(editing\)/);
  assert.match(source, /label:\s*values\.label/);
  assert.match(source, /status:\s*values\.status/);
  assert.match(source, /position:\s*values\.position/);
  assert.match(source, /Menu label/);
  assert.match(
    source,
    /Changes only the navigation item\.[\s\S]*page title or section headings\./,
  );
  assert.match(
    source,
    /Changes only the Arabic navigation item\.[\s\S]*Arabic CMS page content[\s\S]*page title or[\s\S]*section headings\./,
  );
});

test("navigation PATCH keeps custom labels editable for CMS-linked rows", () => {
  const source = readSource("src/app/api/navigation/links/[id]/route.ts");

  assert.match(
    source,
    /const updates = isAutoManaged\s*\?\s*\{\s*label:\s*payload\.label \?\? existing\.label,\s*status:\s*payload\.status \?\? existing\.status,\s*position:\s*payload\.position \?\? existing\.position,\s*\}/s,
  );
  assert.doesNotMatch(
    source,
    /const updates = isAutoManaged\s*\?\s*\{\s*status:\s*payload\.status \?\? existing\.status,\s*position:\s*payload\.position \?\? existing\.position,\s*\}/s,
  );
});
