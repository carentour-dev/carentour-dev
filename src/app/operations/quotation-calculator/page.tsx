"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calculator,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import { quoteInputSchema } from "@/lib/operations/quotation-calculator/schema";
import {
  buildDefaultQuoteInput,
  calculateQuote,
} from "@/lib/operations/quotation-calculator/calculations";
import type { QuoteInput } from "@/lib/operations/quotation-calculator/types";

type OperationsQuote = {
  id: string;
  quote_number: string;
  quote_date: string;
  patient_name: string;
  final_price_usd: number | null;
  created_at: string;
};

type OperationsQuoteDetail = {
  id: string;
  quote_number: string;
  input_data: QuoteInput;
};

type ExchangeRatesPayload = {
  source: string;
  url: string;
  fetchedAt: string;
  asOf: string | null;
  rates: Array<{
    code: string;
    name: string;
    usdToCurrency: number;
  }>;
};

const QUOTES_QUERY_KEY = ["operations", "quotes"] as const;

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

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const buildExchangeRateNote = (payload: ExchangeRatesPayload) => {
  const asOf = payload.asOf ? ` (as of ${payload.asOf})` : "";
  return `${payload.source} buy rate${asOf}`;
};

const safeValue = (value: number | null | undefined) =>
  Number.isFinite(value ?? NaN) ? Number(value) : 0;

const DEFAULT_QUOTE_SEQUENCE_PAD = 3;

const getNextQuoteNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (!match) {
    return `${trimmed}-${String(1).padStart(DEFAULT_QUOTE_SEQUENCE_PAD, "0")}`;
  }

  const [, prefix, numeric] = match;
  const next = Number.parseInt(numeric, 10) + 1;
  return `${prefix}${String(next).padStart(numeric.length, "0")}`;
};

const CLIENT_TYPES = [
  { value: "B2C", label: "B2C" },
  { value: "B2B", label: "B2B" },
] as const;

const EMPTY_MEDICAL_PROCEDURE: QuoteInput["dataSheets"]["medicalProcedures"][number] =
  {
    procedureCode: "",
    procedureName: "",
    category: "",
    premiumHospitalEgp: 0,
    midRangeHospitalEgp: 0,
    budgetHospitalEgp: 0,
    typicalLengthOfStayNights: 0,
    preOpDays: 0,
    postOpDays: 0,
    notes: "",
  };

const EMPTY_ACCOMMODATION: QuoteInput["dataSheets"]["accommodations"][number] =
  {
    hotelCode: "",
    hotelName: "",
    starRating: "",
    location: "",
    roomType: "",
    pricePerNightEgp: 0,
    mealPlan: "",
    mealPlanCostEgpPerDay: 0,
    airportDistanceKm: 0,
    notes: "",
  };

const EMPTY_TRANSPORTATION: QuoteInput["dataSheets"]["transportation"][number] =
  {
    serviceType: "",
    description: "",
    routeDetails: "",
    vehicleType: "",
    costEgp: 0,
    costUsd: 0,
    costEur: 0,
    provider: "",
    notes: "",
  };

const EMPTY_TOURISM_EXTRA: QuoteInput["dataSheets"]["tourismExtras"][number] = {
  serviceCode: "",
  serviceName: "",
  category: "",
  description: "",
  duration: "",
  costEgp: 0,
  costUsd: 0,
  costEur: 0,
  maxPersons: 0,
  notes: "",
};

