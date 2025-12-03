import { createClient } from "@/integrations/supabase/server";
import type { Database } from "@/integrations/supabase/types";
import {
  normalizeBlocks,
  type BlockInstance,
  type BlockValue,
  type TabbedGuideHotelSection,
} from "@/lib/cms/blocks";
import { normalizeTreatment } from "@/lib/treatments";

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentProcedureRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seo: Record<string, any> | null;
  content: BlockInstance[];
  updated_at: string | null;
};

export async function getPublishedPageBySlug(
  slug: string,
): Promise<CmsPage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id, slug, title, status, seo, content, updated_at")
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
    content: normalizeBlocks(data.content),
    updated_at: data.updated_at,
  };
}

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];

const TREATMENT_SELECT =
  "id, name, slug, summary, description, category, base_price, currency, duration_days, recovery_time_days, success_rate, is_featured, is_active, ideal_candidates, card_image_url, hero_image_url, treatment_procedures:treatment_procedures(*)";
const DOCTOR_SELECT =
  "id, name, title, specialization, bio, experience_years, languages, avatar_url, patient_rating, total_reviews, successful_procedures, is_active";

export async function getTreatmentsForBlock(config: BlockValue<"treatments">) {
  const supabase = await createClient();
  const manual = (config.manualTreatments ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (manual.length > 0) {
    const { data, error } = await supabase
      .from("treatments")
      .select(TREATMENT_SELECT)
      .in("slug", manual);

    if (error) {
      console.error("Failed to load manual treatments for block", error);
      return [];
    }

    const rows = (data ?? []) as (TreatmentRow & {
      treatment_procedures: TreatmentProcedureRow[];
    })[];
    const orderMap = new Map(manual.map((slug, index) => [slug, index]));
    const sorted = rows.sort((a, b) => {
      const rankA = orderMap.get(a.slug ?? a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = orderMap.get(b.slug ?? b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });
    return sorted
      .slice(0, config.limit)
      .map((row) => normalizeTreatment(row, row.treatment_procedures ?? []));
  }

  let query = supabase
    .from("treatments")
    .select(TREATMENT_SELECT)
    .eq("is_active", true);

  if (config.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (config.categories && config.categories.length > 0) {
    query = query.in("category", config.categories);
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(config.limit);

  if (error) {
    console.error("Failed to load treatments for block", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const record = row as TreatmentRow & {
      treatment_procedures?: TreatmentProcedureRow[];
    };
    return normalizeTreatment(record, record.treatment_procedures ?? []);
  });
}

export async function getDoctorsForBlock(config: BlockValue<"doctors">) {
  const supabase = await createClient();
  const manual = (config.manualDoctors ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (manual.length > 0) {
    const { data, error } = await supabase
      .from("doctors")
      .select(DOCTOR_SELECT)
      .in("id", manual);

    if (error) {
      console.error("Failed to load manual doctors for block", error);
      return [];
    }

    const rows = (data ?? []) as DoctorRow[];
    const orderMap = new Map(manual.map((id, index) => [id, index]));
    const sorted = rows.sort((a, b) => {
      const rankA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });
    return sorted.slice(0, config.limit);
  }

  let query = supabase
    .from("doctors")
    .select(DOCTOR_SELECT)
    .eq("is_active", true);

  if (config.featuredOnly) {
    query = query.gte("patient_rating", 4.5);
  }

  if (config.specialties && config.specialties.length > 0) {
    query = query.in("specialization", config.specialties);
  }

  const { data, error } = await query
    .order("patient_rating", { ascending: false, nullsFirst: false })
    .order("successful_procedures", { ascending: false, nullsFirst: false })
    .limit(config.limit);

  if (error) {
    console.error("Failed to load doctors for block", error);
    return [];
  }

  return (data ?? []) as DoctorRow[];
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
