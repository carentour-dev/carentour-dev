import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDoctorDirectoryState,
  type PublicDoctor,
} from "../src/lib/doctors.ts";

function createDoctor(overrides: Partial<PublicDoctor>): PublicDoctor {
  return {
    id: "doctor-1",
    name: "Dr. Sample Doctor",
    title: "Consultant Specialist",
    specialization: "Cardiology",
    bio: "Profile bio",
    experience_years: 12,
    education: "Medical School",
    languages: ["English", "Arabic"],
    avatar_url: null,
    achievements: [],
    certifications: [],
    patient_rating: 4.7,
    total_reviews: 42,
    successful_procedures: 1200,
    research_publications: 12,
    is_active: true,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

test("filters doctors using the shared directory state builder", () => {
  const doctors = [
    createDoctor({
      id: "doctor-a",
      name: "Dr. Ahmed Mansour",
      specialization: "Cardiac Surgery",
      languages: ["English", "Arabic"],
    }),
    createDoctor({
      id: "doctor-b",
      name: "Dr. Layla Khalil",
      specialization: "Fertility",
      languages: ["English", "French"],
    }),
    createDoctor({
      id: "doctor-c",
      name: "Dr. Youssef Elshamy",
      specialization: "Orthopedics",
      languages: ["Arabic", "German"],
    }),
  ];

  const state = buildDoctorDirectoryState({
    doctors,
    filters: {
      specialty: "Fertility",
      language: "French",
      search: "layla",
    },
  });

  assert.deepEqual(
    state.doctors.map((doctor) => doctor.id),
    ["doctor-b"],
  );
});

test("keeps filter metadata sourced from the full dataset", () => {
  const doctors = [
    createDoctor({
      id: "doctor-a",
      name: "Dr. Ahmed Mansour",
      specialization: "Cardiac Surgery",
      languages: ["English", "Arabic"],
    }),
    createDoctor({
      id: "doctor-b",
      name: "Dr. Layla Khalil",
      specialization: "Fertility",
      languages: ["English", "French"],
    }),
  ];

  const state = buildDoctorDirectoryState({
    doctors,
    filters: {
      specialty: "Cardiac Surgery",
    },
  });

  assert.deepEqual(state.filters.specialties, ["Cardiac Surgery", "Fertility"]);
  assert.deepEqual(state.filters.languages, ["Arabic", "English", "French"]);
  assert.deepEqual(
    state.doctors.map((doctor) => doctor.id),
    ["doctor-a"],
  );
});
