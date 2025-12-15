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
  FormDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import type { Database } from "@/integrations/supabase/types";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const serviceProviderTypes = [
  "hospital",
  "clinic",
  "surgery_center",
  "rehab_center",
] as const;

const serviceProviderSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  facility_type: z.enum(serviceProviderTypes),
  description: z.string().optional(),
  overview: z.string().optional(),
  country_code: z.string().min(2, "Country is required").optional(),
  city: z.string().min(2, "City is required").optional(),
  address_line1: z.string().optional(),
  address_city: z.string().optional(),
  address_country: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  website: z.string().url().optional(),
  amenities_input: z.string().optional(),
  specialties_input: z.string().optional(),
  facilities_input: z.string().optional(),
  bed_count: z.coerce.number().int().min(0).optional(),
  icu_beds: z.coerce.number().int().min(0).optional(),
  operating_rooms: z.coerce.number().int().min(0).optional(),
  imaging_input: z.string().optional(),
  accreditations_input: z.string().optional(),
  emergency_support: z.boolean().optional(),
  procedure_ids: z.array(z.string().uuid()).optional(),
  gallery_urls: z.array(z.string().optional()).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
  is_partner: z.boolean().optional(),
  hero_image: z.string().url().nullable().optional(),
  logo_image: z.string().url().nullable().optional(),
});

type ServiceProviderFormValues = z.infer<typeof serviceProviderSchema>;

type ServiceProviderPayload = {
  name: string;
  slug: string;
  facility_type: string;
  country_code?: string | null;
  city?: string | null;
  description?: string | null;
  overview?: string | null;
  address?: Record<string, unknown> | null;
  contact_info?: Record<string, unknown> | null;
  amenities?: string[];
  specialties?: string[];
  facilities?: string[];
  infrastructure?: Record<string, unknown> | null;
  logo_url?: string | null;
  gallery_urls?: string[];
  procedure_ids?: string[];
  images?: Record<string, unknown> | null;
  is_partner?: boolean;
  rating?: number | null;
  review_count?: number | null;
};

type ServiceProviderRecord = ServiceProviderPayload & {
  id: string;
  rating?: number | null;
  review_count?: number | null;
  amenities?: string[] | null;
  specialties?: string[] | null;
  facilities?: string[] | null;
  infrastructure?: Record<string, unknown> | null;
  logo_url?: string | null;
  gallery_urls?: string[] | null;
  procedure_ids?: string[] | null;
  images?: Record<string, unknown> | null;
  overview?: string | null;
  country_code?: string | null;
  city?: string | null;
};

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentProcedureRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];

type TreatmentWithProcedures = TreatmentRow & {
  procedures?: TreatmentProcedureRow[];
};

const QUERY_KEY = ["admin", "service-providers"] as const;

