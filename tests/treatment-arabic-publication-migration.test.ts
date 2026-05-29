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
  const missingFeaturedMigrationSource = readSource(
    "supabase/migrations/20270530120000_publish_missing_home_featured_arabic_treatment_translations.sql",
  );
  const missingFeaturedProcedureMigrationSource = readSource(
    "supabase/migrations/20270530123000_publish_hair_transplant_arabic_procedure_translations.sql",
  );
  const remainingProcedureMigrationSource = readSource(
    "supabase/migrations/20270530124500_publish_remaining_arabic_procedure_translations.sql",
  );
  const combinedMigrationSource = [
    migrationSource,
    missingFeaturedMigrationSource,
    missingFeaturedProcedureMigrationSource,
    remainingProcedureMigrationSource,
  ].join("\n");

  assert.match(
    combinedMigrationSource,
    /'cosmetic-plastic-surgery'[\s\S]*'dental-treatment'[\s\S]*'ivf-fertility-treatments'[\s\S]*'ophthalmology-surgery'/,
  );
  assert.match(
    combinedMigrationSource,
    /'hair-transplant'[\s\S]*'rhinoplasty'/,
  );
  assert.match(combinedMigrationSource, /'published'/);
  assert.match(combinedMigrationSource, /JSONB_BUILD_OBJECT\(\s*'title'/);
});

test("matches Arabic procedure translations by display order for public procedures", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270404120000_publish_arabic_treatment_translations.sql",
  );
  const missingFeaturedProcedureMigrationSource = readSource(
    "supabase/migrations/20270530123000_publish_hair_transplant_arabic_procedure_translations.sql",
  );
  const remainingProcedureMigrationSource = readSource(
    "supabase/migrations/20270530124500_publish_remaining_arabic_procedure_translations.sql",
  );
  const combinedMigrationSource = [
    migrationSource,
    missingFeaturedProcedureMigrationSource,
    remainingProcedureMigrationSource,
  ].join("\n");

  assert.match(
    combinedMigrationSource,
    /INNER JOIN public\.treatment_procedures AS p[\s\S]*src\.display_order = p\.display_order/,
  );
  assert.match(
    combinedMigrationSource,
    /p\.created_by_provider_id IS NULL[\s\S]*p\.is_public IS DISTINCT FROM FALSE/,
  );
  assert.match(combinedMigrationSource, /'hair-transplant'/);
  assert.match(combinedMigrationSource, /'rhinoplasty'/);
  assert.match(combinedMigrationSource, /'ophthalmology-surgery'/);
  assert.match(combinedMigrationSource, /'ivf-fertility-treatments'/);
  assert.match(
    combinedMigrationSource,
    /INSERT INTO public\.treatment_procedure_translations/,
  );
});
