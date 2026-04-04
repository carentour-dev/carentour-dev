import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("adds translation tables and cascade relationships for treatments and procedures", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270403170000_add_treatment_translation_tables.sql",
  );

  assert.match(
    migrationSource,
    /CREATE TABLE IF NOT EXISTS public\.treatment_translations/,
  );
  assert.match(
    migrationSource,
    /treatment_id uuid NOT NULL REFERENCES public\.treatments \(id\) ON DELETE CASCADE/,
  );
  assert.match(
    migrationSource,
    /CREATE TABLE IF NOT EXISTS public\.treatment_procedure_translations/,
  );
  assert.match(
    migrationSource,
    /treatment_procedure_id uuid NOT NULL REFERENCES public\.treatment_procedures \(id\) ON DELETE CASCADE/,
  );
  assert.match(migrationSource, /status text NOT NULL DEFAULT 'draft'/);
  assert.match(migrationSource, /is_stale boolean NOT NULL DEFAULT false/);
});

test("keeps stable procedure ids and marks Arabic translations stale from the treatment module", () => {
  const moduleSource = readSource("src/server/modules/treatments/module.ts");

  assert.match(moduleSource, /const upsertProcedures = async/);
  assert.match(moduleSource, /\.update\(buildProcedureUpdatePayload/);
  assert.match(moduleSource, /\.insert\(\[buildProcedurePayload/);
  assert.match(moduleSource, /const markTreatmentTranslationsStale = async/);
  assert.match(moduleSource, /havePublicProcedureFieldsChanged/);
  assert.match(moduleSource, /locale === "ar"/);
  assert.match(moduleSource, /Create the English treatment first/);
  assert.match(moduleSource, /Arabic publish validation failed/);
});
