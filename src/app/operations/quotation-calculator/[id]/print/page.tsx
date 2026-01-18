"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import type {
  QuoteComputed,
  QuoteInput,
} from "@/lib/operations/quotation-calculator/types";

type OperationsQuoteDetail = {
  id: string;
  quote_number: string;
  quote_date: string;
  client_type: string;
  patient_name: string;
  country: string;
  age: number | null;
  input_data: QuoteInput;
  computed_data: QuoteComputed;
  final_price_usd: number | null;
};

const formatCurrency = (value: number, currency: "USD" | "EGP" = "USD") => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
};

export default function QuotationPrintView() {
  const params = useParams();
  const quoteId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [hasPrinted, setHasPrinted] = useState(false);

  const quoteQuery = useQuery({
    queryKey: ["operations", "quotes", quoteId],
    queryFn: () =>
      adminFetch<OperationsQuoteDetail>(
        `/api/admin/operations/quotes/${quoteId}`,
      ),
    enabled: Boolean(quoteId),
  });

  const quote = quoteQuery.data;
  const input = quote?.input_data;
  const computed = quote?.computed_data;

  const additionalServices = useMemo(
    () =>
      (computed?.tourismServices ?? []).filter(
        (item) => item.serviceName || item.quantity > 0,
      ),
    [computed?.tourismServices],
  );

  useEffect(() => {
    if (quote && !hasPrinted) {
      setHasPrinted(true);
      window.print();
    }
  }, [hasPrinted, quote]);

  if (quoteQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading quote…
      </div>
    );
  }

  if (quoteQuery.isError || !quote || !input || !computed) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Unable to load this quote. Please return to the calculator and try
        again.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            CARE N TOUR
          </h1>
          <p className="text-sm text-muted-foreground">
            Premium Medical Tourism in Egypt
          </p>
          <p className="text-xs text-muted-foreground">
            www.carentour.com | info@carentour.com | +20 122 9503333
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              Medical Tourism Package Quotation
            </h2>
            <Separator />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Patient information
              </p>
              <p>
                <span className="text-muted-foreground">Quote number:</span>{" "}
                {input.meta.quoteNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Quote date:</span>{" "}
                {formatDate(input.meta.quoteDate)}
              </p>
              <p>
                <span className="text-muted-foreground">Patient name:</span>{" "}
                {input.meta.patientName}
              </p>
              <p>
                <span className="text-muted-foreground">Country:</span>{" "}
                {input.meta.country}
              </p>
              <p>
                <span className="text-muted-foreground">Age:</span>{" "}
                {input.meta.age || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Client type:</span>{" "}
                {input.meta.clientType}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Procedure details
              </p>
              <p>
                <span className="text-muted-foreground">Procedure:</span>{" "}
                {input.medical.procedureName}
              </p>
              <p>
                <span className="text-muted-foreground">Hospital tier:</span>{" "}
                {input.medical.hospitalTier}
              </p>
              <p>
                <span className="text-muted-foreground">Length of stay:</span>{" "}
                {input.medical.lengthOfStayNights} nights
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Package inclusions
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <InclusionRow
                label="Complete Medical Procedure"
                value={formatCurrency(
                  computed.summary.medicalProcedureCostUsd,
                  "USD",
                )}
              />
              <InclusionRow
                label="Hospital Stay & Medical Care"
                value="Included"
              />
              <InclusionRow
                label="Accommodation"
                value={formatCurrency(
                  computed.summary.accommodationCostUsd,
                  "USD",
                )}
              />
              <InclusionRow
                label="All Meals"
                value={input.accommodation.mealPlan || "Included"}
              />
              <InclusionRow
                label="International Flights"
                value={formatCurrency(
                  input.transportation.flightCostUsd,
                  "USD",
                )}
              />
              <InclusionRow
                label="Airport Transfers"
                value={input.transportation.airportVehicleType || "Included"}
              />
              <InclusionRow label="Local Transportation" value="As required" />
              <InclusionRow
                label="24/7 Medical Coordinator"
                value="Complete Journey Support"
              />
              <InclusionRow
                label="Pre & Post-Op Consultations"
                value="Included"
              />
              <InclusionRow
                label="Medical Records & Documentation"
                value="Included"
              />
            </div>
          </div>

          {additionalServices.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Additional services
                </p>
                <div className="grid gap-2">
                  {additionalServices.map((service, index) => (
                    <div
                      key={`${service.serviceName}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border px-3 py-2"
                    >
                      <span>
                        {service.serviceName || "Service"} x {service.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(service.totalUsd, "USD")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Investment summary
            </p>
            <SummaryRow
              label="Package subtotal"
              value={formatCurrency(computed.summary.subtotalUsd, "USD")}
            />
            <SummaryRow
              label="Profit margin"
              value={formatCurrency(computed.summary.profitAmountUsd, "USD")}
            />
            <SummaryRow
              label="Total package price"
              value={formatCurrency(computed.summary.finalPriceUsd, "USD")}
              highlight
            />
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Payment terms
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>30% deposit required upon booking confirmation</li>
              <li>50% payment due 14 days before arrival</li>
              <li>Final 20% payment upon arrival in Egypt</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InclusionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <span>{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-primary" : ""}>
        {value}
      </span>
    </div>
  );
}
