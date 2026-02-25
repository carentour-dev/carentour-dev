import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { fetchBanqueMisrRates } from "@/server/modules/exchangeRates/banqueMisr";
import {
  PAYABLE_SETTLEMENT_OPEN_STATUSES,
  canCancelPayableStatus,
  canEditPayableStatus,
  canPostPayableSettlement,
  canSubmitPayableStatus,
} from "@/lib/finance/payablesState";
import { financeCounterpartySync } from "./counterpartySync";

export type FinanceActor = {
  userId: string;
  profileId?: string | null;
  permissions?: string[] | null;
};

type ChartAccountRow = {
  id: string;
  account_code: string;
  name: string;
  account_type: string;
  is_active: boolean;
};

type JournalLineInput = {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string | null;
  costTagCaseId?: string | null;
  costTagDepartment?: string | null;
};

type ResolvedFinanceSettings = {
  baseCurrency: FinanceCurrency;
  approvalThresholds: Record<string, Record<FinanceCurrency, number>>;
  postingAccounts: Record<string, string>;
  id: string | null;
};

type PayableAllocation = {
  payableId: string;
  amount: number;
};

const FINANCE_CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"] as const;
type FinanceCurrency = (typeof FINANCE_CURRENCIES)[number];

const PAYMENT_METHODS = ["bank_transfer", "cash", "card", "gateway"] as const;
const PAYMENT_STATUSES = ["recorded", "posted", "reversed"] as const;

const EPSILON = 0.005;

const DEFAULT_THRESHOLD_MAP: Record<FinanceCurrency, number> = {
  EGP: 100000,
  USD: 2000,
  EUR: 1800,
  GBP: 1600,
  SAR: 7500,
  AED: 7300,
};

const DEFAULT_APPROVAL_THRESHOLDS: Record<
  string,
  Record<FinanceCurrency, number>
> = {
  payable_submit: { ...DEFAULT_THRESHOLD_MAP },
  payable_payment: { ...DEFAULT_THRESHOLD_MAP },
};

const DEFAULT_POSTING_ACCOUNTS: Record<string, string> = {
  accounts_receivable: "1100",
  cash_bank: "1000",
  accounts_payable: "2100",
  revenue: "4000",
  contra_revenue: "4050",
  expense: "5000",
  cogs: "5100",
  writeoff_expense: "6200",
  fx_gain_loss: "7000",
};

const uuidSchema = z.string().uuid();

const financeCurrencySchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(FINANCE_CURRENCIES),
);

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const financeDateSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (ISO_DATE_ONLY_REGEX.test(value)) {
      return true;
    }
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime());
  }, "Invalid date value");

const counterpartyBaseSchema = z.object({
  name: z.string().min(1).max(180),
  kind: z.string().min(1).max(80),
  serviceProviderId: z.string().uuid().optional(),
  hotelId: z.string().uuid().optional(),
  externalCode: z.string().max(120).optional(),
  isActive: z.boolean().optional(),
  contactEmail: z.string().email().max(180).optional(),
  contactPhone: z.string().max(80).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const counterpartySchema = counterpartyBaseSchema.refine(
  (value) => !(value.serviceProviderId && value.hotelId),
  "Counterparty can link to either a service provider or a hotel, not both",
);

const counterpartyPatchSchema = counterpartyBaseSchema
  .partial()
  .refine(
    (value) => !(value.serviceProviderId && value.hotelId),
    "Counterparty can link to either a service provider or a hotel, not both",
  );

const counterpartyReconcileSchema = z.object({
  mode: z.enum(["dry_run", "apply"]),
  sourceType: z.enum(["service_provider", "hotel", "all"]).optional(),
  sourceIds: z.array(z.string().uuid()).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const payableLineSchema = z.object({
  description: z.string().min(1).max(240),
  amount: z.coerce.number().gt(0),
  financeChartAccountId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createPayableSchema = z.object({
  counterpartyId: z.string().uuid(),
  financeCaseId: z.string().uuid().optional(),
  financeOrderId: z.string().uuid().optional(),
  issueDate: financeDateSchema.optional(),
  dueDate: financeDateSchema.optional(),
  currency: financeCurrencySchema.default("EGP"),
  notes: z.string().max(2000).optional(),
  lines: z.array(payableLineSchema).min(1),
});

const updatePayableSchema = z.object({
  counterpartyId: z.string().uuid().optional(),
  financeCaseId: z.string().uuid().optional(),
  financeOrderId: z.string().uuid().optional(),
  issueDate: financeDateSchema.optional(),
  dueDate: financeDateSchema.optional(),
  currency: financeCurrencySchema.optional(),
  notes: z.string().max(2000).optional(),
  lines: z.array(payableLineSchema).min(1).optional(),
});

const payablePaymentSchema = z
  .object({
    payableId: z.string().uuid().optional(),
    amount: z.coerce.number().gt(0).optional(),
    currency: financeCurrencySchema.default("EGP"),
    paymentDate: z.string().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).default("bank_transfer"),
    reference: z.string().max(160).optional(),
    notes: z.string().max(2000).optional(),
    allocations: z
      .array(
        z.object({
          payableId: z.string().uuid(),
          amount: z.coerce.number().gt(0),
        }),
      )
      .optional(),
  })
  .refine(
    (value) =>
      (Array.isArray(value.allocations) && value.allocations.length > 0) ||
      Number.isFinite(value.amount ?? NaN),
    "Provide either allocations or amount",
  );

const approvalDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  decisionNotes: z.string().max(2000).optional(),
});

const settingsPatchSchema = z.object({
  baseCurrency: financeCurrencySchema.optional(),
  approvalThresholds: z
    .record(z.record(z.coerce.number().nonnegative()))
    .optional(),
  postingAccounts: z.record(z.string().min(1).max(24)).optional(),
});

const chartAccountCreateSchema = z.object({
  accountCode: z.string().min(1).max(40),
  name: z.string().min(1).max(180),
  accountType: z.string().min(1).max(80),
  parentAccountId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const chartAccountPatchSchema = z.object({
  name: z.string().min(1).max(180).optional(),
  accountType: z.string().min(1).max(80).optional(),
  parentAccountId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const getClient = () => getSupabaseAdmin() as any;

const ensureActor = (actor?: FinanceActor) => {
  if (!actor?.userId) {
    throw new ApiError(401, "Operation requires an authenticated team member");
  }
  return actor;
};

const toDateOnly = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString().slice(0, 10);
  }

  if (!Number.isFinite(value.getTime())) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const normalizeMoney = (value: unknown) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(Math.max(parsed, 0) * 100) / 100;
};

const normalizeSignedMoney = (value: unknown) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
};

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeCounterpartyKind = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "vendor";
  }
  return normalized.toLowerCase().replace(/[\s-]+/g, "_");
};

const resolveCounterpartySourceKind = (
  kind: string,
): "manual" | "service_provider" | "hotel" => {
  if (kind === "hotel") {
    return "hotel";
  }
  if (kind === "hospital" || kind === "service_provider") {
    return "service_provider";
  }
  return "manual";
};

const toSlugCandidate = (value: string) => {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const slug = ascii
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `counterparty-${randomUUID().slice(0, 8)}`;
};

const pickContactValue = (contactInfo: unknown, keys: string[]) => {
  const record = toRecord(contactInfo);
  for (const key of keys) {
    const value = normalizeText(record[key] as string | null | undefined);
    if (value) {
      return value;
    }
  }
  return null;
};

const extractSourceContact = (contactInfo: unknown) => ({
  email: pickContactValue(contactInfo, [
    "email",
    "contact_email",
    "contactEmail",
    "primary_email",
    "primaryEmail",
  ]),
  phone: pickContactValue(contactInfo, [
    "phone",
    "contact_phone",
    "contactPhone",
    "mobile",
    "telephone",
  ]),
});

const buildSourceContactInfo = (input: {
  contactEmail: string | null;
  contactPhone: string | null;
}) => {
  const payload: Record<string, string> = {};
  if (input.contactEmail) {
    payload.email = input.contactEmail;
  }
  if (input.contactPhone) {
    payload.phone = input.contactPhone;
  }
  return Object.keys(payload).length > 0 ? payload : null;
};

const buildHotelSourceSnapshot = (row: any) => {
  const contact = extractSourceContact(row.contact_info);
  return {
    source_type: "hotel",
    source_id: row.id,
    name: normalizeText(row.name),
    kind: "hotel",
    contact_email: contact.email,
    contact_phone: contact.phone,
    external_code: normalizeText(row.slug),
    is_active: typeof row.is_partner === "boolean" ? row.is_partner : true,
    source_updated_at: row.updated_at ?? null,
  };
};

const buildServiceProviderSourceSnapshot = (row: any) => {
  const contact = extractSourceContact(row.contact_info);
  const facilityType = normalizeCounterpartyKind(row.facility_type);
  return {
    source_type: "service_provider",
    source_id: row.id,
    name: normalizeText(row.name),
    kind: facilityType === "hospital" ? "hospital" : "service_provider",
    contact_email: contact.email,
    contact_phone: contact.phone,
    external_code: normalizeText(row.slug),
    is_active: typeof row.is_partner === "boolean" ? row.is_partner : true,
    source_updated_at: row.updated_at ?? null,
  };
};

const generateUniqueSlug = async (input: {
  supabase: any;
  table: "hotels" | "service_providers";
  base: string;
}) => {
  const base = toSlugCandidate(input.base);
  for (let i = 0; i < 30; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data, error } = await input.supabase
      .from(input.table)
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (error) {
      throw new ApiError(
        500,
        `Failed to check slug uniqueness for ${input.table}`,
        error.message,
      );
    }

    if (!data || data.length === 0) {
      return candidate;
    }
  }

  return `${base}-${randomUUID().slice(0, 8)}`;
};

type CounterpartySourceResolution = {
  sourceType: "manual" | "service_provider" | "hotel";
  serviceProviderId: string | null;
  hotelId: string | null;
  sourceSnapshot: Record<string, unknown>;
  resolvedExternalCode: string | null;
  resolvedContactEmail: string | null;
  resolvedContactPhone: string | null;
  linkAction: "manual" | "linked_input" | "linked_existing" | "created_source";
};

const resolveCounterpartySourceReferences = async (input: {
  supabase: any;
  name: string;
  kind: string;
  externalCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  serviceProviderId: string | null;
  hotelId: string | null;
}): Promise<CounterpartySourceResolution> => {
  const externalCodeSlug = input.externalCode
    ? toSlugCandidate(input.externalCode)
    : null;

  if (input.hotelId) {
    const { data, error } = await input.supabase
      .from("hotels")
      .select("id, name, slug, contact_info, is_partner, updated_at")
      .eq("id", input.hotelId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load linked hotel for counterparty",
        error.message,
      );
    }

    if (!data) {
      throw new ApiError(404, "Linked hotel was not found");
    }

    const snapshot = buildHotelSourceSnapshot(data);
    return {
      sourceType: "hotel",
      serviceProviderId: null,
      hotelId: data.id,
      sourceSnapshot: snapshot,
      resolvedExternalCode:
        normalizeText(snapshot.external_code as string | null) ??
        input.externalCode,
      resolvedContactEmail:
        normalizeText(snapshot.contact_email as string | null) ??
        input.contactEmail,
      resolvedContactPhone:
        normalizeText(snapshot.contact_phone as string | null) ??
        input.contactPhone,
      linkAction: "linked_input",
    };
  }

  if (input.serviceProviderId) {
    const { data, error } = await input.supabase
      .from("service_providers")
      .select(
        "id, name, slug, facility_type, contact_info, is_partner, updated_at",
      )
      .eq("id", input.serviceProviderId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load linked service provider for counterparty",
        error.message,
      );
    }

    if (!data) {
      throw new ApiError(404, "Linked service provider was not found");
    }

    const snapshot = buildServiceProviderSourceSnapshot(data);
    return {
      sourceType: "service_provider",
      serviceProviderId: data.id,
      hotelId: null,
      sourceSnapshot: snapshot,
      resolvedExternalCode:
        normalizeText(snapshot.external_code as string | null) ??
        input.externalCode,
      resolvedContactEmail:
        normalizeText(snapshot.contact_email as string | null) ??
        input.contactEmail,
      resolvedContactPhone:
        normalizeText(snapshot.contact_phone as string | null) ??
        input.contactPhone,
      linkAction: "linked_input",
    };
  }

  const sourceKind = resolveCounterpartySourceKind(input.kind);
  if (sourceKind === "manual") {
    return {
      sourceType: "manual",
      serviceProviderId: null,
      hotelId: null,
      sourceSnapshot: {},
      resolvedExternalCode: input.externalCode,
      resolvedContactEmail: input.contactEmail,
      resolvedContactPhone: input.contactPhone,
      linkAction: "manual",
    };
  }

  if (sourceKind === "hotel") {
    let hotel: any = null;

    if (externalCodeSlug) {
      const { data, error } = await input.supabase
        .from("hotels")
        .select("id, name, slug, contact_info, is_partner, updated_at")
        .eq("slug", externalCodeSlug)
        .limit(1);

      if (error) {
        throw new ApiError(
          500,
          "Failed to lookup hotel by external code",
          error.message,
        );
      }

      hotel = data?.[0] ?? null;
    }

    if (!hotel) {
      const { data, error } = await input.supabase
        .from("hotels")
        .select("id, name, slug, contact_info, is_partner, updated_at")
        .ilike("name", input.name)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) {
        throw new ApiError(
          500,
          "Failed to lookup hotel by name",
          error.message,
        );
      }

      hotel = data?.[0] ?? null;
    }

    let linkAction: CounterpartySourceResolution["linkAction"] =
      "linked_existing";

    if (!hotel) {
      const slug = await generateUniqueSlug({
        supabase: input.supabase,
        table: "hotels",
        base: externalCodeSlug ?? input.name,
      });

      const { data: created, error: createError } = await input.supabase
        .from("hotels")
        .insert({
          name: input.name,
          slug,
          star_rating: 3,
          contact_info: buildSourceContactInfo({
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
          }),
          is_partner: input.isActive,
        })
        .select("id, name, slug, contact_info, is_partner, updated_at")
        .single();

      if (createError || !created) {
        throw new ApiError(
          500,
          "Failed to auto-create hotel for finance counterparty",
          createError?.message,
        );
      }

      hotel = created;
      linkAction = "created_source";
    }

    const snapshot = buildHotelSourceSnapshot(hotel);
    return {
      sourceType: "hotel",
      serviceProviderId: null,
      hotelId: hotel.id,
      sourceSnapshot: snapshot,
      resolvedExternalCode:
        normalizeText(snapshot.external_code as string | null) ??
        externalCodeSlug,
      resolvedContactEmail:
        normalizeText(snapshot.contact_email as string | null) ??
        input.contactEmail,
      resolvedContactPhone:
        normalizeText(snapshot.contact_phone as string | null) ??
        input.contactPhone,
      linkAction,
    };
  }

  let serviceProvider: any = null;

  if (externalCodeSlug) {
    const { data, error } = await input.supabase
      .from("service_providers")
      .select(
        "id, name, slug, facility_type, contact_info, is_partner, updated_at",
      )
      .eq("slug", externalCodeSlug)
      .limit(1);

    if (error) {
      throw new ApiError(
        500,
        "Failed to lookup service provider by external code",
        error.message,
      );
    }

    serviceProvider = data?.[0] ?? null;
  }

  if (!serviceProvider) {
    const { data, error } = await input.supabase
      .from("service_providers")
      .select(
        "id, name, slug, facility_type, contact_info, is_partner, updated_at",
      )
      .ilike("name", input.name)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new ApiError(
        500,
        "Failed to lookup service provider by name",
        error.message,
      );
    }

    serviceProvider = data?.[0] ?? null;
  }

  let linkAction: CounterpartySourceResolution["linkAction"] =
    "linked_existing";

  if (!serviceProvider) {
    const slug = await generateUniqueSlug({
      supabase: input.supabase,
      table: "service_providers",
      base: externalCodeSlug ?? input.name,
    });
    const facilityType =
      input.kind === "hospital" ? "hospital" : "service_provider";

    const { data: created, error: createError } = await input.supabase
      .from("service_providers")
      .insert({
        name: input.name,
        slug,
        facility_type: facilityType,
        contact_info: buildSourceContactInfo({
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
        }),
        is_partner: input.isActive,
      })
      .select(
        "id, name, slug, facility_type, contact_info, is_partner, updated_at",
      )
      .single();

    if (createError || !created) {
      throw new ApiError(
        500,
        "Failed to auto-create service provider for finance counterparty",
        createError?.message,
      );
    }

    serviceProvider = created;
    linkAction = "created_source";
  }

  const snapshot = buildServiceProviderSourceSnapshot(serviceProvider);
  return {
    sourceType: "service_provider",
    serviceProviderId: serviceProvider.id,
    hotelId: null,
    sourceSnapshot: snapshot,
    resolvedExternalCode:
      normalizeText(snapshot.external_code as string | null) ??
      externalCodeSlug,
    resolvedContactEmail:
      normalizeText(snapshot.contact_email as string | null) ??
      input.contactEmail,
    resolvedContactPhone:
      normalizeText(snapshot.contact_phone as string | null) ??
      input.contactPhone,
    linkAction,
  };
};

