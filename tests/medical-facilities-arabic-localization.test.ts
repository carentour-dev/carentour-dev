import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("enables Arabic CMS-backed Medical Facilities routes", () => {
  const localizationSource = readSource("src/lib/public/localization.ts");
  const listingPageSource = readSource(
    "src/app/(public)/[locale]/medical-facilities/page.tsx",
  );
  const detailPageSource = readSource(
    "src/app/(public)/[locale]/medical-facilities/[slug]/page.tsx",
  );

  assert.doesNotMatch(
    localizationSource,
    /const ARABIC_UNSUPPORTED_PREFIXES = \[[\s\S]*"\/medical-facilities"/,
  );
  assert.match(
    localizationSource,
    /normalized\.startsWith\("\/medical-facilities\/"\)/,
  );
  assert.match(
    localizationSource,
    /getLocalizedCmsPageBySlug\(\s*"medical-facilities-detail-template"/,
  );
  assert.match(
    listingPageSource,
    /getLocalizedCmsPageBySlug\("medical-facilities", locale\)/,
  );
  assert.match(
    detailPageSource,
    /getLocalizedCmsPageBySlug\(\s*DETAIL_TEMPLATE_PAGE_SLUG,\s*locale,\s*\)/,
  );
});

test("keeps Medical Facilities links locale-aware in the Arabic public experience", () => {
  const headerSource = readSource("src/components/Header.tsx");
  const directorySource = readSource(
    "src/components/cms/blocks/MedicalFacilitiesDirectoryClient.tsx",
  );
  const profileSource = readSource(
    "src/components/cms/blocks/MedicalFacilityProfileContent.tsx",
  );

  assert.match(
    headerSource,
    /localizePublicPathnameWithFallback\(\s*"\/consultation",\s*locale,\s*\)/,
  );
  assert.match(directorySource, /useLocale\(\) as PublicLocale/);
  assert.match(directorySource, /localizePublicPathname\(/);
  assert.match(profileSource, /useLocale\(\) as PublicLocale/);
  assert.match(profileSource, /medicalFacilitiesHref = localizePublicPathname/);
  assert.match(profileSource, /contactHref = localizePublicPathname/);
  assert.match(
    profileSource,
    /startJourneyHref = localizePublicPathnameWithFallback/,
  );
});
