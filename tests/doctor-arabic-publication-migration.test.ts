import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("publishes Arabic translations for all active doctors while preserving curated Arabic overrides", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270408123000_publish_arabic_doctor_translations.sql",
  );

  assert.match(
    migrationSource,
    /'Dr\. Ahmed Mansour'[\s\S]*'Dr\. Layla Khalil'[\s\S]*'Dr\. Omar Farouk'[\s\S]*'Dr\. Nadia Salim'[\s\S]*'Dr\. Khaled Rashed'[\s\S]*'Dr\. Youssef Elshamy'/,
  );
  assert.match(migrationSource, /d\.is_active = TRUE/);
  assert.doesNotMatch(migrationSource, /d\.name IN \(/);
  assert.match(migrationSource, /'published' AS status/);
  assert.match(
    migrationSource,
    /LEFT JOIN doctor_translation_overrides AS src[\s\S]*ON d\.name = src\.english_name/,
  );
  assert.match(migrationSource, /COALESCE\(src\.name, d\.name\)/);
  assert.match(migrationSource, /ON CONFLICT \(doctor_id, locale\) DO UPDATE/);
});
