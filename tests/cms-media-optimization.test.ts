import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  buildCmsProcessedUpload,
  isOptimizableCmsImageMimeType,
  optimizeCmsImage,
} from "../src/server/cms/imageProcessing.ts";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("CMS image optimizer converts large images to capped WebP derivatives", async () => {
  const input = await sharp({
    create: {
      width: 2600,
      height: 1400,
      channels: 3,
      background: "#d6ab62",
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();

  const optimized = await optimizeCmsImage(input);

  assert.equal(optimized.mimeType, "image/webp");
  assert.equal(optimized.width, 2400);
  assert.ok(optimized.height > 0);
  assert.ok(optimized.byteSize > 0);
});

test("CMS upload processing preserves originals and returns optimized public paths", async () => {
  const input = await sharp({
    create: {
      width: 900,
      height: 600,
      channels: 4,
      background: { r: 20, g: 120, b: 180, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();

  const processed = await buildCmsProcessedUpload({
    file: input,
    fileName: "Hero Image.PNG",
    mimeType: "image/png",
    folder: "cms/home-hero",
  });

  assert.equal(processed.optimized, true);
  assert.match(processed.originalPath, /^originals\/cms\/home-hero\//);
  assert.match(processed.optimizedPath, /^cms\/home-hero\//);
  assert.match(processed.optimizedPath, /\.webp$/);
  assert.equal(processed.optimizedMimeType, "image/webp");
});

test("non-optimized media types bypass image conversion", async () => {
  const input = Buffer.from("not an image");
  const processed = await buildCmsProcessedUpload({
    file: input,
    fileName: "brochure.pdf",
    mimeType: "application/pdf",
    folder: "admin/treatments",
  });

  assert.equal(isOptimizableCmsImageMimeType("image/gif"), false);
  assert.equal(processed.optimized, false);
  assert.equal(processed.originalBuffer, input);
  assert.equal(processed.optimizedBuffer, input);
  assert.equal(processed.optimizedMimeType, "application/pdf");
});

test("CMS media upload route is permission checked and returns original metadata", () => {
  const source = readSource("src/app/api/admin/storage/upload/route.ts");

  assert.match(source, /requirePermission\("cms\.media"\)/);
  assert.match(source, /originalPath/);
  assert.match(source, /optimizedByteSize/);
});

test("media migration script defaults to dry-run and writes a rollback manifest", () => {
  const source = readSource("scripts/optimize-cms-media.mjs");

  assert.match(source, /const apply = args\.has\("--apply"\)/);
  assert.match(source, /manifest\.records\.push/);
  assert.match(source, /oldUrl/);
  assert.match(source, /newUrl/);
  assert.match(source, /Run again with --apply/);
});
