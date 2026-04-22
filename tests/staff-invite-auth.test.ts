import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCompleteStaffInviteSessionTokens,
  hasStaffInviteLoginInformation,
  isAllowedStaffInviteFlowType,
  parseStaffInviteHref,
} from "../src/lib/auth/staff-invite.ts";

test("detects invite login information from hash session tokens", () => {
  const params = parseStaffInviteHref(
    "https://carentour.com/staff/onboarding#access_token=abc&refresh_token=def&type=magiclink",
  );

  assert.equal(params.accessToken, "abc");
  assert.equal(params.refreshToken, "def");
  assert.equal(params.flowType, "magiclink");
  assert.equal(hasCompleteStaffInviteSessionTokens(params), true);
  assert.equal(hasStaffInviteLoginInformation(params), true);
});

test("detects invite login information from auth code redirects", () => {
  const params = parseStaffInviteHref(
    "https://carentour.com/staff/onboarding?code=invite-code&type=invite",
  );

  assert.equal(params.code, "invite-code");
  assert.equal(params.flowType, "invite");
  assert.equal(hasCompleteStaffInviteSessionTokens(params), false);
  assert.equal(hasStaffInviteLoginInformation(params), true);
});

test("rejects non-invite flow types", () => {
  assert.equal(isAllowedStaffInviteFlowType("recovery"), false);
  assert.equal(isAllowedStaffInviteFlowType("magiclink"), true);
  assert.equal(isAllowedStaffInviteFlowType("invite"), true);
  assert.equal(isAllowedStaffInviteFlowType(null), true);
});
