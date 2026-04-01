import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("keeps Arabic CMS SEO isolated from the English base SEO payload", () => {
  const source = readSource("src/lib/public/localization.ts");

  assert.match(
    source,
    /seo:\s*localizeCompanyNameDeep\(localized\.seo \?\? \{\}, locale\)/,
  );
  assert.doesNotMatch(
    source,
    /\.\.\.\(basePage\.seo \?\? \{\}\),[\s\S]*\.\.\.\(localized\.seo \?\? \{\}\)/,
  );
});

test("uses Arabic-safe SEO defaults for Arabic contact, concierge, and travel info pages", () => {
  const contactSource = readSource(
    "src/app/(public)/[locale]/contact/page.tsx",
  );
  const conciergeSource = readSource(
    "src/app/(public)/[locale]/concierge/page.tsx",
  );
  const travelInfoSource = readSource(
    "src/app/(public)/[locale]/travel-info/page.tsx",
  );

  assert.match(contactSource, /اتصل بـ/);
  assert.match(conciergeSource, /خدمات تنسيق المرضى الدوليين/);
  assert.match(
    travelInfoSource,
    /معلومات السفر للمرضى الدوليين القادمين إلى مصر/,
  );
});

test("localizes service schema availability labels for Arabic route SEO", () => {
  const conciergeSource = readSource(
    "src/app/(public)/[locale]/concierge/page.tsx",
  );
  const travelInfoSource = readSource(
    "src/app/(public)/[locale]/travel-info/page.tsx",
  );

  assert.match(conciergeSource, /availabilityLabel: "التوفر"/);
  assert.match(travelInfoSource, /availabilityLabel: "التوفر"/);
  assert.doesNotMatch(
    conciergeSource,
    /`Availability: \$\{service\.availability\}\.`/,
  );
  assert.doesNotMatch(
    travelInfoSource,
    /`Availability: \$\{service\.availability\}\.`/,
  );
});
