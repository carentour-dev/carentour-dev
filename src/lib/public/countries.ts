import type { PublicLocale } from "@/i18n/routing";

const ISO_REGION_CODES = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AL",
  "AM",
  "AO",
  "AR",
  "AT",
  "AU",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BN",
  "BO",
  "BR",
  "BS",
  "BT",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FM",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GH",
  "GM",
  "GN",
  "GQ",
  "GR",
  "GT",
  "GW",
  "GY",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IN",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MR",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NE",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PG",
  "PH",
  "PK",
  "PL",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SI",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SY",
  "SZ",
  "TD",
  "TG",
  "TH",
  "TJ",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VN",
  "VU",
  "WS",
  "YE",
  "ZA",
  "ZM",
  "ZW",
] as const;

const ENGLISH_REGION_NAMES = new Intl.DisplayNames(["en"], {
  type: "region",
});
const ARABIC_REGION_NAMES = new Intl.DisplayNames(["ar"], {
  type: "region",
});

const COUNTRY_CODE_ALIAS_BY_KEY: Record<string, string> = {
  usa: "US",
  us: "US",
  uk: "GB",
  uae: "AE",
  ksa: "SA",
  turkey: "TR",
  turkiye: "TR",
  britain: "GB",
  greatbritain: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  czechrepublic: "CZ",
  southkorea: "KR",
  northkorea: "KP",
  ivorycoast: "CI",
  palestine: "PS",
};

function normalizeCountryLookupKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase();
}

const COUNTRY_CODE_BY_NAME = new Map<string, string>(
  ISO_REGION_CODES.flatMap((code) => {
    const entries: Array<[string, string]> = [[code.toLowerCase(), code]];
    const englishName = ENGLISH_REGION_NAMES.of(code);

    if (englishName) {
      entries.push([normalizeCountryLookupKey(englishName), code]);
    }

    return entries;
  }),
);

function resolveCountryCode(countryName: string) {
  const normalizedKey = normalizeCountryLookupKey(countryName);

  if (!normalizedKey) {
    return null;
  }

  return (
    COUNTRY_CODE_ALIAS_BY_KEY[normalizedKey] ??
    COUNTRY_CODE_BY_NAME.get(normalizedKey) ??
    null
  );
}

export function localizeCountryName(countryName: string, locale: PublicLocale) {
  if (locale !== "ar") {
    return countryName;
  }

  const countryCode = resolveCountryCode(countryName);
  if (!countryCode) {
    return countryName;
  }

  return ARABIC_REGION_NAMES.of(countryCode) ?? countryName;
}
