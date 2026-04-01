import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function readJson(relativePath: string) {
  return JSON.parse(readSource(relativePath)) as Record<string, unknown>;
}

test("public message catalogs include page-level namespaces beyond the shell", () => {
  const enMessages = readJson("messages/en.json");
  const arMessages = readJson("messages/ar.json");

  for (const namespace of [
    "TreatmentsPage",
    "ConciergePage",
    "PriceComparison",
  ]) {
    assert.ok(namespace in enMessages);
    assert.ok(namespace in arMessages);
  }
});

test("treatments, concierge, and price comparison read copy from translations", () => {
  const treatmentsSource = readSource(
    "src/app/(public)/[locale]/treatments/TreatmentsPageClient.tsx",
  );
  const conciergeSource = readSource(
    "src/app/(public)/[locale]/concierge/ConciergePageClient.tsx",
  );
  const priceComparisonSource = readSource(
    "src/components/PriceComparison.tsx",
  );

  assert.match(treatmentsSource, /useTranslations\("TreatmentsPage"\)/);
  assert.match(conciergeSource, /useTranslations\("ConciergePage"\)/);
  assert.match(priceComparisonSource, /useTranslations\("PriceComparison"\)/);
});
