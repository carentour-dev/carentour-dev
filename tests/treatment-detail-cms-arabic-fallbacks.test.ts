import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("applies an Arabic fallback shell for treatment detail CMS blocks", () => {
  const pageSource = readSource(
    "src/app/(public)/[locale]/treatments/[category]/page.tsx",
  );
  const helperSource = readSource(
    "src/lib/public/treatmentDetailCmsFallback.ts",
  );

  assert.match(pageSource, /hasLocalizedTranslation/);
  assert.match(pageSource, /localizeTreatmentDetailCmsFallback/);
  assert.match(helperSource, /locale !== "ar"/);
  assert.match(helperSource, /"حقائق أساسية عن العلاج"/);
  assert.match(helperSource, /"الرجوع إلى جميع العلاجات"/);
  assert.match(helperSource, /"ابدأ رحلتك"/);
});

test("passes the active locale into the treatment detail reviews section", () => {
  const detailClientSource = readSource(
    "src/components/cms/blocks/TreatmentDetailClient.tsx",
  );

  assert.match(detailClientSource, /<DoctorReviews/);
  assert.match(detailClientSource, /locale=\{locale\}/);
});

test("seeds the treatment detail CMS template with a published Arabic translation", () => {
  const migrationSource = readSource(
    "supabase/migrations/20270419123000_add_arabic_treatment_detail_cms_translation.sql",
  );

  assert.match(migrationSource, /INSERT INTO public\.cms_page_translations/);
  assert.match(migrationSource, /'treatment-detail-template'/);
  assert.match(migrationSource, /'ar' AS translation_locale/);
  assert.match(migrationSource, /"حقائق أساسية عن العلاج"/);
  assert.match(migrationSource, /"الرجوع إلى جميع العلاجات"/);
  assert.match(migrationSource, /"ابدأ رحلتك"/);
});

test("keeps the extra treatment detail FAQ question aligned in English, Arabic, and CMS migration updates", () => {
  const templateSource = readSource("src/lib/cms/templates.ts");
  const fallbackSource = readSource(
    "src/lib/public/treatmentDetailCmsFallback.ts",
  );
  const migrationSource = readSource(
    "supabase/migrations/20270419124500_add_treatment_detail_faq_medical_records_question.sql",
  );

  assert.match(
    templateSource,
    /What medical records should I share before treatment planning or travel\?/,
  );
  assert.match(
    fallbackSource,
    /ما السجلات الطبية التي ينبغي أن أشاركها قبل تخطيط العلاج أو السفر؟/,
  );
  assert.match(migrationSource, /UPDATE public\.cms_pages AS page/);
  assert.match(
    migrationSource,
    /UPDATE public\.cms_page_translations AS translation/,
  );
  assert.match(
    migrationSource,
    /What medical records should I share before treatment planning or travel\?/,
  );
  assert.match(
    migrationSource,
    /ما السجلات الطبية التي ينبغي أن أشاركها قبل تخطيط العلاج أو السفر؟/,
  );
});
