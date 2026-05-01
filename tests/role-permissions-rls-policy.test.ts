import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("role permissions SELECT policy cleanup preserves authenticated read access", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270501151000_consolidate_role_permissions_select_policy.sql",
  );

  assert.match(
    migrationSource,
    /DROP POLICY IF EXISTS "Role permissions are readable"\s+ON public\.role_permissions;/,
  );
  assert.match(
    migrationSource,
    /DROP POLICY IF EXISTS role_permissions_are_readable\s+ON public\.role_permissions;/,
  );
  assert.match(
    migrationSource,
    /CREATE POLICY role_permissions_are_readable[\s\S]*ON public\.role_permissions[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*USING \(true\);/,
  );
});