const computeBalance = (total: number, paid: number) =>
  normalizeMoney(Math.max(normalizeMoney(total) - normalizeMoney(paid), 0));

const parseDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const daysBetween = (from: string, to: string) => {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const agingBucket = (daysPastDue: number) => {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1_30";
  if (daysPastDue <= 60) return "31_60";
  if (daysPastDue <= 90) return "61_90";
  return "90_plus";
};

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

const generateJournalEntryNumber = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const stamp = now.getTime().toString().slice(-7);
  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `JRN-${year}-${stamp}${suffix}`;
};

const normalizeThresholdMap = (value: unknown) => {
  const parsed =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const normalized: Record<FinanceCurrency, number> = {
    ...DEFAULT_THRESHOLD_MAP,
  };

  for (const currency of FINANCE_CURRENCIES) {
    const raw = parsed[currency];
    const amount = normalizeMoney(raw);
    if (amount > 0) {
      normalized[currency] = amount;
    }
  }

  return normalized;
};

const resolveFinanceSettings = async (
  supabase: any,
): Promise<ResolvedFinanceSettings> => {
  const { data, error } = await supabase
    .from("finance_settings")
    .select("id, base_currency, approval_thresholds, posting_accounts")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to load finance settings", error.message);
  }

  const baseCurrencyCandidate =
    typeof data?.base_currency === "string"
      ? data.base_currency.toUpperCase()
      : "EGP";

  const baseCurrency = FINANCE_CURRENCIES.includes(
    baseCurrencyCandidate as FinanceCurrency,
  )
    ? (baseCurrencyCandidate as FinanceCurrency)
    : "EGP";

  const thresholdSource =
    data?.approval_thresholds && typeof data.approval_thresholds === "object"
      ? (data.approval_thresholds as Record<string, unknown>)
      : {};

  const approvalThresholds: Record<string, Record<FinanceCurrency, number>> = {
    payable_submit: normalizeThresholdMap(thresholdSource.payable_submit),
    payable_payment: normalizeThresholdMap(thresholdSource.payable_payment),
  };

  const postingSource =
    data?.posting_accounts && typeof data.posting_accounts === "object"
      ? (data.posting_accounts as Record<string, unknown>)
      : {};

  const postingAccounts = { ...DEFAULT_POSTING_ACCOUNTS };
  for (const [key, rawValue] of Object.entries(postingSource)) {
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      postingAccounts[key] = rawValue.trim();
    }
  }

  return {
    id: data?.id ?? null,
    baseCurrency,
    approvalThresholds,
    postingAccounts,
  };
};

const resolveThreshold = (
  settings: ResolvedFinanceSettings,
  action: "payable_submit" | "payable_payment",
  currency: FinanceCurrency,
) => {
  const actionMap =
    settings.approvalThresholds[action] ?? DEFAULT_APPROVAL_THRESHOLDS[action];
  return normalizeMoney(
    actionMap[currency] ?? actionMap.EGP ?? DEFAULT_THRESHOLD_MAP.EGP,
  );
};

const resolveCurrencyToBaseRate = async (input: {
  supabase: any;
  currency: FinanceCurrency;
  baseCurrency: FinanceCurrency;
  asOfDate?: string | null;
}) => {
  if (input.currency === input.baseCurrency) {
    return {
      rate: 1,
      source: "Base currency",
      asOf: null as string | null,
      fetchedAt: new Date().toISOString(),
    };
  }

  const ratesPayload = await fetchBanqueMisrRates();
  const getUsdRate = (code: FinanceCurrency) => {
    if (code === "USD") {
      return 1;
    }
    const row = ratesPayload.rates.find((item) => item.code === code);
    const value = row?.usdToCurrency;
    return Number.isFinite(value) && typeof value === "number" ? value : null;
  };

  const usdToSource = getUsdRate(input.currency);
  const usdToBase = getUsdRate(input.baseCurrency);

  if (!usdToSource || usdToSource <= 0 || !usdToBase || usdToBase <= 0) {
    throw new ApiError(
      502,
      `Unable to resolve FX rate for ${input.currency}/${input.baseCurrency}`,
    );
  }

  const sourceToBase = normalizeSignedMoney(usdToBase / usdToSource);

  const asOfDate =
    toDateOnly(input.asOfDate) ??
    toDateOnly(ratesPayload.asOf) ??
    todayDateOnly();
  const asOfIso = new Date(`${asOfDate}T00:00:00.000Z`).toISOString();

  const { error: snapshotError } = await input.supabase
    .from("finance_exchange_rate_snapshots")
    .upsert(
      {
        base_currency: input.currency,
        quote_currency: input.baseCurrency,
        rate: sourceToBase,
        source: ratesPayload.source,
        as_of: asOfIso,
        metadata: {
          fetched_at: ratesPayload.fetchedAt,
          source_url: ratesPayload.url ?? null,
          as_of_date: asOfDate,
        },
      },
      { onConflict: "base_currency,quote_currency,as_of" },
    );

  if (snapshotError) {
    throw new ApiError(
      500,
      "Failed to store FX snapshot",
      snapshotError.message,
    );
  }

  return {
    rate: sourceToBase,
    source: ratesPayload.source,
    asOf: asOfIso,
    fetchedAt: ratesPayload.fetchedAt,
  };
};

const loadAccountsByCodes = async (supabase: any, codes: string[]) => {
  const uniqueCodes = Array.from(
    new Set(codes.map((code) => code.trim()).filter((code) => code.length > 0)),
  );

  const { data, error } = await supabase
    .from("finance_chart_accounts")
    .select("id, account_code, name, account_type, is_active")
    .in("account_code", uniqueCodes);

  if (error) {
    throw new ApiError(500, "Failed to resolve chart accounts", error.message);
  }

  const map = new Map<string, ChartAccountRow>();
  for (const row of data ?? []) {
    map.set(row.account_code, row);
  }

  for (const code of uniqueCodes) {
    const account = map.get(code);
    if (!account || !account.is_active) {
      throw new ApiError(
        422,
        `Chart account ${code} is missing or inactive. Update finance settings mappings first.`,
      );
    }
  }

  return map;
};

const createJournalEntry = async (input: {
  supabase: any;
  sourceType: string;
  sourceId: string;
  description: string;
  entryDate: string;
  transactionCurrency: FinanceCurrency;
  actorProfileId?: string | null;
  lines: JournalLineInput[];
}) => {
  const settings = await resolveFinanceSettings(input.supabase);

  const { data: existingEntry, error: existingEntryError } =
    await input.supabase
      .from("finance_journal_entries")
      .select("id, entry_number")
      .eq("source_type", input.sourceType)
      .eq("source_id", input.sourceId)
      .maybeSingle();

  if (existingEntryError) {
    throw new ApiError(
      500,
      "Failed to check existing journal entry",
      existingEntryError.message,
    );
  }

  if (existingEntry?.id) {
    return {
      entry: existingEntry,
      created: false,
      baseCurrency: settings.baseCurrency,
      fxRate: 1,
    };
  }

  const accountMap = await loadAccountsByCodes(
    input.supabase,
    input.lines.map((line) => line.accountCode),
  );

  const fxRateContext = await resolveCurrencyToBaseRate({
    supabase: input.supabase,
    currency: input.transactionCurrency,
    baseCurrency: settings.baseCurrency,
    asOfDate: input.entryDate,
  });

  const convertedLines = input.lines.map((line) => {
    const debit = normalizeMoney(
      normalizeMoney(line.debit) * fxRateContext.rate,
    );
    const credit = normalizeMoney(
      normalizeMoney(line.credit) * fxRateContext.rate,
    );
    return {
      ...line,
      debit,
      credit,
    };
  });

  let totalDebit = normalizeMoney(
    convertedLines.reduce((sum, line) => sum + normalizeMoney(line.debit), 0),
  );
  let totalCredit = normalizeMoney(
    convertedLines.reduce((sum, line) => sum + normalizeMoney(line.credit), 0),
  );

  const difference = normalizeSignedMoney(totalDebit - totalCredit);
  if (Math.abs(difference) > 0.01) {
    const adjustmentSide = difference > 0 ? "credit" : "debit";
    const targetIndex = convertedLines.findIndex(
      (line) => line[adjustmentSide] > EPSILON,
    );

    if (targetIndex === -1) {
      throw new ApiError(
        422,
        "Journal entry is unbalanced and cannot be auto-adjusted",
      );
    }

    convertedLines[targetIndex][adjustmentSide] = normalizeMoney(
      convertedLines[targetIndex][adjustmentSide] + Math.abs(difference),
    );

    totalDebit = normalizeMoney(
      convertedLines.reduce((sum, line) => sum + normalizeMoney(line.debit), 0),
    );
    totalCredit = normalizeMoney(
      convertedLines.reduce(
        (sum, line) => sum + normalizeMoney(line.credit),
        0,
      ),
    );
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new ApiError(422, "Journal entry must be balanced before posting");
  }

  const { data: entry, error: entryError } = await input.supabase
    .from("finance_journal_entries")
    .insert({
      entry_number: generateJournalEntryNumber(),
      entry_date: input.entryDate,
      source_type: input.sourceType,
      source_id: input.sourceId,
      description: input.description,
      currency: settings.baseCurrency,
      status: "posted",
      created_by_profile_id: input.actorProfileId ?? null,
    })
    .select("*")
    .single();

  if (entryError || !entry) {
    throw new ApiError(
      500,
      "Failed to create journal entry",
      entryError?.message,
    );
  }

  const linePayload = convertedLines.map((line) => {
    const account = accountMap.get(line.accountCode);
    if (!account) {
      throw new ApiError(422, `Account ${line.accountCode} is missing`);
    }

    return {
      finance_journal_entry_id: entry.id,
      finance_chart_account_id: account.id,
      description: normalizeText(line.description),
      debit: normalizeMoney(line.debit),
      credit: normalizeMoney(line.credit),
      currency: settings.baseCurrency,
      fx_rate: normalizeSignedMoney(fxRateContext.rate),
      cost_tag_case_id: line.costTagCaseId ?? null,
      cost_tag_department: normalizeText(line.costTagDepartment),
    };
  });

  const { error: lineInsertError } = await input.supabase
    .from("finance_journal_lines")
    .insert(linePayload);

  if (lineInsertError) {
    const { error: entryRollbackError } = await input.supabase
      .from("finance_journal_entries")
      .delete()
      .eq("id", entry.id);

    const details = entryRollbackError
      ? `${lineInsertError.message}; journal rollback failed: ${entryRollbackError.message}`
      : lineInsertError.message;

    throw new ApiError(500, "Failed to create journal lines", details);
  }

  return {
    entry,
    created: true,
    baseCurrency: settings.baseCurrency,
    fxRate: fxRateContext.rate,
  };
};

const writeFinanceAuditEvent = async (input: {
  supabase: any;
  entityType: string;
  entityId?: string | null;
  action: string;
  actor: FinanceActor;
  payload?: Record<string, unknown>;
}) => {
  const { error } = await input.supabase.from("finance_audit_events").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor_user_id: input.actor.userId,
    actor_profile_id: input.actor.profileId ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    throw new ApiError(
      500,
      "Failed to record finance audit event",
      error.message,
    );
  }
};

const fetchPayableWithLines = async (supabase: any, payableId: string) => {
  const { data: payable, error: payableError } = await supabase
    .from("finance_payables")
    .select("*")
    .eq("id", payableId)
    .maybeSingle();

  if (payableError) {
    throw new ApiError(500, "Failed to load payable", payableError.message);
  }

  if (!payable) {
    throw new ApiError(404, "Payable not found");
  }

  const { data: lines, error: linesError } = await supabase
    .from("finance_payable_lines")
    .select("*")
    .eq("finance_payable_id", payableId)
    .order("created_at", { ascending: true });

  if (linesError) {
    throw new ApiError(500, "Failed to load payable lines", linesError.message);
  }

  return {
    payable,
    lines: lines ?? [],
  };
};

const buildAutomaticPayableAllocationPlan = (
  rows: Array<{
    id: string;
    due_date: string | null;
    balance_amount: number;
  }>,
  amount: number,
): PayableAllocation[] => {
  const sorted = [...rows]
    .filter((row) => normalizeMoney(row.balance_amount) > EPSILON)
    .sort((a, b) => {
      const dateA = toDateOnly(a.due_date) ?? "9999-12-31";
      const dateB = toDateOnly(b.due_date) ?? "9999-12-31";
      return dateA.localeCompare(dateB);
    });

  const plan: PayableAllocation[] = [];
  let remaining = normalizeMoney(amount);

  for (const row of sorted) {
    if (remaining <= EPSILON) {
      break;
    }

    const allocatable = Math.min(normalizeMoney(row.balance_amount), remaining);
    if (allocatable <= EPSILON) {
      continue;
    }

    plan.push({ payableId: row.id, amount: normalizeMoney(allocatable) });
    remaining = normalizeMoney(remaining - allocatable);
  }

  if (remaining > EPSILON) {
    throw new ApiError(422, "Payment amount exceeds open payable balances");
  }

  return plan;
};

