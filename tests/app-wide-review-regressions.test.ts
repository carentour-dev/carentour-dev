import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function collectPublicDefaultPages(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectPublicDefaultPages(absolutePath);
    }
    return entry.name === "page.tsx" ? [absolutePath] : [];
  });
}

test("default-locale public wrappers export module-level revalidate", () => {
  const wrapperDir = path.join(workspaceRoot, "src/app/(public-default)");
  const pages = collectPublicDefaultPages(wrapperDir);

  assert.ok(pages.length > 0, "expected public-default wrapper pages to exist");

  for (const absolutePath of pages) {
    const source = fs.readFileSync(absolutePath, "utf8");
    assert.match(
      source,
      /export const revalidate = 300;/,
      `${path.relative(workspaceRoot, absolutePath)} should export revalidate`,
    );
  }
});

test("blog CMS mutations revalidate landing, category, and post paths", () => {
  const createSource = readSource("src/app/api/cms/blog/posts/route.ts");
  const mutationSource = readSource("src/app/api/cms/blog/posts/[id]/route.ts");

  assert.match(createSource, /buildLocalizedBlogLandingPath\("en"\)/);
  assert.match(
    createSource,
    /buildLocalizedBlogCategoryPath\(categorySlug, "en"\)/,
  );
  assert.match(
    createSource,
    /buildLocalizedBlogPostPath\(categorySlug, input\.postSlug, "en"\)/,
  );
  assert.match(
    mutationSource,
    /buildLocalizedBlogLandingPath\(input\.locale\)/,
  );
  assert.match(
    mutationSource,
    /buildLocalizedBlogCategoryPath\(categorySlug, input\.locale\)/,
  );
  assert.match(
    mutationSource,
    /buildLocalizedBlogPostPath\(\s*categorySlug,\s*currentPostSlug,\s*input\.locale,\s*\)/,
  );
  assert.match(
    mutationSource,
    /buildLocalizedBlogPostPath\(\s*categorySlug,\s*oldPostSlug,\s*input\.locale\)/,
  );
});

test("localized blog APIs resolve slugs from the request locale", () => {
  const postApiSource = readSource(
    "src/app/api/blog/posts/[category]/[slug]/route.ts",
  );
  const tagApiSource = readSource("src/app/api/blog/tags/[slug]/route.ts");
  const authorApiSource = readSource(
    "src/app/api/blog/authors/[slug]/route.ts",
  );

  for (const source of [postApiSource, tagApiSource, authorApiSource]) {
    assert.match(source, /resolvePublicLocaleFromRequest\(request\)/);
  }
});

test("admin locale helper supports readonly search params inputs", () => {
  const source = readSource("src/lib/public/adminLocale.ts");

  assert.match(
    source,
    /type SearchParamsLike = Pick<URLSearchParams, "get" \| "toString">;/,
  );
  assert.match(
    source,
    /export function resolveAdminLocale\(\s*request: NextRequest \| SearchParamsLike,/,
  );
});

test("user profile hook guards against stale async writes", () => {
  const source = readSource("src/hooks/useUserProfile.ts");

  assert.match(
    source,
    /const inFlightUserIdRef = useRef<string \| null>\(null\);/,
  );
  assert.match(
    source,
    /const hydratedUserIdRef = useRef<string \| null>\(null\);/,
  );
  assert.match(
    source,
    /const isActiveRequest = \(\) => inFlightUserIdRef\.current === requestedUserId;/,
  );
  assert.match(source, /if \(!isActiveRequest\(\)\) \{\s*return;\s*\}/);
});

test("SEO revalidation helper also refreshes generated crawl artifacts", () => {
  const source = readSource("src/lib/seo/revalidate.ts");

  assert.match(source, /revalidatePath\("\/sitemap\.xml"\);/);
  assert.match(source, /revalidatePath\("\/robots\.txt"\);/);
  assert.match(source, /revalidatePath\("\/llms\.txt"\);/);
});

test("header navigation refresh tracks link data instead of only link count", () => {
  const source = readSource("src/components/Header.tsx");

  assert.match(
    source,
    /useLayoutEffect\(\(\) => \{\s*setNavigationLinks\(visibleInitialNavigationLinks\);/,
  );
  assert.match(source, /\}, \[visibleInitialNavigationLinks\]\);/);
  assert.match(source, /\}, \[locale, visibleInitialNavigationLinks\]\);/);
});

test("blog transient timers are cleared on unmount", () => {
  const newsletterSource = readSource(
    "src/components/blog/NewsletterSubscribe.tsx",
  );
  const shareSource = readSource("src/components/blog/SocialShare.tsx");

  assert.match(
    newsletterSource,
    /const resetTimerRef = useRef<ReturnType<typeof setTimeout> \| null>\(null\);/,
  );
  assert.match(newsletterSource, /clearTimeout\(resetTimerRef\.current\);/);
  assert.match(
    shareSource,
    /const copiedResetTimerRef = useRef<ReturnType<typeof setTimeout> \| null>\(/,
  );
  assert.match(shareSource, /clearTimeout\(copiedResetTimerRef\.current\);/);
});

test("eslint keeps React compiler-era rules enabled by default and scopes waivers", () => {
  const source = readSource("eslint.config.js");

  assert.match(source, /"react-hooks\/incompatible-library": "error"/);
  assert.match(source, /"react-hooks\/preserve-manual-memoization": "error"/);
  assert.match(source, /"react-hooks\/set-state-in-effect": "error"/);
  assert.match(source, /"react-hooks\/static-components": "error"/);
  assert.match(source, /const reactCompilerIncompatibleLibraryFiles = \[/);
  assert.match(source, /const reactCompilerManualMemoizationFiles = \[/);
  assert.match(source, /const reactCompilerSetStateInEffectFiles = \[/);
  assert.match(source, /const reactCompilerStaticComponentFiles = \[/);
});
