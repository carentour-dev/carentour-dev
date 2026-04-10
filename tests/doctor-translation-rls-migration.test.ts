import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("doctor translation RLS migration replaces FOR ALL with explicit write policies", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270411021000_optimize_doctor_translation_rls_policies.sql",
  );

  assert.match(
    migrationSource,
    /DROP POLICY IF EXISTS write_doctor_translations ON public\.doctor_translations;/,
  );
  assert.match(
    migrationSource,
    /CREATE POLICY insert_doctor_translations[\s\S]*FOR INSERT[\s\S]*WITH CHECK \(public\.is_admin_or_editor\(\)\);/,
  );
  assert.match(
    migrationSource,
    /CREATE POLICY update_doctor_translations[\s\S]*FOR UPDATE[\s\S]*USING \(public\.is_admin_or_editor\(\)\)[\s\S]*WITH CHECK \(public\.is_admin_or_editor\(\)\);/,
  );
  assert.match(
    migrationSource,
    /CREATE POLICY delete_doctor_translations[\s\S]*FOR DELETE[\s\S]*USING \(public\.is_admin_or_editor\(\)\);/,
  );
  assert.doesNotMatch(migrationSource, /FOR ALL/);
});
