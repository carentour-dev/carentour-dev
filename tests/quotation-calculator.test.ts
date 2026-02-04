import assert from "node:assert/strict";
import {
  buildDefaultQuoteInput,
  calculateQuote,
} from "../src/lib/operations/quotation-calculator/calculations.js";

const input = buildDefaultQuoteInput();
input.meta.clientType = "B2B";
input.pricingSettings = {
  version: 1,
  b2bMedicalMarkupMultiplier: 1.62,
  b2cMedicalMarkupMultiplier: 1.8,
  b2bNonMedicalMarginRate: 0.35,
  b2cNonMedicalMarginRate: 0.5,
};
input.currencyRates = [
  { code: "EGP", name: "EGP", usdToCurrency: 50, notes: "" },
];
input.medical.medicalCostEgp = 10000;
input.medical.lengthOfStayNights = 2;
input.accommodation.costPerNightEgp = 500;
input.accommodation.mealPlanCostPerDayEgp = 100;
input.transportation.flightCostUsd = 300;
input.transportation.airportTransfersEgp = 500;
input.transportation.localTransportEgp = 300;
input.tourismServices = [
  { serviceName: "Tour", quantity: 1, unitCostEgp: 500 },
];
input.indirectCosts.expectedAnnualPatientVolume = 100;
input.indirectCosts.items = [
  { category: "Overhead", annualCostUsd: 1200, notes: "" },
];

const computed = calculateQuote(input);

const expectedMedicalUsd = 200;
const expectedNonMedicalUsd = 362;
const expectedProfitUsd = expectedNonMedicalUsd * 0.35;
const expectedFinalUsd =
  expectedMedicalUsd + expectedNonMedicalUsd + expectedProfitUsd;

assert.ok(
  Math.abs(computed.summary.medicalProcedureCostUsd - expectedMedicalUsd) <
    1e-6,
);
assert.ok(
  Math.abs(
    computed.summary.subtotalUsd - (expectedMedicalUsd + expectedNonMedicalUsd),
  ) < 1e-6,
);
assert.ok(
  Math.abs(computed.summary.profitAmountUsd - expectedProfitUsd) < 1e-6,
);
assert.ok(Math.abs(computed.summary.finalPriceUsd - expectedFinalUsd) < 1e-6);

console.log("quotation calculator pricing tests passed");
