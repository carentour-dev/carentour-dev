import assert from "node:assert/strict";
import test from "node:test";

import {
  generateBlogListingMetadata,
  generateBlogPostMetadata,
  generateBlogPostStructuredData,
} from "../src/lib/blog/seo.ts";
import { CANONICAL_ORIGIN } from "../src/lib/seo/constants.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const samplePost = {
  id: "post-1",
  title: "Care N Tour Guide",
  excerpt: "A short summary",
  category: {
    name: "Guides",
    slug: "guides",
  },
  slug: "care-n-tour-guide",
  featured_image: "/cover.jpg",
};

test.afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    return;
  }

  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

test("blog metadata falls back to the canonical www host", () => {
  delete process.env.NEXT_PUBLIC_SITE_URL;

  const metadata = generateBlogPostMetadata(samplePost);

  assert.equal(
    metadata.openGraph?.url,
    `${CANONICAL_ORIGIN}/blog/guides/care-n-tour-guide`,
  );
  assert.deepEqual(metadata.twitter?.images, [`${CANONICAL_ORIGIN}/cover.jpg`]);
});

test("blog structured data falls back to the canonical www host", () => {
  delete process.env.NEXT_PUBLIC_SITE_URL;

  const structuredData = generateBlogPostStructuredData(samplePost);

  assert.equal(
    structuredData.mainEntityOfPage["@id"],
    `${CANONICAL_ORIGIN}/blog/guides/care-n-tour-guide`,
  );
  assert.equal(
    structuredData.publisher.logo.url,
    `${CANONICAL_ORIGIN}/carentour-logo-light.png`,
  );
});

test("blog listing metadata normalizes a trailing slash in explicit base urls", () => {
  const metadata = generateBlogListingMetadata(
    undefined,
    `${CANONICAL_ORIGIN}/`,
  );

  assert.equal(metadata.openGraph?.url, `${CANONICAL_ORIGIN}/blog`);
});
