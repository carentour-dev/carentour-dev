"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useForm,
  useFieldArray,
  type FieldArrayPathByValue,
  type UseFormReturn,
  type FieldError,
  type FieldErrorsImpl,
  type UseFieldArrayReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormDescription,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { Loader2, Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const internationalPriceSchema = z.object({
  country: z.string().min(1),
  flag: z.string().optional(),
  price: z.coerce.number().min(0),
  currency: z.string().min(1),
});

const recoveryStageSchema = z.object({
  stage: z.string().min(1),
  description: z.string().min(1),
});

const procedureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  duration: z.string().optional(),
  recovery: z.string().optional(),
  price: z.string().optional(),
  egyptPrice: z.coerce.number().min(0).optional(),
  successRate: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  internationalPrices: z.array(internationalPriceSchema).default([]),
  candidateRequirements: z.array(z.string().min(1)).default([]),
  recoveryStages: z.array(recoveryStageSchema).default([]),
});

type TreatmentGrade = Database["public"]["Enums"]["treatment_grade"];
const gradeValues = [
  "grade_a",
  "grade_b",
  "grade_c",
] as const satisfies readonly TreatmentGrade[];
const gradeSchema = z.enum(gradeValues);
const gradeLabels: Record<TreatmentGrade, string> = {
  grade_a: "Grade A",
  grade_b: "Grade B",
  grade_c: "Grade C",
};

const treatmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  overview: z.string().optional(),
  ideal_candidates: z.array(z.string().min(1)).default([]),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  recovery_time_days: z.coerce.number().int().min(0).optional(),
  success_rate: z.coerce.number().min(0).max(100).optional(),
  procedures: z.array(procedureSchema).min(1, "Add at least one procedure"),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  grade: gradeSchema.default("grade_c"),
});

type ProcedureFormValues = z.infer<typeof procedureSchema>;
type TreatmentFormValues = z.infer<typeof treatmentSchema>;

type TreatmentPayload = {
  name: string;
  slug: string;
  category?: string;
  summary?: string;
  description?: string;
  overview?: string;
  base_price?: number;
  currency?: string;
  duration_days?: number;
  recovery_time_days?: number;
  success_rate?: number;
  is_featured?: boolean;
  is_active?: boolean;
  grade: TreatmentGrade;
  ideal_candidates: string[];
  procedures: ProcedureFormValues[];
};

type TreatmentRecord = Database["public"]["Tables"]["treatments"]["Row"] & {
  grade: TreatmentGrade;
};

type DoctorAssignment = {
  id: string;
  name: string;
  title: string;
  specialization: string;
  isActive: boolean;
  isAssigned: boolean;
  isPrimary: boolean;
};

const createEmptyProcedure = (): ProcedureFormValues => ({
  id: undefined,
  name: "",
  description: "",
  duration: "",
  recovery: "",
  price: "",
  egyptPrice: undefined,
  successRate: "",
  displayOrder: undefined,
  internationalPrices: [],
  candidateRequirements: [],
  recoveryStages: [],
});

