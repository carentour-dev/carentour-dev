import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps unsupported Arabic public routes on their English fallback paths", () => {
  const routingSource = readSource("src/lib/public/routing.ts");

  assert.match(routingSource, /PUBLIC_ARABIC_UNSUPPORTED_PREFIXES/);
  assert.match(routingSource, /"\/consultation"/);
  assert.match(routingSource, /"\/start-journey"/);
  assert.match(
    routingSource,
    /export function localizePublicPathnameWithFallback/,
  );
  assert.match(routingSource, /isPublicPathStaticallySupported/);
});

test("syncs document root language and direction with the active public locale", () => {
  const rootLayoutSource = readSource("src/app/layout.tsx");
  const documentAttributesSource = readSource(
    "src/components/public/DocumentRootAttributes.tsx",
  );

  assert.match(rootLayoutSource, /DocumentRootAttributes/);
  assert.match(rootLayoutSource, /<DocumentRootAttributes \/>/);
  assert.match(documentAttributesSource, /usePathname/);
  assert.match(documentAttributesSource, /document\.documentElement/);
  assert.match(documentAttributesSource, /root\.lang = locale/);
  assert.match(
    documentAttributesSource,
    /root\.dir = getPublicDirection\(locale\)/,
  );
});
