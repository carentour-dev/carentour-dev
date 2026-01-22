import { load } from "cheerio";
import { ApiError } from "@/server/utils/errors";

const BANQUE_MISR_URL =
  "https://banquemisr.com/en/Home/CAPITAL-MARKETS/Exchange-Rates-and-Currencies";
const CACHE_TTL_MS = 15 * 60 * 1000;

const SUPPORTED_CODES = ["USD", "EUR", "GBP", "SAR", "AED"] as const;
const OUTPUT_CODES = ["EGP", "EUR", "GBP", "SAR", "AED"] as const;

const CURRENCY_LABELS: Record<string, string> = {
  EGP: "EGP (Egyptian Pound)",
  EUR: "EUR (Euro)",
  GBP: "GBP (British Pound)",
  SAR: "SAR (Saudi Riyal)",
  AED: "AED (UAE Dirham)",
  USD: "USD (US Dollar)",
};

const CURRENCY_ALIASES: Record<string, string[]> = {
  USD: ["USD", "US DOLLAR", "U.S. DOLLAR", "US$", "DOLLAR"],
  EUR: ["EUR", "EURO"],
  GBP: ["GBP", "POUND STERLING", "BRITISH POUND", "STERLING"],
  SAR: ["SAR", "SAUDI RIYAL"],
  AED: ["AED", "UAE DIRHAM", "U.A.E. DIRHAM", "EMIRATI DIRHAM"],
};

type ParsedRate = {
  code: (typeof SUPPORTED_CODES)[number];
  egpBuyRate: number;
};

export type BanqueMisrRate = {
  code: (typeof OUTPUT_CODES)[number];
  name: string;
  usdToCurrency: number;
};

export type BanqueMisrRatesPayload = {
  source: "Banque Misr";
  url: string;
  fetchedAt: string;
  asOf: string | null;
  rates: BanqueMisrRate[];
};

let cache: {
  expiresAt: number;
  payload: BanqueMisrRatesPayload;
} | null = null;

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveCurrencyCode = (value: string) => {
  const normalized = value.toUpperCase().replace(/\s+/g, " ").trim();
  const codeMatch = normalized.match(/\b[A-Z]{3}\b/);
  if (codeMatch) {
    const match = codeMatch[0] as (typeof SUPPORTED_CODES)[number];
    if (SUPPORTED_CODES.includes(match)) {
      return match;
    }
  }

  for (const code of SUPPORTED_CODES) {
    const aliases = CURRENCY_ALIASES[code] ?? [];
    if (aliases.some((alias) => normalized.includes(alias))) {
      return code;
    }
  }

  return null;
};

const extractAsOf = (html: string) => {
  const text = html.replace(/\s+/g, " ");
  const match =
    text.match(/as\s+of\s*[:\-]?\s*([A-Za-z0-9,\/\-. ]{6,30})/i) ??
    text.match(/updated\s+on\s*[:\-]?\s*([A-Za-z0-9,\/\-. ]{6,30})/i) ??
    text.match(/last\s+updated\s*[:\-]?\s*([A-Za-z0-9,\/\-. ]{6,30})/i);

  if (!match) {
    return null;
  }

  return match[1]?.trim() ?? null;
};

const findHeaderIndexes = (headers: string[]) => {
  const normalized = headers.map(normalizeHeader);
  const currencyIndex = normalized.findIndex((value) =>
    ["currency", "curr", "ccy"].some((token) => value.includes(token)),
  );

  const buyCandidates = normalized
    .map((value, index) => ({ value, index }))
    .filter(({ value }) =>
      ["buy", "buying", "purchase", "bid"].some((token) =>
        value.includes(token),
      ),
    );

  if (currencyIndex < 0 || buyCandidates.length === 0) {
    return null;
  }

  const transferCandidate = buyCandidates.find(({ value }) =>
    value.includes("transfer"),
  );

  const buyIndex = transferCandidate?.index ?? buyCandidates[0]!.index;

  return { currencyIndex, buyIndex };
};

const buildColumnHeaders = ($: ReturnType<typeof load>, rows: Array<any>) => {
  if (!rows.length) {
    return null;
  }

  const topCells = $(rows[0]).find("th,td");
  if (!topCells.length) {
    return null;
  }

  const columnGroups: string[] = [];
  const skipSubheader = new Set<number>();
  let columnIndex = 0;

  topCells.each((_, cell) => {
    const $cell = $(cell);
    const label = $cell.text().trim();
    const colspan = Number($cell.attr("colspan") ?? "1") || 1;
    const rowspan = Number($cell.attr("rowspan") ?? "1") || 1;

    for (let i = 0; i < colspan; i += 1) {
      columnGroups.push(label);
      if (rowspan > 1) {
        skipSubheader.add(columnIndex + i);
      }
    }

    columnIndex += colspan;
  });

  if (rows.length < 2) {
    return columnGroups;
  }

  const subCells = $(rows[1]).find("th,td");
  if (!subCells.length) {
    return columnGroups;
  }

  const subHeaders = subCells.map((_, cell) => $(cell).text().trim()).get();
  let subIndex = 0;

  return columnGroups.map((group, index) => {
    if (skipSubheader.has(index)) {
      return group;
    }

    const subHeader = subHeaders[subIndex] ?? "";
    subIndex += 1;
    return [group, subHeader].filter(Boolean).join(" ");
  });
};