const parseApprovalReason = (entityType: string, action: string) => {
  if (entityType === "finance_payable" && action === "payable_submit") {
    return "Payable exceeds auto-approval threshold";
  }
  if (
    entityType === "finance_payable_payment_group" &&
    action === "payable_payment_post"
  ) {
    return "Outgoing payable payment exceeds auto-approval threshold";
  }
  return "Approval required by policy";
};

const postPayableApprovalJournal = async (input: {
  supabase: any;
  payableId: string;
  actorProfileId?: string | null;
}) => {
  const { payable, lines } = await fetchPayableWithLines(
    input.supabase,
    input.payableId,
  );

  if (payable.posted_journal_entry_id) {
    return { posted: false, reason: "already_posted" };
  }

  if (
    !["approved", "partially_paid", "paid", "scheduled"].includes(
      payable.status,
    )
  ) {
    return { posted: false, reason: "status_not_postable" };
  }

  const settings = await resolveFinanceSettings(input.supabase);
  const fallbackExpenseCode = settings.postingAccounts.expense;
  const accountsPayableCode = settings.postingAccounts.accounts_payable;

  const lineAccountIds = Array.from(
    new Set(
      (lines ?? [])
        .map((line: any) => line.finance_chart_account_id)
        .filter((value: unknown): value is string => typeof value === "string"),
    ),
  );

  const lineAccountsMap = new Map<string, ChartAccountRow>();
  if (lineAccountIds.length > 0) {
    const { data: chartRows, error: chartError } = await input.supabase
      .from("finance_chart_accounts")
      .select("id, account_code, name, account_type, is_active")
      .in("id", lineAccountIds);

    if (chartError) {
      throw new ApiError(
        500,
        "Failed to load payable line accounts",
        chartError.message,
      );
    }

    for (const row of chartRows ?? []) {
      lineAccountsMap.set(row.id, row);
    }
  }

  const postingLines: JournalLineInput[] = (lines ?? []).map((line: any) => {
    const linked =
      typeof line.finance_chart_account_id === "string"
        ? lineAccountsMap.get(line.finance_chart_account_id)
        : null;

    return {
      accountCode: linked?.account_code ?? fallbackExpenseCode,
      debit: normalizeMoney(line.amount),
      credit: 0,
      description: normalizeText(line.description) ?? "Payable line",
      costTagCaseId: payable.finance_case_id ?? null,
    };
  });

  postingLines.push({
    accountCode: accountsPayableCode,
    debit: 0,
    credit: normalizeMoney(payable.total_amount),
    description: `Accounts payable - ${payable.payable_number}`,
    costTagCaseId: payable.finance_case_id ?? null,
  });

  const entryResult = await createJournalEntry({
    supabase: input.supabase,
    sourceType: "finance_payable_approved",
    sourceId: payable.id,
    description: `Payable ${payable.payable_number} approved`,
    entryDate: toDateOnly(payable.issue_date) ?? todayDateOnly(),
    transactionCurrency: (payable.currency ??
      settings.baseCurrency) as FinanceCurrency,
    actorProfileId: input.actorProfileId ?? null,
    lines: postingLines,
  });

  if (entryResult.entry?.id) {
    const { error: updateError } = await input.supabase
      .from("finance_payables")
      .update({ posted_journal_entry_id: entryResult.entry.id })
      .eq("id", payable.id);

    if (updateError) {
      throw new ApiError(
        500,
        "Failed to link payable journal entry",
        updateError.message,
      );
    }
  }

  return { posted: true, entryId: entryResult.entry.id };
};

const postPayablePaymentRow = async (input: {
  supabase: any;
  paymentRow: any;
  actorProfileId?: string | null;
  applySettlement: boolean;
}) => {
  const payment = input.paymentRow;

  if (payment.posted_journal_entry_id) {
    return { posted: false, reason: "already_posted" };
  }

  if (payment.status === "reversed") {
    return { posted: false, reason: "payment_reversed" };
  }

  const settings = await resolveFinanceSettings(input.supabase);

  const { data: payable, error: payableError } = await input.supabase
    .from("finance_payables")
    .select("*")
    .eq("id", payment.finance_payable_id)
    .maybeSingle();

  if (payableError) {
    throw new ApiError(
      500,
      "Failed to load payable for settlement",
      payableError.message,
    );
  }

  if (!payable) {
    throw new ApiError(404, "Payable for settlement not found");
  }

  if (input.applySettlement) {
    if (!canPostPayableSettlement(payable.status)) {
      throw new ApiError(
        409,
        `Cannot settle payable in status ${payable.status}`,
      );
    }

    if (
      normalizeMoney(payment.amount) - normalizeMoney(payable.balance_amount) >
      EPSILON
    ) {
      throw new ApiError(
        422,
        `Payment exceeds payable balance (${payable.payable_number})`,
      );
    }
  }

  const entryResult = await createJournalEntry({
    supabase: input.supabase,
    sourceType: "finance_payable_payment",
    sourceId: payment.id,
    description: `Payable settlement ${payable.payable_number}`,
    entryDate: toDateOnly(payment.payment_date) ?? todayDateOnly(),
    transactionCurrency: (payment.currency ??
      payable.currency ??
      settings.baseCurrency) as FinanceCurrency,
    actorProfileId: input.actorProfileId ?? null,
    lines: [
      {
        accountCode: settings.postingAccounts.accounts_payable,
        debit: normalizeMoney(payment.amount),
        credit: 0,
        description: `Settle AP ${payable.payable_number}`,
        costTagCaseId: payable.finance_case_id ?? null,
      },
      {
        accountCode: settings.postingAccounts.cash_bank,
        debit: 0,
        credit: normalizeMoney(payment.amount),
        description: "Cash/Bank disbursement",
        costTagCaseId: payable.finance_case_id ?? null,
      },
    ],
  });

  const nextPaymentStatus = (
    entryResult.entry?.id ? "posted" : payment.status
  ) as "recorded" | "posted" | "reversed";

  const updatePaymentPayload: Record<string, unknown> = {
    status: nextPaymentStatus,
    posted_journal_entry_id: entryResult.entry?.id ?? null,
    fx_rate: normalizeSignedMoney(entryResult.fxRate),
  };

  let paymentUpdateQuery = input.supabase
    .from("finance_payable_payments")
    .update(updatePaymentPayload)
    .eq("id", payment.id)
    .is("posted_journal_entry_id", null);

  if (typeof payment.status === "string" && payment.status.length > 0) {
    paymentUpdateQuery = paymentUpdateQuery.eq("status", payment.status);
  }

  const { data: updatedPayment, error: paymentUpdateError } =
    await paymentUpdateQuery.select("id").maybeSingle();

  if (paymentUpdateError) {
    throw new ApiError(
      500,
      "Failed to update payable payment posting status",
      paymentUpdateError.message,
    );
  }

  if (!updatedPayment) {
    throw new ApiError(
      409,
      "Payable payment changed before posting status update could be applied",
    );
  }

  if (!input.applySettlement) {
    return { posted: true, entryId: entryResult.entry.id, payable };
  }

  const nextPaid = normalizeMoney(
    normalizeMoney(payable.paid_amount) + normalizeMoney(payment.amount),
  );
  const nextBalance = computeBalance(payable.total_amount, nextPaid);

  let nextStatus: string = payable.status;
  if (nextBalance <= EPSILON) {
    nextStatus = "paid";
  } else if (nextPaid > EPSILON) {
    nextStatus = "partially_paid";
  }

  const { data: updatedPayable, error: payableUpdateError } =
    await input.supabase
      .from("finance_payables")
      .update({
        paid_amount: nextPaid,
        balance_amount: nextBalance,
        status: nextStatus,
      })
      .eq("id", payable.id)
      .eq("updated_at", payable.updated_at)
      .select("id")
      .maybeSingle();

  if (payableUpdateError) {
    throw new ApiError(
      500,
      "Failed to update payable settlement balances",
      payableUpdateError.message,
    );
  }

  if (!updatedPayable) {
    throw new ApiError(
      409,
      "Payable changed before settlement could be applied. Please retry.",
    );
  }

  return { posted: true, entryId: entryResult.entry.id, payable };
};

const postPayablePaymentGroup = async (input: {
  supabase: any;
  paymentGroupId: string;
  actorProfileId?: string | null;
  applySettlementForRecorded?: boolean;
}) => {
  const { data: rows, error } = await input.supabase
    .from("finance_payable_payments")
    .select("*")
    .eq("payment_group_id", input.paymentGroupId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "Failed to load payable payment group",
      error.message,
    );
  }

  const payments = rows ?? [];
  if (payments.length === 0) {
    throw new ApiError(404, "Payable payment group not found");
  }

  const shouldApplySettlementForRecorded = Boolean(
    input.applySettlementForRecorded ?? true,
  );
  const settlementCandidates = payments.filter(
    (payment: any) =>
      payment.status === "recorded" && shouldApplySettlementForRecorded,
  );
  const candidatePayableIds = Array.from(
    new Set(
      settlementCandidates
        .map((payment: any) => payment.finance_payable_id)
        .filter(
          (value: unknown): value is string =>
            typeof value === "string" && value.length > 0,
        ),
    ),
  );
  const payableOriginalSnapshots = new Map<
    string,
    { paidAmount: number; balanceAmount: number; status: string }
  >();

  if (candidatePayableIds.length > 0) {
    const { data: payableRows, error: payableRowsError } = await input.supabase
      .from("finance_payables")
      .select("id, payable_number, status, paid_amount, balance_amount")
      .in("id", candidatePayableIds);

    if (payableRowsError) {
      throw new ApiError(
        500,
        "Failed to load payables for payment-group posting",
        payableRowsError.message,
      );
    }

    const payableById = new Map<string, any>();
    for (const payable of payableRows ?? []) {
      payableById.set(payable.id, payable);
      payableOriginalSnapshots.set(payable.id, {
        paidAmount: normalizeMoney(payable.paid_amount),
        balanceAmount: normalizeMoney(payable.balance_amount),
        status:
          typeof payable.status === "string" && payable.status.length > 0
            ? payable.status
            : "draft",
      });
    }

    const settlementTotals = new Map<string, number>();
    for (const payment of settlementCandidates) {
      const payableId =
        typeof payment.finance_payable_id === "string"
          ? payment.finance_payable_id
          : null;
      if (!payableId) {
        throw new ApiError(
          422,
          "Payable payment group contains invalid payable references",
        );
      }

      const payable = payableById.get(payableId);
      if (!payable) {
        throw new ApiError(
          404,
          "Payable for settlement was not found during group posting",
        );
      }

      if (!canPostPayableSettlement(payable.status)) {
        throw new ApiError(
          409,
          `Cannot settle payable in status ${payable.status}`,
        );
      }

      const running = settlementTotals.get(payableId) ?? 0;
      settlementTotals.set(
        payableId,
        normalizeMoney(running + normalizeMoney(payment.amount)),
      );
    }

    for (const [payableId, total] of settlementTotals) {
      const payable = payableById.get(payableId);
      if (!payable) {
        continue;
      }
      if (total - normalizeMoney(payable.balance_amount) > EPSILON) {
        throw new ApiError(
          422,
          `Payment group exceeds payable balance for ${payable.payable_number}`,
        );
      }
    }
  }

  const postedRows: Array<{
    paymentId: string;
    payableId: string;
    previousStatus: string;
    previousPostedJournalEntryId: string | null;
    previousFxRate: number | null;
    entryId: string;
  }> = [];
  let postedCount = 0;
  try {
    for (const payment of payments) {
      const shouldApplySettlement =
        payment.status === "recorded"
          ? shouldApplySettlementForRecorded
          : false;

      const result = await postPayablePaymentRow({
        supabase: input.supabase,
        paymentRow: payment,
        actorProfileId: input.actorProfileId ?? null,
        applySettlement: shouldApplySettlement,
      });

      if (result.posted) {
        postedCount += 1;
      }

      if (
        result.posted &&
        typeof payment.id === "string" &&
        typeof payment.finance_payable_id === "string" &&
        typeof result.entryId === "string"
      ) {
        const previousFxRateCandidate = Number(payment.fx_rate);
        postedRows.push({
          paymentId: payment.id,
          payableId: payment.finance_payable_id,
          previousStatus:
            typeof payment.status === "string" && payment.status.length > 0
              ? payment.status
              : "recorded",
          previousPostedJournalEntryId:
            typeof payment.posted_journal_entry_id === "string"
              ? payment.posted_journal_entry_id
              : null,
          previousFxRate: Number.isFinite(previousFxRateCandidate)
            ? previousFxRateCandidate
            : null,
          entryId: result.entryId,
        });
      }
    }
  } catch (error) {
    const rollbackErrors: string[] = [];
    const postedEntryIds = Array.from(
      new Set(postedRows.map((row) => row.entryId)),
    );

    for (const row of postedRows) {
      const { error: paymentRollbackError } = await input.supabase
        .from("finance_payable_payments")
        .update({
          status: row.previousStatus,
          posted_journal_entry_id: row.previousPostedJournalEntryId,
          fx_rate: row.previousFxRate,
        })
        .eq("id", row.paymentId)
        .eq("posted_journal_entry_id", row.entryId);

      if (paymentRollbackError) {
        rollbackErrors.push(
          `payment ${row.paymentId} rollback failed: ${paymentRollbackError.message}`,
        );
      }
    }

    if (shouldApplySettlementForRecorded) {
      const affectedPayableIds = Array.from(
        new Set(postedRows.map((row) => row.payableId)),
      );
      for (const payableId of affectedPayableIds) {
        const snapshot = payableOriginalSnapshots.get(payableId);
        if (!snapshot) {
          continue;
        }

        const { error: payableRollbackError } = await input.supabase
          .from("finance_payables")
          .update({
            paid_amount: snapshot.paidAmount,
            balance_amount: snapshot.balanceAmount,
            status: snapshot.status,
          })
          .eq("id", payableId);

        if (payableRollbackError) {
          rollbackErrors.push(
            `payable ${payableId} rollback failed: ${payableRollbackError.message}`,
          );
        }
      }
    }

    if (postedEntryIds.length > 0) {
      const { error: entryRollbackError } = await input.supabase
        .from("finance_journal_entries")
        .delete()
        .in("id", postedEntryIds);

      if (entryRollbackError) {
        rollbackErrors.push(
          `journal rollback failed: ${entryRollbackError.message}`,
        );
      }
    }

    const rollbackDetails =
      rollbackErrors.length > 0 ? rollbackErrors.join("; ") : null;

    if (error instanceof ApiError) {
      if (rollbackDetails) {
        throw new ApiError(error.status, error.message, {
          cause: error.details ?? null,
          rollback: rollbackDetails,
        });
      }
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Failed to post payment group";
    if (rollbackDetails) {
      throw new ApiError(500, "Failed to post payable payment group", {
        cause: message,
        rollback: rollbackDetails,
      });
    }
    throw new ApiError(500, "Failed to post payable payment group", message);
  }

  return {
    paymentGroupId: input.paymentGroupId,
    postedCount,
    totalCount: payments.length,
  };
};

