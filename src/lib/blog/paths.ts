import type { PublicLocale } from "@/i18n/routing";
import { localizePublicPathname } from "@/lib/public/routing";

export function buildLocalizedBlogLandingPath(locale: PublicLocale) {
  return localizePublicPathname("/blog", locale);
}

export function buildLocalizedBlogCategoryPath(
  slug: string,
  locale: PublicLocale,
) {
  return localizePublicPathname(`/blog/${slug}`, locale);
}

export function buildLocalizedBlogTagPath(slug: string, locale: PublicLocale) {
  return localizePublicPathname(`/blog/tag/${slug}`, locale);
}

export function buildLocalizedBlogAuthorPath(
  slug: string,
  locale: PublicLocale,
) {
  return localizePublicPathname(`/blog/author/${slug}`, locale);
}

export function buildLocalizedBlogPostPath(
  categorySlug: string,
  postSlug: string,
  locale: PublicLocale,
) {
  return localizePublicPathname(`/blog/${categorySlug}/${postSlug}`, locale);
}
