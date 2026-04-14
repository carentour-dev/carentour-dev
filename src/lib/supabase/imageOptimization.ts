import type { ImageLoaderProps } from "next/image";

const SUPABASE_STORAGE_HOST_PATTERN = /\.supabase\.co$/i;
const SUPABASE_PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";
const SUPABASE_RENDER_IMAGE_PREFIX = "/storage/v1/render/image/public/";
const SUPPORTED_TRANSFORM_EXTENSIONS = /\.(avif|bmp|jpe?g|png|tiff?|webp)$/i;
const TRANSFORM_OVERRIDE_PARAMS = new Set([
  "width",
  "height",
  "quality",
  "resize",
  "format",
]);

type ParsedSupabaseImageUrl = {
  origin: string;
  bucket: string;
  objectPath: string;
  searchParams: URLSearchParams;
};

function parseSupabaseImageUrl(
  src: string | null | undefined,
): ParsedSupabaseImageUrl | null {
  if (!src || !/^https?:\/\//.test(src)) {
    return null;
  }

  try {
    const url = new URL(src);
    if (!SUPABASE_STORAGE_HOST_PATTERN.test(url.hostname)) {
      return null;
    }

    const prefix = url.pathname.startsWith(SUPABASE_RENDER_IMAGE_PREFIX)
      ? SUPABASE_RENDER_IMAGE_PREFIX
      : url.pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PREFIX)
        ? SUPABASE_PUBLIC_OBJECT_PREFIX
        : null;

    if (!prefix) {
      return null;
    }

    const remainder = url.pathname.slice(prefix.length);
    const slashIndex = remainder.indexOf("/");
    if (slashIndex <= 0) {
      return null;
    }

    const bucket = remainder.slice(0, slashIndex);
    const objectPath = remainder.slice(slashIndex + 1);

    if (!objectPath) {
      return null;
    }

    return {
      origin: url.origin,
      bucket,
      objectPath,
      searchParams: new URLSearchParams(url.search),
    };
  } catch {
    return null;
  }
}

function clampImageQuality(quality?: number) {
  const resolvedQuality = Number.isFinite(quality) ? Number(quality) : 75;
  return Math.max(20, Math.min(100, Math.round(resolvedQuality)));
}

export function canOptimizeSupabaseImage(
  src: string | null | undefined,
): src is string {
  const parsed = parseSupabaseImageUrl(src);
  if (!parsed) {
    return false;
  }

  return SUPPORTED_TRANSFORM_EXTENSIONS.test(parsed.objectPath);
}

export function supabaseImageLoader({ src, width, quality }: ImageLoaderProps) {
  const parsed = parseSupabaseImageUrl(src);
  if (!parsed) {
    return src;
  }

  const transformedUrl = new URL(
    `${SUPABASE_RENDER_IMAGE_PREFIX}${parsed.bucket}/${parsed.objectPath}`,
    parsed.origin,
  );

  parsed.searchParams.forEach((value, key) => {
    if (!TRANSFORM_OVERRIDE_PARAMS.has(key)) {
      transformedUrl.searchParams.set(key, value);
    }
  });

  transformedUrl.searchParams.set("width", String(Math.max(1, width)));
  transformedUrl.searchParams.set(
    "quality",
    String(clampImageQuality(quality)),
  );

  return transformedUrl.toString();
}

export function getOptimizedImageProps(src: string | null | undefined) {
  const optimizeWithSupabase = canOptimizeSupabaseImage(src);
  const isRemoteUrl = typeof src === "string" && /^https?:\/\//.test(src);

  return {
    loader: optimizeWithSupabase ? supabaseImageLoader : undefined,
    unoptimized: isRemoteUrl && !optimizeWithSupabase,
  };
}