export default function OperationsQuotationCalculatorPage() {
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();
  const defaultValues = useMemo(() => buildDefaultQuoteInput(), []);
  const [lastSavedQuoteId, setLastSavedQuoteId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<{
    id: string;
    quoteNumber: string;
  } | null>(null);
  const [loadingQuoteId, setLoadingQuoteId] = useState<string | null>(null);
  const [baselineInput, setBaselineInput] = useState<QuoteInput | null>(null);
  const [exchangeRatesMeta, setExchangeRatesMeta] = useState<{
    source: string;
    fetchedAt: string;
    asOf: string | null;
  } | null>(null);

  const form = useForm<QuoteInput>({
    resolver: zodResolver(quoteInputSchema),
    defaultValues,
  });
  const { isDirty } = form.formState;

  const tourismServices = useFieldArray({
    control: form.control,
    name: "tourismServices",
  });
  const indirectCosts = useFieldArray({
    control: form.control,
    name: "indirectCosts.items",
  });
  const currencyRates = useFieldArray({
    control: form.control,
    name: "currencyRates",
  });
  const medicalProcedures = useFieldArray({
    control: form.control,
    name: "dataSheets.medicalProcedures",
  });
  const accommodations = useFieldArray({
    control: form.control,
    name: "dataSheets.accommodations",
  });
  const transportationRows = useFieldArray({
    control: form.control,
    name: "dataSheets.transportation",
  });
  const tourismExtras = useFieldArray({
    control: form.control,
    name: "dataSheets.tourismExtras",
  });

  const watchAll = useWatch({ control: form.control }) as QuoteInput;
  const computed = useMemo(
    () => calculateQuote(watchAll ?? defaultValues),
    [watchAll, defaultValues],
  );
  const watchedCurrencyRates = watchAll?.currencyRates ?? [];
  const usdToEgp = safeValue(
    watchedCurrencyRates.find((rate) => rate.code === "EGP")?.usdToCurrency,
  );

  const getRateToEgp = (rate?: QuoteInput["currencyRates"][number]): number => {
    if (!rate) return 0;
    const usdToCurrency = safeValue(rate.usdToCurrency);
    if (rate.code === "EGP") {
      return usdToCurrency;
    }
    if (usdToEgp <= 0 || usdToCurrency <= 0) {
      return 0;
    }
    return usdToEgp / usdToCurrency;
  };

  const handleRateToEgpChange = (
    index: number,
    code: string,
    value: string,
  ) => {
    const parsed = Number(value);
    const nextValue = Number.isFinite(parsed) ? parsed : 0;

    if (code === "EGP") {
      form.setValue(`currencyRates.${index}.usdToCurrency`, nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const nextUsdToCurrency =
      usdToEgp > 0 && nextValue > 0 ? usdToEgp / nextValue : 0;
    form.setValue(`currencyRates.${index}.usdToCurrency`, nextUsdToCurrency, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const quotesQuery = useQuery({
    queryKey: QUOTES_QUERY_KEY,
    queryFn: () =>
      adminFetch<OperationsQuote[]>("/api/admin/operations/quotes"),
  });

  const createQuote = async (payload: QuoteInput) =>
    adminFetch<OperationsQuote>("/api/admin/operations/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const handleQuoteSaveSuccess = (
    quote: { id: string; quote_number: string },
    message: { title: string; description: string },
    values?: QuoteInput,
  ) => {
    const savedValues = values ?? form.getValues();
    form.reset(savedValues);
    setBaselineInput(savedValues);
    setLastSavedQuoteId(quote.id);
    setEditingQuote({ id: quote.id, quoteNumber: quote.quote_number });
    invalidate(QUOTES_QUERY_KEY);
    toast(message);
  };

  const handleQuoteSaveError = (error: unknown, title: string) => {
    toast({
      title,
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  };

  const saveQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: (quote, values) =>
      handleQuoteSaveSuccess(
        quote,
        {
          title: "Quote saved",
          description: `Quote ${quote.quote_number} was saved successfully.`,
        },
        values,
      ),
    onError: (error) => handleQuoteSaveError(error, "Unable to save quote"),
  });

  const saveAsNewQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: (quote, values) =>
      handleQuoteSaveSuccess(
        quote,
        {
          title: "Quote saved as new",
          description: `Quote ${quote.quote_number} was saved as a new copy.`,
        },
        values,
      ),
    onError: (error) =>
      handleQuoteSaveError(error, "Unable to save quote as new"),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({
      quoteId,
      payload,
    }: {
      quoteId: string;
      payload: QuoteInput;
    }) =>
      adminFetch<OperationsQuoteDetail>(
        `/api/admin/operations/quotes/${quoteId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: (quote, variables) =>
      handleQuoteSaveSuccess(
        quote,
        {
          title: "Quote updated",
          description: `Quote ${quote.quote_number} was updated successfully.`,
        },
        variables.payload,
      ),
    onError: (error) => handleQuoteSaveError(error, "Unable to update quote"),
  });

  const loadQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) =>
      adminFetch<OperationsQuoteDetail>(
        `/api/admin/operations/quotes/${quoteId}`,
      ),
    onMutate: (quoteId) => {
      setLoadingQuoteId(quoteId);
    },
    onSuccess: (quote) => {
      const parsed = quoteInputSchema.safeParse(quote.input_data);

      if (!parsed.success) {
        toast({
          title: "Unable to load quote",
          description: "This quote data is no longer valid.",
          variant: "destructive",
        });
        return;
      }

      const parsedData = parsed.data as QuoteInput;
      form.reset(parsedData);
      setBaselineInput(parsedData);
      setEditingQuote({ id: quote.id, quoteNumber: quote.quote_number });
      setLastSavedQuoteId(quote.id);
      toast({
        title: "Quote loaded",
        description: `Quote ${quote.quote_number} is ready to edit.`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      toast({
        title: "Unable to load quote",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoadingQuoteId(null);
    },
  });

  const exchangeRatesMutation = useMutation({
    mutationFn: () =>
      adminFetch<ExchangeRatesPayload>("/api/admin/operations/exchange-rates"),
    onSuccess: (payload) => {
      if (!payload?.rates?.length) {
        toast({
          title: "No rates received",
          description: "Banque Misr did not return any exchange rates.",
          variant: "destructive",
        });
        return;
      }

      const ratesByCode = new Map(
        payload.rates.map((rate) => [rate.code, rate]),
      );
      const currentRates = form.getValues("currencyRates") ?? [];
      const defaultNote = buildExchangeRateNote(payload);
      let updatedCount = 0;

      const nextRates = currentRates.map((rate) => {
        const match = ratesByCode.get(rate.code);
        if (!match || !Number.isFinite(match.usdToCurrency)) {
          return rate;
        }

        const usdToCurrency =
          match.usdToCurrency > 0 ? match.usdToCurrency : rate.usdToCurrency;
        if (usdToCurrency !== rate.usdToCurrency) {
          updatedCount += 1;
        }

        return {
          ...rate,
          name: match.name || rate.name,
          usdToCurrency,
          notes: rate.notes?.trim() ? rate.notes : defaultNote,
        };
      });

      currencyRates.replace(nextRates);
      setExchangeRatesMeta({
        source: payload.source,
        fetchedAt: payload.fetchedAt,
        asOf: payload.asOf,
      });

      toast({
        title: "Exchange rates updated",
        description: updatedCount
          ? `Updated ${updatedCount} currencies from ${payload.source}.`
          : "No matching currencies were updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to fetch exchange rates",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isPrimarySaving =
    saveQuoteMutation.isPending || updateQuoteMutation.isPending;
  const isAnySaving = isPrimarySaving || saveAsNewQuoteMutation.isPending;
  const canUndo = Boolean(baselineInput) && isDirty;

  const handleSave = form.handleSubmit((values) => {
    if (editingQuote?.id) {
      updateQuoteMutation.mutate({ quoteId: editingQuote.id, payload: values });
      return;
    }

    saveQuoteMutation.mutate(values);
  });

  const handleSaveAsNew = form.handleSubmit((values) => {
    const nextQuoteNumber = getNextQuoteNumber(values.meta.quoteNumber);
    const shouldUpdateNumber =
      Boolean(nextQuoteNumber) && nextQuoteNumber !== values.meta.quoteNumber;

    const payload: QuoteInput = shouldUpdateNumber
      ? {
          ...values,
          meta: {
            ...values.meta,
            quoteNumber: nextQuoteNumber ?? values.meta.quoteNumber,
          },
        }
      : values;

    if (shouldUpdateNumber) {
      form.setValue("meta.quoteNumber", nextQuoteNumber!, {
        shouldDirty: true,
      });
    }

    saveAsNewQuoteMutation.mutate(payload);
  });

  const handleUndoChanges = () => {
    if (!baselineInput) return;
    form.reset(baselineInput);
  };

  const handleExitEditMode = () => {
    if (isDirty) {
      const shouldExit = window.confirm(
        "You have unsaved changes. Exit edit mode and discard them?",
      );
      if (!shouldExit) return;
    }
    const currentValues = form.getValues();
    form.reset(currentValues);
    setEditingQuote(null);
    setLastSavedQuoteId(null);
    setBaselineInput(currentValues);
  };

  const handleReset = () => {
    form.reset(buildDefaultQuoteInput());
    setLastSavedQuoteId(null);
    setEditingQuote(null);
    setBaselineInput(null);
  };

  const handlePrint = (quoteId?: string | null) => {
    if (!quoteId) return;
    window.open(`/operations/quotation-calculator/${quoteId}/print`, "_blank");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Quotation Calculator
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Build patient quotations using the same model as the Excel pricing
            tool. All inputs are manual and calculations update instantly.
          </p>
          {editingQuote && (
            <Badge variant="secondary" className="w-fit">
              Editing {editingQuote.quoteNumber}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isAnySaving || loadQuoteMutation.isPending}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleUndoChanges}
            disabled={!canUndo || isAnySaving || loadQuoteMutation.isPending}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Undo changes
          </Button>
          {editingQuote && (
            <Button
              variant="outline"
              onClick={handleExitEditMode}
              disabled={isAnySaving || loadQuoteMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Exit edit mode
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handlePrint(lastSavedQuoteId)}
            disabled={!lastSavedQuoteId}
          >
            <Printer className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveAsNew}
            disabled={
              !editingQuote || isAnySaving || loadQuoteMutation.isPending
            }
          >
            {saveAsNewQuoteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Save as new
          </Button>
          <Button
            onClick={handleSave}
            disabled={isAnySaving || loadQuoteMutation.isPending}
          >
            {isPrimarySaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {editingQuote ? "Update quote" : "Save quote"}
          </Button>
        </div>
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Estimated Total
            </CardTitle>
            <CardDescription>
              Final price including profit margin.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-primary">
              {formatCurrency(computed.summary.finalPriceUsd, "USD")}
            </p>
            <Badge variant="secondary" className="mt-1">
              Margin {Math.round(computed.summary.profitMarginRate * 100)}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form className="space-y-6">
          <Tabs defaultValue="calculator" className="space-y-4">
            <TabsList className="flex w-full flex-wrap justify-start">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="indirect">Indirect Costs</TabsTrigger>
              <TabsTrigger value="currency">Currency Rates</TabsTrigger>
              <TabsTrigger value="data">Data Sheets</TabsTrigger>
              <TabsTrigger value="preview">Quote Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Information</CardTitle>
                  <CardDescription>
                    Core quote metadata and patient details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="meta.quoteDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.quoteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.clientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client type</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CLIENT_TYPES.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of origin</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medical Procedure</CardTitle>
                  <CardDescription>
                    Procedure details and base medical costs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="medical.procedureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medical.hospitalTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital tier</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medical.lengthOfStayNights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length of stay (nights)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medical.medicalCostEgp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical cost (EGP)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Medical cost (USD)</FormLabel>
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {formatCurrency(computed.medicalCostUsd, "USD")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accommodation</CardTitle>
                  <CardDescription>
                    Hotel and meal plan details for the stay.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="accommodation.hotelCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hotel category</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accommodation.roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accommodation.mealPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal plan</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accommodation.costPerNightEgp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per night (EGP)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accommodation.mealPlanCostPerDayEgp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal plan cost (EGP/day)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Total accommodation (USD)</FormLabel>
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {formatCurrency(
                        computed.summary.accommodationCostUsd,
                        "USD",
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transportation</CardTitle>
                  <CardDescription>
                    Flight and local transportation costs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="transportation.flightCostUsd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight cost (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.flightOrigin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.flightType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.airportTransfersEgp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Airport transfers (EGP)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.airportVehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.localTransportEgp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local transport (EGP)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportation.localTransportDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days needed</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Tourism & Additional Services</CardTitle>
                    <CardDescription>
                      Extra services billed in EGP and converted to USD.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      tourismServices.append({
                        serviceName: "",
                        quantity: 0,
                        unitCostEgp: 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add service
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="w-[120px]">Qty</TableHead>
                        <TableHead className="w-[160px]">
                          Unit cost (EGP)
                        </TableHead>
                        <TableHead className="w-[160px]">
                          Unit cost (USD)
                        </TableHead>
                        <TableHead className="w-[160px]">Total (EGP)</TableHead>
                        <TableHead className="w-[160px]">Total (USD)</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tourismServices.fields.map((field, index) => {
                        const computedItem = computed.tourismServices[index];
                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Input
                                {...form.register(
                                  `tourismServices.${index}.serviceName`,
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                {...form.register(
                                  `tourismServices.${index}.quantity`,
                                  { valueAsNumber: true },
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                {...form.register(
                                  `tourismServices.${index}.unitCostEgp`,
                                  { valueAsNumber: true },
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(
                                computedItem?.unitCostUsd ?? 0,
                                "USD",
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(
                                computedItem?.totalEgp ?? 0,
                                "EGP",
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(
                                computedItem?.totalUsd ?? 0,
                                "USD",
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => tourismServices.remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-end">
                    <span>Total extras:</span>
                    <span className="text-foreground">
                      {formatCurrency(computed.extrasTotals.totalEgp, "EGP")}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(computed.extrasTotals.totalUsd, "USD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Summary</CardTitle>
                  <CardDescription>
                    Direct costs, indirect allocation, and final pricing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SummaryRow
                    label="Medical procedure"
                    usd={computed.summary.medicalProcedureCostUsd}
                    egp={computed.summary.medicalProcedureCostEgp}
                  />
                  <SummaryRow
                    label="Accommodation"
                    usd={computed.summary.accommodationCostUsd}
                    egp={computed.summary.accommodationCostEgp}
                  />
                  <SummaryRow
                    label="Transportation"
                    usd={computed.summary.transportationCostUsd}
                    egp={computed.summary.transportationCostEgp}
                  />
                  <SummaryRow
                    label="Tourism & extras"
                    usd={computed.summary.tourismCostUsd}
                    egp={computed.summary.tourismCostEgp}
                  />
                  <SummaryRow
                    label="Indirect cost per patient"
                    usd={computed.summary.indirectCostPerPatientUsd}
                  />
                  <Separator />
                  <SummaryRow
                    label="Subtotal"
                    usd={computed.summary.subtotalUsd}
                  />
                  <SummaryRow
                    label={`Profit margin (${Math.round(
                      computed.summary.profitMarginRate * 100,
                    )}%)`}
                    usd={computed.summary.profitAmountUsd}
                  />
                  <Separator />
                  <SummaryRow
                    label="Final price"
                    usd={computed.summary.finalPriceUsd}
                    highlight
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="indirect" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indirect Costs</CardTitle>
                  <CardDescription>
                    Annual overhead allocated per patient.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="indirectCosts.expectedAnnualPatientVolume"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>Annual patient volume</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-[160px]">
                          Annual (USD)
                        </TableHead>
                        <TableHead className="w-[160px]">
                          Monthly (USD)
                        </TableHead>
                        <TableHead className="w-[180px]">
                          Per patient (USD)
                        </TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indirectCosts.fields.map((field, index) => {
                        const computedItem =
                          computed.indirectCosts.items[index];
                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Input
                                {...form.register(
                                  `indirectCosts.items.${index}.category`,
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                {...form.register(
                                  `indirectCosts.items.${index}.annualCostUsd`,
                                  { valueAsNumber: true },
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(
                                computedItem?.monthlyCostUsd ?? 0,
                                "USD",
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCurrency(
                                computedItem?.perPatientUsd ?? 0,
                                "USD",
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                {...form.register(
                                  `indirectCosts.items.${index}.notes`,
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell className="font-medium">Totals</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatCurrency(
                            computed.indirectCosts.totals.annualUsd,
                            "USD",
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatCurrency(
                            computed.indirectCosts.totals.monthlyUsd,
                            "USD",
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatCurrency(
                            computed.indirectCosts.totals.perPatientUsd,
                            "USD",
                          )}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="currency" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Currency Rates</CardTitle>
                    <CardDescription>
                      Enter currency to EGP conversions. Use the EGP row for
                      USD/EGP. Rates to USD are calculated automatically.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => exchangeRatesMutation.mutate()}
                      disabled={exchangeRatesMutation.isPending}
                    >
                      {exchangeRatesMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Fetch Banque Misr rates
                    </Button>
                    {exchangeRatesMeta ? (
                      <span className="text-xs text-muted-foreground">
                        Last updated{" "}
                        {formatDateTime(exchangeRatesMeta.fetchedAt)}
                        {exchangeRatesMeta.asOf
                          ? ` (as of ${exchangeRatesMeta.asOf})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Rates are currently manual.
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Currency</TableHead>
                        <TableHead className="w-[200px]">Rate to EGP</TableHead>
                        <TableHead className="w-[200px]">Rate to USD</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currencyRates.fields.map((field, index) => {
                        const computedRate = computed.currencyRates[index];
                        const currentRate = watchedCurrencyRates[index];
                        const currencyCode =
                          currentRate?.code ?? field.code ?? "";
                        const currencyName =
                          currentRate?.name ?? field.name ?? "—";
                        const displayRate = getRateToEgp(currentRate ?? field);
                        const rateField = form.register(
                          `currencyRates.${index}.usdToCurrency`,
                          { valueAsNumber: true },
                        );
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              {currencyName}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="any"
                                name={rateField.name}
                                ref={rateField.ref}
                                onBlur={rateField.onBlur}
                                value={displayRate > 0 ? displayRate : ""}
                                onChange={(event) =>
                                  handleRateToEgpChange(
                                    index,
                                    currencyCode,
                                    event.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {computedRate?.rateToUsd.toFixed(4) ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Input
                                {...form.register(
                                  `currencyRates.${index}.notes`,
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tip: Rates are displayed as 1 unit of currency in EGP. We
                    convert to USD rates behind the scenes for calculations.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reference Data Sheets</CardTitle>
                  <CardDescription>
                    Maintain the manual data tables from the Excel workbook.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="procedures" className="space-y-4">
                    <TabsList className="flex w-full flex-wrap justify-start">
                      <TabsTrigger value="procedures">
                        Medical Procedures
                      </TabsTrigger>
                      <TabsTrigger value="accommodations">
                        Accommodation
                      </TabsTrigger>
                      <TabsTrigger value="transportation">
                        Transportation
                      </TabsTrigger>
                      <TabsTrigger value="tourism">
                        Tourism & Extras
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="procedures" className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            medicalProcedures.append({
                              ...EMPTY_MEDICAL_PROCEDURE,
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add procedure
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Premium (EGP)</TableHead>
                            <TableHead>Mid-range (EGP)</TableHead>
                            <TableHead>Budget (EGP)</TableHead>
                            <TableHead>Stay (nights)</TableHead>
                            <TableHead>Pre-op</TableHead>
                            <TableHead>Post-op</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medicalProcedures.fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.procedureCode`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.procedureName`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.category`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.premiumHospitalEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.midRangeHospitalEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.budgetHospitalEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.typicalLengthOfStayNights`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.preOpDays`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.postOpDays`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.medicalProcedures.${index}.notes`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete medical procedure"
                                  onClick={() =>
                                    medicalProcedures.remove(index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="accommodations" className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            accommodations.append({ ...EMPTY_ACCOMMODATION })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add accommodation
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Stars</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Room type</TableHead>
                            <TableHead>Price/night (EGP)</TableHead>
                            <TableHead>Meal plan</TableHead>
                            <TableHead>Meal cost (EGP/day)</TableHead>
                            <TableHead>Airport distance (km)</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accommodations.fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.hotelCode`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.hotelName`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.starRating`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.location`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.roomType`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.pricePerNightEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.mealPlan`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.mealPlanCostEgpPerDay`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.airportDistanceKm`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.accommodations.${index}.notes`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete accommodation"
                                  onClick={() => accommodations.remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="transportation" className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            transportationRows.append({
                              ...EMPTY_TRANSPORTATION,
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add transportation
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Cost (EGP)</TableHead>
                            <TableHead>Cost (USD)</TableHead>
                            <TableHead>Cost (EUR)</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transportationRows.fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.serviceType`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.description`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.routeDetails`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.vehicleType`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.transportation.${index}.costEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.transportation.${index}.costUsd`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.transportation.${index}.costEur`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.provider`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.transportation.${index}.notes`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete transportation"
                                  onClick={() =>
                                    transportationRows.remove(index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="tourism" className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            tourismExtras.append({ ...EMPTY_TOURISM_EXTRA })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add tourism extra
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Cost (EGP)</TableHead>
                            <TableHead>Cost (USD)</TableHead>
                            <TableHead>Cost (EUR)</TableHead>
                            <TableHead>Max persons</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tourismExtras.fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.serviceCode`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.serviceName`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.category`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.description`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.duration`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.costEgp`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.costUsd`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.costEur`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.maxPersons`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(
                                    `dataSheets.tourismExtras.${index}.notes`,
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete tourism extra"
                                  onClick={() => tourismExtras.remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Quote Preview
                  </CardTitle>
                  <CardDescription>
                    Summary view mirroring the printable quotation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Patient information
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Quote number:
                        </span>{" "}
                        {watchAll?.meta?.quoteNumber}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Quote date:
                        </span>{" "}
                        {formatDate(watchAll?.meta?.quoteDate)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Patient name:
                        </span>{" "}
                        {watchAll?.meta?.patientName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Country:</span>{" "}
                        {watchAll?.meta?.country}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Age:</span>{" "}
                        {watchAll?.meta?.age || "—"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Procedure details
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Procedure:
                        </span>{" "}
                        {watchAll?.medical?.procedureName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Hospital tier:
                        </span>{" "}
                        {watchAll?.medical?.hospitalTier}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Length of stay:
                        </span>{" "}
                        {safeValue(watchAll?.medical?.lengthOfStayNights) || 0}{" "}
                        nights
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Client type:
                        </span>{" "}
                        {watchAll?.meta?.clientType}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Investment summary
                    </p>
                    <SummaryRow
                      label="Subtotal"
                      usd={computed.summary.subtotalUsd}
                    />
                    <SummaryRow
                      label="Profit margin"
                      usd={computed.summary.profitAmountUsd}
                    />
                    <SummaryRow
                      label="Total package price"
                      usd={computed.summary.finalPriceUsd}
                      highlight
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Saved Quotes</CardTitle>
          <CardDescription>
            Review recently saved quotations, edit them, or download a PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading quotes…
            </div>
          ) : quotesQuery.isError ? (
            <p className="text-sm text-destructive">
              Unable to load saved quotes.
            </p>
          ) : quotesQuery.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesQuery.data.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {quote.quote_number}
                        </span>
                        {editingQuote?.id === quote.id && (
                          <Badge variant="secondary">Editing</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{quote.patient_name}</TableCell>
                    <TableCell>{formatDate(quote.quote_date)}</TableCell>
                    <TableCell>
                      {formatCurrency(safeValue(quote.final_price_usd), "USD")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadQuoteMutation.mutate(quote.id)}
                          disabled={loadQuoteMutation.isPending || isAnySaving}
                        >
                          {loadingQuoteId === quote.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="mr-2 h-4 w-4" />
                          )}
                          {loadingQuoteId === quote.id ? "Loading" : "Edit"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(quote.id)}
                          disabled={loadQuoteMutation.isPending}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No quotes saved yet. Save a quote to view it here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({
  label,
  usd,
  egp,
  highlight = false,
}: {
  label: string;
  usd: number;
  egp?: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className={highlight ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <div className="flex flex-wrap gap-3 text-right">
        {typeof egp === "number" && (
          <span className="text-muted-foreground">
            {formatCurrency(egp, "EGP")}
          </span>
        )}
        <span className={highlight ? "font-semibold text-primary" : ""}>
          {formatCurrency(usd, "USD")}
        </span>
      </div>
    </div>
  );
}
