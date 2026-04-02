import type { PublicLocale } from "@/i18n/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";

const BLOG_UI_TEXT = {
  en: {
    backLabel: "Back to Blog",
    publishDateLabel: "Published",
    updatedLabel: "Updated",
    readingTimeSuffix: "min read",
    readingTimeCompactSuffix: "min",
    shareLabel: "Share",
    featuredBadge: "Featured article",
    listCtaLabel: "Read article",
    relatedHeading: "Related articles",
    tocHeading: "On this page",
    taxonomyCtaLabel: "Explore archive",
    feedEmptyStateHeading: "No articles available",
    feedEmptyStateDescription:
      "Publish articles or adjust the feed settings to populate this section.",
    taxonomyEmptyStateHeading: "Nothing to show yet",
    taxonomyEmptyStateDescription:
      "Publish taxonomy content to populate this grid.",
    articleBodyEmptyStateHeading: "Article content unavailable",
    articleBodyEmptyStateDescription:
      "Add localized article content in the blog editor to publish this page.",
    authorSummaryHeading: "About the author",
    authorArchiveLinkLabel: "View author archive",
    authorSummaryEmptyStateHeading: "Author profile unavailable",
    authorSummaryEmptyStateDescription:
      "Assign an active author profile to show an editorial summary here.",
    shareOnTwitter: "Share on Twitter",
    shareOnFacebook: "Share on Facebook",
    shareOnLinkedIn: "Share on LinkedIn",
    copyLink: "Copy link",
    copySuccessTitle: "Link copied!",
    copySuccessDescription: "The link has been copied to your clipboard.",
    copyErrorTitle: "Failed to copy",
    copyErrorDescription: "Could not copy link to clipboard.",
  },
  ar: {
    backLabel: "العودة إلى المدونة",
    publishDateLabel: "تاريخ النشر",
    updatedLabel: "آخر تحديث",
    readingTimeSuffix: "دقائق قراءة",
    readingTimeCompactSuffix: "دقائق",
    shareLabel: "مشاركة",
    featuredBadge: "مقالة مميزة",
    listCtaLabel: "اقرأ المقال",
    relatedHeading: "مقالات ذات صلة",
    tocHeading: "في هذه الصفحة",
    taxonomyCtaLabel: "استكشف الأرشيف",
    feedEmptyStateHeading: "لا توجد مقالات متاحة",
    feedEmptyStateDescription:
      "انشر مقالات أو عدّل إعدادات الخلاصة لعرض هذا القسم.",
    taxonomyEmptyStateHeading: "لا يوجد محتوى لعرضه بعد",
    taxonomyEmptyStateDescription:
      "انشر التصنيفات أو الوسوم أو ملفات الكتّاب لعرض هذه الشبكة.",
    articleBodyEmptyStateHeading: "محتوى المقال غير متاح",
    articleBodyEmptyStateDescription:
      "أضف محتوى المقال المترجم في محرر المدونة لنشر هذه الصفحة.",
    authorSummaryHeading: "عن الكاتب",
    authorArchiveLinkLabel: "عرض أرشيف الكاتب",
    authorSummaryEmptyStateHeading: "ملف الكاتب غير متاح",
    authorSummaryEmptyStateDescription:
      "عيّن ملف كاتب نشط لعرض هذا الملخص التحريري هنا.",
    shareOnTwitter: "مشاركة على إكس",
    shareOnFacebook: "مشاركة على فيسبوك",
    shareOnLinkedIn: "مشاركة على لينكدإن",
    copyLink: "نسخ الرابط",
    copySuccessTitle: "تم نسخ الرابط",
    copySuccessDescription: "تم نسخ الرابط إلى الحافظة.",
    copyErrorTitle: "تعذر نسخ الرابط",
    copyErrorDescription: "تعذر نسخ الرابط إلى الحافظة.",
  },
} as const;

export type BlogUiTextKey = keyof (typeof BLOG_UI_TEXT)["en"];

function normalizeCopy(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function matchesKnownDefault(key: BlogUiTextKey, value: string) {
  const normalized = normalizeCopy(value);

  return (Object.values(BLOG_UI_TEXT) as Array<Record<BlogUiTextKey, string>>)
    .map((translations) => normalizeCopy(translations[key]))
    .includes(normalized);
}

export function resolveBlogUiText(
  key: BlogUiTextKey,
  locale: PublicLocale,
  value?: string | null,
) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return BLOG_UI_TEXT[locale][key];
  }

  if (locale === "ar" && matchesKnownDefault(key, trimmed)) {
    return BLOG_UI_TEXT.ar[key];
  }

  return trimmed;
}

function parseDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatBlogMetadataDate(
  value: Date | string | null | undefined,
  locale: PublicLocale,
) {
  const parsed = parseDateInput(value);

  if (!parsed) {
    return null;
  }

  return new Intl.DateTimeFormat(
    getPublicNumberLocale(locale),
    locale === "ar"
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" },
  ).format(parsed);
}

export function formatBlogCardDate(
  value: Date | string | null | undefined,
  locale: PublicLocale,
) {
  const parsed = parseDateInput(value);

  if (!parsed) {
    return null;
  }

  return new Intl.DateTimeFormat(
    getPublicNumberLocale(locale),
    locale === "ar"
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  ).format(parsed);
}

export function formatBlogNumber(
  value: number | null | undefined,
  locale: PublicLocale,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(getPublicNumberLocale(locale)).format(value);
}

export function formatBlogReadingTime(
  minutes: number | null | undefined,
  locale: PublicLocale,
  variant: "default" | "compact" = "default",
) {
  const formattedMinutes = formatBlogNumber(minutes, locale);

  if (!formattedMinutes) {
    return null;
  }

  const suffix = resolveBlogUiText(
    variant === "compact" ? "readingTimeCompactSuffix" : "readingTimeSuffix",
    locale,
  );

  return `${formattedMinutes} ${suffix}`;
}
