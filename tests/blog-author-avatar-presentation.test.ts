import assert from "node:assert/strict";
import test from "node:test";

import { getAuthorAvatarPresentation } from "@/lib/blog/authorAvatar";

test("renders blog author avatars without cropping square artwork", () => {
  for (const size of ["compact", "feature", "grid"] as const) {
    const presentation = getAuthorAvatarPresentation(size);

    assert.equal(presentation.imageClassName, "object-contain");
  }
});
