import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("registers the medical facilities CMS block schemas and defaults", () => {
  const source = readSource("src/lib/cms/blocks.ts");

  assert.match(source, /type:\s*z\.literal\("medicalFacilitiesDirectory"\)/);
  assert.match(source, /type:\s*z\.literal\("medicalFacilityProfile"\)/);
  assert.match(source, /medicalFacilitiesDirectory:\s*\{/);
  assert.match(source, /medicalFacilityProfile:\s*\{/);
  assert.match(source, /label:\s*"Medical Facilities Directory"/);
  assert.match(source, /label:\s*"Medical Facility Profile"/);
});

test("wires the new facilities blocks into the preview and templates", () => {
  const previewSource = readSource("src/components/cms/PreviewRenderer.tsx");
  const templatesSource = readSource("src/lib/cms/templates.ts");

  assert.match(previewSource, /case "medicalFacilitiesDirectory":/);
  assert.match(previewSource, /case "medicalFacilityProfile":/);
  assert.match(templatesSource, /slug: "medical-facilities-global"/);
  assert.match(templatesSource, /slug: "medical-facilities-detail-global"/);
  assert.match(templatesSource, /buildCallToActionBaseStyle\("dark"\)/);
  assert.match(templatesSource, /variant: "outline"/);
});

test("exposes a quick CTA preset that matches the shared CMS page styling", () => {
  const inspectorSource = readSource(
    "src/components/cms/editor/BlockInspector.tsx",
  );

  assert.match(inspectorSource, /label: "Shared CMS CTA"/);
  assert.match(inspectorSource, /layout: "split"/);
  assert.match(inspectorSource, /background: "dark"/);
  assert.match(inspectorSource, /actionVariants: \["default", "outline"\]/);
});
