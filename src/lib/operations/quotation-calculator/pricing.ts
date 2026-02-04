import type { ClientType, PricingSettings } from "./types";

const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  version: 1,
  b2bMedicalMarkupMultiplier: 1.62,
  b2cMedicalMarkupMultiplier: 1.8,
  b2bNonMedicalMarginRate: 0.35,
  b2cNonMedicalMarginRate: 0.5,
};

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const clampNonNegative = (value: number) => (value < 0 ? 0 : value);

const clampPositive = (value: number, fallback: number) =>
  value > 0 ? value : fallback;

const readEnvNumber = (key: string, fallback: number) => {
  if (typeof process === "undefined") {
    return fallback;
  }
  const raw = process.env[key];
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }
  return toNumber(raw, fallback);
};

export const getDefaultPricingSettings = (): PricingSettings => ({
  version: DEFAULT_PRICING_SETTINGS.version,
  b2bMedicalMarkupMultiplier: clampPositive(
    readEnvNumber(
      "NEXT_PUBLIC_OPERATIONS_MEDICAL_MARKUP_MULTIPLIER_B2B",
      DEFAULT_PRICING_SETTINGS.b2bMedicalMarkupMultiplier,
    ),
    DEFAULT_PRICING_SETTINGS.b2bMedicalMarkupMultiplier,
  ),
  b2cMedicalMarkupMultiplier: clampPositive(
    readEnvNumber(
      "NEXT_PUBLIC_OPERATIONS_MEDICAL_MARKUP_MULTIPLIER_B2C",
      DEFAULT_PRICING_SETTINGS.b2cMedicalMarkupMultiplier,
    ),
    DEFAULT_PRICING_SETTINGS.b2cMedicalMarkupMultiplier,
  ),
  b2bNonMedicalMarginRate: clampNonNegative(
    readEnvNumber(
      "NEXT_PUBLIC_OPERATIONS_NON_MEDICAL_MARGIN_RATE_B2B",
      DEFAULT_PRICING_SETTINGS.b2bNonMedicalMarginRate,
    ),
  ),
  b2cNonMedicalMarginRate: clampNonNegative(
    readEnvNumber(
      "NEXT_PUBLIC_OPERATIONS_NON_MEDICAL_MARGIN_RATE_B2C",
      DEFAULT_PRICING_SETTINGS.b2cNonMedicalMarginRate,
    ),
  ),
});

export const normalizePricingSettings = (
  settings?: Partial<PricingSettings> | null,
): PricingSettings => {
  const defaults = getDefaultPricingSettings();
  const input = settings ?? {};

  return {
    version: defaults.version,
    b2bMedicalMarkupMultiplier: clampPositive(
      toNumber(
        input.b2bMedicalMarkupMultiplier,
        defaults.b2bMedicalMarkupMultiplier,
      ),
      defaults.b2bMedicalMarkupMultiplier,
    ),
    b2cMedicalMarkupMultiplier: clampPositive(
      toNumber(
        input.b2cMedicalMarkupMultiplier,
        defaults.b2cMedicalMarkupMultiplier,
      ),
      defaults.b2cMedicalMarkupMultiplier,
    ),
    b2bNonMedicalMarginRate: clampNonNegative(
      toNumber(input.b2bNonMedicalMarginRate, defaults.b2bNonMedicalMarginRate),
    ),
    b2cNonMedicalMarginRate: clampNonNegative(
      toNumber(input.b2cNonMedicalMarginRate, defaults.b2cNonMedicalMarginRate),
    ),
  };
};

export const getMedicalMarkupMultiplier = (
  clientType: ClientType,
  pricingSettings: PricingSettings,
): number => {
  if (clientType === "B2B") {
    return pricingSettings.b2bMedicalMarkupMultiplier;
  }
  if (clientType === "B2C") {
    return pricingSettings.b2cMedicalMarkupMultiplier;
  }
  return 1;
};

export const getNonMedicalMarginRate = (
  clientType: ClientType,
  pricingSettings: PricingSettings,
): number => {
  if (clientType === "B2B") {
    return pricingSettings.b2bNonMedicalMarginRate;
  }
  if (clientType === "B2C") {
    return pricingSettings.b2cNonMedicalMarginRate;
  }
  return 0;
};
