import type {
  CurrencyRateInput,
  IndirectCostItemInput,
  QuoteComputed,
  QuoteInput,
  QuoteSummary,
  TourismServiceInput,
} from "./types";

const DEFAULT_CURRENCY_RATES: CurrencyRateInput[] = [
  {
    code: "EGP",
    name: "EGP (Egyptian Pound)",
    usdToCurrency: 0,
    notes: "",
  },
  {
    code: "EUR",
    name: "EUR (Euro)",
    usdToCurrency: 0,
    notes: "",
  },
  {
    code: "GBP",
    name: "GBP (British Pound)",
    usdToCurrency: 0,
    notes: "",
  },
  {
    code: "SAR",
    name: "SAR (Saudi Riyal)",
    usdToCurrency: 0,
    notes: "",
  },
  {
    code: "AED",
    name: "AED (UAE Dirham)",
    usdToCurrency: 0,
    notes: "",
  },
];

const DEFAULT_INDIRECT_COST_ITEMS: IndirectCostItemInput[] = [
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
  {
    category: "",
    annualCostUsd: 0,
    notes: "",
  },
];

const DEFAULT_TOURISM_SERVICES: TourismServiceInput[] = [
  { serviceName: "", quantity: 0, unitCostEgp: 0 },
  { serviceName: "", quantity: 0, unitCostEgp: 0 },
  { serviceName: "", quantity: 0, unitCostEgp: 0 },
  { serviceName: "", quantity: 0, unitCostEgp: 0 },
  { serviceName: "", quantity: 0, unitCostEgp: 0 },
];

