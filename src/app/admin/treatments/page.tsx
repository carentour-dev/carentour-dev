"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const treatmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  duration_days: z.coerce.number().int().min(0).optional(),
  recovery_time_days: z.coerce.number().int().min(0).optional(),
  success_rate: z.coerce.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

type TreatmentPayload = TreatmentFormValues;

type TreatmentRecord = TreatmentPayload & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

const QUERY_KEY = ["admin", "treatments"] as const;

export default function AdminTreatmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      summary: "",
      description: "",
      base_price: undefined,
      currency: "USD",
      duration_days: undefined,
      recovery_time_days: undefined,
      success_rate: undefined,
      is_active: true,
    },
  });

  const treatmentsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<TreatmentRecord[]>("/api/admin/treatments"),
  });

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
      const matchesSearch =
        [treatment.name, treatment.slug, treatment.category ?? ""]
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
        (treatment.category ?? "").toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [treatmentsQuery.data, search, statusFilter, categoryFilter]);

  const openCreateDialog = () => {
    setEditingTreatment(null);
    form.reset({
      name: "",
      slug: "",
      category: "",
      summary: "",
      description: "",
      base_price: undefined,
      currency: "USD",
      duration_days: undefined,
      recovery_time_days: undefined,
      success_rate: undefined,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (treatment: TreatmentRecord) => {
    setEditingTreatment(treatment);
    form.reset({
      name: treatment.name,
      slug: treatment.slug,
      category: treatment.category ?? "",
      summary: treatment.summary ?? "",
      description: treatment.description ?? "",
      base_price: treatment.base_price ?? undefined,
      currency: treatment.currency ?? "",
      duration_days: treatment.duration_days ?? undefined,
      recovery_time_days: treatment.recovery_time_days ?? undefined,
      success_rate: treatment.success_rate ?? undefined,
      is_active: treatment.is_active ?? true,
    });
    setDialogOpen(true);
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
    const payload: TreatmentPayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      category: values.category?.trim() || undefined,
      summary: values.summary?.trim() || undefined,
      description: values.description?.trim() || undefined,
      base_price: values.base_price ?? undefined,
      currency: values.currency?.trim() || undefined,
      duration_days: values.duration_days ?? undefined,
      recovery_time_days: values.recovery_time_days ?? undefined,
      success_rate: values.success_rate ?? undefined,
      is_active: values.is_active ?? true,
    };

    if (editingTreatment) {
      updateTreatment.mutate({ id: editingTreatment.id, data: payload });
    } else {
      createTreatment.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Treatments</h1>
          <p className="text-sm text-muted-foreground">
            Curate medical offerings, pricing, and clinical expectations for Care N Tour packages.
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
              <DialogTitle>{editingTreatment ? "Edit Treatment" : "Add Treatment"}</DialogTitle>
              <DialogDescription>
                Maintain consistent treatment information for pricing comparisons and concierge planning.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input placeholder="Full Mouth Dental Rejuvenation" {...field} />
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
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <Textarea rows={3} placeholder="Short overview for listings." {...field} />
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
                      <Textarea rows={4} placeholder="Long-form content for detail pages." {...field} />
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
                          onChange={(event) => field.onChange(Number(event.target.value))}
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
                          onChange={(event) => field.onChange(Number(event.target.value))}
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
                          onChange={(event) => field.onChange(Number(event.target.value))}
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
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "active" : "inactive"}
                        onValueChange={(value) => field.onChange(value === "active")}
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
                  <Button type="submit" disabled={createTreatment.isPending || updateTreatment.isPending}>
                    {(createTreatment.isPending || updateTreatment.isPending) && (
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
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{treatment.name}</span>
                        <span className="text-xs text-muted-foreground">{treatment.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>{treatment.category || "—"}</TableCell>
                    <TableCell>
                      {typeof treatment.base_price === "number"
                        ? `${treatment.base_price.toLocaleString()} ${treatment.currency ?? "USD"}`
                        : "—"}
                    </TableCell>
                    <TableCell>{treatment.is_active === false ? "Inactive" : "Active"}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(treatment)}>
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

                {filteredTreatments.length === 0 && !treatmentsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No treatments found. Adjust filters or create a new treatment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