const createDefaultFormValues = (): TreatmentFormValues => ({
  name: "",
  slug: "",
  category: "",
  summary: "",
  description: "",
  overview: "",
  base_price: undefined,
  currency: "USD",
  duration_days: undefined,
  recovery_time_days: undefined,
  success_rate: undefined,
  is_featured: false,
  is_active: true,
  grade: "grade_c",
  ideal_candidates: [],
  procedures: [createEmptyProcedure()],
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const ensurePrimaryId = (
  selectedIds: string[],
  currentPrimary: string | null,
) => {
  if (currentPrimary && selectedIds.includes(currentPrimary)) {
    return currentPrimary;
  }
  return null;
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const sanitizeProcedure = (value: unknown): ProcedureFormValues => {
  if (!isRecord(value)) {
    return createEmptyProcedure();
  }

  const id = typeof value.id === "string" ? value.id : undefined;

  const candidateSource = Array.isArray(value.candidateRequirements)
    ? value.candidateRequirements
    : Array.isArray(value.candidate_requirements)
      ? value.candidate_requirements
      : [];
  const candidateRequirements = candidateSource
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const recoverySource = Array.isArray(value.recoveryStages)
    ? value.recoveryStages
    : Array.isArray(value.recovery_stages)
      ? value.recovery_stages
      : [];
  const recoveryStages = recoverySource
    .filter(isRecord)
    .map((stage) => ({
      stage: typeof stage.stage === "string" ? stage.stage : "",
      description:
        typeof stage.description === "string" ? stage.description : "",
    }))
    .filter(
      (stage) =>
        stage.stage.trim().length > 0 && stage.description.trim().length > 0,
    )
    .map((stage) => ({
      stage: stage.stage.trim(),
      description: stage.description.trim(),
    }));

  const pricesSource = Array.isArray(value.internationalPrices)
    ? value.internationalPrices
    : Array.isArray(value.international_prices)
      ? value.international_prices
      : [];
  const internationalPrices = pricesSource
    .filter(isRecord)
    .map((price) => ({
      country: typeof price.country === "string" ? price.country.trim() : "",
      flag: typeof price.flag === "string" ? price.flag : undefined,
      price: parseNumber(price.price) ?? 0,
      currency: typeof price.currency === "string" ? price.currency.trim() : "",
    }))
    .filter((price) => price.country.length > 0 && price.currency.length > 0);

  const egyptPrice = parseNumber(value.egyptPrice ?? value.egypt_price);
  const displayOrder = parseNumber(value.displayOrder ?? value.display_order);
  const rawSuccess =
    typeof value.successRate === "string"
      ? value.successRate
      : typeof value.success_rate === "string"
        ? value.success_rate
        : "";

  return {
    id,
    name: typeof value.name === "string" ? value.name : "",
    description: typeof value.description === "string" ? value.description : "",
    duration: typeof value.duration === "string" ? value.duration : "",
    recovery: typeof value.recovery === "string" ? value.recovery : "",
    price: typeof value.price === "string" ? value.price : "",
    egyptPrice,
    successRate: rawSuccess.trim(),
    displayOrder: typeof displayOrder === "number" ? displayOrder : undefined,
    internationalPrices,
    candidateRequirements,
    recoveryStages,
  };
};

const mapProceduresFromRecord = (
  procedures: TreatmentRecord["procedures"],
): ProcedureFormValues[] => {
  if (!Array.isArray(procedures)) {
    return [createEmptyProcedure()];
  }

  const sanitized = procedures
    .map((procedure) => sanitizeProcedure(procedure))
    .filter((procedure) => procedure.name);

  return sanitized.length > 0 ? sanitized : [createEmptyProcedure()];
};

const mapRecordToFormValues = (
  treatment: TreatmentRecord,
): TreatmentFormValues => {
  const defaults = createDefaultFormValues();
  return {
    ...defaults,
    name: treatment.name,
    slug: treatment.slug,
    category: treatment.category ?? "",
    summary: treatment.summary ?? "",
    description: treatment.description ?? "",
    overview: treatment.overview ?? "",
    base_price: treatment.base_price ?? undefined,
    currency: treatment.currency ?? "USD",
    duration_days: treatment.duration_days ?? undefined,
    recovery_time_days: treatment.recovery_time_days ?? undefined,
    success_rate: treatment.success_rate ?? undefined,
    is_featured: treatment.is_featured ?? false,
    is_active: treatment.is_active ?? true,
    grade: treatment.grade ?? "grade_c",
    ideal_candidates: Array.isArray(treatment.ideal_candidates)
      ? treatment.ideal_candidates.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    procedures: mapProceduresFromRecord(treatment.procedures),
  };
};

const trimString = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildPayloadFromValues = (
  values: TreatmentFormValues,
): TreatmentPayload => {
  const idealCandidates = values.ideal_candidates
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const procedures = values.procedures.map((procedure) => {
    const candidateRequirements = procedure.candidateRequirements
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    const recoveryStages = procedure.recoveryStages
      .map((stage) => ({
        stage: stage.stage.trim(),
        description: stage.description.trim(),
      }))
      .filter(
        (stage) => stage.stage.length > 0 && stage.description.length > 0,
      );

    const internationalPrices = procedure.internationalPrices
      .map((price) => ({
        country: price.country.trim(),
        flag: trimString(price.flag) ?? undefined,
        price: price.price,
        currency: price.currency.trim(),
      }))
      .filter(
        (price) =>
          price.country.length > 0 &&
          price.currency.length > 0 &&
          typeof price.price === "number" &&
          !Number.isNaN(price.price),
      );

    const cleanedEgyptPrice =
      typeof procedure.egyptPrice === "number" &&
      !Number.isNaN(procedure.egyptPrice)
        ? procedure.egyptPrice
        : undefined;

    const cleanedSuccessRate = trimString(procedure.success_rate);

    return {
      name: procedure.name.trim(),
      description: trimString(procedure.description) ?? undefined,
      duration: trimString(procedure.duration) ?? undefined,
      recovery: trimString(procedure.recovery) ?? undefined,
      price: trimString(procedure.price) ?? undefined,
      egyptPrice: cleanedEgyptPrice,
      successRate: cleanedSuccessRate,
      displayOrder:
        typeof procedure.displayOrder === "number"
          ? procedure.displayOrder
          : undefined,
      internationalPrices,
      candidateRequirements,
      recoveryStages,
      id: procedure.id,
    } satisfies ProcedureFormValues;
  });

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    category: trimString(values.category),
    summary: trimString(values.summary),
    description: trimString(values.description),
    overview: trimString(values.overview),
    base_price: values.base_price ?? undefined,
    currency: trimString(values.currency),
    duration_days: values.duration_days ?? undefined,
    recovery_time_days: values.recovery_time_days ?? undefined,
    success_rate: values.success_rate ?? undefined,
    is_featured: values.is_featured ?? false,
    is_active: values.is_active ?? true,
    grade: values.grade,
    ideal_candidates: idealCandidates,
    procedures,
  };
};

const getArrayErrorMessage = (
  error: FieldError | FieldErrorsImpl<unknown> | undefined,
): string | undefined => {
  if (!error) return undefined;

  if (Array.isArray(error)) return undefined;

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (
    "root" in error &&
    error.root &&
    typeof error.root === "object" &&
    "message" in error.root &&
    typeof (error.root as FieldError).message === "string"
  ) {
    return (error.root as FieldError).message;
  }

  return undefined;
};

const QUERY_KEY = ["admin", "treatments"] as const;

export default function AdminTreatmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] =
    useState<TreatmentRecord | null>(null);
  const [specialistsDialogOpen, setSpecialistsDialogOpen] = useState(false);
  const [specialistsTreatment, setSpecialistsTreatment] =
    useState<TreatmentRecord | null>(null);
  const [specialists, setSpecialists] = useState<DoctorAssignment[]>([]);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [primaryDoctorId, setPrimaryDoctorId] = useState<string | null>(null);
  const [specialistsLoading, setSpecialistsLoading] = useState(false);
  const [savingSpecialists, setSavingSpecialists] = useState(false);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: createDefaultFormValues(),
  });

  const proceduresFieldArray = useFieldArray({
    control: form.control,
    name: "procedures" as const,
  });

  const treatmentsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<TreatmentRecord[]>("/api/admin/treatments"),
  });

  const resetSpecialistsState = useCallback(() => {
    setSpecialists([]);
    setSelectedDoctorIds([]);
    setPrimaryDoctorId(null);
    setSpecialistsTreatment(null);
    setSpecialistsDialogOpen(false);
    setSpecialistsLoading(false);
    setSavingSpecialists(false);
  }, []);

  const loadSpecialists = useCallback(
    async (category: string) => {
      setSpecialistsLoading(true);
      try {
        const result = await adminFetch<{ doctors: DoctorAssignment[] }>(
          `/api/admin/doctor-treatments?category=${encodeURIComponent(category)}`,
        );

        const doctors = result.doctors ?? [];
        setSpecialists(doctors);

        const assignedIds = doctors
          .filter((doctor) => doctor.isAssigned)
          .map((doctor) => doctor.id);
        setSelectedDoctorIds(assignedIds);
        setPrimaryDoctorId(() => {
          const primary = doctors.find((doctor) => doctor.isPrimary);
          return primary ? primary.id : null;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSpecialists([]);
        setSelectedDoctorIds([]);
        setPrimaryDoctorId(null);
        toast({
          title: "Failed to load specialists",
          description: message,
          variant: "destructive",
        });
      } finally {
        setSpecialistsLoading(false);
      }
    },
    [toast],
  );

  const createTreatment = useMutation({
    mutationFn: (payload: TreatmentPayload) =>
      adminFetch<TreatmentRecord>("/api/admin/treatments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_treatment, payload) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Treatment added",
        description: `${payload?.name ?? "Treatment"} has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTreatment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TreatmentPayload }) =>
      adminFetch<TreatmentRecord>(`/api/admin/treatments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (treatment) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Treatment updated",
        description: `${treatment.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTreatment = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/treatments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({
        title: "Treatment removed",
        description: "The treatment has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categories = useMemo(() => {
    if (!treatmentsQuery.data) return [] as string[];
    return Array.from(
      new Set(
        treatmentsQuery.data
          .map((treatment) => treatment.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort();
  }, [treatmentsQuery.data]);

  const filteredTreatments = useMemo(() => {
    if (!treatmentsQuery.data) return [] as TreatmentRecord[];

    return treatmentsQuery.data.filter((treatment) => {
      const matchesSearch = [
        treatment.name,
        treatment.slug,
        treatment.category ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? treatment.is_active !== false
          : treatment.is_active === false);

      const matchesCategory =
        categoryFilter === "all" ||
        (treatment.category ?? "").toLowerCase() ===
          categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [treatmentsQuery.data, search, statusFilter, categoryFilter]);

  const openCreateDialog = () => {
    setEditingTreatment(null);
    form.reset(createDefaultFormValues());
    setDialogOpen(true);
  };

  const openEditDialog = (treatment: TreatmentRecord) => {
    setEditingTreatment(treatment);
    form.reset(mapRecordToFormValues(treatment));
    setDialogOpen(true);
  };

  const openSpecialistsDialog = (treatment: TreatmentRecord) => {
    if (!treatment.category || treatment.category.trim().length === 0) {
      toast({
        title: "Add a category first",
        description: "Assign a treatment category before linking specialists.",
      });
      return;
    }

    setSpecialistsTreatment(treatment);
    setSpecialistsDialogOpen(true);
    void loadSpecialists(treatment.category.trim().toLowerCase());
  };

  const closeSpecialistsDialog = () => {
    resetSpecialistsState();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTreatment(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    } else {
      setDialogOpen(true);
    }
  };

  const onSubmit = (values: TreatmentFormValues) => {
    const payload = buildPayloadFromValues(values);

    if (editingTreatment) {
      updateTreatment.mutate({ id: editingTreatment.id, data: payload });
    } else {
      createTreatment.mutate(payload);
    }
  };

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctorIds((prev) => {
      if (prev.includes(doctorId)) {
        const next = prev.filter((id) => id !== doctorId);
        setPrimaryDoctorId((current) => ensurePrimaryId(next, current));
        return next;
      }
      return [...prev, doctorId];
    });
  };

  const handlePrimarySelect = (doctorId: string) => {
    setPrimaryDoctorId(doctorId);
    if (!selectedDoctorIds.includes(doctorId)) {
      setSelectedDoctorIds((prev) => [...prev, doctorId]);
    }
  };

  const saveSpecialists = async () => {
    if (!specialistsTreatment?.category) {
      toast({
        title: "Missing category",
        description: "Cannot assign specialists without a treatment category.",
        variant: "destructive",
      });
      return;
    }

    setSavingSpecialists(true);
    try {
      const normalizedCategory = specialistsTreatment.category
        .trim()
        .toLowerCase();
      const payload = {
        category: normalizedCategory,
        doctorIds: selectedDoctorIds,
        primaryDoctorId: ensurePrimaryId(selectedDoctorIds, primaryDoctorId),
      };

      await adminFetch(`/api/admin/doctor-treatments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Specialists updated",
        description: `${specialistsTreatment.name} now reflects the latest specialist assignments.`,
      });

      resetSpecialistsState();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to update specialists",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSpecialists(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Treatments
          </h1>
          <p className="text-sm text-muted-foreground">
            Curate medical offerings, pricing, and clinical expectations for
            Care N Tour packages.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4" />
              Add Treatment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTreatment ? "Edit Treatment" : "Add Treatment"}
              </DialogTitle>
              <DialogDescription>
                Maintain consistent treatment information for pricing
                comparisons and concierge planning.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input
                          placeholder="Full Mouth Dental Rejuvenation"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <Input placeholder="dental-rejuvenation" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Input placeholder="Dental" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal grade</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {gradeLabels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Guides internal prioritization. Patients never see this
                        label.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <Textarea
                        rows={3}
                        placeholder="Short overview for listings."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed description</FormLabel>
                      <Textarea
                        rows={4}
                        placeholder="Long-form content for detail pages."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment overview</FormLabel>
                      <Textarea
                        rows={4}
                        placeholder="Narrative overview shown near the top of the detail page."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base price</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Input placeholder="USD" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="success_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Success rate (%)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="duration_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recovery_time_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recovery (days)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <IdealCandidatesFields form={form} />

                <ProceduresSection
                  form={form}
                  fieldArray={proceduresFieldArray}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <FormLabel>Homepage spotlight</FormLabel>
                        <FormDescription>
                          Display this treatment in the Featured Treatments
                          section on the home page.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "active" : "inactive"}
                        onValueChange={(value) =>
                          field.onChange(value === "active")
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createTreatment.isPending || updateTreatment.isPending
                    }
                  >
                    {(createTreatment.isPending ||
                      updateTreatment.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingTreatment ? "Save changes" : "Create treatment"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <span>Treatment catalogue</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search treatments..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-48 lg:w-72"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treatmentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {treatment.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {treatment.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{treatment.category || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {gradeLabels[treatment.grade]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeof treatment.base_price === "number"
                        ? `${treatment.base_price.toLocaleString()} ${treatment.currency ?? "USD"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {treatment.is_featured ? (
                        <Badge variant="secondary">Featured</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {treatment.is_active === false ? "Inactive" : "Active"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSpecialistsDialog(treatment)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(treatment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteTreatment.isPending}
                        onClick={() => deleteTreatment.mutate(treatment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredTreatments.length === 0 &&
                  !treatmentsQuery.isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No treatments found. Adjust filters or create a new
                        treatment.
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SpecialistsDialog
        open={specialistsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSpecialistsDialog();
          } else {
            setSpecialistsDialogOpen(true);
          }
        }}
        treatment={specialistsTreatment}
        doctors={specialists}
        selectedDoctorIds={selectedDoctorIds}
        onToggleDoctor={toggleDoctorSelection}
        primaryDoctorId={primaryDoctorId}
        onPrimaryChange={handlePrimarySelect}
        loading={specialistsLoading}
        saving={savingSpecialists}
        onSave={saveSpecialists}
      />
    </div>
  );
}

function SpecialistsDialog({
  open,
  onOpenChange,
  treatment,
  doctors,
  selectedDoctorIds,
  onToggleDoctor,
  primaryDoctorId,
  onPrimaryChange,
  loading,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: TreatmentRecord | null;
  doctors: DoctorAssignment[];
  selectedDoctorIds: string[];
  onToggleDoctor: (doctorId: string) => void;
  primaryDoctorId: string | null;
  onPrimaryChange: (doctorId: string) => void;
  loading: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Specialists</DialogTitle>
          <DialogDescription>
            {treatment
              ? `Link doctors to “${treatment.name}” so the public page highlights the correct specialists.`
              : "Select a treatment to manage specialists."}
          </DialogDescription>
        </DialogHeader>

        {!treatment ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Select a treatment to manage linked specialists.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="space-y-3 py-6 text-center text-sm text-muted-foreground">
            <p>No doctors available. Add doctors in the Doctors tab first.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-4">
            <RadioGroup
              value={primaryDoctorId ?? ""}
              onValueChange={onPrimaryChange}
              className="space-y-4"
            >
              {doctors.map((doctor) => {
                const assigned = selectedDoctorIds.includes(doctor.id);
                return (
                  <div
                    key={doctor.id}
                    className="rounded-lg border border-border px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={assigned}
                        onCheckedChange={() => onToggleDoctor(doctor.id)}
                        id={`doctor-${doctor.id}`}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`doctor-${doctor.id}`}
                          className="font-medium text-foreground"
                        >
                          {doctor.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {doctor.title} · {doctor.specialization}
                        </div>
                        {doctor.isActive ? null : (
                          <p className="text-xs text-orange-600">
                            Doctor marked inactive.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 pl-7">
                      <RadioGroupItem
                        value={doctor.id}
                        id={`primary-${doctor.id}`}
                        disabled={!assigned}
                      />
                      <Label
                        htmlFor={`primary-${doctor.id}`}
                        className="text-sm text-muted-foreground"
                      >
                        Set as primary specialist
                      </Label>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || saving || !treatment}
            onClick={onSave}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save specialists
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IdealCandidatesFields({
  form,
}: {
  form: UseFormReturn<TreatmentFormValues>;
}) {
  const idealCandidates = form.watch("ideal_candidates") ?? [];

  const addCandidate = () => {
    form.setValue("ideal_candidates", [...idealCandidates, ""], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const removeCandidate = (index: number) => {
    const updated = idealCandidates.filter((_, idx) => idx !== index);
    form.setValue("ideal_candidates", updated, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/60 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-foreground">
          Ideal candidates
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCandidate}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add candidate
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Bullet points shown in the “Ideal Candidates” section on the customer
        detail page.
      </p>
      <div className="space-y-3">
        {idealCandidates.map((_, index) => (
          <FormField
            key={`ideal_candidate_${index}`}
            control={form.control}
            name={`ideal_candidates.${index}`}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Input
                      placeholder="Patients with coronary artery disease"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCandidate(index)}
                    aria-label="Remove candidate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        {idealCandidates.length === 0 && (
          <div className="rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
            No candidate bullets yet.
          </div>
        )}
      </div>
    </div>
  );
}

function ProceduresSection({
  form,
  fieldArray,
}: {
  form: UseFormReturn<TreatmentFormValues>;
  fieldArray: UseFieldArrayReturn<TreatmentFormValues>;
}) {
  const addProcedure = () => {
    fieldArray.append(createEmptyProcedure());
  };

  const proceduresError = getArrayErrorMessage(
    form.formState.errors.procedures,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-foreground">
          Procedure details
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addProcedure}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add procedure
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure the detailed steps, savings, and recovery timeline used by the
        public site.
      </p>
      <div className="space-y-4">
        {fieldArray.fields.map((field, index) => (
          <ProcedureFields
            key={field.id}
            form={form}
            index={index}
            canRemove={fieldArray.fields.length > 1}
            onRemove={() => fieldArray.remove(index)}
          />
        ))}
      </div>
      {proceduresError && (
        <p className="text-sm text-destructive">{proceduresError}</p>
      )}
    </div>
  );
}

function ProcedureFields({
  form,
  index,
  canRemove,
  onRemove,
}: {
  form: UseFormReturn<TreatmentFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const internationalPrices = useFieldArray<
    TreatmentFormValues,
    FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["internationalPrices"]
    >
  >({
    control: form.control,
    name: `procedures.${index}.internationalPrices` as FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["internationalPrices"]
    >,
  });

  const candidateRequirements = useFieldArray<
    TreatmentFormValues,
    FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["candidateRequirements"]
    >
  >({
    control: form.control,
    name: `procedures.${index}.candidateRequirements` as FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["candidateRequirements"]
    >,
  });

  const recoveryStages = useFieldArray<
    TreatmentFormValues,
    FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["recoveryStages"]
    >
  >({
    control: form.control,
    name: `procedures.${index}.recoveryStages` as FieldArrayPathByValue<
      TreatmentFormValues,
      ProcedureFormValues["recoveryStages"]
    >,
  });

  return (
    <div className="space-y-5 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Procedure {index + 1}
          </h4>
          <p className="text-xs text-muted-foreground">
            Displayed as an expandable card on the treatment page.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
        >
          Remove procedure
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`procedures.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input placeholder="Coronary Artery Bypass" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`procedures.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price label</FormLabel>
              <Input placeholder="$12,500 - $18,000" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`procedures.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <Textarea
              rows={3}
              placeholder="High-level explanation of the procedure."
              {...field}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name={`procedures.${index}.duration`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration label</FormLabel>
              <Input placeholder="4-6 hours" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`procedures.${index}.recovery`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recovery label</FormLabel>
              <Input placeholder="6-8 weeks" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`procedures.${index}.success_rate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Success rate label</FormLabel>
              <Input placeholder="95%" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`procedures.${index}.egyptPrice`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Egypt price (USD)</FormLabel>
            <Input
              type="number"
              min={0}
              step="0.01"
              {...field}
              onChange={(event) => {
                const value = event.target.value;
                field.onChange(value === "" ? undefined : Number(value));
              }}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">
            Candidate requirements
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => candidateRequirements.append("")}
          >
            Add requirement
          </Button>
        </div>
        <div className="space-y-3">
          {candidateRequirements.fields.map((fieldItem, reqIndex) => (
            <FormField
              key={fieldItem.id}
              control={form.control}
              name={`procedures.${index}.candidateRequirements.${reqIndex}`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Input placeholder="Adequate bone density" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => candidateRequirements.remove(reqIndex)}
                      aria-label="Remove requirement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {candidateRequirements.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No specific requirements listed.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">
            International price benchmarks
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              internationalPrices.append({
                country: "",
                flag: "",
                price: 0,
                currency: "",
              })
            }
          >
            Add market price
          </Button>
        </div>
        <div className="space-y-3">
          {internationalPrices.fields.map((fieldItem, priceIndex) => (
            <div
              key={fieldItem.id}
              className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:items-end"
            >
              <FormField
                control={form.control}
                name={`procedures.${index}.internationalPrices.${priceIndex}.country`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Input placeholder="United States" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`procedures.${index}.internationalPrices.${priceIndex}.flag`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag (emoji)</FormLabel>
                    <Input placeholder="🇺🇸" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`procedures.${index}.internationalPrices.${priceIndex}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`procedures.${index}.internationalPrices.${priceIndex}.currency`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Input placeholder="$" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => internationalPrices.remove(priceIndex)}
                  aria-label="Remove international price"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {internationalPrices.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add benchmarks to power the savings comparison widget.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">
            Recovery timeline
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              recoveryStages.append({ stage: "", description: "" })
            }
          >
            Add recovery stage
          </Button>
        </div>
        <div className="space-y-3">
          {recoveryStages.fields.map((fieldItem, stageIndex) => (
            <div
              key={fieldItem.id}
              className="space-y-3 rounded-md border border-border/70 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Stage {stageIndex + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => recoveryStages.remove(stageIndex)}
                  aria-label="Remove recovery stage"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`procedures.${index}.recoveryStages.${stageIndex}.stage`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage label</FormLabel>
                    <Input placeholder="Days 1-3" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`procedures.${index}.recoveryStages.${stageIndex}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      rows={2}
                      placeholder="ICU monitoring, pain management"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          {recoveryStages.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No recovery milestones added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
