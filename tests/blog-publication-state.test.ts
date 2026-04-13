import assert from "node:assert/strict";
import test from "node:test";

import {
  isBlogPostPubliclyVisible,
  resolveBlogPostPublicationState,
} from "../src/lib/blog/publication.ts";

test("treats future-dated published posts as scheduled in CMS", () => {
  assert.equal(
    resolveBlogPostPublicationState({
      status: "published",
      publishDate: "2099-06-01T09:00:00.000Z",
      now: "2099-06-01T08:59:00.000Z",
    }),
    "scheduled",
  );
});

test("treats published posts at or before publish_date as published", () => {
  assert.equal(
    resolveBlogPostPublicationState({
      status: "published",
      publishDate: "2099-06-01T09:00:00.000Z",
      now: "2099-06-01T09:00:00.000Z",
    }),
    "published",
  );
});

test("keeps legacy scheduled rows in scheduled state", () => {
  assert.equal(
    resolveBlogPostPublicationState({
      status: "scheduled",
      publishDate: "2099-06-01T09:00:00.000Z",
      now: "2099-06-01T12:00:00.000Z",
    }),
    "scheduled",
  );
});

test("only exposes currently published posts to the public", () => {
  assert.equal(
    isBlogPostPubliclyVisible({
      status: "published",
      publishDate: "2099-06-01T09:00:00.000Z",
      now: "2099-06-01T08:59:00.000Z",
    }),
    false,
  );

  assert.equal(
    isBlogPostPubliclyVisible({
      status: "published",
      publishDate: "2099-06-01T09:00:00.000Z",
      now: "2099-06-01T09:01:00.000Z",
    }),
    true,
  );
});
