import assert from "node:assert/strict";

import { canAutoRedirectToWorkspaceFromPath } from "../src/lib/workspaces/auth-redirect.ts";

assert.equal(canAutoRedirectToWorkspaceFromPath("/auth"), true);
assert.equal(canAutoRedirectToWorkspaceFromPath("/auth/"), true);
assert.equal(canAutoRedirectToWorkspaceFromPath("/"), false);
assert.equal(canAutoRedirectToWorkspaceFromPath("/admin"), false);
assert.equal(canAutoRedirectToWorkspaceFromPath("/operations"), false);
assert.equal(canAutoRedirectToWorkspaceFromPath("/finance"), false);
assert.equal(canAutoRedirectToWorkspaceFromPath("/cms"), false);
assert.equal(canAutoRedirectToWorkspaceFromPath(null), false);
assert.equal(canAutoRedirectToWorkspaceFromPath(undefined), false);

console.log("workspace auth redirect tests passed");
