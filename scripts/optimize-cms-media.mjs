#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const MEDIA_BUCKET = "media";
const MAX_IMAGE_WIDTH = 2400;
const WEBP_QUALITY = 78;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const PUBLIC_ASSET_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const verbose = args.has("--verbose");
const manifestPath =
  process.argv
    .slice(2)
    .find((arg) => arg.startsWith("--manifest="))
    ?.slice("--manifest=".length) ??
  `tmp/cms-media-optimization-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

const tableSpecs = [
  {
    table: "cms_pages",
    idColumn: "id",
    select: "id, slug, content, settings, seo",
    fields: ["content", "settings", "seo"],
    label: (row) => `cms_pages:${row.slug ?? row.id}`,
  },
  {
    table: "cms_page_translations",
    idColumn: "id",
    select: "id, cms_page_id, locale, content, seo",
    fields: ["content", "seo"],
    label: (row) =>
      `cms_page_translations:${row.cms_page_id ?? row.id}:${row.locale}`,
  },
  {
    table: "blog_posts",
    idColumn: "id",
    select: "id, slug, featured_image, og_image, content",
    fields: ["featured_image", "og_image", "content"],
    label: (row) => `blog_posts:${row.slug ?? row.id}`,
  },
  {
    table: "blog_post_translations",
    idColumn: "id",
    select: "id, blog_post_id, locale, og_image, content",
    fields: ["og_image", "content"],
    label: (row) =>
      `blog_post_translations:${row.blog_post_id ?? row.id}:${row.locale}`,
  },
  {
    table: "blog_authors",
    idColumn: "id",
    select: "id, slug, avatar_url",
    fields: ["avatar_url"],
    label: (row) => `blog_authors:${row.slug ?? row.id}`,
  },
  {
    table: "blog_author_translations",
    idColumn: "id",
    select: "id, blog_author_id, locale, avatar_url",
    fields: ["avatar_url"],
    label: (row) =>
      `blog_author_translations:${row.blog_author_id ?? row.id}:${row.locale}`,
  },
  {
    table: "treatments",
    idColumn: "id",
    select: "id, slug, card_image_url, hero_image_url",
    fields: ["card_image_url", "hero_image_url"],
    label: (row) => `treatments:${row.slug ?? row.id}`,
  },
  {
    table: "hotels",
    idColumn: "id",
    select: "id, name, hero_image",
    fields: ["hero_image"],
    label: (row) => `hotels:${row.name ?? row.id}`,
  },
  {
    table: "service_providers",
    idColumn: "id",
    select: "id, name, hero_image, logo_image, images",
    fields: ["hero_image", "logo_image", "images"],
    label: (row) => `service_providers:${row.name ?? row.id}`,
  },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function isImageLike(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const parsed = value.startsWith("http") ? new URL(value) : null;
    const pathname = parsed ? parsed.pathname : (value.split("?")[0] ?? value);
    return IMAGE_EXTENSIONS.has(path.extname(pathname).toLowerCase());
  } catch {
    return false;
  }
}

function getSupabaseMediaPath(value, supabaseUrl) {
  if (typeof value !== "string" || !value.startsWith("http")) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const expectedHost = new URL(supabaseUrl).hostname;
    if (parsed.hostname !== expectedHost) {
      return null;
    }

    const prefixes = [
      `/storage/v1/object/public/${MEDIA_BUCKET}/`,
      `/storage/v1/render/image/public/${MEDIA_BUCKET}/`,
    ];
    const prefix = prefixes.find((candidate) =>
      parsed.pathname.startsWith(candidate),
    );
    if (!prefix) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

function getPublicAssetPath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return null;
  }

  const relative = value.replace(/^\/+/, "");
  if (relative.includes("..") || !isImageLike(value)) {
    return null;
  }

  return path.join(PUBLIC_ASSET_ROOT, relative);
}

function shouldSkipMediaPath(storagePath) {
  return (
    storagePath.startsWith("originals/") ||
    storagePath.startsWith("cms/optimized-migration/")
  );
}

function publicUrlFor(supabase, storagePath) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data
    .publicUrl;
}

function rewriteValue(value, rewrites) {
  if (typeof value === "string") {
    return rewrites.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteValue(item, rewrites));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        rewriteValue(nested, rewrites),
      ]),
    );
  }

  return value;
}

function collectImageReferences(value, output = new Set()) {
  if (typeof value === "string") {
    if (isImageLike(value)) {
      output.add(value);
    }
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageReferences(item, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) =>
      collectImageReferences(item, output),
    );
  }

  return output;
}

async function optimizeBuffer(input) {
  const optimized = await sharp(input, { animated: false })
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
  };
}

async function readSourceBuffer({ value, supabase, supabaseUrl }) {
  const storagePath = getSupabaseMediaPath(value, supabaseUrl);
  if (storagePath) {
    if (shouldSkipMediaPath(storagePath)) {
      return null;
    }

    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .download(storagePath);
    if (error || !data) {
      throw new Error(
        `Failed to download ${storagePath}: ${error?.message ?? "no data"}`,
      );
    }

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      sourcePath: storagePath,
      sourceKind: "supabase",
    };
  }

  const publicPath = getPublicAssetPath(value);
  if (publicPath) {
    const buffer = await fs.readFile(publicPath).catch(() => null);
    if (!buffer) {
      return null;
    }

    return {
      buffer,
      sourcePath: path.relative(PUBLIC_ASSET_ROOT, publicPath),
      sourceKind: "public",
    };
  }

  return null;
}

async function optimizeReference({ value, supabase, supabaseUrl, cache }) {
  if (cache.has(value)) {
    return cache.get(value);
  }

  const source = await readSourceBuffer({ value, supabase, supabaseUrl });
  if (!source) {
    cache.set(value, null);
    return null;
  }

  const optimized = await optimizeBuffer(source.buffer);
  const hash = crypto
    .createHash("sha256")
    .update(value)
    .update(source.buffer)
    .digest("hex")
    .slice(0, 16);
  const baseName =
    path
      .basename(source.sourcePath, path.extname(source.sourcePath))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";
  const optimizedPath = `cms/optimized-migration/${hash}/${baseName}.webp`;
  const originalPath = `originals/optimized-migration/${hash}/${path.basename(source.sourcePath)}`;
  const nextUrl = publicUrlFor(supabase, optimizedPath);
  const result = {
    oldUrl: value,
    newUrl: nextUrl,
    sourceKind: source.sourceKind,
    sourcePath: source.sourcePath,
    originalPath,
    optimizedPath,
    originalByteSize: source.buffer.byteLength,
    optimizedByteSize: optimized.buffer.byteLength,
    width: optimized.width,
    height: optimized.height,
  };

  if (apply) {
    await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(originalPath, source.buffer, {
        upsert: true,
        contentType: "application/octet-stream",
      });
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(optimizedPath, optimized.buffer, {
        upsert: true,
        contentType: "image/webp",
      });
    if (error) {
      throw error;
    }
  }

  cache.set(value, result);
  return result;
}

async function fetchRows(supabase, spec) {
  const { data, error } = await supabase.from(spec.table).select(spec.select);
  if (error) {
    if (verbose) {
      console.warn(`[skip] ${spec.table}: ${error.message}`);
    }
    return [];
  }
  return data ?? [];
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const cache = new Map();
  const manifest = {
    apply,
    generatedAt: new Date().toISOString(),
    rewrites: [],
    records: [],
  };

  for (const spec of tableSpecs) {
    const rows = await fetchRows(supabase, spec);
    for (const row of rows) {
      const refs = new Set();
      spec.fields.forEach((field) => collectImageReferences(row[field], refs));
      const rewrites = new Map();

      for (const value of refs) {
        const optimized = await optimizeReference({
          value,
          supabase,
          supabaseUrl,
          cache,
        }).catch((error) => {
          console.warn(`[warn] ${spec.label(row)} ${value}: ${error.message}`);
          return null;
        });

        if (optimized) {
          rewrites.set(value, optimized.newUrl);
          manifest.rewrites.push(optimized);
        }
      }

      if (rewrites.size === 0) {
        continue;
      }

      const patch = {};
      spec.fields.forEach((field) => {
        patch[field] = rewriteValue(row[field], rewrites);
      });

      manifest.records.push({
        table: spec.table,
        id: row[spec.idColumn],
        label: spec.label(row),
        fields: spec.fields,
        rewrites: Array.from(rewrites, ([oldUrl, newUrl]) => ({
          oldUrl,
          newUrl,
        })),
      });

      if (apply) {
        const { error } = await supabase
          .from(spec.table)
          .update(patch)
          .eq(spec.idColumn, row[spec.idColumn]);
        if (error) {
          throw new Error(`${spec.label(row)} update failed: ${error.message}`);
        }
      }
    }
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(
    `${apply ? "Applied" : "Dry run"}: ${manifest.records.length} records, ${manifest.rewrites.length} image rewrites. Manifest: ${manifestPath}`,
  );
  if (!apply) {
    console.log(
      "Run again with --apply to upload optimized images and rewrite references.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
