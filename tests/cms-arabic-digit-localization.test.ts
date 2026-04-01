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

  assert.match(source, /export function getPublicNumberLocale/);
  assert.match(source, /locale === "ar" \? "ar-EG" : "en-US"/);
  assert.match(source, /export function localizeDigits/);
  assert.match(source, /ARABIC_INDIC_DIGITS/);
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
    /localizeDigits\(String\(index \+ 1\)\.padStart\(2, "0"\), locale\)/,
  );
  assert.match(
    serviceCatalogSource,
    /localizeDigits\(String\(index \+ 1\)\.padStart\(2, "0"\), locale\)/,
  );
  assert.match(
    storyNarrativeSource,
    /localizeDigits\(String\(index \+ 1\)\.padStart\(2, "0"\), locale\)/,
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
});
