import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("webhook deliveries are accessible only through the service role policy", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270501150000_add_webhook_deliveries_service_role_policy.sql",
  );

  assert.match(
    migrationSource,
    /CREATE POLICY service_role_manages_webhook_deliveries[\s\S]*ON public\.webhook_deliveries[\s\S]*FOR ALL[\s\S]*TO service_role[\s\S]*USING \(true\)[\s\S]*WITH CHECK \(true\);/,
  );
  assert.doesNotMatch(migrationSource, /TO (anon|authenticated|public)/);
});