const DEFAULT_DATA_SHEETS = {
  medicalProcedures: [
    {
      procedureCode: "",
      procedureName: "",
      category: "",
      premiumHospitalEgp: 0,
      midRangeHospitalEgp: 0,
      budgetHospitalEgp: 0,
      typicalLengthOfStayNights: 0,
      preOpDays: 0,
      postOpDays: 0,
      notes: "",
    },
    {
      procedureCode: "",
      procedureName: "",
      category: "",
      premiumHospitalEgp: 0,
      midRangeHospitalEgp: 0,
      budgetHospitalEgp: 0,
      typicalLengthOfStayNights: 0,
      preOpDays: 0,
      postOpDays: 0,
      notes: "",
    },
    {
      procedureCode: "",
      procedureName: "",
      category: "",
      premiumHospitalEgp: 0,
      midRangeHospitalEgp: 0,
      budgetHospitalEgp: 0,
      typicalLengthOfStayNights: 0,
      preOpDays: 0,
      postOpDays: 0,
      notes: "",
    },
    {
      procedureCode: "",
      procedureName: "",
      category: "",
      premiumHospitalEgp: 0,
      midRangeHospitalEgp: 0,
      budgetHospitalEgp: 0,
      typicalLengthOfStayNights: 0,
      preOpDays: 0,
      postOpDays: 0,
      notes: "",
    },
    {
      procedureCode: "",
      procedureName: "",
      category: "",
      premiumHospitalEgp: 0,
      midRangeHospitalEgp: 0,
      budgetHospitalEgp: 0,
      typicalLengthOfStayNights: 0,
      preOpDays: 0,
      postOpDays: 0,
      notes: "",
    },
  ],
  accommodations: [
    {
      hotelCode: "",
      hotelName: "",
      starRating: "",
      location: "",
      roomType: "",
      pricePerNightEgp: 0,
      mealPlan: "",
      mealPlanCostEgpPerDay: 0,
      airportDistanceKm: 0,
      notes: "",
    },
    {
      hotelCode: "",
      hotelName: "",
      starRating: "",
      location: "",
      roomType: "",
      pricePerNightEgp: 0,
      mealPlan: "",
      mealPlanCostEgpPerDay: 0,
      airportDistanceKm: 0,
      notes: "",
    },
    {
      hotelCode: "",
      hotelName: "",
      starRating: "",
      location: "",
      roomType: "",
      pricePerNightEgp: 0,
      mealPlan: "",
      mealPlanCostEgpPerDay: 0,
      airportDistanceKm: 0,
      notes: "",
    },
    {
      hotelCode: "",
      hotelName: "",
      starRating: "",
      location: "",
      roomType: "",
      pricePerNightEgp: 0,
      mealPlan: "",
      mealPlanCostEgpPerDay: 0,
      airportDistanceKm: 0,
      notes: "",
    },
    {
      hotelCode: "",
      hotelName: "",
      starRating: "",
      location: "",
      roomType: "",
      pricePerNightEgp: 0,
      mealPlan: "",
      mealPlanCostEgpPerDay: 0,
      airportDistanceKm: 0,
      notes: "",
    },
  ],
  transportation: [
    {
      serviceType: "",
      description: "",
      routeDetails: "",
      vehicleType: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      provider: "",
      notes: "",
    },
    {
      serviceType: "",
      description: "",
      routeDetails: "",
      vehicleType: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      provider: "",
      notes: "",
    },
    {
      serviceType: "",
      description: "",
      routeDetails: "",
      vehicleType: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      provider: "",
      notes: "",
    },
    {
      serviceType: "",
      description: "",
      routeDetails: "",
      vehicleType: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      provider: "",
      notes: "",
    },
    {
      serviceType: "",
      description: "",
      routeDetails: "",
      vehicleType: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      provider: "",
      notes: "",
    },
  ],
  tourismExtras: [
    {
      serviceCode: "",
      serviceName: "",
      category: "",
      description: "",
      duration: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      maxPersons: 0,
      notes: "",
    },
    {
      serviceCode: "",
      serviceName: "",
      category: "",
      description: "",
      duration: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      maxPersons: 0,
      notes: "",
    },
    {
      serviceCode: "",
      serviceName: "",
      category: "",
      description: "",
      duration: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      maxPersons: 0,
      notes: "",
    },
    {
      serviceCode: "",
      serviceName: "",
      category: "",
      description: "",
      duration: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      maxPersons: 0,
      notes: "",
    },
    {
      serviceCode: "",
      serviceName: "",
      category: "",
      description: "",
      duration: "",
      costEgp: 0,
      costUsd: 0,
      costEur: 0,
      maxPersons: 0,
      notes: "",
    },
  ],
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clampNonNegative = (value: number) => (value < 0 ? 0 : value);

const computeRateToUsd = (usdToCurrency: number) => {
  if (!Number.isFinite(usdToCurrency) || usdToCurrency <= 0) {
    return 0;
  }
  return 1 / usdToCurrency;
};

export const buildDefaultQuoteInput = (): QuoteInput => {
  return {
    meta: {
      quoteDate: "",
      quoteNumber: "",
      clientType: "",
      patientName: "",
      country: "",
      age: "",
    },
    medical: {
      procedureName: "",
      hospitalTier: "",
      medicalCostEgp: 0,
      lengthOfStayNights: 0,
    },
    accommodation: {
      hotelCategory: "",
      roomType: "",
      mealPlan: "",
      costPerNightEgp: 0,
      mealPlanCostPerDayEgp: 0,
    },
    transportation: {
      flightCostUsd: 0,
      flightOrigin: "",
      flightType: "",
      airportTransfersEgp: 0,
      airportVehicleType: "",
      localTransportEgp: 0,
      localTransportDays: 0,
    },
    tourismServices: DEFAULT_TOURISM_SERVICES,
    indirectCosts: {
      expectedAnnualPatientVolume: 0,
      items: DEFAULT_INDIRECT_COST_ITEMS,
    },
    currencyRates: DEFAULT_CURRENCY_RATES,
    dataSheets: DEFAULT_DATA_SHEETS,
  };
};

const computeIndirectCosts = (
  expectedAnnualPatientVolume: number,
  items: IndirectCostItemInput[],
) => {
  const safeVolume = expectedAnnualPatientVolume;

  const computedItems = items.map((item) => {
    const annualCostUsd = clampNonNegative(toNumber(item.annualCostUsd));
    const monthlyCostUsd = annualCostUsd / 12;
    const perPatientUsd = safeVolume > 0 ? annualCostUsd / safeVolume : 0;

    return {
      ...item,
      annualCostUsd,
      monthlyCostUsd,
      perPatientUsd,
    };
  });

  const totals = computedItems.reduce(
    (acc, item) => {
      acc.annualUsd += item.annualCostUsd;
      acc.monthlyUsd += item.monthlyCostUsd;
      acc.perPatientUsd += item.perPatientUsd;
      return acc;
    },
    { annualUsd: 0, monthlyUsd: 0, perPatientUsd: 0 },
  );

  return {
    expectedAnnualPatientVolume: safeVolume,
    items: computedItems,
    totals,
  };
};

export const calculateQuote = (input: QuoteInput): QuoteComputed => {
  const currencyRates = (input.currencyRates ?? []).map((rate) => {
    const usdToCurrency = clampNonNegative(toNumber(rate.usdToCurrency));
    return {
      ...rate,
      usdToCurrency,
      rateToUsd: computeRateToUsd(usdToCurrency),
    };
  });

  const egpRate =
    currencyRates.find((rate) => rate.code === "EGP")?.rateToUsd ?? 0;

  const medicalCostEgp = clampNonNegative(
    toNumber(input.medical.medicalCostEgp),
  );
  const medicalCostUsd = medicalCostEgp * egpRate;
  const lengthOfStay = clampNonNegative(
    toNumber(input.medical.lengthOfStayNights),
  );

  const costPerNightEgp = clampNonNegative(
    toNumber(input.accommodation.costPerNightEgp),
  );
  const accommodationTotalEgp = costPerNightEgp * lengthOfStay;
  const accommodationTotalUsd = accommodationTotalEgp * egpRate;

  const mealPlanCostEgp = clampNonNegative(
    toNumber(input.accommodation.mealPlanCostPerDayEgp),
  );
  const mealPlanTotalEgp = mealPlanCostEgp * lengthOfStay;
  const mealPlanTotalUsd = mealPlanTotalEgp * egpRate;

  const airportTransfersEgp = clampNonNegative(
    toNumber(input.transportation.airportTransfersEgp),
  );
  const airportTransfersUsd = airportTransfersEgp * egpRate;
  const localTransportEgp = clampNonNegative(
    toNumber(input.transportation.localTransportEgp),
  );
  const localTransportUsd = localTransportEgp * egpRate;

  const tourismServices = (input.tourismServices ?? []).map((item) => {
    const quantity = clampNonNegative(toNumber(item.quantity));
    const unitCostEgp = clampNonNegative(toNumber(item.unitCostEgp));
    const unitCostUsd = unitCostEgp * egpRate;
    const totalEgp = quantity * unitCostEgp;
    const totalUsd = totalEgp * egpRate;
    return {
      ...item,
      quantity,
      unitCostEgp,
      unitCostUsd,
      totalEgp,
      totalUsd,
    };
  });

  const extrasTotals = tourismServices.reduce(
    (acc, item) => {
      acc.totalEgp += item.totalEgp;
      acc.totalUsd += item.totalUsd;
      return acc;
    },
    { totalEgp: 0, totalUsd: 0 },
  );

  const indirectCosts = computeIndirectCosts(
    clampNonNegative(toNumber(input.indirectCosts.expectedAnnualPatientVolume)),
    input.indirectCosts.items ?? [],
  );

  const flightCostUsd = clampNonNegative(
    toNumber(input.transportation.flightCostUsd),
  );

  const summary: QuoteSummary = {
    medicalProcedureCostUsd: medicalCostUsd,
    medicalProcedureCostEgp: medicalCostEgp,
    accommodationCostUsd: accommodationTotalUsd + mealPlanTotalUsd,
    accommodationCostEgp: accommodationTotalEgp + mealPlanTotalEgp,
    transportationCostUsd:
      flightCostUsd + airportTransfersUsd + localTransportUsd,
    transportationCostEgp: airportTransfersEgp + localTransportEgp,
    tourismCostUsd: extrasTotals.totalUsd,
    tourismCostEgp: extrasTotals.totalEgp,
    indirectCostPerPatientUsd: indirectCosts.totals.perPatientUsd,
    subtotalUsd: 0,
    profitMarginRate: 0,
    profitAmountUsd: 0,
    finalPriceUsd: 0,
  };

  summary.subtotalUsd =
    summary.medicalProcedureCostUsd +
    summary.accommodationCostUsd +
    summary.transportationCostUsd +
    summary.tourismCostUsd +
    summary.indirectCostPerPatientUsd;

  const clientType = input.meta.clientType?.toUpperCase?.() ?? "";
  summary.profitMarginRate = clientType === "B2B" ? 0.35 : 0.5;
  summary.profitAmountUsd = summary.subtotalUsd * summary.profitMarginRate;
  summary.finalPriceUsd = summary.subtotalUsd + summary.profitAmountUsd;

  return {
    currencyRates,
    medicalCostUsd,
    accommodation: {
      nights: lengthOfStay,
      mealPlanDays: lengthOfStay,
      totalEgp: accommodationTotalEgp,
      totalUsd: accommodationTotalUsd,
      mealPlanTotalEgp,
      mealPlanTotalUsd,
    },
    transportation: {
      airportTransfersUsd,
      localTransportUsd,
    },
    tourismServices,
    extrasTotals,
    indirectCosts,
    summary,
  };
};
