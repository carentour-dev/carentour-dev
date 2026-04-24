import path from "node:path";
import sharp from "sharp";

const MAX_IMAGE_WIDTH = 2400;
const WEBP_QUALITY = 78;

const OPTIMIZABLE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type OptimizedCmsImage = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
  byteSize: number;
};

export type CmsProcessedUpload = {
  originalPath: string;
  optimizedPath: string;
  publicPath: string;
  originalByteSize: number;
  optimizedByteSize: number;
  width: number | null;
  height: number | null;
  mimeType: string;
  optimizedMimeType: string;
  optimized: boolean;
};

export function isOptimizableCmsImageMimeType(value: string) {
  return OPTIMIZABLE_IMAGE_MIME_TYPES.has(value);
}

export function normalizeCmsUploadFolder(folder: string | null | undefined) {
  const normalized = (folder ?? "cms")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\\/g, "/");

  if (!normalized || normalized.includes("..")) {
    return "cms";
  }

  return normalized
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]+/g, "-"))
    .filter(Boolean)
    .join("/");
}

export function sanitizeUploadFileName(fileName: string) {
  const fallbackName = "upload";
  const parsedName = path.posix.basename(fileName.trim() || fallbackName);
  const extension = path.posix.extname(parsedName).toLowerCase();
  const rawBaseName = extension
    ? parsedName.slice(0, -extension.length)
    : parsedName;
  const baseName =
    rawBaseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallbackName;
  const safeExtension = extension.replace(/[^.a-z0-9]/g, "").slice(0, 16);

  return {
    originalName: `${baseName}${safeExtension}`,
    baseName,
  };
}

export async function optimizeCmsImage(
  input: Buffer,
): Promise<OptimizedCmsImage> {
  const image = sharp(input, { animated: false }).rotate();
  const metadata = await image.metadata();
  const shouldResize =
    typeof metadata.width === "number" && metadata.width > MAX_IMAGE_WIDTH;

  const optimized = await image
    .resize({
      width: shouldResize ? MAX_IMAGE_WIDTH : undefined,
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 5,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
    mimeType: "image/webp",
    byteSize: optimized.data.byteLength,
  };
}

export async function buildCmsProcessedUpload({
  file,
  fileName,
  mimeType,
  folder,
}: {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string | null;
}): Promise<
  CmsProcessedUpload & {
    originalBuffer: Buffer;
    optimizedBuffer: Buffer;
  }
> {
  const uploadId = crypto.randomUUID();
  const normalizedFolder = normalizeCmsUploadFolder(folder);
  const { originalName, baseName } = sanitizeUploadFileName(fileName);
  const originalPath = `originals/${normalizedFolder}/${uploadId}/${originalName}`;

  if (!isOptimizableCmsImageMimeType(mimeType)) {
    const publicPath = `${normalizedFolder}/${uploadId}/${originalName}`;
    return {
      originalPath: publicPath,
      optimizedPath: publicPath,
      publicPath,
      originalByteSize: file.byteLength,
      optimizedByteSize: file.byteLength,
      width: null,
      height: null,
      mimeType,
      optimizedMimeType: mimeType,
      optimized: false,
      originalBuffer: file,
      optimizedBuffer: file,
    };
  }

  const optimized = await optimizeCmsImage(file);
  const optimizedPath = `${normalizedFolder}/${uploadId}/${baseName}.webp`;

  return {
    originalPath,
    optimizedPath,
    publicPath: optimizedPath,
    originalByteSize: file.byteLength,
    optimizedByteSize: optimized.byteSize,
    width: optimized.width,
    height: optimized.height,
    mimeType,
    optimizedMimeType: optimized.mimeType,
    optimized: true,
    originalBuffer: file,
    optimizedBuffer: optimized.buffer,
  };
}
