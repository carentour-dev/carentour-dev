import assert from "node:assert/strict";
import test from "node:test";
import { buildTreatmentProcedureDirectoryState } from "@/lib/treatment-procedure-directory";
import type { NormalizedTreatment } from "@/lib/treatments";

const treatment: NormalizedTreatment = {
  id: "treatment-1",
  name: "Cardiac Surgery",
  slug: "cardiac-surgery",
  category: "Cardiac Surgery",
  summary: null,
  description: null,
  overview: null,
  basePrice: null,
  currency: "USD",
  durationDays: null,
  recoveryTimeDays: null,
  successRate: null,
  isFeatured: true,
  isActive: true,
  isListedPublic: true,
  idealCandidates: [],
  downloadUrl: null,
  cardImageUrl: null,
  heroImageUrl: null,
  procedures: [
    {
      id: "procedure-1",
      name: "Coronary Artery Bypass Graft",
      description: "Complex cardiac surgery with inpatient recovery.",
      duration: "5-7 days in hospital",
      recovery: "6-8 weeks",
      price: "Quoted after case review",
      egyptPrice: 14000,
      successRate: "94%",
      pdfUrl: "https://example.com/cabg.pdf",
      additionalNotes: "Requires imaging and cardiology review.",
      candidateRequirements: ["Recent angiography"],
      recoveryStages: [
        { stage: "Week 1", description: "Initial inpatient monitoring" },
      ],
      internationalPrices: [
        { country: "United States", price: 42000, currency: "USD" },
      ],
      displayOrder: 1,
      createdByProviderId: null,
      isPublic: true,
    },
    {
      id: "procedure-2",
      name: "Heart Valve Repair",
      description: "Repair-focused procedure with shorter follow-up.",
      duration: "4-6 days in hospital",
      recovery: "4-6 weeks",
      price: null,
      egyptPrice: null,
      successRate: "92%",
      pdfUrl: undefined,
      additionalNotes: undefined,
      candidateRequirements: ["Echocardiography"],
      recoveryStages: [],
      internationalPrices: [],
      displayOrder: 2,
      createdByProviderId: null,
      isPublic: true,
    },
    {
      id: "procedure-3",
      name: "Cardiac Catheterization",
      description: "Short-stay interventional procedure.",
      duration: "Day procedure",
      recovery: "2-5 days",
      price: "From USD 3,500",
      egyptPrice: 3500,
      successRate: "95%",
      pdfUrl: undefined,
      additionalNotes: "Diagnostics only in selected cases.",
      candidateRequirements: [],
      recoveryStages: [],
      internationalPrices: [],
      displayOrder: 3,
      createdByProviderId: null,
      isPublic: true,
    },
  ],
};

test("filters treatment procedures by treatment and procedure search terms", () => {
  const state = buildTreatmentProcedureDirectoryState({
    treatment,
    filters: {
      search: "cardiac",
      procedureId: "procedure-1",
    },
  });

  assert.equal(state.total, 3);
  assert.equal(state.filtered, 1);
  assert.deepEqual(
    state.procedures.map((procedure) => procedure.id),
    ["procedure-1"],
  );
});

test("returns matching procedures when only a treatment-level search is applied", () => {
  const state = buildTreatmentProcedureDirectoryState({
    treatment,
    filters: {
      search: "cardiac surgery",
    },
  });

  assert.equal(state.filtered, 3);
  assert.deepEqual(
    state.procedures.map((procedure) => procedure.id),
    ["procedure-1", "procedure-2", "procedure-3"],
  );
});
