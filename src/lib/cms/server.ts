import { createClient } from "@/integrations/supabase/server";
import type { Database } from "@/integrations/supabase/types";
import type { PublicLocale } from "@/i18n/routing";
import {
  normalizeBlocks,
  type BlockInstance,
  type BlockValue,
  type TabbedGuideHotelSection,
} from "@/lib/cms/blocks";
import {
  sanitizeCmsPageSettings,
  type CmsPageSettings,
} from "@/lib/cms/pageSettings";
import {
  getLocalizedPublicTreatmentIndexItems,
  getLocalizedPublicTreatments,
} from "@/server/modules/treatments/public";
import { fetchLocalizedPublicDoctors } from "@/server/modules/doctors/public";

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seo: Record<string, any> | null;
  settings: CmsPageSettings;
  content: BlockInstance[];
  updated_at: string | null;
};

export async function getPublishedPageBySlug(
  slug: string,
): Promise<CmsPage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, seo, settings, content, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    status: data.status as "draft" | "published",
    seo: data.seo as Record<string, any> | null,
    settings: sanitizeCmsPageSettings(data.settings),
    content: normalizeBlocks(data.content),
    updated_at: data.updated_at,
  };
}

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];

const DOCTOR_SELECT =
  "id, name, title, specialization, bio, experience_years, languages, avatar_url, patient_rating, total_reviews, successful_procedures, is_active";

type TreatmentListingBlockQuery = {
  manualTreatments?: string[];
  limit?: number;
  featuredOnly?: boolean;
  categories?: string[];
};

export async function getTreatmentsForBlock(
  config: TreatmentListingBlockQuery,
  locale: PublicLocale = "en",
) {
  return getLocalizedPublicTreatments({
    locale,
    limit: config.limit,
    manualTreatments: config.manualTreatments,
    featuredOnly: config.featuredOnly,
    categories: config.categories,
  });
}

export async function getPublicTreatmentIndexItems(
  locale: PublicLocale = "en",
  limit = 50,
) {
  return getLocalizedPublicTreatmentIndexItems(locale, limit);
}

export async function getDoctorsForBlock(
  config: BlockValue<"doctors">,
  locale: PublicLocale = "en",
) {
  const manual = (config.manualDoctors ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  try {
    const rows = await fetchLocalizedPublicDoctors({
      locale,
      doctorIds: manual.length > 0 ? manual : undefined,
      featuredOnly: config.featuredOnly,
      specializations: config.specialties,
      limit: config.limit,
    });

    return rows.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      title: doctor.title,
      specialization: doctor.specialization,
      bio: doctor.bio,
      experience_years: doctor.experience_years,
      languages: doctor.languages,
      avatar_url: doctor.avatar_url,
      patient_rating: doctor.patient_rating,
      total_reviews: doctor.total_reviews,
      successful_procedures: doctor.successful_procedures,
      is_active: doctor.is_active,
    })) as DoctorRow[];
  } catch (error) {
    console.error("Failed to load doctors for block", error);
    return [];
  }
}

export type GuideHotelEntry = {
  id?: string;
  title: string;
  description?: string | null;
  amenities?: string[] | null;
  medicalServices?: string[] | null;
  nightlyRate?: number | null;
  currency?: string | null;
  distanceToFacilityKm?: number | null;
  addressLabel?: string | null;
  starRating?: number | null;
  priceLabel?: string | null;
  locationLabel?: string | null;
  icon?: string | null;
  heroImage?: string | null;
  gallery?: string[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  slug?: string | null;
  addressDetails?: string | null;
};

export async function getHotelsForGuideSection(
  section: TabbedGuideHotelSection,
): Promise<GuideHotelEntry[]> {
  const supabase = await createClient();
  const typedSection = section as {
    limit?: number;
    manualFallback?: TabbedGuideHotelSection["manualFallback"];
  };
  const limit =
    typeof typedSection.limit === "number" && typedSection.limit > 0
      ? typedSection.limit
      : 4;
  const { data, error } = await supabase
    .from("hotels")
    .select(
      "id, name, description, star_rating, nightly_rate, currency, distance_to_facility_km, amenities, medical_services, address, images, contact_info, rating, review_count, slug",
    )
    .eq("is_partner", true)
    .order("star_rating", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load hotels for guide section", error);
  }

  const resolved = (data ?? []).map((hotel) => {
    const row = hotel as HotelRow & {
      address?: Record<string, unknown> | null;
      images?: Record<string, unknown> | null;
      contact_info?: Record<string, unknown> | null;
    };
    const ensureString = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;
    const address = row.address ?? {};
    const city = ensureString(address?.["city"]) ?? "";
    const country = ensureString(address?.["country"]) ?? "";
    const street = ensureString(address?.["street"]) ?? "";
    const locationLabel = [city, country].filter(Boolean).join(", ");
    const distanceLabel =
      typeof row.distance_to_facility_km === "number"
        ? `${row.distance_to_facility_km} km from partner hospitals`
        : null;
    const images = row.images ?? {};
    const heroCandidate =
      images && typeof images === "object"
        ? ensureString(images["hero"])
        : null;
    const galleryCandidate =
      images && typeof images === "object"
        ? (images["gallery"] as unknown[] | undefined)
        : undefined;
    const gallery = Array.isArray(galleryCandidate)
      ? galleryCandidate.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [];
    const contact = row.contact_info ?? {};
    const phone =
      contact && typeof contact === "object"
        ? ensureString(contact["phone"])
        : null;
    const email =
      contact && typeof contact === "object"
        ? ensureString(contact["email"])
        : null;
    const website =
      contact && typeof contact === "object"
        ? ensureString(contact["website"])
        : null;
    return {
      id: row.id,
      title: row.name,
      description: row.description,
      amenities: row.amenities ?? undefined,
      medicalServices: row.medical_services ?? undefined,
      nightlyRate: row.nightly_rate,
      currency: row.currency,
      distanceToFacilityKm: row.distance_to_facility_km,
      addressLabel: locationLabel || distanceLabel,
      addressDetails: street
        ? [street, locationLabel].filter(Boolean).join(", ")
        : locationLabel || distanceLabel,
      starRating: row.star_rating,
      heroImage: heroCandidate,
      gallery: gallery.length ? gallery : null,
      contactPhone: phone,
      contactEmail: email,
      website,
      rating: row.rating,
      reviewCount: row.review_count,
      slug: row.slug,
    } satisfies GuideHotelEntry;
  });

  if (resolved.length > 0) {
    return resolved;
  }

  const manualFallback = Array.isArray(typedSection.manualFallback)
    ? typedSection.manualFallback
    : [];

  return manualFallback.map((entry) => ({
    title: entry.title,
    description: entry.description,
    amenities: entry.amenities,
    medicalServices: entry.medicalServices,
    priceLabel: entry.priceLabel,
    locationLabel: entry.locationLabel,
    icon: entry.icon,
    starRating: entry.starRating,
    heroImage: entry.heroImage,
    contactPhone: entry.contactPhone,
    contactEmail: entry.contactEmail,
    website: entry.website,
    rating: entry.rating,
    reviewCount: entry.reviewCount,
    addressDetails: entry.addressDetails,
  }));
}
