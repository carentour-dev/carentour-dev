import { z } from "zod";

const toNumber = (value: unknown, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const numberField = (fallback = 0) =>
  z.preprocess((value) => toNumber(value, fallback), z.number().min(0));

export const quoteInputSchema = z.object({
  meta: z.object({
    quoteDate: z.string().min(1, "Quote date is required"),
    quoteNumber: z.string().min(1, "Quote number is required"),
    clientType: z.string().min(1, "Client type is required"),
    patientName: z.string().min(1, "Patient name is required"),
    country: z.string().min(1, "Country is required"),
    age: z.string().default(""),
  }),
  medical: z.object({
    procedureName: z.string().default(""),
    hospitalTier: z.string().default(""),
    medicalCostEgp: numberField(),
    lengthOfStayNights: numberField(),
  }),
  accommodation: z.object({
    hotelCategory: z.string().default(""),
    roomType: z.string().default(""),
    mealPlan: z.string().default(""),
    costPerNightEgp: numberField(),
    mealPlanCostPerDayEgp: numberField(),
  }),
  transportation: z.object({
    flightCostUsd: numberField(),
    flightOrigin: z.string().default(""),
    flightType: z.string().default(""),
    airportTransfersEgp: numberField(),
    airportVehicleType: z.string().default(""),
    localTransportEgp: numberField(),
    localTransportDays: numberField(),
  }),
  tourismServices: z
    .array(
      z.object({
        serviceName: z.string().default(""),
        quantity: numberField(),
        unitCostEgp: numberField(),
      }),
    )
    .default([]),
  indirectCosts: z.object({
    expectedAnnualPatientVolume: numberField(),
    items: z.array(
      z.object({
        category: z.string().default(""),
        annualCostUsd: numberField(),
        notes: z.string().default(""),
      }),
    ),
  }),
  currencyRates: z
    .array(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        usdToCurrency: numberField(),
        notes: z.string().default(""),
      }),
    )
    .default([]),
  dataSheets: z.object({
    medicalProcedures: z
      .array(
        z.object({
          procedureCode: z.string().default(""),
          procedureName: z.string().default(""),
          category: z.string().default(""),
          premiumHospitalEgp: numberField(),
          midRangeHospitalEgp: numberField(),
          budgetHospitalEgp: numberField(),
          typicalLengthOfStayNights: numberField(),
          preOpDays: numberField(),
          postOpDays: numberField(),
          notes: z.string().default(""),
        }),
      )
      .default([]),
    accommodations: z
      .array(
        z.object({
          hotelCode: z.string().default(""),
          hotelName: z.string().default(""),
          starRating: z.string().default(""),
          location: z.string().default(""),
          roomType: z.string().default(""),
          pricePerNightEgp: numberField(),
          mealPlan: z.string().default(""),
          mealPlanCostEgpPerDay: numberField(),
          airportDistanceKm: numberField(),
          notes: z.string().default(""),
        }),
      )
      .default([]),
    transportation: z
      .array(
        z.object({
          serviceType: z.string().default(""),
          description: z.string().default(""),
          routeDetails: z.string().default(""),
          vehicleType: z.string().default(""),
          costEgp: numberField(),
          costUsd: numberField(),
          costEur: numberField(),
          provider: z.string().default(""),
          notes: z.string().default(""),
        }),
      )
      .default([]),
    tourismExtras: z
      .array(
        z.object({
          serviceCode: z.string().default(""),
          serviceName: z.string().default(""),
          category: z.string().default(""),
          description: z.string().default(""),
          duration: z.string().default(""),
          costEgp: numberField(),
          costUsd: numberField(),
          costEur: numberField(),
          maxPersons: numberField(),
          notes: z.string().default(""),
        }),
      )
      .default([]),
  }),
});

export type QuoteInputSchema = z.infer<typeof quoteInputSchema>;
