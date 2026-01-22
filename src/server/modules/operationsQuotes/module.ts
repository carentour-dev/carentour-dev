import type { Database } from "@/integrations/supabase/types";
import { quoteInputSchema } from "@/lib/operations/quotation-calculator/schema";
import { z } from "zod";
import { calculateQuote } from "@/lib/operations/quotation-calculator/calculations";
import type { QuoteInput } from "@/lib/operations/quotation-calculator/types";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type OperationsQuoteRow =
  Database["public"]["Tables"]["operations_quotes"]["Row"];
type OperationsQuoteInsert =
  Database["public"]["Tables"]["operations_quotes"]["Insert"];
type OperationsQuoteUpdate =
  Database["public"]["Tables"]["operations_quotes"]["Update"];

type QuoteOwnerContext = {
  userId: string;
  profileId?: string | null;
};

const getClient = () => getSupabaseAdmin();

const ensureOwner = (owner?: QuoteOwnerContext) => {
  if (!owner?.userId) {
    throw new ApiError(401, "Operation requires an authenticated team member");
  }
  return owner;
};

const parseAge = (value?: string | null) => {
  if (!value || !value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const operationsQuotesController = {
  async list(): Promise<OperationsQuoteRow[]> {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("operations_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "Failed to load quotes", error.message);
    }

    return data ?? [];
  },

  async get(quoteId: unknown): Promise<OperationsQuoteRow> {
    const supabase = getClient();
    const id = z.string().uuid("Invalid quote id").safeParse(quoteId);

    if (!id.success) {
      throw new ApiError(400, "Invalid quote id");
    }

    const { data, error } = await supabase
      .from("operations_quotes")
      .select("*")
      .eq("id", id.data)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to load quote", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Quote not found");
    }

    return data;
  },

  async create(
    payload: unknown,
    ownerContext?: QuoteOwnerContext,
  ): Promise<OperationsQuoteRow> {
    const owner = ensureOwner(ownerContext);
    const supabase = getClient();

    const parsed = quoteInputSchema.parse(payload) as QuoteInput;
    const computed = calculateQuote(parsed);
    const age = parseAge(parsed.meta.age);

    const insertPayload: OperationsQuoteInsert = {
      owner_user_id: owner.userId,
      owner_profile_id: owner.profileId ?? null,
      quote_number: parsed.meta.quoteNumber,
      quote_date: parsed.meta.quoteDate,
      client_type: parsed.meta.clientType,
      patient_name: parsed.meta.patientName,
      country: parsed.meta.country,
      age,
      input_data: parsed,
      computed_data: computed,
      subtotal_usd: computed.summary.subtotalUsd,
      profit_margin: computed.summary.profitMarginRate,
      profit_amount_usd: computed.summary.profitAmountUsd,
      final_price_usd: computed.summary.finalPriceUsd,
    };

    const { data, error } = await supabase
      .from("operations_quotes")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to create quote", error?.message);
    }

    return data;
  },

  async update(quoteId: unknown, payload: unknown): Promise<OperationsQuoteRow> {
    const supabase = getClient();
    const id = z.string().uuid("Invalid quote id").safeParse(quoteId);

    if (!id.success) {
      throw new ApiError(400, "Invalid quote id");
    }

    const parsed = quoteInputSchema.parse(payload) as QuoteInput;
    const computed = calculateQuote(parsed);
    const age = parseAge(parsed.meta.age);

    const updatePayload: OperationsQuoteUpdate = {
      quote_number: parsed.meta.quoteNumber,
      quote_date: parsed.meta.quoteDate,
      client_type: parsed.meta.clientType,
      patient_name: parsed.meta.patientName,
      country: parsed.meta.country,
      age,
      input_data: parsed,
      computed_data: computed,
      subtotal_usd: computed.summary.subtotalUsd,
      profit_margin: computed.summary.profitMarginRate,
      profit_amount_usd: computed.summary.profitAmountUsd,
      final_price_usd: computed.summary.finalPriceUsd,
    };

    const { data, error } = await supabase
      .from("operations_quotes")
      .update(updatePayload)
      .eq("id", id.data)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update quote", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Quote not found");
    }

    return data;
  },
};
