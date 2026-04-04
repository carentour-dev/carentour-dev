import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps unsupported Arabic public routes on their English fallback paths", () => {
  const routingSource = readSource("src/lib/public/routing.ts");

  assert.match(routingSource, /PUBLIC_ARABIC_UNSUPPORTED_PREFIXES/);
  assert.match(routingSource, /"\/consultation"/);
  assert.doesNotMatch(routingSource, /"\/start-journey"/);
  assert.match(
    routingSource,
    /export function localizePublicPathnameWithFallback/,
  );
  assert.match(routingSource, /isPublicPathStaticallySupported/);
});

test("syncs document root language and direction with the active public locale", () => {
  const rootLayoutSource = readSource("src/app/layout.tsx");
  const documentAttributesSource = readSource(
    "src/components/public/DocumentRootAttributes.tsx",
  );

  assert.match(rootLayoutSource, /DocumentRootAttributes/);
  assert.match(rootLayoutSource, /<DocumentRootAttributes \/>/);
  assert.match(documentAttributesSource, /usePathname/);
  assert.match(documentAttributesSource, /document\.documentElement/);
  assert.match(documentAttributesSource, /root\.lang = locale/);
  assert.match(
    documentAttributesSource,
    /root\.dir = getPublicDirection\(locale\)/,
  );
});

test("uses locale-aware start journey links across public pages and CMS blocks", () => {
  const localizationSource = readSource("src/lib/public/localization.ts");
  const managedHrefSource = readSource("src/lib/managedHrefs.ts");
  const doctorsPageSource = readSource(
    "src/app/(public)/[locale]/doctors/DoctorsPageClient.tsx",
  );
  const storiesPageSource = readSource(
    "src/app/(public)/[locale]/stories/StoriesPageClient.tsx",
  );
  const facilitiesDirectorySource = readSource(
    "src/components/cms/blocks/MedicalFacilitiesDirectoryClient.tsx",
  );
  const homeCtaSource = readSource("src/components/home/HomeCtaSection.tsx");
  const homeHeroSource = readSource("src/components/home/HomeHeroSection.tsx");
  const doctorsBlockSource = readSource(
    "src/components/cms/blocks/DoctorsBlockContent.tsx",
  );
  const treatmentsBlockSource = readSource(
    "src/components/cms/blocks/TreatmentsBlockContent.tsx",
  );
  const callToActionSource = readSource(
    "src/components/cms/blocks/CallToActionBlock.tsx",
  );
  const heroBlockSource = readSource("src/components/cms/blocks/HeroBlock.tsx");
  const imageFeatureSource = readSource(
    "src/components/cms/blocks/ImageFeatureBlock.tsx",
  );
  const advisoryNoticeSource = readSource(
    "src/components/cms/blocks/AdvisoryNoticeBlock.tsx",
  );
  const richTextSource = readSource(
    "src/components/cms/blocks/RichTextBlock.tsx",
  );
  const serviceCatalogSource = readSource(
    "src/components/cms/blocks/ServiceCatalogBlock.tsx",
  );
  const tabbedGuideSource = readSource(
    "src/components/cms/blocks/TabbedGuideContent.tsx",
  );

  assert.match(localizationSource, /LOCALIZED_APP_STATIC_PATHS/);
  assert.match(localizationSource, /"\/start-journey"/);
  assert.match(
    managedHrefSource,
    /export function getLocalizedSafeManagedHref/,
  );
  assert.match(
    managedHrefSource,
    /localizePublicPathnameWithFallback\(pathname \|\| "\/", locale\)/,
  );
  assert.match(
    localizationSource,
    /if \(LOCALIZED_APP_STATIC_PATHS\.has\(normalized\)\) \{\s*return true;\s*\}/,
  );
  assert.match(
    doctorsPageSource,
    /localizePublicPathnameWithFallback\(\s*"\/start-journey",\s*locale,\s*\)/,
  );
  assert.match(
    storiesPageSource,
    /localizePublicPathnameWithFallback\(\s*"\/start-journey",\s*locale,\s*\)/,
  );
  assert.match(
    facilitiesDirectorySource,
    /localizePublicPathnameWithFallback\(\s*"\/start-journey",\s*locale,\s*\)/,
  );
  assert.match(homeCtaSource, /localizePublicPathnameWithFallback/);
  assert.match(homeHeroSource, /localizePublicPathnameWithFallback/);
  assert.match(
    doctorsBlockSource,
    /localizePublicPathnameWithFallback\("\/start-journey",\s*locale\)/,
  );
  assert.match(
    treatmentsBlockSource,
    /localizePublicPathnameWithFallback\("\/start-journey",\s*locale\)/,
  );
  assert.match(callToActionSource, /getLocalizedSafeManagedHref/);
  assert.match(heroBlockSource, /getLocalizedSafeManagedHref/);
  assert.match(imageFeatureSource, /getLocalizedSafeManagedHref/);
  assert.match(advisoryNoticeSource, /getLocalizedSafeManagedHref/);
  assert.match(richTextSource, /getLocalizedSafeManagedHref/);
  assert.match(serviceCatalogSource, /getLocalizedSafeManagedHref/);
  assert.match(tabbedGuideSource, /getLocalizedSafeManagedHref/);
});
