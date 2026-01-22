export type ClientType = "" | "B2B" | "B2C";

export type QuoteMeta = {
  quoteDate: string;
  quoteNumber: string;
  clientType: ClientType;
  patientName: string;
  country: string;
  age: string;
};

export type MedicalProcedureInput = {
  procedureName: string;
  serviceProviderId?: string;
  treatmentId?: string;
  procedureId?: string;
  costBreakdown?: MedicalCostBreakdownItem[];
  hospitalTier: string;
  medicalCostEgp: number;
  lengthOfStayNights: number;
};

export type MedicalCostBreakdownItem = {
  code?: string;
  label: string;
  amountEgp: number;
  notes?: string;
};

export type AccommodationInput = {
  hotelCategory: string;
  roomType: string;
  mealPlan: string;
  costPerNightEgp: number;
  mealPlanCostPerDayEgp: number;
};

export type TransportationInput = {
  flightCostUsd: number;
  flightOrigin: string;
  flightType: string;
  airportTransfersEgp: number;
  airportVehicleType: string;
  localTransportEgp: number;
  localTransportDays: number;
};

export type TourismServiceInput = {
  serviceName: string;
  quantity: number;
  unitCostEgp: number;
};

export type IndirectCostItemInput = {
  category: string;
  annualCostUsd: number;
  notes: string;
};

export type IndirectCostsInput = {
  expectedAnnualPatientVolume: number;
  items: IndirectCostItemInput[];
};

export type CurrencyRateInput = {
  code: string;
  name: string;
  usdToCurrency: number;
  notes: string;
};

export type MedicalProcedureDataSheetRow = {
  procedureCode: string;
  procedureName: string;
  category: string;
  premiumHospitalEgp: number;
  midRangeHospitalEgp: number;
  budgetHospitalEgp: number;
  typicalLengthOfStayNights: number;
  preOpDays: number;
  postOpDays: number;
  notes: string;
};

export type AccommodationDataSheetRow = {
  hotelCode: string;
  hotelName: string;
  starRating: string;
  location: string;
  roomType: string;
  pricePerNightEgp: number;
  mealPlan: string;
  mealPlanCostEgpPerDay: number;
  airportDistanceKm: number;
  notes: string;
};

export type TransportationDataSheetRow = {
  serviceType: string;
  description: string;
  routeDetails: string;
  vehicleType: string;
  costEgp: number;
  costUsd: number;
  costEur: number;
  provider: string;
  notes: string;
};

export type TourismExtrasDataSheetRow = {
  serviceCode: string;
  serviceName: string;
  category: string;
  description: string;
  duration: string;
  costEgp: number;
  costUsd: number;
  costEur: number;
  maxPersons: number;
  notes: string;
};

export type QuoteDataSheets = {
  medicalProcedures: MedicalProcedureDataSheetRow[];
  accommodations: AccommodationDataSheetRow[];
  transportation: TransportationDataSheetRow[];
  tourismExtras: TourismExtrasDataSheetRow[];
};

export type QuoteInput = {
  meta: QuoteMeta;
  medical: MedicalProcedureInput;
  accommodation: AccommodationInput;
  transportation: TransportationInput;
  tourismServices: TourismServiceInput[];
  indirectCosts: IndirectCostsInput;
  currencyRates: CurrencyRateInput[];
  dataSheets: QuoteDataSheets;
};

export type ComputedCurrencyRate = CurrencyRateInput & {
  rateToUsd: number;
};

export type ComputedTourismService = TourismServiceInput & {
  unitCostUsd: number;
  totalEgp: number;
  totalUsd: number;
};

export type ComputedIndirectCostItem = IndirectCostItemInput & {
  monthlyCostUsd: number;
  perPatientUsd: number;
};

export type ComputedIndirectCosts = {
  expectedAnnualPatientVolume: number;
  items: ComputedIndirectCostItem[];
  totals: {
    annualUsd: number;
    monthlyUsd: number;
    perPatientUsd: number;
  };
};

export type QuoteSummary = {
  medicalProcedureCostUsd: number;
  medicalProcedureCostEgp: number;
  accommodationCostUsd: number;
  accommodationCostEgp: number;
  transportationCostUsd: number;
  transportationCostEgp: number;
  tourismCostUsd: number;
  tourismCostEgp: number;
  indirectCostPerPatientUsd: number;
  subtotalUsd: number;
  profitMarginRate: number;
  profitAmountUsd: number;
  finalPriceUsd: number;
};

export type QuoteComputed = {
  currencyRates: ComputedCurrencyRate[];
  medicalCostUsd: number;
  accommodation: {
    nights: number;
    mealPlanDays: number;
    totalEgp: number;
    totalUsd: number;
    mealPlanTotalEgp: number;
    mealPlanTotalUsd: number;
  };
  transportation: {
    airportTransfersUsd: number;
    localTransportUsd: number;
  };
  tourismServices: ComputedTourismService[];
  extrasTotals: {
    totalEgp: number;
    totalUsd: number;
  };
  indirectCosts: ComputedIndirectCosts;
  summary: QuoteSummary;
};
