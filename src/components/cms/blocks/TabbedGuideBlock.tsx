import type { BlockInstance, TabbedGuideSection } from "@/lib/cms/blocks";
import {
  getHotelsForGuideSection,
  type GuideHotelEntry,
} from "@/lib/cms/server";
import {
  TabbedGuideContent,
  type TabbedGuideHotelsMap,
} from "./TabbedGuideContent";
import { resolveSectionKey } from "./tabbedGuideUtils";

export async function TabbedGuideBlock({
  block,
}: {
  block: BlockInstance<"tabbedGuide">;
}) {
  const hotelMap: TabbedGuideHotelsMap = {};

  const hotelSections: Array<{
    key: string;
    section: Extract<TabbedGuideSection, { type: "hotelShowcase" }>;
  }> = [];

  block.tabs.forEach((tab, tabIndex) => {
    const tabId = tab.id ?? `tab-${tabIndex}`;
    tab.sections.forEach((section, index) => {
      if (section.type === "hotelShowcase") {
        hotelSections.push({
          key: resolveSectionKey(tabId, index),
          section: section as Extract<
            TabbedGuideSection,
            { type: "hotelShowcase" }
          >,
        });
      }
    });
  });

  await Promise.all(
    hotelSections.map(async (entry) => {
      const hotels = await getHotelsForGuideSection(entry.section);
      hotelMap[entry.key] = hotels.map(transformHotelEntry);
    }),
  );

  return <TabbedGuideContent block={block} hotelMap={hotelMap} />;
}

function transformHotelEntry(entry: GuideHotelEntry) {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    amenities: entry.amenities,
    medicalServices: entry.medicalServices,
    nightlyRate: entry.nightlyRate,
    currency: entry.currency,
    distanceToFacilityKm: entry.distanceToFacilityKm,
    addressLabel: entry.addressLabel,
    starRating: entry.starRating,
    priceLabel: entry.priceLabel,
    locationLabel: entry.locationLabel,
    icon: entry.icon,
    heroImage: entry.heroImage,
    gallery: entry.gallery,
    contactPhone: entry.contactPhone,
    contactEmail: entry.contactEmail,
    website: entry.website,
    rating: entry.rating,
    reviewCount: entry.reviewCount,
    slug: entry.slug,
    addressDetails: entry.addressDetails,
  };
}
