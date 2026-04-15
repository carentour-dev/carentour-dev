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
      /export const revalidate = \d+;/,
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

test("sitemap resolves Arabic locale availability in parallel with timeouts", () => {
  const source = readSource("src/app/sitemap.ts");

  assert.match(source, /const INVENTORY_TIMEOUT_MS = \d+;/);
  assert.match(source, /const LOCALE_AVAILABILITY_TIMEOUT_MS = \d+;/);
  assert.match(source, /inventory = await withTimeout\(/);
  assert.match(source, /const arabicAvailability = await Promise\.all\(/);
  assert.match(source, /getPublicLocaleAvailability\(entry\.pathname, "ar"\)/);
  assert.doesNotMatch(
    source,
    /if \(await getPublicLocaleAvailability\(entry\.pathname, "ar"\)\)/,
  );
});

test("public SEO inventory excludes non-routable template and patient story URLs", () => {
  const source = readSource("src/lib/seo/data.ts");

  assert.match(
    source,
    /const NON_ROUTABLE_PUBLIC_CMS_PAGE_SLUGS = new Set\(\[/,
  );
  assert.match(source, /"medical-facilities-detail-template"/);
  assert.match(
    source,
    /if \(NON_ROUTABLE_PUBLIC_CMS_PAGE_SLUGS\.has\(page\.slug\)\) \{\s*continue;\s*\}/,
  );
  assert.doesNotMatch(source, /sourceType:\s*"patient-story"/);
});

test("public testimonials and story cards do not link to non-public patient pages", () => {
  const sources = [
    readSource("src/components/Testimonials.tsx"),
    readSource("src/components/DoctorReviews.tsx"),
    readSource("src/app/(public)/[locale]/stories/StoriesPageClient.tsx"),
  ];

  for (const source of sources) {
    assert.doesNotMatch(source, /href=\{`\/patients\//);
    assert.doesNotMatch(source, /href=\"\/patients\//);
  }
});

test("header navigation refresh tracks link data instead of only link count", () => {
  const source = readSource("src/components/Header.tsx");

  assert.match(source, /const visibleInitialNavigationLinks = useMemo\(/);
  assert.match(
    source,
    /const hasPreloadedNavigation = visibleInitialNavigationLinks\.length > 0;/,
  );
  assert.match(source, /useEffect\(\(\) => \{/);
  assert.match(
    source,
    /if \(hasPreloadedNavigation\) \{\s*setNavigationLinks\(\[\]\);\s*setLoadingNavigation\(false\);\s*return;\s*\}/,
  );
  assert.match(source, /\}, \[hasPreloadedNavigation, locale\]\);/);
  assert.match(
    source,
    /const displayedNavigationLinks = hasPreloadedNavigation\s+\? visibleInitialNavigationLinks/,
  );
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
