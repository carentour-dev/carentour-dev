const CMS_PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CMS_PAGE_SLUG_ERROR =
  "Slug must use lowercase letters, numbers, and single hyphens";

export function normalizeCmsPageSlug(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  const normalized = trimmed.replace(/^\/+|\/+$/g, "");
  if (!normalized && trimmed.startsWith("/")) {
    return "home";
  }

  return normalized;
}

export function isValidCmsPageSlug(slug: string) {
  return CMS_PAGE_SLUG_PATTERN.test(slug);
}
