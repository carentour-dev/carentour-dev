import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("blog landing fallback hero defines a background image", () => {
  const templateFile = path.resolve("src/lib/cms/templates.ts");
  const source = fs.readFileSync(templateFile, "utf8");

  assert.ok(
    source.includes('slug: "blog-global"'),
    "expected blog-global template to exist",
  );
  assert.ok(
    source.includes('backgroundImageUrl: "/blog-medical-tourism.jpg"'),
    "expected blog fallback hero backgroundImageUrl to be populated",
  );
});
