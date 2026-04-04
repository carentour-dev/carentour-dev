import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("publishes Arabic translations for the live public treatment slugs", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270404120000_publish_arabic_treatment_translations.sql",
  );

  assert.match(
    migrationSource,
    /'cosmetic-plastic-surgery'[\s\S]*'dental-treatment'[\s\S]*'ivf-fertility-treatments'[\s\S]*'ophthalmology-surgery'/,
  );
  assert.match(migrationSource, /'published'/);
  assert.match(migrationSource, /JSONB_BUILD_OBJECT\(\s*'title'/);
});

test("matches Arabic procedure translations by display order for public procedures", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270404120000_publish_arabic_treatment_translations.sql",
  );

  assert.match(
    migrationSource,
    /INNER JOIN public\.treatment_procedures AS p[\s\S]*src\.display_order = p\.display_order/,
  );
  assert.match(
    migrationSource,
    /p\.created_by_provider_id IS NULL[\s\S]*p\.is_public IS DISTINCT FROM FALSE/,
  );
});
