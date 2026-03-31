"use client";

import type { BlockInstance } from "@/lib/cms/blocks";
import type { MedicalFacilityDetail } from "@/lib/medical-facilities";
import { BlockSurface } from "./BlockSurface";
import { MedicalFacilityProfileContent } from "./MedicalFacilityProfileContent";

const previewDetail: MedicalFacilityDetail = {
  provider: {
    id: "preview-facility-profile",
    name: "Cairo International Heart Center",
    slug: "cairo-international-heart-center",
    facility_type: "hospital",
    overview:
      "Tertiary cardiac and vascular center supporting complex surgical and interventional cases for international patients.",
    description:
      "Tertiary cardiac and vascular center supporting complex surgical and interventional cases for international patients.",
    city: "Cairo",
    country_code: "EG",
    specialties: ["Cardiology", "Cardiac Surgery", "Critical Care"],
    facilities: [
      "Hybrid operating rooms",
      "Cardiac ICU",
      "Catheterization labs",
    ],
    amenities: [
      "VIP suites",
      "Interpreter support",
      "Airport transfer coordination",
    ],
    procedure_ids: [
      "preview-procedure-1",
      "preview-procedure-2",
      "preview-procedure-3",
    ],
    gallery_urls: ["/placeholder.svg"],
    logo_url: "/placeholder.svg",
    images: { hero: "/placeholder.svg" },
    address: {
      line1: "New Cairo Medical District",
      city: "Cairo",
      country: "EG",
    },
    contact_info: {
      phone: "+20 2 5555 1000",
      email: "heartcenter@example.com",
      website: "www.heartcenter.example.com",
      whatsapp: "+20 100 000 0000",
    },
    coordinates: { lat: 30.0444, lng: 31.2357 },
    infrastructure: {
      icu_beds: 32,
      emergency_support: true,
      imaging: ["MRI", "CT", "Cath lab"],
      operating_rooms: 11,
    },
    is_partner: true,
    rating: 4.8,
    review_count: 148,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
  },
  procedures: [
    {
      id: "preview-procedure-1",
      name: "Coronary artery bypass graft",
      treatmentName: "Cardiac surgery",
    },
    {
      id: "preview-procedure-2",
      name: "Heart valve repair",
      treatmentName: "Cardiac surgery",
    },
    {
      id: "preview-procedure-3",
      name: "Cardiac catheterization",
      treatmentName: "Cardiology",
    },
  ],
};

export function MedicalFacilityProfilePreview({
  block,
}: {
  block: BlockInstance<"medicalFacilityProfile">;
}) {
  return (
    <BlockSurface
      block={block}
      container={false}
      className="overflow-visible bg-background"
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
    >
      {() => (
        <MedicalFacilityProfileContent block={block} detail={previewDetail} />
      )}
    </BlockSurface>
  );
}
