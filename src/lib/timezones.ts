import type { ComboOption } from "@/components/ui/combobox";

const PREFERRED_TIMEZONES = [
  "Africa/Cairo",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Istanbul",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

const FALLBACK_TIMEZONES = [
  ...PREFERRED_TIMEZONES,
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "Asia/Amman",
  "Asia/Beirut",
  "Asia/Jerusalem",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
];

const supportedValuesOf = (
  Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  }
).supportedValuesOf;

const getSupportedTimeZones = () => {
  try {
    return supportedValuesOf?.("timeZone") ?? FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

const formatTimeZoneLabel = (timeZone: string) =>
  timeZone.replace(/_/g, " ").replace("/", " / ");

const orderedTimeZones = Array.from(
  new Set([...PREFERRED_TIMEZONES, ...getSupportedTimeZones()]),
);

export const TIMEZONE_OPTIONS: ComboOption[] = orderedTimeZones.map(
  (timeZone) => ({
    value: timeZone,
    label: formatTimeZoneLabel(timeZone),
    searchTerms: [timeZone, timeZone.replace(/_/g, " ")],
  }),
);

export const getDefaultTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