function csvToArray(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminServiceProvidersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServiceProvider, setEditingServiceProvider] =
    useState<ServiceProviderRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<ServiceProviderFormValues>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      name: "",
      slug: "",
      facility_type: "hospital",
      description: "",
      overview: "",
      country_code: "",
      city: "",
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      specialties_input: "",
      facilities_input: "",
      bed_count: undefined,
      icu_beds: undefined,
      operating_rooms: undefined,
      imaging_input: "",
      accreditations_input: "",
      emergency_support: false,
      procedure_ids: [],
      gallery_urls: [],
      rating: undefined,
      review_count: undefined,
      is_partner: true,
      hero_image: null,
      logo_image: null,
    },
  });

  const serviceProvidersQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      adminFetch<ServiceProviderRecord[]>("/api/admin/service-providers"),
  });

  const treatmentsQuery = useQuery({
    queryKey: ["admin", "treatments"],
    queryFn: () =>
      adminFetch<TreatmentWithProcedures[]>("/api/admin/treatments"),
  });

  const procedureOptions = useMemo(() => {
    if (!treatmentsQuery.data) return [];

    return treatmentsQuery.data.flatMap((treatment) =>
      (treatment.procedures ?? []).map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        treatmentName: treatment.name,
      })),
    );
  }, [treatmentsQuery.data]);

  const createServiceProvider = useMutation({
    mutationFn: (payload: ServiceProviderPayload) =>
      adminFetch<ServiceProviderRecord>("/api/admin/service-providers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_serviceProvider, payload) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Service provider added",
        description: `${payload?.name ?? "Service provider"} has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateServiceProvider = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceProviderPayload }) =>
      adminFetch<ServiceProviderRecord>(`/api/admin/service-providers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (serviceProvider) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Service provider updated",
        description: `${serviceProvider.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteServiceProvider = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/service-providers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({
        title: "Service provider removed",
        description: "The service provider has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredServiceProviders = useMemo(() => {
    if (!serviceProvidersQuery.data) return [] as ServiceProviderRecord[];

    return serviceProvidersQuery.data.filter((provider) => {
      const matchesSearch = [
        provider.name,
        provider.slug,
        provider.facility_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" || provider.facility_type === typeFilter;

      const matchesPartner =
        partnerFilter === "all" ||
        (partnerFilter === "partner"
          ? provider.is_partner !== false
          : provider.is_partner === false);

      return matchesSearch && matchesType && matchesPartner;
    });
  }, [serviceProvidersQuery.data, search, typeFilter, partnerFilter]);

  const openCreateDialog = () => {
    setEditingServiceProvider(null);
    form.reset({
      name: "",
      slug: "",
      facility_type: "hospital",
      description: "",
      overview: "",
      country_code: "",
      city: "",
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      specialties_input: "",
      facilities_input: "",
      bed_count: undefined,
      icu_beds: undefined,
      operating_rooms: undefined,
      imaging_input: "",
      accreditations_input: "",
      emergency_support: false,
      procedure_ids: [],
      gallery_urls: [],
      rating: undefined,
      review_count: undefined,
      is_partner: true,
      hero_image: null,
      logo_image: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (provider: ServiceProviderRecord) => {
    setEditingServiceProvider(provider);
    const address = (provider.address ?? {}) as Record<string, unknown>;
    const contact = (provider.contact_info ?? {}) as Record<string, unknown>;
    const infrastructure = (provider.infrastructure ?? {}) as Record<
      string,
      unknown
    >;

    const safeType = serviceProviderTypes.includes(
      provider.facility_type as (typeof serviceProviderTypes)[number],
    )
      ? (provider.facility_type as (typeof serviceProviderTypes)[number])
      : "hospital";

    form.reset({
      name: provider.name,
      slug: provider.slug,
      facility_type: safeType,
      description: (provider.description as string) ?? "",
      overview: (provider.overview as string) ?? "",
      country_code:
        (provider.country_code as string) ??
        (address["country"] as string) ??
        "",
      city: (provider.city as string) ?? (address["city"] as string) ?? "",
      address_line1: (address["street"] as string) ?? "",
      address_city: (address["city"] as string) ?? "",
      address_country: (address["country"] as string) ?? "",
      contact_phone: (contact["phone"] as string) ?? "",
      contact_email: (contact["email"] as string) ?? "",
      website: (contact["website"] as string) ?? "",
      amenities_input: (provider.amenities ?? []).join(", "),
      specialties_input: (provider.specialties ?? []).join(", "),
      facilities_input: (provider.facilities ?? []).join(", "),
      bed_count:
        typeof infrastructure["bed_count"] === "number"
          ? (infrastructure["bed_count"] as number)
          : undefined,
      icu_beds:
        typeof infrastructure["icu_beds"] === "number"
          ? (infrastructure["icu_beds"] as number)
          : undefined,
      operating_rooms:
        typeof infrastructure["operating_rooms"] === "number"
          ? (infrastructure["operating_rooms"] as number)
          : undefined,
      imaging_input: Array.isArray(infrastructure["imaging"])
        ? (infrastructure["imaging"] as string[]).join(", ")
        : "",
      accreditations_input: Array.isArray(infrastructure["accreditations"])
        ? (infrastructure["accreditations"] as string[]).join(", ")
        : "",
      emergency_support:
        typeof infrastructure["emergency_support"] === "boolean"
          ? (infrastructure["emergency_support"] as boolean)
          : false,
      procedure_ids: provider.procedure_ids ?? [],
      gallery_urls: provider.gallery_urls ?? [],
      rating: provider.rating ?? undefined,
      review_count: provider.review_count ?? undefined,
      is_partner: provider.is_partner ?? true,
      hero_image:
        provider.images && typeof provider.images === "object"
          ? (((provider.images as Record<string, unknown>)["hero"] as
              | string
              | undefined) ?? null)
          : null,
      logo_image: provider.logo_url ?? null,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingServiceProvider(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    } else {
      setDialogOpen(true);
    }
  };

  const onSubmit = (values: ServiceProviderFormValues) => {
    const infrastructure =
      values.bed_count !== undefined ||
      values.icu_beds !== undefined ||
      values.operating_rooms !== undefined ||
      values.imaging_input ||
      values.accreditations_input ||
      values.emergency_support
        ? {
            bed_count: values.bed_count ?? null,
            icu_beds: values.icu_beds ?? null,
            operating_rooms: values.operating_rooms ?? null,
            imaging: csvToArray(values.imaging_input),
            accreditations: csvToArray(values.accreditations_input),
            emergency_support: values.emergency_support ?? null,
          }
        : null;

    const galleryUrls = (values.gallery_urls ?? [])
      .map((url) => (url ?? "").trim())
      .filter((url) => url.length > 0);

    const payload: ServiceProviderPayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      facility_type: values.facility_type,
      country_code: values.country_code?.trim() || null,
      city: values.city?.trim() || null,
      description: values.description?.trim() || null,
      overview: values.overview?.trim() || null,
      address:
        values.address_line1 || values.address_city || values.address_country
          ? {
              street: values.address_line1?.trim() || null,
              city: values.address_city?.trim() || null,
              country: values.address_country?.trim() || null,
            }
          : null,
      contact_info:
        values.contact_phone || values.contact_email || values.website
          ? {
              phone: values.contact_phone?.trim() || null,
              email: values.contact_email?.trim() || null,
              website: values.website?.trim() || null,
            }
          : null,
      amenities: csvToArray(values.amenities_input),
      specialties: csvToArray(values.specialties_input),
      facilities: csvToArray(values.facilities_input),
      infrastructure,
      logo_url: values.logo_image ?? null,
      gallery_urls: galleryUrls,
      procedure_ids:
        values.procedure_ids?.map((id) => id.trim()).filter(Boolean) ?? [],
      is_partner: values.is_partner ?? true,
      rating: values.rating ?? null,
      review_count: values.review_count ?? null,
      images: values.hero_image ? { hero: values.hero_image } : null,
    };

    if (editingServiceProvider) {
      updateServiceProvider.mutate({
        id: editingServiceProvider.id,
        data: payload,
      });
    } else {
      createServiceProvider.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Service Providers
          </h1>
          <p className="text-sm text-muted-foreground">
            Catalogue partner service providers with accreditation, amenities,
            and concierge contacts.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4" />
              Add Service Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingServiceProvider
                  ? "Edit Service Provider"
                  : "Add Service Provider"}
              </DialogTitle>
              <DialogDescription>
                Store partner service provider metadata so coordinators can
                match patients with the right location.
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
                        <Input placeholder="Cairo Heart Institute" {...field} />
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
                        <Input placeholder="cairo-heart-institute" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="facility_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service provider type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceProviderTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => {
                      const { name, onBlur, ref, value, onChange } = field;

                      return (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            max={5}
                            step="0.1"
                            name={name}
                            ref={ref}
                            value={value ?? ""}
                            onBlur={onBlur}
                            onChange={(event) =>
                              onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="review_count"
                    render={({ field }) => {
                      const { name, onBlur, ref, value, onChange } = field;

                      return (
                        <FormItem>
                          <FormLabel>Review count</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            name={name}
                            ref={ref}
                            value={value ?? ""}
                            onBlur={onBlur}
                            onChange={(event) =>
                              onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormDescription>
                          Used for filtering and provider listings.
                        </FormDescription>
                        <Input placeholder="Egypt" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Input placeholder="Cairo" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        rows={3}
                        placeholder="Highlight specialties, certifications, and recovery suites."
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
                      <FormLabel>Overview</FormLabel>
                      <Textarea
                        rows={3}
                        placeholder="Short summary for the provider profile page."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street / district</FormLabel>
                        <Input placeholder="Medical District" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Input placeholder="Cairo" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Input placeholder="Egypt" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <Input placeholder="+20 100 7654321" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <Input
                          placeholder="coordinator@provider.com"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <Input placeholder="https://provider.com" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="amenities_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <FormDescription>
                          Comma separated list (e.g. 24/7 ICU, Concierge desk).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialties_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialties</FormLabel>
                        <FormDescription>
                          Comma separated (e.g. Cardiology, Orthopedics).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facilities_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facilities provided</FormLabel>
                        <FormDescription>
                          Comma separated (e.g. Cath lab, Recovery suites).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border border-border/60 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <FormLabel className="text-base">
                        Infrastructure
                      </FormLabel>
                      <FormDescription>
                        Capture capacity and clinical capabilities shown on the
                        provider profile.
                      </FormDescription>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="bed_count"
                      render={({ field }) => {
                        const { name, onBlur, ref, value, onChange } = field;
                        return (
                          <FormItem>
                            <FormLabel>Total beds</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              name={name}
                              ref={ref}
                              value={value ?? ""}
                              onBlur={onBlur}
                              onChange={(event) =>
                                onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="icu_beds"
                      render={({ field }) => {
                        const { name, onBlur, ref, value, onChange } = field;
                        return (
                          <FormItem>
                            <FormLabel>ICU beds</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              name={name}
                              ref={ref}
                              value={value ?? ""}
                              onBlur={onBlur}
                              onChange={(event) =>
                                onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="operating_rooms"
                      render={({ field }) => {
                        const { name, onBlur, ref, value, onChange } = field;
                        return (
                          <FormItem>
                            <FormLabel>Operating rooms</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              name={name}
                              ref={ref}
                              value={value ?? ""}
                              onBlur={onBlur}
                              onChange={(event) =>
                                onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="imaging_input"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imaging</FormLabel>
                          <FormDescription>
                            Comma separated (e.g. MRI, CT, Cath lab imaging).
                          </FormDescription>
                          <Input {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accreditations_input"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accreditations</FormLabel>
                          <FormDescription>
                            Comma separated (e.g. JCI, TEMOS).
                          </FormDescription>
                          <Input {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="emergency_support"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Emergency support</FormLabel>
                          <FormDescription>
                            Toggle if the provider offers 24/7 emergency cover.
                          </FormDescription>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="procedure_ids"
                  render={({ field }) => {
                    const selected = new Set(field.value ?? []);
                    return (
                      <FormItem>
                        <FormLabel>Procedures offered</FormLabel>
                        <FormDescription>
                          Select procedures for filtering on the public
                          providers page.
                        </FormDescription>
                        <div className="rounded-md border border-border/60">
                          {treatmentsQuery.isLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">
                              Loading procedures...
                            </div>
                          ) : procedureOptions.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                              No procedures available. Add procedures to
                              treatments first.
                            </div>
                          ) : (
                            <div className="max-h-64 space-y-2 overflow-auto p-3">
                              {procedureOptions.map((option) => (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 px-3 py-2 hover:bg-muted/60"
                                >
                                  <Checkbox
                                    checked={selected.has(option.id)}
                                    onCheckedChange={(checked) => {
                                      const next = new Set(field.value ?? []);
                                      if (checked) {
                                        next.add(option.id);
                                      } else {
                                        next.delete(option.id);
                                      }
                                      field.onChange(Array.from(next));
                                    }}
                                  />
                                  <div className="space-y-0.5">
                                    <p className="text-sm font-medium text-foreground">
                                      {option.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {option.treatmentName}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hero_image"
                    render={({ field }) => (
                      <FormItem>
                        <ImageUploader
                          label="Hero image"
                          description="Primary service provider photo for listings."
                          value={field.value ?? ""}
                          onChange={(url) => field.onChange(url ?? null)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logo_image"
                    render={({ field }) => (
                      <FormItem>
                        <ImageUploader
                          label="Logo"
                          description="Optional logo for cards and profiles."
                          value={field.value ?? ""}
                          onChange={(url) => field.onChange(url ?? null)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gallery_urls"
                  render={({ field }) => {
                    const images = field.value ?? [];

                    const updateImage = (index: number, url: string | null) => {
                      const next = [...images];
                      next[index] = url ?? "";
                      field.onChange(next);
                    };

                    const removeImage = (index: number) => {
                      const next = [...images];
                      next.splice(index, 1);
                      field.onChange(next);
                    };

                    const addImage = () => {
                      field.onChange([...(images ?? []), ""]);
                    };

                    return (
                      <FormItem>
                        <ImageUploader
                          label="Gallery images"
                          description="Upload facility photos to showcase the provider."
                          value={images[0] ?? ""}
                          onChange={(url) => {
                            if (images.length === 0) {
                              field.onChange(url ? [url] : []);
                              return;
                            }
                            updateImage(0, url ?? null);
                          }}
                        />
                        {images.length > 1 ? (
                          <div className="mt-3 space-y-3">
                            {images.slice(1).map((image, index) => (
                              <div
                                key={index + 1}
                                className="rounded-lg border border-border/60 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">
                                    Gallery image {index + 2}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeImage(index + 1)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="mt-2">
                                  <ImageUploader
                                    label=""
                                    description=""
                                    value={image ?? ""}
                                    onChange={(url) =>
                                      updateImage(index + 1, url ?? null)
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addImage}
                            disabled={(images ?? []).length >= 6}
                          >
                            Add gallery image
                          </Button>
                          {images.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => field.onChange([images[0]])}
                            >
                              Keep hero + first gallery
                            </Button>
                          ) : null}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="is_partner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "partner" : "hidden"}
                        onValueChange={(value) =>
                          field.onChange(value === "partner")
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
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
                      createServiceProvider.isPending ||
                      updateServiceProvider.isPending
                    }
                  >
                    {(createServiceProvider.isPending ||
                      updateServiceProvider.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingServiceProvider
                      ? "Save changes"
                      : "Create service provider"}
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
            <span>Partner service providers</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search service providers..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-48 lg:w-72"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {serviceProviderTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Partner status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceProvidersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {provider.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {provider.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {provider.facility_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const address = (provider.address ?? {}) as Record<
                          string,
                          unknown
                        >;
                        const location = [
                          provider.city ??
                            (address["city"] as string) ??
                            undefined,
                          provider.country_code ??
                            (address["country"] as string) ??
                            undefined,
                        ]
                          .filter(Boolean)
                          .join(", ");
                        return location.length > 0 ? location : "—";
                      })()}
                    </TableCell>
                    <TableCell>
                      {typeof provider.rating === "number"
                        ? `${provider.rating.toFixed(1)}/5`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          provider.is_partner === false ? "outline" : "default"
                        }
                      >
                        {provider.is_partner === false ? "Hidden" : "Partner"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(provider)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteServiceProvider.isPending}
                        onClick={() =>
                          deleteServiceProvider.mutate(provider.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredServiceProviders.length === 0 &&
                  !serviceProvidersQuery.isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No service providers found. Adjust filters or add a new
                        partner service provider.
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
