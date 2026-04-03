import {
  getDefaultCategories,
  getFallbackFaqs,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/faq/data";
import type {
  MedicalFacilitiesDirectoryResponse,
  MedicalFacilityDetail,
  ServiceProviderRow,
} from "@/lib/medical-facilities";

export const previewFaqs: FaqEntry[] = getFallbackFaqs().slice(0, 10);
export const previewFaqCategories: FaqCategory[] = getDefaultCategories();

const previewProviders: ServiceProviderRow[] = [
  {
    id: "preview-facility-1",
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
    facilities: ["Hybrid operating rooms", "Cardiac ICU", "Cath lab"],
    amenities: ["VIP suites", "Interpreter support", "Family lounge"],
    procedure_ids: [
      "preview-procedure-1",
      "preview-procedure-2",
      "preview-procedure-3",
    ],
    gallery_urls: ["/placeholder.svg"],
    logo_url: "/placeholder.svg",
    images: { hero: "/placeholder.svg" },
    address: { city: "Cairo", country: "EG" },
    contact_info: {
      phone: "+20 2 5555 1000",
      email: "heartcenter@example.com",
      website: "www.heartcenter.example.com",
    },
    coordinates: { lat: 30.0444, lng: 31.2357 },
    infrastructure: {
      icu_beds: 32,
      emergency_support: true,
      imaging: ["MRI", "CT", "Cath lab"],
    },
    is_partner: true,
    rating: 4.8,
    review_count: 148,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "preview-facility-2",
    name: "Alexandria Women and Fertility Institute",
    slug: "alexandria-women-and-fertility-institute",
    facility_type: "clinic",
    overview:
      "Focused fertility, gynecology, and minimally invasive care with coordinated diagnostic and recovery planning.",
    description:
      "Focused fertility, gynecology, and minimally invasive care with coordinated diagnostic and recovery planning.",
    city: "Alexandria",
    country_code: "EG",
    specialties: ["Fertility", "Gynecology"],
    facilities: ["IVF laboratories", "Day surgery unit"],
    amenities: ["Private consultation suites", "Multilingual coordinators"],
    procedure_ids: ["preview-procedure-4", "preview-procedure-5"],
    gallery_urls: ["/placeholder.svg"],
    logo_url: "/placeholder.svg",
    images: { hero: "/placeholder.svg" },
    address: { city: "Alexandria", country: "EG" },
    contact_info: {
      phone: "+20 3 5555 2200",
      email: "fertility@example.com",
      website: "www.fertility.example.com",
    },
    coordinates: null,
    infrastructure: {
      embryology: "Advanced laboratory",
      emergency_support: false,
    },
    is_partner: true,
    rating: 4.6,
    review_count: 94,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "preview-facility-3",
    name: "Giza Orthopedic and Recovery Hospital",
    slug: "giza-orthopedic-and-recovery-hospital",
    facility_type: "hospital",
    overview:
      "Orthopedic surgery and rehabilitation center with inpatient recovery support and post-operative planning.",
    description:
      "Orthopedic surgery and rehabilitation center with inpatient recovery support and post-operative planning.",
    city: "Giza",
    country_code: "EG",
    specialties: ["Orthopedics", "Rehabilitation"],
    facilities: ["Robotic joint surgery", "Physiotherapy gym"],
    amenities: ["Recovery suites", "Transport coordination"],
    procedure_ids: ["preview-procedure-6", "preview-procedure-7"],
    gallery_urls: ["/placeholder.svg"],
    logo_url: "/placeholder.svg",
    images: { hero: "/placeholder.svg" },
    address: { city: "Giza", country: "EG" },
    contact_info: {
      phone: "+20 2 5555 3300",
      email: "ortho@example.com",
      website: "www.ortho.example.com",
    },
    coordinates: { lat: 29.987, lng: 31.2118 },
    infrastructure: {
      rehab_units: 18,
      imaging: ["MRI", "Digital X-Ray"],
    },
    is_partner: true,
    rating: 4.5,
    review_count: 76,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
  },
];

export const previewMedicalFacilitiesDirectoryData: MedicalFacilitiesDirectoryResponse =
  {
    providers: previewProviders,
    filters: {
      countries: ["EG"],
      cities: ["Alexandria", "Cairo", "Giza"],
      specialties: [
        "Cardiac Surgery",
        "Cardiology",
        "Critical Care",
        "Fertility",
        "Gynecology",
        "Orthopedics",
        "Rehabilitation",
      ],
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
        {
          id: "preview-procedure-4",
          name: "IVF cycle",
          treatmentName: "Fertility treatment",
        },
        {
          id: "preview-procedure-5",
          name: "Laparoscopic gynecology",
          treatmentName: "Gynecology",
        },
        {
          id: "preview-procedure-6",
          name: "Knee replacement",
          treatmentName: "Orthopedic surgery",
        },
        {
          id: "preview-procedure-7",
          name: "Hip replacement",
          treatmentName: "Orthopedic surgery",
        },
      ],
    },
  };

export const previewMedicalFacilityDetail: MedicalFacilityDetail = {
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
