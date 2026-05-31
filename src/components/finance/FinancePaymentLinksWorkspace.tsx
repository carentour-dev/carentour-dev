"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLink, Link2, Loader2, PlusCircle, Search } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { humanizeFinanceLabel } from "@/lib/finance/labels";
import type { PatientStatus } from "@/lib/patients/status";
import { cn } from "@/lib/utils";

type FinancePatient = {
  id: string;
  full_name: string;
  contact_email: string | null;
  nationality: string | null;
  home_city: string | null;
  status: PatientStatus;
};

type FinancePaymentLink = {
  id: string;
  patient_id: string;
  label: string;
  amount: number;
  currency: string;
  url: string;
  status: "active" | "disabled" | "paid" | "expired";
  expires_at: string | null;
  created_at: string;
  patients?: {
    id: string;
    full_name: string;
    contact_email: string | null;
    nationality: string | null;
  } | null;
};

const CURRENCIES = ["USD", "EGP", "EUR", "GBP", "SAR", "AED"] as const;

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return "No expiry";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const badgeVariant = (status?: string | null) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "paid":
      return "success" as const;
    case "expired":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export function FinancePaymentLinksWorkspace() {
  const { toast } = useToast();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<FinancePatient | null>(
    null,
  );
  const [form, setForm] = useState({
    label: "",
    amount: "",
    currency: "USD",
    url: "",
    expiresAt: "",
  });

  const normalizedSearch = patientSearch.trim();

  const patientsQuery = useQuery({
    queryKey: ["finance", "payment-links", "patients", normalizedSearch],
    enabled: normalizedSearch.length >= 2,
    staleTime: 30_000,
    queryFn: () =>
      adminFetch<FinancePatient[]>(
        `/api/admin/finance/patients/search?q=${encodeURIComponent(
          normalizedSearch,
        )}`,
      ),
  });

  const paymentLinksQuery = useQuery({
    queryKey: ["finance", "payment-links", selectedPatient?.id ?? "all"],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedPatient?.id) {
        params.set("patientId", selectedPatient.id);
      }
      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return adminFetch<FinancePaymentLink[]>(
        `/api/admin/finance/payment-links${suffix}`,
      );
    },
  });

  const selectedPatientSummary = useMemo(() => {
    if (!selectedPatient) return null;
    return [
      selectedPatient.contact_email,
      selectedPatient.home_city,
      selectedPatient.nationality,
    ]
      .filter(Boolean)
      .join(" • ");
  }, [selectedPatient]);

  const createPaymentLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient?.id) {
        throw new Error("Select a patient first.");
      }
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a positive payment amount.");
      }

      return adminFetch<FinancePaymentLink>(
        "/api/admin/finance/payment-links",
        {
          method: "POST",
          body: JSON.stringify({
            patientId: selectedPatient.id,
            label: form.label.trim() || "Stripe payment link",
            amount,
            currency: form.currency,
            url: form.url.trim(),
            expiresAt: form.expiresAt
              ? new Date(form.expiresAt).toISOString()
              : null,
          }),
        },
      );
    },
    onSuccess: async () => {
      setForm({
        label: "",
        amount: "",
        currency: "USD",
        url: "",
        expiresAt: "",
      });
      await paymentLinksQuery.refetch();
      toast({
        title: "Payment link created",
        description: "The patient can now see it on their dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create payment link",
        description:
          error instanceof Error ? error.message : "Please check the details.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (input: {
      paymentLinkId: string;
      status: FinancePaymentLink["status"];
    }) =>
      adminFetch<FinancePaymentLink>(
        `/api/admin/finance/payment-links/${input.paymentLinkId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: input.status }),
        },
      ),
    onSuccess: async () => {
      await paymentLinksQuery.refetch();
      toast({
        title: "Payment link updated",
        description: "The patient dashboard visibility was updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payment link",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const paymentLinks = paymentLinksQuery.data ?? [];
  const patientResults = patientsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Patient payment links
          </CardTitle>
          <CardDescription>
            Store manually generated Stripe links without creating an invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="payment-link-patient-search">
                  Search patient
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="payment-link-patient-search"
                    className="pl-9"
                    value={patientSearch}
                    placeholder="Search by name or email"
                    onChange={(event) => setPatientSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/70">
                {normalizedSearch.length < 2 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    Type at least 2 characters to search.
                  </p>
                ) : patientsQuery.isLoading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching patients...
                  </div>
                ) : patientResults.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No patients found.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto p-1">
                    {patientResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className={cn(
                          "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          selectedPatient?.id === patient.id && "bg-muted",
                        )}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <span className="font-medium text-foreground">
                          {patient.full_name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {[patient.contact_email, patient.nationality]
                            .filter(Boolean)
                            .join(" • ") || "No contact details"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
              {selectedPatient ? (
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedPatient.full_name}
                  </p>
                  {selectedPatientSummary ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedPatientSummary}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a patient to create a dashboard payment link.
                </p>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="payment-link-label">Label</Label>
                  <Input
                    id="payment-link-label"
                    value={form.label}
                    placeholder="Deposit payment"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-link-url">Stripe URL</Label>
                  <Input
                    id="payment-link-url"
                    value={form.url}
                    placeholder="https://buy.stripe.com/..."
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        url: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-link-amount">Amount</Label>
                  <Input
                    id="payment-link-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-link-expires-at">Expires at</Label>
                  <Input
                    id="payment-link-expires-at"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expiresAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={() => createPaymentLinkMutation.mutate()}
                    disabled={
                      createPaymentLinkMutation.isPending || !selectedPatient
                    }
                  >
                    {createPaymentLinkMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Create link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payment links</CardTitle>
          <CardDescription>
            {selectedPatient
              ? `Showing links for ${selectedPatient.full_name}.`
              : "Showing the latest patient payment links."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentLinksQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payment links...
            </div>
          ) : paymentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment links found.
            </p>
          ) : (
            paymentLinks.map((paymentLink) => (
              <div
                key={paymentLink.id}
                className="rounded-lg border border-border/70 bg-muted/10 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {paymentLink.label}
                      </p>
                      <Badge variant={badgeVariant(paymentLink.status)}>
                        {humanizeFinanceLabel(paymentLink.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {paymentLink.patients?.full_name ?? "Unknown patient"} •{" "}
                      {formatCurrency(paymentLink.amount, paymentLink.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {formatDateTime(paymentLink.expires_at)}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {paymentLink.url}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={paymentLink.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                    {paymentLink.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            paymentLinkId: paymentLink.id,
                            status: "disabled",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        Disable
                      </Button>
                    ) : paymentLink.status === "disabled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            paymentLinkId: paymentLink.id,
                            status: "active",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        Activate
                      </Button>
                    ) : null}
                    {paymentLink.status !== "paid" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            paymentLinkId: paymentLink.id,
                            status: "paid",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancePaymentLinksWorkspace;
