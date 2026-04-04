import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("gates Arabic treatment routes on published treatment translations", () => {
  const localizationSource = readSource("src/lib/public/localization.ts");
  const publicReaderSource = readSource(
    "src/server/modules/treatments/public.ts",
  );

  assert.match(
    localizationSource,
    /normalized\.startsWith\("\/treatments\/"\)/,
  );
  assert.match(
    localizationSource,
    /hasPublishedArabicTreatmentTranslation\(slug\)/,
  );
  assert.match(publicReaderSource, /from\("treatment_translations"\)/);
  assert.match(publicReaderSource, /\.eq\("status", "published"\)/);
});

test("uses localized server-side treatment readers for public Arabic SEO and rendering", () => {
  const listingPageSource = readSource(
    "src/app/(public)/[locale]/treatments/page.tsx",
  );
  const detailPageSource = readSource(
    "src/app/(public)/[locale]/treatments/[category]/page.tsx",
  );
  const cmsServerSource = readSource("src/lib/cms/server.ts");

  assert.match(listingPageSource, /getPublicTreatmentIndexItems\(locale\)/);
  assert.match(
    detailPageSource,
    /getLocalizedPublicTreatmentDetail\(locale,\s*category\)/,
  );
  assert.match(
    detailPageSource,
    /<TreatmentCategoryPageClient[\s\S]*treatment=\{detail\.treatment\}/,
  );
  assert.match(
    cmsServerSource,
    /getLocalizedPublicTreatments\(\{[\s\S]*locale,/,
  );
});

test("keeps Arabic treatment cards and detail views on localized public routes", () => {
  const featuredCardsSource = readSource(
    "src/components/home/FeaturedTreatmentsSection.tsx",
  );
  const specialtiesCatalogSource = readSource(
    "src/components/cms/blocks/TreatmentSpecialtiesCatalog.tsx",
  );
  const detailClientSource = readSource(
    "src/app/(public)/[locale]/treatments/[category]/TreatmentCategoryPageClient.tsx",
  );

  assert.match(featuredCardsSource, /localizePublicPathnameWithFallback/);
  assert.match(
    featuredCardsSource,
    /localizePublicPathname\(\s*`\/treatments\/\$\{treatment\.slug\}`,\s*locale,\s*\)/,
  );
  assert.match(
    specialtiesCatalogSource,
    /localizePublicPathname\(\s*`\/treatments\/\$\{card\.slug\}`,\s*locale,\s*\)/,
  );
  assert.match(detailClientSource, /const isArabicLocale = locale === "ar"/);
  assert.match(detailClientSource, /backToAllTreatments/);
});

test("localizes Arabic treatment payload copy and price comparison country labels", () => {
  const detailClientSource = readSource(
    "src/app/(public)/[locale]/treatments/[category]/TreatmentCategoryPageClient.tsx",
  );
  const listingClientSource = readSource(
    "src/app/(public)/[locale]/treatments/TreatmentsPageClient.tsx",
  );
  const priceComparisonSource = readSource(
    "src/components/PriceComparison.tsx",
  );
  const countrySource = readSource("src/lib/public/countries.ts");

  assert.match(
    detailClientSource,
    /localizeCompanyNameDeep\(normalizedTreatment, locale\)/,
  );
  assert.match(
    listingClientSource,
    /localizeCompanyNameDeep\(treatment, locale\)/,
  );
  assert.match(
    priceComparisonSource,
    /localizeCountryName\(country\.country, locale\)/,
  );
  assert.match(
    priceComparisonSource,
    /localizeCompanyName\(treatment, locale\)/,
  );
  assert.match(
    countrySource,
    /new Intl\.DisplayNames\(\["en"\],\s*\{\s*type: "region"/,
  );
  assert.match(
    countrySource,
    /new Intl\.DisplayNames\(\["ar"\],\s*\{\s*type: "region"/,
  );
  assert.match(countrySource, /COUNTRY_CODE_ALIAS_BY_KEY/);
  assert.match(countrySource, /ksa:\s*"SA"/);
  assert.match(countrySource, /uae:\s*"AE"/);
  assert.match(countrySource, /turkey:\s*"TR"/);
  assert.match(countrySource, /COUNTRY_CODE_BY_NAME/);
});

test("exposes Arabic treatment translation editing in the admin treatments screen", () => {
  const adminPageSource = readSource(
    "src/app/(internal)/admin/treatments/page.tsx",
  );

  assert.match(adminPageSource, /<CmsLocaleSwitcher/);
  assert.match(adminPageSource, /Edit Arabic Translation/);
  assert.match(adminPageSource, /Save draft/);
  assert.match(adminPageSource, /Publish Arabic/);
  assert.match(adminPageSource, /AR Stale/);
  assert.match(adminPageSource, /No AR/);
});