const resolveHeaderConfig = ($: ReturnType<typeof load>, rows: Array<any>) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const cells = $(rows[rowIndex]).find("th,td");
    if (!cells.length) {
      continue;
    }
    const headers = cells
      .map((_, cell) => $(cell).text().trim())
      .get()
      .filter(Boolean);
    const indexes = findHeaderIndexes(headers);
    if (indexes) {
      return {
        headerRowIndex: rowIndex,
        headerRowCount: 1,
        ...indexes,
      };
    }
  }

  let headerRowIndex = -1;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const headerCells = $(rows[rowIndex]).find("th,td");
    if (!headerCells.length) {
      continue;
    }
    const headerText = headerCells
      .map((_, cell) => $(cell).text().trim())
      .get()
      .join(" ");
    if (normalizeHeader(headerText).includes("currency")) {
      headerRowIndex = rowIndex;
      break;
    }
  }

  if (headerRowIndex < 0) {
    return null;
  }

  let headerRowCount = 1;
  const nextRow = rows[headerRowIndex + 1];
  if (nextRow) {
    const nextCells = $(nextRow).find("th,td");
    const nextText = nextCells
      .map((_, cell) => normalizeHeader($(cell).text()))
      .get();
    const hasBuySell = nextText.some(
      (value) => value.includes("buy") || value.includes("sell"),
    );
    if (hasBuySell) {
      headerRowCount = 2;
    }
  }

  const headerRows = rows.slice(
    headerRowIndex,
    headerRowIndex + headerRowCount,
  );
  const columnHeaders = buildColumnHeaders($, headerRows);
  if (!columnHeaders?.length) {
    return null;
  }

  const normalized = columnHeaders.map(normalizeHeader);
  const currencyIndex = normalized.findIndex((value) =>
    value.includes("currency"),
  );
  const transferBuyIndex = normalized.findIndex(
    (value) => value.includes("transfer") && value.includes("buy"),
  );
  const buyIndex =
    transferBuyIndex >= 0
      ? transferBuyIndex
      : normalized.findIndex((value) => value.includes("buy"));

  if (currencyIndex < 0 || buyIndex < 0) {
    return null;
  }

  return {
    headerRowIndex,
    headerRowCount: Math.max(1, headerRowCount),
    currencyIndex,
    buyIndex,
  };
};

const parseRatesFromHtml = (html: string): ParsedRate[] => {
  const $ = load(html);
  const tables = $("table");
  const results = new Map<string, number>();

  tables.each((_, table) => {
    const rows = $(table).find("tr").toArray();
    if (rows.length < 2) {
      return;
    }

    const headerConfig = resolveHeaderConfig($, rows);
    if (!headerConfig) {
      return;
    }

    const dataRows = rows.slice(
      headerConfig.headerRowIndex + headerConfig.headerRowCount,
    );

    dataRows.forEach((row) => {
      const cells = $(row).find("td");
      if (!cells.length) {
        return;
      }

      const currencyCell = cells.get(headerConfig.currencyIndex);
      const buyCell = cells.get(headerConfig.buyIndex);

      if (!currencyCell || !buyCell) {
        return;
      }

      const currencyText = $(currencyCell).text().trim();
      const buyText = $(buyCell).text().trim();
      const code = resolveCurrencyCode(currencyText);

      if (!code) {
        return;
      }

      const buyRate = parseNumber(buyText);
      if (!buyRate || buyRate <= 0) {
        return;
      }

      if (!results.has(code)) {
        results.set(code, buyRate);
      }
    });
  });

  return Array.from(results.entries()).map(([code, egpBuyRate]) => ({
    code: code as ParsedRate["code"],
    egpBuyRate,
  }));
};

const buildRatesPayload = (
  parsedRates: ParsedRate[],
  fetchedAt: string,
  asOf: string | null,
): BanqueMisrRatesPayload => {
  const byCode = new Map(
    parsedRates.map((rate) => [rate.code, rate.egpBuyRate]),
  );
  const usdBuyRate = byCode.get("USD");

  if (!usdBuyRate) {
    throw new ApiError(502, "Banque Misr rates missing USD buy rate.");
  }

  const rates: BanqueMisrRate[] = [];

  OUTPUT_CODES.forEach((code) => {
    if (code === "EGP") {
      rates.push({
        code,
        name: CURRENCY_LABELS[code],
        usdToCurrency: usdBuyRate,
      });
      return;
    }

    const egpBuyRate = byCode.get(code);
    if (!egpBuyRate || egpBuyRate <= 0) {
      return;
    }

    rates.push({
      code,
      name: CURRENCY_LABELS[code],
      usdToCurrency: usdBuyRate / egpBuyRate,
    });
  });

  if (!rates.length) {
    throw new ApiError(502, "Banque Misr rates did not include usable data.");
  }

  return {
    source: "Banque Misr",
    url: BANQUE_MISR_URL,
    fetchedAt,
    asOf,
    rates,
  };
};

export async function fetchBanqueMisrRates(): Promise<BanqueMisrRatesPayload> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.payload;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  let response: Response;

  try {
    response = await fetch(BANQUE_MISR_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        504,
        "Banque Misr exchange rate request timed out.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "Failed to fetch Banque Misr exchange rates.",
      response.statusText,
    );
  }

  const html = await response.text();
  const parsedRates = parseRatesFromHtml(html);
  if (!parsedRates.length) {
    throw new ApiError(502, "Unable to parse Banque Misr exchange rates.");
  }

  const fetchedAt = new Date().toISOString();
  const asOf = extractAsOf(html);
  const payload = buildRatesPayload(parsedRates, fetchedAt, asOf);

  cache = {
    expiresAt: now + CACHE_TTL_MS,
    payload,
  };

  return payload;
}
