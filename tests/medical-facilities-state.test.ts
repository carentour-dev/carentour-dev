import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMedicalFacilitiesDirectoryState,
  type ProcedureOption,
  type ServiceProviderRow,
} from "../src/lib/medical-facilities.ts";

function createProvider(
  overrides: Partial<ServiceProviderRow>,
): ServiceProviderRow {
  return {
    id: "provider-1",
    name: "Sample Facility",
    slug: "sample-facility",
    facility_type: "hospital",
    overview: "Overview",
    description: "Description",
    city: "Cairo",
    country_code: "EG",
    specialties: ["Cardiology"],
    facilities: [],
    amenities: [],
    procedure_ids: [],
    gallery_urls: [],
    logo_url: null,
    images: null,
    address: null,
    contact_info: null,
    coordinates: null,
    infrastructure: null,
    is_partner: true,
    rating: 4.5,
    review_count: 10,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

const procedures: ProcedureOption[] = [
  {
    id: "procedure-1",
    name: "Heart valve repair",
    treatmentName: "Cardiac surgery",
  },
  {
    id: "procedure-2",
    name: "IVF cycle",
    treatmentName: "Fertility treatment",
  },
  {
    id: "procedure-3",
    name: "Hip replacement",
    treatmentName: "Orthopedic surgery",
  },
];

test("filters facilities using the shared directory state builder", () => {
  const providers = [
    createProvider({
      id: "facility-a",
      name: "Alpha Heart Hospital",
      slug: "alpha-heart-hospital",
      specialties: ["Cardiology", "Cardiac Surgery"],
      procedure_ids: ["procedure-1"],
      rating: 4.9,
    }),
    createProvider({
      id: "facility-b",
      name: "Beta Fertility Center",
      slug: "beta-fertility-center",
      city: "Alexandria",
      specialties: ["Fertility"],
      procedure_ids: ["procedure-2"],
      rating: 4.7,
    }),
    createProvider({
      id: "facility-c",
      name: "Gamma Orthopedic Hospital",
      slug: "gamma-orthopedic-hospital",
      city: "Giza",
      specialties: ["Orthopedics"],
      procedure_ids: ["procedure-3"],
      rating: 4.3,
    }),
  ];

  const state = buildMedicalFacilitiesDirectoryState({
    providers,
    procedures,
    filters: {
      country: "eg",
      specialty: "Fertility",
      search: "ivf",
    },
  });

  assert.deepEqual(
    state.providers.map((provider) => provider.slug),
    ["beta-fertility-center"],
  );
  assert.deepEqual(state.filters.cities, ["Alexandria"]);
  assert.deepEqual(
    state.filters.procedures.map((procedure) => procedure.id),
    ["procedure-2"],
  );
});

test("preserves current limit-before-search behavior", () => {
  const providers = [
    createProvider({
      id: "facility-a",
      name: "Alpha Heart Hospital",
      slug: "alpha-heart-hospital",
      specialties: ["Cardiology"],
      procedure_ids: ["procedure-1"],
      rating: 4.9,
    }),
    createProvider({
      id: "facility-b",
      name: "Beta Fertility Center",
      slug: "beta-fertility-center",
      city: "Alexandria",
      specialties: ["Fertility"],
      procedure_ids: ["procedure-2"],
      rating: 4.7,
    }),
  ];

  const state = buildMedicalFacilitiesDirectoryState({
    providers,
    procedures,
    filters: {
      limit: 1,
      search: "fertility",
    },
  });

  assert.deepEqual(state.providers, []);
});

test("uses address fallback for metadata while keeping filter matching on the direct city field", () => {
  const providers = [
    createProvider({
      id: "facility-a",
      name: "Desert Recovery Hospital",
      slug: "desert-recovery-hospital",
      city: null,
      address: { city: "Luxor", country: "EG" },
      specialties: ["Rehabilitation"],
      procedure_ids: ["procedure-3"],
      rating: 4.2,
    }),
  ];

  const allState = buildMedicalFacilitiesDirectoryState({
    providers,
    procedures,
  });
  const filteredState = buildMedicalFacilitiesDirectoryState({
    providers,
    procedures,
    filters: {
      city: "Luxor",
    },
  });

  assert.deepEqual(allState.filters.cities, ["Luxor"]);
  assert.deepEqual(filteredState.providers, []);
});