const postInvoiceJournalByRow = async (input: {
  supabase: any;
  invoice: any;
  actorProfileId?: string | null;
}) => {
  const invoice = input.invoice;

  if (invoice.posted_journal_entry_id) {
    return { posted: false, reason: "already_posted" };
  }

  if (
    !["issued", "partially_paid", "paid", "overdue"].includes(invoice.status)
  ) {
    return { posted: false, reason: "status_not_postable" };
  }

  const settings = await resolveFinanceSettings(input.supabase);

  const entryResult = await createJournalEntry({
    supabase: input.supabase,
    sourceType: "finance_invoice_issued",
    sourceId: invoice.id,
    description: `Invoice ${invoice.invoice_number} issued`,
    entryDate: toDateOnly(invoice.issue_date) ?? todayDateOnly(),
    transactionCurrency: (invoice.currency ??
      settings.baseCurrency) as FinanceCurrency,
    actorProfileId: input.actorProfileId ?? null,
    lines: [
      {
        accountCode: settings.postingAccounts.accounts_receivable,
        debit: normalizeMoney(invoice.total_amount),
        credit: 0,
        description: `AR - ${invoice.invoice_number}`,
        costTagCaseId: invoice.finance_case_id ?? null,
      },
      {
        accountCode: settings.postingAccounts.revenue,
        debit: 0,
        credit: normalizeMoney(invoice.total_amount),
        description: `Revenue - ${invoice.invoice_number}`,
        costTagCaseId: invoice.finance_case_id ?? null,
      },
    ],
  });

  const { error: updateError } = await input.supabase
    .from("finance_invoices")
    .update({ posted_journal_entry_id: entryResult.entry.id })
    .eq("id", invoice.id);

  if (updateError) {
    throw new ApiError(
      500,
      "Failed to link invoice journal entry",
      updateError.message,
    );
  }

  return { posted: true, entryId: entryResult.entry.id };
};

const postPaymentJournalByRow = async (input: {
  supabase: any;
  payment: any;
  actorProfileId?: string | null;
}) => {
  const payment = input.payment;

  if (payment.posted_journal_entry_id) {
    return { posted: false, reason: "already_posted" };
  }

  if (payment.status === "reversed") {
    return { posted: false, reason: "payment_reversed" };
  }

  const settings = await resolveFinanceSettings(input.supabase);

  const { data: allocations, error: allocationError } = await input.supabase
    .from("finance_payment_allocations")
    .select("finance_invoice_id")
    .eq("finance_payment_id", payment.id)
    .limit(1)
    .maybeSingle();

  if (allocationError) {
    throw new ApiError(
      500,
      "Failed to resolve payment allocation context",
      allocationError.message,
    );
  }

  const invoiceId = allocations?.finance_invoice_id ?? null;
  let financeCaseId: string | null = null;

  if (invoiceId) {
    const { data: invoiceRow, error: invoiceError } = await input.supabase
      .from("finance_invoices")
      .select("finance_case_id")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(
        500,
        "Failed to load invoice context for payment posting",
        invoiceError.message,
      );
    }

    financeCaseId = invoiceRow?.finance_case_id ?? null;
  }

  const entryResult = await createJournalEntry({
    supabase: input.supabase,
    sourceType: "finance_payment_posted",
    sourceId: payment.id,
    description: `Customer payment ${payment.payment_reference ?? payment.id}`,
    entryDate: toDateOnly(payment.payment_date) ?? todayDateOnly(),
    transactionCurrency: (payment.currency ??
      settings.baseCurrency) as FinanceCurrency,
    actorProfileId: input.actorProfileId ?? null,
    lines: [
      {
        accountCode: settings.postingAccounts.cash_bank,
        debit: normalizeMoney(payment.amount),
        credit: 0,
        description: "Cash/Bank receipt",
        costTagCaseId: financeCaseId,
      },
      {
        accountCode: settings.postingAccounts.accounts_receivable,
        debit: 0,
        credit: normalizeMoney(payment.amount),
        description: "AR settlement",
        costTagCaseId: financeCaseId,
      },
    ],
  });

  const { error: paymentUpdateError } = await input.supabase
    .from("finance_payments")
    .update({
      status: "posted",
      posted_journal_entry_id: entryResult.entry.id,
      fx_rate: normalizeSignedMoney(entryResult.fxRate),
    })
    .eq("id", payment.id);

  if (paymentUpdateError) {
    throw new ApiError(
      500,
      "Failed to update payment posting status",
      paymentUpdateError.message,
    );
  }

  return { posted: true, entryId: entryResult.entry.id };
};

const postCreditAdjustmentByRow = async (input: {
  supabase: any;
  adjustment: any;
  actorProfileId?: string | null;
}) => {
  const adjustment = input.adjustment;

  if (adjustment.posted_journal_entry_id) {
    return { posted: false, reason: "already_posted" };
  }

  if (adjustment.status !== "approved") {
    return { posted: false, reason: "status_not_postable" };
  }

  const settings = await resolveFinanceSettings(input.supabase);

  let financeCaseId: string | null = null;
  if (adjustment.finance_invoice_id) {
    const { data: invoiceRow, error: invoiceError } = await input.supabase
      .from("finance_invoices")
      .select("finance_case_id")
      .eq("id", adjustment.finance_invoice_id)
      .maybeSingle();

    if (invoiceError) {
      throw new ApiError(
        500,
        "Failed to load invoice context for credit adjustment posting",
        invoiceError.message,
      );
    }

    financeCaseId = invoiceRow?.finance_case_id ?? null;
  }

  let debitAccount = settings.postingAccounts.contra_revenue;
  let creditAccount = settings.postingAccounts.accounts_receivable;

  if (adjustment.adjustment_type === "refund") {
    debitAccount = settings.postingAccounts.contra_revenue;
    creditAccount = settings.postingAccounts.cash_bank;
  } else if (adjustment.adjustment_type === "writeoff") {
    debitAccount = settings.postingAccounts.writeoff_expense;
    creditAccount = settings.postingAccounts.accounts_receivable;
  } else if (adjustment.adjustment_type === "credit_note") {
    debitAccount = settings.postingAccounts.contra_revenue;
    creditAccount = settings.postingAccounts.accounts_receivable;
  }

  const entryResult = await createJournalEntry({
    supabase: input.supabase,
    sourceType: "finance_credit_adjustment_approved",
    sourceId: adjustment.id,
    description: `Credit adjustment ${adjustment.adjustment_type}`,
    entryDate: todayDateOnly(),
    transactionCurrency: (adjustment.currency ??
      settings.baseCurrency) as FinanceCurrency,
    actorProfileId: input.actorProfileId ?? null,
    lines: [
      {
        accountCode: debitAccount,
        debit: normalizeMoney(adjustment.amount),
        credit: 0,
        description: `Adjustment debit (${adjustment.adjustment_type})`,
        costTagCaseId: financeCaseId,
      },
      {
        accountCode: creditAccount,
        debit: 0,
        credit: normalizeMoney(adjustment.amount),
        description: `Adjustment credit (${adjustment.adjustment_type})`,
        costTagCaseId: financeCaseId,
      },
    ],
  });

  const { error: updateError } = await input.supabase
    .from("finance_credit_adjustments")
    .update({ posted_journal_entry_id: entryResult.entry.id })
    .eq("id", adjustment.id);

  if (updateError) {
    throw new ApiError(
      500,
      "Failed to link credit-adjustment journal entry",
      updateError.message,
    );
  }

  return { posted: true, entryId: entryResult.entry.id };
};

const aggregateJournalBalances = (rows: any[]) => {
  const accountMap = new Map<
    string,
    {
      accountCode: string;
      name: string;
      accountType: string;
      debit: number;
      credit: number;
      balance: number;
    }
  >();

  for (const row of rows) {
    const account = row.finance_chart_accounts;
    if (!account?.account_code) {
      continue;
    }

    const key = account.account_code;
    const current = accountMap.get(key) ?? {
      accountCode: account.account_code,
      name: account.name,
      accountType: account.account_type,
      debit: 0,
      credit: 0,
      balance: 0,
    };

    current.debit = normalizeMoney(current.debit + normalizeMoney(row.debit));
    current.credit = normalizeMoney(
      current.credit + normalizeMoney(row.credit),
    );

    const debitNature = ["asset", "expense", "cogs"].includes(
      account.account_type,
    );
    current.balance = debitNature
      ? normalizeSignedMoney(current.debit - current.credit)
      : normalizeSignedMoney(current.credit - current.debit);

    accountMap.set(key, current);
  }

  return Array.from(accountMap.values()).sort((a, b) =>
    a.accountCode.localeCompare(b.accountCode),
  );
};

const loadJournalLinesForRange = async (input: {
  supabase: any;
  dateFrom?: string | null;
  dateTo?: string | null;
}) => {
  let entriesQuery = input.supabase
    .from("finance_journal_entries")
    .select("id, entry_date")
    .order("entry_date", { ascending: true });

  const dateFrom = toDateOnly(input.dateFrom);
  const dateTo = toDateOnly(input.dateTo);

  if (dateFrom) {
    entriesQuery = entriesQuery.gte("entry_date", dateFrom);
  }

  if (dateTo) {
    entriesQuery = entriesQuery.lte("entry_date", dateTo);
  }

  const { data: entries, error: entriesError } = await entriesQuery;

  if (entriesError) {
    throw new ApiError(
      500,
      "Failed to load journal entries",
      entriesError.message,
    );
  }

  const entryIds = (entries ?? []).map((entry: any) => entry.id);
  if (entryIds.length === 0) {
    return [] as any[];
  }

  const { data: lines, error: lineError } = await input.supabase
    .from("finance_journal_lines")
    .select(
      "id, debit, credit, currency, fx_rate, finance_journal_entry_id, finance_chart_accounts(account_code, name, account_type)",
    )
    .in("finance_journal_entry_id", entryIds);

  if (lineError) {
    throw new ApiError(500, "Failed to load journal lines", lineError.message);
  }

  return lines ?? [];
};

export const financeLedgerPosting = {
  async postInvoiceById(invoiceId: unknown, actorProfileId?: string | null) {
    const id = uuidSchema.parse(invoiceId);
    const supabase = getClient();

    const { data: invoice, error } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load invoice for posting",
        error.message,
      );
    }

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    return postInvoiceJournalByRow({
      supabase,
      invoice,
      actorProfileId: actorProfileId ?? null,
    });
  },

  async postPaymentById(paymentId: unknown, actorProfileId?: string | null) {
    const id = uuidSchema.parse(paymentId);
    const supabase = getClient();

    const { data: payment, error } = await supabase
      .from("finance_payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load payment for posting",
        error.message,
      );
    }

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return postPaymentJournalByRow({
      supabase,
      payment,
      actorProfileId: actorProfileId ?? null,
    });
  },

  async postCreditAdjustmentById(
    adjustmentId: unknown,
    actorProfileId?: string | null,
  ) {
    const id = uuidSchema.parse(adjustmentId);
    const supabase = getClient();

    const { data: adjustment, error } = await supabase
      .from("finance_credit_adjustments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        "Failed to load credit adjustment for posting",
        error.message,
      );
    }

    if (!adjustment) {
      throw new ApiError(404, "Credit adjustment not found");
    }

    return postCreditAdjustmentByRow({
      supabase,
      adjustment,
      actorProfileId: actorProfileId ?? null,
    });
  },

  async runBackfill(actor: FinanceActor) {
    const owner = ensureActor(actor);
    const supabase = getClient();

    const counters = {
      invoices: 0,
      payments: 0,
      creditAdjustments: 0,
      payables: 0,
      payablePayments: 0,
    };

    const { data: invoices } = await supabase
      .from("finance_invoices")
      .select("id")
      .in("status", ["issued", "partially_paid", "paid", "overdue"])
      .is("posted_journal_entry_id", null)
      .gt("total_amount", 0);

    for (const row of invoices ?? []) {
      await this.postInvoiceById(row.id, owner.profileId ?? null);
      counters.invoices += 1;
    }

    const { data: payments } = await supabase
      .from("finance_payments")
      .select("id")
      .is("posted_journal_entry_id", null)
      .in("status", ["recorded", "posted"])
      .gt("amount", 0);

    for (const row of payments ?? []) {
      await this.postPaymentById(row.id, owner.profileId ?? null);
      counters.payments += 1;
    }

    const { data: adjustments } = await supabase
      .from("finance_credit_adjustments")
      .select("id")
      .eq("status", "approved")
      .is("posted_journal_entry_id", null)
      .gt("amount", 0);

    for (const row of adjustments ?? []) {
      await this.postCreditAdjustmentById(row.id, owner.profileId ?? null);
      counters.creditAdjustments += 1;
    }

    const { data: payables } = await supabase
      .from("finance_payables")
      .select("id")
      .in("status", ["approved", "scheduled", "partially_paid", "paid"])
      .is("posted_journal_entry_id", null)
      .gt("total_amount", 0);

    for (const row of payables ?? []) {
      await postPayableApprovalJournal({
        supabase,
        payableId: row.id,
        actorProfileId: owner.profileId ?? null,
      });
      counters.payables += 1;
    }

    const { data: payablePayments } = await supabase
      .from("finance_payable_payments")
      .select("*")
      .is("posted_journal_entry_id", null)
      .in("status", ["recorded", "posted"])
      .gt("amount", 0);

    for (const payment of payablePayments ?? []) {
      await postPayablePaymentRow({
        supabase,
        paymentRow: payment,
        actorProfileId: owner.profileId ?? null,
        applySettlement: payment.status === "recorded",
      });
      counters.payablePayments += 1;
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_ledger",
      entityId: null,
      action: "ledger_backfill_completed",
      actor: owner,
      payload: counters,
    });

    return counters;
  },
};

