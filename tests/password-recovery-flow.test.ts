import assert from "node:assert/strict";
import test from "node:test";
import { isPasswordRecoveryHref } from "../src/lib/auth/password-recovery.ts";

test("detects explicit reset query parameter", () => {
  assert.equal(
    isPasswordRecoveryHref("https://carentour.com/auth?reset=true"),
    true,
  );
});

test("detects recovery type query parameter", () => {
  assert.equal(
    isPasswordRecoveryHref("https://carentour.com/auth?type=recovery"),
    true,
  );
});

test("detects recovery type in hash fragment", () => {
  assert.equal(
    isPasswordRecoveryHref(
      "https://carentour.com/auth#access_token=abc&type=recovery&expires_in=3600",
    ),
    true,
  );
});

test("returns false for normal auth page URLs", () => {
  assert.equal(isPasswordRecoveryHref("https://carentour.com/auth"), false);
  assert.equal(
    isPasswordRecoveryHref("https://carentour.com/auth?tab=signin"),
    false,
  );
});

test("returns false for invalid URL values", () => {
  assert.equal(isPasswordRecoveryHref(""), false);
  assert.equal(isPasswordRecoveryHref("not-a-url"), false);
});
