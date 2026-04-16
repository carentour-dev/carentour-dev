import type { PublicLocale } from "@/i18n/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import {
  resolveTreatmentCardImage,
  selectPrimaryProcedure,
  type NormalizedTreatment,
} from "@/lib/treatments";

export type FeaturedTreatmentCard = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  summary: string;
  priceLabel: string;
  durationLabel: string;
  successRate?: string | null;
  image: string;
  fallbackImage: string;
  isFeatured: boolean;
};

const formatCurrency = (
  value: number,
  locale: PublicLocale,
  currency?: string | null,
) => {
  try {
    return new Intl.NumberFormat(getPublicNumberLocale(locale), {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${new Intl.NumberFormat(getPublicNumberLocale(locale)).format(value)}`;
  }
};

const formatDuration = (
  duration: number | null | undefined,
  locale: PublicLocale,
) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    const formattedDuration = new Intl.NumberFormat(
      getPublicNumberLocale(locale),
    ).format(duration);

    return locale === "ar"
      ? `${formattedDuration} يوم`
      : `${formattedDuration} day${duration === 1 ? "" : "s"}`;
  }

  return null;
};

export function buildFeaturedTreatmentCards(
  treatments: NormalizedTreatment[],
  locale: PublicLocale,
): FeaturedTreatmentCard[] {
  return treatments.reduce<FeaturedTreatmentCard[]>((acc, treatment) => {
    if (!treatment.slug) {
      return acc;
    }

    const cardImage = resolveTreatmentCardImage({
      slug: treatment.slug,
      category: treatment.category,
      cardImageUrl: treatment.cardImageUrl,
    });
    const primaryProcedure = selectPrimaryProcedure(treatment.procedures);
    const stay = formatDuration(treatment.durationDays, locale);
    const recovery = formatDuration(treatment.recoveryTimeDays, locale);

    let durationLabel =
      primaryProcedure?.duration ??
      (locale === "ar" ? "خطة علاجية مخصصة" : "Personalized itinerary");
    if (stay && recovery) {
      durationLabel = `${stay} • ${recovery}`;
    } else if (stay) {
      durationLabel = stay;
    } else if (recovery) {
      durationLabel =
        locale === "ar" ? `${recovery} للتعافي` : `${recovery} recovery`;
    }

    const priceCandidate =
      typeof treatment.basePrice === "number"
        ? treatment.basePrice
        : (primaryProcedure?.egyptPrice ?? null);

    acc.push({
      id: treatment.id,
      slug: treatment.slug,
      title: treatment.name,
      category: treatment.category,
      summary:
        treatment.summary ??
        treatment.description ??
        (locale === "ar"
          ? "رعاية طبية عالمية مصممة خصيصاً للمرضى القادمين من الخارج."
          : "World-class medical care tailored to international patients."),
      priceLabel:
        typeof priceCandidate === "number"
          ? locale === "ar"
            ? `ابتداءً من ${formatCurrency(priceCandidate, locale, treatment.currency)}`
            : `From ${formatCurrency(priceCandidate, locale, treatment.currency)}`
          : locale === "ar"
            ? "سعر مخصص حسب الحالة"
            : "Custom pricing",
      durationLabel,
      successRate: primaryProcedure?.successRate ?? null,
      image: cardImage.image,
      fallbackImage: cardImage.fallbackImage,
      isFeatured: treatment.isFeatured === true,
    });

    return acc;
  }, []);
}