export const financeLedgerCoreController = {
  async listCounterparties(input?: {
    kind?: string | null;
    isActive?: string | null;
    search?: string | null;
    sourceType?: string | null;
  }) {
    const supabase = getClient();

    let query = supabase
      .from("finance_counterparties")
      .select("*")
      .order("created_at", { ascending: false });

    if (input?.kind) {
      query = query.eq("kind", input.kind);
    }

    if (input?.sourceType) {
      query = query.eq("source_type", input.sourceType);
    }

    if (input?.isActive === "true") {
      query = query.eq("is_active", true);
    } else if (input?.isActive === "false") {
      query = query.eq("is_active", false);
    }

    const search = normalizeText(input?.search);
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `name.ilike.${pattern},kind.ilike.${pattern},external_code.ilike.${pattern},contact_email.ilike.${pattern},contact_phone.ilike.${pattern}`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new ApiError(500, "Failed to load counterparties", error.message);
    }

    return data ?? [];
  },

  async createCounterparty(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = counterpartySchema.parse(payload);
    const supabase = getClient();

    const normalizedName = parsed.name.trim();
    const normalizedKind = normalizeCounterpartyKind(parsed.kind);
    const normalizedExternalCode = normalizeText(parsed.externalCode);
    const normalizedContactEmail = normalizeText(parsed.contactEmail);
    const normalizedContactPhone = normalizeText(parsed.contactPhone);
    const isActive = parsed.isActive ?? true;

    const sourceResolution = await resolveCounterpartySourceReferences({
      supabase,
      name: normalizedName,
      kind: normalizedKind,
      externalCode: normalizedExternalCode,
      contactEmail: normalizedContactEmail,
      contactPhone: normalizedContactPhone,
      isActive,
      serviceProviderId: parsed.serviceProviderId ?? null,
      hotelId: parsed.hotelId ?? null,
    });

    const metadata: Record<string, unknown> = {
      ...(parsed.metadata ?? {}),
    };
    if (sourceResolution.sourceType !== "manual") {
      metadata.sync = {
        linked: true,
        source_type: sourceResolution.sourceType,
        link_action: sourceResolution.linkAction,
      };

      const linkField =
        sourceResolution.sourceType === "hotel"
          ? "hotel_id"
          : "service_provider_id";
      const linkId =
        sourceResolution.sourceType === "hotel"
          ? sourceResolution.hotelId
          : sourceResolution.serviceProviderId;

      if (linkId) {
        const { data: existingLinked, error: existingLinkedError } =
          await supabase
            .from("finance_counterparties")
            .select("id, name")
            .eq(linkField, linkId)
            .limit(1);

        if (existingLinkedError) {
          throw new ApiError(
            500,
            "Failed to check existing source linkage for counterparty",
            existingLinkedError.message,
          );
        }

        if ((existingLinked ?? []).length > 0) {
          throw new ApiError(
            409,
            `A finance counterparty is already linked to this ${sourceResolution.sourceType.replace(
              "_",
              " ",
            )}`,
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("finance_counterparties")
      .insert({
        name: normalizedName,
        kind: normalizedKind,
        service_provider_id: sourceResolution.serviceProviderId,
        hotel_id: sourceResolution.hotelId,
        external_code:
          sourceResolution.resolvedExternalCode ?? normalizedExternalCode,
        is_active: isActive,
        contact_email:
          sourceResolution.resolvedContactEmail ?? normalizedContactEmail,
        contact_phone:
          sourceResolution.resolvedContactPhone ?? normalizedContactPhone,
        source_type: sourceResolution.sourceType,
        source_snapshot: sourceResolution.sourceSnapshot,
        last_synced_at:
          sourceResolution.sourceType === "manual"
            ? null
            : new Date().toISOString(),
        metadata,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to create counterparty", error?.message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_counterparty",
      entityId: data.id,
      action: "counterparty_created",
      actor: owner,
      payload: {
        kind: data.kind,
        sourceType: data.source_type,
        sourceLinkAction: sourceResolution.linkAction,
      },
    });

    return data;
  },

  async updateCounterparty(
    counterpartyId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(counterpartyId);
    const parsed = counterpartyPatchSchema.parse(payload);
    const supabase = getClient();

    const { data: current, error: currentError } = await supabase
      .from("finance_counterparties")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      throw new ApiError(
        500,
        "Failed to load counterparty",
        currentError.message,
      );
    }

    if (!current) {
      throw new ApiError(404, "Counterparty not found");
    }

    const patch: Record<string, unknown> = {};

    if (parsed.name !== undefined) patch.name = parsed.name.trim();
    if (parsed.kind !== undefined) patch.kind = parsed.kind.trim();
    if (parsed.serviceProviderId !== undefined) {
      patch.service_provider_id = parsed.serviceProviderId ?? null;
    }
    if (parsed.hotelId !== undefined) patch.hotel_id = parsed.hotelId ?? null;
    if (parsed.externalCode !== undefined) {
      patch.external_code = normalizeText(parsed.externalCode);
    }
    if (parsed.isActive !== undefined) patch.is_active = parsed.isActive;
    if (parsed.contactEmail !== undefined) {
      patch.contact_email = normalizeText(parsed.contactEmail);
    }
    if (parsed.contactPhone !== undefined) {
      patch.contact_phone = normalizeText(parsed.contactPhone);
    }
    if (parsed.metadata !== undefined) patch.metadata = parsed.metadata;

    const nextServiceProviderId =
      parsed.serviceProviderId !== undefined
        ? (parsed.serviceProviderId ?? null)
        : (current.service_provider_id ?? null);
    const nextHotelId =
      parsed.hotelId !== undefined
        ? (parsed.hotelId ?? null)
        : (current.hotel_id ?? null);

    if (nextServiceProviderId && nextHotelId) {
      throw new ApiError(
        422,
        "Counterparty can link to either a service provider or a hotel, not both",
      );
    }

    if (nextServiceProviderId) {
      const { data: existingLinked, error: existingLinkedError } =
        await supabase
          .from("finance_counterparties")
          .select("id")
          .eq("service_provider_id", nextServiceProviderId)
          .neq("id", id)
          .limit(1);

      if (existingLinkedError) {
        throw new ApiError(
          500,
          "Failed to validate service provider linkage uniqueness",
          existingLinkedError.message,
        );
      }

      if ((existingLinked ?? []).length > 0) {
        throw new ApiError(
          409,
          "A finance counterparty is already linked to this service provider",
        );
      }
    }

    if (nextHotelId) {
      const { data: existingLinked, error: existingLinkedError } =
        await supabase
          .from("finance_counterparties")
          .select("id")
          .eq("hotel_id", nextHotelId)
          .neq("id", id)
          .limit(1);

      if (existingLinkedError) {
        throw new ApiError(
          500,
          "Failed to validate hotel linkage uniqueness",
          existingLinkedError.message,
        );
      }

      if ((existingLinked ?? []).length > 0) {
        throw new ApiError(
          409,
          "A finance counterparty is already linked to this hotel",
        );
      }
    }

    const nextSourceType = nextServiceProviderId
      ? "service_provider"
      : nextHotelId
        ? "hotel"
        : "manual";

    patch.source_type = nextSourceType;
    if (nextSourceType === "manual") {
      patch.last_synced_at = null;
      patch.source_snapshot = {};
    } else if (
      nextServiceProviderId !== current.service_provider_id ||
      nextHotelId !== current.hotel_id
    ) {
      patch.last_synced_at = new Date().toISOString();
      patch.source_snapshot = {
        source_type: nextSourceType,
        source_id: nextServiceProviderId ?? nextHotelId,
      };
    }

    const { data, error } = await supabase
      .from("finance_counterparties")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to update counterparty", error?.message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_counterparty",
      entityId: id,
      action: "counterparty_updated",
      actor: owner,
      payload: { fields: Object.keys(patch) },
    });

    return data;
  },

  async deleteCounterparty(counterpartyId: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(counterpartyId);
    const supabase = getClient();

    const { data: current, error: currentError } = await supabase
      .from("finance_counterparties")
      .select("id, name, kind, source_type, is_active")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      throw new ApiError(
        500,
        "Failed to load counterparty",
        currentError.message,
      );
    }

    if (!current) {
      throw new ApiError(404, "Counterparty not found");
    }

    const { count, error: payableCountError } = await supabase
      .from("finance_payables")
      .select("*", { count: "exact", head: true })
      .eq("counterparty_id", id);

    if (payableCountError) {
      throw new ApiError(
        500,
        "Failed to validate counterparty payables usage",
        payableCountError.message,
      );
    }

    const referencedPayables = count ?? 0;
    if (referencedPayables > 0) {
      if (current.is_active) {
        const { error: deactivateError } = await supabase
          .from("finance_counterparties")
          .update({ is_active: false })
          .eq("id", id);

        if (deactivateError) {
          throw new ApiError(
            500,
            "Failed to deactivate counterparty",
            deactivateError.message,
          );
        }

        await writeFinanceAuditEvent({
          supabase,
          entityType: "finance_counterparty",
          entityId: id,
          action: "counterparty_deactivated",
          actor: owner,
          payload: {
            reason: "delete_blocked_due_to_references",
            referencedPayables,
          },
        });

        return {
          outcome: "deactivated" as const,
          counterpartyId: id,
          referencedPayables,
        };
      }

      await writeFinanceAuditEvent({
        supabase,
        entityType: "finance_counterparty",
        entityId: id,
        action: "counterparty_delete_noop",
        actor: owner,
        payload: {
          reason: "already_inactive_with_references",
          referencedPayables,
        },
      });

      return {
        outcome: "already_inactive" as const,
        counterpartyId: id,
        referencedPayables,
      };
    }

    const { data: deletedRow, error: deleteError } = await supabase
      .from("finance_counterparties")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      throw new ApiError(
        500,
        "Failed to delete counterparty",
        deleteError.message,
      );
    }

    if (!deletedRow) {
      throw new ApiError(404, "Counterparty not found");
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_counterparty",
      entityId: id,
      action: "counterparty_deleted",
      actor: owner,
      payload: {
        sourceType: current.source_type,
      },
    });

    return {
      outcome: "deleted" as const,
      counterpartyId: id,
      referencedPayables: 0,
    };
  },

  async getCounterpartySyncHistory(limit?: unknown) {
    const supabase = getClient();
    const parsedLimit = z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .parse(limit ?? 10);

    const { data, error } = await supabase
      .from("finance_audit_events")
      .select("*")
      .eq("entity_type", "finance_counterparty_sync")
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    if (error) {
      throw new ApiError(
        500,
        "Failed to load counterparty sync history",
        error.message,
      );
    }

    return data ?? [];
  },

  async reconcileCounterparties(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = counterpartyReconcileSchema.parse(payload);
    const permissionSet = new Set(owner.permissions ?? []);

    const canRunDryRun =
      permissionSet.has("admin.access") ||
      permissionSet.has("finance.counterparties") ||
      permissionSet.has("finance.settings");
    const canRunApply =
      permissionSet.has("admin.access") ||
      permissionSet.has("finance.settings");

    if (parsed.mode === "dry_run" && !canRunDryRun) {
      throw new ApiError(403, "finance.counterparties permission is required");
    }

    if (parsed.mode === "apply" && !canRunApply) {
      throw new ApiError(403, "finance.settings permission is required");
    }

    return financeCounterpartySync.reconcile({
      mode: parsed.mode,
      sourceType: parsed.sourceType ?? "all",
      sourceIds: parsed.sourceIds,
      limit: parsed.limit ?? null,
      actor: owner,
    });
  },

  async listPayables(input?: {
    status?: string | null;
    counterpartyId?: string | null;
  }) {
    const supabase = getClient();

    let query = supabase
      .from("finance_payables")
      .select("*")
      .order("issue_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (input?.status) {
      query = query.eq("status", input.status);
    }

    if (input?.counterpartyId) {
      query = query.eq("counterparty_id", input.counterpartyId);
    }

    const { data: payables, error: payablesError } = await query;
    if (payablesError) {
      throw new ApiError(500, "Failed to load payables", payablesError.message);
    }

    const payableRows = payables ?? [];
    if (payableRows.length === 0) {
      return [];
    }

    const counterpartyIds = Array.from(
      new Set(
        payableRows
          .map((payable: any) => payable.counterparty_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const { data: counterparties, error: counterpartiesError } = await supabase
      .from("finance_counterparties")
      .select("id, name, kind")
      .in("id", counterpartyIds);

    if (counterpartiesError) {
      throw new ApiError(
        500,
        "Failed to resolve payable counterparties",
        counterpartiesError.message,
      );
    }

    const counterpartyMap = new Map<string, { name: string; kind: string }>();
    for (const item of counterparties ?? []) {
      counterpartyMap.set(item.id, { name: item.name, kind: item.kind });
    }

    const payableIds = payableRows.map((payable: any) => payable.id);

    const { data: pendingApprovals, error: approvalsError } = await supabase
      .from("finance_approval_requests")
      .select("entity_id")
      .eq("entity_type", "finance_payable")
      .eq("status", "pending")
      .in("entity_id", payableIds);

    if (approvalsError) {
      throw new ApiError(
        500,
        "Failed to resolve payable approvals",
        approvalsError.message,
      );
    }

    const pendingSet = new Set(
      (pendingApprovals ?? []).map((row: any) => row.entity_id),
    );

    return payableRows.map((payable: any) => {
      const counterparty = counterpartyMap.get(payable.counterparty_id);
      return {
        ...payable,
        counterparty_name: counterparty?.name ?? null,
        counterparty_kind: counterparty?.kind ?? null,
        has_pending_approval: pendingSet.has(payable.id),
      };
    });
  },

  async getPayableDetail(payableId: unknown) {
    const id = uuidSchema.parse(payableId);
    const supabase = getClient();

    const { payable, lines } = await fetchPayableWithLines(supabase, id);

    const [counterpartyResult, paymentsResult] = await Promise.all([
      supabase
        .from("finance_counterparties")
        .select("id, name, kind")
        .eq("id", payable.counterparty_id)
        .maybeSingle(),
      supabase
        .from("finance_payable_payments")
        .select("*")
        .eq("finance_payable_id", id)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (counterpartyResult.error) {
      throw new ApiError(
        500,
        "Failed to load payable counterparty",
        counterpartyResult.error.message,
      );
    }

    if (paymentsResult.error) {
      throw new ApiError(
        500,
        "Failed to load payable payments",
        paymentsResult.error.message,
      );
    }

    const payments = paymentsResult.data ?? [];
    const paymentGroupIds = Array.from(
      new Set(
        payments
          .map((row: any) => row.payment_group_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const [payableApprovalsResult, paymentGroupApprovalsResult] =
      await Promise.all([
        supabase
          .from("finance_approval_requests")
          .select("*")
          .eq("entity_type", "finance_payable")
          .eq("entity_id", id)
          .order("created_at", { ascending: false }),
        paymentGroupIds.length > 0
          ? supabase
              .from("finance_approval_requests")
              .select("*")
              .eq("entity_type", "finance_payable_payment_group")
              .in("entity_id", paymentGroupIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (payableApprovalsResult.error) {
      throw new ApiError(
        500,
        "Failed to load payable approvals",
        payableApprovalsResult.error.message,
      );
    }

    if (paymentGroupApprovalsResult.error) {
      throw new ApiError(
        500,
        "Failed to load payable payment approvals",
        paymentGroupApprovalsResult.error.message,
      );
    }

    const relatedApprovals = [
      ...(payableApprovalsResult.data ?? []),
      ...(paymentGroupApprovalsResult.data ?? []),
    ].sort((a: any, b: any) => {
      const createdAtA =
        typeof a.created_at === "string" ? Date.parse(a.created_at) : 0;
      const createdAtB =
        typeof b.created_at === "string" ? Date.parse(b.created_at) : 0;
      return createdAtB - createdAtA;
    });

    return {
      payable: {
        ...payable,
        counterparty_name: counterpartyResult.data?.name ?? null,
        counterparty_kind: counterpartyResult.data?.kind ?? null,
      },
      lines,
      payments,
      approvals: relatedApprovals,
    };
  },

  async createPayable(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = createPayableSchema.parse(payload);
    const supabase = getClient();

    const issueDate = toDateOnly(parsed.issueDate) ?? todayDateOnly();
    const dueDate = toDateOnly(parsed.dueDate);
    const totalAmount = normalizeMoney(
      parsed.lines.reduce((sum, line) => sum + normalizeMoney(line.amount), 0),
    );

    const { data: payable, error: payableError } = await supabase
      .from("finance_payables")
      .insert({
        counterparty_id: parsed.counterpartyId,
        finance_case_id: parsed.financeCaseId ?? null,
        finance_order_id: parsed.financeOrderId ?? null,
        status: "draft",
        issue_date: issueDate,
        due_date: dueDate,
        currency: parsed.currency,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        notes: normalizeText(parsed.notes),
        created_by_profile_id: owner.profileId ?? null,
      })
      .select("*")
      .single();

    if (payableError || !payable) {
      throw new ApiError(
        500,
        "Failed to create payable",
        payableError?.message,
      );
    }

    const linePayload = parsed.lines.map((line) => ({
      finance_payable_id: payable.id,
      description: line.description.trim(),
      amount: normalizeMoney(line.amount),
      finance_chart_account_id: line.financeChartAccountId ?? null,
      metadata: line.metadata ?? {},
    }));

    const { error: linesError } = await supabase
      .from("finance_payable_lines")
      .insert(linePayload);
    if (linesError) {
      const { error: rollbackError } = await supabase
        .from("finance_payables")
        .delete()
        .eq("id", payable.id);

      throw new ApiError(
        500,
        "Failed to create payable lines",
        rollbackError
          ? `${linesError.message}; payable rollback failed: ${rollbackError.message}`
          : linesError.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payable",
      entityId: payable.id,
      action: "payable_created",
      actor: owner,
      payload: {
        payable_number: payable.payable_number,
        total_amount: payable.total_amount,
      },
    });

    return this.getPayableDetail(payable.id);
  },

  async updatePayable(
    payableId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(payableId);
    const parsed = updatePayableSchema.parse(payload);
    const supabase = getClient();

    const { payable, lines: existingLines } = await fetchPayableWithLines(
      supabase,
      id,
    );

    if (!canEditPayableStatus(payable.status)) {
      throw new ApiError(409, "Only draft payables can be edited");
    }

    const { data: pendingSubmitRequests, error: pendingSubmitError } =
      await supabase
        .from("finance_approval_requests")
        .select("id")
        .eq("entity_type", "finance_payable")
        .eq("entity_id", id)
        .eq("action", "payable_submit")
        .eq("status", "pending")
        .limit(1);

    if (pendingSubmitError) {
      throw new ApiError(
        500,
        "Failed to verify payable approval status",
        pendingSubmitError.message,
      );
    }

    if ((pendingSubmitRequests ?? []).length > 0) {
      throw new ApiError(
        409,
        "Cannot edit payable while an approval request is pending",
      );
    }

    const patch: Record<string, unknown> = {};
    if (parsed.counterpartyId !== undefined)
      patch.counterparty_id = parsed.counterpartyId;
    if (parsed.financeCaseId !== undefined)
      patch.finance_case_id = parsed.financeCaseId ?? null;
    if (parsed.financeOrderId !== undefined)
      patch.finance_order_id = parsed.financeOrderId ?? null;
    if (parsed.issueDate !== undefined) {
      const issueDate = toDateOnly(parsed.issueDate);
      if (!issueDate) {
        throw new ApiError(422, "Issue date must be a valid date");
      }
      patch.issue_date = issueDate;
    }
    if (parsed.dueDate !== undefined) {
      const dueDate = toDateOnly(parsed.dueDate);
      if (!dueDate) {
        throw new ApiError(422, "Due date must be a valid date");
      }
      patch.due_date = dueDate;
    }
    if (parsed.currency !== undefined) patch.currency = parsed.currency;
    if (parsed.notes !== undefined) patch.notes = normalizeText(parsed.notes);

    let totalAmount = normalizeMoney(payable.total_amount);
    let replacedLines = false;
    const previousLinePayload = (existingLines ?? []).map((line: any) => ({
      finance_payable_id: id,
      description: line.description,
      amount: normalizeMoney(line.amount),
      finance_chart_account_id: line.finance_chart_account_id ?? null,
      metadata: line.metadata ?? {},
    }));

    const restorePreviousLines = async () => {
      const { error: restoreDeleteError } = await supabase
        .from("finance_payable_lines")
        .delete()
        .eq("finance_payable_id", id);

      if (restoreDeleteError) {
        return `failed to clear payable lines during rollback: ${restoreDeleteError.message}`;
      }

      if (previousLinePayload.length === 0) {
        return null;
      }

      const { error: restoreInsertError } = await supabase
        .from("finance_payable_lines")
        .insert(previousLinePayload);

      if (restoreInsertError) {
        return `failed to restore payable lines during rollback: ${restoreInsertError.message}`;
      }

      return null;
    };

    if (parsed.lines) {
      replacedLines = true;
      const { error: deleteError } = await supabase
        .from("finance_payable_lines")
        .delete()
        .eq("finance_payable_id", id);

      if (deleteError) {
        throw new ApiError(
          500,
          "Failed to reset payable lines",
          deleteError.message,
        );
      }

      totalAmount = normalizeMoney(
        parsed.lines.reduce(
          (sum, line) => sum + normalizeMoney(line.amount),
          0,
        ),
      );

      const linePayload = parsed.lines.map((line) => ({
        finance_payable_id: id,
        description: line.description.trim(),
        amount: normalizeMoney(line.amount),
        finance_chart_account_id: line.financeChartAccountId ?? null,
        metadata: line.metadata ?? {},
      }));

      const { error: lineInsertError } = await supabase
        .from("finance_payable_lines")
        .insert(linePayload);

      if (lineInsertError) {
        const rollbackMessage = await restorePreviousLines();
        throw new ApiError(
          500,
          "Failed to save payable lines",
          rollbackMessage
            ? `${lineInsertError.message}; ${rollbackMessage}`
            : lineInsertError.message,
        );
      }
    }

    patch.total_amount = totalAmount;
    patch.balance_amount = computeBalance(totalAmount, payable.paid_amount);

    const { error: updateError } = await supabase
      .from("finance_payables")
      .update(patch)
      .eq("id", id);

    if (updateError) {
      if (replacedLines) {
        const rollbackMessage = await restorePreviousLines();
        throw new ApiError(
          500,
          "Failed to update payable",
          rollbackMessage
            ? `${updateError.message}; ${rollbackMessage}`
            : updateError.message,
        );
      }
      throw new ApiError(500, "Failed to update payable", updateError.message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payable",
      entityId: id,
      action: "payable_updated",
      actor: owner,
      payload: {
        fields: Object.keys(patch),
      },
    });

    return this.getPayableDetail(id);
  },

  async submitPayable(payableId: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(payableId);
    const supabase = getClient();

    const { payable, lines } = await fetchPayableWithLines(supabase, id);

    if (!canSubmitPayableStatus(payable.status)) {
      throw new ApiError(409, "Only draft payables can be submitted");
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      throw new ApiError(422, "Payable must include at least one line item");
    }

    const lineAccountIds = lines
      .map((line: any) => line.finance_chart_account_id)
      .filter((value: unknown): value is string => typeof value === "string");

    if (lineAccountIds.length !== lines.length) {
      throw new ApiError(
        422,
        "Each payable line must map to an expense/COGS account before submission",
      );
    }

    const { data: lineAccounts, error: accountError } = await supabase
      .from("finance_chart_accounts")
      .select("id, account_type, is_active")
      .in("id", lineAccountIds);

    if (accountError) {
      throw new ApiError(
        500,
        "Failed to validate payable account mapping",
        accountError.message,
      );
    }

    const accountById = new Map<
      string,
      { account_type: string; is_active: boolean }
    >();
    for (const row of lineAccounts ?? []) {
      accountById.set(row.id, {
        account_type: row.account_type,
        is_active: row.is_active,
      });
    }

    for (const line of lines) {
      const account = accountById.get(line.finance_chart_account_id);
      if (!account || !account.is_active) {
        throw new ApiError(422, "Payable lines must map to active accounts");
      }
      if (!["expense", "cogs"].includes(account.account_type)) {
        throw new ApiError(
          422,
          "Payable lines must map to expense or COGS accounts",
        );
      }
    }

    const settings = await resolveFinanceSettings(supabase);
    const threshold = resolveThreshold(
      settings,
      "payable_submit",
      (payable.currency ?? "EGP") as FinanceCurrency,
    );

    const totalAmount = normalizeMoney(payable.total_amount);
    const requiresApproval = totalAmount - threshold > EPSILON;

    let approvalRequest: any = null;

    if (requiresApproval) {
      const { data: existingPending, error: existingError } = await supabase
        .from("finance_approval_requests")
        .select("*")
        .eq("entity_type", "finance_payable")
        .eq("entity_id", payable.id)
        .eq("action", "payable_submit")
        .eq("status", "pending")
        .maybeSingle();

      if (existingError) {
        throw new ApiError(
          500,
          "Failed to verify existing approval request",
          existingError.message,
        );
      }

      if (existingPending) {
        approvalRequest = existingPending;
      } else {
        const { data: createdRequest, error: approvalError } = await supabase
          .from("finance_approval_requests")
          .insert({
            entity_type: "finance_payable",
            entity_id: payable.id,
            action: "payable_submit",
            status: "pending",
            requested_by_profile_id: owner.profileId ?? null,
            threshold_amount: threshold,
            currency: payable.currency ?? "EGP",
            reason: parseApprovalReason("finance_payable", "payable_submit"),
          })
          .select("*")
          .single();

        if (approvalError || !createdRequest) {
          throw new ApiError(
            500,
            "Failed to create approval request",
            approvalError?.message,
          );
        }

        approvalRequest = createdRequest;
      }
    } else {
      const { error: approveError } = await supabase
        .from("finance_payables")
        .update({
          status: "approved",
          approved_by_profile_id: owner.profileId ?? null,
        })
        .eq("id", payable.id);

      if (approveError) {
        throw new ApiError(
          500,
          "Failed to approve payable",
          approveError.message,
        );
      }

      const { data: autoApproval, error: autoApprovalError } = await supabase
        .from("finance_approval_requests")
        .insert({
          entity_type: "finance_payable",
          entity_id: payable.id,
          action: "payable_submit",
          status: "approved",
          requested_by_profile_id: owner.profileId ?? null,
          approved_by_profile_id: owner.profileId ?? null,
          threshold_amount: threshold,
          currency: payable.currency ?? "EGP",
          reason: "Auto-approved below threshold",
          decision_notes: "Auto-approved by threshold policy",
          decided_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (autoApprovalError || !autoApproval) {
        throw new ApiError(
          500,
          "Failed to record approval decision",
          autoApprovalError?.message,
        );
      }

      approvalRequest = autoApproval;

      await postPayableApprovalJournal({
        supabase,
        payableId: payable.id,
        actorProfileId: owner.profileId ?? null,
      });
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payable",
      entityId: payable.id,
      action: requiresApproval
        ? "payable_submitted_for_approval"
        : "payable_auto_approved",
      actor: owner,
      payload: {
        threshold,
        total_amount: totalAmount,
        requires_approval: requiresApproval,
      },
    });

    return {
      payable: (await this.getPayableDetail(payable.id)).payable,
      requiresApproval,
      approvalRequest,
    };
  },

  async cancelPayable(payableId: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(payableId);
    const supabase = getClient();

    const { data: payable, error: payableError } = await supabase
      .from("finance_payables")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (payableError) {
      throw new ApiError(500, "Failed to load payable", payableError.message);
    }

    if (!payable) {
      throw new ApiError(404, "Payable not found");
    }

    if (payable.status === "cancelled") {
      throw new ApiError(409, "Payable is already cancelled");
    }

    if (!canCancelPayableStatus(payable.status)) {
      throw new ApiError(
        409,
        "Cannot cancel payable after approval/settlement posting",
      );
    }

    const { data: pendingSubmitRequests, error: pendingSubmitError } =
      await supabase
        .from("finance_approval_requests")
        .select("id")
        .eq("entity_type", "finance_payable")
        .eq("entity_id", id)
        .eq("action", "payable_submit")
        .eq("status", "pending");

    if (pendingSubmitError) {
      throw new ApiError(
        500,
        "Failed to load pending payable approvals",
        pendingSubmitError.message,
      );
    }

    const { data: cancelledPayable, error: cancelError } = await supabase
      .from("finance_payables")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", payable.status)
      .select("id")
      .maybeSingle();

    if (cancelError) {
      throw new ApiError(500, "Failed to cancel payable", cancelError.message);
    }

    if (!cancelledPayable) {
      throw new ApiError(
        409,
        "Payable status changed before cancellation could be applied",
      );
    }

    const pendingIds = (pendingSubmitRequests ?? [])
      .map((row: any) => row.id)
      .filter((value: unknown): value is string => typeof value === "string");

    if (pendingIds.length > 0) {
      const nowIso = new Date().toISOString();
      const { error: cancelApprovalsError } = await supabase
        .from("finance_approval_requests")
        .update({
          status: "cancelled",
          decision_notes: "Cancelled because the payable was cancelled",
          decided_at: nowIso,
          approved_by_profile_id: null,
          rejected_by_profile_id: null,
        })
        .in("id", pendingIds);

      if (cancelApprovalsError) {
        const { error: payableRollbackError } = await supabase
          .from("finance_payables")
          .update({ status: payable.status })
          .eq("id", id);

        throw new ApiError(
          500,
          "Failed to cancel linked approval requests",
          payableRollbackError
            ? `${cancelApprovalsError.message}; payable rollback failed: ${payableRollbackError.message}`
            : cancelApprovalsError.message,
        );
      }
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payable",
      entityId: id,
      action: "payable_cancelled",
      actor: owner,
      payload: {
        cancelled_pending_approvals: pendingIds.length,
      },
    });

    return this.getPayableDetail(id);
  },

  async recordPayablePayment(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = payablePaymentSchema.parse(payload);
    const supabase = getClient();

    const { data: openPayables, error: openPayablesError } = await supabase
      .from("finance_payables")
      .select(
        "id, payable_number, currency, due_date, paid_amount, balance_amount, status",
      )
      .in("status", PAYABLE_SETTLEMENT_OPEN_STATUSES)
      .gt("balance_amount", 0)
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (openPayablesError) {
      throw new ApiError(
        500,
        "Failed to load open payables",
        openPayablesError.message,
      );
    }

    const openRows = openPayables ?? [];
    if (openRows.length === 0) {
      throw new ApiError(409, "No open payables are available for settlement");
    }

    const openById = new Map<string, any>();
    for (const payable of openRows) {
      openById.set(payable.id, payable);
    }

    let allocations: PayableAllocation[] = [];

    if (Array.isArray(parsed.allocations) && parsed.allocations.length > 0) {
      allocations = parsed.allocations.map((row) => ({
        payableId: row.payableId,
        amount: normalizeMoney(row.amount),
      }));
    } else {
      const amount = normalizeMoney(parsed.amount);
      if (amount <= EPSILON) {
        throw new ApiError(422, "Amount must be greater than zero");
      }

      const sourceRows = parsed.payableId
        ? openRows.filter((row) => row.id === parsed.payableId)
        : openRows;

      if (sourceRows.length === 0) {
        throw new ApiError(404, "Selected payable is not open for settlement");
      }

      allocations = buildAutomaticPayableAllocationPlan(sourceRows, amount);
    }

    const allocationTotal = normalizeMoney(
      allocations.reduce((sum, row) => sum + normalizeMoney(row.amount), 0),
    );

    for (const allocation of allocations) {
      const payable = openById.get(allocation.payableId);
      if (!payable) {
        throw new ApiError(
          422,
          `Invalid payable allocation target: ${allocation.payableId}`,
        );
      }
      if (
        allocation.amount - normalizeMoney(payable.balance_amount) >
        EPSILON
      ) {
        throw new ApiError(
          422,
          `Allocation exceeds payable balance for ${payable.payable_number}`,
        );
      }
      if ((payable.currency ?? "EGP") !== parsed.currency) {
        throw new ApiError(
          422,
          "All allocations must match the payment currency",
        );
      }
    }

    const paymentDate = toDateOnly(parsed.paymentDate) ?? todayDateOnly();
    const paymentGroupId = randomUUID();

    const paymentRows = allocations.map((allocation) => ({
      finance_payable_id: allocation.payableId,
      finance_payment_id: null,
      payment_date: paymentDate,
      amount: normalizeMoney(allocation.amount),
      currency: parsed.currency,
      payment_method: parsed.paymentMethod,
      reference: normalizeText(parsed.reference),
      notes: normalizeText(parsed.notes),
      created_by_profile_id: owner.profileId ?? null,
      payment_group_id: paymentGroupId,
      status: "recorded" as (typeof PAYMENT_STATUSES)[number],
    }));

    const { data: insertedPayments, error: insertError } = await supabase
      .from("finance_payable_payments")
      .insert(paymentRows)
      .select("*")
      .order("created_at", { ascending: true });

    if (insertError) {
      throw new ApiError(
        500,
        "Failed to record payable payment",
        insertError.message,
      );
    }

    const insertedRows = insertedPayments ?? [];
    const insertedPaymentIds = insertedRows
      .map((row: any) => row.id)
      .filter((value: unknown): value is string => typeof value === "string");
    const payableSnapshotsById = new Map<
      string,
      { paidAmount: number; balanceAmount: number; status: string }
    >();
    for (const payable of openRows) {
      payableSnapshotsById.set(payable.id, {
        paidAmount: normalizeMoney(payable.paid_amount),
        balanceAmount: normalizeMoney(payable.balance_amount),
        status:
          typeof payable.status === "string" && payable.status.length > 0
            ? payable.status
            : "draft",
      });
    }

    const settings = await resolveFinanceSettings(supabase);
    const threshold = resolveThreshold(
      settings,
      "payable_payment",
      parsed.currency,
    );
    const requiresApproval = allocationTotal - threshold > EPSILON;

    let approvalRequest: any = null;
    let approvalRequestId: string | null = null;

    const rollbackPaymentRecording = async () => {
      const rollbackErrors: string[] = [];
      let postedEntryIds: string[] = [];

      if (approvalRequestId) {
        const { error: deleteApprovalError } = await supabase
          .from("finance_approval_requests")
          .delete()
          .eq("id", approvalRequestId);
        if (deleteApprovalError) {
          rollbackErrors.push(
            `approval rollback failed: ${deleteApprovalError.message}`,
          );
        }
      }

      if (insertedPaymentIds.length > 0) {
        const { data: currentRows, error: loadCurrentRowsError } =
          await supabase
            .from("finance_payable_payments")
            .select("id, finance_payable_id, posted_journal_entry_id")
            .in("id", insertedPaymentIds);

        if (loadCurrentRowsError) {
          rollbackErrors.push(
            `payment rollback preflight failed: ${loadCurrentRowsError.message}`,
          );
        } else {
          postedEntryIds = Array.from(
            new Set(
              (currentRows ?? [])
                .map((row: any) => row.posted_journal_entry_id)
                .filter(
                  (value: unknown): value is string =>
                    typeof value === "string" && value.length > 0,
                ),
            ),
          );
        }

        const affectedPayableIds = Array.from(
          new Set(
            allocations
              .map((allocation) => allocation.payableId)
              .filter(
                (value: unknown): value is string =>
                  typeof value === "string" && value.length > 0,
              ),
          ),
        );

        for (const payableId of affectedPayableIds) {
          const snapshot = payableSnapshotsById.get(payableId);
          if (!snapshot) {
            continue;
          }
          const { error: payableRollbackError } = await supabase
            .from("finance_payables")
            .update({
              paid_amount: snapshot.paidAmount,
              balance_amount: snapshot.balanceAmount,
              status: snapshot.status,
            })
            .eq("id", payableId);

          if (payableRollbackError) {
            rollbackErrors.push(
              `payable ${payableId} rollback failed: ${payableRollbackError.message}`,
            );
          }
        }

        const { error: deletePaymentRowsError } = await supabase
          .from("finance_payable_payments")
          .delete()
          .in("id", insertedPaymentIds);

        if (deletePaymentRowsError) {
          rollbackErrors.push(
            `payment rows rollback failed: ${deletePaymentRowsError.message}`,
          );
        }
      }

      if (postedEntryIds.length > 0) {
        const { error: deleteEntriesError } = await supabase
          .from("finance_journal_entries")
          .delete()
          .in("id", postedEntryIds);
        if (deleteEntriesError) {
          rollbackErrors.push(
            `journal rollback failed: ${deleteEntriesError.message}`,
          );
        }
      }

      return rollbackErrors.length > 0 ? rollbackErrors.join("; ") : null;
    };

    try {
      if (requiresApproval) {
        const { data: createdRequest, error: approvalError } = await supabase
          .from("finance_approval_requests")
          .insert({
            entity_type: "finance_payable_payment_group",
            entity_id: paymentGroupId,
            action: "payable_payment_post",
            status: "pending",
            requested_by_profile_id: owner.profileId ?? null,
            threshold_amount: threshold,
            currency: parsed.currency,
            reason: parseApprovalReason(
              "finance_payable_payment_group",
              "payable_payment_post",
            ),
          })
          .select("*")
          .single();

        if (approvalError || !createdRequest) {
          throw new ApiError(
            500,
            "Failed to create payable payment approval",
            approvalError?.message,
          );
        }

        approvalRequest = createdRequest;
        approvalRequestId =
          typeof createdRequest.id === "string" ? createdRequest.id : null;
      } else {
        const { data: createdRequest, error: approvalError } = await supabase
          .from("finance_approval_requests")
          .insert({
            entity_type: "finance_payable_payment_group",
            entity_id: paymentGroupId,
            action: "payable_payment_post",
            status: "approved",
            requested_by_profile_id: owner.profileId ?? null,
            approved_by_profile_id: owner.profileId ?? null,
            threshold_amount: threshold,
            currency: parsed.currency,
            reason: "Auto-approved below threshold",
            decision_notes: "Auto-posted by threshold policy",
            decided_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (approvalError || !createdRequest) {
          throw new ApiError(
            500,
            "Failed to record approval for payable payment",
            approvalError?.message,
          );
        }

        approvalRequest = createdRequest;
        approvalRequestId =
          typeof createdRequest.id === "string" ? createdRequest.id : null;

        await postPayablePaymentGroup({
          supabase,
          paymentGroupId,
          actorProfileId: owner.profileId ?? null,
          applySettlementForRecorded: true,
        });
      }
    } catch (error) {
      const rollbackDetails = await rollbackPaymentRecording();
      if (error instanceof ApiError) {
        if (rollbackDetails) {
          throw new ApiError(error.status, error.message, {
            cause: error.details ?? null,
            rollback: rollbackDetails,
          });
        }
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to finalize payable payment";
      if (rollbackDetails) {
        throw new ApiError(500, "Failed to finalize payable payment", {
          cause: message,
          rollback: rollbackDetails,
        });
      }
      throw new ApiError(500, "Failed to finalize payable payment", message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_payable_payment_group",
      entityId: paymentGroupId,
      action: requiresApproval
        ? "payable_payment_submitted_for_approval"
        : "payable_payment_auto_posted",
      actor: owner,
      payload: {
        amount: allocationTotal,
        threshold,
        allocations: paymentRows.map((row) => ({
          finance_payable_id: row.finance_payable_id,
          amount: row.amount,
        })),
      },
    });

    return {
      paymentGroupId,
      payments: insertedRows,
      requiresApproval,
      approvalRequest,
    };
  },

  async listPayablePayments(payableId?: string | null) {
    const supabase = getClient();

    let query = supabase
      .from("finance_payable_payments")
      .select("*")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (payableId) {
      query = query.eq("finance_payable_id", payableId);
    }

    const { data, error } = await query;
    if (error) {
      throw new ApiError(500, "Failed to load payable payments", error.message);
    }

    return data ?? [];
  },

  async listApprovalRequests(input?: {
    status?: string | null;
    entityType?: string | null;
  }) {
    const supabase = getClient();

    let query = supabase
      .from("finance_approval_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (input?.status) {
      query = query.eq("status", input.status);
    }

    if (input?.entityType) {
      query = query.eq("entity_type", input.entityType);
    }

    const { data, error } = await query;
    if (error) {
      throw new ApiError(
        500,
        "Failed to load approval requests",
        error.message,
      );
    }

    return data ?? [];
  },

  async decideApprovalRequest(
    approvalRequestId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    if (!(owner.permissions ?? []).includes("finance.approvals")) {
      throw new ApiError(403, "finance.approvals permission is required");
    }

    const id = uuidSchema.parse(approvalRequestId);
    const parsed = approvalDecisionSchema.parse(payload);
    const supabase = getClient();

    const { data: request, error: requestError } = await supabase
      .from("finance_approval_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (requestError) {
      throw new ApiError(
        500,
        "Failed to load approval request",
        requestError.message,
      );
    }

    if (!request) {
      throw new ApiError(404, "Approval request not found");
    }

    if (request.status !== "pending") {
      throw new ApiError(409, "Approval request is not pending");
    }

    const decisionNotes = normalizeText(parsed.decisionNotes);
    const decidedAt = new Date().toISOString();

    const { data: transitionedRequest, error: transitionError } = await supabase
      .from("finance_approval_requests")
      .update({
        status: parsed.status,
        approved_by_profile_id:
          parsed.status === "approved" ? (owner.profileId ?? null) : null,
        rejected_by_profile_id:
          parsed.status === "rejected" ? (owner.profileId ?? null) : null,
        decision_notes: decisionNotes,
        decided_at: decidedAt,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (transitionError) {
      throw new ApiError(
        500,
        "Failed to update approval request",
        transitionError.message,
      );
    }

    if (!transitionedRequest) {
      throw new ApiError(409, "Approval request is no longer pending");
    }

    try {
      if (parsed.status === "approved") {
        if (
          request.entity_type === "finance_payable" &&
          request.action === "payable_submit"
        ) {
          const { data: approvedPayable, error: payableApproveError } =
            await supabase
              .from("finance_payables")
              .update({
                status: "approved",
                approved_by_profile_id: owner.profileId ?? null,
              })
              .eq("id", request.entity_id)
              .eq("status", "draft")
              .select("id")
              .maybeSingle();

          if (payableApproveError) {
            throw new ApiError(
              500,
              "Failed to approve payable",
              payableApproveError.message,
            );
          }

          if (!approvedPayable?.id) {
            throw new ApiError(
              409,
              "Payable is no longer draft and cannot be approved",
            );
          }

          await postPayableApprovalJournal({
            supabase,
            payableId: request.entity_id,
            actorProfileId: owner.profileId ?? null,
          });
        } else if (
          request.entity_type === "finance_payable_payment_group" &&
          request.action === "payable_payment_post"
        ) {
          await postPayablePaymentGroup({
            supabase,
            paymentGroupId: request.entity_id,
            actorProfileId: owner.profileId ?? null,
            applySettlementForRecorded: true,
          });
        } else {
          throw new ApiError(
            422,
            `Unsupported approval target: ${request.entity_type}`,
          );
        }
      }

      if (parsed.status === "rejected") {
        if (
          request.entity_type === "finance_payable_payment_group" &&
          request.action === "payable_payment_post"
        ) {
          const { error: reverseError } = await supabase
            .from("finance_payable_payments")
            .update({ status: "reversed" })
            .eq("payment_group_id", request.entity_id)
            .eq("status", "recorded");

          if (reverseError) {
            throw new ApiError(
              500,
              "Failed to reverse pending payable payments",
              reverseError.message,
            );
          }
        }
      }
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (
        parsed.status === "approved" &&
        request.entity_type === "finance_payable" &&
        request.action === "payable_submit"
      ) {
        const { error: payableRollbackError } = await supabase
          .from("finance_payables")
          .update({
            status: "draft",
            approved_by_profile_id: null,
          })
          .eq("id", request.entity_id)
          .eq("status", "approved");

        if (payableRollbackError) {
          rollbackErrors.push(
            `payable rollback failed: ${payableRollbackError.message}`,
          );
        }
      }

      const { error: approvalRollbackError } = await supabase
        .from("finance_approval_requests")
        .update({
          status: "pending",
          approved_by_profile_id: null,
          rejected_by_profile_id: null,
          decision_notes: null,
          decided_at: null,
        })
        .eq("id", id)
        .eq("status", parsed.status);

      if (approvalRollbackError) {
        rollbackErrors.push(
          `approval rollback failed: ${approvalRollbackError.message}`,
        );
      }

      const rollbackDetails =
        rollbackErrors.length > 0 ? rollbackErrors.join("; ") : null;

      if (error instanceof ApiError) {
        if (rollbackDetails) {
          throw new ApiError(error.status, error.message, {
            cause: error.details ?? null,
            rollback: rollbackDetails,
          });
        }
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Failed to apply decision";
      if (rollbackDetails) {
        throw new ApiError(500, "Failed to apply decision", {
          cause: message,
          rollback: rollbackDetails,
        });
      }
      throw new ApiError(500, "Failed to apply decision", message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_approval_request",
      entityId: id,
      action:
        parsed.status === "approved"
          ? "approval_approved"
          : "approval_rejected",
      actor: owner,
      payload: {
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        action: request.action,
      },
    });

    return transitionedRequest;
  },

  async listJournalEntries(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
    sourceType?: string | null;
  }) {
    const supabase = getClient();

    let query = supabase
      .from("finance_journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    const dateFrom = toDateOnly(input?.dateFrom);
    const dateTo = toDateOnly(input?.dateTo);

    if (dateFrom) {
      query = query.gte("entry_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("entry_date", dateTo);
    }

    if (input?.sourceType) {
      query = query.eq("source_type", input.sourceType);
    }

    const { data: entries, error: entriesError } = await query;
    if (entriesError) {
      throw new ApiError(
        500,
        "Failed to load journal entries",
        entriesError.message,
      );
    }

    const rows = entries ?? [];
    if (rows.length === 0) {
      return [];
    }

    const entryIds = rows.map((row: any) => row.id);
    const { data: lines, error: linesError } = await supabase
      .from("finance_journal_lines")
      .select("finance_journal_entry_id, debit, credit")
      .in("finance_journal_entry_id", entryIds);

    if (linesError) {
      throw new ApiError(
        500,
        "Failed to load journal totals",
        linesError.message,
      );
    }

    const totalsByEntry = new Map<
      string,
      { debit: number; credit: number; lines: number }
    >();
    for (const line of lines ?? []) {
      const key = line.finance_journal_entry_id;
      const current = totalsByEntry.get(key) ?? {
        debit: 0,
        credit: 0,
        lines: 0,
      };
      current.debit = normalizeMoney(
        current.debit + normalizeMoney(line.debit),
      );
      current.credit = normalizeMoney(
        current.credit + normalizeMoney(line.credit),
      );
      current.lines += 1;
      totalsByEntry.set(key, current);
    }

    return rows.map((row: any) => {
      const totals = totalsByEntry.get(row.id) ?? {
        debit: 0,
        credit: 0,
        lines: 0,
      };
      return {
        ...row,
        total_debit: totals.debit,
        total_credit: totals.credit,
        lines_count: totals.lines,
      };
    });
  },

  async getJournalEntryDetail(entryId: unknown) {
    const id = uuidSchema.parse(entryId);
    const supabase = getClient();

    const { data: entry, error: entryError } = await supabase
      .from("finance_journal_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (entryError) {
      throw new ApiError(
        500,
        "Failed to load journal entry",
        entryError.message,
      );
    }

    if (!entry) {
      throw new ApiError(404, "Journal entry not found");
    }

    const { data: lines, error: linesError } = await supabase
      .from("finance_journal_lines")
      .select("*, finance_chart_accounts(account_code, name, account_type)")
      .eq("finance_journal_entry_id", id)
      .order("created_at", { ascending: true });

    if (linesError) {
      throw new ApiError(
        500,
        "Failed to load journal entry lines",
        linesError.message,
      );
    }

    return {
      entry,
      lines: lines ?? [],
    };
  },

  async getApAgingReport(asOfDate?: string | null) {
    const supabase = getClient();
    const asOf = toDateOnly(asOfDate) ?? todayDateOnly();

    const { data: payables, error } = await supabase
      .from("finance_payables")
      .select(
        "id, payable_number, counterparty_id, due_date, balance_amount, currency, status",
      )
      .in("status", PAYABLE_SETTLEMENT_OPEN_STATUSES)
      .gt("balance_amount", 0);

    if (error) {
      throw new ApiError(500, "Failed to load AP aging data", error.message);
    }

    const counterpartyIds = Array.from(
      new Set(
        (payables ?? [])
          .map((row: any) => row.counterparty_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const { data: counterparties, error: counterpartiesError } =
      counterpartyIds.length
        ? await supabase
            .from("finance_counterparties")
            .select("id, name")
            .in("id", counterpartyIds)
        : { data: [], error: null };

    if (counterpartiesError) {
      throw new ApiError(
        500,
        "Failed to resolve counterparties",
        counterpartiesError.message,
      );
    }

    const counterpartyMap = new Map<string, string>();
    for (const item of counterparties ?? []) {
      counterpartyMap.set(item.id, item.name);
    }

    const rows = (payables ?? []).map((payable: any) => {
      const dueDate = toDateOnly(payable.due_date) ?? asOf;
      const daysPastDue = daysBetween(dueDate, asOf);
      return {
        payableId: payable.id,
        payableNumber: payable.payable_number,
        counterpartyId: payable.counterparty_id,
        counterpartyName: counterpartyMap.get(payable.counterparty_id) ?? null,
        dueDate,
        balanceAmount: normalizeMoney(payable.balance_amount),
        currency: payable.currency ?? "EGP",
        daysPastDue,
        bucket: agingBucket(daysPastDue),
      };
    });

    const buckets: Record<
      "current" | "1_30" | "31_60" | "61_90" | "90_plus",
      { amount: number; count: number; byCurrency: Record<string, number> }
    > = {
      current: { amount: 0, count: 0, byCurrency: {} },
      "1_30": { amount: 0, count: 0, byCurrency: {} },
      "31_60": { amount: 0, count: 0, byCurrency: {} },
      "61_90": { amount: 0, count: 0, byCurrency: {} },
      "90_plus": { amount: 0, count: 0, byCurrency: {} },
    };

    const totalsByCurrency: Record<string, number> = {};
    let totalAmount = 0;

    for (const row of rows) {
      const bucket = buckets[row.bucket as keyof typeof buckets];
      bucket.amount = normalizeMoney(bucket.amount + row.balanceAmount);
      bucket.count += 1;
      bucket.byCurrency[row.currency] = normalizeMoney(
        (bucket.byCurrency[row.currency] ?? 0) + row.balanceAmount,
      );

      totalsByCurrency[row.currency] = normalizeMoney(
        (totalsByCurrency[row.currency] ?? 0) + row.balanceAmount,
      );
      totalAmount = normalizeMoney(totalAmount + row.balanceAmount);
    }

    return {
      asOfDate: asOf,
      totalAmount,
      totalsByCurrency,
      buckets,
      rows: rows.sort((a, b) => b.daysPastDue - a.daysPastDue),
    };
  },

  async getPayablesDueCalendar(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    const supabase = getClient();
    const dateFrom = toDateOnly(input?.dateFrom) ?? todayDateOnly();
    const dateTo =
      toDateOnly(input?.dateTo) ??
      (() => {
        const date = new Date(`${dateFrom}T00:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() + 60);
        return date.toISOString().slice(0, 10);
      })();

    const { data: payables, error } = await supabase
      .from("finance_payables")
      .select(
        "id, payable_number, counterparty_id, due_date, balance_amount, currency, status",
      )
      .in("status", PAYABLE_SETTLEMENT_OPEN_STATUSES)
      .gt("balance_amount", 0)
      .gte("due_date", dateFrom)
      .lte("due_date", dateTo)
      .order("due_date", { ascending: true });

    if (error) {
      throw new ApiError(500, "Failed to load due calendar", error.message);
    }

    const counterpartyIds = Array.from(
      new Set(
        (payables ?? [])
          .map((row: any) => row.counterparty_id)
          .filter(
            (value: unknown): value is string => typeof value === "string",
          ),
      ),
    );

    const { data: counterparties, error: counterpartiesError } =
      counterpartyIds.length
        ? await supabase
            .from("finance_counterparties")
            .select("id, name")
            .in("id", counterpartyIds)
        : { data: [], error: null };

    if (counterpartiesError) {
      throw new ApiError(
        500,
        "Failed to resolve counterparties",
        counterpartiesError.message,
      );
    }

    const counterpartyMap = new Map<string, string>();
    for (const item of counterparties ?? []) {
      counterpartyMap.set(item.id, item.name);
    }

    const rows = (payables ?? []).map((payable: any) => ({
      payableId: payable.id,
      payableNumber: payable.payable_number,
      counterpartyId: payable.counterparty_id,
      counterpartyName: counterpartyMap.get(payable.counterparty_id) ?? null,
      dueDate: toDateOnly(payable.due_date) ?? dateFrom,
      balanceAmount: normalizeMoney(payable.balance_amount),
      currency: payable.currency ?? "EGP",
      status: payable.status,
    }));

    const byDate: Record<
      string,
      {
        totalAmount: number;
        byCurrency: Record<string, number>;
        items: typeof rows;
      }
    > = {};

    for (const row of rows) {
      const bucket = byDate[row.dueDate] ?? {
        totalAmount: 0,
        byCurrency: {},
        items: [],
      };

      bucket.totalAmount = normalizeMoney(
        bucket.totalAmount + row.balanceAmount,
      );
      bucket.byCurrency[row.currency] = normalizeMoney(
        (bucket.byCurrency[row.currency] ?? 0) + row.balanceAmount,
      );
      bucket.items.push(row);
      byDate[row.dueDate] = bucket;
    }

    return {
      from: dateFrom,
      to: dateTo,
      rows,
      byDate,
    };
  },

  async getTrialBalanceReport(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    const supabase = getClient();
    const settings = await resolveFinanceSettings(supabase);
    const lines = await loadJournalLinesForRange({
      supabase,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
    });

    const accounts = aggregateJournalBalances(lines);

    const totalDebit = normalizeMoney(
      accounts.reduce((sum, account) => sum + normalizeMoney(account.debit), 0),
    );
    const totalCredit = normalizeMoney(
      accounts.reduce(
        (sum, account) => sum + normalizeMoney(account.credit),
        0,
      ),
    );

    return {
      baseCurrency: settings.baseCurrency,
      dateFrom: toDateOnly(input?.dateFrom),
      dateTo: toDateOnly(input?.dateTo),
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) <= 0.01,
      accounts,
    };
  },

  async getProfitLossReport(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    const supabase = getClient();
    const settings = await resolveFinanceSettings(supabase);
    const lines = await loadJournalLinesForRange({
      supabase,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
    });

    const accounts = aggregateJournalBalances(lines);

    let revenue = 0;
    let cogs = 0;
    let expenses = 0;
    let otherNet = 0;

    for (const account of accounts) {
      if (["revenue", "contra_revenue"].includes(account.accountType)) {
        revenue = normalizeSignedMoney(
          revenue + (account.credit - account.debit),
        );
      } else if (account.accountType === "cogs") {
        cogs = normalizeSignedMoney(cogs + (account.debit - account.credit));
      } else if (account.accountType === "expense") {
        expenses = normalizeSignedMoney(
          expenses + (account.debit - account.credit),
        );
      } else if (account.accountType === "other_income_expense") {
        otherNet = normalizeSignedMoney(
          otherNet + (account.credit - account.debit),
        );
      }
    }

    const grossProfit = normalizeSignedMoney(revenue - cogs);
    const operatingProfit = normalizeSignedMoney(grossProfit - expenses);
    const netIncome = normalizeSignedMoney(operatingProfit + otherNet);

    return {
      baseCurrency: settings.baseCurrency,
      dateFrom: toDateOnly(input?.dateFrom),
      dateTo: toDateOnly(input?.dateTo),
      revenue,
      cogs,
      grossProfit,
      expenses,
      otherNet,
      operatingProfit,
      netIncome,
      accounts,
    };
  },

  async getBalanceSheetReport(input?: { dateTo?: string | null }) {
    const supabase = getClient();
    const settings = await resolveFinanceSettings(supabase);
    const dateTo = toDateOnly(input?.dateTo);

    const lines = await loadJournalLinesForRange({
      supabase,
      dateFrom: null,
      dateTo,
    });

    const accounts = aggregateJournalBalances(lines);

    const pl = await this.getProfitLossReport({
      dateFrom: null,
      dateTo,
    });

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const account of accounts) {
      if (account.accountType === "asset") {
        assets = normalizeSignedMoney(
          assets + (account.debit - account.credit),
        );
      } else if (account.accountType === "liability") {
        liabilities = normalizeSignedMoney(
          liabilities + (account.credit - account.debit),
        );
      } else if (account.accountType === "equity") {
        equity = normalizeSignedMoney(
          equity + (account.credit - account.debit),
        );
      }
    }

    const retainedEarnings = normalizeSignedMoney(pl.netIncome);
    const equityWithEarnings = normalizeSignedMoney(equity + retainedEarnings);
    const liabilitiesAndEquity = normalizeSignedMoney(
      liabilities + equityWithEarnings,
    );
    const difference = normalizeSignedMoney(assets - liabilitiesAndEquity);

    return {
      baseCurrency: settings.baseCurrency,
      asOfDate: dateTo,
      assets,
      liabilities,
      equity,
      retainedEarnings,
      equityWithEarnings,
      liabilitiesAndEquity,
      difference,
      balanced: Math.abs(difference) <= 0.01,
      accounts,
    };
  },

  async getFinanceSettings() {
    const supabase = getClient();
    const settings = await resolveFinanceSettings(supabase);

    return {
      baseCurrency: settings.baseCurrency,
      approvalThresholds: settings.approvalThresholds,
      postingAccounts: settings.postingAccounts,
    };
  },

  async updateFinanceSettings(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = settingsPatchSchema.parse(payload);
    const supabase = getClient();

    const current = await resolveFinanceSettings(supabase);

    const nextBaseCurrency = parsed.baseCurrency ?? current.baseCurrency;

    const nextThresholds = {
      ...current.approvalThresholds,
      ...(parsed.approvalThresholds
        ? Object.fromEntries(
            Object.entries(parsed.approvalThresholds).map(([action, map]) => [
              action,
              normalizeThresholdMap(map),
            ]),
          )
        : {}),
    };

    const nextPostingAccounts = {
      ...current.postingAccounts,
      ...(parsed.postingAccounts ?? {}),
    };

    await loadAccountsByCodes(
      supabase,
      Object.values(nextPostingAccounts).filter(
        (value) => typeof value === "string",
      ),
    );

    const payloadToSave = {
      base_currency: nextBaseCurrency,
      approval_thresholds: nextThresholds,
      posting_accounts: nextPostingAccounts,
    };

    let updateQuery = supabase.from("finance_settings").update(payloadToSave);

    if (current.id) {
      updateQuery = updateQuery.eq("id", current.id);
    }

    const { data, error } = await updateQuery.select("*").single();

    if (error || !data) {
      throw new ApiError(
        500,
        "Failed to update finance settings",
        error?.message,
      );
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_settings",
      entityId: data.id,
      action: "settings_updated",
      actor: owner,
      payload: {
        base_currency: nextBaseCurrency,
      },
    });

    return {
      baseCurrency: nextBaseCurrency,
      approvalThresholds: nextThresholds,
      postingAccounts: nextPostingAccounts,
    };
  },

  async listChartAccounts() {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("finance_chart_accounts")
      .select("*")
      .order("account_code", { ascending: true });

    if (error) {
      throw new ApiError(500, "Failed to load chart accounts", error.message);
    }

    return data ?? [];
  },

  async createChartAccount(payload: unknown, actor?: FinanceActor) {
    const owner = ensureActor(actor);
    const parsed = chartAccountCreateSchema.parse(payload);
    const supabase = getClient();

    const { data, error } = await supabase
      .from("finance_chart_accounts")
      .insert({
        account_code: parsed.accountCode.trim(),
        name: parsed.name.trim(),
        account_type: parsed.accountType.trim(),
        parent_account_id: parsed.parentAccountId ?? null,
        is_active: parsed.isActive ?? true,
        metadata: parsed.metadata ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to create chart account", error?.message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_chart_account",
      entityId: data.id,
      action: "chart_account_created",
      actor: owner,
      payload: {
        account_code: data.account_code,
      },
    });

    return data;
  },

  async updateChartAccount(
    accountId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    const owner = ensureActor(actor);
    const id = uuidSchema.parse(accountId);
    const parsed = chartAccountPatchSchema.parse(payload);
    const supabase = getClient();

    const patch: Record<string, unknown> = {};
    if (parsed.name !== undefined) patch.name = parsed.name.trim();
    if (parsed.accountType !== undefined)
      patch.account_type = parsed.accountType.trim();
    if (parsed.parentAccountId !== undefined) {
      patch.parent_account_id = parsed.parentAccountId;
    }
    if (parsed.isActive !== undefined) patch.is_active = parsed.isActive;
    if (parsed.metadata !== undefined) patch.metadata = parsed.metadata;

    const { data, error } = await supabase
      .from("finance_chart_accounts")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to update chart account", error?.message);
    }

    await writeFinanceAuditEvent({
      supabase,
      entityType: "finance_chart_account",
      entityId: id,
      action: "chart_account_updated",
      actor: owner,
      payload: {
        fields: Object.keys(patch),
      },
    });

    return data;
  },
};

export const financeLedgerController = {
  async listJournalEntries(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
    sourceType?: string | null;
  }) {
    return financeLedgerCoreController.listJournalEntries(input);
  },

  async getJournalEntryDetail(entryId: unknown) {
    return financeLedgerCoreController.getJournalEntryDetail(entryId);
  },
};
