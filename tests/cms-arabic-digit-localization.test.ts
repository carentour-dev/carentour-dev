import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps a shared Arabic digit-localization helper for public rendering", () => {
  const source = readSource("src/lib/public/numbers.ts");
  const contactSource = readSource("src/lib/public/contact.ts");

  assert.match(source, /export function getPublicNumberLocale/);
  assert.match(source, /locale === "ar" \? "ar-EG" : "en-US"/);
  assert.match(source, /export function localizeDigits/);
  assert.match(source, /ARABIC_INDIC_DIGITS/);
  assert.match(contactSource, /export function getPhoneNumberDisplayDirection/);
  assert.match(contactSource, /PUBLIC_CONTACT_ADDRESS_DISPLAY_AR/);
});

test("routes CMS stat-like blocks through Arabic digit localization", () => {
  const statGridSource = readSource(
    "src/components/cms/blocks/StatGridBlock.tsx",
  );
  const trustSignalsSource = readSource(
    "src/components/cms/blocks/TrustSignalsBlock.tsx",
  );
  const serviceCatalogSource = readSource(
    "src/components/cms/blocks/ServiceCatalogBlock.tsx",
  );
  const storyNarrativeSource = readSource(
    "src/components/cms/blocks/StoryNarrativeBlock.tsx",
  );

  assert.match(statGridSource, /localizeOptionalDigits\(item\.value, locale\)/);
  assert.match(
    trustSignalsSource,
    /localizeDigits\([\s\S]*String\(index \+ 1\)\.padStart\(2, "0"\)[\s\S]*locale[\s\S]*\)/,
  );
  assert.match(
    serviceCatalogSource,
    /localizeDigits\([\s\S]*String\(index \+ 1\)\.padStart\(2, "0"\)[\s\S]*locale[\s\S]*\)/,
  );
  assert.match(
    storyNarrativeSource,
    /localizeDigits\([\s\S]*String\(index \+ 1\)\.padStart\(2, "0"\)[\s\S]*locale[\s\S]*\)/,
  );
});

test("threads locale through published and preview CMS renderers", () => {
  const blockRendererSource = readSource(
    "src/components/cms/BlockRenderer.tsx",
  );
  const previewRendererSource = readSource(
    "src/components/cms/PreviewRenderer.tsx",
  );

  assert.match(blockRendererSource, /locale\?: PublicLocale/);
  assert.match(
    blockRendererSource,
    /<TrustSignalsBlock key=\{key\} block=\{block\} locale=\{locale\} \/>/,
  );
  assert.match(
    blockRendererSource,
    /<FeatureGridBlock key=\{key\} block=\{block\} locale=\{locale\} \/>/,
  );
  assert.match(
    previewRendererSource,
    /<JourneyStepsBlock[\s\S]*locale=\{locale\}[\s\S]*\/>/,
  );
  assert.match(
    previewRendererSource,
    /<DifferentiatorsBlock[\s\S]*locale=\{locale\}[\s\S]*\/>/,
  );
});

test("localizes Arabic digits in legacy home-style CMS sections", () => {
  const journeyStepsSource = readSource(
    "src/components/home/JourneyStepsSection.tsx",
  );
  const differentiatorsSource = readSource(
    "src/components/home/DifferentiatorsSection.tsx",
  );
  const homeHeroSource = readSource("src/components/home/HomeHeroSection.tsx");
  const homeCtaSource = readSource("src/components/home/HomeCtaSection.tsx");
  const aboutHeroSource = readSource(
    "src/components/cms/blocks/AboutHeroBlock.tsx",
  );

  assert.match(
    journeyStepsSource,
    /localizeDigits\(String\(index \+ 1\), locale\)/,
  );
  assert.match(
    journeyStepsSource,
    /localizeOptionalDigits\(step\.title, locale\)/,
  );
  assert.match(
    differentiatorsSource,
    /localizeOptionalDigits\(item\.highlight, locale\)/,
  );
  assert.match(
    homeHeroSource,
    /localizeOptionalDigits\([\s\S]*content\.primaryAction\.label,[\s\S]*locale[\s\S]*\)/,
  );
  assert.match(
    homeCtaSource,
    /localizeOptionalDigits\(content\.headingHighlight, locale\)/,
  );
  assert.match(
    aboutHeroSource,
    /localizeOptionalDigits\(highlight\.label, locale\)/,
  );
});

test("localizes numeric strings in structured CMS grids and listings", () => {
  const dataGridSource = readSource(
    "src/components/cms/blocks/DataGridBlock.tsx",
  );
  const infoPanelsSource = readSource(
    "src/components/cms/blocks/InfoPanelsBlock.tsx",
  );
  const featureGridSource = readSource(
    "src/components/cms/blocks/FeatureGridBlockContent.tsx",
  );
  const treatmentCatalogSource = readSource(
    "src/components/cms/blocks/TreatmentSpecialtiesCatalog.tsx",
  );
  const advisoryNoticeSource = readSource(
    "src/components/cms/blocks/AdvisoryNoticeBlock.tsx",
  );
  const leadershipGridSource = readSource(
    "src/components/cms/blocks/LeadershipGridBlock.tsx",
  );
  const serviceCatalogSource = readSource(
    "src/components/cms/blocks/ServiceCatalogBlock.tsx",
  );

  assert.match(dataGridSource, /localizeOptionalDigits\(row\.title, locale\)/);
  assert.match(
    infoPanelsSource,
    /localizeOptionalDigits\(panel\.title, locale\)/,
  );
  assert.match(
    featureGridSource,
    /localizeOptionalDigits\(stepLabel, locale\)/,
  );
  assert.match(
    treatmentCatalogSource,
    /new Intl\.NumberFormat\(getPublicNumberLocale\(locale\)\)/,
  );
  assert.match(advisoryNoticeSource, /return "آخر مراجعة";/);
  assert.match(advisoryNoticeSource, /"إرشادات محدثة"/);
  assert.match(
    serviceCatalogSource,
    /locale === "ar" \? "اللغات" : "Languages"/,
  );
  assert.match(
    leadershipGridSource,
    /locale === "ar" \? "اللغات:" : "Languages:"/,
  );
});

test("renders Arabic contact details with localized digits and rtl phone direction", () => {
  const headerSource = readSource("src/components/Header.tsx");
  const footerSource = readSource("src/components/Footer.tsx");
  const contactBlockSource = readSource(
    "src/components/cms/blocks/ContactFormEmbedBlockContent.tsx",
  );

  assert.match(headerSource, /dir=\{phoneNumberDirection\}/);
  assert.match(footerSource, /getPublicContactAddressDisplay\(locale\)/);
  assert.match(footerSource, /dir=\{phoneNumberDirection\}/);
  assert.match(
    contactBlockSource,
    /localizeOptionalDigits\(channel\.content, locale\)/,
  );
  assert.match(contactBlockSource, /isTelephone[\s\S]*phoneNumberDirection/);
});
