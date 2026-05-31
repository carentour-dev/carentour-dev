import type { Json } from "@/integrations/supabase/types";

export const MEDICAL_CONSULTATION_PAYMENT = {
  label: "Medical Consultation",
  amount: 50,
  currency: "USD",
} as const;

const STRIPE_PAYMENT_LINK_HOSTS = new Set([
  "buy.stripe.com",
  "checkout.stripe.com",
  "invoice.stripe.com",
  "pay.stripe.com",
]);

export type ConsultationPaymentLink = {
  id?: string;
  label: string;
  amount: number;
  currency: string;
  url: string;
  persisted: boolean;
};

export const normalizeStripePaymentUrl = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol !== "https:" ||
      !STRIPE_PAYMENT_LINK_HOSTS.has(parsed.hostname.toLowerCase())
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

export const buildMedicalConsultationPaymentLink = (
  url: string,
  fields?: Pick<ConsultationPaymentLink, "id" | "persisted">,
): ConsultationPaymentLink => ({
  ...MEDICAL_CONSULTATION_PAYMENT,
  url,
  id: fields?.id,
  persisted: fields?.persisted ?? false,
});

export const getConfiguredMedicalConsultationPaymentLink = () => {
  const url = normalizeStripePaymentUrl(
    process.env.MEDICAL_CONSULTATION_PAYMENT_URL,
  );

  return url ? buildMedicalConsultationPaymentLink(url) : null;
};

export const coerceMedicalPaymentLinkFromMetadata = (
  metadata: Json | null | undefined,
): ConsultationPaymentLink | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const link = (metadata as Record<string, Json>)
    .medicalConsultationPaymentLink;
  if (!link || typeof link !== "object" || Array.isArray(link)) {
    return null;
  }

  const record = link as Record<string, Json>;
  const url = normalizeStripePaymentUrl(
    typeof record.url === "string" ? record.url : null,
  );

  if (!url) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    label:
      typeof record.label === "string"
        ? record.label
        : MEDICAL_CONSULTATION_PAYMENT.label,
    amount:
      typeof record.amount === "number"
        ? record.amount
        : MEDICAL_CONSULTATION_PAYMENT.amount,
    currency:
      typeof record.currency === "string"
        ? record.currency
        : MEDICAL_CONSULTATION_PAYMENT.currency,
    url,
    persisted: typeof record.persisted === "boolean" ? record.persisted : false,
  };
};
