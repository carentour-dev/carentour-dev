import assert from "node:assert/strict";
import test from "node:test";

import { preferNonEmptyBlogText } from "../src/lib/blog/seo-fields.ts";

test("prefers the first non-empty blog seo field", () => {
  assert.equal(
    preferNonEmptyBlogText(
      "",
      "   ",
      "Medical Tourism Egypt Packages Explained",
    ),
    "Medical Tourism Egypt Packages Explained",
  );
});

test("returns undefined when every blog seo field is blank", () => {
  assert.equal(preferNonEmptyBlogText("", "   ", null, undefined), undefined);
});
