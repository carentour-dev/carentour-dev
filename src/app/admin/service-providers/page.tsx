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
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
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
  address_line1: z.string().optional(),
  address_city: z.string().optional(),
  address_country: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  website: z.string().url().optional(),
  amenities_input: z.string().optional(),
  specialties_input: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
  is_partner: z.boolean().optional(),
  hero_image: z.string().url().nullable().optional(),
});

type ServiceProviderFormValues = z.infer<typeof serviceProviderSchema>;

type ServiceProviderPayload = {
  name: string;
  slug: string;
  facility_type: string;
  description?: string | null;
  address?: Record<string, unknown> | null;
  contact_info?: Record<string, unknown> | null;
  amenities?: string[];
  specialties?: string[];
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
  images?: Record<string, unknown> | null;
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
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      specialties_input: "",
      rating: undefined,
      review_count: undefined,
      is_partner: true,
      hero_image: null,
    },
  });

  const serviceProvidersQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      adminFetch<ServiceProviderRecord[]>("/api/admin/service-providers"),
  });

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
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      specialties_input: "",
      rating: undefined,
      review_count: undefined,
      is_partner: true,
      hero_image: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (provider: ServiceProviderRecord) => {
    setEditingServiceProvider(provider);
    const address = (provider.address ?? {}) as Record<string, unknown>;
    const contact = (provider.contact_info ?? {}) as Record<string, unknown>;

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
      address_line1: (address["street"] as string) ?? "",
      address_city: (address["city"] as string) ?? "",
      address_country: (address["country"] as string) ?? "",
      contact_phone: (contact["phone"] as string) ?? "",
      contact_email: (contact["email"] as string) ?? "",
      website: (contact["website"] as string) ?? "",
      amenities_input: (provider.amenities ?? []).join(", "),
      specialties_input: (provider.specialties ?? []).join(", "),
      rating: provider.rating ?? undefined,
      review_count: provider.review_count ?? undefined,
      is_partner: provider.is_partner ?? true,
      hero_image:
        provider.images && typeof provider.images === "object"
          ? (((provider.images as Record<string, unknown>)["hero"] as
              | string
              | undefined) ?? null)
          : null,
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
    const payload: ServiceProviderPayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      facility_type: values.facility_type,
      description: values.description?.trim() || null,
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

                <div className="grid gap-4 md:grid-cols-2">
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

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

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
                        colSpan={5}
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
