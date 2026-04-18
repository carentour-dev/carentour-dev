import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedRedirectTargetPath,
  getRedirectLookupPathCandidates,
} from "../src/lib/seo/redirect-paths.ts";

test("redirect lookup tries both localized and locale-stripped Arabic paths", () => {
  assert.deepEqual(
    getRedirectLookupPathCandidates("/ar/blog/cosmetic-surgery"),
    ["/ar/blog/cosmetic-surgery", "/blog/cosmetic-surgery"],
  );
});

test("redirect lookup keeps a single candidate for unlocalized paths", () => {
  assert.deepEqual(getRedirectLookupPathCandidates("/blog/cosmetic-surgery"), [
    "/blog/cosmetic-surgery",
  ]);
});

test("Arabic redirects localize unprefixed public targets", () => {
  assert.equal(
    getLocalizedRedirectTargetPath("/ar/blog/cosmetic-surgery", "/blog/slug"),
    "/ar/blog/slug",
  );
});

test("Arabic redirects preserve already localized targets", () => {
  assert.equal(
    getLocalizedRedirectTargetPath(
      "/ar/blog/cosmetic-surgery",
      "/ar/blog/الجراحة-التجميلية",
    ),
    "/ar/blog/الجراحة-التجميلية",
  );
});
