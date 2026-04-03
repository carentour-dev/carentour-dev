const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

export const CMS_MEDIA_UPLOAD_PREFIX = "cms";

export const CMS_MEDIA_UPLOAD_ERROR_MESSAGES = {
  invalidType:
    "Unsupported file type. Upload a JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV, or OGG file.",
  tooLarge: "File is too large. Maximum size is 25MB.",
  invalidName: "File name is invalid.",
} as const;

export function isAllowedCmsMediaMimeType(value: string) {
  return ALLOWED_MIME_TYPES.has(value);
}

export function isAllowedCmsMediaUploadSize(size: number) {
  return size <= MAX_UPLOAD_SIZE_BYTES;
}

export function buildSafeCmsMediaStorageName(originalFileName: string) {
  const trimmed = originalFileName.trim();
  const extensionIndex = trimmed.lastIndexOf(".");
  const rawBaseName =
    extensionIndex > 0 ? trimmed.slice(0, extensionIndex) : trimmed;
  const rawExtension =
    extensionIndex > 0 ? trimmed.slice(extensionIndex).toLowerCase() : "";
  const safeBaseName = rawBaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeExtension = rawExtension.replace(/[^.a-z0-9]/g, "").slice(0, 16);
  const normalizedBaseName = safeBaseName.length > 0 ? safeBaseName : "upload";

  return `${crypto.randomUUID()}-${normalizedBaseName}${safeExtension}`;
}

export function buildCmsMediaStoragePath(originalFileName: string) {
  return `${CMS_MEDIA_UPLOAD_PREFIX}/${buildSafeCmsMediaStorageName(originalFileName)}`;
}
